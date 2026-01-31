"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type ConnectStatus =
  | {
      hasAccount: false;
      active: false;
      mode?: "test" | "live";
      message?: string;
    }
  | {
      hasAccount: true;
      stripeAccountId: string;
      chargesEnabled: boolean;
      payoutsEnabled: boolean;
      active: boolean;
      mode?: "test" | "live";
      message?: string;
    };

function statusLabel(st: ConnectStatus | null) {
  if (!st) return "Chargement du statut…";
  if (!st.hasAccount) return "Paiements non activés";
  if (st.active) return "✅ Paiements activés";
  return "⏳ Activation en cours";
}

function statusHelp(st: ConnectStatus | null) {
  if (!st) return "On vérifie l’état de votre compte Stripe…";
  if (!st.hasAccount) {
    return "Activez Stripe Connect pour pouvoir recevoir des paiements automatiquement.";
  }
  if (st.active) {
    return "Votre compte est prêt : les paiements peuvent être encaissés et reversés au loueur.";
  }
  return "Stripe a encore besoin de vérifier certaines informations (ou l’onboarding n’est pas fini).";
}

export default function PaymentsPage() {
  const search = useSearchParams();
  const success = search.get("success");
  const refresh = search.get("refresh");

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isActive = useMemo(() => !!status && status.hasAccount && status.active, [status]);

  async function fetchStatus() {
    setErrorMsg(null);

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Non connecté");

      const res = await fetch("/api/stripe/connect/status", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const raw = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(raw);
      } catch {
        throw new Error("Réponse invalide (pas du JSON). Regarde les logs serveur.");
      }

      if (!res.ok) throw new Error(json?.error ?? "Erreur statut Stripe");

      setStatus(json as ConnectStatus);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Erreur");
      setStatus(null);
    }
  }

  async function startStripeOnboarding() {
    try {
      setLoading(true);
      setErrorMsg(null);

      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Non connecté");

      const res = await fetch("/api/stripe/connect/onboard", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const raw = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(raw);
      } catch {
        throw new Error("Réponse invalide du serveur (pas du JSON). Regarde les logs Vercel.");
      }

      if (!res.ok) throw new Error(json?.error ?? "Erreur Stripe");

      const url = String(json?.url || "");
      if (!url) throw new Error("URL Stripe manquante.");

      window.location.href = url;
    } catch (e: any) {
      alert(e?.message || "Erreur");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let alive = true;

    async function init() {
      setChecking(true);
      await fetchStatus();
      if (!alive) return;
      setChecking(false);
    }

    init();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="bl-container">
      <h1>Paiements</h1>

      {success === "1" && (
        <div className="bl-alert" style={{ marginTop: 12 }}>
          ✅ Onboarding terminé. Stripe peut encore vérifier vos informations (parfois 24–48h).
        </div>
      )}

      {refresh === "1" && (
        <div className="bl-alert" style={{ marginTop: 12 }}>
          🔁 Onboarding à reprendre. Vous pouvez relancer l’activation.
        </div>
      )}

      {errorMsg && (
        <div className="bl-alert bl-alert-error" style={{ marginTop: 12 }}>
          <strong>Erreur :</strong> {errorMsg}
        </div>
      )}

      <div
        className="bl-alert"
        style={{
          marginTop: 12,
          border: "1px solid rgba(0,0,0,0.08)",
          background: "rgba(0,0,0,0.03)",
          fontWeight: 850,
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
          <div>{checking ? "Chargement…" : statusLabel(status)}</div>

          <button
            className="bl-btn"
            onClick={fetchStatus}
            disabled={checking || loading}
            style={{ marginTop: 0, height: 40, fontWeight: 900 }}
          >
            {checking ? "…" : "Actualiser"}
          </button>
        </div>

        <div style={{ marginTop: 8, opacity: 0.8, lineHeight: 1.6, fontWeight: 750 }}>
          {statusHelp(status)}
        </div>

        {status && status.hasAccount && (
          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75, fontWeight: 800 }}>
            Compte Stripe :{" "}
            <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
              {status.stripeAccountId}
            </span>
            <br />
            Encaissement : {status.chargesEnabled ? "✅" : "⏳"} · Reversements : {status.payoutsEnabled ? "✅" : "⏳"}
          </div>
        )}

        {/* ✅ AJOUT : affichage du mode test/live */}
        {status?.mode && (
          <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75, fontWeight: 800 }}>
            Mode :{" "}
            <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
              {status.mode}
            </span>
          </div>
        )}

        {/* (optionnel) message renvoyé par l’API */}
        {status?.message && (
          <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85, fontWeight: 800 }}>
            {status.message}
          </div>
        )}
      </div>

      {!isActive ? (
        <button
          className="bl-btn bl-btn-primary"
          onClick={startStripeOnboarding}
          disabled={loading || checking}
          style={{ marginTop: 14 }}
        >
          {loading ? "Redirection…" : "Activer les paiements (Stripe Connect)"}
        </button>
      ) : (
        <div style={{ marginTop: 14, fontWeight: 900, opacity: 0.85 }}>
          ✅ Tout est prêt. Vous pouvez recevoir des paiements.
        </div>
      )}

      <div style={{ marginTop: 10, opacity: 0.75 }}>
        Une fois activé, Booking-Light prélève 14% et Stripe reverse automatiquement le reste au loueur.
      </div>
    </main>
  );
}

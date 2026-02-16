// src/app/dashboard/listings/[id]/edit/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type BillingUnit = "night" | "day" | "week" | "month";

type ListingForm = {
  title: string;
  city: string;
  kind: string;
  price_eur: string; // UX: on édite en euros côté UI
  billing_unit: BillingUnit;
};

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = useMemo(() => String(params?.id || ""), [params]);

  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [form, setForm] = useState<ListingForm>({
    title: "",
    city: "",
    kind: "",
    price_eur: "",
    billing_unit: "night",
  });

  useEffect(() => {
    async function init() {
      setChecking(true);
      setErrorMsg(null);

      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id ?? null;

      if (!uid) {
        router.replace("/auth");
        return;
      }

      setChecking(false);
      await loadListing(uid);
    }

    async function loadListing(uid: string) {
      setLoading(true);
      setErrorMsg(null);

      try {
        // ✅ IMPORTANT : adapte le nom de table si nécessaire
        const { data, error } = await supabase
          .from("listings")
          .select("id,user_id,title,city,kind,price_cents,billing_unit")
          .eq("id", id)
          .single();

        if (error) throw error;
        if (!data) throw new Error("Annonce introuvable.");

        if (data.user_id !== uid) {
          throw new Error("Accès refusé (cette annonce ne t’appartient pas).");
        }

        setForm({
          title: data.title ?? "",
          city: data.city ?? "",
          kind: data.kind ?? "",
          price_eur: typeof data.price_cents === "number" ? (data.price_cents / 100).toFixed(2).replace(".", ",") : "",
          billing_unit: (data.billing_unit ?? "night") as BillingUnit,
        });
      } catch (e: any) {
        setErrorMsg(e?.message ?? "Erreur chargement annonce.");
      } finally {
        setLoading(false);
      }
    }

    if (id) init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function set<K extends keyof ListingForm>(key: K, value: ListingForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function eurToCents(raw: string) {
    // accepte "20", "20.5", "20,50"
    const normalized = raw.trim().replace(",", ".");
    if (!normalized) return null;
    const n = Number(normalized);
    if (!Number.isFinite(n) || n < 0) return null;
    return Math.round(n * 100);
  }

  async function save() {
    if (saving) return;
    setErrorMsg(null);
    setNotice(null);

    const price_cents = eurToCents(form.price_eur);
    if (price_cents === null) {
      setErrorMsg("Prix invalide. Exemple : 20 ou 20,50");
      return;
    }
    if (!form.title.trim()) {
      setErrorMsg("Titre obligatoire.");
      return;
    }

    setSaving(true);
    try {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id ?? null;
      if (!uid) {
        router.replace("/auth");
        return;
      }

  const { error } = await supabase
  .from("listings")
  .update({
    title: form.title.trim(),
    city: form.city.trim(),
    kind: form.kind.trim(),
    price_cents,
    billing_unit: form.billing_unit,
  })
  .eq("id", id)
  .eq("user_id", uid);

if (error) throw error;

      setNotice("✅ Modifications enregistrées.");
      setTimeout(() => setNotice(null), 1800);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Erreur mise à jour.");
    } finally {
      setSaving(false);
    }
  }

  const shell: React.CSSProperties = { maxWidth: 900, margin: "0 auto", padding: 24 };
  const card: React.CSSProperties = { border: "1px solid #ececec", borderRadius: 16, padding: 16, background: "white" };
  const row: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };
  const input: React.CSSProperties = { height: 44, borderRadius: 12, border: "1px solid #e5e5e5", padding: "0 12px", outline: "none", fontWeight: 700 };
  const select: React.CSSProperties = { ...input, background: "white" };
  const btn: React.CSSProperties = { border: "1px solid #e5e5e5", background: "white", borderRadius: 12, padding: "10px 12px", cursor: "pointer", fontWeight: 900, textDecoration: "none", color: "inherit", display: "inline-flex", alignItems: "center", justifyContent: "center" };
  const btnPrimary: React.CSSProperties = { ...btn, borderColor: "rgba(47,107,255,.28)", background: "rgba(47,107,255,.10)" };
  const btnDisabled: React.CSSProperties = { ...btn, cursor: "not-allowed", opacity: 0.55 };

  if (checking) {
    return (
      <main style={shell}>
        <p>Vérification…</p>
      </main>
    );
  }

  return (
    <main style={shell}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, letterSpacing: -0.2 }}>Modifier l’annonce</h1>
          <p style={{ marginTop: 6, opacity: 0.75 }}>Ici, on modifie. On ne supprime pas “juste pour corriger une virgule”.</p>
        </div>

        <Link href="/my-listings" style={btn}>
          ← Retour
        </Link>
      </div>

      {notice && (
        <div style={{ marginTop: 12, padding: 12, border: "1px solid #cfe9d8", borderRadius: 12, background: "#f0fbf4" }}>
          <strong>Info :</strong> {notice}
        </div>
      )}

      {errorMsg && (
        <div style={{ marginTop: 12, padding: 12, border: "1px solid #ffb3b3", borderRadius: 12, background: "#fff5f5" }}>
          <strong>Erreur :</strong> {errorMsg}
        </div>
      )}

      <section style={{ marginTop: 16 }}>
        <div style={card}>
          {loading ? (
            <p style={{ margin: 0, opacity: 0.75 }}>Chargement…</p>
          ) : (
            <>
              <div style={row}>
                <div>
                  <div style={{ fontWeight: 900, marginBottom: 6 }}>Titre</div>
                  <input style={input} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Ex: Chambre cosy" />
                </div>

                <div>
                  <div style={{ fontWeight: 900, marginBottom: 6 }}>Ville</div>
                  <input style={input} value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Ex: Kourou" />
                </div>
              </div>

              <div style={{ ...row, marginTop: 12 }}>
                <div>
                  <div style={{ fontWeight: 900, marginBottom: 6 }}>Type</div>
                  <input style={input} value={form.kind} onChange={(e) => set("kind", e.target.value)} placeholder="Ex: Chambre" />
                </div>

                <div>
                  <div style={{ fontWeight: 900, marginBottom: 6 }}>Facturation</div>
                  <select style={select} value={form.billing_unit} onChange={(e) => set("billing_unit", e.target.value as BillingUnit)}>
                    <option value="night">Par nuit</option>
                    <option value="day">Par jour</option>
                    <option value="week">Par semaine</option>
                    <option value="month">Par mois</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: 12, maxWidth: 320 }}>
                <div style={{ fontWeight: 900, marginBottom: 6 }}>Prix (€)</div>
                <input style={input} value={form.price_eur} onChange={(e) => set("price_eur", e.target.value)} placeholder="Ex: 20,00" inputMode="decimal" />
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
                <button onClick={save} style={saving ? btnDisabled : btnPrimary} disabled={saving}>
                  {saving ? "Enregistrement…" : "Enregistrer"}
                </button>

                <Link href={`/listing/${id}`} style={btn}>
                  Voir l’annonce →
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

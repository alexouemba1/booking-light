"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { publicListingImageUrl } from "@/lib/storage";

type Listing = {
  id: string;
  title: string;
  city: string;
  kind: string;
  price_cents: number;
  billing_unit: string;
  cover_image_path: string | null;
  created_at: string;
};

function formatUnit(billing_unit: string) {
  if (billing_unit === "night") return "nuit";
  if (billing_unit === "day") return "jour";
  return "semaine";
}

function formatPrice(price_cents: number, billing_unit: string) {
  const euros = (price_cents / 100).toFixed(2).replace(".", ",");
  return `${euros} € / ${formatUnit(billing_unit)}`;
}

type SortKey = "recent" | "price_asc" | "price_desc" | "title_asc";

type ConnectStatus =
  | {
      hasAccount: false;
      active: false;
      message?: string;
    }
  | {
      hasAccount: true;
      stripeAccountId: string;
      chargesEnabled: boolean;
      payoutsEnabled: boolean;
      active: boolean;
    };

export default function MyListingsPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [notice, setNotice] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ✅ UX: recherche + tri
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("recent");

  // ✅ UX: feedback copie lien
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ✅ Stripe Connect status
  const [connectStatus, setConnectStatus] = useState<ConnectStatus | null>(null);
  const [checkingConnect, setCheckingConnect] = useState(false);

  // ✅ Onboarding Stripe (loueur)
  const [connectingStripe, setConnectingStripe] = useState(false);

  const isConnectActive = useMemo(() => {
    return !!connectStatus && connectStatus.hasAccount && connectStatus.active;
  }, [connectStatus]);

  async function fetchConnectStatus() {
    setErrorMsg(null);
    setCheckingConnect(true);

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        setCheckingConnect(false);
        return;
      }

      const res = await fetch("/api/stripe/connect/status", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const raw = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(raw);
      } catch {
        throw new Error("Réponse invalide du serveur (pas du JSON).");
      }

      if (!res.ok) throw new Error(json?.error ?? "Erreur statut Stripe");

      setConnectStatus(json as ConnectStatus);
    } catch (e: any) {
      // On n’empêche pas l’utilisateur de gérer ses annonces si Stripe a un souci
      console.warn("[my-listings] connect status error:", e?.message);
      setConnectStatus(null);
    } finally {
      setCheckingConnect(false);
    }
  }

  async function startStripeOnboarding() {
    try {
      if (connectingStripe) return;

      setErrorMsg(null);
      setNotice(null);
      setConnectingStripe(true);

      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        setErrorMsg("Tu dois être connecté.");
        router.replace("/auth");
        return;
      }

      const res = await fetch("/api/stripe/connect/onboard", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const raw = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(raw);
      } catch {
        throw new Error("Réponse invalide du serveur (pas du JSON). Regarde les logs Vercel.");
      }

      if (!res.ok) throw new Error(json?.error ?? "Erreur Stripe Connect.");

      const url = String(json?.url || "");
      if (!url) throw new Error("URL Stripe manquante.");

      window.location.href = url;
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Erreur Stripe Connect.");
    } finally {
      setConnectingStripe(false);
    }
  }

  async function load(uid: string) {
    setLoading(true);
    setErrorMsg(null);

    const { data, error } = await supabase
      .from("listings_home")
      .select("id,title,city,kind,price_cents,billing_unit,cover_image_path,created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    setItems((data || []) as Listing[]);
    setLoading(false);
  }

  // Auth check + load
  useEffect(() => {
    async function init() {
      setChecking(true);
      setErrorMsg(null);
      setNotice(null);

      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id ?? null;

      if (!uid) {
        setChecking(false);
        router.replace("/auth");
        return;
      }

      setUserId(uid);
      setChecking(false);
      await load(uid);

      // ✅ charge aussi le statut Stripe Connect (sans bloquer)
      fetchConnectStatus();
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function deleteListing(listingId: string) {
    if (deletingId) return;

    const ok = window.confirm("Supprimer cette annonce ? (Annonce + images + fichiers)");
    if (!ok) return;

    setErrorMsg(null);
    setNotice(null);
    setDeletingId(listingId);

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        setErrorMsg("Tu dois être connecté.");
        router.replace("/auth");
        return;
      }

      const res = await fetch("/api/delete-listing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ listingId }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Erreur suppression.");

      setItems((prev) => prev.filter((x) => x.id !== listingId));
      setNotice("Annonce supprimée.");
      setTimeout(() => setNotice(null), 1800);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Erreur suppression.");
    } finally {
      setDeletingId(null);
    }
  }

  async function refresh() {
    if (!userId) return;
    setNotice(null);
    await load(userId);
    await fetchConnectStatus();
    setNotice("Liste mise à jour.");
    setTimeout(() => setNotice(null), 1800);
  }

  async function copyListingLink(listingId: string) {
    try {
      const url = `${window.location.origin}/listing/${listingId}`;
      await navigator.clipboard.writeText(url);
      setCopiedId(listingId);
      setTimeout(() => setCopiedId(null), 1400);
    } catch {
      const url = `${window.location.origin}/listing/${listingId}`;
      window.prompt("Copie ce lien :", url);
    }
  }

  const filteredSorted = useMemo(() => {
    const q = query.trim().toLowerCase();

    let arr = items;
    if (q) {
      arr = arr.filter((x) => {
        const hay = `${x.title} ${x.city} ${x.kind}`.toLowerCase();
        return hay.includes(q);
      });
    }

    const copy = [...arr];

    if (sortKey === "recent") {
      copy.sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0));
    } else if (sortKey === "price_asc") {
      copy.sort((a, b) => (a.price_cents ?? 0) - (b.price_cents ?? 0));
    } else if (sortKey === "price_desc") {
      copy.sort((a, b) => (b.price_cents ?? 0) - (a.price_cents ?? 0));
    } else if (sortKey === "title_asc") {
      copy.sort((a, b) => (a.title || "").localeCompare(b.title || "", "fr", { sensitivity: "base" }));
    }

    return copy;
  }, [items, query, sortKey]);

  const stats = useMemo(() => {
    const count = filteredSorted.length;
    const withCover = filteredSorted.filter((x) => !!x.cover_image_path).length;
    return { count, withCover };
  }, [filteredSorted]);

  if (checking) {
    return (
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
        <p>Vérification…</p>
      </main>
    );
  }

  const shell: React.CSSProperties = {
    maxWidth: 1100,
    margin: "0 auto",
    padding: 24,
  };

  const topbar: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
  };

  const pill: React.CSSProperties = {
    border: "1px solid #e8e8e8",
    background: "white",
    borderRadius: 999,
    padding: "8px 12px",
    fontWeight: 900,
    fontSize: 13,
  };

  const grid: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 14,
  };

  const card: React.CSSProperties = {
    border: "1px solid #ececec",
    borderRadius: 16,
    overflow: "hidden",
    background: "white",
    boxShadow: "0 10px 24px rgba(0,0,0,0.04)",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
  };

  const imgWrap: React.CSSProperties = {
    height: 170,
    background: "#f4f4f4",
    position: "relative",
    overflow: "hidden",
  };

  const btn: React.CSSProperties = {
    border: "1px solid #e5e5e5",
    background: "white",
    borderRadius: 12,
    padding: "8px 10px",
    cursor: "pointer",
    fontWeight: 900,
    opacity: 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    textDecoration: "none",
    color: "inherit",
  };

  const btnPrimary: React.CSSProperties = {
    ...btn,
    borderColor: "rgba(47,107,255,.28)",
    background: "rgba(47,107,255,.10)",
  };

  const btnDisabled: React.CSSProperties = {
    ...btn,
    cursor: "not-allowed",
    opacity: 0.55,
  };

  const badgeOk: React.CSSProperties = {
    ...btn,
    cursor: "default",
    borderColor: "rgba(16,185,129,0.35)",
    background: "rgba(16,185,129,0.10)",
  };

  const input: React.CSSProperties = {
    height: 40,
    borderRadius: 12,
    border: "1px solid #e5e5e5",
    padding: "0 12px",
    outline: "none",
    minWidth: 260,
    fontWeight: 700,
  };

  const select: React.CSSProperties = {
    height: 40,
    borderRadius: 12,
    border: "1px solid #e5e5e5",
    padding: "0 10px",
    outline: "none",
    fontWeight: 800,
    background: "white",
  };

  const badgeNoPhoto: React.CSSProperties = {
    position: "absolute",
    top: 10,
    left: 10,
    borderRadius: 999,
    padding: "6px 10px",
    background: "rgba(255,245,245,0.95)",
    border: "1px solid rgba(255, 99, 99, 0.35)",
    fontWeight: 950,
    fontSize: 12,
  };

  return (
    <main style={shell}>
      <div style={topbar}>
        <div style={{ minWidth: 260 }}>
          <h1 style={{ margin: 0, fontSize: 28, letterSpacing: -0.2 }}>Mes annonces</h1>
          <p style={{ marginTop: 6, opacity: 0.75 }}>Tu gères tes annonces ici. Design plus clean, stress en moins.</p>

          {/* ✅ Stripe Connect (côté loueur) */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
            {!isConnectActive ? (
              <button
                onClick={startStripeOnboarding}
                style={connectingStripe ? btnDisabled : btnPrimary}
                disabled={connectingStripe}
              >
                {connectingStripe ? "Redirection Stripe…" : "Activer les paiements (Stripe)"}
              </button>
            ) : (
              <span style={badgeOk}>✅ Paiements activés</span>
            )}

            <button onClick={fetchConnectStatus} style={checkingConnect ? btnDisabled : btn} disabled={checkingConnect}>
              {checkingConnect ? "Vérification…" : "Vérifier"}
            </button>

            <Link href="/dashboard/payments" style={btn} title="Voir la page paiements">
              Page paiements →
            </Link>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher (titre, ville, type)…"
              style={input}
            />

            <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} style={select}>
              <option value="recent">Tri : plus récent</option>
              <option value="price_asc">Tri : prix croissant</option>
              <option value="price_desc">Tri : prix décroissant</option>
              <option value="title_asc">Tri : titre A → Z</option>
            </select>
          </div>

          {/* Petit texte d’aide (super simple) */}
          <div style={{ marginTop: 10, opacity: 0.7, fontWeight: 800, fontSize: 13, lineHeight: 1.5 }}>
            {connectStatus?.hasAccount && !connectStatus.active
              ? "⏳ Stripe vérifie vos infos. Pendant ce temps, vous pouvez publier, mais les paiements peuvent rester en attente."
              : !connectStatus
              ? "ℹ️ Statut Stripe : non vérifié pour le moment."
              : isConnectActive
              ? "✅ Vous êtes prêt à recevoir des paiements."
              : "ℹ️ Activez Stripe pour recevoir des paiements."}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span style={pill}>
            {stats.count} annonce{stats.count > 1 ? "s" : ""} · {stats.withCover} avec photo
          </span>

          <button onClick={refresh} style={loading ? btnDisabled : btn} disabled={loading}>
            {loading ? "Rafraîchissement…" : "Rafraîchir"}
          </button>
        </div>
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
        {loading ? (
          <div style={{ opacity: 0.75 }}>
            <p>Chargement…</p>
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: 18, border: "1px solid #e6e6e6", borderRadius: 14, background: "white" }}>
            <p style={{ margin: 0, fontWeight: 950 }}>Tu n’as aucune annonce pour l’instant.</p>
            <p style={{ marginTop: 8, opacity: 0.8 }}>
              On règle ça en 30 secondes :{" "}
              <Link href="/publish" style={{ fontWeight: 950 }}>
                créer ta première annonce →
              </Link>
            </p>
          </div>
        ) : filteredSorted.length === 0 ? (
          <div style={{ padding: 18, border: "1px solid #e6e6e6", borderRadius: 14, background: "white" }}>
            <p style={{ margin: 0, fontWeight: 950 }}>Aucun résultat.</p>
            <p style={{ marginTop: 8, opacity: 0.8 }}>Essaie un autre mot-clé (titre, ville, type).</p>
            <button onClick={() => setQuery("")} style={{ ...btn, marginTop: 10 }}>
              Effacer la recherche
            </button>
          </div>
        ) : (
          <div style={grid}>
            {filteredSorted.map((it) => {
              const img = it.cover_image_path ? publicListingImageUrl(it.cover_image_path) : null;
              const isDeleting = deletingId === it.id;
              const justCopied = copiedId === it.id;

              return (
                <div
                  key={it.id}
                  style={card}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "0 16px 38px rgba(0,0,0,0.07)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "0 10px 24px rgba(0,0,0,0.04)";
                  }}
                >
                  <Link href={`/listing/${it.id}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                    <div style={imgWrap}>
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={img}
                          alt=""
                          style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.2s ease" }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.04)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                          }}
                        />
                      ) : (
                        <div style={{ height: "100%", display: "grid", placeItems: "center", opacity: 0.75, fontWeight: 900 }}>
                          Pas d’image
                        </div>
                      )}

                      {!img && <div style={badgeNoPhoto}>Sans photo (ajoute une cover)</div>}

                      <div
                        style={{
                          position: "absolute",
                          bottom: 10,
                          left: 10,
                          borderRadius: 999,
                          padding: "6px 10px",
                          background: "rgba(255,255,255,0.92)",
                          border: "1px solid rgba(0,0,0,0.06)",
                          fontWeight: 950,
                          fontSize: 13,
                        }}
                      >
                        {formatPrice(it.price_cents, it.billing_unit)}
                      </div>
                    </div>

                    <div style={{ padding: 12 }}>
                      <div style={{ fontWeight: 950, fontSize: 16, letterSpacing: -0.1 }}>{it.title}</div>
                      <div style={{ opacity: 0.75, marginTop: 4 }}>
                        {it.city} · {it.kind}
                      </div>
                    </div>
                  </Link>

                  <div style={{ padding: "0 12px 12px 12px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <Link href={`/listing/${it.id}`} style={btn}>
                      Ouvrir
                    </Link>


                    <Link href={`/dashboard/listings/${it.id}/edit`} style={btn} title="Modifier l’annonce">
                      Modifier
                    </Link>
                    <Link
                      href={`/host-bookings?listingId=${encodeURIComponent(it.id)}`
                      }
                      style={btn}
                      title="Voir les réservations reçues sur cette annonce"
                    >
                      Voir réservations
                    </Link>

                    <button onClick={() => copyListingLink(it.id)} style={btn} title="Copier le lien de l’annonce">
                      {justCopied ? "Lien copié" : "Copier le lien"}
                    </button>

                    <button
                      onClick={() => deleteListing(it.id)}
                      style={isDeleting ? btnDisabled : { ...btn, marginLeft: "auto", borderColor: "#f0d4d4" }}
                      disabled={isDeleting}
                      title="Supprimer l’annonce"
                    >
                      {isDeleting ? "Suppression…" : "Supprimer"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

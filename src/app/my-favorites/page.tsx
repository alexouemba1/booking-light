// FILE: src/app/my-favorites/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { publicListingImageUrl } from "@/lib/storage";

type ListingHome = {
  id: string;
  title: string;
  city: string | null;
  kind: string | null;
  billing_unit: string;
  price_cents: number;
  cover_image_path: string | null;
  is_premium?: boolean | null;
  premium_until?: string | null;
  rating_avg?: number | null;
  rating_count?: number | null;
};

function formatUnit(u: string) {
  if (u === "night") return "nuit";
  if (u === "day") return "jour";
  if (u === "week") return "semaine";
  if (u === "month") return "mois";
  return u;
}

function formatPrice(price_cents: number, billing_unit: string) {
  const euros = (price_cents / 100).toFixed(2).replace(".", ",");
  return `${euros} € / ${formatUnit(billing_unit)}`;
}

function getErrorMessage(e: unknown) {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  return "Erreur";
}

export default function MyFavoritesPage() {
  const [favIds, setFavIds] = useState<string[]>([]);
  const [items, setItems] = useState<ListingHome[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1) Lire les favoris depuis localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("lb:favorites");
      const parsed = raw ? JSON.parse(raw) : [];
      const arr = Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
      setFavIds(arr);
    } catch {
      setFavIds([]);
    }
  }, []);

  // 2) Charger toutes les annonces (comme l’accueil), puis filtrer
  useEffect(() => {
    async function load() {
      setLoading(true);
      setErrorMsg(null);

      try {
        const sp = new URLSearchParams();
        sp.set("guests", "1"); // requis par /api/search

        const res = await fetch(`/api/search?${sp.toString()}`, { cache: "no-store" });
        const json: any = await res.json();

        if (!res.ok) throw new Error(json?.error ?? "Erreur chargement favoris");

        const all: ListingHome[] = json?.items ?? [];
        setItems(all);
      } catch (e) {
        setErrorMsg(getErrorMessage(e));
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  // 3) Filtrer selon favIds
  const favSet = useMemo(() => new Set(favIds), [favIds]);

  const favorites = useMemo(() => {
    const filtered = items.filter((x) => favSet.has(x.id));
    return filtered;
  }, [items, favSet]);

  return (
    <main className="bl-container" style={{ paddingTop: 26, paddingBottom: 50 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <h1 className="bl-h1" style={{ margin: 0 }}>
          ❤️ Mes favoris
        </h1>
        <div style={{ opacity: 0.7, fontWeight: 800 }}>
          {favorites.length} annonce{favorites.length > 1 ? "s" : ""}
        </div>
      </div>

      <p style={{ marginTop: 10, opacity: 0.75 }}>
        Les annonces que vous avez enregistrées apparaîtront ici.
      </p>

      {loading && <div style={{ marginTop: 14, opacity: 0.8 }}>Chargement…</div>}

      {errorMsg && (
        <div style={{ marginTop: 14, color: "crimson", fontWeight: 800 }}>
          {errorMsg}
        </div>
      )}

      {!loading && !errorMsg && favorites.length === 0 && (
        <div style={{ marginTop: 18, opacity: 0.8 }}>
          Aucun favori pour l’instant. Sur l’accueil, clique sur 🤍 pour enregistrer une annonce.
        </div>
      )}

      {!loading && !errorMsg && favorites.length > 0 && (
        <div
       style={{
  marginTop: 18,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 320px))",
  justifyContent: "start",
  gap: 16,
}}
        >
          {favorites.map((l) => {
            const img = l.cover_image_path ? publicListingImageUrl(l.cover_image_path) : null;

            return (
              <div
                key={l.id}
                style={{
                  border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: 18,
                  overflow: "hidden",
                  background: "white",
                  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
                }}
              >
                    <div
  style={{
    height: 170,
    overflow: "hidden",
    background: "rgba(0,0,0,0.04)"
  }}
>
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img}
                      alt={l.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ height: "100%", display: "grid", placeItems: "center", opacity: 0.7 }}>
                      Pas d’image
                    </div>
                  )}
                </div>

                <div style={{ padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ fontWeight: 950, fontSize: 16 }}>{l.title}</div>
                    <div
                      style={{
                        padding: "4px 10px",
                        borderRadius: 999,
                        border: "1px solid rgba(0,0,0,0.08)",
                        background: "rgba(47,107,255,0.10)",
                        fontWeight: 900,
                        whiteSpace: "nowrap",
                      }}
                      title="Prix"
                    >
                      {formatPrice(l.price_cents, l.billing_unit)}
                    </div>
                  </div>

                  <div style={{ marginTop: 8, opacity: 0.75, fontWeight: 800 }}>
                    {l.city ?? "—"} · {l.kind ?? "—"}
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <Link
                      href={`/listing/${l.id}`}
                      style={{ fontWeight: 900, textDecoration: "none" }}
                    >
                      Voir détails & réserver →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
// FILE: src/app/villes/[city]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { publicListingImageUrl } from "@/lib/storage";

type ListingHome = {
  id: string;
  title: string;
  city: string | null;
  kind: string | null;
  billing_unit: string;
  price_cents: number;
  cover_image_path: string | null;
};

function formatUnit(u: string) {
  if (u === "night") return "nuit";
  if (u === "day") return "jour";
  if (u === "week") return "semaine";
  if (u === "month") return "mois";
  return u;
}

function titleCaseFromSlug(slug: string) {
  return slug
    .split("-")
    .map((p) => (p ? p[0].toUpperCase() + p.slice(1) : p))
    .join(" ");
}

export default function CityPage() {
  const params = useParams() as { city?: string | string[] } | null;

  const citySlug =
    typeof params?.city === "string"
      ? params.city
      : Array.isArray(params?.city)
      ? params.city[0]
      : "";

  const cityName = useMemo(() => titleCaseFromSlug(citySlug || ""), [citySlug]);

  const [items, setItems] = useState<ListingHome[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!citySlug) {
        setLoading(false);
        setItems([]);
        return;
      }

      setLoading(true);
      setErrorMsg(null);

      try {
        const sp = new URLSearchParams();
        sp.set("city", cityName);
        sp.set("guests", "1");

        const res = await fetch(`/api/search?${sp.toString()}`, { cache: "no-store" });
        const json: any = await res.json();

        if (!res.ok) throw new Error(json?.error ?? "Erreur recherche");

        if (!alive) return;
        setItems(json?.items ?? []);
      } catch (e: any) {
        if (!alive) return;
        setErrorMsg(e?.message ?? "Erreur");
        setItems([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [citySlug, cityName]);

  return (
    <main className="bl-container">
      <div className="bl-detail-top" style={{ flexWrap: "wrap" }}>
        <Link className="bl-link" href="/villes">
          ← Toutes les villes
        </Link>
        <Link className="bl-link" href="/">
          Accueil
        </Link>
      </div>

      <h1 className="bl-h1" style={{ marginTop: 12 }}>
        Annonces à {cityName || "—"}
      </h1>

      {loading && <p>Chargement…</p>}

      {errorMsg && (
        <div className="bl-alert bl-alert-error">
          <strong>Erreur :</strong> {errorMsg}
        </div>
      )}

      {!loading && !errorMsg && items.length === 0 && (
        <p style={{ opacity: 0.85, fontWeight: 700 }}>Aucune annonce pour le moment dans cette ville.</p>
      )}

      {!loading && !errorMsg && items.length > 0 && (
        <div className="bl-grid" style={{ marginTop: 12 }}>
          {items.map((l) => {
            const price = (l.price_cents / 100).toFixed(2).replace(".", ",");
            const img = l.cover_image_path ? publicListingImageUrl(l.cover_image_path) : null;
            const isVerified = !!l.cover_image_path;
      const isPremium = !!l.cover_image_path && (l.price_cents ?? 0) > 0;

            return (
              <Link key={l.id} href={`/listing/${l.id}`} className="bl-card">
                <div className="bl-card-media">
                  {/* Badges */}
<div
  style={{
    position: "absolute",
    top: 10,
    right: 10,
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "flex-end",
    zIndex: 2,
  }}
>
  {isVerified && (
    <span
      style={{
        padding: "6px 10px",
        borderRadius: 999,
        fontWeight: 950,
        fontSize: 12,
        border: "1px solid rgba(0,0,0,.10)",
        background: "rgba(255,255,255,.92)",
        backdropFilter: "blur(8px)",
      }}
      title="Annonce avec photo"
    >
      ✅ Vérifié
    </span>
  )}

  {isPremium && (
    <span
      style={{
        padding: "6px 10px",
        borderRadius: 999,
        fontWeight: 950,
        fontSize: 12,
        border: "1px solid rgba(47,107,255,.30)",
        background: "rgba(47,107,255,.12)",
        backdropFilter: "blur(8px)",
      }}
      title="Annonce mise en avant"
    >
      ✨ Premium
    </span>
  )}
</div>
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt={l.title} />
                  ) : (
                    <span>Pas d’image</span>
                  )}
                </div>

                <div className="bl-card-body">
                  <div style={{ display: "flex", gap: 10, justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div className="bl-card-title">{l.title}</div>

                    <div
                      style={{
                        flex: "0 0 auto",
                        alignSelf: "flex-start",
                        whiteSpace: "nowrap",
                        padding: "6px 10px",
                        borderRadius: 999,
                        fontWeight: 800,
                        fontSize: 13,
                        border: "1px solid rgba(11,18,32,.12)",
                        background: "rgba(47,107,255,.10)",
                      }}
                      title="Prix"
                    >
                      {price} € / {formatUnit(l.billing_unit)}
                    </div>
                  </div>

                  <div className="bl-card-meta" style={{ marginTop: 6 }}>
                    {l.city ?? cityName} · {l.kind ?? "Type ?"}
                  </div>

                  <div className="bl-card-cta" style={{ marginTop: 8 }}>
                    Voir détails & réserver →
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
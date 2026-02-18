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

  // ✅ Premium (renvoyé par /api/search)
  is_premium?: boolean | null;
  premium_until?: string | null;
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

function isPremiumActive(l: ListingHome) {
  if (!l?.is_premium) return false;
  if (!l?.premium_until) return true;
  return new Date(l.premium_until).getTime() > Date.now();
}

export default function CityPage() {
  const params = useParams() as { city?: string | string[] } | null;

  const citySlug =
    typeof params?.city === "string" ? params.city : Array.isArray(params?.city) ? params.city[0] : "";

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
        <div className="bl-grid" style={{ marginTop: 12, overflow: "visible" }}>
          {items.map((l) => {
            const premium = isPremiumActive(l);
            const price = (l.price_cents / 100).toFixed(2).replace(".", ",");
            const img = l.cover_image_path ? publicListingImageUrl(l.cover_image_path) : null;

            const baseShadow = premium ? "0 18px 55px rgba(245, 158, 11, .22)" : "0 10px 24px rgba(0,0,0,.04)";
            const hoverShadow = premium ? "0 26px 80px rgba(245, 158, 11, .32)" : "0 22px 50px rgba(0,0,0,.12)";

            return (
              <Link
                key={l.id}
                href={`/listing/${l.id}`}
                className={`bl-card ${premium ? "bl-card-premium" : ""}`}
                style={{
                  transition: "transform .18s ease, box-shadow .18s ease, border-color .18s ease",
                  boxShadow: baseShadow,
                  border: premium ? "1px solid rgba(245, 158, 11, .50)" : undefined,
                  background: premium ? "linear-gradient(135deg, rgba(255,255,255,1), rgba(245,158,11,.06))" : undefined,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = hoverShadow;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = baseShadow;
                }}
              >
                <div className="bl-card-media" style={{ position: "relative", height: premium ? 260 : 190, overflow: "hidden" }}>
                  {premium && (
                    <div
                      style={{
                        position: "absolute",
                        left: 10,
                        top: 10,
                        zIndex: 5,
                        padding: "7px 12px",
                        borderRadius: 999,
                        fontWeight: 950,
                        fontSize: 12,
                        border: "1px solid rgba(0,0,0,.12)",
                        background: "rgba(255, 211, 77, .94)",
                        color: "rgba(0,0,0,.88)",
                        boxShadow: "0 12px 28px rgba(245,158,11,.35)",
                      }}
                      title="Annonce Premium"
                    >
                      Premium ⭐
                    </div>
                  )}

                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img}
                      alt={l.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transition: "transform .35s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                    />
                  ) : (
                    <span>Pas d’image</span>
                  )}
                </div>

                <div className="bl-card-body" style={{ padding: premium ? 16 : undefined }}>
                  <div style={{ display: "flex", gap: 10, justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div className="bl-card-title" style={{ fontSize: premium ? 18 : undefined, fontWeight: premium ? 950 : undefined }}>
                      {l.title}
                    </div>

                    <div
                      style={{
                        flex: "0 0 auto",
                        alignSelf: "flex-start",
                        whiteSpace: "nowrap",
                        padding: premium ? "7px 12px" : "6px 10px",
                        borderRadius: 999,
                        fontWeight: premium ? 900 : 800,
                        fontSize: 13,
                        border: premium ? "1px solid rgba(245, 158, 11, .45)" : "1px solid rgba(11,18,32,.12)",
                        background: premium ? "rgba(245, 158, 11, .14)" : "rgba(47,107,255,.10)",
                      }}
                      title="Prix"
                    >
                      {price} € / {formatUnit(l.billing_unit)}
                    </div>
                  </div>

                  <div className="bl-card-meta" style={{ marginTop: 6 }}>
                    {l.city ?? cityName} · {l.kind ?? "Type ?"}
                  </div>

                  {premium && (
                    <div style={{ marginTop: 8, fontSize: 12, fontWeight: 900, opacity: 0.75 }}>
                      Mise en avant Premium · meilleure visibilité
                    </div>
                  )}

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
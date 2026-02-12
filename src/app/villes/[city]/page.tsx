// FILE: src/app/villes/[city]/page.tsx
import Link from "next/link";
import type { Metadata } from "next";
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

// ✅ SEO: title/description dynamiques
export async function generateMetadata({ params }: { params: { city: string } }): Promise<Metadata> {
  const cityName = titleCaseFromSlug(params.city);

  return {
    title: `Location à ${cityName} | LightBooker`,
    description: `Découvrez des logements à ${cityName} (nuit, semaine ou mois). Réservation sécurisée et paiement en ligne.`,
  };
}

async function getListings(cityName: string): Promise<ListingHome[]> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lightbooker.com";

  const url = new URL("/api/search", siteUrl);
  url.searchParams.set("city", cityName);
  url.searchParams.set("guests", "1");

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.editable) return []; // sécurité
  if (!res.ok) return [];

  const json = await res.json();
  return json?.items ?? [];
}

export default async function CityPage({ params }: { params: { city: string } }) {
  const citySlug = params.city || "";
  const cityName = titleCaseFromSlug(citySlug);
  const items = await getListings(cityName);

  const faqLdJson = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Peut-on réserver un logement à ${cityName} pour une seule nuit ?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Oui, certains logements à ${cityName} sont disponibles à la nuit selon les disponibilités des propriétaires.`,
        },
      },
      {
        "@type": "Question",
        name: `Le paiement est-il sécurisé pour une location à ${cityName} ?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Oui, les réservations à ${cityName} sont effectuées avec un paiement sécurisé en ligne.`,
        },
      },
      {
        "@type": "Question",
        name: `Quels types de logements sont disponibles à ${cityName} ?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Studios, appartements et maisons peuvent être proposés à ${cityName} selon les annonces publiées.`,
        },
      },
    ],
  };

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
        Location à {cityName || "—"}
      </h1>

      {/* 🔥 Texte SEO */}
      <p style={{ marginTop: 10, opacity: 0.85, fontWeight: 650 }}>
        Trouvez un logement à {cityName} pour une nuit, une semaine ou un mois. Studios, appartements et maisons.
        Réservation sécurisée et paiement en ligne.
      </p>

      {/* ✅ Bloc SEO enrichi */}
      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontWeight: 900 }}>Pourquoi louer à {cityName} ?</h2>
        <p style={{ marginTop: 8, opacity: 0.9 }}>
          {cityName} est une destination idéale pour un séjour court ou long. Réservez facilement un logement pour une
          nuit, une semaine ou un mois, avec paiement sécurisé et des informations claires avant validation.
        </p>

        <h3 style={{ marginTop: 16, fontWeight: 800 }}>Types de logements disponibles</h3>
        <p style={{ opacity: 0.9 }}>
          Studios, appartements, maisons et locations saisonnières sont proposés selon les annonces publiées par les
          propriétaires.
        </p>
      </section>

      {/* ✅ FAQ schema.org (invisible mais utile SEO) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLdJson) }}
      />

      {/* ✅ Résultats */}
      {items.length === 0 && (
        <p style={{ marginTop: 12, opacity: 0.85, fontWeight: 700 }}>
          Aucune annonce pour le moment dans cette ville.
        </p>
      )}

      {items.length > 0 && (
        <div className="bl-grid" style={{ marginTop: 14 }}>
          {items.map((l) => {
            const price = (l.price_cents / 100).toFixed(2).replace(".", ",");
            const img = l.cover_image_path ? publicListingImageUrl(l.cover_image_path) : null;

            return (
              <Link key={l.id} href={`/listing/${l.id}`} className="bl-card">
                <div className="bl-card-media">
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
                        border: "1px solid rgba(11, 18, 32, .12)",
                        background: "rgba(47, 107, 255, .10)",
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
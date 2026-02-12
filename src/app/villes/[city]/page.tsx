import Link from "next/link";
import { publicListingImageUrl } from "@/lib/storage";
import { Metadata } from "next";

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

// ✅ Metadata dynamique SEO
export async function generateMetadata({ params }: { params: { city: string } }): Promise<Metadata> {
  const cityName = titleCaseFromSlug(params.city);

  return {
    title: `Location à ${cityName} | Réservez en direct`,
    description: `Découvrez des logements à ${cityName}. Réservation sécurisée, paiement en ligne et commission transparente.`,
  };
}

async function getListings(cityName: string): Promise<ListingHome[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/search?city=${encodeURIComponent(cityName)}&guests=1`,
    { cache: "no-store" }
  );

  if (!res.ok) return [];

  const json = await res.json();
  return json?.items ?? [];
}

export default async function CityPage({ params }: { params: { city: string } }) {
  const cityName = titleCaseFromSlug(params.city);
  const items = await getListings(cityName);

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
        Location à {cityName}
      </h1>

      {/* 🔥 Bloc texte SEO */}
      <p style={{ marginTop: 10, opacity: 0.85, fontWeight: 600 }}>
        Trouvez votre logement idéal à {cityName}. Studios, appartements ou maisons disponibles pour une nuit,
        une semaine ou un mois. Réservation sécurisée et paiement en ligne.
      </p>
<p style={{ marginTop: 10, opacity: 0.85, fontWeight: 650 }}>
  Trouvez un logement à {cityName} pour une nuit, une semaine ou un mois. Studios, appartements et maisons.
  Réservation sécurisée et paiement en ligne.
</p>

{/* 👉 AJOUTER ICI */}
<section style={{ marginTop: 24 }}>
  <h2 style={{ fontWeight: 900 }}>
    Pourquoi louer à {cityName} ?
  </h2>

  <p style={{ marginTop: 8 }}>
    {cityName} est une destination idéale pour les séjours courts ou longs.
    Réservez facilement un logement pour une nuit, une semaine ou un mois
    avec paiement sécurisé.
  </p>

  <h3 style={{ marginTop: 16, fontWeight: 800 }}>
    Types de logements disponibles
  </h3>

  <p>
    Studios, appartements, maisons et locations saisonnières sont proposés
    selon les disponibilités des propriétaires.
  </p>
</section>
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
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
    }),
  }}
/>
{items.length === 0 && (
      {items.length === 0 && (
        <p style={{ marginTop: 12 }}>Aucune annonce pour le moment dans cette ville.</p>
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
                    <img src={img} alt={l.title} />
                  ) : (
                    <span>Pas d’image</span>
                  )}
                </div>

                <div className="bl-card-body">
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div className="bl-card-title">{l.title}</div>
                    <div style={{ fontWeight: 800 }}>
                      {price} € / {formatUnit(l.billing_unit)}
                    </div>
                  </div>

                  <div className="bl-card-meta" style={{ marginTop: 6 }}>
                    {l.city ?? cityName} · {l.kind ?? "Type ?"}
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
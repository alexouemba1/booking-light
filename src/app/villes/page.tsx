// FILE: src/app/villes/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Locations par ville | France & Outre-mer | Lightbooker",
  description:
    "Découvrez nos pages de location par ville : Paris, Lyon, Marseille, Toulouse, Bordeaux, Nice et plus. Trouvez une location courte durée et réservez en ligne avec paiement sécurisé.",
};

const CITIES = [
  // 🇫🇷 Métropole
  { name: "Paris", slug: "paris" },
  { name: "Lyon", slug: "lyon" },
  { name: "Marseille", slug: "marseille" },
  { name: "Toulouse", slug: "toulouse" },
  { name: "Bordeaux", slug: "bordeaux" },
  { name: "Lille", slug: "lille" },
  { name: "Nantes", slug: "nantes" },
  { name: "Nice", slug: "nice" },
  { name: "Montpellier", slug: "montpellier" },
  { name: "Strasbourg", slug: "strasbourg" },

  // 🌴 Outre-mer
  { name: "Guadeloupe", slug: "guadeloupe" },
  { name: "Martinique", slug: "martinique" },
  { name: "Guyane", slug: "guyane" },
];

export default function VillesPage() {
  return (
    <main className="bl-container">
      <div className="bl-detail-top" style={{ flexWrap: "wrap" }}>
        <Link className="bl-link" href="/">
          ← Retour
        </Link>
      </div>

      <h1 className="bl-h1" style={{ marginTop: 12 }}>
        Locations par ville
      </h1>

      <p style={{ marginTop: 6, opacity: 0.8, fontWeight: 700 }}>
        Choisissez une ville ou un territoire pour voir les annonces disponibles.
      </p>

      {/* Bloc SEO (hub) */}
      <section className="bl-card" style={{ padding: 16, marginTop: 16 }}>
        <h2 style={{ fontWeight: 900 }}>Trouver une location en France et en Outre-mer</h2>

        <p style={{ marginTop: 10, opacity: 0.9, lineHeight: 1.65 }}>
          Lightbooker vous permet de trouver une location (studio, appartement ou maison) pour une nuit,
          une semaine ou un mois. Parcourez nos pages par ville pour affiner votre recherche et accéder
          rapidement aux annonces disponibles.
        </p>

        <p style={{ marginTop: 10, opacity: 0.9, lineHeight: 1.65 }}>
          Si vous cherchez une page “pilier” plus générale, consultez aussi{" "}
          <Link className="bl-link" href="/location-courte-duree-france">
            Location courte durée en France
          </Link>
          .
        </p>
      </section>

      <div className="bl-grid" style={{ marginTop: 14 }}>
        {CITIES.map((c) => (
          <Link key={c.slug} href={`/villes/${c.slug}`} className="bl-card" style={{ padding: 14 }}>
            <div style={{ fontWeight: 950, fontSize: 16 }}>{c.name}</div>
            <div style={{ marginTop: 6, opacity: 0.75, fontWeight: 700 }}>Voir les annonces →</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
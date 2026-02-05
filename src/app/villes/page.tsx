import Link from "next/link";

const CITIES = [
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
        Villes
      </h1>

      <p style={{ marginTop: 6, opacity: 0.8, fontWeight: 700 }}>
        Choisis une ville pour voir les annonces disponibles.
      </p>

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
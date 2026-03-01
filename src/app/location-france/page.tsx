import type { Metadata } from "next";
import Link from "next/link";
import SeoLanding from "@/components/SeoLanding";

export const metadata: Metadata = {
  title: "Location en France | Paris, Marseille, Lyon | Lightbooker",
  description:
    "Location en France : studios, appartements et maisons à Paris, Marseille, Lyon et plus. Nuit, semaine ou mois. Réservation en ligne et paiement sécurisé.",
};

export default function Page() {
  return (
    <SeoLanding
      titleH1="Location d’appartements et maisons en France"
      cityName="France"
      intro="Trouvez une location en France pour une nuit, une semaine ou un mois : studios, appartements et maisons, notamment à Paris, Marseille et Lyon. Réservation en ligne et paiement sécurisé."
      faq={[
        {
          q: "Peut-on réserver une location en France pour une courte durée ?",
          a: "Oui, selon les annonces vous pouvez réserver à la nuit, à la semaine ou au mois.",
        },
        {
          q: "Quelles villes sont les plus recherchées ?",
          a: "Paris, Marseille et Lyon concentrent une grande partie des recherches.",
        },
        {
          q: "Quels types de logements sont disponibles ?",
          a: "Studios, appartements et maisons meublées selon les annonces publiées.",
        },
      ]}
      backHref="/villes"
      backLabel="← Retour"
    >
      <section className="bl-card" style={{ padding: 16, marginTop: 16 }}>
        <h2 style={{ fontWeight: 900 }}>Location courte durée en France</h2>
        <p style={{ marginTop: 10, opacity: 0.9, lineHeight: 1.65 }}>
          Pour un séjour flexible (nuit, semaine ou mois), consultez notre page dédiée :{" "}
          <Link className="bl-link" href="/location-courte-duree-france">
            location courte durée en France
          </Link>
          .
        </p>
      </section>

      <section className="bl-card" style={{ padding: 16, marginTop: 16 }}>
        <h2 style={{ fontWeight: 900 }}>Locations par ville en France</h2>
        <ul style={{ marginTop: 10, lineHeight: 1.9, paddingLeft: 18 }}>
          <li>
            <Link className="bl-link" href="/location-paris">
              Location à Paris
            </Link>
          </li>
          <li>
            <Link className="bl-link" href="/location-marseille">
              Location à Marseille
            </Link>
          </li>
          <li>
            <Link className="bl-link" href="/location-lyon">
              Location à Lyon
            </Link>
          </li>
          <li>
            <Link className="bl-link" href="/location-courte-duree-france">
              Location courte durée en France
            </Link>
          </li>
        </ul>
      </section>
    </SeoLanding>
  );
}
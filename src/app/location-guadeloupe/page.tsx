import type { Metadata } from "next";
import Link from "next/link";
import SeoLanding from "@/components/SeoLanding";

export const metadata: Metadata = {
  title: "Location en Guadeloupe | Pointe-à-Pitre, Les Abymes | Lightbooker",
  description:
    "Location en Guadeloupe : studios, appartements et maisons à Pointe-à-Pitre, Les Abymes et dans toute l’île. Nuit, semaine ou mois. Réservation en ligne sécurisée.",
};

export default function Page() {
  return (
    <SeoLanding
      titleH1="Location d’appartements et maisons en Guadeloupe"
      cityName="Guadeloupe"
      intro="Trouvez une location en Guadeloupe pour une nuit, une semaine ou un mois : studios, appartements et maisons, notamment à Pointe-à-Pitre et aux Abymes. Réservation en ligne et paiement sécurisé."
      faq={[
        {
          q: "Peut-on louer en Guadeloupe pour une courte durée ?",
          a: "Oui, selon les annonces, vous pouvez réserver à la nuit, à la semaine ou au mois.",
        },
        {
          q: "Quelles zones sont les plus recherchées ?",
          a: "Pointe-à-Pitre et Les Abymes font partie des zones les plus demandées selon les périodes.",
        },
        {
          q: "Quels types de logements sont disponibles ?",
          a: "Studios, appartements et maisons meublées selon les annonces publiées par les propriétaires.",
        },
      ]}
      backHref="/villes/guadeloupe"
      backLabel="Voir la page territoire"
    >
      <section className="bl-card" style={{ padding: 16, marginTop: 16 }}>
        <h2 style={{ fontWeight: 900 }}>Location courte durée en Guadeloupe</h2>
        <p style={{ marginTop: 10, opacity: 0.9, lineHeight: 1.65 }}>
          Pour un séjour flexible (nuit, semaine ou mois), consultez aussi notre page dédiée :{" "}
          <Link className="bl-link" href="/location-courte-duree-guadeloupe">
            location courte durée en Guadeloupe
          </Link>
          .
        </p>
      </section>

      <section className="bl-card" style={{ padding: 16, marginTop: 16 }}>
        <h2 style={{ fontWeight: 900 }}>Locations par ville en Guadeloupe</h2>
        <ul style={{ marginTop: 10, lineHeight: 1.9, paddingLeft: 18 }}>
          <li>
            <Link className="bl-link" href="/location-pointe-a-pitre">
              Location à Pointe-à-Pitre
            </Link>
          </li>
          <li>
            <Link className="bl-link" href="/location-les-abymes">
              Location aux Abymes
            </Link>
          </li>
          <li>
            <Link className="bl-link" href="/location-courte-duree-guadeloupe">
              Location courte durée en Guadeloupe
            </Link>
          </li>
        </ul>
      </section>
    </SeoLanding>
  );
}
import type { Metadata } from "next";
import Link from "next/link";
import SeoLanding from "@/components/SeoLanding";

export const metadata: Metadata = {
  title: "Location à La Réunion | Saint-Denis, Saint-Pierre | Lightbooker",
  description:
    "Location à La Réunion : studios, appartements et maisons à Saint-Denis, Saint-Pierre et dans toute l’île. Nuit, semaine ou mois. Réservation en ligne sécurisée.",
};

export default function Page() {
  return (
    <SeoLanding
      titleH1="Location d’appartements et maisons à La Réunion"
      cityName="Réunion"
      intro="Trouvez une location à La Réunion pour une nuit, une semaine ou un mois : studios, appartements et maisons, notamment à Saint-Denis et Saint-Pierre. Réservation en ligne et paiement sécurisé."
      faq={[
        {
          q: "Peut-on louer à La Réunion pour une courte durée ?",
          a: "Oui, selon les annonces, vous pouvez réserver à la nuit, à la semaine ou au mois.",
        },
        {
          q: "Quelles zones sont les plus recherchées ?",
          a: "Saint-Denis et Saint-Pierre font partie des zones les plus demandées selon les périodes.",
        },
        {
          q: "Quels types de logements sont disponibles ?",
          a: "Studios, appartements et maisons meublées selon les annonces publiées par les propriétaires.",
        },
      ]}
      backHref="/villes/reunion"
      backLabel="Voir la page territoire"
    >
      <section className="bl-card" style={{ padding: 16, marginTop: 16 }}>
        <h2 style={{ fontWeight: 900 }}>Location courte durée à La Réunion</h2>
        <p style={{ marginTop: 10, opacity: 0.9, lineHeight: 1.65 }}>
          Pour un séjour flexible (nuit, semaine ou mois), consultez aussi notre page dédiée :{" "}
          <Link className="bl-link" href="/location-courte-duree-reunion">
            location courte durée à La Réunion
          </Link>
          .
        </p>
      </section>

      <section className="bl-card" style={{ padding: 16, marginTop: 16 }}>
        <h2 style={{ fontWeight: 900 }}>Locations par ville à La Réunion</h2>
        <ul style={{ marginTop: 10, lineHeight: 1.9, paddingLeft: 18 }}>
          <li>
            <Link className="bl-link" href="/location-saint-denis">
              Location à Saint-Denis
            </Link>
          </li>
          <li>
            <Link className="bl-link" href="/location-saint-pierre">
              Location à Saint-Pierre
            </Link>
          </li>
          <li>
            <Link className="bl-link" href="/location-courte-duree-reunion">
              Location courte durée à La Réunion
            </Link>
          </li>
        </ul>
      </section>
    </SeoLanding>
  );
}
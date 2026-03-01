import type { Metadata } from "next";
import Link from "next/link";
import SeoLanding from "@/components/SeoLanding";

export const metadata: Metadata = {
  title: "Location à Paris | Studios & Appartements | Lightbooker",
  description:
    "Trouvez une location à Paris : studios, appartements et maisons. Nuit, semaine ou mois. Réservation en ligne sécurisée avec Lightbooker.",
};

export default function Page() {
  return (
    <SeoLanding
      titleH1="Location à Paris"
      cityName="Paris"
      intro="Studios, appartements et maisons disponibles à Paris. Réservation simple et paiement sécurisé."
      faq={[
        {
          q: "Peut-on réserver à la nuit à Paris ?",
          a: "Oui, selon les disponibilités, certains logements sont disponibles à la nuit, à la semaine ou au mois.",
        },
        {
          q: "Le paiement est-il sécurisé ?",
          a: "Oui, les réservations sont effectuées avec un paiement en ligne sécurisé.",
        },
        {
          q: "Quels logements trouve-t-on à Paris ?",
          a: "Studios, appartements et parfois maisons selon les annonces publiées.",
        },
      ]}
      backHref="/location-france"
      backLabel="← Retour France"
    >
      {/* Maillage interne France */}
      <section className="bl-card" style={{ padding: 16, marginTop: 16 }}>
        <h2 style={{ fontWeight: 900 }}>Explorer la France</h2>

        <ul style={{ marginTop: 10, lineHeight: 1.9, paddingLeft: 18 }}>
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
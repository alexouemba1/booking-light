import type { Metadata } from "next";
import Link from "next/link";
import SeoLanding from "@/components/SeoLanding";

export const metadata: Metadata = {
  title: "Location à Toulouse | Studios & Appartements | Lightbooker",
  description:
    "Trouvez une location à Toulouse : studios, appartements et maisons. Nuit, semaine ou mois. Réservation en ligne sécurisée avec Lightbooker.",
};

export default function Page() {
  return (
    <SeoLanding
      titleH1="Location à Toulouse"
      cityName="Toulouse"
      intro="Studios, appartements et maisons disponibles à Toulouse. Réservation simple et paiement sécurisé."
      faq={[
        {
          q: "Peut-on réserver à la nuit à Toulouse ?",
          a: "Oui, selon les annonces, certains logements sont disponibles à la nuit, à la semaine ou au mois.",
        },
        {
          q: "Comment fonctionne la réservation ?",
          a: "Vous choisissez un logement, puis vous payez en ligne de façon sécurisée pour valider la réservation.",
        },
        {
          q: "Quels logements sont proposés ?",
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
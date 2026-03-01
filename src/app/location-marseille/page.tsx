import type { Metadata } from "next";
import Link from "next/link";
import SeoLanding from "@/components/SeoLanding";

export const metadata: Metadata = {
  title: "Location à Marseille | Studios & Appartements | Lightbooker",
  description:
    "Trouvez une location à Marseille : studios, appartements et maisons. Nuit, semaine ou mois. Réservation en ligne sécurisée avec Lightbooker.",
};

export default function Page() {
  return (
    <SeoLanding
      titleH1="Location à Marseille"
      cityName="Marseille"
      intro="Studios, appartements et maisons disponibles à Marseille. Réservation simple et paiement sécurisé."
      faq={[
        {
          q: "Peut-on réserver une location courte durée à Marseille ?",
          a: "Oui, selon les annonces, vous pouvez réserver à la nuit, à la semaine ou au mois.",
        },
        {
          q: "Le paiement est-il sécurisé ?",
          a: "Oui, le paiement se fait en ligne de manière sécurisée au moment de la réservation.",
        },
        {
          q: "Quels types de logements trouve-t-on ?",
          a: "Studios, appartements et parfois maisons selon les annonces publiées.",
        },
      ]}
      backHref="/location-france"
      backLabel="← Retour France"
    >
      {/* Maillage interne (France cluster) */}
      <section className="bl-card" style={{ padding: 16, marginTop: 16 }}>
        <h2 style={{ fontWeight: 900 }}>Explorer la France</h2>

        <ul style={{ marginTop: 10, lineHeight: 1.9, paddingLeft: 18 }}>
          <li>
            <Link className="bl-link" href="/location-paris">
              Location à Paris
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
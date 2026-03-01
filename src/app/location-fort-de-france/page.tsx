import type { Metadata } from "next";
import Link from "next/link";
import SeoLanding from "@/components/SeoLanding";

export const metadata: Metadata = {
  title: "Location à Fort-de-France en Martinique | Studios & Appartements | Lightbooker",
  description:
    "Trouvez une location à Fort-de-France : studios, appartements et maisons. Nuit, semaine ou mois. Réservation sécurisée.",
};

export default function Page() {
  return (
    <SeoLanding
      titleH1="Location à Fort-de-France"
      cityName="Fort-de-France"
      intro="Studios, appartements et maisons disponibles à Fort-de-France. Réservation simple et paiement sécurisé."
      faq={[
        {
          q: "Peut-on louer pour un court séjour ?",
          a: "Oui, selon les disponibilités des annonces.",
        },
      ]}
      backHref="/location-martinique"
      backLabel="← Retour Martinique"
    >
      <section className="bl-card" style={{ padding: 16, marginTop: 16 }}>
        <h2 style={{ fontWeight: 900 }}>Explorer la Martinique</h2>
        <ul style={{ marginTop: 10, lineHeight: 1.9, paddingLeft: 18 }}>
          <li>
            <Link className="bl-link" href="/location-le-lamentin">
              Location au Lamentin
            </Link>
          </li>
          <li>
            <Link className="bl-link" href="/location-courte-duree-martinique">
              Location courte durée en Martinique
            </Link>
          </li>
        </ul>
      </section>
    </SeoLanding>
  );
}
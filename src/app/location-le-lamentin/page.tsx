import type { Metadata } from "next";
import Link from "next/link";
import SeoLanding from "@/components/SeoLanding";

export const metadata: Metadata = {
  title: "Location au Lamentin en Martinique | Studios & Maisons | Lightbooker",
  description:
    "Location au Lamentin : nuit, semaine ou mois. Studios et appartements disponibles. Réservation sécurisée.",
};

export default function Page() {
  return (
    <SeoLanding
      titleH1="Location au Lamentin"
      cityName="Le Lamentin"
      intro="Découvrez les logements disponibles au Lamentin pour un court ou moyen séjour."
      faq={[
        {
          q: "Peut-on réserver à la semaine ?",
          a: "Oui, selon les annonces publiées.",
        },
      ]}
      backHref="/location-martinique"
      backLabel="← Retour Martinique"
    >
      <section className="bl-card" style={{ padding: 16, marginTop: 16 }}>
        <h2 style={{ fontWeight: 900 }}>Explorer la Martinique</h2>
        <ul style={{ marginTop: 10, lineHeight: 1.9, paddingLeft: 18 }}>
          <li>
            <Link className="bl-link" href="/location-fort-de-france">
              Location à Fort-de-France
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
import type { Metadata } from "next";
import Link from "next/link";
import SeoLanding from "@/components/SeoLanding";

export const metadata: Metadata = {
  title: "Location courte durée en Martinique | Fort-de-France & Lamentin | Lightbooker",
  description:
    "Location courte durée en Martinique : studios, appartements et maisons à Fort-de-France et Le Lamentin. Nuit, semaine ou mois. Réservation en ligne sécurisée.",
};

export default function Page() {
  return (
    <SeoLanding
      titleH1="Location courte durée en Martinique"
      cityName="Martinique"
      intro="Réservez une location courte durée en Martinique : nuit, semaine ou mois. Paiement sécurisé et réservation en ligne."
      faq={[
        {
          q: "Peut-on réserver à la nuit en Martinique ?",
          a: "Oui, selon les annonces disponibles.",
        },
        {
          q: "Quelles villes sont les plus recherchées ?",
          a: "Fort-de-France et Le Lamentin.",
        },
      ]}
      backHref="/location-martinique"
      backLabel="← Retour Martinique"
    >
      <section className="bl-card" style={{ padding: 16, marginTop: 16 }}>
        <h2 style={{ fontWeight: 900 }}>Locations par ville</h2>
        <ul style={{ marginTop: 10, lineHeight: 1.9, paddingLeft: 18 }}>
          <li>
            <Link className="bl-link" href="/location-fort-de-france">
              Location à Fort-de-France
            </Link>
          </li>
          <li>
            <Link className="bl-link" href="/location-le-lamentin">
              Location au Lamentin
            </Link>
          </li>
        </ul>
      </section>
    </SeoLanding>
  );
}
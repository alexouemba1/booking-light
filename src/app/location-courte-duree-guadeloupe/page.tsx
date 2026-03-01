import type { Metadata } from "next";
import Link from "next/link";
import SeoLanding from "@/components/SeoLanding";

export const metadata: Metadata = {
  title: "Location courte durée en Guadeloupe | Pointe-à-Pitre & Abymes | Lightbooker",
  description:
    "Location courte durée en Guadeloupe : studios, appartements et maisons à Pointe-à-Pitre et aux Abymes. Nuit, semaine ou mois. Réservation en ligne sécurisée.",
};

export default function Page() {
  return (
    <SeoLanding
      titleH1="Location courte durée en Guadeloupe"
      cityName="Guadeloupe"
      intro="Réservez une location courte durée en Guadeloupe : nuit, semaine ou mois. Paiement sécurisé et réservation en ligne."
      faq={[
        {
          q: "Peut-on réserver à la nuit en Guadeloupe ?",
          a: "Oui, selon les annonces disponibles.",
        },
        {
          q: "Quelles villes sont les plus recherchées ?",
          a: "Pointe-à-Pitre et Les Abymes.",
        },
      ]}
      backHref="/location-guadeloupe"
      backLabel="← Retour Guadeloupe"
    >
      <section className="bl-card" style={{ padding: 16, marginTop: 16 }}>
        <h2 style={{ fontWeight: 900 }}>Locations par ville</h2>
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
        </ul>
      </section>
    </SeoLanding>
  );
}
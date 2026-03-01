import type { Metadata } from "next";
import Link from "next/link";
import SeoLanding from "@/components/SeoLanding";

export const metadata: Metadata = {
  title: "Location aux Abymes en Guadeloupe | Studios & Maisons | Lightbooker",
  description:
    "Location aux Abymes : nuit, semaine ou mois. Studios, appartements et maisons disponibles. Réservation en ligne sécurisée.",
};

export default function Page() {
  return (
    <SeoLanding
      titleH1="Location aux Abymes"
      cityName="Les Abymes"
      intro="Découvrez les logements disponibles aux Abymes pour un court ou moyen séjour."
      faq={[
        { q: "Peut-on réserver à la semaine ?", a: "Oui, selon les annonces publiées." },
      ]}
      backHref="/location-guadeloupe"
      backLabel="← Retour Guadeloupe"
    >
      <section className="bl-card" style={{ padding: 16, marginTop: 16 }}>
        <h2 style={{ fontWeight: 900 }}>Explorer la Guadeloupe</h2>
        <ul style={{ marginTop: 10, lineHeight: 1.9, paddingLeft: 18 }}>
          <li>
            <Link className="bl-link" href="/location-pointe-a-pitre">
              Location à Pointe-à-Pitre
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
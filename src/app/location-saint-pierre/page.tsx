import type { Metadata } from "next";
import Link from "next/link";
import SeoLanding from "@/components/SeoLanding";

export const metadata: Metadata = {
  title: "Location à Saint-Pierre (La Réunion) | Studios & Maisons | Lightbooker",
  description:
    "Location à Saint-Pierre : nuit, semaine ou mois. Studios, appartements et maisons disponibles. Réservation en ligne sécurisée.",
};

export default function Page() {
  return (
    <SeoLanding
      titleH1="Location à Saint-Pierre"
      cityName="Saint-Pierre"
      intro="Découvrez les logements disponibles à Saint-Pierre pour un court ou moyen séjour."
      faq={[{ q: "Peut-on réserver à la semaine ?", a: "Oui, selon les annonces publiées." }]}
      backHref="/location-reunion"
      backLabel="← Retour La Réunion"
    >
      <section className="bl-card" style={{ padding: 16, marginTop: 16 }}>
        <h2 style={{ fontWeight: 900 }}>Explorer La Réunion</h2>
        <ul style={{ marginTop: 10, lineHeight: 1.9, paddingLeft: 18 }}>
          <li>
            <Link className="bl-link" href="/location-saint-denis">
              Location à Saint-Denis
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
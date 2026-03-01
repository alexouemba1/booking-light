import type { Metadata } from "next";
import Link from "next/link";
import SeoLanding from "@/components/SeoLanding";

export const metadata: Metadata = {
  title: "Location courte durée à La Réunion | Saint-Denis & Saint-Pierre | Lightbooker",
  description:
    "Location courte durée à La Réunion : studios, appartements et maisons à Saint-Denis et Saint-Pierre. Nuit, semaine ou mois. Réservation en ligne sécurisée.",
};

export default function Page() {
  return (
    <SeoLanding
      titleH1="Location courte durée à La Réunion"
      cityName="Réunion"
      intro="Réservez une location courte durée à La Réunion : nuit, semaine ou mois. Paiement sécurisé et réservation en ligne."
      faq={[
        { q: "Peut-on réserver à la nuit ?", a: "Oui, selon les annonces disponibles." },
        { q: "Quelles villes sont les plus recherchées ?", a: "Saint-Denis et Saint-Pierre." },
      ]}
      backHref="/location-reunion"
      backLabel="← Retour La Réunion"
    >
      <section className="bl-card" style={{ padding: 16, marginTop: 16 }}>
        <h2 style={{ fontWeight: 900 }}>Locations par ville</h2>
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
        </ul>
      </section>
    </SeoLanding>
  );
}
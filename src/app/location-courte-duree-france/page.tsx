import type { Metadata } from "next";
import Link from "next/link";
import SeoLanding from "@/components/SeoLanding";

export const metadata: Metadata = {
  title: "Location courte durée en France | Paris, Marseille, Lyon | Lightbooker",
  description:
    "Location courte durée en France : studios, appartements et maisons à Paris, Marseille et Lyon. Nuit, semaine ou mois. Réservation en ligne sécurisée.",
};

export default function Page() {
  return (
    <SeoLanding
      titleH1="Location courte durée en France"
      cityName="France"
      intro="Réservez une location courte durée en France : nuit, semaine ou mois. Paiement sécurisé et réservation en ligne."
      faq={[
        { q: "Peut-on réserver à la nuit ?", a: "Oui, selon les annonces disponibles." },
        { q: "Quelles villes sont les plus recherchées ?", a: "Paris, Marseille et Lyon." },
        { q: "Le paiement est-il sécurisé ?", a: "Oui, le paiement s’effectue en ligne au moment de réserver." },
      ]}
      backHref="/location-france"
      backLabel="← Retour France"
    >
      <section className="bl-card" style={{ padding: 16, marginTop: 16 }}>
        <h2 style={{ fontWeight: 900 }}>Locations par ville</h2>
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
        </ul>
      </section>
    </SeoLanding>
  );
}
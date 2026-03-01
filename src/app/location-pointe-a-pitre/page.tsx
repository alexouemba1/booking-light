import type { Metadata } from "next";
import Link from "next/link";
import SeoLanding from "@/components/SeoLanding";

export const metadata: Metadata = {
  title: "Location à Pointe-à-Pitre en Guadeloupe | Studios & Appartements | Lightbooker",
  description:
    "Trouvez une location à Pointe-à-Pitre : studios, appartements et maisons. Nuit, semaine ou mois. Réservation en ligne sécurisée.",
};

export default function Page() {
  return (
    <SeoLanding
      titleH1="Location à Pointe-à-Pitre"
      cityName="Pointe-à-Pitre"
      intro="Studios, appartements et maisons disponibles à Pointe-à-Pitre. Réservation simple et paiement sécurisé."
      faq={[
        { q: "Peut-on louer pour un court séjour ?", a: "Oui, selon les disponibilités des annonces." },
      ]}
      backHref="/location-guadeloupe"
      backLabel="← Retour Guadeloupe"
    >
      <section className="bl-card" style={{ padding: 16, marginTop: 16 }}>
        <h2 style={{ fontWeight: 900 }}>Explorer la Guadeloupe</h2>
        <ul style={{ marginTop: 10, lineHeight: 1.9, paddingLeft: 18 }}>
          <li>
            <Link className="bl-link" href="/location-les-abymes">
              Location aux Abymes
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
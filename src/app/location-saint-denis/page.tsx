import type { Metadata } from "next";
import Link from "next/link";
import SeoLanding from "@/components/SeoLanding";

export const metadata: Metadata = {
  title: "Location à Saint-Denis (La Réunion) | Studios & Appartements | Lightbooker",
  description:
    "Trouvez une location à Saint-Denis : studios, appartements et maisons. Nuit, semaine ou mois. Réservation en ligne sécurisée.",
};

export default function Page() {
  return (
    <SeoLanding
      titleH1="Location à Saint-Denis"
      cityName="Saint-Denis"
      intro="Studios, appartements et maisons disponibles à Saint-Denis. Réservation simple et paiement sécurisé."
      faq={[{ q: "Peut-on louer pour un court séjour ?", a: "Oui, selon les disponibilités des annonces." }]}
      backHref="/location-reunion"
      backLabel="← Retour La Réunion"
    >
      <section className="bl-card" style={{ padding: 16, marginTop: 16 }}>
        <h2 style={{ fontWeight: 900 }}>Explorer La Réunion</h2>
        <ul style={{ marginTop: 10, lineHeight: 1.9, paddingLeft: 18 }}>
          <li>
            <Link className="bl-link" href="/location-saint-pierre">
              Location à Saint-Pierre
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
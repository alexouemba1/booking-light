import type { Metadata } from "next";
import Link from "next/link";
import SeoLanding from "@/components/SeoLanding";

export const metadata: Metadata = {
  title: "Location à Lyon | Studios & Appartements | Lightbooker",
  description:
    "Trouvez une location à Lyon : studios, appartements et maisons. Nuit, semaine ou mois. Réservation en ligne sécurisée.",
};

export default function Page() {
  return (
    <SeoLanding
      titleH1="Location à Lyon"
      cityName="Lyon"
      intro="Studios, appartements et maisons disponibles à Lyon. Réservation simple et paiement sécurisé."
      faq={[
        { q: "Peut-on louer à Lyon pour un court séjour ?", a: "Oui, selon les annonces disponibles." },
        { q: "Quels logements trouve-t-on à Lyon ?", a: "Studios, appartements et parfois maisons selon les annonces." },
      ]}
      backHref="/location-france"
      backLabel="← Retour France"
    >
      <section className="bl-card" style={{ padding: 16, marginTop: 16 }}>
        <h2 style={{ fontWeight: 900 }}>Explorer la France</h2>
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
            <Link className="bl-link" href="/location-courte-duree-france">
              Location courte durée en France
            </Link>
          </li>
        </ul>
      </section>
    </SeoLanding>
  );
}
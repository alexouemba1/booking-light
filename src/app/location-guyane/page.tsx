import type { Metadata } from "next";
import Link from "next/link";
import SeoLanding from "@/components/SeoLanding";

export const metadata: Metadata = {
  title: "Location en Guyane (Cayenne, Kourou, Saint-Laurent) | Lightbooker",
  description:
    "Location en Guyane : appartements, studios et maisons à Cayenne, Kourou et Saint-Laurent-du-Maroni. Nuit, semaine ou mois. Réservation en ligne et paiement sécurisé.",
};

export default function Page() {
  return (
    <SeoLanding
      titleH1="Location d’appartements et maisons en Guyane"
      cityName="Guyane"
      intro="Trouvez une location en Guyane pour une nuit, une semaine ou un mois : studios, appartements et maisons, notamment à Cayenne, Kourou et Saint-Laurent-du-Maroni. Réservation en ligne et paiement sécurisé."
      faq={[
        {
          q: "Peut-on réserver un séjour court en Guyane ?",
          a: "Oui, certains logements sont disponibles à la nuit ou à la semaine selon les annonces publiées.",
        },
        {
          q: "Comment se passe le paiement ?",
          a: "Le paiement s’effectue en ligne de manière sécurisée au moment de la réservation.",
        },
        {
          q: "Quels types de logements sont proposés en Guyane ?",
          a: "Studios, appartements et maisons meublées selon les disponibilités des propriétaires.",
        },
        {
          q: "Quelles sont les principales villes pour louer en Guyane ?",
          a: "Les recherches se concentrent principalement sur Cayenne, Kourou et Saint-Laurent-du-Maroni.",
        },
      ]}
      backHref="/villes/guyane"
      backLabel="Voir la page territoire"
    >
      {/* Bloc SEO principal */}
      <section className="bl-card" style={{ padding: 16, marginTop: 16 }}>
        <h2 style={{ fontWeight: 900 }}>Location courte durée en Guyane</h2>

        <p style={{ marginTop: 10, opacity: 0.9, lineHeight: 1.65 }}>
          Vous cherchez une solution flexible pour un séjour professionnel, une mission temporaire
          ou un déplacement ponctuel ? Découvrez notre page dédiée à la{" "}
          <Link className="bl-link" href="/location-courte-duree-guyane">
            location courte durée en Guyane
          </Link>
          , regroupant les annonces disponibles à Cayenne, Kourou et
          Saint-Laurent-du-Maroni.
        </p>
      </section>

      {/* Liens internes */}
      <section className="bl-card" style={{ padding: 16, marginTop: 16 }}>
        <h2 style={{ fontWeight: 900 }}>Locations par ville en Guyane</h2>

        <ul style={{ marginTop: 10, lineHeight: 1.9, paddingLeft: 18 }}>
          <li>
            <Link className="bl-link" href="/location-cayenne">
              Location à Cayenne
            </Link>
          </li>
          <li>
            <Link className="bl-link" href="/location-kourou">
              Location à Kourou
            </Link>
          </li>
          <li>
            <Link className="bl-link" href="/location-saint-laurent-du-maroni">
              Location à Saint-Laurent-du-Maroni
            </Link>
          </li>
          <li>
            <Link className="bl-link" href="/location-courte-duree-guyane">
              Location courte durée en Guyane
            </Link>
          </li>
        </ul>
      </section>
    </SeoLanding>
  );
}
import type { Metadata } from "next";
import Link from "next/link";
import SeoLanding from "@/components/SeoLanding";

export const metadata: Metadata = {
  title: "Location en Guyane (Cayenne, Kourou, Saint-Laurent) | Lightbooker",
  description:
    "Location courte durée en Guyane : appartements, studios et maisons à Cayenne, Kourou et Saint-Laurent-du-Maroni. Nuit, semaine ou mois. Réservation en ligne et paiement sécurisé.",
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
      <section className="bl-card" style={{ padding: 16, marginTop: 16 }}>
        <h2 style={{ fontWeight: 900 }}>Pourquoi choisir une location courte durée en Guyane ?</h2>

        <p style={{ marginTop: 10, lineHeight: 1.65, opacity: 0.9 }}>
          La location courte durée en Guyane est idéale pour les séjours professionnels, les missions
          temporaires, les déplacements liés au Centre Spatial Guyanais à Kourou, ou encore pour des
          séjours touristiques autour de Cayenne et des zones naturelles amazoniennes. En choisissant une
          durée flexible (nuit, semaine ou mois), vous adaptez votre logement à votre agenda sans contraintes.
        </p>

        <p style={{ marginTop: 10, lineHeight: 1.65, opacity: 0.9 }}>
          Pour un séjour pratique, un studio meublé peut suffire. Pour plus de confort, un appartement est
          souvent un bon compromis. Et si vous voyagez en famille ou recherchez plus d’autonomie, une maison
          peut être la meilleure option. L’important est de choisir un logement proche de vos besoins
          (centre-ville, axes principaux, quartiers calmes, etc.).
        </p>
      </section>

      <section className="bl-card" style={{ padding: 16, marginTop: 16 }}>
        <h2 style={{ fontWeight: 900 }}>Locations par ville en Guyane</h2>

        <p style={{ marginTop: 10, opacity: 0.9, lineHeight: 1.65 }}>
          Pour affiner votre recherche, découvrez aussi nos pages dédiées :
        </p>

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
        </ul>
      </section>
    </SeoLanding>
  );
}
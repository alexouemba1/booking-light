import type { Metadata } from "next";
import Link from "next/link";
import SeoLanding from "@/components/SeoLanding";

export const metadata: Metadata = {
  title: "Location courte durée en Guyane | Cayenne, Kourou, Saint-Laurent | Lightbooker",
  description:
    "Location courte durée en Guyane : studios, appartements et maisons à Cayenne, Kourou et Saint-Laurent-du-Maroni. Nuit, semaine ou mois. Réservation en ligne et paiement sécurisé.",
};

export default function Page() {
  return (
    <SeoLanding
      titleH1="Location courte durée en Guyane"
      cityName="Guyane"
      intro="Trouvez une location courte durée en Guyane : nuit, semaine ou mois. Studios, appartements et maisons, notamment à Cayenne, Kourou et Saint-Laurent-du-Maroni. Réservation en ligne et paiement sécurisé."
      faq={[
        {
          q: "Peut-on réserver une location courte durée en Guyane ?",
          a: "Oui. Selon les annonces, vous pouvez réserver à la nuit, à la semaine ou au mois.",
        },
        {
          q: "Quelles villes sont les plus recherchées en Guyane ?",
          a: "Les recherches se concentrent surtout sur Cayenne, Kourou et Saint-Laurent-du-Maroni.",
        },
        {
          q: "Quels types de logements peut-on trouver ?",
          a: "Studios, appartements et maisons meublées, selon les disponibilités des propriétaires.",
        },
        {
          q: "Le paiement est-il sécurisé ?",
          a: "Oui, le paiement s’effectue en ligne de manière sécurisée au moment de la réservation.",
        },
      ]}
      backHref="/location-guyane"
      backLabel="← Retour à la page Guyane"
    >
      {/* Bloc SEO principal */}
      <section className="bl-card" style={{ padding: 16, marginTop: 16 }}>
        <h2 style={{ fontWeight: 900 }}>Trouver une location courte durée en Guyane</h2>

        <p style={{ marginTop: 10, opacity: 0.9, lineHeight: 1.65 }}>
          La <strong>location courte durée en Guyane</strong> est une solution idéale pour les séjours
          professionnels, missions temporaires, déplacements ponctuels ou voyages touristiques. Que vous
          cherchiez un logement pour quelques nuits, une semaine ou un mois, Lightbooker vous aide à trouver
          une option adaptée avec une réservation simple et un paiement sécurisé.
        </p>

        <p style={{ marginTop: 10, opacity: 0.9, lineHeight: 1.65 }}>
          Les zones les plus demandées se situent autour de <strong>Cayenne</strong>, <strong>Kourou</strong>{" "}
          et <strong>Saint-Laurent-du-Maroni</strong>. Selon votre besoin, vous pouvez choisir un studio
          pratique, un appartement confortable, ou une maison offrant plus d’autonomie.
        </p>

        <p style={{ marginTop: 10, opacity: 0.9, lineHeight: 1.65 }}>
          Pour maximiser vos chances, précisez vos dates, votre budget, la durée souhaitée (nuit / semaine /
          mois) et le type de logement recherché. Une légère flexibilité sur les dates ou la durée peut
          augmenter le nombre d’annonces disponibles.
        </p>
      </section>

      {/* Liens internes : page pilier -> villes */}
      <section className="bl-card" style={{ padding: 16, marginTop: 16 }}>
        <h2 style={{ fontWeight: 900 }}>Locations courte durée par ville</h2>

        <p style={{ marginTop: 10, opacity: 0.9, lineHeight: 1.65 }}>
          Pour affiner votre recherche, consultez nos pages dédiées :
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
          <li>
            <Link className="bl-link" href="/location-guyane">
              Toutes les locations en Guyane
            </Link>
          </li>
        </ul>
      </section>
    </SeoLanding>
  );
}
import type { Metadata } from "next";
import Link from "next/link";
import SeoLanding from "@/components/SeoLanding";

export const metadata: Metadata = {
  title: "Location à Kourou | Court séjour & meublés | Lightbooker",
  description:
    "Trouvez une location à Kourou : studios, appartements et maisons. Nuit, semaine ou mois. Réservation en ligne et paiement sécurisé avec Lightbooker.",
};

export default function Page() {
  return (
    <SeoLanding
      titleH1="Location à Kourou"
      cityName="Kourou"
      intro="Trouvez une location à Kourou pour une nuit, une semaine ou un mois : studios, appartements et maisons. Réservation en ligne et paiement sécurisé."
      faq={[
        {
          q: "Peut-on trouver des locations courte durée à Kourou ?",
          a: "Oui, certaines annonces permettent la réservation à la nuit ou à la semaine, et parfois au mois.",
        },
        {
          q: "Quels logements sont disponibles à Kourou ?",
          a: "Studios, appartements et maisons selon les annonces publiées par les propriétaires.",
        },
        {
          q: "Le paiement est-il sécurisé ?",
          a: "Oui, le paiement s’effectue en ligne de manière sécurisée lors de la réservation.",
        },
        {
          q: "Pourquoi Kourou est une zone recherchée ?",
          a: "Kourou est un secteur dynamique, recherché selon les périodes, notamment pour les séjours pro et missions temporaires.",
        },
      ]}
      backHref="/location-guyane"
      backLabel="← Retour à la page Guyane"
    >
      {/* Bloc SEO */}
      <section className="bl-card" style={{ padding: 16 }}>
        <h2 style={{ fontWeight: 900 }}>Louer un logement à Kourou</h2>

        <p style={{ marginTop: 10, opacity: 0.9, lineHeight: 1.65 }}>
          Une <strong>location à Kourou</strong> est souvent recherchée pour les séjours temporaires,
          missions professionnelles et déplacements ponctuels. Le format “nuit / semaine / mois” permet
          de s’adapter à votre planning sans engagement long.
        </p>

        <p style={{ marginTop: 10, opacity: 0.9, lineHeight: 1.65 }}>
          Pour optimiser votre recherche, précisez vos dates, le nombre de voyageurs et le type de
          logement (studio, appartement ou maison). Si vous êtes flexible, élargir la durée (ex : semaine
          au lieu de nuit) peut augmenter les options disponibles.
        </p>

        <p style={{ marginTop: 10, opacity: 0.9, lineHeight: 1.65 }}>
          Pour une vue d’ensemble du territoire, consultez{" "}
          <Link className="bl-link" href="/location-guyane">
            Location en Guyane
          </Link>
          .
        </p>
      </section>

      {/* Bloc premium 1 */}
      <section className="bl-card" style={{ padding: 16, marginTop: 16 }}>
        <h2 style={{ fontWeight: 900 }}>Pourquoi louer un logement à Kourou ?</h2>

        <p style={{ marginTop: 10, lineHeight: 1.65, opacity: 0.9 }}>
          Kourou est une ville stratégique en Guyane, avec des périodes de forte demande liées aux
          activités locales et aux déplacements professionnels. Une <strong>location à Kourou</strong> peut
          être idéale pour une mission temporaire, un séjour pro, ou un besoin de logement flexible.
        </p>

        <p style={{ marginTop: 10, lineHeight: 1.65, opacity: 0.9 }}>
          La <strong>location courte durée à Kourou</strong> permet de rester proche de vos points d’intérêt
          tout en gardant une organisation simple : réserver en ligne, payer de façon sécurisée, et adapter
          votre séjour selon votre planning.
        </p>
      </section>

      {/* Bloc premium 2 */}
      <section className="bl-card" style={{ padding: 16, marginTop: 16 }}>
        <h2 style={{ fontWeight: 900 }}>Conseils pour une location meublée à Kourou</h2>

        <p style={{ marginTop: 10, lineHeight: 1.65, opacity: 0.9 }}>
          Pour les séjours professionnels, privilégiez un logement meublé avec un bon niveau de confort
          (couchage, cuisine, espace de travail). Indiquez clairement vos dates et votre durée, et gardez
          une marge de flexibilité : cela augmente les chances de trouver une annonce disponible.
        </p>

        <p style={{ marginTop: 10, lineHeight: 1.65, opacity: 0.9 }}>
          Vous pouvez aussi consulter{" "}
          <Link className="bl-link" href="/location-cayenne">
            Location à Cayenne
          </Link>{" "}
          si vous cherchez une alternative proche, ou revenir sur{" "}
          <Link className="bl-link" href="/location-guyane">
            la page Guyane
          </Link>{" "}
          pour voir toutes les annonces du territoire.
        </p>
      </section>
      <section className="bl-card" style={{ padding: 16, marginTop: 16 }}>
  <h2 style={{ fontWeight: 900 }}>Explorer la Guyane</h2>

  <p style={{ marginTop: 10, opacity: 0.9, lineHeight: 1.65 }}>
    Continuez votre recherche :
  </p>

  <ul style={{ marginTop: 10, lineHeight: 1.9, paddingLeft: 18 }}>
    <li>
      <Link className="bl-link" href="/location-guyane">Toutes les locations en Guyane</Link>
    </li>
    <li>
      <Link className="bl-link" href="/location-cayenne">Location à Cayenne</Link>
    </li>
    <li>
      <Link className="bl-link" href="/location-saint-laurent-du-maroni">Location à Saint-Laurent-du-Maroni</Link>
    </li>
  </ul>
</section>
    </SeoLanding>
  );
}
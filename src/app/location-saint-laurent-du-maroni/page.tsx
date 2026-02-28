import type { Metadata } from "next";
import Link from "next/link";
import SeoLanding from "@/components/SeoLanding";

export const metadata: Metadata = {
  title: "Location à Saint-Laurent-du-Maroni | Meublés & maisons | Lightbooker",
  description:
    "Trouvez une location à Saint-Laurent-du-Maroni : studios, appartements et maisons. Nuit, semaine ou mois. Réservation en ligne et paiement sécurisé avec Lightbooker.",
};

export default function Page() {
  return (
    <SeoLanding
      titleH1="Location à Saint-Laurent-du-Maroni"
      cityName="Saint-Laurent-du-Maroni"
      intro="Trouvez une location à Saint-Laurent-du-Maroni pour une nuit, une semaine ou un mois : studios, appartements et maisons. Réservation en ligne et paiement sécurisé."
      faq={[
        {
          q: "Peut-on louer à Saint-Laurent-du-Maroni pour une courte durée ?",
          a: "Oui, selon les annonces, la réservation peut être possible à la nuit, à la semaine ou au mois.",
        },
        {
          q: "Quels types de logements trouve-t-on sur place ?",
          a: "Studios, appartements et maisons meublées selon les disponibilités des propriétaires.",
        },
        {
          q: "Comment se passe le paiement ?",
          a: "Le paiement s’effectue en ligne de manière sécurisée au moment de la réservation.",
        },
        {
          q: "Saint-Laurent-du-Maroni est-il un secteur important ?",
          a: "Oui, c’est une zone clé de l’ouest guyanais, utile pour des séjours et missions locales.",
        },
      ]}
      backHref="/location-guyane"
      backLabel="← Retour à la page Guyane"
    >
      {/* Bloc SEO */}
      <section className="bl-card" style={{ padding: 16 }}>
        <h2 style={{ fontWeight: 900 }}>Louer un logement à Saint-Laurent-du-Maroni</h2>

        <p style={{ marginTop: 10, opacity: 0.9, lineHeight: 1.65 }}>
          Une <strong>location à Saint-Laurent-du-Maroni</strong> peut convenir pour une mission temporaire,
          un déplacement pro, ou un séjour plus long dans l’ouest de la Guyane. Les logements disponibles
          varient selon les annonces : studios, appartements et maisons.
        </p>

        <p style={{ marginTop: 10, opacity: 0.9, lineHeight: 1.65 }}>
          Pour gagner du temps, indiquez vos dates, le nombre de voyageurs et votre durée souhaitée
          (nuit, semaine ou mois). Une recherche plus flexible peut vous donner accès à davantage d’options.
        </p>

        <p style={{ marginTop: 10, opacity: 0.9, lineHeight: 1.65 }}>
          Pour voir les annonces regroupées par territoire, consultez{" "}
          <Link className="bl-link" href="/location-guyane">
            Location en Guyane
          </Link>
          .
        </p>
      </section>

      {/* Bloc premium 1 */}
      <section className="bl-card" style={{ padding: 16, marginTop: 16 }}>
        <h2 style={{ fontWeight: 900 }}>Pourquoi louer à Saint-Laurent-du-Maroni ?</h2>

        <p style={{ marginTop: 10, lineHeight: 1.65, opacity: 0.9 }}>
          Saint-Laurent-du-Maroni est une ville majeure de l’ouest guyanais. Elle peut être un point de
          chute stratégique pour des missions locales, des déplacements professionnels ou un séjour de
          plusieurs semaines. Une <strong>location courte durée à Saint-Laurent-du-Maroni</strong> permet
          de rester flexible tout en gardant le confort d’un logement meublé.
        </p>

        <p style={{ marginTop: 10, lineHeight: 1.65, opacity: 0.9 }}>
          Selon votre projet, vous pouvez opter pour un studio pratique, un appartement confortable ou une
          maison offrant plus d’autonomie. L’essentiel : choisir un logement adapté à votre durée et à vos
          besoins sur place.
        </p>
      </section>

      {/* Bloc premium 2 */}
      <section className="bl-card" style={{ padding: 16, marginTop: 16 }}>
        <h2 style={{ fontWeight: 900 }}>Conseils pour trouver une location meublée</h2>

        <p style={{ marginTop: 10, lineHeight: 1.65, opacity: 0.9 }}>
          Pour améliorer vos résultats, précisez vos dates et votre durée (nuit, semaine ou mois). Si vous
          êtes flexible, élargir légèrement la période peut aider à trouver une annonce disponible. Pour
          un séjour pro, privilégiez un logement meublé avec un bon niveau d’équipement.
        </p>

        <p style={{ marginTop: 10, lineHeight: 1.65, opacity: 0.9 }}>
          Vous pouvez aussi consulter{" "}
          <Link className="bl-link" href="/location-cayenne">
            Location à Cayenne
          </Link>{" "}
          ou{" "}
          <Link className="bl-link" href="/location-kourou">
            Location à Kourou
          </Link>{" "}
          si vous cherchez une alternative, ou revenir sur{" "}
          <Link className="bl-link" href="/location-guyane">
            la page Guyane
          </Link>{" "}
          pour voir l’ensemble des annonces.
        </p>
      </section>
    </SeoLanding>
  );
}
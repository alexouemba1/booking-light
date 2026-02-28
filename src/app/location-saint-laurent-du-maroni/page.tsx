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
          Une <strong>location à Saint-Laurent-du-Maroni</strong> peut convenir pour une mission
          temporaire, un déplacement pro ou un séjour plus long dans l’ouest de la Guyane. Les logements
          disponibles varient selon les annonces : studios, appartements et maisons.
        </p>

        <p style={{ marginTop: 10, opacity: 0.9, lineHeight: 1.65 }}>
          Pour gagner du temps, indiquez vos dates, le nombre de voyageurs et votre durée souhaitée
          (nuit, semaine ou mois). Une recherche plus flexible peut vous donner accès à davantage
          d’options.
        </p>

        <p style={{ marginTop: 10, opacity: 0.9, lineHeight: 1.65 }}>
          Pour voir les annonces regroupées par territoire, consultez{" "}
          <Link className="bl-link" href="/location-guyane">
            Location en Guyane
          </Link>
          .
        </p>
      </section>
    </SeoLanding>
  );
}
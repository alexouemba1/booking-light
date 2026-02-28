import type { Metadata } from "next";
import Link from "next/link";
import SeoLanding from "@/components/SeoLanding";

export const metadata: Metadata = {
  title: "Location à Cayenne | Appartements & maisons | Lightbooker",
  description:
    "Trouvez une location à Cayenne : studios, appartements et maisons. Nuit, semaine ou mois. Réservation en ligne et paiement sécurisé avec Lightbooker.",
};

export default function Page() {
  return (
    <SeoLanding
      titleH1="Location à Cayenne"
      cityName="Cayenne"
      intro="Trouvez une location à Cayenne pour une nuit, une semaine ou un mois : studios, appartements et maisons. Réservation en ligne et paiement sécurisé."
      faq={[
        {
          q: "Peut-on louer à Cayenne pour une courte durée ?",
          a: "Oui, selon les annonces, vous pouvez réserver à la nuit, à la semaine ou au mois.",
        },
        {
          q: "Quels types de logements trouve-t-on à Cayenne ?",
          a: "Principalement des studios, appartements et maisons, selon les disponibilités des propriétaires.",
        },
        {
          q: "Comment se passe la réservation ?",
          a: "La réservation se fait en ligne et le paiement est sécurisé au moment de valider votre séjour.",
        },
        {
          q: "Cayenne est-elle un bon point de départ en Guyane ?",
          a: "Oui, Cayenne est une base pratique avec de nombreux services et accès vers les zones clés du territoire.",
        },
      ]}
      backHref="/location-guyane"
      backLabel="← Retour à la page Guyane"
    >
      {/* Bloc SEO */}
      <section className="bl-card" style={{ padding: 16 }}>
        <h2 style={{ fontWeight: 900 }}>Louer un logement à Cayenne</h2>

        <p style={{ marginTop: 10, opacity: 0.9, lineHeight: 1.65 }}>
          Cayenne est la principale ville de Guyane et un secteur très recherché pour les séjours
          professionnels comme touristiques. Une <strong>location à Cayenne</strong> peut convenir pour
          quelques nuits, une semaine ou un mois, selon vos besoins et votre rythme.
        </p>

        <p style={{ marginTop: 10, opacity: 0.9, lineHeight: 1.65 }}>
          Pour un séjour pratique, un <strong>studio</strong> meublé est souvent un bon choix. Pour plus
          d’espace, un <strong>appartement</strong> peut offrir davantage de confort. Et si vous voyagez
          à plusieurs, une <strong>maison</strong> permet plus d’autonomie.
        </p>

        <p style={{ marginTop: 10, opacity: 0.9, lineHeight: 1.65 }}>
          Vous cherchez aussi ailleurs en Guyane ? Consultez la page{" "}
          <Link className="bl-link" href="/location-guyane">
            Location en Guyane
          </Link>{" "}
          pour voir les annonces regroupées par territoire.
        </p>
      </section>

      {/* Bloc premium 1 */}
      <section className="bl-card" style={{ padding: 16, marginTop: 16 }}>
        <h2 style={{ fontWeight: 900 }}>Pourquoi louer un logement à Cayenne ?</h2>

        <p style={{ marginTop: 10, lineHeight: 1.65, opacity: 0.9 }}>
          Cayenne est le cœur administratif et économique de la Guyane. Une <strong>location à Cayenne</strong>{" "}
          permet d’être proche des services, commerces, administrations et zones professionnelles.
        </p>

        <p style={{ marginTop: 10, lineHeight: 1.65, opacity: 0.9 }}>
          Que ce soit pour un séjour professionnel, une mission temporaire, un déplacement lié aux institutions
          locales ou un séjour touristique, la <strong>location courte durée à Cayenne</strong> offre une solution
          flexible adaptée aux rythmes modernes.
        </p>
      </section>

      {/* Bloc premium 2 */}
      <section className="bl-card" style={{ padding: 16, marginTop: 16 }}>
        <h2 style={{ fontWeight: 900 }}>Quartiers et zones recherchées à Cayenne</h2>

        <p style={{ marginTop: 10, lineHeight: 1.65, opacity: 0.9 }}>
          Les recherches se concentrent souvent autour du centre-ville, des zones résidentielles calmes et des
          secteurs proches des axes principaux. Selon votre besoin, privilégiez la proximité avec votre lieu de
          travail ou un environnement plus résidentiel.
        </p>

        <p style={{ marginTop: 10, lineHeight: 1.65, opacity: 0.9 }}>
          Pour élargir votre recherche à tout le territoire, consultez également{" "}
          <Link className="bl-link" href="/location-guyane">
            Location en Guyane
          </Link>
          .
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
      <Link className="bl-link" href="/location-kourou">Location à Kourou</Link>
    </li>
    <li>
      <Link className="bl-link" href="/location-saint-laurent-du-maroni">Location à Saint-Laurent-du-Maroni</Link>
    </li>
  </ul>
</section>
    </SeoLanding>
  );
}
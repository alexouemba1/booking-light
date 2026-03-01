import type { Metadata } from "next";
import Link from "next/link";
import SeoLanding from "@/components/SeoLanding";

export const metadata: Metadata = {
  title: "Location en Martinique | Fort-de-France, Lamentin | Lightbooker",
  description:
    "Location en Martinique : studios, appartements et maisons à Fort-de-France, Le Lamentin et dans toute l’île. Nuit, semaine ou mois. Paiement sécurisé et réservation en ligne.",
};

export default function Page() {
  return (
    <SeoLanding
      titleH1="Location en Martinique"
      cityName="Martinique"
      intro="Trouvez une location en Martinique pour une nuit, une semaine ou un mois : studios, appartements et maisons, notamment à Fort-de-France et au Lamentin. Paiement sécurisé et réservation en ligne."
      faq={[
        {
          q: "Peut-on réserver pour les vacances en Martinique ?",
          a: "Oui, vous pouvez réserver selon les disponibilités affichées par les propriétaires.",
        },
        {
          q: "Y a-t-il des locations à la nuit ?",
          a: "Oui, certains logements peuvent être disponibles à la nuit selon l’annonce.",
        },
        {
          q: "Quels logements sont disponibles ?",
          a: "Studios, appartements et maisons selon les annonces publiées.",
        },
      ]}
      backHref="/villes/martinique"
      backLabel="Voir la page territoire"
    >
      {/* Lien vers la page pilier "courte durée" */}
      <section className="bl-card" style={{ padding: 16, marginTop: 16 }}>
        <h2 style={{ fontWeight: 900 }}>Location courte durée en Martinique</h2>
        <p style={{ marginTop: 10, opacity: 0.9, lineHeight: 1.65 }}>
          Pour un séjour flexible (nuit, semaine ou mois), consultez aussi notre page dédiée :{" "}
          <Link className="bl-link" href="/location-courte-duree-martinique">
            location courte durée en Martinique
          </Link>
          .
        </p>
      </section>

      {/* Liens internes vers les villes */}
      <section className="bl-card" style={{ padding: 16, marginTop: 16 }}>
        <h2 style={{ fontWeight: 900 }}>Locations par ville en Martinique</h2>

        <ul style={{ marginTop: 10, lineHeight: 1.9, paddingLeft: 18 }}>
          <li>
            <Link className="bl-link" href="/location-fort-de-france">
              Location à Fort-de-France
            </Link>
          </li>
          <li>
            <Link className="bl-link" href="/location-le-lamentin">
              Location au Lamentin
            </Link>
          </li>
          <li>
            <Link className="bl-link" href="/location-courte-duree-martinique">
              Location courte durée en Martinique
            </Link>
          </li>
        </ul>
      </section>
    </SeoLanding>
  );
}
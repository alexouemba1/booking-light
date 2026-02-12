import type { Metadata } from "next";
import SeoLanding from "@/components/SeoLanding";

export const metadata: Metadata = {
  title: "Location en Martinique | Réservez en ligne | LightBooker",
  description: "Trouvez une location en Martinique (nuit, semaine ou mois). Paiement sécurisé, réservation simple et annonces disponibles.",
};

export default function Page() {
  return (
    <SeoLanding
      titleH1="Location en Martinique"
      cityName="Martinique"
      intro="Réservez un logement en Martinique pour une nuit, une semaine ou un mois. Paiement sécurisé et réservation en ligne."
      faq={[
        { q: "Peut-on réserver pour les vacances en Martinique ?", a: "Oui, vous pouvez réserver selon les disponibilités affichées par les propriétaires." },
        { q: "Y a-t-il des locations à la nuit ?", a: "Oui, certains logements peuvent être disponibles à la nuit selon l’annonce." },
        { q: "Quels logements sont disponibles ?", a: "Studios, appartements et maisons selon les annonces publiées." },
      ]}
      backHref="/villes/martinique"
      backLabel="Voir la page territoire"
    />
  );
}
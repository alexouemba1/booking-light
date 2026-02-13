// FILE: src/app/location-weekend-paris/page.tsx
import type { Metadata } from "next";
import SeoLanding from "@/components/SeoLanding";

export const metadata: Metadata = {
  title: "Location week-end à Paris | Séjour 2 à 3 nuits",
  description:
    "Réservez une location week-end à Paris : studios, appartements et maisons. Paiement sécurisé, réservation simple et annonces disponibles.",
};

export default function Page() {
  return (
    <SeoLanding
      titleH1="Location week-end à Paris"
      cityName="Paris"
      intro="Trouvez une location à Paris pour un week-end (2 à 3 nuits). Réservation simple, paiement sécurisé et infos claires avant validation."
      faq={[
        { q: "Peut-on réserver seulement 2 nuits à Paris ?", a: "Oui, selon les annonces, certains logements sont réservables pour 2 à 3 nuits." },
        { q: "Y a-t-il des logements proches du centre ?", a: "Oui, cela dépend des annonces publiées. Vous pouvez trouver des logements dans différents quartiers." },
        { q: "Le paiement est-il sécurisé ?", a: "Oui, le paiement en ligne est sécurisé lors de la réservation." },
      ]}
      backHref="/villes/paris"
      backLabel="Voir la page ville"
    />
  );
}
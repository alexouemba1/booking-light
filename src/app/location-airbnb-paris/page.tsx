// FILE: src/app/location-airbnb-paris/page.tsx
import type { Metadata } from "next";
import SeoLanding from "@/components/SeoLanding";

export const metadata: Metadata = {
  title: "Alternative Airbnb à Paris | Location directe",
  description:
    "Alternative à Airbnb à Paris : réservez en direct studios, appartements et maisons. Paiement sécurisé, réservation simple et infos claires.",
};

export default function Page() {
  return (
    <SeoLanding
      titleH1="Alternative Airbnb à Paris"
      cityName="Paris"
      intro="Trouvez une alternative à Airbnb à Paris : location directe, paiement sécurisé et réservation simple."
      faq={[
        {
          q: "Pourquoi choisir une alternative à Airbnb à Paris ?",
          a: "Pour réserver en direct selon les annonces, avec des informations claires et un paiement sécurisé.",
        },
        {
          q: "Peut-on réserver pour une courte durée ?",
          a: "Oui, selon les annonces, vous pouvez réserver à la nuit, au week-end ou à la semaine.",
        },
        {
          q: "Quels logements trouve-t-on ?",
          a: "Studios, appartements et maisons selon les annonces publiées par les propriétaires.",
        },
      ]}
      backHref="/villes/paris"
      backLabel="Voir la page ville"
    />
  );
}
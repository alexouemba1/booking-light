import type { Metadata } from "next";
import SeoLanding from "@/components/SeoLanding";

export const metadata: Metadata = {
  title: "Location meublée à Paris | Appartement équipé | LightBooker",
  description:
    "Location meublée à Paris : appartements et logements équipés disponibles à la réservation en ligne.",
};

export default function Page() {
  return (
    <SeoLanding
      titleH1="Location meublée à Paris"
      cityName="Paris"
      intro="Réservez une location meublée à Paris pour un séjour confortable avec logement entièrement équipé."
      faq={[
        {
          q: "Les logements sont-ils entièrement équipés ?",
          a: "Oui, les locations meublées comprennent mobilier et équipements essentiels.",
        },
        {
          q: "Peut-on louer pour plusieurs mois ?",
          a: "Oui, selon les conditions de chaque annonce.",
        },
        {
          q: "Le paiement est-il sécurisé ?",
          a: "Oui, toutes les transactions sont sécurisées.",
        },
      ]}
    />
  );
}
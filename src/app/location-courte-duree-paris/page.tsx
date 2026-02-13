import type { Metadata } from "next";
import SeoLanding from "@/components/SeoLanding";

export const metadata: Metadata = {
  title: "Location courte durée à Paris | Séjour flexible | LightBooker",
  description:
    "Location courte durée à Paris : nuit, week-end ou semaine. Réservez facilement votre logement en ligne.",
};

export default function Page() {
  return (
    <SeoLanding
      titleH1="Location courte durée à Paris"
      cityName="Paris"
      intro="Trouvez un logement en location courte durée à Paris pour une nuit, un week-end ou plusieurs jours."
      faq={[
        {
          q: "Qu’est-ce qu’une location courte durée ?",
          a: "Il s'agit d’un logement réservé pour quelques nuits ou quelques semaines.",
        },
        {
          q: "Peut-on réserver pour un week-end ?",
          a: "Oui, selon les disponibilités affichées.",
        },
        {
          q: "Comment fonctionne la réservation ?",
          a: "Vous sélectionnez un logement et payez en ligne pour confirmer.",
        },
      ]}
    />
  );
}
import type { Metadata } from "next";
import SeoLanding from "@/components/SeoLanding";

export const metadata: Metadata = {
  title: "Location studio à Paris | Petit logement meublé | LightBooker",
  description:
    "Location de studio à Paris pour une nuit, une semaine ou un mois. Studio meublé disponible avec réservation en ligne.",
};

export default function Page() {
  return (
    <SeoLanding
      titleH1="Location studio à Paris"
      cityName="Paris"
      intro="Trouvez un studio à louer à Paris pour un séjour court ou longue durée. Logements meublés disponibles."
      faq={[
        {
          q: "Les studios sont-ils meublés ?",
          a: "Oui, la majorité des studios proposés sont entièrement meublés.",
        },
        {
          q: "Peut-on louer au mois ?",
          a: "Oui, certains studios sont disponibles pour plusieurs mois.",
        },
        {
          q: "Le paiement est-il sécurisé ?",
          a: "Oui, toutes les réservations sont sécurisées en ligne.",
        },
      ]}
    />
  );
}
import type { Metadata } from "next";
import SeoLanding from "@/components/SeoLanding";

export const metadata: Metadata = {
  title: "Location appartement à Paris | Réservez en ligne | LightBooker",
  description:
    "Trouvez un appartement à louer à Paris pour une nuit, une semaine ou un mois. Réservation simple et paiement sécurisé.",
};

export default function Page() {
  return (
    <SeoLanding
      titleH1="Location appartement à Paris"
      cityName="Paris"
      intro="Découvrez des appartements à louer à Paris pour une courte ou longue durée. Réservation en ligne avec paiement sécurisé."
      faq={[
        {
          q: "Peut-on louer un appartement à Paris à la nuit ?",
          a: "Oui, certains appartements sont disponibles à la nuit selon les annonces.",
        },
        {
          q: "Les appartements sont-ils meublés ?",
          a: "La majorité des appartements proposés sont entièrement meublés.",
        },
        {
          q: "Le paiement est-il sécurisé ?",
          a: "Oui, le paiement se fait en ligne de manière sécurisée.",
        },
      ]}
    />
  );
}
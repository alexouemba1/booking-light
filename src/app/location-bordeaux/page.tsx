import type { Metadata } from "next";
import SeoLanding from "@/components/SeoLanding";

export const metadata: Metadata = {
  title: "Location à Bordeaux | Réservez en ligne | LightBooker",
  description:
    "Trouvez une location à Bordeaux (nuit, semaine ou mois). Paiement sécurisé, réservation simple et annonces disponibles.",
};

export default function Page() {
  return (
    <SeoLanding
      titleH1="Location à Bordeaux"
      cityName="Bordeaux"
      intro="Découvrez des logements à Bordeaux pour une nuit, une semaine ou un mois. Réservation simple et paiement sécurisé."
      faq={[
        {
          q: "Peut-on réserver à la nuit à Bordeaux ?",
          a: "Oui, certains logements à Bordeaux sont disponibles à la nuit selon les annonces.",
        },
        {
          q: "Le paiement est-il sécurisé ?",
          a: "Oui, le paiement se fait en ligne de manière sécurisée au moment de la réservation.",
        },
        {
          q: "Quels types de logements sont proposés ?",
          a: "Studios, appartements et maisons selon les annonces publiées.",
        },
      ]}
      backHref="/villes/bordeaux"
      backLabel="Voir la page ville"
    />
  );
}
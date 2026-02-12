import type { Metadata } from "next";
import SeoLanding from "@/components/SeoLanding";

export const metadata: Metadata = {
  title: "Location à Marseille | Réservez en ligne | LightBooker",
  description: "Trouvez une location à Marseille (nuit, semaine ou mois). Paiement sécurisé, réservation simple et annonces disponibles.",
};

export default function Page() {
  return (
    <SeoLanding
      titleH1="Location à Marseille"
      cityName="Marseille"
      intro="Trouvez un logement à Marseille pour une nuit, une semaine ou un mois. Réservez en ligne avec paiement sécurisé."
      faq={[
        { q: "Peut-on réserver une location courte durée à Marseille ?", a: "Oui, selon les annonces, vous pouvez réserver à la nuit ou à la semaine." },
        { q: "Le paiement est-il sécurisé ?", a: "Oui, le paiement se fait en ligne de manière sécurisée." },
        { q: "Quels types de logements trouve-t-on ?", a: "Studios, appartements et maisons selon les annonces." },
      ]}
      backHref="/villes/marseille"
      backLabel="Voir la page ville"
    />
  );
}
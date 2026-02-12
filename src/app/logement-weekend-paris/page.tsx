import type { Metadata } from "next";
import SeoLanding from "@/components/SeoLanding";

export const metadata: Metadata = {
  title: "Logement week-end à Paris | LightBooker",
  description: "Trouvez un logement pour un week-end à Paris : réservation sécurisée et annonces disponibles.",
};

export default function Page() {
  return (
    <SeoLanding
      titleH1="Logement week-end à Paris"
      cityName="Paris"
      intro="Vous cherchez un logement pour un week-end à Paris ? Parcourez les annonces disponibles et réservez en ligne avec paiement sécurisé."
      faq={[
        { q: "Peut-on réserver uniquement 2 nuits ?", a: "Oui, selon les disponibilités du propriétaire, la réservation peut se faire à la nuit." },
        { q: "Le paiement est-il sécurisé ?", a: "Oui, le paiement se fait en ligne de manière sécurisée." },
        { q: "Quels types de logements trouve-t-on ?", a: "Studios, appartements et maisons selon les annonces publiées." },
      ]}
      backHref="/"
      backLabel="Accueil"
    />
  );
}
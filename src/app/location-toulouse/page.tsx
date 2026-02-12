import type { Metadata } from "next";
import SeoLanding from "@/components/SeoLanding";

export const metadata: Metadata = {
  title: "Location à Toulouse | Réservez en ligne | LightBooker",
  description: "Trouvez une location à Toulouse (nuit, semaine ou mois). Paiement sécurisé, réservation simple et annonces disponibles.",
};

export default function Page() {
  return (
    <SeoLanding
      titleH1="Location à Toulouse"
      cityName="Toulouse"
      intro="Découvrez des logements à Toulouse pour une nuit, une semaine ou un mois. Réservation simple et paiement sécurisé."
      faq={[
        { q: "Peut-on réserver à la nuit à Toulouse ?", a: "Oui, certains logements à Toulouse sont disponibles à la nuit selon les annonces." },
        { q: "Comment fonctionne la réservation ?", a: "Vous choisissez un logement, puis vous payez en ligne de façon sécurisée pour valider la réservation." },
        { q: "Quels logements sont proposés ?", a: "Studios, appartements et maisons selon les annonces publiées." },
      ]}
      backHref="/villes/toulouse"
      backLabel="Voir la page ville"
    />
  );
}
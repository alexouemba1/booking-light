import type { Metadata } from "next";
import SeoLanding from "@/components/SeoLanding";

export const metadata: Metadata = {
  title: "Location en Guyane | Réservez en ligne | LightBooker",
  description: "Trouvez une location en Guyane (nuit, semaine ou mois). Paiement sécurisé, réservation simple et annonces disponibles.",
};

export default function Page() {
  return (
    <SeoLanding
      titleH1="Location en Guyane"
      cityName="Guyane"
      intro="Trouvez un logement en Guyane pour une nuit, une semaine ou un mois. Réservation en ligne et paiement sécurisé."
      faq={[
        { q: "Peut-on réserver un séjour court en Guyane ?", a: "Oui, certains logements sont réservables à la nuit ou à la semaine selon les annonces." },
        { q: "Comment se passe le paiement ?", a: "Le paiement se fait en ligne de manière sécurisée lors de la réservation." },
        { q: "Quels types de logements sont proposés ?", a: "Studios, appartements et maisons selon les annonces publiées par les propriétaires." },
      ]}
      backHref="/villes/guyane"
      backLabel="Voir la page territoire"
    />
  );
}
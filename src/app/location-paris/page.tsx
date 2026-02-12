import type { Metadata } from "next";
import SeoLanding from "@/components/SeoLanding";

export const metadata: Metadata = {
  title: "Location à Paris | Réservez en ligne | LightBooker",
  description: "Trouvez une location à Paris (nuit, semaine ou mois). Paiement sécurisé, réservation simple et annonces disponibles.",
};

export default function Page() {
  return (
    <SeoLanding
      titleH1="Location à Paris"
      cityName="Paris"
      intro="Découvrez des logements à Paris pour une nuit, une semaine ou un mois. Réservez en ligne avec paiement sécurisé et des informations claires avant validation."
      faq={[
        { q: "Peut-on réserver à la nuit à Paris ?", a: "Oui, selon les disponibilités du propriétaire, certains logements à Paris sont disponibles à la nuit." },
        { q: "Le paiement est-il sécurisé ?", a: "Oui, les réservations sont effectuées avec un paiement en ligne sécurisé." },
        { q: "Quels logements trouve-t-on à Paris ?", a: "Studios, appartements et maisons selon les annonces publiées par les propriétaires." },
      ]}
      backHref="/villes/paris"
      backLabel="Voir la page ville"
    />
  );
}
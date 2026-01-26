// FILE: src/app/about/page.tsx
export default function AboutPage() {
  return (
    <main className="bl-container" style={{ maxWidth: 820 }}>
      <h1 className="bl-h1" style={{ fontSize: 34, marginTop: 10 }}>
        À propos de Booking-Light
      </h1>

      <p style={{ opacity: 0.85, fontWeight: 700, lineHeight: 1.7, marginTop: 14 }}>
        <strong>Booking-Light</strong> est une plateforme de mise en relation qui permet aux utilisateurs de proposer et réserver
        des biens, d’échanger via une messagerie interne et de finaliser une réservation dans un cadre clair et transparent.
      </p>

      <section className="bl-panel" style={{ marginTop: 18 }}>
        <div className="bl-panel-title">Notre rôle</div>
        <p style={{ marginTop: 10, fontWeight: 700, lineHeight: 1.7, opacity: 0.9 }}>
          Booking-Light agit en tant qu’<strong>intermédiaire technique</strong> : la plateforme fournit des outils (publication,
          recherche, réservation, messagerie, paiement) mais <strong>n’est pas partie au contrat</strong> conclu entre l’hôte et le
          voyageur.
        </p>
        <p style={{ marginTop: 8, fontWeight: 700, lineHeight: 1.7, opacity: 0.9 }}>
          Booking-Light n’est pas propriétaire des biens proposés et n’agit pas en qualité de loueur.
          Chaque utilisateur reste responsable des informations publiées et des engagements pris.
        </p>
      </section>

      <section className="bl-panel" style={{ marginTop: 14 }}>
        <div className="bl-panel-title">Publication gratuite</div>
        <p style={{ marginTop: 10, fontWeight: 700, lineHeight: 1.7, opacity: 0.9 }}>
          La publication d’annonces sur Booking-Light est <strong>entièrement gratuite</strong> : pas d’abonnement, pas de frais
          cachés, aucun coût pour mettre un bien en ligne.
        </p>
      </section>

      <section className="bl-panel" style={{ marginTop: 14 }}>
        <div className="bl-panel-title">Modèle économique transparent</div>
        <p style={{ marginTop: 10, fontWeight: 700, lineHeight: 1.7, opacity: 0.9 }}>
          Booking-Light se rémunère uniquement via <strong>une commission de service</strong> appliquée sur les réservations
          confirmées.
        </p>
        <p style={{ marginTop: 8, fontWeight: 700, lineHeight: 1.7, opacity: 0.9 }}>
          Le montant (ou le taux) de la commission est <strong>affiché avant la confirmation</strong> de la réservation et avant le
          paiement.
        </p>
      </section>

      <section className="bl-panel" style={{ marginTop: 14 }}>
        <div className="bl-panel-title">Paiement et sécurité</div>
        <p style={{ marginTop: 10, fontWeight: 700, lineHeight: 1.7, opacity: 0.9 }}>
          Les paiements sont traités par un <strong>prestataire de paiement sécurisé</strong> (ex. Stripe). Booking-Light
          n’héberge pas et ne stocke pas les données bancaires des utilisateurs.
        </p>
        <p style={{ marginTop: 8, fontWeight: 700, lineHeight: 1.7, opacity: 0.9 }}>
          La plateforme peut recevoir des informations techniques (statut, identifiant de transaction) afin d’assurer le suivi des
          réservations et la facturation de la commission.
        </p>
      </section>

      <section className="bl-panel" style={{ marginTop: 14 }}>
        <div className="bl-panel-title">Messagerie interne</div>
        <p style={{ marginTop: 10, fontWeight: 700, lineHeight: 1.7, opacity: 0.9 }}>
          Une messagerie interne permet aux utilisateurs d’échanger avant et après une réservation, de poser des questions et de
          préciser les modalités, dans un cadre plus simple et plus sûr que des échanges dispersés.
        </p>
      </section>
    </main>
  );
}
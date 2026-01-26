// FILE: src/app/cgv/page.tsx
export default function CGVPage() {
  return (
    <main className="bl-container" style={{ maxWidth: 900 }}>
      <h1 className="bl-h1" style={{ fontSize: 34, marginTop: 10 }}>
        Conditions Générales de Vente (CGV)
      </h1>

      <p style={{ opacity: 0.85, fontWeight: 700, lineHeight: 1.7, marginTop: 12 }}>
        Les présentes CGV encadrent les modalités financières applicables aux réservations effectuées via Booking-Light.
        Booking-Light est une plateforme de mise en relation entre particuliers : l’hôte et le voyageur contractent directement
        entre eux. Booking-Light n’est pas propriétaire des biens proposés et n’agit pas en qualité de loueur.
      </p>

      <section className="bl-panel" style={{ marginTop: 16 }}>
        <div className="bl-panel-title">1. Objet</div>
        <p style={{ marginTop: 10, fontWeight: 700, lineHeight: 1.7 }}>
          Les présentes CGV ont pour objet de définir les conditions dans lesquelles l’utilisateur peut effectuer une réservation,
          régler le montant correspondant, et dans lesquelles Booking-Light perçoit une commission de service.
        </p>
      </section>

      <section className="bl-panel" style={{ marginTop: 14 }}>
        <div className="bl-panel-title">2. Prix, publication et commission</div>
        <p style={{ marginTop: 10, fontWeight: 700, lineHeight: 1.7 }}>
          La création de compte et la publication d’annonces sont gratuites.
        </p>
        <p style={{ marginTop: 10, fontWeight: 700, lineHeight: 1.7 }}>
          Booking-Light perçoit une commission sur chaque réservation confirmée. Le montant (ou le taux) de la commission est
          affiché clairement avant la validation du paiement.
        </p>
      </section>

      <section className="bl-panel" style={{ marginTop: 14 }}>
        <div className="bl-panel-title">3. Paiement</div>
        <p style={{ marginTop: 10, fontWeight: 700, lineHeight: 1.7 }}>
          Les paiements sont traités par un prestataire de paiement sécurisé (ex. Stripe). Booking-Light ne stocke pas les données
          bancaires des utilisateurs.
        </p>
        <p style={{ marginTop: 10, fontWeight: 700, lineHeight: 1.7 }}>
          Booking-Light peut recevoir des informations techniques relatives au paiement (statut, identifiant de transaction) afin
          d’assurer le suivi des réservations et la facturation de la commission.
        </p>
      </section>

      <section className="bl-panel" style={{ marginTop: 14 }}>
        <div className="bl-panel-title">4. Annulation, remboursement, litiges</div>
        <p style={{ marginTop: 10, fontWeight: 700, lineHeight: 1.7 }}>
          Les conditions d’annulation (et le cas échéant de remboursement) sont définies par l’hôte et présentées à l’utilisateur
          avant la confirmation de la réservation.
        </p>
        <p style={{ marginTop: 10, fontWeight: 700, lineHeight: 1.7 }}>
          En cas de désaccord, les utilisateurs sont invités à échanger via la messagerie interne afin de rechercher une solution.
          Booking-Light peut, dans la limite de ses moyens, faciliter la communication, sans se substituer aux parties.
        </p>
      </section>

      <section className="bl-panel" style={{ marginTop: 14 }}>
        <div className="bl-panel-title">5. Rôle de Booking-Light (intermédiaire technique)</div>
        <p style={{ marginTop: 10, fontWeight: 700, lineHeight: 1.7 }}>
          Booking-Light intervient comme intermédiaire technique fournissant des outils (publication, recherche, réservation,
          messagerie). Booking-Light n’est pas partie au contrat conclu entre l’hôte et le voyageur et n’assume pas les obligations
          qui en découlent.
        </p>
        <p style={{ marginTop: 10, fontWeight: 700, lineHeight: 1.7 }}>
          Chaque utilisateur demeure seul responsable des informations publiées, de la conformité du bien proposé, et de l’exécution
          de ses engagements (accueil, respect des règles, paiement, etc.).
        </p>
      </section>

      <section className="bl-panel" style={{ marginTop: 14 }}>
        <div className="bl-panel-title">6. Contact</div>
        <p style={{ marginTop: 10, fontWeight: 700, lineHeight: 1.7 }}>
          Pour toute question relative aux présentes CGV :
          <br />
          <a href="mailto:booking@lightbooker.com" style={{ fontWeight: 900, textDecoration: "underline" }}>
            booking@lightbooker.com
          </a>
        </p>
      </section>

      <p style={{ marginTop: 14, opacity: 0.75, fontWeight: 700, lineHeight: 1.6 }}>
        Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}
      </p>
    </main>
  );
}
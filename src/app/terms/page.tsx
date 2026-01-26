// FILE: src/app/terms/page.tsx
export default function TermsPage() {
  return (
    <main className="bl-container" style={{ maxWidth: 900 }}>
      <h1 className="bl-h1" style={{ fontSize: 34, marginTop: 10 }}>
        Conditions générales d’utilisation (CGU)
      </h1>

      <p style={{ opacity: 0.85, fontWeight: 700, lineHeight: 1.7, marginTop: 12 }}>
        Les présentes Conditions Générales d’Utilisation (les « CGU ») définissent les règles d’accès et
        d’utilisation de la plateforme Booking-Light (la « Plateforme »), qui met en relation des utilisateurs
        afin de publier des annonces, effectuer des réservations et échanger via une messagerie interne.
      </p>

      <section className="bl-panel" style={{ marginTop: 16 }}>
        <div className="bl-panel-title">1. Rôle de la Plateforme</div>
        <p style={{ marginTop: 10, fontWeight: 700, lineHeight: 1.7 }}>
          Booking-Light agit en qualité <strong>d’intermédiaire technique</strong> : la Plateforme fournit des outils
          de publication d’annonces, de réservation, de paiement sécurisé et de messagerie. Booking-Light n’est ni
          propriétaire, ni vendeur, ni loueur des biens proposés, et <strong>n’est pas partie</strong> au contrat
          conclu entre les utilisateurs (hôte et voyageur).
        </p>
        <p style={{ marginTop: 10, fontWeight: 700, lineHeight: 1.7 }}>
          En conséquence, chaque utilisateur demeure seul responsable de ses annonces, de ses engagements, de la
          conformité du bien proposé, et du respect de la réglementation applicable.
        </p>
      </section>

      <section className="bl-panel" style={{ marginTop: 14 }}>
        <div className="bl-panel-title">2. Accès au service et création de compte</div>
        <p style={{ marginTop: 10, fontWeight: 700, lineHeight: 1.7 }}>
          L’accès à la Plateforme est gratuit. La création d’un compte peut être nécessaire pour publier une annonce,
          réserver ou échanger via la messagerie interne. L’utilisateur s’engage à fournir des informations exactes
          et à les maintenir à jour.
        </p>
      </section>

      <section className="bl-panel" style={{ marginTop: 14 }}>
        <div className="bl-panel-title">3. Publication d’annonces</div>
        <p style={{ marginTop: 10, fontWeight: 700, lineHeight: 1.7 }}>
          La publication d’annonces est <strong>gratuite</strong>. L’hôte garantit que les informations publiées sont
          exactes, complètes, à jour, et qu’il dispose de tous droits et autorisations nécessaires pour proposer le bien
          à la réservation.
        </p>
        <p style={{ marginTop: 10, fontWeight: 700, lineHeight: 1.7 }}>
          Booking-Light peut retirer ou rendre indisponible une annonce en cas de contenu manifestement illicite, trompeur,
          ou portant atteinte aux droits de tiers, ou en cas de non-respect des présentes CGU.
        </p>
      </section>

      <section className="bl-panel" style={{ marginTop: 14 }}>
        <div className="bl-panel-title">4. Réservations, paiement et commission</div>
        <p style={{ marginTop: 10, fontWeight: 700, lineHeight: 1.7 }}>
          Les réservations effectuées via la Plateforme peuvent donner lieu à un paiement. Booking-Light ne perçoit pas
          de frais pour publier une annonce, mais <strong>prend une commission sur chaque réservation confirmée</strong>.
          Le montant (ou le mode de calcul) de cette commission est affiché avant validation de la réservation.
        </p>
        <p style={{ marginTop: 10, fontWeight: 700, lineHeight: 1.7 }}>
          Les paiements sont traités par un prestataire de paiement sécurisé (ex. Stripe). Booking-Light
          <strong> ne stocke pas</strong> les données bancaires des utilisateurs. La Plateforme peut recevoir des informations
          techniques liées au paiement (par exemple : statut, identifiant de transaction) afin d’assurer le suivi des réservations,
          la sécurisation du service et la facturation de la commission.
        </p>
        <p style={{ marginTop: 10, fontWeight: 700, lineHeight: 1.7 }}>
          Sauf mention contraire, Booking-Light n’a pas vocation à manipuler directement les fonds des utilisateurs :
          la Plateforme intervient comme intermédiaire technique et s’appuie sur un prestataire de paiement pour exécuter
          les transactions de façon sécurisée.
        </p>
      </section>

      <section className="bl-panel" style={{ marginTop: 14 }}>
        <div className="bl-panel-title">5. Annulation, litiges et messagerie interne</div>
        <p style={{ marginTop: 10, fontWeight: 700, lineHeight: 1.7 }}>
          Les modalités d’annulation et les conditions applicables à une réservation peuvent dépendre des règles définies
          par l’hôte et/ou des informations présentées au moment de la réservation.
        </p>
        <p style={{ marginTop: 10, fontWeight: 700, lineHeight: 1.7 }}>
          En cas de difficulté, les utilisateurs sont invités à échanger prioritairement via la <strong>messagerie interne</strong>,
          conçue pour faciliter des échanges traçables et sécurisés. Booking-Light peut, sans obligation, mettre à disposition des
          outils et informations pour faciliter la résolution, sans se substituer aux utilisateurs dans leurs obligations.
        </p>
      </section>

      <section className="bl-panel" style={{ marginTop: 14 }}>
        <div className="bl-panel-title">6. Obligations des utilisateurs</div>
        <ul style={{ marginTop: 10, lineHeight: 1.7, fontWeight: 700, opacity: 0.95 }}>
          <li>Respecter les lois et règlements applicables (consommation, location, assurances, fiscalité, etc.).</li>
          <li>Ne pas publier de contenu illicite, trompeur, diffamatoire ou portant atteinte aux droits de tiers.</li>
          <li>Utiliser la Plateforme de bonne foi (pas de fraude, contournement, usurpation, abus de la messagerie).</li>
          <li>Respecter les engagements pris lors d’une réservation (dates, conditions, communication).</li>
        </ul>
      </section>

      <section className="bl-panel" style={{ marginTop: 14 }}>
        <div className="bl-panel-title">7. Responsabilité</div>
        <p style={{ marginTop: 10, fontWeight: 700, lineHeight: 1.7 }}>
          Booking-Light fournit un service d’intermédiation technique « en l’état ». La Plateforme ne garantit pas l’absence
          d’interruption, d’erreur, ni la conclusion effective d’une réservation. Chaque utilisateur demeure responsable :
          (i) des informations qu’il publie, (ii) de la conformité et de l’état du bien proposé, (iii) de la relation contractuelle
          entre utilisateurs.
        </p>
        <p style={{ marginTop: 10, fontWeight: 700, lineHeight: 1.7 }}>
          Booking-Light ne saurait être tenue responsable des dommages résultant d’un manquement d’un utilisateur à ses obligations,
          ni des litiges liés à l’exécution d’une réservation entre utilisateurs.
        </p>
      </section>

      <section className="bl-panel" style={{ marginTop: 14 }}>
        <div className="bl-panel-title">8. Données personnelles</div>
        <p style={{ marginTop: 10, fontWeight: 700, lineHeight: 1.7 }}>
          La gestion des données personnelles est décrite dans la page{" "}
          <strong>Confidentialité</strong>. En utilisant la Plateforme, l’utilisateur reconnaît en avoir pris connaissance.
        </p>
      </section>

      <section className="bl-panel" style={{ marginTop: 14 }}>
        <div className="bl-panel-title">9. Modification des CGU</div>
        <p style={{ marginTop: 10, fontWeight: 700, lineHeight: 1.7 }}>
          Booking-Light peut faire évoluer les présentes CGU afin de s’adapter aux évolutions du service, techniques, légales
          ou réglementaires. La version en vigueur est celle publiée sur la Plateforme.
        </p>
      </section>

      <section className="bl-panel" style={{ marginTop: 14 }}>
        <div className="bl-panel-title">10. Contact</div>
        <p style={{ marginTop: 10, fontWeight: 700, lineHeight: 1.7 }}>
          Pour toute question relative aux présentes conditions :
          <br />
          <a href="mailto:booking@lightbooker.com" style={{ fontWeight: 900, textDecoration: "underline" }}>
            booking@lightbooker.com
          </a>
        </p>
      </section>
    </main>
  );
}
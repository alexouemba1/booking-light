// FILE: src/app/privacy/page.tsx
export default function PrivacyPage() {
  return (
    <main className="bl-container" style={{ maxWidth: 900 }}>
      <h1 className="bl-h1" style={{ fontSize: 34, marginTop: 10 }}>
        Confidentialité
      </h1>

      <p style={{ opacity: 0.85, fontWeight: 700, lineHeight: 1.7, marginTop: 12 }}>
        Booking-Light attache une importance particulière à la protection des données personnelles et au respect de la vie privée
        de ses utilisateurs. La présente page explique quelles données peuvent être traitées, pour quelles finalités et quels sont
        vos droits.
      </p>

      <section className="bl-panel" style={{ marginTop: 16 }}>
        <div className="bl-panel-title">Données traitées</div>
        <ul style={{ marginTop: 10, lineHeight: 1.7, fontWeight: 700, opacity: 0.9 }}>
          <li>Données de compte : email, identifiants techniques liés à l’authentification.</li>
          <li>Données liées aux annonces : titre, localisation, description, prix, photos.</li>
          <li>Données de réservation : dates, statut, identifiants techniques liés au paiement.</li>
          <li>Messagerie interne : contenu des messages et horodatage.</li>
          <li>Données techniques : journaux de sécurité (logs), informations de navigation nécessaires au bon fonctionnement.</li>
        </ul>
      </section>

      <section className="bl-panel" style={{ marginTop: 14 }}>
        <div className="bl-panel-title">Finalités</div>
        <p style={{ marginTop: 10, fontWeight: 700, lineHeight: 1.7, opacity: 0.9 }}>
          Les données sont traitées exclusivement pour :
        </p>
        <ul style={{ marginTop: 8, lineHeight: 1.7, fontWeight: 700, opacity: 0.9 }}>
          <li>fournir le service (création de compte, publication d’annonces, réservations, messagerie) ;</li>
          <li>gérer la relation entre utilisateurs (échanges, historique, modération si nécessaire) ;</li>
          <li>sécuriser la plateforme (prévention de la fraude, abus, incidents) ;</li>
          <li>améliorer l’expérience utilisateur et la qualité du service.</li>
        </ul>
      </section>

      <section className="bl-panel" style={{ marginTop: 14 }}>
        <div className="bl-panel-title">Paiement</div>
        <p style={{ marginTop: 10, fontWeight: 700, lineHeight: 1.7, opacity: 0.9 }}>
          Les paiements sont traités par un prestataire de paiement sécurisé (ex. Stripe). Booking-Light ne stocke pas vos données
          bancaires. Booking-Light peut recevoir des informations techniques de paiement (statut, identifiant de transaction) afin
          d’assurer le suivi des réservations et la facturation de la commission.
        </p>
      </section>

      <section className="bl-panel" style={{ marginTop: 14 }}>
        <div className="bl-panel-title">Durée de conservation</div>
        <p style={{ marginTop: 10, fontWeight: 700, lineHeight: 1.7, opacity: 0.9 }}>
          Les données sont conservées pendant la durée nécessaire à la fourniture du service et au respect des obligations légales,
          puis supprimées ou anonymisées lorsqu’elles ne sont plus nécessaires.
        </p>
      </section>

      <section className="bl-panel" style={{ marginTop: 14 }}>
        <div className="bl-panel-title">Vos droits</div>
        <p style={{ marginTop: 10, fontWeight: 700, lineHeight: 1.7, opacity: 0.9 }}>
          Conformément à la réglementation applicable, vous pouvez demander l’accès, la rectification, l’effacement, la limitation
          ou l’opposition au traitement de vos données, ainsi que la portabilité lorsque cela s’applique.
        </p>
      </section>

      <section className="bl-panel" style={{ marginTop: 14 }}>
        <div className="bl-panel-title">Sécurité</div>
        <p style={{ marginTop: 10, fontWeight: 700, lineHeight: 1.7, opacity: 0.9 }}>
          Booking-Light met en œuvre des mesures techniques et organisationnelles raisonnables afin de protéger les données contre
          tout accès non autorisé, perte, altération ou divulgation.
        </p>
      </section>

      <section className="bl-panel" style={{ marginTop: 14 }}>
        <div className="bl-panel-title">Contact</div>
        <p style={{ marginTop: 10, fontWeight: 700, lineHeight: 1.7, opacity: 0.9 }}>
          Pour toute question relative à la protection des données :
          <br />
          <a href="mailto:booking@lightbooker.com" style={{ fontWeight: 900, textDecoration: "underline" }}>
            booking@lightbooker.com
          </a>
        </p>
      </section>
    </main>
  );
}
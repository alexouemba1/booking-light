// src/app/privacy/page.tsx
export default function PrivacyPage() {
  return (
    <main className="bl-container" style={{ maxWidth: 900 }}>
      <h1 className="bl-h1" style={{ fontSize: 34, marginTop: 10 }}>
        Confidentialité
      </h1>

      <p style={{ opacity: 0.8, fontWeight: 700, lineHeight: 1.6, marginTop: 12 }}>
        Version “minimum pro” pour prototype. À adapter si tu passes en production (RGPD, cookies, etc.).
      </p>

      <section className="bl-panel" style={{ marginTop: 16 }}>
        <div className="bl-panel-title">Données collectées</div>
        <ul style={{ marginTop: 10, lineHeight: 1.7, fontWeight: 700, opacity: 0.9 }}>
          <li>Compte (authentification)</li>
          <li>Annonces (titre, ville, prix, images)</li>
          <li>Réservations (dates, statut, paiement)</li>
          <li>Messages (contenu, horodatage)</li>
        </ul>
      </section>

      <section className="bl-panel" style={{ marginTop: 14 }}>
        <div className="bl-panel-title">Utilisation</div>
        <p style={{ marginTop: 10, opacity: 0.85, fontWeight: 700, lineHeight: 1.7 }}>
          Ces données servent à faire fonctionner l’application (publication, réservation, messagerie) et améliorer
          l’expérience.
        </p>
      </section>

      <section className="bl-panel" style={{ marginTop: 14 }}>
        <div className="bl-panel-title">Contact</div>
        <p style={{ marginTop: 10, opacity: 0.85, fontWeight: 700, lineHeight: 1.7 }}>
          Pour toute demande liée aux données :{" "}
          <a href="mailto:contact@bookinglight.com" style={{ fontWeight: 900, textDecoration: "underline" }}>
            contact@bookinglight.com
          </a>
        </p>
      </section>
    </main>
  );
}

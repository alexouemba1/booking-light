// src/app/terms/page.tsx
export default function TermsPage() {
  return (
    <main className="bl-container" style={{ maxWidth: 900 }}>
      <h1 className="bl-h1" style={{ fontSize: 34, marginTop: 10 }}>
        Conditions générales
      </h1>

      <p style={{ opacity: 0.8, fontWeight: 700, lineHeight: 1.6, marginTop: 12 }}>
        Version “minimum pro” pour ton prototype. À adapter si tu passes en production (juriste recommandé).
      </p>

      <section className="bl-panel" style={{ marginTop: 16 }}>
        <div className="bl-panel-title">1. Objet</div>
        <p style={{ marginTop: 10, opacity: 0.85, fontWeight: 700, lineHeight: 1.7 }}>
          Booking Light permet de publier des annonces, effectuer des réservations et échanger via messagerie.
        </p>
      </section>

      <section className="bl-panel" style={{ marginTop: 14 }}>
        <div className="bl-panel-title">2. Comptes et accès</div>
        <p style={{ marginTop: 10, opacity: 0.85, fontWeight: 700, lineHeight: 1.7 }}>
          L’utilisateur est responsable de la confidentialité de son compte. Toute activité réalisée depuis le compte est
          présumée effectuée par l’utilisateur.
        </p>
      </section>

      <section className="bl-panel" style={{ marginTop: 14 }}>
        <div className="bl-panel-title">3. Annonces et réservations</div>
        <p style={{ marginTop: 10, opacity: 0.85, fontWeight: 700, lineHeight: 1.7 }}>
          Les hôtes publient leurs annonces sous leur responsabilité. Les réservations et paiements suivent le parcours
          défini sur la plateforme.
        </p>
      </section>

      <section className="bl-panel" style={{ marginTop: 14 }}>
        <div className="bl-panel-title">4. Responsabilité</div>
        <p style={{ marginTop: 10, opacity: 0.85, fontWeight: 700, lineHeight: 1.7 }}>
          Booking Light est un prototype. En l’état, aucune garantie d’absence d’erreurs ou d’interruptions n’est fournie.
        </p>
      </section>
    </main>
  );
}

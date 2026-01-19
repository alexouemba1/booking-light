// src/app/about/page.tsx
export default function AboutPage() {
  return (
    <main className="bl-container" style={{ maxWidth: 820 }}>
      <h1 className="bl-h1" style={{ fontSize: 34, marginTop: 10 }}>
        À propos
      </h1>

      <p style={{ opacity: 0.8, fontWeight: 700, lineHeight: 1.6, marginTop: 12 }}>
        Booking Light est un prototype simple et efficace : publier une annonce, gérer les réservations, échanger par
        messages — sans bruit, sans surcharge.
      </p>

      <section className="bl-panel" style={{ marginTop: 16 }}>
        <div className="bl-panel-title">Notre promesse</div>
        <ul style={{ marginTop: 10, lineHeight: 1.7, fontWeight: 700, opacity: 0.9 }}>
          <li>Une interface claire et rapide.</li>
          <li>Des actions évidentes (publier, réserver, payer, contacter).</li>
          <li>Des bases solides pour évoluer (sécurité, UX hôte, confiance).</li>
        </ul>
      </section>
    </main>
  );
}

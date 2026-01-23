// src/app/contact/page.tsx
export default function ContactPage() {
  return (
    <main className="bl-container" style={{ maxWidth: 820 }}>
      <h1 className="bl-h1" style={{ fontSize: 34, marginTop: 10 }}>
        Contact
      </h1>

      <p style={{ opacity: 0.8, fontWeight: 700, lineHeight: 1.6, marginTop: 12 }}>
        Une question, un souci, une suggestion ? Écris-nous et on te répond.
      </p>

      <section className="bl-panel" style={{ marginTop: 16 }}>
        <div className="bl-panel-title">Support</div>

        <div style={{ marginTop: 10, fontWeight: 800, opacity: 0.9 }}>
          Email :{" "}
          <a
            href="mailto:booking@lightbooker.com"
            style={{ fontWeight: 900, textDecoration: "underline" }}
          >
            booking@lightbooker.com
          </a>
        </div>

        <div style={{ marginTop: 10, opacity: 0.75, fontWeight: 700, lineHeight: 1.6 }}>
          Horaires : 9h–18h (heure locale), du lundi au vendredi.
        </div>
      </section>
    </main>
  );
}

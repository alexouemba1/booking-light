"use client";

import Link from "next/link";

export default function StripeReturnPage() {
  return (
    <main className="bl-container" style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginTop: 0, fontSize: 32, letterSpacing: -0.5 }}>
        Paiement confirmé
      </h1>

      <p style={{ marginTop: 8, opacity: 0.85 }}>
        Merci. Ton paiement a été validé par Stripe. Tu peux revenir à tes réservations ou à tes annonces.
      </p>

      <div
        style={{
          marginTop: 16,
          padding: 14,
          borderRadius: 12,
          border: "1px solid rgba(0,0,0,0.08)",
          background: "rgba(0,0,0,0.02)",
        }}
      >
        <strong style={{ display: "block", marginBottom: 6 }}>Et maintenant ?</strong>
        <span style={{ opacity: 0.85 }}>
          Si tu veux voir le statut “Payé”, va sur “Mes réservations”.
        </span>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
        <Link className="bl-pill" href="/my-bookings">
          Mes réservations
        </Link>
        <Link className="bl-pill" href="/my-listings">
          Mes annonces
        </Link>
        <Link className="bl-pill" href="/">
          Accueil
        </Link>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";

export default function StripeReauthPage() {
  return (
    <main className="bl-container" style={{ padding: 24 }}>
      <h1 style={{ marginTop: 0 }}>Stripe : action requise</h1>
      <p>Stripe te demande de refaire une étape. Reviens et relance l’onboarding.</p>

      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <Link className="bl-pill" href="/my-listings">Reprendre l’activation Stripe</Link>
        <Link className="bl-pill" href="/">Accueil</Link>
      </div>
    </main>
  );
}

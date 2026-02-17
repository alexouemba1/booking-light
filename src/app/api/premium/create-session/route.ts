import { NextResponse } from "next/server";
import Stripe from "stripe";

function json(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function POST(req: Request) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL; // ex: https://lightbooker.com

    if (!stripeKey || !siteUrl) {
      return json({ error: "Config Stripe manquante (STRIPE_SECRET_KEY / NEXT_PUBLIC_SITE_URL)" }, 500);
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

    const body = await req.json().catch(() => null);
    const listing_id = String(body?.listing_id || "").trim();

    if (!listing_id) return json({ error: "listing_id manquant" }, 400);

    // Offre Premium : 7 jours (paiement unique)
    const DAYS = 7;
    const PRICE_CENTS = 999; // 9,99€ (change si tu veux)

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: PRICE_CENTS,
            product_data: {
              name: `Mise en avant Premium (${DAYS} jours)`,
              description: "Votre annonce remonte en haut + badge Premium",
            },
          },
        },
      ],
      success_url: `${siteUrl}/my-listings?premium=success`,
      cancel_url: `${siteUrl}/my-listings?premium=cancel`,
      metadata: {
        listing_id,
        days: String(DAYS),
      },
    });

    return json({ ok: true, url: session.url });
  } catch (e: any) {
    return json({ error: e?.message ?? "Erreur" }, 500);
  }
}
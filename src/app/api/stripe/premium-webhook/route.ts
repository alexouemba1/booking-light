import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function text(data: string, status = 200) {
  return new NextResponse(data, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function POST(req: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_PREMIUM_WEBHOOK_SECRET;

  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeKey || !webhookSecret || !supaUrl || !serviceKey) {
    return text("Missing env", 500);
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

  const sig = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    if (!sig) return text("No signature", 400);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    return text(`Webhook signature error: ${err?.message ?? "error"}`, 400);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const listing_id = String(session.metadata?.listing_id || "").trim();
    const days = Number(session.metadata?.days || 7);

    if (listing_id) {
      const admin = createClient(supaUrl, serviceKey, { auth: { persistSession: false } });

      const premiumUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

      await admin.from("listings").update({ is_premium: true, premium_until: premiumUntil }).eq("id", listing_id);

      await admin.from("premium_orders").upsert(
        {
          listing_id,
          stripe_session_id: session.id,
          amount_cents: session.amount_total ?? 0,
          currency: String(session.currency ?? "eur"),
          days,
        },
        { onConflict: "stripe_session_id" }
      );
    }
  }

  return text("ok", 200);
}
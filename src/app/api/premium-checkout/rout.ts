import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function json(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function POST(req: Request) {
  try {
    // ✅ IMPORTANT: on évite de casser Stripe Connect
    // - si tu as STRIPE_PREMIUM_SECRET_KEY -> on l'utilise
    // - sinon on fallback sur STRIPE_SECRET_KEY (si tu n'as qu'une seule clé)
    const stripeKey = process.env.STRIPE_PREMIUM_SECRET_KEY || process.env.STRIPE_SECRET_KEY;

    const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!stripeKey || !supaUrl || !serviceKey) {
      return json({ error: "Missing env (Stripe/Supabase)" }, 500);
    }

    const auth = req.headers.get("authorization") || "";
    const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";

    if (!token) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(supaUrl, serviceKey, { auth: { persistSession: false } });

    const { data: userData, error: uErr } = await admin.auth.getUser(token);
    if (uErr || !userData?.user?.id) {
      return json({ error: "Session invalide" }, 401);
    }

    const uid = userData.user.id;

    const body = await req.json().catch(() => null);
    const listing_id = String(body?.listing_id || "").trim();
    const days = Math.max(1, Math.min(30, Number(body?.days || 7))); // 1..30 jours

    if (!listing_id) return json({ error: "listing_id manquant" }, 400);

    // ✅ Vérifie que l'annonce appartient bien à l'utilisateur
    const { data: listing, error: lErr } = await admin
      .from("listings")
      .select("id,user_id,title")
      .eq("id", listing_id)
      .single();

    if (lErr || !listing) return json({ error: "Annonce introuvable" }, 404);
    if (String(listing.user_id) !== uid) return json({ error: "Forbidden" }, 403);

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

    // ✅ URLs retour (local + prod)
    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    // ✅ Prix Premium (simple et clair)
    // Ici: 9,90€ / 7 jours (tu peux ajuster)
    // Si tu veux prix proportionnel: on peut le faire ensuite.
    const amountCents = days <= 7 ? 990 : days <= 14 ? 1690 : 2490;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${origin}/my-listings?premium=success`,
      cancel_url: `${origin}/my-listings?premium=cancel`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: amountCents,
            product_data: {
              name: `Mise en avant Premium (${days} jours)`,
              description: `Annonce: ${listing.title || listing.id}`,
            },
          },
        },
      ],
      metadata: {
        listing_id,
        days: String(days),
      },
    });

    return json({ url: session.url }, 200);
  } catch (e: any) {
    return json({ error: e?.message ?? "Erreur serveur" }, 500);
  }
}
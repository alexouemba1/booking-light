import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

let stripe: Stripe | null = null;
function getStripe() {
  if (!STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY manquante");
  if (!stripe) stripe = new Stripe(STRIPE_SECRET_KEY);
  return stripe;
}

export async function POST(req: Request) {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !APP_URL) {
      return NextResponse.json({ error: "Configuration serveur manquante" }, { status: 500 });
    }

    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // 1) Identifier l’utilisateur
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    const userId = userData?.user?.id ?? null;
    if (userErr || !userId) return NextResponse.json({ error: "Utilisateur invalide" }, { status: 401 });

    // 2) Lire le profile (stripe_account_id)
    const { data: profile, error: pErr } = await admin
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", userId)
      .maybeSingle();

    if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });

    let stripeAccountId = (profile?.stripe_account_id ?? "").toString().trim();

    const stripeClient = getStripe();

    // 3) Créer le compte Connect si absent
    if (!stripeAccountId) {
      const account = await stripeClient.accounts.create({
        type: "express",
        country: "FR",
        email: userData?.user?.email ?? undefined,
        business_type: "individual",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      stripeAccountId = account.id;

      await admin.from("profiles").update({ stripe_account_id: stripeAccountId }).eq("id", userId);
    }

    // 4) Lien onboarding (hébergé par Stripe)
    const accountLink = await stripeClient.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${APP_URL}/dashboard/payments?refresh=1`,
      return_url: `${APP_URL}/dashboard/payments?success=1`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (e: any) {
    console.error("[stripe/connect/onboard]", e?.message);
    return NextResponse.json({ error: e?.message ?? "Erreur Stripe Connect" }, { status: 500 });
  }
}

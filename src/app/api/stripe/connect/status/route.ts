import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let stripeSingleton: Stripe | null = null;
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Config manquante: STRIPE_SECRET_KEY");
  if (!stripeSingleton) stripeSingleton = new Stripe(key);
  return stripeSingleton;
}

function j(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function getBearerToken(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m?.[1] ?? null;
}

function isStripeAccountId(x: string) {
  return /^acct_[A-Za-z0-9]+$/.test(x);
}

function expectedLiveModeFromKey() {
  const key = process.env.STRIPE_SECRET_KEY || "";
  return key.startsWith("sk_live_");
}

export async function GET(req: Request) {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return j({ error: "Config manquante Supabase." }, 500);
    }

    const token = getBearerToken(req);
    if (!token) return j({ error: "Non authentifié." }, 401);

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    const userId = userData?.user?.id ?? null;
    if (userErr || !userId) return j({ error: "Token invalide." }, 401);

    const { data: profile, error: pErr } = await admin
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", userId)
      .maybeSingle();

    if (pErr) return j({ error: pErr.message }, 500);

    const expectedLivemode = expectedLiveModeFromKey();
    let stripeAccountId = String(profile?.stripe_account_id || "").trim();

    if (!isStripeAccountId(stripeAccountId)) stripeAccountId = "";

    if (!stripeAccountId) {
      return j({
        hasAccount: false,
        active: false,
        mode: expectedLivemode ? "live" : "test",
        message: "Compte Stripe non créé.",
      });
    }

    const stripe = getStripe();

    let acct: any = null;
    try {
      acct = await stripe.accounts.retrieve(stripeAccountId);
    } catch (e: any) {
      return j({
        hasAccount: false,
        active: false,
        mode: expectedLivemode ? "live" : "test",
        message: "Compte Stripe introuvable avec cette clé (probablement mauvais mode test/live).",
      });
    }

    const chargesEnabled = Boolean(acct?.charges_enabled);
    const payoutsEnabled = Boolean(acct?.payouts_enabled);
    const acctLivemode = Boolean(acct?.livemode);

    // mismatch test/live → pas actif (et on explique)
    if (acctLivemode !== expectedLivemode) {
      return j({
        hasAccount: true,
        stripeAccountId,
        chargesEnabled,
        payoutsEnabled,
        active: false,
        mode: expectedLivemode ? "live" : "test",
        message: "Compte Stripe créé dans un autre mode (test/live). Relance l’onboarding pour recréer le bon compte.",
      });
    }

    const active = chargesEnabled && payoutsEnabled;

    return j({
      hasAccount: true,
      stripeAccountId,
      chargesEnabled,
      payoutsEnabled,
      active,
      mode: expectedLivemode ? "live" : "test",
    });
  } catch (e: any) {
    console.error("[stripe/connect/status] error:", e?.message);
    return j({ error: e?.message ?? "Erreur." }, 500);
  }
}

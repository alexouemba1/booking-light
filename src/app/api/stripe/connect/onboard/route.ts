import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

// ✅ Lazy init Stripe (évite bugs build + lit la clé au moment de l’appel)
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

function normalizeBaseUrl(url: string) {
  return url.replace(/\/+$/, "");
}

function isStripeAccountId(x: string) {
  return /^acct_[A-Za-z0-9]+$/.test(x);
}

function expectedLiveModeFromKey() {
  const key = process.env.STRIPE_SECRET_KEY || "";
  return key.startsWith("sk_live_");
}

async function safeRetrieveAccount(stripe: Stripe, accountId: string) {
  try {
    const acct = await stripe.accounts.retrieve(accountId);
    return acct as any;
  } catch (e: any) {
    // resource_missing / invalid_request_error etc.
    return null;
  }
}

export async function POST(req: Request) {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !APP_URL) {
      return j(
        {
          error:
            "Config manquante (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_APP_URL).",
        },
        500
      );
    }

    const token = getBearerToken(req);
    if (!token) return j({ error: "Non authentifié (token manquant)." }, 401);

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // 1) Identifier l’utilisateur depuis le token
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    const userId = userData?.user?.id ?? null;
    if (userErr || !userId) return j({ error: "Non authentifié (token invalide)." }, 401);

    const stripe = getStripe();
    const expectedLivemode = expectedLiveModeFromKey();

    // 2) Lire stripe_account_id existant
    const { data: profile, error: pErr } = await admin
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", userId)
      .maybeSingle();

    if (pErr) return j({ error: `profiles read failed: ${pErr.message}` }, 500);

    let stripeAccountId = String(profile?.stripe_account_id || "").trim();

    // Si quelqu’un a mis "EMPTY" ou autre texte → on le considère vide
    if (!isStripeAccountId(stripeAccountId)) stripeAccountId = "";

    // 3) Si un account existe, on vérifie qu’il est dans le BON mode (test/live)
    if (stripeAccountId) {
      const acct = await safeRetrieveAccount(stripe, stripeAccountId);

      // inexistant (clé pas bonne ou compte supprimé) → on reset
      if (!acct) {
        stripeAccountId = "";
      } else {
        const acctLivemode = Boolean(acct.livemode);
        // mismatch test/live → on reset pour recréer dans le bon mode
        if (acctLivemode !== expectedLivemode) {
          stripeAccountId = "";
        }
      }
    }

    // 4) Créer le compte Express si absent (ou reset)
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
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

      const { error: upErr } = await admin
        .from("profiles")
        .update({ stripe_account_id: stripeAccountId })
        .eq("id", userId);

      if (upErr) return j({ error: `profiles update failed: ${upErr.message}` }, 500);
    }

    // 5) Créer le lien d’onboarding Stripe (hébergé)
    const base = normalizeBaseUrl(APP_URL);

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      type: "account_onboarding",
      refresh_url: `${base}/dashboard/payments?refresh=1`,
      return_url: `${base}/dashboard/payments?success=1`,
    });

    return j(
      {
        url: accountLink.url,
        stripeAccountId,
        mode: expectedLivemode ? "live" : "test",
      },
      200
    );
  } catch (e: any) {
    console.error("[stripe/connect/onboard] error:", e?.message);
    return j({ error: e?.message ?? "Erreur Stripe Connect." }, 500);
  }
}

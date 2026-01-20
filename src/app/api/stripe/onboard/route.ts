import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

// ✅ Lazy init Stripe (évite crash build si STRIPE_SECRET_KEY absente au chargement)
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

export async function POST(req: Request) {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !APP_URL) {
      return j(
        { error: "Config manquante (SUPABASE_URL / SERVICE_ROLE / APP_URL)." },
        500
      );
    }

    // Auth Supabase via Bearer token
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return j({ error: "Non authentifié." }, 401);

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) return j({ error: "Token invalide." }, 401);

    const userId = userData.user.id;
    const userEmail = userData.user.email ?? undefined;

    // Lire (sans .single() pour éviter les erreurs si pas de row)
    const { data: profRows, error: profErr } = await admin
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", userId)
      .limit(1);

    if (profErr) {
      return j({ error: `Impossible de lire profiles: ${profErr.message}` }, 400);
    }

    let accountId = (profRows?.[0]?.stripe_account_id as string | null) ?? null;

    // ✅ Instancier Stripe seulement au moment où on en a besoin
    const stripe = getStripe();

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "FR",
        email: userEmail,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: { userId },
      });

      accountId = account.id;

      // ✅ UPSERT pour créer la ligne si elle n'existe pas
      const { error: upErr } = await admin
        .from("profiles")
        .upsert({ id: userId, stripe_account_id: accountId }, { onConflict: "id" });

      if (upErr) {
        return j(
          { error: `Impossible de sauvegarder stripe_account_id dans profiles: ${upErr.message}` },
          400
        );
      }
    }

    // Lien d’onboarding
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${APP_URL}/stripe/reauth`,
      return_url: `${APP_URL}/stripe/return`,
      type: "account_onboarding",
    });

    return j({ url: link.url, accountId }, 200);
  } catch (e: any) {
    console.error("[onboard] error:", e?.message);
    return j({ error: e?.message ?? "Erreur serveur." }, 500);
  }
}

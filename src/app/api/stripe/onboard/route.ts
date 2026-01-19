import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

const stripe = new Stripe(STRIPE_SECRET_KEY ?? "");


export async function POST(req: Request) {
  try {
    if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !APP_URL) {
      return NextResponse.json(
        { error: "Config manquante (STRIPE_SECRET_KEY / SUPABASE_URL / SERVICE_ROLE / APP_URL)." },
        { status: 500 }
      );
    }

    // Auth Supabase via Bearer token
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) return NextResponse.json({ error: "Token invalide." }, { status: 401 });

    const userId = userData.user.id;
    const userEmail = userData.user.email ?? undefined;

    // Lire (sans .single() pour éviter les erreurs si pas de row)
    const { data: profRows, error: profErr } = await admin
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", userId)
      .limit(1);

    if (profErr) {
      return NextResponse.json({ error: `Impossible de lire profiles: ${profErr.message}` }, { status: 400 });
    }

    let accountId = (profRows?.[0]?.stripe_account_id as string | null) ?? null;

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
        return NextResponse.json(
          { error: `Impossible de sauvegarder stripe_account_id dans profiles: ${upErr.message}` },
          { status: 400 }
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

    return NextResponse.json({ url: link.url, accountId }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Erreur serveur." }, { status: 500 });
  }
}

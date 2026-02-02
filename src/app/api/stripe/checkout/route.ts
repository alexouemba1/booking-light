import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_URL_ENV = process.env.NEXT_PUBLIC_APP_URL;

const PLATFORM_FEE_PCT = 0.14;

// ✅ Lazy init Stripe (évite crash au build si env manquante)
let stripeSingleton: Stripe | null = null;

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Config manquante: STRIPE_SECRET_KEY");
  if (!stripeSingleton) stripeSingleton = new Stripe(key);
  return stripeSingleton;
}

function getBearerToken(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m?.[1] ?? null;
}

function asInt(n: any) {
  const x = Number(n);
  return Number.isFinite(x) ? Math.trunc(x) : NaN;
}

function j(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function normalizeBaseUrl(url: string) {
  return url.replace(/\/+$/, "");
}

function buildReturnUrl(base: string, path: string, params: Record<string, string>) {
  const baseClean = normalizeBaseUrl(base);
  const u = new URL(`${baseClean}${path.startsWith("/") ? "" : "/"}${path}`);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  return u.toString();
}

/**
 * ✅ Base URL robuste:
 * - Priorité: host réel de la requête (Vercel reverse proxy)
 * - Fallback: NEXT_PUBLIC_APP_URL
 */
function getBaseUrlFromRequest(req: Request) {
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    "";

  if (host) return normalizeBaseUrl(`${proto}://${host}`);

  if (APP_URL_ENV) return normalizeBaseUrl(APP_URL_ENV);

  return "";
}

export async function POST(req: Request) {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return j(
        { error: "Config manquante (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)." },
        500
      );
    }

    const baseUrl = getBaseUrlFromRequest(req);
    if (!baseUrl) {
      return j(
        { error: "Impossible de déterminer l’URL de base (host manquant + NEXT_PUBLIC_APP_URL vide)." },
        500
      );
    }

    const token = getBearerToken(req);
    if (!token) return j({ error: "Non authentifié (token manquant)." }, 401);

    const body = await req.json().catch(() => null);
    const bookingId = body?.bookingId;
    if (!bookingId) return j({ error: "bookingId manquant." }, 400);

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // ✅ Vérifier le user depuis le token
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    const authedUserId = userData?.user?.id ?? null;

    if (userErr || !authedUserId) {
      return j({ error: "Non authentifié (token invalide)." }, 401);
    }

    // 1) Lire la réservation
    const { data: booking, error: bErr } = await admin
      .from("bookings")
      .select("id, renter_id, listing_id, total_cents, status, payment_status, expires_at")
      .eq("id", bookingId)
      .single();

    if (bErr || !booking) return j({ error: "Réservation introuvable." }, 404);

    // ✅ Sécurité: interdire de payer la réservation de quelqu’un d’autre
    if (String(booking.renter_id) !== String(authedUserId)) {
      return j({ error: "Accès refusé (réservation d’un autre utilisateur)." }, 403);
    }

    // 2) Refuser si expirée / annulée / payée / statut non compatible
    const statusKey = String(booking.status || "").toLowerCase();
    const payKey = String(booking.payment_status || "unpaid").toLowerCase();

    if (payKey === "paid" || statusKey === "paid" || statusKey === "confirmed") {
      return j({ error: "Cette réservation est déjà payée." }, 400);
    }

    if (statusKey === "cancelled" || statusKey === "canceled") {
      return j({ error: "Cette réservation est annulée (option expirée)." }, 400);
    }

    if (statusKey !== "pending") {
      return j({ error: "Cette réservation n’est pas en attente de paiement." }, 400);
    }

    // Expiration côté serveur
    if (booking.expires_at) {
      const exp = new Date(String(booking.expires_at)).getTime();
      if (Number.isFinite(exp) && exp <= Date.now()) {
        await admin
          .from("bookings")
          .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
          .eq("id", bookingId);

        return j({ error: "Option expirée. Reprends une nouvelle réservation." }, 400);
      }
    }

    const total = asInt(booking.total_cents);
    if (!Number.isFinite(total) || total <= 0) {
      return j({ error: "Montant invalide." }, 400);
    }

    // 3) Charger l’annonce pour trouver l’hôte
    const { data: listing, error: lErr } = await admin
      .from("listings")
      .select("id, user_id, title")
      .eq("id", booking.listing_id)
      .single();

    if (lErr || !listing) return j({ error: "Annonce introuvable." }, 404);

    const hostUserId = listing.user_id;
    if (!hostUserId) return j({ error: "Annonce invalide (user_id hôte manquant)." }, 400);

    // 4) Lire le compte Stripe Connect de l’hôte
    const { data: hostProfile, error: pErr } = await admin
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", hostUserId)
      .single();

    const destinationAccount = String(hostProfile?.stripe_account_id || "").trim();
    if (pErr || !destinationAccount || !destinationAccount.startsWith("acct_")) {
      return j(
        { error: "Hôte non configuré Stripe Connect (profiles.stripe_account_id manquant ou invalide)." },
        400
      );
    }

    // 5) Commission
    const platformFee = Math.max(0, Math.round(total * PLATFORM_FEE_PCT));
    if (platformFee >= total) return j({ error: "Commission invalide (>= total)." }, 400);
    const subtotal = total - platformFee;

    await admin
      .from("bookings")
      .update({ platform_fee_cents: platformFee, subtotal_cents: subtotal })
      .eq("id", bookingId);

    // 6) URLs retour (baseUrl réel)
    const successUrl = buildReturnUrl(baseUrl, "/my-bookings", {
      paid: "1",
      bookingId: String(bookingId),
      focus: String(bookingId),
    });

    const cancelUrl = buildReturnUrl(baseUrl, "/my-bookings", {
      canceled: "1",
      bookingId: String(bookingId),
      focus: String(bookingId),
    });

    const stripe = getStripe();

    // 7) Stripe Checkout + split Connect
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        success_url: successUrl,
        cancel_url: cancelUrl,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "eur",
              unit_amount: total,
              product_data: {
                name: listing.title ? `Réservation — ${listing.title}` : `Réservation ${bookingId}`,
              },
            },
          },
        ],
        metadata: { bookingId: String(bookingId) },
        payment_intent_data: {
          application_fee_amount: platformFee,
          transfer_data: { destination: destinationAccount },
        },
      },
      { idempotencyKey: `checkout_${bookingId}` }
    );

    // 8) Stocker session id
    await admin
      .from("bookings")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", bookingId);

    return j({ url: session.url }, 200);
  } catch (e: any) {
    console.error("[checkout] error:", e?.message);
    return j({ error: e?.message ?? "Erreur checkout." }, 500);
  }
}

import { NextResponse } from "next/server";
import Stripe from "stripe";
import nodemailer from "nodemailer";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ✅ Lazy init Stripe (évite crash build si STRIPE_SECRET_KEY absente au chargement)
let stripeSingleton: Stripe | null = null;
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Config manquante: STRIPE_SECRET_KEY");
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(key, {
      // ✅ Optionnel mais recommandé pour stabilité
      // apiVersion: "2024-06-20",
    });
  }
  return stripeSingleton;
}

function j(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function asString(x: any) {
  return typeof x === "string" ? x : x == null ? "" : String(x);
}

function isExpired(expiresAt?: string | null) {
  if (!expiresAt) return false;
  const t = new Date(String(expiresAt)).getTime();
  if (!Number.isFinite(t)) return false;
  return t <= Date.now();
}

/* =========================
   EMAIL (SMTP Gmail / Workspace)
========================= */

let mailerSingleton: nodemailer.Transporter | null = null;

function getMailer() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("Config SMTP manquante (SMTP_HOST/SMTP_USER/SMTP_PASS).");
  }

  if (!mailerSingleton) {
    mailerSingleton = nodemailer.createTransport({
      host,
      port,
      secure: false, // 587 = STARTTLS
      auth: { user, pass },
    });
  }

  return mailerSingleton;
}

async function getUserEmailById(admin: SupabaseClient<any, any, any>, userId: string) {
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error) throw new Error(`auth.getUserById failed: ${error.message}`);
  return data?.user?.email ?? null;
}

function buildPaymentEmail(params: { bookingId: string }) {
  const { bookingId } = params;

  const subject = "Paiement confirmé — votre réservation est validée";

  const text = `Bonjour,

Votre paiement a bien été confirmé. Votre réservation est maintenant validée.

Référence réservation : ${bookingId}

Merci,
Lightbooker`;

  const html = `
  <div style="font-family:Arial,sans-serif;line-height:1.5">
    <h2>Paiement confirmé</h2>
    <p>Votre paiement a bien été confirmé. Votre réservation est maintenant <b>validée</b>.</p>
    <p><b>Référence réservation :</b> ${bookingId}</p>
    <p>Merci,<br/>Lightbooker</p>
  </div>`;

  return { subject, text, html };
}

async function sendPaymentConfirmationEmail(params: {
  admin: SupabaseClient<any, any, any>;
  renterId: string;
  bookingId: string;
}) {
  const { admin, renterId, bookingId } = params;

  const to = await getUserEmailById(admin, renterId);
  if (!to) {
    console.warn("[webhook] email: renter email introuvable", { renterId, bookingId });
    return;
  }

  const smtpUser = process.env.SMTP_USER!;
  const from = process.env.EMAIL_FROM || `"Lightbooker" <${smtpUser}>`;

  const transporter = getMailer();
  const { subject, text, html } = buildPaymentEmail({ bookingId });

  const info = await transporter.sendMail({ from, to, subject, text, html });

  console.log("[webhook] email: confirmation envoyée", {
    bookingId,
    to,
    messageId: info.messageId,
    accepted: info.accepted,
  });
}

/* =========================
   AUTO MESSAGE (messagerie interne)
========================= */

function buildAutoMessage() {
  return "Bonjour, je vous contacte suite à ma réservation. Pouvez-vous me confirmer les détails (arrivée, accès, etc.) ? Merci.";
}

async function maybeCreateAutoMessage(params: {
  admin: SupabaseClient<any, any, any>;
  bookingId: string;
  renterId: string;
  hostId: string;
}) {
  const { admin, bookingId, renterId, hostId } = params;

  const { data: existing, error: exErr } = await admin.from("messages").select("id").eq("booking_id", bookingId).limit(1);
  if (exErr) {
    console.warn("[webhook] auto-message: check existing failed:", exErr.message);
    return;
  }

  if (existing && existing.length > 0) {
    console.log("[webhook] auto-message: déjà des messages, skip");
    return;
  }

  const nowIso = new Date().toISOString();

  const payload = {
    booking_id: bookingId,
    sender_id: renterId,
    receiver_id: hostId,
    body: buildAutoMessage(),
    read_by_renter_at: nowIso,
    read_by_host_at: null,
  } as any;

  const { error: insErr } = await admin.from("messages").insert([payload] as any);
  if (insErr) {
    console.warn("[webhook] auto-message insert failed:", insErr.message);
    return;
  }

  console.log("[webhook] auto-message: créé", { bookingId });
}

/* =========================
   Stripe helpers
========================= */

async function tryLogStripeEvent(params: { admin: SupabaseClient<any, any, any>; event: Stripe.Event }) {
  const { admin, event } = params;

  try {
    const createdUnix = (event as any).created;
    const createdIso = typeof createdUnix === "number" ? new Date(createdUnix * 1000).toISOString() : null;

    const { error } = await admin.from("stripe_events").insert({
      id: event.id,
      type: event.type,
      created: createdIso,
      livemode: Boolean((event as any).livemode),
      status: "processing",
      payload: event,
    });

    if (error) {
      const code = (error as any)?.code;
      if (code === "23505") console.log("[webhook] stripe_events: déduplication", event.id);
      else console.warn("[webhook] stripe_events: insert failed (non bloquant):", error.message, "code:", code);
    }
  } catch (e: any) {
    console.warn("[webhook] stripe_events: exception (non bloquant):", e?.message);
  }
}

async function markStripeEventDone(params: { admin: SupabaseClient<any, any, any>; eventId: string; patch: Record<string, any> }) {
  const { admin, eventId, patch } = params;
  try {
    await admin.from("stripe_events").update({ ...patch, processed_at: new Date().toISOString() }).eq("id", eventId);
  } catch {
    // non bloquant
  }
}

async function resolveBookingIdFromCheckoutSession(params: { admin: SupabaseClient<any, any, any>; session: Stripe.Checkout.Session }) {
  const { admin, session } = params;

  const sessionId = asString(session.id).trim();
  const bookingIdFromMetadata = asString(session?.metadata?.bookingId).trim();
  if (bookingIdFromMetadata) return bookingIdFromMetadata;

  const { data, error } = await admin.from("bookings").select("id").eq("stripe_checkout_session_id", sessionId).maybeSingle();
  if (error) throw new Error(`Fallback lookup error: ${error.message}`);
  return data?.id ? String(data.id) : null;
}

async function resolveBookingIdFromPaymentIntent(params: {
  stripe: Stripe;
  admin: SupabaseClient<any, any, any>;
  pi: Stripe.PaymentIntent;
}) {
  const { stripe, admin, pi } = params;

  const bookingIdFromMetadata = asString((pi as any)?.metadata?.bookingId).trim();
  if (bookingIdFromMetadata) return bookingIdFromMetadata;

  try {
    const sessions = await stripe.checkout.sessions.list({ payment_intent: pi.id, limit: 1 });
    const s = sessions.data?.[0] ?? null;
    if (!s) return null;
    return await resolveBookingIdFromCheckoutSession({ admin, session: s });
  } catch {
    return null;
  }
}

// ✅ Nouveau : décide si on considère la session “payée”
async function isCheckoutPaidOrSucceeded(stripe: Stripe, session: Stripe.Checkout.Session) {
  if (session.payment_status === "paid") return true;

  // fallback : si payment_intent existe, on vérifie son status
  const piId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent as any)?.id ?? null;

  if (!piId) return false;

  try {
    const pi = await stripe.paymentIntents.retrieve(piId);
    return String(pi.status || "").toLowerCase() === "succeeded";
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const t0 = Date.now();
  let event: Stripe.Event | null = null;

  if (!STRIPE_WEBHOOK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[webhook] Config manquante", {
      hasWhsec: !!STRIPE_WEBHOOK_SECRET,
      hasUrl: !!SUPABASE_URL,
      hasSrv: !!SUPABASE_SERVICE_ROLE_KEY,
    });
    return j({ error: "Config manquante (STRIPE_WEBHOOK_SECRET / SUPABASE_URL / SERVICE_ROLE)." }, 500);
  }

  let stripe: Stripe;
  try {
    stripe = getStripe();
  } catch (e: any) {
    console.error("[webhook] Stripe init failed:", e?.message);
    return j({ error: e?.message ?? "Stripe init failed" }, 500);
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return j({ error: "Signature Stripe manquante." }, 400);

  const body = await req.text();

  try {
    event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error("[webhook] Signature invalide", err?.message);
    return j({ error: `Signature invalide: ${err?.message ?? "?"}` }, 400);
  }

  console.log("[webhook] Event reçu:", { type: event.type, id: event.id, livemode: (event as any).livemode });

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  await tryLogStripeEvent({ admin, event });

  try {
    // ✅ On traite aussi les paiements async
    const isCheckoutCompleted = event.type === "checkout.session.completed";
    const isCheckoutAsyncSucceeded = event.type === "checkout.session.async_payment_succeeded";
    const isCheckoutAsyncFailed = event.type === "checkout.session.async_payment_failed";
    const isPiSucceeded = event.type === "payment_intent.succeeded";

    if (!isCheckoutCompleted && !isCheckoutAsyncSucceeded && !isCheckoutAsyncFailed && !isPiSucceeded) {
      await markStripeEventDone({ admin, eventId: event.id, patch: { status: "ignored" } });
      return j({ ok: true, ignored: event.type }, 200);
    }

    // Si async failed : on log et on sort (optionnel : annuler booking)
    if (isCheckoutAsyncFailed) {
      await markStripeEventDone({ admin, eventId: event.id, patch: { status: "processed", note: "async_payment_failed" } });
      return j({ ok: true }, 200);
    }

    let bookingId: string | null = null;
    let sessionId: string | null = null;
    let paymentIntentId: string | null = null;

    if (isCheckoutCompleted || isCheckoutAsyncSucceeded) {
      const session = event.data.object as Stripe.Checkout.Session;

      console.log("[webhook] checkout session:", {
        type: event.type,
        id: session.id,
        payment_status: session.payment_status,
        mode: session.mode,
        metadata: session.metadata,
      });

      const paidOk = await isCheckoutPaidOrSucceeded(stripe, session);
      if (!paidOk) {
        // ✅ En prod, ça peut être “pas encore payé” → on NE le marque plus "ignored" définitivement
        // On le laisse passer : l’event PI succeeded ou async_succeeded confirmera plus tard.
        await markStripeEventDone({
          admin,
          eventId: event.id,
          patch: { status: "processed", note: "session not paid yet (waiting other event)" },
        });
        return j({ ok: true, waiting: true }, 200);
      }

      sessionId = asString(session.id).trim();
      paymentIntentId =
        typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent as any)?.id ?? null;

      bookingId = await resolveBookingIdFromCheckoutSession({ admin, session });
    }

    if (isPiSucceeded) {
      const pi = event.data.object as Stripe.PaymentIntent;

      if (String(pi.status || "").toLowerCase() !== "succeeded") {
        await markStripeEventDone({ admin, eventId: event.id, patch: { status: "ignored", error: "pi.status != succeeded" } });
        return j({ ok: true }, 200);
      }

      paymentIntentId = pi.id;
      bookingId = await resolveBookingIdFromPaymentIntent({ stripe, admin, pi });
    }

    if (!bookingId) {
      await markStripeEventDone({ admin, eventId: event.id, patch: { status: "error", error: "Booking introuvable (bookingId introuvable)." } });
      return j({ error: "Booking introuvable (bookingId introuvable)." }, 400);
    }

    const { data: current, error: curErr } = await admin
      .from("bookings")
      .select("id,status,payment_status,renter_id,listing_id,expires_at,stripe_checkout_session_id")
      .eq("id", bookingId)
      .single();

    if (curErr || !current) {
      await markStripeEventDone({ admin, eventId: event.id, patch: { status: "error", error: "Booking introuvable (ou non lisible).", booking_id: bookingId } });
      return j({ error: "Booking introuvable (ou non lisible)." }, 404);
    }

    const payLower = asString((current as any).payment_status).toLowerCase();
    const statusLower = asString(current.status).toLowerCase();

    if (statusLower === "cancelled" || statusLower === "canceled") {
      await markStripeEventDone({ admin, eventId: event.id, patch: { status: "ignored", error: "booking cancelled", booking_id: bookingId } });
      return j({ ok: true }, 200);
    }

    if (isExpired((current as any).expires_at)) {
      await markStripeEventDone({ admin, eventId: event.id, patch: { status: "ignored", error: "booking expired (server-side)", booking_id: bookingId } });
      return j({ ok: true }, 200);
    }

    if (sessionId) {
      const currentSessionId = asString((current as any).stripe_checkout_session_id).trim();
      if (currentSessionId && currentSessionId !== sessionId) {
        await markStripeEventDone({ admin, eventId: event.id, patch: { status: "error", error: "stripe_checkout_session_id mismatch", booking_id: bookingId } });
        return j({ error: "Session mismatch" }, 400);
      }
    }

    // déjà confirmé
    if (payLower === "paid" || statusLower === "confirmed" || statusLower === "paid") {
      try {
        const renterId = String((current as any).renter_id || "");
        const listingId = String((current as any).listing_id || "");
        if (renterId && listingId && bookingId) {
          const { data: listing } = await admin.from("listings").select("user_id").eq("id", listingId).maybeSingle();
          const hostId = listing?.user_id ? String(listing.user_id) : "";
          if (hostId) await maybeCreateAutoMessage({ admin, bookingId, renterId, hostId });
        }
      } catch {}

      try {
        const renterId = String((current as any).renter_id || "");
        if (renterId && bookingId) await sendPaymentConfirmationEmail({ admin, renterId, bookingId });
      } catch {}

      await markStripeEventDone({ admin, eventId: event.id, patch: { status: "processed", booking_id: bookingId } });
      return j({ ok: true }, 200);
    }

    // ✅ Update booking
    const updatePayload: any = {
      status: "confirmed",
      payment_status: "paid",
      paid_at: new Date().toISOString(),
      expires_at: null,
    };
    if (sessionId) updatePayload.stripe_checkout_session_id = sessionId;
    if (paymentIntentId) updatePayload.stripe_payment_intent_id = paymentIntentId;

    const { data: updated, error: upErr } = await admin
      .from("bookings")
      .update(updatePayload)
      .eq("id", bookingId)
      .select("id,status,payment_status,paid_at,expires_at,stripe_checkout_session_id,renter_id,listing_id")
      .single();

    if (upErr || !updated) {
      await markStripeEventDone({ admin, eventId: event.id, patch: { status: "error", error: `Update failed: ${upErr?.message ?? "?"}`, booking_id: bookingId } });
      return j({ error: `Update failed: ${upErr?.message ?? "unknown"}` }, 500);
    }

    // auto-message
    try {
      const renterId = String((updated as any).renter_id || "");
      const listingId = String((updated as any).listing_id || "");
      if (renterId && listingId && bookingId) {
        const { data: listing } = await admin.from("listings").select("user_id").eq("id", listingId).maybeSingle();
        const hostId = listing?.user_id ? String(listing.user_id) : "";
        if (hostId) await maybeCreateAutoMessage({ admin, bookingId, renterId, hostId });
      }
    } catch {}

    // email
    try {
      const renterId = String((updated as any).renter_id || "");
      if (renterId && bookingId) await sendPaymentConfirmationEmail({ admin, renterId, bookingId });
    } catch {}

    await markStripeEventDone({ admin, eventId: event.id, patch: { status: "processed", booking_id: bookingId } });

    console.log("[webhook] DONE en", Date.now() - t0, "ms");
    return j({ ok: true }, 200);
  } catch (e: any) {
    console.error("[webhook] erreur interne", e?.message);
    try {
      if (event?.id) await markStripeEventDone({ admin, eventId: event.id, patch: { status: "error", error: e?.message ?? "Erreur webhook." } });
    } catch {}
    return j({ error: e?.message ?? "Erreur webhook." }, 500);
  }
}

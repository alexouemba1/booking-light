import { NextResponse } from "next/server";
import Stripe from "stripe";
import nodemailer from "nodemailer";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ✅ Lazy init Stripe
let stripeSingleton: Stripe | null = null;
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Config manquante: STRIPE_SECRET_KEY");
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(key);
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

function formatDateFr(d: string | null | undefined) {
  if (!d) return "";
  const dt = new Date(d);
  if (!Number.isFinite(dt.getTime())) return String(d);
  return dt.toLocaleDateString("fr-FR");
}

function formatEurosFromCents(cents: any) {
  const n = Number(cents);
  if (!Number.isFinite(n)) return "";
  const euros = (n / 100).toFixed(2).replace(".", ",");
  return `${euros} €`;
}

/* =========================
   EMAIL (SMTP)
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

async function getUserById(admin: SupabaseClient<any, any, any>, userId: string) {
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error) throw new Error(`auth.getUserById failed: ${error.message}`);
  return data?.user ?? null;
}

function getDisplayNameFromUser(u: any) {
  const md = (u?.user_metadata || {}) as any;
  return asString(md?.full_name || md?.name || md?.first_name || "").trim();
}

/* =========================
   EMAIL TEMPLATES
========================= */

function buildRenterPaymentEmail(params: {
  bookingId: string;
  title: string;
  startDate: string;
  endDate: string;
  amount: string;
  firstName: string;
}) {
  const { bookingId, title, startDate, endDate, amount, firstName } = params;

  const subject = "✅ Réservation confirmée – Booking-Light";
  const greet = firstName ? `Bonjour ${firstName},` : "Bonjour,";

  const text = `${greet}

Bonne nouvelle 🎉
Votre réservation a bien été confirmée et votre paiement a été reçu.

Détails de votre réservation :
• Logement : ${title || "-"}
• Dates : du ${startDate || "-"} au ${endDate || "-"}
• Montant payé : ${amount || "-"}

Vous pouvez retrouver votre réservation à tout moment depuis votre espace Booking-Light.

L’hôte peut désormais vous contacter via la messagerie interne pour organiser votre arrivée.

Merci pour votre confiance et très bon séjour ✨

—
L’équipe Booking-Light

Référence : ${bookingId}
`;

  const html = `
  <div style="font-family:Arial,sans-serif;line-height:1.55;color:#111">
    <p style="margin:0 0 12px 0">${greet}</p>

    <p style="margin:0 0 12px 0">
      Bonne nouvelle 🎉<br/>
      Votre réservation a bien été <b>confirmée</b> et votre paiement a été reçu.
    </p>

    <div style="border:1px solid #eee;border-radius:12px;padding:12px 14px;background:#fafafa;margin:12px 0">
      <div style="font-weight:700;margin-bottom:6px">Détails de votre réservation :</div>
      <div>• <b>Logement :</b> ${title || "-"}</div>
      <div>• <b>Dates :</b> du ${startDate || "-"} au ${endDate || "-"}</div>
      <div>• <b>Montant payé :</b> ${amount || "-"}</div>
    </div>

    <p style="margin:0 0 10px 0">
      Vous pouvez retrouver votre réservation à tout moment depuis votre espace Booking-Light.
    </p>

    <p style="margin:0 0 12px 0">
      L’hôte peut désormais vous contacter via la messagerie interne pour organiser votre arrivée.
    </p>

    <p style="margin:0">
      Merci pour votre confiance et très bon séjour ✨<br/>
      —<br/>
      <b>L’équipe Booking-Light</b>
    </p>

    <p style="margin:14px 0 0 0;color:#666;font-size:12px">Référence : ${bookingId}</p>
  </div>`;

  return { subject, text, html };
}

function buildHostPaymentEmail(params: {
  title: string;
  startDate: string;
  endDate: string;
  amount: string;
  renterName: string;
}) {
  const { title, startDate, endDate, amount, renterName } = params;

  const subject = "📢 Nouvelle réservation confirmée";

  const text = `Bonjour,

Une nouvelle réservation vient d’être confirmée pour votre logement.

Détails de la réservation :
• Logement : ${title || "-"}
• Dates : du ${startDate || "-"} au ${endDate || "-"}
• Voyageur : ${renterName || "-"}
• Montant : ${amount || "-"}

Le paiement a été validé.
Vous pouvez contacter le voyageur dès maintenant via la messagerie Booking-Light afin de préparer son arrivée.

Bonne réservation 👍

—
Booking-Light
`;

  const html = `
  <div style="font-family:Arial,sans-serif;line-height:1.55;color:#111">
    <p style="margin:0 0 12px 0">Bonjour,</p>

    <p style="margin:0 0 12px 0">
      Une nouvelle réservation vient d’être <b>confirmée</b> pour votre logement.
    </p>

    <div style="border:1px solid #eee;border-radius:12px;padding:12px 14px;background:#fafafa;margin:12px 0">
      <div style="font-weight:700;margin-bottom:6px">Détails de la réservation :</div>
      <div>• <b>Logement :</b> ${title || "-"}</div>
      <div>• <b>Dates :</b> du ${startDate || "-"} au ${endDate || "-"}</div>
      <div>• <b>Voyageur :</b> ${renterName || "-"}</div>
      <div>• <b>Montant :</b> ${amount || "-"}</div>
    </div>

    <p style="margin:0 0 12px 0">
      Le paiement a été validé.<br/>
      Vous pouvez contacter le voyageur dès maintenant via la messagerie Booking-Light afin de préparer son arrivée.
    </p>

    <p style="margin:0">
      Bonne réservation 👍<br/>
      —<br/>
      <b>Booking-Light</b>
    </p>
  </div>`;

  return { subject, text, html };
}

function buildInternalPaymentEmail(params: {
  bookingId: string;
  title: string;
  startDate: string;
  endDate: string;
  amount: string;
  renterEmail: string;
  hostEmail: string;
}) {
  const { bookingId, title, startDate, endDate, amount, renterEmail, hostEmail } = params;

  const subject = "📥 Réservation confirmée – suivi interne";

  const text = `Réservation confirmée

• ID réservation : ${bookingId}
• Logement : ${title || "-"}
• Dates : ${startDate || "-"} → ${endDate || "-"}
• Montant : ${amount || "-"}
• Locataire : ${renterEmail || "-"}
• Hôte : ${hostEmail || "-"}
`;

  const html = `
  <div style="font-family:Arial,sans-serif;line-height:1.55;color:#111">
    <h3 style="margin:0 0 10px 0">Réservation confirmée</h3>
    <div>• <b>ID réservation :</b> ${bookingId}</div>
    <div>• <b>Logement :</b> ${title || "-"}</div>
    <div>• <b>Dates :</b> ${startDate || "-"} → ${endDate || "-"}</div>
    <div>• <b>Montant :</b> ${amount || "-"}</div>
    <div>• <b>Locataire :</b> ${renterEmail || "-"}</div>
    <div>• <b>Hôte :</b> ${hostEmail || "-"}</div>
  </div>`;

  return { subject, text, html };
}

async function sendEmail(params: { to: string; subject: string; text: string; html: string }) {
  const { to, subject, text, html } = params;

  const smtpUser = process.env.SMTP_USER!;
  const from = process.env.EMAIL_FROM || `"Booking-Light" <${smtpUser}>`;

  const transporter = getMailer();
  const info = await transporter.sendMail({ from, to, subject, text, html });

  console.log("[webhook] email: envoyé", { to, subject, messageId: info.messageId, accepted: info.accepted });
}

async function sendPaymentEmails(params: {
  admin: SupabaseClient<any, any, any>;
  bookingId: string;
  renterId: string;
  hostId: string;
}) {
  const { admin, bookingId, renterId, hostId } = params;

  const { data: booking, error: bErr } = await admin
    .from("bookings")
    .select("id,start_date,end_date,total_cents,listing_id")
    .eq("id", bookingId)
    .single();

  if (bErr || !booking) {
    console.warn("[webhook] email: booking introuvable pour détails", { bookingId, err: bErr?.message });
    return;
  }

  const { data: listing } = await admin.from("listings").select("title").eq("id", booking.listing_id).maybeSingle();

  const title = asString(listing?.title || "");
  const startDate = formatDateFr(asString((booking as any).start_date));
  const endDate = formatDateFr(asString((booking as any).end_date));
  const amount = formatEurosFromCents((booking as any).total_cents);

  const renterUser = await getUserById(admin, renterId).catch(() => null);
  const hostUser = await getUserById(admin, hostId).catch(() => null);

  const renterEmail = renterUser?.email ?? null;
  const hostEmail = hostUser?.email ?? null;

  const renterName = getDisplayNameFromUser(renterUser);

  if (renterEmail) {
    const mail = buildRenterPaymentEmail({
      bookingId,
      title,
      startDate,
      endDate,
      amount,
      firstName: renterName,
    });
    await sendEmail({ to: renterEmail, subject: mail.subject, text: mail.text, html: mail.html });
  } else {
    console.warn("[webhook] email: renter email introuvable", { renterId, bookingId });
  }

  if (hostEmail) {
    const mail = buildHostPaymentEmail({
      title,
      startDate,
      endDate,
      amount,
      renterName: renterName || renterEmail || "Voyageur",
    });
    await sendEmail({ to: hostEmail, subject: mail.subject, text: mail.text, html: mail.html });
  } else {
    console.warn("[webhook] email: host email introuvable", { hostId, bookingId });
  }

  const internalTo = (process.env.EMAIL_INTERNAL_TO || "").trim();
  if (internalTo) {
    const mail = buildInternalPaymentEmail({
      bookingId,
      title,
      startDate,
      endDate,
      amount,
      renterEmail: renterEmail || "",
      hostEmail: hostEmail || "",
    });
    await sendEmail({ to: internalTo, subject: mail.subject, text: mail.text, html: mail.html });
  }
}

/* =========================
   AUTO MESSAGE
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

  if (existing && existing.length > 0) return;

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
  }
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
  } catch {}
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

async function isCheckoutPaidOrSucceeded(stripe: Stripe, session: Stripe.Checkout.Session) {
  if (session.payment_status === "paid") return true;

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
    const isCheckoutCompleted = event.type === "checkout.session.completed";
    const isCheckoutAsyncSucceeded = event.type === "checkout.session.async_payment_succeeded";
    const isCheckoutAsyncFailed = event.type === "checkout.session.async_payment_failed";
    const isPiSucceeded = event.type === "payment_intent.succeeded";

    if (!isCheckoutCompleted && !isCheckoutAsyncSucceeded && !isCheckoutAsyncFailed && !isPiSucceeded) {
      await markStripeEventDone({ admin, eventId: event.id, patch: { status: "ignored" } });
      return j({ ok: true, ignored: event.type }, 200);
    }

    if (isCheckoutAsyncFailed) {
      await markStripeEventDone({ admin, eventId: event.id, patch: { status: "processed", note: "async_payment_failed" } });
      return j({ ok: true }, 200);
    }

    let bookingId: string | null = null;
    let sessionId: string | null = null;
    let paymentIntentId: string | null = null;
    let paidOk = false;

    if (isCheckoutCompleted || isCheckoutAsyncSucceeded) {
      const session = event.data.object as Stripe.Checkout.Session;

      paidOk = await isCheckoutPaidOrSucceeded(stripe, session);
      if (!paidOk) {
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

      paidOk = true;
      paymentIntentId = pi.id;
      bookingId = await resolveBookingIdFromPaymentIntent({ stripe, admin, pi });
    }

    if (!bookingId) {
      await markStripeEventDone({
        admin,
        eventId: event.id,
        patch: { status: "error", error: "Booking introuvable (bookingId introuvable)." },
      });
      return j({ error: "Booking introuvable (bookingId introuvable)." }, 400);
    }

    const { data: current, error: curErr } = await admin
      .from("bookings")
      .select("id,status,payment_status,renter_id,listing_id,expires_at,stripe_checkout_session_id")
      .eq("id", bookingId)
      .single();

    if (curErr || !current) {
      await markStripeEventDone({
        admin,
        eventId: event.id,
        patch: { status: "error", error: "Booking introuvable (ou non lisible).", booking_id: bookingId },
      });
      return j({ error: "Booking introuvable (ou non lisible)." }, 404);
    }

    const payLower = asString((current as any).payment_status).toLowerCase();
    const statusLower = asString(current.status).toLowerCase();

    // ✅ IMPORTANT FIX:
    // On NE ignore plus une booking annulée/expirée si Stripe dit que c'est payé.
    // Sinon: paiement encaissé mais booking reste annulée (bug métier).
    if (!paidOk) {
      if (statusLower === "cancelled" || statusLower === "canceled") {
        await markStripeEventDone({
          admin,
          eventId: event.id,
          patch: { status: "ignored", error: "booking cancelled (not paid)", booking_id: bookingId },
        });
        return j({ ok: true }, 200);
      }

      if (isExpired((current as any).expires_at)) {
        await markStripeEventDone({
          admin,
          eventId: event.id,
          patch: { status: "ignored", error: "booking expired (not paid)", booking_id: bookingId },
        });
        return j({ ok: true }, 200);
      }
    }

    if (sessionId) {
      const currentSessionId = asString((current as any).stripe_checkout_session_id).trim();
      if (currentSessionId && currentSessionId !== sessionId) {
        await markStripeEventDone({
          admin,
          eventId: event.id,
          patch: { status: "error", error: "stripe_checkout_session_id mismatch", booking_id: bookingId },
        });
        return j({ error: "Session mismatch" }, 400);
      }
    }

    // hostId
    let hostId = "";
    try {
      const listingId = String((current as any).listing_id || "");
      if (listingId) {
        const { data: listing } = await admin.from("listings").select("user_id").eq("id", listingId).maybeSingle();
        hostId = listing?.user_id ? String(listing.user_id) : "";
      }
    } catch {}

    // déjà confirmé / payé => on garde, mais on peut (re)envoyer mails & message
    if (payLower === "paid" || statusLower === "confirmed" || statusLower === "paid") {
      try {
        const renterId = String((current as any).renter_id || "");
        if (renterId && bookingId && hostId) {
          await maybeCreateAutoMessage({ admin, bookingId, renterId, hostId });
          await sendPaymentEmails({ admin, bookingId, renterId, hostId });
        }
      } catch (e: any) {
        console.warn("[webhook] post-paid actions (non bloquant):", e?.message);
      }

      await markStripeEventDone({ admin, eventId: event.id, patch: { status: "processed", booking_id: bookingId } });
      return j({ ok: true }, 200);
    }

    // ✅ Update booking (répare aussi une booking annulée/expirée)
    const updatePayload: any = {
      status: "confirmed",
      payment_status: "paid",
      paid_at: new Date().toISOString(),
      expires_at: null,
      cancelled_at: null,
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
      await markStripeEventDone({
        admin,
        eventId: event.id,
        patch: { status: "error", error: `Update failed: ${upErr?.message ?? "?"}`, booking_id: bookingId },
      });
      return j({ error: `Update failed: ${upErr?.message ?? "unknown"}` }, 500);
    }

    // auto-message + emails
    try {
      const renterId = String((updated as any).renter_id || "");
      const listingId = String((updated as any).listing_id || "");
      let hostId2 = "";

      if (listingId) {
        const { data: listing } = await admin.from("listings").select("user_id").eq("id", listingId).maybeSingle();
        hostId2 = listing?.user_id ? String(listing.user_id) : "";
      }

      if (renterId && bookingId && hostId2) {
        await maybeCreateAutoMessage({ admin, bookingId, renterId, hostId: hostId2 });
        await sendPaymentEmails({ admin, bookingId, renterId, hostId: hostId2 });
      }
    } catch (e: any) {
      console.warn("[webhook] post-update actions (non bloquant):", e?.message);
    }

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

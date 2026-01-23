// FILE: src/app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

function asString(x: any) {
  return typeof x === "string" ? x : x == null ? "" : String(x);
}

function isExpired(expiresAt?: string | null) {
  if (!expiresAt) return false;
  const t = new Date(String(expiresAt)).getTime();
  if (!Number.isFinite(t)) return false;
  return t <= Date.now();
}

// ✅ Message automatique (modifiable)
function buildAutoMessage() {
  return "Bonjour, je vous contacte suite à ma réservation. Pouvez-vous me confirmer les détails (arrivée, accès, etc.) ? Merci.";
}

// ✅ Create auto-message uniquement si aucune conversation pour ce booking
async function maybeCreateAutoMessage(params: {
  admin: SupabaseClient<any, any, any>;
  bookingId: string;
  renterId: string;
  hostId: string;
}) {
  const { admin, bookingId, renterId, hostId } = params;

  const { data: existing, error: exErr } = await admin
    .from("messages")
    .select("id")
    .eq("booking_id", bookingId)
    .limit(1);

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

export async function POST(req: Request) {
  const t0 = Date.now();

  // 0) Vérif config
  if (!STRIPE_SECRET_KEY) {
    console.error("[webhook] STRIPE_SECRET_KEY manquante");
    return j({ error: "STRIPE_SECRET_KEY manquante" }, 500);
  }
  if (!STRIPE_WEBHOOK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[webhook] Config manquante", {
      hasWhsec: !!STRIPE_WEBHOOK_SECRET,
      hasUrl: !!SUPABASE_URL,
      hasSrv: !!SUPABASE_SERVICE_ROLE_KEY,
    });
    return j(
      { error: "Config manquante (STRIPE_WEBHOOK_SECRET / SUPABASE_URL / SERVICE_ROLE)." },
      500
    );
  }

  // ✅ Instancier Stripe ici (lazy)
  let stripe: Stripe;
  try {
    stripe = getStripe();
  } catch (e: any) {
    console.error("[webhook] Stripe init failed:", e?.message);
    return j({ error: e?.message ?? "Stripe init failed" }, 500);
  }

  // 1) Signature
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    console.error("[webhook] stripe-signature manquante");
    return j({ error: "Signature Stripe manquante." }, 400);
  }

  // 2) Raw body + construct event
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error("[webhook] Signature invalide", err?.message);
    return j({ error: `Signature invalide: ${err?.message ?? "?"}` }, 400);
  }

  console.log("[webhook] Event reçu:", {
    type: event.type,
    id: event.id,
    livemode: (event as any).livemode,
  });

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // 3) Idempotence: on enregistre evt_... (si déjà vu, on sort)
  const createdUnix = (event as any).created;
  const createdIso =
    typeof createdUnix === "number" ? new Date(createdUnix * 1000).toISOString() : null;

  const { error: evtInsertErr } = await admin.from("stripe_events").insert({
    id: event.id,
    type: event.type,
    created: createdIso,
    livemode: Boolean((event as any).livemode),
    status: "processing",
    payload: event,
  });

  if (evtInsertErr) {
    // ✅ On ne “dedupe” QUE si c’est une duplication (unique violation)
    const code = (evtInsertErr as any)?.code;
    if (code === "23505") {
      console.log("[webhook] Event déjà traité (idempotence):", event.id);
      return j({ ok: true, deduped: true }, 200);
    }

    console.error("[webhook] stripe_events insert failed:", evtInsertErr.message, "code:", code);
    return j({ error: "stripe_events insert failed" }, 500);
  }

  try {
    // On ne traite que checkout.session.completed
    if (event.type !== "checkout.session.completed") {
      console.log("[webhook] Ignoré:", event.type);

      await admin
        .from("stripe_events")
        .update({ status: "ignored", processed_at: new Date().toISOString() })
        .eq("id", event.id);

      return j({ ok: true, ignored: event.type }, 200);
    }

    const session = event.data.object as Stripe.Checkout.Session;

    console.log("[webhook] checkout.session.completed:", {
      id: session.id,
      payment_status: session.payment_status,
      mode: session.mode,
      metadata: session.metadata,
    });

    if (session.payment_status !== "paid") {
      console.log("[webhook] Ignoré: payment_status != paid");

      await admin
        .from("stripe_events")
        .update({
          status: "ignored",
          error: "payment_status != paid",
          processed_at: new Date().toISOString(),
        })
        .eq("id", event.id);

      return j({ ok: true, note: "payment_status != paid" }, 200);
    }

    const sessionId = asString(session.id);
    const bookingIdFromMetadata = asString(session?.metadata?.bookingId).trim();

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : (session.payment_intent as any)?.id ?? null;

    // A) bookingId via metadata, sinon fallback via stripe_checkout_session_id
    let bookingId: string | null = null;

    if (bookingIdFromMetadata) {
      bookingId = bookingIdFromMetadata;
      console.log("[webhook] bookingId depuis metadata:", bookingId);
    } else {
      console.log("[webhook] metadata.bookingId manquant → fallback via session.id");

      const { data: b2, error: b2Err } = await admin
        .from("bookings")
        .select("id,status,stripe_checkout_session_id")
        .eq("stripe_checkout_session_id", sessionId)
        .maybeSingle();

      if (b2Err) {
        console.error("[webhook] fallback lookup error:", b2Err.message);

        await admin
          .from("stripe_events")
          .update({
            status: "error",
            error: `Fallback lookup error: ${b2Err.message}`,
            processed_at: new Date().toISOString(),
          })
          .eq("id", event.id);

        return j({ error: "Fallback lookup failed" }, 500);
      }

      if (!b2) {
        console.log("[webhook] fallback: aucune booking trouvée pour session.id:", sessionId);

        await admin
          .from("stripe_events")
          .update({
            status: "error",
            error: "No booking for session.id",
            processed_at: new Date().toISOString(),
          })
          .eq("id", event.id);

        return j({ error: "No booking for session.id" }, 400);
      }

      bookingId = b2.id;
      console.log("[webhook] bookingId trouvé via session.id:", bookingId, "status actuel:", b2.status);
    }

    // B) Charger booking (avec infos nécessaires)
    const { data: current, error: curErr } = await admin
      .from("bookings")
      .select("id,status,payment_status,renter_id,listing_id,expires_at,stripe_checkout_session_id")
      .eq("id", bookingId)
      .single();

    console.log("[webhook] booking lookup:", {
      bookingId,
      found: !!current,
      curErr: curErr?.message,
    });

    if (curErr || !current) {
      await admin
        .from("stripe_events")
        .update({
          status: "error",
          error: "Booking introuvable (ou non lisible).",
          booking_id: bookingId,
          processed_at: new Date().toISOString(),
        })
        .eq("id", event.id);

      return j({ error: "Booking introuvable (ou non lisible)." }, 404);
    }

    const payLower = asString((current as any).payment_status).toLowerCase();
    const statusLower = asString(current.status).toLowerCase();

    // ✅ Verrou 1: si booking annulée => on NE confirme pas
    if (statusLower === "cancelled" || statusLower === "canceled") {
      console.warn("[webhook] Booking annulée → on n’applique pas paid/confirmed", { bookingId });

      await admin
        .from("stripe_events")
        .update({
          status: "ignored",
          error: "booking cancelled",
          booking_id: bookingId,
          processed_at: new Date().toISOString(),
        })
        .eq("id", event.id);

      return j({ ok: true, ignored: "booking cancelled" }, 200);
    }

    // ✅ Verrou 2: si option expirée côté serveur => on NE confirme pas
    if (isExpired((current as any).expires_at)) {
      console.warn("[webhook] Booking expirée côté serveur → on n’applique pas paid/confirmed", {
        bookingId,
        expires_at: (current as any).expires_at,
      });

      await admin
        .from("stripe_events")
        .update({
          status: "ignored",
          error: "booking expired (server-side)",
          booking_id: bookingId,
          processed_at: new Date().toISOString(),
        })
        .eq("id", event.id);

      return j({ ok: true, ignored: "booking expired" }, 200);
    }

    // ✅ Verrou 3: cohérence session ↔ booking (si déjà set et différent => on bloque)
    const currentSessionId = asString((current as any).stripe_checkout_session_id).trim();
    if (currentSessionId && currentSessionId !== sessionId) {
      console.warn("[webhook] Mismatch stripe_checkout_session_id → on n’écrase pas", {
        bookingId,
        currentSessionId,
        sessionId,
      });

      await admin
        .from("stripe_events")
        .update({
          status: "error",
          error: "stripe_checkout_session_id mismatch",
          booking_id: bookingId,
          processed_at: new Date().toISOString(),
        })
        .eq("id", event.id);

      return j({ error: "Session mismatch" }, 400);
    }

    // ✅ Déjà confirmé/paid -> on ne retouche pas la booking
    // ✅ MAIS on peut quand même tenter l’auto-message si la conversation est vide
    if (payLower === "paid" || statusLower === "confirmed" || statusLower === "paid") {
      console.log("[webhook] Déjà confirmé/paid → stop (auto-message possible)");

      try {
        const renterId = String((current as any).renter_id || "");
        const listingId = String((current as any).listing_id || "");

        if (renterId && listingId) {
          const { data: listing } = await admin
            .from("listings")
            .select("user_id")
            .eq("id", listingId)
            .maybeSingle();

          const hostId = listing?.user_id ? String(listing.user_id) : "";

          if (hostId && bookingId) {
            const bookingIdStr: string = bookingId;
            await maybeCreateAutoMessage({ admin, bookingId: bookingIdStr, renterId, hostId });
          }
        }
      } catch (e: any) {
        console.warn("[webhook] auto-message warn:", e?.message);
      }

      await admin
        .from("stripe_events")
        .update({
          status: "processed",
          booking_id: bookingId,
          processed_at: new Date().toISOString(),
        })
        .eq("id", event.id);

      return j({ ok: true, note: "Déjà confirmé." }, 200);
    }

    // C) Update booking
    const updatePayload: any = {
      status: "confirmed",
      payment_status: "paid",
      paid_at: new Date().toISOString(),
      expires_at: null,
      stripe_checkout_session_id: sessionId,
    };

    if (paymentIntentId) updatePayload.stripe_payment_intent_id = paymentIntentId;

    const { data: updated, error: upErr } = await admin
      .from("bookings")
      .update(updatePayload)
      .eq("id", bookingId)
      .select("id,status,payment_status,paid_at,expires_at,stripe_checkout_session_id,renter_id,listing_id")
      .single();

    console.log("[webhook] update result:", { upErr: upErr?.message, updated });

    if (upErr || !updated) {
      await admin
        .from("stripe_events")
        .update({
          status: "error",
          error: `Update failed: ${upErr?.message ?? "?"}`,
          booking_id: bookingId,
          processed_at: new Date().toISOString(),
        })
        .eq("id", event.id);

      console.error("[webhook] Update failed:", upErr?.message);
      return j({ error: `Update failed: ${upErr?.message ?? "unknown"}` }, 500);
    }

    // ✅ D) Auto-message après paiement (non bloquant)
    try {
      const renterId = String((updated as any).renter_id || "");
      const listingId = String((updated as any).listing_id || "");

      if (renterId && listingId) {
        const { data: listing, error: lErr } = await admin
          .from("listings")
          .select("user_id")
          .eq("id", listingId)
          .maybeSingle();

        if (!lErr && listing?.user_id) {
          const hostId = String(listing.user_id);

          if (bookingId) {
            const bookingIdStr: string = bookingId;
            await maybeCreateAutoMessage({ admin, bookingId: bookingIdStr, renterId, hostId });
          }
        } else {
          console.warn("[webhook] auto-message: listing lookup failed", lErr?.message);
        }
      }
    } catch (e: any) {
      console.warn("[webhook] auto-message warn:", e?.message);
    }

    // E) Marquer l’event comme traité
    await admin
      .from("stripe_events")
      .update({
        status: "processed",
        booking_id: bookingId,
        processed_at: new Date().toISOString(),
      })
      .eq("id", event.id);

    console.log("[webhook] DONE en", Date.now() - t0, "ms");
    return j({ ok: true }, 200);
  } catch (e: any) {
    console.error("[webhook] erreur interne", e?.message);

    try {
      await admin
        .from("stripe_events")
        .update({
          status: "error",
          error: e?.message ?? "Erreur webhook.",
          processed_at: new Date().toISOString(),
        })
        .eq("id", (e as any)?.event?.id ?? "");
    } catch {}

    return j({ error: e?.message ?? "Erreur webhook." }, 500);
  }
}

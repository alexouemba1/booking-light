import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const stripe = new Stripe(STRIPE_SECRET_KEY ?? "");


function j(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function asString(x: any) {
  return typeof x === "string" ? x : x == null ? "" : String(x);
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

  // Conversation déjà existante ? => stop
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

  // Message envoyé par le renter -> lu côté renter, non lu côté host
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
    return j({ error: "Config manquante (STRIPE_WEBHOOK_SECRET / SUPABASE_URL / SERVICE_ROLE)." }, 500);
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
  const createdIso = typeof createdUnix === "number" ? new Date(createdUnix * 1000).toISOString() : null;

  const { error: evtInsertErr } = await admin.from("stripe_events").insert({
    id: event.id,
    type: event.type,
    created: createdIso,
    livemode: Boolean((event as any).livemode),
    status: "processing",
    payload: event,
  });

  if (evtInsertErr) {
    console.log("[webhook] Event déjà traité (idempotence):", event.id, evtInsertErr.message);
    return j({ ok: true, deduped: true }, 200);
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
        .select("id,status")
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

    // B) Charger booking (avec renter_id + listing_id pour auto-message)
    const { data: current, error: curErr } = await admin
      .from("bookings")
      .select("id,status,payment_status,renter_id,listing_id")
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

    // ✅ Déjà confirmé/paid -> on ne retouche pas la booking
    // ✅ MAIS on peut quand même tenter l’auto-message si la conversation est vide
    if (payLower === "paid" || statusLower === "confirmed") {
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
          await maybeCreateAutoMessage({ admin, bookingId, renterId, hostId });
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
    // ✅ status = confirmed ; payment_status = paid ; expires_at=null
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
          await maybeCreateAutoMessage({ admin, bookingId, renterId, hostId });
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
        .eq("id", event.id);
    } catch {}

    return j({ error: e?.message ?? "Erreur webhook." }, 500);
  }
}

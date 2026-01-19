import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function j(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function getBearerToken(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m?.[1] ?? null;
}

export async function POST(req: Request) {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return j({ error: "Config serveur manquante (SUPABASE_URL / SERVICE_ROLE_KEY)." }, 500);
    }

    const token = getBearerToken(req);
    if (!token) return j({ error: "Non authentifié." }, 401);

    const body = await req.json();
    const bookingId = String(body?.bookingId || "").trim();
    const text = String(body?.body || "").trim();

    if (!bookingId || !text) return j({ error: "Champs manquants (bookingId, body)." }, 400);
    if (text.length > 2000) return j({ error: "Message trop long (max 2000 caractères)." }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) return j({ error: "Token invalide." }, 401);

    const uid = userData.user.id;

    // Booking
    const { data: booking, error: bErr } = await admin
      .from("bookings")
      .select("id, renter_id, listing_id")
      .eq("id", bookingId)
      .single();

    if (bErr || !booking) return j({ error: "Réservation introuvable." }, 404);

    // Listing (host)
    const { data: listing, error: lErr } = await admin
      .from("listings")
      .select("id, user_id")
      .eq("id", booking.listing_id)
      .single();

    if (lErr || !listing) return j({ error: "Annonce introuvable." }, 404);

    const renterId = String(booking.renter_id);
    const hostId = String(listing.user_id);

    const isParticipant = uid === renterId || uid === hostId;
    if (!isParticipant) return j({ error: "Accès refusé." }, 403);

    const isHost = uid === hostId;
    const receiverId = isHost ? renterId : hostId;

    const nowIso = new Date().toISOString();

    // ✅ Si j'envoie, mon côté = lu, l'autre côté = non lu
    const read_by_host_at = isHost ? nowIso : null;
    const read_by_renter_at = !isHost ? nowIso : null;

    const { data: created, error: insErr } = await admin
      .from("messages")
      .insert({
        booking_id: bookingId,
        sender_id: uid,
        receiver_id: receiverId,
        body: text,
        read_by_host_at,
        read_by_renter_at,
      })
      .select("id, booking_id, sender_id, receiver_id, body, created_at, read_by_host_at, read_by_renter_at")
      .single();

    if (insErr) return j({ error: insErr.message }, 400);

    return j({ ok: true, message: created }, 200);
  } catch (e: any) {
    return j({ error: e?.message ?? "Erreur serveur." }, 500);
  }
}

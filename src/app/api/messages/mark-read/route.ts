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
    if (!bookingId) return j({ error: "bookingId requis." }, 400);

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
    const nowIso = new Date().toISOString();

    if (isHost) {
      await admin
        .from("messages")
        .update({ read_by_host_at: nowIso })
        .eq("booking_id", bookingId)
        .eq("receiver_id", uid)
        .is("read_by_host_at", null);
    } else {
      await admin
        .from("messages")
        .update({ read_by_renter_at: nowIso })
        .eq("booking_id", bookingId)
        .eq("receiver_id", uid)
        .is("read_by_renter_at", null);
    }

    return j({ ok: true }, 200);
  } catch (e: any) {
    return j({ error: e?.message ?? "Erreur serveur." }, 500);
  }
}

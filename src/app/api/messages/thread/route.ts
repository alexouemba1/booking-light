import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/messages/thread?bookingId=...
 * Rôle :
 * - Vérifie l’authentification (Bearer token)
 * - Vérifie que l’utilisateur est participant à la réservation
 * - Retourne le thread de messages pour une réservation donnée
 * - AUCUN effet de bord (lecture seule)
 */

function j(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function getBearerToken(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m?.[1] ?? null;
}

export async function GET(req: Request) {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return j({ error: "Config serveur manquante (SUPABASE_URL / SERVICE_ROLE_KEY)." }, 500);
    }

    const token = getBearerToken(req);
    if (!token) return j({ error: "Non authentifié." }, 401);

    const { searchParams } = new URL(req.url);
    const bookingId = String(searchParams.get("bookingId") || "").trim();
    if (!bookingId) return j({ error: "bookingId requis." }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return j({ error: "Token invalide." }, 401);
    }

    const uid = userData.user.id;

    // Booking
    const { data: booking, error: bErr } = await admin
      .from("bookings")
      .select("id, renter_id, listing_id")
      .eq("id", bookingId)
      .single();

    if (bErr || !booking) {
      return j({ error: "Réservation introuvable." }, 404);
    }

    // Listing (host)
    const { data: listing, error: lErr } = await admin
      .from("listings")
      .select("id, user_id")
      .eq("id", booking.listing_id)
      .single();

    if (lErr || !listing) {
      return j({ error: "Annonce introuvable." }, 404);
    }

    const renterId = String(booking.renter_id);
    const hostId = String(listing.user_id);

    const isParticipant = renterId === uid || hostId === uid;
    if (!isParticipant) {
      return j({ error: "Accès refusé." }, 403);
    }

    const isHost = uid === hostId;

    // Thread (lecture seule)
    const { data: msgs, error: mErr } = await admin
      .from("messages")
      .select(
        "id, booking_id, sender_id, receiver_id, body, created_at, read_by_host_at, read_by_renter_at"
      )
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: true });

    if (mErr) {
      return j({ error: mErr.message }, 400);
    }

    return j(
      {
        ok: true,
        meta: {
          bookingId,
          renterId,
          hostId,
          isHost,
          otherUserId: isHost ? renterId : hostId,
        },
        messages: msgs || [],
      },
      200
    );
  } catch (e: any) {
    return j({ error: e?.message ?? "Erreur serveur." }, 500);
  }
}

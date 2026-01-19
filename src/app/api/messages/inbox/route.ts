import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
      return NextResponse.json({ error: "Config serveur manquante." }, { status: 500 });
    }

    const token = getBearerToken(req);
    if (!token) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Token invalide." }, { status: 401 });
    }

    const uid = userData.user.id;

    // 0) Mes listings (host)
    const { data: myListings, error: myListingsErr } = await admin.from("listings").select("id").eq("user_id", uid);
    if (myListingsErr) return NextResponse.json({ error: myListingsErr.message }, { status: 400 });

    const myListingIds = (myListings || []).map((x: any) => String(x.id));

    // 1A) bookings où je suis renter
    const { data: asRenter, error: renterErr } = await admin
      .from("bookings")
      .select("id, listing_id, renter_id, created_at")
      .eq("renter_id", uid)
      .order("created_at", { ascending: false });

    if (renterErr) return NextResponse.json({ error: renterErr.message }, { status: 400 });

    // 1B) bookings où je suis host
    let asHost: any[] = [];
    if (myListingIds.length > 0) {
      const { data: hostBookings, error: hostErr } = await admin
        .from("bookings")
        .select("id, listing_id, renter_id, created_at")
        .in("listing_id", myListingIds)
        .order("created_at", { ascending: false });

      if (hostErr) return NextResponse.json({ error: hostErr.message }, { status: 400 });
      asHost = hostBookings || [];
    }

    // 1C) merge + dedup
    const mergedMap = new Map<string, any>();
    for (const b of [...(asRenter || []), ...(asHost || [])]) mergedMap.set(String(b.id), b);
    const rows = Array.from(mergedMap.values());

    if (rows.length === 0) return NextResponse.json({ ok: true, items: [] }, { status: 200 });

    // 2) listings infos
    const listingIds = [...new Set(rows.map((r: any) => String(r.listing_id)))];

    const { data: listings, error: lErr } = await admin
      .from("listings")
      .select("id, user_id, title, cover_image_path")
      .in("id", listingIds);

    if (lErr) return NextResponse.json({ error: lErr.message }, { status: 400 });

    const listingById: Record<string, any> = {};
    (listings || []).forEach((l: any) => (listingById[String(l.id)] = l));

    const bookingIds = rows.map((r: any) => String(r.id));

    // 3) messages
    const { data: msgs, error: mErr } = await admin
      .from("messages")
      .select("booking_id, body, created_at, sender_id, receiver_id, read_by_host_at, read_by_renter_at")
      .in("booking_id", bookingIds)
      .order("created_at", { ascending: false });

    if (mErr) return NextResponse.json({ error: mErr.message }, { status: 400 });

    // Grouping: per booking -> last + unread
    const lastByBooking: Record<string, any> = {};
    const unreadByBooking: Record<string, number> = {};

    // Pour savoir si je suis host sur un booking, il faut hostId
    const hostByBooking: Record<string, string> = {};
    const renterByBooking: Record<string, string> = {};

    for (const r of rows) {
      const bookingId = String(r.id);
      const listing = listingById[String(r.listing_id)] || null;
      hostByBooking[bookingId] = listing ? String(listing.user_id) : "";
      renterByBooking[bookingId] = String(r.renter_id);
      unreadByBooking[bookingId] = 0;
    }

    for (const m of msgs || []) {
      const bid = String((m as any).booking_id);

      // last message: comme on est trié DESC, le premier rencontré est le last
      if (!lastByBooking[bid]) lastByBooking[bid] = m;

      // unread: uniquement messages que je REÇOIS et que je n’ai pas lus
      const senderId = String((m as any).sender_id);
      const receiverId = String((m as any).receiver_id);

      if (receiverId !== uid) continue; // je ne reçois pas => pas "unread" pour moi

      const hostId = hostByBooking[bid] || "";
      const isHost = uid === hostId;

      if (isHost) {
        if (!(m as any).read_by_host_at) unreadByBooking[bid] = (unreadByBooking[bid] || 0) + 1;
      } else {
        if (!(m as any).read_by_renter_at) unreadByBooking[bid] = (unreadByBooking[bid] || 0) + 1;
      }
    }

    const items = rows
      .map((r: any) => {
        const bookingId = String(r.id);
        const listingId = String(r.listing_id);
        const listing = listingById[listingId] || null;

        const hostId = listing ? String(listing.user_id) : "";
        const renterId = String(r.renter_id);
        const isHost = uid === hostId;

        const last = lastByBooking[bookingId] || null;

        return {
          booking_id: bookingId,
          listing_id: listingId,
          listing_title: listing?.title ?? null,
          cover_image_path: listing?.cover_image_path ?? null,
          other_user_id: isHost ? renterId : hostId,
          last_message: last?.body ?? null,
          last_message_at: last?.created_at ?? null,
          unread_count: unreadByBooking[bookingId] || 0,
        };
      })
      .sort((a: any, b: any) => {
        const ta = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
        const tb = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
        return tb - ta;
      });

    return NextResponse.json({ ok: true, items }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Erreur serveur." }, { status: 500 });
  }
}

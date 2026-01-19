// src/app/api/host/bookings/route.ts
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

export async function GET(req: Request) {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return j({ error: "Config serveur manquante (SUPABASE_URL / SERVICE_ROLE_KEY)." }, 500);
    }

    const token = getBearerToken(req);
    if (!token) return j({ error: "Non authentifié." }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) return j({ error: "Token invalide." }, 401);

    const uid = userData.user.id;

    // Optionnel: filtre par listingId
    const { searchParams } = new URL(req.url);
    const listingId = String(searchParams.get("listingId") || "").trim();

    // 1) Mes listings (host)
    const { data: myListings, error: lErr } = await admin
      .from("listings")
      .select("id,title,cover_image_path,user_id")
      .eq("user_id", uid);

    if (lErr) return j({ error: lErr.message }, 400);

    const myListingIds = (myListings || []).map((x: any) => String(x.id));
    if (myListingIds.length === 0) return j({ ok: true, items: [] }, 200);

    const filteredListingIds = listingId ? myListingIds.filter((id) => id === listingId) : myListingIds;
    if (listingId && filteredListingIds.length === 0) return j({ ok: true, items: [] }, 200);

    // 2) Bookings sur mes listings
    const { data: bookings, error: bErr } = await admin
      .from("bookings")
      .select("id,listing_id,renter_id,start_date,end_date,total_cents,status,payment_status,created_at")
      .in("listing_id", filteredListingIds)
      .order("created_at", { ascending: false });

    if (bErr) return j({ error: bErr.message }, 400);

    const safeBookings = (bookings || []) as any[];
    if (safeBookings.length === 0) return j({ ok: true, items: [] }, 200);

    // 3) Map listing
    const listingById: Record<string, any> = {};
    (myListings || []).forEach((l: any) => {
      listingById[String(l.id)] = l;
    });

    const bookingIds = safeBookings.map((b) => String(b.id));

    // 4) Messages => last message + unread_count (côté host)
    const { data: msgs, error: mErr } = await admin
      .from("messages")
      .select("booking_id, body, created_at, sender_id, read_by_host_at")
      .in("booking_id", bookingIds)
      .order("created_at", { ascending: false });

    if (mErr) return j({ error: mErr.message }, 400);

    // last message par booking (le 1er rencontré car tri desc)
    const lastByBooking: Record<string, any> = {};
    for (const m of msgs || []) {
      const bid = String((m as any).booking_id);
      if (!lastByBooking[bid]) lastByBooking[bid] = m;
    }

    // unread_count côté host: messages dont sender_id != host(uid) et read_by_host_at est null
    const unreadByBooking: Record<string, number> = {};
    for (const m of msgs || []) {
      const bid = String((m as any).booking_id);
      if (String((m as any).sender_id) === uid) continue;
      if (!(m as any).read_by_host_at) unreadByBooking[bid] = (unreadByBooking[bid] ?? 0) + 1;
    }

    // 5) Retour enrichi
    const items = safeBookings.map((b: any) => {
      const bookingId = String(b.id);
      const l = listingById[String(b.listing_id)] || null;
      const last = lastByBooking[bookingId] || null;

      return {
        booking_id: bookingId,
        listing_id: String(b.listing_id),
        listing_title: l?.title ?? null,
        cover_image_path: l?.cover_image_path ?? null,
        renter_id: String(b.renter_id),
        start_date: b.start_date,
        end_date: b.end_date,
        total_cents: b.total_cents,
        status: b.status,
        payment_status: b.payment_status ?? null,
        created_at: b.created_at,

        // ✅ nouveaux champs
        last_message: last?.body ?? null,
        last_message_at: last?.created_at ?? null,
        unread_count: unreadByBooking[bookingId] ?? 0,
      };
    });

    // Tri final: dernier message desc, sinon created_at booking desc
    items.sort((a: any, b: any) => {
      const ta = a.last_message_at ? new Date(a.last_message_at).getTime() : new Date(a.created_at).getTime();
      const tb = b.last_message_at ? new Date(b.last_message_at).getTime() : new Date(b.created_at).getTime();
      return tb - ta;
    });

    return j({ ok: true, items }, 200);
  } catch (e: any) {
    return j({ error: e?.message ?? "Erreur serveur." }, 500);
  }
}

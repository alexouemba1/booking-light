// FILE: src/app/api/search/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type ListingHome = {
  id: string;
  title: string;
  city: string | null;
  kind: string | null;
  billing_unit: string;
  price_cents: number;
  cover_image_path: string | null;
};

type BookingRow = {
  listing_id: string;
  status: string;
  start_date: string;
  end_date: string;
  expires_at: string | null;
};

function json(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

function isPendingBlocking(expires_at: string | null) {
  if (!expires_at) return true;
  const exp = new Date(expires_at).getTime();
  if (!Number.isFinite(exp)) return true;
  return exp > Date.now();
}

export async function GET(req: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !service) {
      return json({ error: "Config Supabase manquante (.env.local)" }, 500);
    }

    const admin = createClient(url, service, { auth: { persistSession: false } });

    const { searchParams } = new URL(req.url);

    const city = String(searchParams.get("city") || "").trim();
    const startDate = String(searchParams.get("start_date") || "").trim();
    const endDate = String(searchParams.get("end_date") || "").trim();

    // ✅ IMPORTANT: on lit la table source (pas listings_home)
    let q = admin
      .from("listings")
      .select("id,title,city,kind,billing_unit,price_cents,cover_image_path")
      .order("created_at", { ascending: false });

    if (city) {
      q = q.ilike("city", `%${city}%`);
    }

    const { data: listings, error: lErr } = await q;
    if (lErr) return json({ error: lErr.message }, 400);

    const base = (listings || []) as ListingHome[];

    if (!startDate || !endDate) {
      return json({ ok: true, items: base });
    }

    const listingIds = base.map((x) => x.id);
    if (listingIds.length === 0) return json({ ok: true, items: [] });

    const { data: bks, error: bErr } = await admin
      .from("bookings")
      .select("listing_id,status,start_date,end_date,expires_at")
      .in("listing_id", listingIds)
      .in("status", ["pending", "confirmed", "paid"])
      .lt("start_date", endDate)
      .gt("end_date", startDate);

    if (bErr) return json({ error: bErr.message }, 400);

    const rows = (bks || []) as BookingRow[];

    const blocked = new Set<string>();
    for (const r of rows) {
      const st = String(r.status || "").toLowerCase();
      if (st === "paid" || st === "confirmed") blocked.add(r.listing_id);
      else if (st === "pending" && isPendingBlocking(r.expires_at)) blocked.add(r.listing_id);
    }

    const filtered = base.filter((x) => !blocked.has(x.id));
    return json({ ok: true, items: filtered });
  } catch (e: any) {
    return json({ error: e?.message ?? "Erreur serveur" }, 500);
  }
}
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
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD (exclu dans ton modèle)
  expires_at: string | null;
};

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function isPendingBlocking(expires_at: string | null) {
  // pending sans expires_at => on bloque (safe)
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
    const startDate = String(searchParams.get("start_date") || "").trim(); // YYYY-MM-DD
    const endDate = String(searchParams.get("end_date") || "").trim();     // YYYY-MM-DD

    // 1) base listings
    let q = admin
      .from("listings_home")
      .select("id,title,city,kind,billing_unit,price_cents,cover_image_path")
      .order("created_at", { ascending: false });

    if (city) {
      // simple: filtre sur city (tu peux étendre à title/kind si tu veux)
      q = q.ilike("city", `%${city}%`);
    }

    const { data: listings, error: lErr } = await q;
    if (lErr) return json({ error: lErr.message }, 400);

    const base = (listings || []) as ListingHome[];

    // si pas de dates => on renvoie direct
    if (!startDate || !endDate) {
      return json({ ok: true, items: base });
    }

    // 2) récupérer bookings "bloquantes" qui overlap (start < endWanted && end > startWanted)
    const listingIds = base.map((x) => x.id);
    if (listingIds.length === 0) return json({ ok: true, items: [] });

    const { data: bks, error: bErr } = await admin
      .from("bookings")
      .select("listing_id,status,start_date,end_date,expires_at")
      .in("listing_id", listingIds)
      .in("status", ["pending", "confirmed", "paid"])
      .lt("start_date", endDate)   // start < endWanted
      .gt("end_date", startDate);  // end > startWanted
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

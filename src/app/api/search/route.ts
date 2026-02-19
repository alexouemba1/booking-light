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

  // ✅ Monétisation
  is_premium?: boolean | null;
  premium_until?: string | null;

  // ✅ Avis
  rating_avg?: number | null;
  rating_count?: number | null;

  // ✅ Pour garder un ordre “recent”
  created_at?: string | null;
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

function isPremiumActive(l: ListingHome, nowMs: number) {
  if (!l.is_premium) return false;
  if (!l.premium_until) return true; // premium sans date = actif
  const t = new Date(l.premium_until).getTime();
  if (!Number.isFinite(t)) return false;
  return t > nowMs;
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

    // ✅ On lit la table source "listings" + colonnes premium + avis
    let q = admin
      .from("listings")
      .select(
        "id,title,city,kind,billing_unit,price_cents,cover_image_path,is_premium,premium_until,created_at,rating_avg,rating_count"
      )
      .order("created_at", { ascending: false });

    if (city) {
      q = q.ilike("city", `%${city}%`);
    }

    const { data: listings, error: lErr } = await q;
    if (lErr) return json({ error: lErr.message }, 400);

    const base = (listings || []) as ListingHome[];

    // ✅ TRI PREMIUM SERIEUX:
    // 1) Premium actifs en premier
    // 2) Puis premium_until le plus loin (optionnel)
    // 3) Puis created_at (plus récent)
    const nowMs = Date.now();
    base.sort((a, b) => {
      const ap = isPremiumActive(a, nowMs);
      const bp = isPremiumActive(b, nowMs);
      if (ap !== bp) return ap ? -1 : 1;

      const aUntil = a.premium_until ? new Date(a.premium_until).getTime() : 0;
      const bUntil = b.premium_until ? new Date(b.premium_until).getTime() : 0;
      if (Number.isFinite(aUntil) && Number.isFinite(bUntil) && aUntil !== bUntil) {
        return bUntil - aUntil; // plus “long” premium d’abord
      }

      const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bCreated - aCreated;
    });

    // Si pas de dates: on renvoie direct (déjà trié premium-first)
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

    // ✅ On filtre en gardant l’ordre (premium-first reste intact)
    const filtered = base.filter((x) => !blocked.has(x.id));
    return json({ ok: true, items: filtered });
  } catch (e: any) {
    return json({ error: e?.message ?? "Erreur serveur" }, 500);
  }
}
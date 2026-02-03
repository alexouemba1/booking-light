// FILE: src/app/api/book/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ✅ AJOUT month
type BillingUnit = "night" | "day" | "week" | "month";

function j(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function toDate(s: string) {
  return new Date(s + "T00:00:00");
}

function daysBetween(start: Date, end: Date) {
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export async function POST(req: Request) {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return j({ error: "Config serveur manquante (SUPABASE_URL / SERVICE_ROLE_KEY)." }, 500);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // 1) Token
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) return j({ error: "Non authentifié." }, 401);

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) return j({ error: "Token invalide." }, 401);

    const renterId = userData.user.id;

    // 2) Body
    const body = await req.json();
    const listingId = String(body?.listingId || "");
    const start_date = String(body?.start_date || "");
    const end_date = String(body?.end_date || "");

    if (!listingId || !start_date || !end_date) {
      return j({ error: "Champs manquants (listingId, start_date, end_date)." }, 400);
    }

    const s = toDate(start_date);
    const e = toDate(end_date);
    if (!(e > s)) {
      return j({ error: "Dates invalides : la fin doit être après le début." }, 400);
    }

    // 3) Listing
    const { data: listing, error: listingErr } = await admin
      .from("listings")
      .select("id,user_id,price_cents,billing_unit")
      .eq("id", listingId)
      .single();

    if (listingErr || !listing) return j({ error: "Annonce introuvable." }, 404);

    if (listing.user_id === renterId) {
      return j({ error: "Tu ne peux pas réserver ta propre annonce." }, 400);
    }

    // 4) Conflits
    const nowIso = new Date().toISOString();

    const { data: conflicts, error: conflictErr } = await admin
      .from("bookings")
      .select("id,start_date,end_date,status,expires_at")
      .eq("listing_id", listingId)
      .lt("start_date", end_date)
      .gt("end_date", start_date)
      .or(
        `status.in.(paid,confirmed),and(status.eq.pending,or(expires_at.is.null,expires_at.gt.${nowIso}))`
      );

    if (conflictErr) return j({ error: conflictErr.message }, 400);

    if ((conflicts || []).length > 0) {
      return j({ error: "Ces dates ne sont plus disponibles. Choisis une autre période." }, 409);
    }

    // 5) Prix
    const rawUnit = String(listing.billing_unit || "").trim().toLowerCase();
    const billing_unit = rawUnit as BillingUnit;

    const dRaw = daysBetween(s, e);
    const d = Math.max(1, dRaw); // sécurité

    // ✅ Option recommandé: minimum de durée si "month"
    // (évite des réservations “au mois” de 3 jours ou des surprises de pricing)
    if (billing_unit === "month" && d < 30) {
      return j({ error: "Pour une location au mois, la durée minimale est de 30 jours." }, 400);
    }

    let units = 1;

    if (billing_unit === "night" || billing_unit === "day") {
      units = Math.max(1, d);
    } else if (billing_unit === "week") {
      units = Math.max(1, Math.ceil(d / 7));
    } else if (billing_unit === "month") {
      // ✅ mois ≈ 30 jours (même règle que sur la page listing)
      units = Math.max(1, Math.ceil(d / 30));
    } else {
      return j({ error: "Unité de facturation invalide (billing_unit)." }, 400);
    }

    const total_cents = units * Number(listing.price_cents || 0);
    if (!Number.isFinite(total_cents) || total_cents <= 0) return j({ error: "Montant invalide." }, 400);

    // 6) Insert booking pending + expires_at
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

    const { data: created, error: insErr } = await admin
      .from("bookings")
      .insert({
        listing_id: listingId,
        renter_id: renterId,
        start_date,
        end_date,
        status: "pending",
        payment_status: "unpaid",
        total_cents,
        expires_at: expiresAt,
      })
      .select("id, listing_id, renter_id, start_date, end_date, status, payment_status, total_cents, expires_at")
      .single();

    if (insErr) return j({ error: insErr.message }, 400);

    return j({ ok: true, bookingId: created.id, booking: created }, 200);
  } catch (e: any) {
    return j({ error: e?.message ?? "Erreur serveur." }, 500);
  }
}

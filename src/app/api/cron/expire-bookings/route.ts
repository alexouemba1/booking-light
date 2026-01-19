import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function j(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export async function POST(req: Request) {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Optionnel mais recommandé : clé secrète pour éviter que n’importe qui appelle le cron
    const CRON_SECRET = process.env.CRON_SECRET;

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return j({ error: "Config manquante (SUPABASE_URL / SERVICE_ROLE_KEY)" }, 500);
    }

    if (CRON_SECRET) {
      const got = req.headers.get("x-cron-secret") || "";
      if (got !== CRON_SECRET) {
        return j({ error: "Unauthorized (cron secret)" }, 401);
      }
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const nowIso = new Date().toISOString();

    // Expire uniquement les pending non payées
    // On met status=cancelled + payment_status=expired
    // (idempotent : un booking déjà annulé ne sera plus pending)
    const { data, error } = await admin
      .from("bookings")
      .update({
        status: "cancelled",
        payment_status: "expired",
      })
      .eq("status", "pending")
      .in("payment_status", ["unpaid", "pending", null])
      .lt("expires_at", nowIso)
      .select("id, listing_id, start_date, end_date, expires_at, status, payment_status");

    if (error) {
      return j({ error: error.message }, 400);
    }

    return j({
      ok: true,
      expired_count: (data || []).length,
      expired: data || [],
      now: nowIso,
    });
  } catch (e: any) {
    return j({ error: e?.message ?? "Erreur cron expiration." }, 500);
  }
}

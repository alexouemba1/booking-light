import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Row = {
  start_date: string;
  end_date: string;
  status: string;
  expires_at: string | null;
};

function j(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function toDate(iso: string) {
  // dates "YYYY-MM-DD" en local midnight
  return new Date(iso + "T00:00:00");
}

// overlap si existing.start < wantedEnd ET existing.end > wantedStart
function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart;
}

// end_date exclusive (modèle actuel)
function endExclusive(dateIso: string) {
  return toDate(dateIso);
}

export async function GET(req: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !service) {
      return j({ error: "Config Supabase manquante (.env.local)" }, 500);
    }

    const { searchParams } = new URL(req.url);
    const listingId = searchParams.get("listingId");
    if (!listingId) return j({ error: "listingId requis" }, 400);

    // ✅ optionnel : check ciblé
    const startDate = (searchParams.get("startDate") || "").trim(); // YYYY-MM-DD
    const endDate = (searchParams.get("endDate") || "").trim();     // YYYY-MM-DD

    const admin = createClient(url, service, { auth: { persistSession: false } });

    // On charge paid/confirmed + pending (avec expires_at)
    const { data, error } = await admin
      .from("bookings")
      .select("start_date,end_date,status,expires_at")
      .eq("listing_id", listingId)
      .in("status", ["pending", "confirmed", "paid"])
      .order("start_date", { ascending: true });

    if (error) return j({ error: error.message }, 400);

    const now = Date.now();

    // Filtrage:
    // - confirmed/paid => toujours bloquant
    // - pending => bloquant seulement si expires_at null (par sécurité) OU expires_at dans le futur
    const ranges = ((data || []) as Row[]).filter((r) => {
      const st = String(r.status || "").toLowerCase();
      if (st === "paid" || st === "confirmed") return true;
      if (st !== "pending") return false;

      if (!r.expires_at) return true; // pending "sans expire" => on bloque (safe)
      const exp = new Date(r.expires_at).getTime();
      if (!Number.isFinite(exp)) return true;

      return exp > now; // pending non expirée => bloque
    });

    // ✅ Si on a startDate/endDate, on renvoie aussi un verdict "blocked"
    let blocked: boolean | null = null;
    let reason: string | null = null;
    let remainingMs: number | null = null;

    if (startDate && endDate) {
      const s = toDate(startDate);
      const e = endExclusive(endDate);

      if (!(e > s)) {
        blocked = true;
        reason = "Dates invalides.";
      } else {
        for (const r of ranges) {
          const st = String(r.status || "").toLowerCase();
          const rs = toDate(r.start_date);
          const re = endExclusive(r.end_date);

          if (!overlaps(rs, re, s, e)) continue;

          if (st === "paid" || st === "confirmed") {
            blocked = true;
            reason = "Ces dates sont déjà réservées.";
            break;
          }

          if (st === "pending") {
            blocked = true;

            if (r.expires_at) {
              const exp = new Date(r.expires_at).getTime();
              const rem = exp - now;
              if (Number.isFinite(rem) && rem > 0) {
                remainingMs = rem;
                reason = "Ces dates sont en option (temporairement indisponibles).";
              } else {
                // en théorie on ne passe pas ici car on filtre ranges, mais on reste safe
                blocked = false;
                reason = null;
              }
            } else {
              reason = "Ces dates sont en option (temporairement indisponibles).";
            }
            break;
          }
        }

        if (blocked === null) {
          blocked = false;
          reason = null;
        }
      }
    }

    return j({ ok: true, ranges, blocked, reason, remainingMs }, 200);
  } catch (e: any) {
    return j({ error: e?.message ?? "Erreur serveur" }, 500);
  }
}

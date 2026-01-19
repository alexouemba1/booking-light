// FILE: src/app/api/reviews/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function j(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function toDate(s: string) {
  return new Date(s + "T00:00:00");
}

function isStayFinished(end_date: string) {
  // end_date = date de départ (checkout) : on autorise avis si end_date <= aujourd'hui
  const end = toDate(end_date).getTime();
  const today = toDate(new Date().toISOString().slice(0, 10)).getTime();
  return end <= today;
}

function friendlyDbErrorMessage(msg: string) {
  const m = String(msg || "");

  // Cas que tu rencontres
  if (m.includes('record "new" has no field "updated_at"') || m.includes("updated_at")) {
    return (
      "Erreur de configuration base de données: la table 'reviews' n'a pas la colonne 'updated_at' " +
      "(ou un trigger tente de l'écrire). Ajoute la colonne 'updated_at' dans Supabase (Table Editor) " +
      "ou supprime/corrige le trigger."
    );
  }

  return m || "Erreur base de données.";
}

export async function GET(req: Request) {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return j({ error: "Config serveur manquante (SUPABASE_URL / SERVICE_ROLE_KEY)." }, 500);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const url = new URL(req.url);
    const listingId = String(url.searchParams.get("listingId") || "");
    const bookingIdHint = String(url.searchParams.get("bookingId") || "");

    if (!listingId) return j({ error: "listingId manquant." }, 400);

    // Avis publics (affichage annonce)
    const { data: reviews, error: revErr } = await admin
      .from("reviews")
      .select("id,listing_id,booking_id,author_id,rating,comment,created_at")
      .eq("listing_id", listingId)
      .order("created_at", { ascending: false });

    if (revErr) return j({ error: friendlyDbErrorMessage(revErr.message) }, 400);

    const list = (reviews || []) as any[];

    const count = list.length;
    const avg =
      count === 0
        ? 0
        : Math.round((list.reduce((acc, r) => acc + Number(r.rating || 0), 0) / count) * 10) / 10;

    // Si token présent : on calcule l’éligibilité pour afficher le formulaire
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    let canReview = false;
    let eligibleBookingId: string | null = null;
    let reason: string | null = null;

    if (token) {
      const { data: userData, error: userErr } = await admin.auth.getUser(token);
      if (!userErr && userData?.user) {
        const uid = userData.user.id;

        async function checkBooking(bookingId: string) {
          const { data: b, error: bErr } = await admin
            .from("bookings")
            .select("id,listing_id,renter_id,status,payment_status,end_date")
            .eq("id", bookingId)
            .single();

          if (bErr || !b) return { ok: false, why: "Réservation introuvable." };

          const status = String((b as any).status || "").toLowerCase();
          const pay = String((b as any).payment_status || "").toLowerCase();

          if (String((b as any).listing_id) !== listingId)
            return { ok: false, why: "Réservation non liée à cette annonce." };

          if (String((b as any).renter_id) !== uid)
            return { ok: false, why: "Cette réservation ne t’appartient pas." };

          const paidOrConfirmed = pay === "paid" || status === "confirmed" || status === "paid";
          if (!paidOrConfirmed) return { ok: false, why: "Avis possible uniquement après paiement/confirmation." };

          if (!isStayFinished(String((b as any).end_date || "")))
            return { ok: false, why: "Avis possible après la fin du séjour." };

          const { data: existing, error: exErr } = await admin
            .from("reviews")
            .select("id")
            .eq("booking_id", bookingId)
            .limit(1);

          if (exErr) return { ok: false, why: friendlyDbErrorMessage(exErr.message) };
          if ((existing || []).length > 0) return { ok: false, why: "Avis déjà envoyé pour cette réservation." };

          return { ok: true, why: null };
        }

        if (bookingIdHint) {
          const chk = await checkBooking(bookingIdHint);
          if (chk.ok) {
            canReview = true;
            eligibleBookingId = bookingIdHint;
          } else {
            reason = chk.why;
          }
        }

        if (!canReview) {
          const { data: bookings, error: bListErr } = await admin
            .from("bookings")
            .select("id,status,payment_status,end_date,created_at")
            .eq("listing_id", listingId)
            .eq("renter_id", uid)
            .order("created_at", { ascending: false });

          if (bListErr) return j({ error: friendlyDbErrorMessage(bListErr.message) }, 400);

          const bs = (bookings || []) as any[];

          for (const b of bs) {
            const status = String(b.status || "").toLowerCase();
            const pay = String(b.payment_status || "").toLowerCase();
            const paidOrConfirmed = pay === "paid" || status === "confirmed" || status === "paid";
            if (!paidOrConfirmed) continue;

            if (!isStayFinished(String(b.end_date || ""))) continue;

            const { data: existing, error: exErr } = await admin
              .from("reviews")
              .select("id")
              .eq("booking_id", b.id)
              .limit(1);

            if (exErr) {
              reason = friendlyDbErrorMessage(exErr.message);
              continue;
            }

            if ((existing || []).length > 0) continue;

            canReview = true;
            eligibleBookingId = String(b.id);
            reason = null;
            break;
          }

          if (!canReview && !reason) {
            reason = "Aucune réservation éligible (payée/confirmée + séjour terminé) ou avis déjà envoyé.";
          }
        }
      }
    }

    return j(
      {
        ok: true,
        listingId,
        stats: { count, avg },
        reviews: list,
        canReview,
        eligibleBookingId,
        reason,
      },
      200
    );
  } catch (e: any) {
    return j({ error: e?.message ?? "Erreur serveur." }, 500);
  }
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

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) return j({ error: "Non authentifié." }, 401);

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) return j({ error: "Token invalide." }, 401);

    const uid = userData.user.id;

    const body = await req.json();
    const listingId = String(body?.listingId || "");
    const bookingId = String(body?.bookingId || "");
    const rating = Number(body?.rating || 0);
    const comment = String(body?.comment || "").trim();

    if (!listingId || !bookingId) return j({ error: "listingId/bookingId manquants." }, 400);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) return j({ error: "La note doit être entre 1 et 5." }, 400);
    if (comment.length < 5) return j({ error: "Commentaire trop court (min 5 caractères)." }, 400);
    if (comment.length > 1000) return j({ error: "Commentaire trop long (max 1000 caractères)." }, 400);

    // Vérifie booking
    const { data: b, error: bErr } = await admin
      .from("bookings")
      .select("id,listing_id,renter_id,status,payment_status,end_date")
      .eq("id", bookingId)
      .single();

    if (bErr || !b) return j({ error: "Réservation introuvable." }, 404);

    if (String((b as any).listing_id) !== listingId) return j({ error: "Réservation non liée à cette annonce." }, 400);
    if (String((b as any).renter_id) !== uid) return j({ error: "Cette réservation ne t’appartient pas." }, 403);

    const status = String((b as any).status || "").toLowerCase();
    const pay = String((b as any).payment_status || "").toLowerCase();
    const paidOrConfirmed = pay === "paid" || status === "confirmed" || status === "paid";
    if (!paidOrConfirmed) return j({ error: "Avis possible uniquement après paiement/confirmation." }, 400);

    if (!isStayFinished(String((b as any).end_date || ""))) return j({ error: "Avis possible après la fin du séjour." }, 400);

    // Déjà noté ?
    const { data: existing, error: exErr } = await admin.from("reviews").select("id").eq("booking_id", bookingId).limit(1);
    if (exErr) return j({ error: friendlyDbErrorMessage(exErr.message) }, 400);
    if ((existing || []).length > 0) return j({ error: "Avis déjà envoyé pour cette réservation." }, 409);

    // Insert
    const { data: created, error: insErr } = await admin
      .from("reviews")
      .insert({
        listing_id: listingId,
        booking_id: bookingId,
        author_id: uid,
        rating,
        comment,
      })
      .select("id,listing_id,booking_id,author_id,rating,comment,created_at")
      .single();

    if (insErr) return j({ error: friendlyDbErrorMessage(insErr.message) }, 400);

    return j({ ok: true, review: created }, 200);
  } catch (e: any) {
    return j({ error: e?.message ?? "Erreur serveur." }, 500);
  }
}

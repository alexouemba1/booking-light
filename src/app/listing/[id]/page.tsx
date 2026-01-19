// FILE: src/app/listing/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { publicListingImageUrl } from "@/lib/storage";

/* =======================
   Types
======================= */

type Listing = {
  id: string;
  user_id: string;
  title: string;
  city: string;
  kind: string;
  price_cents: number;
  billing_unit: "night" | "day" | "week";
  cover_image_path: string | null;

  // ✅ Stats fiables (maintenues côté DB)
  rating_avg: number;
  rating_count: number;
};

type ListingImage = {
  id: string;
  path: string;
  position: number;
};

type Range = {
  start_date: string;
  end_date: string;
  status: string;
  expires_at?: string | null;
};

type Review = {
  id: string;
  listing_id: string;
  booking_id: string | null;
  author_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
};

/* =======================
   Helpers
======================= */

function formatUnit(u: string) {
  if (u === "night") return "nuit";
  if (u === "day") return "jour";
  if (u === "week") return "semaine";
  return u;
}

function formatPrice(price_cents: number, billing_unit: string) {
  const euros = (price_cents / 100).toFixed(2).replace(".", ",");
  return `${euros} € / ${formatUnit(billing_unit)}`;
}

function toDate(s: string) {
  return new Date(s + "T00:00:00");
}

function daysBetween(start: Date, end: Date) {
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDateFR(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return new Intl.DateTimeFormat("fr-FR").format(d);
}

function euros(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

function msToMmSs(ms: number) {
  const clamped = Math.max(0, ms);
  const totalSeconds = Math.floor(clamped / 1000);
  const mm = Math.floor(totalSeconds / 60);
  const ss = totalSeconds % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

function isExpired(expiresAt?: string | null) {
  if (!expiresAt) return false;
  const t = new Date(expiresAt).getTime();
  if (!Number.isFinite(t)) return false;
  return t <= Date.now();
}

// overlap si existing.start < wantedEnd ET existing.end > wantedStart
function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart;
}

// end_date exclusive (modèle actuel)
function endExclusive(dateIso: string) {
  return toDate(dateIso);
}

/* =======================
   UI badge
======================= */

function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "warning" | "danger" | "success";
}) {
  const styles: Record<string, React.CSSProperties> = {
    neutral: {
      background: "rgba(0,0,0,0.04)",
      border: "1px solid rgba(0,0,0,0.10)",
      color: "rgba(0,0,0,0.75)",
    },
    warning: {
      background: "rgba(245,158,11,0.12)",
      border: "1px solid rgba(245,158,11,0.40)",
      color: "rgba(146,64,14,1)",
    },
    danger: {
      background: "rgba(239,68,68,0.10)",
      border: "1px solid rgba(239,68,68,0.35)",
      color: "rgba(153,27,27,1)",
    },
    success: {
      background: "rgba(16,185,129,0.12)",
      border: "1px solid rgba(16,185,129,0.35)",
      color: "rgba(6,95,70,1)",
    },
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
        ...styles[tone],
      }}
    >
      {children}
    </span>
  );
}

/* =======================
   Trust row (badge confiance)
======================= */

function TrustRow() {
  const itemStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 850,
    border: "1px solid rgba(0,0,0,0.10)",
    background: "rgba(0,0,0,0.03)",
    color: "rgba(0,0,0,0.78)",
  };

  const dot = (tone: "blue" | "green" | "gray"): React.CSSProperties => ({
    width: 8,
    height: 8,
    borderRadius: 999,
    background:
      tone === "blue"
        ? "rgba(47,107,255,0.95)"
        : tone === "green"
        ? "rgba(16,185,129,0.95)"
        : "rgba(0,0,0,0.45)",
    boxShadow: "0 0 0 3px rgba(0,0,0,0.03)",
    flex: "0 0 auto",
  });

  return (
    <div
      aria-label="Confiance"
      style={{
        marginTop: 10,
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      <span style={itemStyle} title="Paiement traité via Stripe">
        <span style={dot("blue")} />
        Paiement sécurisé
      </span>

      <span style={itemStyle} title="Conversation et preuves dans l’app">
        <span style={dot("gray")} />
        Messagerie interne
      </span>

      <span style={itemStyle} title="Réservations suivies et statuts clairs">
        <span style={dot("green")} />
        Réservation traçable
      </span>
    </div>
  );
}

/* =======================
   Stars (affichage)
======================= */

function StarsInline({ value, count }: { value: number; count: number }) {
  const clamped = Math.max(0, Math.min(5, value || 0));
  const full = Math.floor(clamped);
  const half = clamped - full >= 0.5;

  const starStyle: React.CSSProperties = { fontSize: 14, lineHeight: 1, letterSpacing: 0.5 };

  const stars = Array.from({ length: 5 }).map((_, i) => {
    const idx = i + 1;
    const filled = idx <= full;
    const isHalf = !filled && half && idx === full + 1;

    // demi étoile simple: on affiche une étoile pleine mais plus claire si demi
    const color = filled ? "rgba(17,24,39,1)" : isHalf ? "rgba(17,24,39,0.6)" : "rgba(0,0,0,0.25)";
    return (
      <span key={i} aria-hidden="true" style={{ color, ...starStyle }}>
        ★
      </span>
    );
  });

  const showCount = Number.isFinite(count) && count > 0;

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <span aria-label={`Note ${clamped.toFixed(1)} sur 5`} style={{ display: "inline-flex", gap: 1 }}>
        {stars}
      </span>
      {showCount && (
        <>
          <span style={{ fontSize: 13, fontWeight: 900, opacity: 0.75 }}>{count}</span>
          <span style={{ fontSize: 13, fontWeight: 900, opacity: 0.6 }}>({count})</span>
        </>
      )}
    </div>
  );
}

/* =======================
   Page
======================= */

export default function ListingPage() {
  const params = useParams();
  const id = params.id as string;

  const searchParams = useSearchParams();
  const wantsReview = searchParams.get("review") === "1";
  const bookingIdFromUrl = searchParams.get("bookingId");

  const [listing, setListing] = useState<Listing | null>(null);
  const [images, setImages] = useState<ListingImage[]>([]);
  const [ranges, setRanges] = useState<Range[]>([]);

  const [loading, setLoading] = useState(true);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [bookingLoading, setBookingLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);

  const bookingPanelRef = useRef<HTMLElement | null>(null);
  const reviewsRef = useRef<HTMLElement | null>(null);

  // tick 1/sec (compteurs)
  const [nowTick, setNowTick] = useState<number>(Date.now());

  /* =======================
     Reviews
  ======================= */
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);

  // ✅ stats fiables depuis listings
  const [ratingAvg, setRatingAvg] = useState<number>(0);
  const [ratingCount, setRatingCount] = useState<number>(0);

  // ✅ edition
  const [myReviewId, setMyReviewId] = useState<string | null>(null);

  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewMsg, setReviewMsg] = useState<string | null>(null);

  /* =======================
     Lightbox (agrandissement)
  ======================= */

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const lightboxPaths = useMemo(() => {
    const arr: string[] = [];
    if (listing?.cover_image_path) arr.push(listing.cover_image_path);
    for (const im of images) {
      if (!arr.includes(im.path)) arr.push(im.path);
    }
    return arr;
  }, [listing?.cover_image_path, images]);

  const lightboxSrc = useMemo(() => {
    const p = lightboxPaths[lightboxIndex];
    return p ? publicListingImageUrl(p) : null;
  }, [lightboxPaths, lightboxIndex]);

  const openLightboxAtPath = useCallback(
    (path: string) => {
      const idx = lightboxPaths.indexOf(path);
      setLightboxIndex(Math.max(0, idx >= 0 ? idx : 0));
      setLightboxOpen(true);
    },
    [lightboxPaths]
  );

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  const goPrev = useCallback(() => {
    setLightboxIndex((i) => (i <= 0 ? Math.max(0, lightboxPaths.length - 1) : i - 1));
  }, [lightboxPaths.length]);

  const goNext = useCallback(() => {
    setLightboxIndex((i) => (i >= lightboxPaths.length - 1 ? 0 : i + 1));
  }, [lightboxPaths.length]);

  useEffect(() => {
    if (!lightboxOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightboxOpen, closeLightbox, goPrev, goNext]);

  /* =======================
     Session
  ======================= */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessionUserId(data.session?.user?.id ?? null);
    });
  }, []);

  /* =======================
     Reset pay CTA if user changes dates
  ======================= */
  useEffect(() => {
    setCreatedBookingId(null);
    setSuccessMsg(null);
    setErrorMsg(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  /* =======================
     Load listing + images (+ stats)
  ======================= */
  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const { data: listingData, error } = await supabase
        .from("listings")
        .select("id,user_id,title,city,kind,price_cents,billing_unit,cover_image_path,rating_avg,rating_count")
        .eq("id", id)
        .single();

      if (!alive) return;

      if (error || !listingData) {
        setErrorMsg("Annonce introuvable.");
        setLoading(false);
        return;
      }

      const { data: imgs } = await supabase
        .from("listing_images")
        .select("id,path,position")
        .eq("listing_id", id)
        .order("position", { ascending: true });

      if (!alive) return;

      const l = listingData as any;

      setListing({
        id: String(l.id),
        user_id: String(l.user_id),
        title: String(l.title || ""),
        city: String(l.city || ""),
        kind: String(l.kind || ""),
        price_cents: Number(l.price_cents || 0),
        billing_unit: l.billing_unit as any,
        cover_image_path: l.cover_image_path ? String(l.cover_image_path) : null,
        rating_avg: Number.isFinite(Number(l.rating_avg)) ? Number(l.rating_avg) : 0,
        rating_count: Number.isFinite(Number(l.rating_count)) ? Number(l.rating_count) : 0,
      });

      setRatingAvg(Number.isFinite(Number(l.rating_avg)) ? Number(l.rating_avg) : 0);
      setRatingCount(Number.isFinite(Number(l.rating_count)) ? Number(l.rating_count) : 0);

      setImages((imgs || []) as ListingImage[]);

      setLoading(false);
    }

    load();
    return () => {
      alive = false;
    };
  }, [id]);

  const refreshRatingStats = useCallback(async () => {
    const { data, error } = await supabase
      .from("listings")
      .select("rating_avg,rating_count")
      .eq("id", id)
      .single();

    if (error || !data) return;
    const avg = Number.isFinite(Number((data as any).rating_avg)) ? Number((data as any).rating_avg) : 0;
    const cnt = Number.isFinite(Number((data as any).rating_count)) ? Number((data as any).rating_count) : 0;
    setRatingAvg(avg);
    setRatingCount(cnt);
  }, [id]);

  /* =======================
     Load reviews list
  ======================= */
  const loadReviews = useCallback(async () => {
    setReviewsLoading(true);
    setReviewMsg(null);

    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("id,listing_id,booking_id,author_id,rating,comment,created_at")
        .eq("listing_id", id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      const list = ((data || []) as any[]).map((r) => ({
        id: String(r.id),
        listing_id: String(r.listing_id),
        booking_id: r.booking_id ? String(r.booking_id) : null,
        author_id: r.author_id ? String(r.author_id) : null,
        rating: Number(r.rating || 0),
        comment: r.comment ? String(r.comment) : null,
        created_at: String(r.created_at),
      })) as Review[];

      setReviews(list);
    } catch (e: any) {
      setReviews([]);
      setReviewMsg(e?.message ? `Avis indisponibles: ${e.message}` : "Avis indisponibles.");
    } finally {
      setReviewsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // ✅ Charger mon avis si on arrive avec review=1 + bookingId
  const loadMyReview = useCallback(async () => {
    setMyReviewId(null);

    if (!wantsReview) return;
    if (!bookingIdFromUrl) return;

    const { data: session } = await supabase.auth.getSession();
    const uid = session.session?.user?.id ?? null;
    if (!uid) return;

    const { data, error } = await supabase
      .from("reviews")
      .select("id,rating,comment")
      .eq("booking_id", String(bookingIdFromUrl))
      .maybeSingle();

    if (error) return;

    if (data?.id) {
      setMyReviewId(String((data as any).id));
      setReviewRating(Math.max(1, Math.min(5, Number((data as any).rating || 5))));
      setReviewComment((data as any).comment ? String((data as any).comment) : "");
    } else {
      // pas d'avis: valeurs par défaut
      setMyReviewId(null);
      setReviewRating(5);
      setReviewComment("");
    }
  }, [wantsReview, bookingIdFromUrl]);

  useEffect(() => {
    loadMyReview();
  }, [loadMyReview]);

  // Si l’URL arrive avec ?review=1#reviews, on scroll proprement une fois que ça existe
  useEffect(() => {
    if (!wantsReview) return;
    const t = setTimeout(() => {
      reviewsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 350);
    return () => clearTimeout(t);
  }, [wantsReview]);

  /* =======================
     Availability fetch
  ======================= */
  const refreshAvailability = useCallback(async () => {
    try {
      const res = await fetch(`/api/availability?listingId=${encodeURIComponent(id)}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (res.ok) setRanges(json.ranges || []);
    } catch {
      // silence
    }
  }, [id]);

  useEffect(() => {
    refreshAvailability();
  }, [refreshAvailability]);

  useEffect(() => {
    const t = setInterval(() => {
      refreshAvailability();
    }, 20000);
    return () => clearInterval(t);
  }, [refreshAvailability]);

  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  /* =======================
     Derived
  ======================= */

  const isOwner = useMemo(() => {
    if (!listing?.user_id) return false;
    if (!sessionUserId) return false;
    return listing.user_id === sessionUserId;
  }, [listing?.user_id, sessionUserId]);

  const totalPreview = useMemo(() => {
    if (!listing) return null;
    if (!startDate || !endDate) return null;

    const s = toDate(startDate);
    const e = toDate(endDate);
    if (!(e > s)) return null;

    const d = daysBetween(s, e);

    let units = 1;
    if (listing.billing_unit === "night" || listing.billing_unit === "day") units = Math.max(1, d);
    if (listing.billing_unit === "week") units = Math.max(1, Math.ceil(d / 7));

    return units * listing.price_cents;
  }, [listing, startDate, endDate]);

  // ✅ Détecter si les dates choisies sont bloquées
  const chosenDatesBlockReason = useMemo(() => {
    if (!startDate || !endDate) return null;

    const s = toDate(startDate);
    const e = endExclusive(endDate);
    if (!(e > s)) return "Dates invalides.";

    for (const r of ranges) {
      const st = String(r.status || "").toLowerCase();
      const rs = toDate(r.start_date);
      const re = endExclusive(r.end_date);

      if (!overlaps(rs, re, s, e)) continue;

      if (st === "paid" || st === "confirmed") return "Ces dates sont déjà réservées.";

      if (st === "pending") {
        if (isExpired(r.expires_at)) continue;

        if (r.expires_at) {
          const remaining = new Date(String(r.expires_at)).getTime() - nowTick;
          if (Number.isFinite(remaining) && remaining > 0) {
            return `Ces dates sont en option (expire dans ${msToMmSs(remaining)}).`;
          }
        }
        return "Ces dates sont en option (temporairement indisponibles).";
      }
    }

    return null;
  }, [startDate, endDate, ranges, nowTick]);

  const canBook = useMemo(() => {
    if (isOwner) return false;
    if (!startDate || !endDate) return false;
    if (chosenDatesBlockReason) return false;
    return true;
  }, [isOwner, startDate, endDate, chosenDatesBlockReason]);

  /* =======================
     ✅ Couverture (owner)
  ======================= */

  const [coverSaving, setCoverSaving] = useState<string | null>(null);

  async function setAsCover(path: string) {
    if (!listing) return;
    if (!isOwner) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setCoverSaving(path);

    try {
      const allowed = new Set<string>([
        ...(listing.cover_image_path ? [listing.cover_image_path] : []),
        ...images.map((x) => x.path),
      ]);
      if (!allowed.has(path)) throw new Error("Image non autorisée.");

      const { error } = await supabase.from("listings").update({ cover_image_path: path }).eq("id", listing.id);
      if (error) throw error;

      setListing((prev) => (prev ? { ...prev, cover_image_path: path } : prev));
      setSuccessMsg("Couverture mise à jour.");
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Impossible de changer la couverture.");
    } finally {
      setCoverSaving(null);
    }
  }

  /* =======================
     Booking
  ======================= */

  async function bookNow() {
    setErrorMsg(null);
    setSuccessMsg(null);
    setCreatedBookingId(null);

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) {
      setErrorMsg("Connecte-toi pour réserver.");
      bookingPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (!startDate || !endDate) {
      setErrorMsg("Choisis une date de début et une date de fin.");
      bookingPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (chosenDatesBlockReason) {
      setErrorMsg(chosenDatesBlockReason);
      bookingPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    setBookingLoading(true);

    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ listingId: id, start_date: startDate, end_date: endDate }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Erreur réservation.");

      const newBookingId = (json?.bookingId || json?.booking?.id || null) as string | null;
      if (newBookingId) setCreatedBookingId(newBookingId);

      setSuccessMsg("Réservation créée. Prochaine étape : payer pour confirmer.");
      await refreshAvailability();
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Erreur réservation.");
    } finally {
      setBookingLoading(false);
      bookingPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  /* =======================
     ✅ Submit / update review (obligatoirement lié à un booking)
  ======================= */
  async function submitReview() {
    setReviewMsg(null);

    const { data: session } = await supabase.auth.getSession();
    const uid = session.session?.user?.id ?? null;

    if (!uid) {
      setReviewMsg("Connecte-toi pour laisser un avis.");
      return;
    }

    if (!bookingIdFromUrl) {
      setReviewMsg("Avis impossible sans réservation liée. Reviens depuis “Mes réservations”.");
      return;
    }

    if (!Number.isFinite(reviewRating) || reviewRating < 1 || reviewRating > 5) {
      setReviewMsg("La note doit être entre 1 et 5.");
      return;
    }

    const cleanComment = reviewComment.trim() ? reviewComment.trim() : null;
    if (cleanComment && cleanComment.length > 1000) {
      setReviewMsg("Commentaire trop long (max 1000 caractères).");
      return;
    }

    setReviewSaving(true);
    try {
      const payload = {
        rating: Math.round(reviewRating),
        comment: cleanComment,
      };

      if (myReviewId) {
        const { error } = await supabase.from("reviews").update(payload).eq("id", myReviewId);
        if (error) throw error;
        setReviewMsg("Avis mis à jour. Merci.");
      } else {
        const { error } = await supabase
          .from("reviews")
          .insert({ booking_id: String(bookingIdFromUrl), ...payload } as any);
        if (error) throw error;
        setReviewMsg("Avis envoyé. Merci.");
      }

      await loadReviews();
      await refreshRatingStats();
      await loadMyReview();
    } catch (e: any) {
      const msg = e?.message ?? "Impossible d’envoyer l’avis.";
      // si unique constraint côté DB, on rend ça humain
      if (typeof msg === "string" && msg.toLowerCase().includes("duplicate")) {
        setReviewMsg("Tu as déjà laissé un avis pour cette réservation. Modifie-le plutôt.");
      } else {
        setReviewMsg(msg);
      }
    } finally {
      setReviewSaving(false);
    }
  }

  /* =======================
     Render
  ======================= */

  if (loading) return <main className="bl-container">Chargement…</main>;
  if (!listing) return <main className="bl-container">Erreur.</main>;

  const cover = listing.cover_image_path || images[0]?.path || null;
  const coverUrl = cover ? publicListingImageUrl(cover) : null;

  return (
    <main className="bl-container">
      <div className="bl-detail-top">
        <Link className="bl-link" href="/">
          ← Retour
        </Link>
        <Link className="bl-link" href="/my-bookings">
          Mes réservations
        </Link>
      </div>

      <h1 className="bl-h1" style={{ marginTop: 12 }}>
        {listing.title}
      </h1>

      <div className="bl-sub">
        {listing.city} · {listing.kind}
      </div>

      {/* Prix + avis (stats fiables DB) */}
      <div
        style={{
          marginTop: 10,
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div className="bl-price-line" style={{ marginTop: 0 }}>
          {formatPrice(listing.price_cents, listing.billing_unit)}
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "6px 10px",
            borderRadius: 999,
            border: "1px solid rgba(0,0,0,0.10)",
            background: "rgba(0,0,0,0.02)",
          }}
        >
          <StarsInline value={ratingAvg} count={ratingCount} />

          <button
            type="button"
            className="bl-btn"
            style={{ marginTop: 0, height: 34, padding: "0 10px", borderRadius: 999, fontWeight: 900 }}
            onClick={() => reviewsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            title="Voir les avis"
          >
            Voir
          </button>
        </div>
      </div>

      {successMsg && <div className="bl-alert bl-alert-success">{successMsg}</div>}
      {errorMsg && <div className="bl-alert bl-alert-error">{errorMsg}</div>}

      {/* COVER (cliquable) */}
      <div className="bl-cover" style={{ marginTop: 16 }}>
        {coverUrl ? (
          <div className="bl-zoomable" style={{ position: "relative" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverUrl}
              alt=""
              className="bl-cover-img"
              style={{ cursor: "zoom-in" }}
              onClick={() => cover && openLightboxAtPath(cover)}
              title="Cliquer pour agrandir"
            />

            <div className="bl-zoom-corner" onClick={() => cover && openLightboxAtPath(cover)} title="Agrandir" role="button">
              Agrandir
            </div>
          </div>
        ) : (
          <div className="bl-cover-empty">Pas d’image</div>
        )}
      </div>

      {/* GALERIE (cliquable) */}
      {images.length > 0 && (
        <section style={{ marginTop: 18 }}>
          <div className="bl-panel-title" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>Galerie</span>
            {isOwner && (
              <span style={{ fontSize: 12, opacity: 0.75, fontWeight: 800 }}>
                Astuce : clique “Définir comme couverture”.
              </span>
            )}
          </div>

          <div className="bl-gallery" style={{ marginTop: 10 }}>
            {images.map((img) => {
              const src = publicListingImageUrl(img.path);
              const isCover = listing.cover_image_path === img.path;
              const savingThis = coverSaving === img.path;

              return (
                <div key={img.id} className="bl-shot">
                  <div style={{ position: "relative" }} className="bl-zoomable">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt=""
                      className="bl-shot-img"
                      style={{ cursor: "zoom-in" }}
                      onClick={() => openLightboxAtPath(img.path)}
                      title="Cliquer pour agrandir"
                    />

                    <div className="bl-zoom-corner" onClick={() => openLightboxAtPath(img.path)} title="Agrandir" role="button">
                      Agrandir
                    </div>
                  </div>

                  <div className="bl-shot-bar" style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <div className="bl-shot-tag">{isCover ? "Couverture" : `Image ${img.position}`}</div>

                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => setAsCover(img.path)}
                        disabled={isCover || !!coverSaving}
                        className="bl-btn"
                        style={{
                          marginLeft: "auto",
                          borderRadius: 12,
                          padding: "8px 10px",
                          fontWeight: 900,
                          opacity: isCover ? 0.55 : 1,
                          cursor: isCover ? "not-allowed" : "pointer",
                        }}
                        title={isCover ? "Déjà la couverture" : "Définir cette image comme couverture"}
                      >
                        {savingThis ? "Sauvegarde…" : isCover ? "Couverture" : "Définir comme couverture"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Booking */}
      <section ref={bookingPanelRef as any} className="bl-panel" style={{ marginTop: 18 }}>
        <div className="bl-panel-title" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>Réserver</span>
          <button className="bl-btn" onClick={refreshAvailability} style={{ fontWeight: 800 }}>
            Rafraîchir
          </button>
        </div>

        <TrustRow />

        <div className="bl-two">
          <div>
            <label className="bl-label">Début</label>
            <input className="bl-input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="bl-label">Fin</label>
            <input className="bl-input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        {totalPreview !== null && (
          <div className="bl-total" style={{ marginTop: 8 }}>
            Total estimé : {euros(totalPreview)}
          </div>
        )}

        {chosenDatesBlockReason && (
          <div className="bl-alert" style={{ marginTop: 10 }}>
            <strong>Indisponible :</strong> {chosenDatesBlockReason}
          </div>
        )}

        <button
          onClick={bookNow}
          disabled={bookingLoading || !canBook}
          className={bookingLoading || !canBook ? "bl-btn bl-btn-disabled" : "bl-btn bl-btn-primary"}
          title={
            isOwner
              ? "Tu ne peux pas réserver ta propre annonce"
              : chosenDatesBlockReason
              ? chosenDatesBlockReason
              : "Créer une réservation"
          }
          style={{ width: "100%", marginTop: 10, fontWeight: 900 }}
        >
          {bookingLoading
            ? "Réservation…"
            : isOwner
            ? "Réservation impossible (propriétaire)"
            : !canBook
            ? "Dates indisponibles"
            : "Réserver"}
        </button>

        {createdBookingId && (
          <div style={{ marginTop: 12 }}>
            <Link href={`/my-bookings?focus=${encodeURIComponent(createdBookingId)}`}>
              <button className="bl-btn bl-btn-primary" style={{ width: "100%", fontWeight: 900 }}>
                Payer maintenant
              </button>
            </Link>
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <strong>Dates indisponibles</strong>
            <span style={{ fontSize: 12, opacity: 0.7 }}>Auto-refresh 20s</span>
          </div>

          {ranges.length === 0 ? (
            <div style={{ opacity: 0.8 }}>Aucune (pour l’instant).</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {ranges.map((r, i) => {
                const st = String(r.status || "").toLowerCase();

                let right: React.ReactNode = <Badge tone="neutral">{st}</Badge>;

                if (st === "paid" || st === "confirmed") right = <Badge tone="danger">Indisponible</Badge>;

                if (st === "pending") {
                  if (r.expires_at) {
                    const exp = new Date(String(r.expires_at)).getTime();
                    const remaining = exp - nowTick;
                    if (Number.isFinite(remaining) && remaining > 0) {
                      right = <Badge tone="warning">Option (expire {msToMmSs(remaining)})</Badge>;
                    } else {
                      right = <Badge tone="warning">Option expirée (libération…)</Badge>;
                    }
                  } else {
                    right = <Badge tone="warning">Option</Badge>;
                  }
                }

                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid rgba(0,0,0,0.08)",
                      background: "rgba(0,0,0,0.02)",
                    }}
                  >
                    <div style={{ fontWeight: 900 }}>
                      {formatDateFR(r.start_date)} → {formatDateFR(r.end_date)}
                    </div>
                    {right}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* REVIEWS */}
      <section id="reviews" ref={reviewsRef as any} className="bl-panel" style={{ marginTop: 18 }}>
        <div className="bl-panel-title" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>Avis</span>

          <button className="bl-btn" style={{ marginTop: 0, height: 38, fontWeight: 900 }} onClick={loadReviews} disabled={reviewsLoading}>
            {reviewsLoading ? "Chargement…" : "Rafraîchir"}
          </button>
        </div>

        <div style={{ marginTop: 10, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 10px",
              borderRadius: 14,
              border: "1px solid rgba(0,0,0,0.08)",
              background: "rgba(0,0,0,0.02)",
            }}
          >
            <StarsInline value={ratingAvg} count={ratingCount} />
            <span style={{ fontWeight: 900, opacity: 0.75 }}>{ratingCount === 0 ? "Aucun avis" : `${ratingAvg.toFixed(1)} / 5`}</span>
          </div>

          {reviewMsg && (
            <div style={{ fontSize: 13, fontWeight: 900, opacity: 0.75 }}>
              {reviewMsg}
            </div>
          )}
        </div>

        {/* Formulaire - visible si on arrive avec review=1 */}
        {wantsReview && (
          <div style={{ marginTop: 14 }}>
            {!bookingIdFromUrl ? (
              <div className="bl-alert" style={{ marginTop: 10 }}>
                <strong>Avis impossible :</strong> aucune réservation liée. Reviens depuis <strong>Mes réservations</strong>.
              </div>
            ) : (
              <>
                <div style={{ fontWeight: 950, marginBottom: 6 }}>{myReviewId ? "Modifier mon avis" : "Laisser un avis"}</div>

                <div style={{ display: "grid", gap: 10 }}>
                  <div>
                    <label className="bl-label">Note (1 à 5)</label>
                    <input
                      className="bl-input"
                      type="number"
                      min={1}
                      max={5}
                      value={reviewRating}
                      onChange={(e) => setReviewRating(Math.max(1, Math.min(5, Number(e.target.value) || 5)))}
                    />
                  </div>

                  <div>
                    <label className="bl-label">Commentaire (optionnel)</label>
                    <textarea
                      className="bl-input"
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={4}
                      placeholder="Ex: Très propre, hôte réactif…"
                    />
                    <div style={{ marginTop: 6, fontSize: 12, fontWeight: 900, opacity: 0.6 }}>
                      {reviewComment.length} / 1000
                    </div>
                  </div>

                  <button
                    className={reviewSaving ? "bl-btn bl-btn-disabled" : "bl-btn bl-btn-primary"}
                    disabled={reviewSaving}
                    onClick={submitReview}
                    style={{ width: "100%", fontWeight: 950 }}
                  >
                    {reviewSaving ? "Envoi…" : myReviewId ? "Mettre à jour" : "Envoyer l’avis"}
                  </button>

                  <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.65 }}>Réservation liée : {bookingIdFromUrl}</div>
                </div>
              </>
            )}
          </div>
        )}

        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          {reviewsLoading ? (
            <div style={{ opacity: 0.8 }}>Chargement…</div>
          ) : reviews.length === 0 ? (
            <div style={{ opacity: 0.8 }}>Pas encore d’avis. Le premier qui commence gagne le prestige.</div>
          ) : (
            reviews.map((r) => (
              <div
                key={r.id}
                style={{
                  border: "1px solid rgba(0,0,0,0.08)",
                  background: "white",
                  borderRadius: 14,
                  padding: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                    <StarsInline value={r.rating} count={0} />
                    <span style={{ fontSize: 12, fontWeight: 900, opacity: 0.65 }}>
                      {new Date(r.created_at).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  {r.booking_id ? <Badge tone="neutral">avis vérifié</Badge> : <Badge tone="neutral">avis</Badge>}
                </div>

                {r.comment && (
                  <div style={{ marginTop: 8, fontWeight: 800, opacity: 0.85, whiteSpace: "pre-wrap" }}>
                    {r.comment}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* LIGHTBOX overlay */}
      {lightboxOpen && lightboxSrc && (
        <div
          className="bl-lightbox"
          onClick={closeLightbox}
          role="presentation"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            zIndex: 9999,
            padding: 18,
            display: "grid",
            placeItems: "center",
          }}
        >
          <div
            className="bl-lightbox-inner"
            onClick={(e) => e.stopPropagation()}
            role="presentation"
            style={{
              width: "min(1100px, 96vw)",
              maxHeight: "90vh",
              display: "grid",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
              <button
                className="bl-lightbox-close"
                onClick={closeLightbox}
                style={{
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(255,255,255,0.08)",
                  color: "white",
                  fontWeight: 900,
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
              >
                Fermer (ESC)
              </button>

              <div style={{ color: "white", fontWeight: 900, opacity: 0.9 }}>
                {lightboxIndex + 1} / {lightboxPaths.length}
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={goPrev}
                  title="Précédent (←)"
                  style={{
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.18)",
                    background: "rgba(255,255,255,0.08)",
                    color: "white",
                    fontWeight: 900,
                    padding: "8px 12px",
                    cursor: "pointer",
                  }}
                >
                  ← Précédent
                </button>
                <button
                  onClick={goNext}
                  title="Suivant (→)"
                  style={{
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.18)",
                    background: "rgba(255,255,255,0.08)",
                    color: "white",
                    fontWeight: 900,
                    padding: "8px 12px",
                    cursor: "pointer",
                  }}
                >
                  Suivant →
                </button>
              </div>
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxSrc}
              alt=""
              className="bl-lightbox-img"
              style={{
                width: "100%",
                height: "auto",
                maxHeight: "80vh",
                objectFit: "contain",
                borderRadius: 14,
                background: "rgba(255,255,255,0.06)",
              }}
            />
          </div>
        </div>
      )}
    </main>
  );
}

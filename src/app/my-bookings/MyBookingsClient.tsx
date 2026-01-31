"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { supabase } from "@/lib/supabaseClient";
import { publicListingImageUrl } from "@/lib/storage";

type Booking = {
  id: string;
  listing_id: string;
  renter_id: string;
  start_date: string;
  end_date: string;
  total_cents: number;
  status: string;
  payment_status?: string | null;
  created_at: string;
  expires_at?: string | null;
};

type ListingLite = {
  id: string;
  title: string;
  cover_image_path: string | null;
};

type ListingRow = {
  id: string | number;
  title: string | null;
  cover_image_path: string | null;
};

type ReviewRow = {
  id: string | number;
  booking_id: string | number | null;
};

type BookingStateRow = {
  id: string;
  status: string | null;
  payment_status: string | null;
  expires_at: string | null;
};

function normalizeId(x: unknown) {
  // ✅ évite les mismatch " 123 " vs 123 vs "123"
  return String(x ?? "").trim();
}

function euros(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

function formatDateFR(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function formatStatusFR(s: string) {
  const key = (s || "").toLowerCase();
  if (key === "pending") return "en attente (option)";
  if (key === "confirmed") return "confirmée";
  if (key === "paid") return "payée";
  if (key === "cancelled" || key === "canceled") return "annulée";
  return s;
}

function isPaidLike(statusKey: string, payKey: string) {
  // ✅ robuste live/test : parfois "succeeded" peut apparaître selon implémentations
  if (payKey === "paid" || payKey === "succeeded") return true;
  if (statusKey === "paid") return true;
  return false;
}

function isConfirmedLike(statusKey: string, payKey: string) {
  // confirmed inclut paid-like
  if (statusKey === "confirmed") return true;
  if (isPaidLike(statusKey, payKey)) return true;
  return false;
}

function PillBadge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const styles: Record<string, React.CSSProperties> = {
    neutral: {
      background: "rgba(0,0,0,0.04)",
      border: "1px solid rgba(0,0,0,0.08)",
      color: "rgba(0,0,0,0.75)",
    },
    success: {
      background: "rgba(16,185,129,0.12)",
      border: "1px solid rgba(16,185,129,0.35)",
      color: "rgba(6,95,70,1)",
    },
    warning: {
      background: "rgba(245,158,11,0.12)",
      border: "1px solid rgba(245,158,11,0.35)",
      color: "rgba(146,64,14,1)",
    },
    danger: {
      background: "rgba(239,68,68,0.10)",
      border: "1px solid rgba(239,68,68,0.35)",
      color: "rgba(153,27,27,1)",
    },
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
        ...styles[tone],
        maxWidth: "100%",
      }}
    >
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </span>
    </span>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        marginTop: 10,
        height: 44,
        width: "100%",
        padding: "0 14px",
        borderRadius: 12,
        border: "1px solid rgba(0,0,0,0.10)",
        background: disabled ? "rgba(0,0,0,0.08)" : "rgba(17, 24, 39, 1)",
        color: disabled ? "rgba(0,0,0,0.45)" : "white",
        fontWeight: 900,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "transform 120ms ease, opacity 120ms ease",
      }}
    >
      {children}
    </button>
  );
}

function SecondaryLinkButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        height: 38,
        padding: "0 12px",
        borderRadius: 12,
        border: "1px solid rgba(0,0,0,0.10)",
        background: "white",
        fontWeight: 900,
        textDecoration: "none",
        color: "rgba(17, 24, 39, 1)",
        width: "100%",
      }}
    >
      {children}
    </Link>
  );
}

function cleanQueryParams(router: AppRouterInstance, search: URLSearchParams) {
  const next = new URLSearchParams(search.toString());
  next.delete("paid");
  next.delete("canceled");
  next.delete("bookingId");
  const qs = next.toString();
  router.replace(qs ? `?${qs}` : "?", { scroll: false });
}

function removeFocusParam(router: AppRouterInstance, search: URLSearchParams) {
  const next = new URLSearchParams(search.toString());
  next.delete("focus");
  const qs = next.toString();
  router.replace(qs ? `?${qs}` : "?", { scroll: false });
}

function msLeftToText(msLeft: number) {
  if (msLeft <= 0) return "expirée";
  const totalSec = Math.floor(msLeft / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  const ss = String(s).padStart(2, "0");
  if (m <= 0) return `${ss}s`;
  return `${m}:${ss}`;
}

function toDate(s: string) {
  return new Date(s + "T00:00:00");
}

function isStayFinished(end_date: string) {
  const end = toDate(end_date).getTime();
  const today = toDate(new Date().toISOString().slice(0, 10)).getTime();
  return end <= today;
}

function safeTime(iso: string | null | undefined) {
  if (!iso) return null;
  const t = new Date(String(iso)).getTime();
  return Number.isFinite(t) ? t : null;
}

function filterBtnClass(active: boolean) {
  return `bl-btn${active ? " bl-btn-primary" : ""}`;
}

export default function MyBookingsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const paid = searchParams.get("paid");
  const canceled = searchParams.get("canceled");

  // ✅ normalisation (évite mismatch id)
  const bookingIdFromUrl = normalizeId(searchParams.get("bookingId"));
  const focusId = normalizeId(searchParams.get("focus"));

  const [checking, setChecking] = useState(true);
  const [items, setItems] = useState<Booking[]>([]);
  const [listingById, setListingById] = useState<Record<string, ListingLite>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [payingId, setPayingId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState<number>(() => Date.now());

  const [keepSuccessBanner, setKeepSuccessBanner] = useState(false);

  const [reviewIdByBookingId, setReviewIdByBookingId] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<"all" | "active" | "past" | "cancelled">("active");

  const [sessionUid, setSessionUid] = useState<string | null>(null);

  // ✅ Mode “optimiste”: on masque le bouton payer pour CETTE booking après retour Stripe
  const [optimisticPaidBookingId, setOptimisticPaidBookingId] = useState<string | null>(null);

  const showPaidBanner = useMemo(() => paid === "1" || keepSuccessBanner, [paid, keepSuccessBanner]);
  const showCanceledBanner = useMemo(() => canceled === "1", [canceled]);

  const bannerBooking = useMemo(() => {
    if (!bookingIdFromUrl) return null;
    return items.find((x) => normalizeId(x.id) === bookingIdFromUrl) ?? null;
  }, [bookingIdFromUrl, items]);

  const bannerListingId = bannerBooking?.listing_id ?? null;

  async function loadData() {
    setErrorMsg(null);

    const { data: session } = await supabase.auth.getSession();
    const uid = session.session?.user?.id ?? null;

    setSessionUid(uid);

    if (!uid) {
      router.replace("/auth");
      return;
    }

    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("id,listing_id,renter_id,start_date,end_date,total_cents,status,payment_status,created_at,expires_at")
      .eq("renter_id", uid)
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    const safe = (bookings || []) as Booking[];
    setItems(safe);

    // ✅ si la booking optimiste est désormais payée/confirmée, on coupe le mode optimiste
    if (optimisticPaidBookingId) {
      const b = safe.find((x) => normalizeId(x.id) === normalizeId(optimisticPaidBookingId)) || null;
      if (b) {
        const statusKey = String(b.status || "").toLowerCase();
        const payKey = String(b.payment_status || "").toLowerCase();
        if (isPaidLike(statusKey, payKey) || isConfirmedLike(statusKey, payKey)) {
          setOptimisticPaidBookingId(null);
        }
      }
    }

    const ids = [...new Set(safe.map((b) => b.listing_id))];
    if (ids.length === 0) {
      setListingById({});
      setReviewIdByBookingId({});
      return;
    }

    const { data: listings, error: lErr } = await supabase
      .from("listings")
      .select("id,title,cover_image_path")
      .in("id", ids);

    if (!lErr) {
      const map: Record<string, ListingLite> = {};
      (listings as ListingRow[] | null | undefined)?.forEach((l) => {
        map[String(l.id)] = {
          id: String(l.id),
          title: String(l.title || "Annonce"),
          cover_image_path: l.cover_image_path ? String(l.cover_image_path) : null,
        };
      });
      setListingById(map);
    }

    const bookingIds = safe.map((b) => b.id);
    if (bookingIds.length === 0) {
      setReviewIdByBookingId({});
      return;
    }

    const { data: revs, error: rErr } = await supabase
      .from("reviews")
      .select("id, booking_id")
      .in("booking_id", bookingIds);

    if (rErr) {
      setReviewIdByBookingId({});
    } else {
      const map: Record<string, string> = {};
      (revs as ReviewRow[] | null | undefined)?.forEach((r) => {
        const bid = r.booking_id === null ? "" : String(r.booking_id);
        const rid = r.id === null || typeof r.id === "undefined" ? "" : String(r.id);
        if (bid && rid) map[bid] = rid;
      });
      setReviewIdByBookingId(map);
    }
  }

  async function fetchBookingState(bookingId: string) {
    const { data, error } = await supabase
      .from("bookings")
      .select("id,status,payment_status,expires_at")
      .eq("id", bookingId)
      .single();
    if (error || !data) return null;

    const row = data as BookingStateRow;
    const status = String(row.status || "").toLowerCase();
    const pay = String(row.payment_status || "").toLowerCase();
    const expiresAt = row.expires_at ?? null;

    return { status, pay, expiresAt };
  }

  // ✅ Realtime (si webhook met à jour, refresh auto)
  useEffect(() => {
    if (!sessionUid) return;

    const channel = supabase
      .channel(`bookings-renter-${sessionUid}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings", filter: `renter_id=eq.${sessionUid}` },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionUid]);

  // Tick seulement si au moins une booking “pending”
  useEffect(() => {
    const hasPending = items.some((b) => {
      const statusKey = String(b.status || "").toLowerCase();
      const payKey = String(b.payment_status || "").toLowerCase();
      const isConfirmed = isConfirmedLike(statusKey, payKey);
      const isPending = statusKey === "pending" && !isConfirmed;
      return isPending;
    });
    if (!hasPending) return;

    const t = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, [items]);

  useEffect(() => {
    if (!focusId) return;
    if (items.length === 0) return;

    const el = cardRefs.current[focusId] || null;
    if (!el) return;

    const t = setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightId(focusId);

      setTimeout(() => setHighlightId(null), 3000);

      setTimeout(() => {
        removeFocusParam(router, new URLSearchParams(window.location.search));
      }, 4000);
    }, 350);

    return () => clearTimeout(t);
  }, [focusId, items, router]);

  useEffect(() => {
    let alive = true;

    async function init() {
      setChecking(true);
      await loadData();
      if (!alive) return;
      setChecking(false);

      if (canceled === "1") {
        setTimeout(() => {
          if (!alive) return;
          cleanQueryParams(router, new URLSearchParams(window.location.search));
        }, 1200);
        return;
      }

      if (paid === "1") {
        setKeepSuccessBanner(true);

        // ✅ Optimiste: on masque le bouton payer pour l’ID qu’on reçoit
        if (bookingIdFromUrl) setOptimisticPaidBookingId(bookingIdFromUrl);

        if (bookingIdFromUrl) {
          setSyncing(true);

          const maxTries = 20;
          for (let i = 0; i < maxTries && alive; i++) {
            const st = await fetchBookingState(bookingIdFromUrl);

            const synced =
              !!st &&
              (st.pay === "paid" ||
                st.pay === "succeeded" ||
                st.status === "confirmed" ||
                st.status === "paid");

            if (synced) {
              await loadData();
              if (!alive) return;

              setSyncing(false);

              setTimeout(() => {
                if (!alive) return;
                cleanQueryParams(router, new URLSearchParams(window.location.search));
              }, 2500);

              setTimeout(() => {
                if (!alive) return;
                setKeepSuccessBanner(false);
              }, 4000);

              return;
            }

            await new Promise((r) => setTimeout(r, 1000));
          }

          await loadData();
          if (!alive) return;
          setSyncing(false);

          setTimeout(() => {
            if (!alive) return;
            cleanQueryParams(router, new URLSearchParams(window.location.search));
          }, 2500);

          setTimeout(() => {
            if (!alive) return;
            setKeepSuccessBanner(false);
          }, 4000);

          return;
        }

        setSyncing(true);
        for (let i = 0; i < 3 && alive; i++) {
          await new Promise((r) => setTimeout(r, 1000));
          await loadData();
        }
        if (!alive) return;
        setSyncing(false);

        setTimeout(() => {
          if (!alive) return;
          cleanQueryParams(router, new URLSearchParams(window.location.search));
        }, 2500);

        setTimeout(() => {
          if (!alive) return;
          setKeepSuccessBanner(false);
        }, 4000);
      }
    }

    init();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, paid, canceled, bookingIdFromUrl]);

  async function payBooking(bookingId: string) {
    try {
      if (payingId) return;

      setPayingId(bookingId);

      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Non authentifié");

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bookingId }),
      });

      const raw = await res.text();
      let json: unknown = null;
      try {
        json = JSON.parse(raw) as unknown;
      } catch {
        throw new Error("Réponse API invalide (pas du JSON). Regarde la console serveur.");
      }

      if (!res.ok) {
        const msg =
          typeof json === "object" && json && "error" in json
            ? String((json as { error?: unknown }).error)
            : null;
        throw new Error(msg ?? "Erreur paiement");
      }

      const url =
        typeof json === "object" && json && "url" in json
          ? String((json as { url?: unknown }).url || "")
          : "";
      if (!url) throw new Error("URL de paiement manquante.");

      window.location.href = url;
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Erreur paiement");
      setPayingId(null);
    }
  }

  const filteredItems = useMemo(() => {
    const base = items.filter((b) => {
      const statusKey = String(b.status || "").toLowerCase();
      const isCancelled = statusKey === "cancelled" || statusKey === "canceled";
      const isPast = isStayFinished(b.end_date);

      if (filter === "all") return true;
      if (filter === "cancelled") return isCancelled;
      if (filter === "past") return !isCancelled && isPast;
      return !isCancelled && !isPast;
    });

    const arr = [...base];
    arr.sort((a, b) => {
      const aStatus = String(a.status || "").toLowerCase();
      const bStatus = String(b.status || "").toLowerCase();

      const aPay = String(a.payment_status || "").toLowerCase();
      const bPay = String(b.payment_status || "").toLowerCase();

      const aIsConfirmed = isConfirmedLike(aStatus, aPay);
      const bIsConfirmed = isConfirmedLike(bStatus, bPay);

      const aIsPending = aStatus === "pending" && !aIsConfirmed;
      const bIsPending = bStatus === "pending" && !bIsConfirmed;

      const aExp = safeTime(a.expires_at) ?? null;
      const bExp = safeTime(b.expires_at) ?? null;

      const aExpired = aIsPending && typeof aExp === "number" && aExp <= Date.now();
      const bExpired = bIsPending && typeof bExp === "number" && bExp <= Date.now();

      const aPendingLive = aIsPending && !aExpired;
      const bPendingLive = bIsPending && !bExpired;
      if (aPendingLive && !bPendingLive) return -1;
      if (!aPendingLive && bPendingLive) return 1;

      const aPendingExpired = aIsPending && aExpired;
      const bPendingExpired = bIsPending && bExpired;
      if (aPendingExpired && !bPendingExpired) return -1;
      if (!aPendingExpired && bPendingExpired) return 1;

      const at = safeTime(a.created_at) ?? 0;
      const bt = safeTime(b.created_at) ?? 0;
      return bt - at;
    });

    return arr;
  }, [items, filter]);

  if (checking) return <main className="bl-container">Chargement…</main>;

  const activeLabel =
    filter === "all"
      ? "Tout"
      : filter === "active"
      ? "En cours"
      : filter === "past"
      ? "Passées"
      : "Annulées";

  return (
    <main className="bl-container">
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <h1 style={{ margin: 0 }}>Mes réservations</h1>

        <button
          className="bl-btn"
          style={{ marginTop: 0, height: 40, fontWeight: 900 }}
          onClick={loadData}
          disabled={syncing}
        >
          {syncing ? "Sync…" : "Rafraîchir"}
        </button>
      </div>

      <div style={{ marginTop: 12 }}>
        <div
          style={{
            display: "grid",
            gap: 10,
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          }}
        >
          <button
            className={filterBtnClass(filter === "all")}
            style={{ marginTop: 0, fontWeight: 950 }}
            aria-pressed={filter === "all"}
            onClick={() => setFilter("all")}
          >
            Tout
          </button>
          <button
            className={filterBtnClass(filter === "active")}
            style={{ marginTop: 0, fontWeight: 950 }}
            aria-pressed={filter === "active"}
            onClick={() => setFilter("active")}
          >
            En cours
          </button>
          <button
            className={filterBtnClass(filter === "past")}
            style={{ marginTop: 0, fontWeight: 950 }}
            aria-pressed={filter === "past"}
            onClick={() => setFilter("past")}
          >
            Passées
          </button>
          <button
            className={filterBtnClass(filter === "cancelled")}
            style={{ marginTop: 0, fontWeight: 950 }}
            aria-pressed={filter === "cancelled"}
            onClick={() => setFilter("cancelled")}
          >
            Annulées
          </button>
        </div>

        <div style={{ marginTop: 8, fontSize: 12, fontWeight: 900, opacity: 0.65 }}>
          Affichage : <span style={{ opacity: 0.9 }}>{activeLabel}</span> ·{" "}
          {filteredItems.length} réservation(s)
        </div>
      </div>

      {showPaidBanner && (
        <div
          className="bl-alert"
          style={{
            border: "1px solid rgba(16,185,129,0.35)",
            background: "rgba(16,185,129,0.10)",
            marginBottom: 14,
            marginTop: 12,
            display: "flex",
            gap: 12,
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <div>
            <strong>Paiement validé.</strong>{" "}
            {syncing ? <>Synchronisation en cours…</> : <>Réservation confirmée. Merci.</>}
          </div>

          <div
            style={{
              display: "grid",
              gap: 10,
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              width: "100%",
            }}
          >
            {bookingIdFromUrl && (
              <Link
                href={`/messages/${bookingIdFromUrl}?autostart=1`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 38,
                  padding: "0 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(16,185,129,0.35)",
                  background: "rgba(255,255,255,0.9)",
                  fontWeight: 900,
                  textDecoration: "none",
                  color: "rgba(17,24,39,1)",
                }}
              >
                Ouvrir la conversation →
              </Link>
            )}

            {bannerListingId && (
              <Link
                href={`/listing/${bannerListingId}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 38,
                  padding: "0 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(16,185,129,0.35)",
                  background: "rgba(255,255,255,0.7)",
                  fontWeight: 900,
                  textDecoration: "none",
                  color: "rgba(17,24,39,1)",
                }}
              >
                Retour à l’annonce →
              </Link>
            )}
          </div>
        </div>
      )}

      {showCanceledBanner && (
        <div
          className="bl-alert"
          style={{
            border: "1px solid rgba(245,158,11,0.35)",
            background: "rgba(245,158,11,0.10)",
            marginBottom: 14,
            marginTop: 12,
          }}
        >
          <strong>Paiement annulé.</strong> Aucun débit n’a été effectué.
        </div>
      )}

      {errorMsg && <div className="bl-alert bl-alert-error">{errorMsg}</div>}

      {filteredItems.length === 0 ? (
        <div className="bl-alert" style={{ marginTop: 12 }}>
          Aucune réservation dans cette catégorie.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
          {filteredItems.map((b) => {
            const listing = listingById[b.listing_id];
            const cover = listing?.cover_image_path
              ? publicListingImageUrl(listing.cover_image_path)
              : null;

            const statusKey = String(b.status || "").toLowerCase();
            const payKey = String(b.payment_status || "").toLowerCase();

            // ✅ Optimiste robuste: compare ids normalisés
            const optimisticPaid =
              !!optimisticPaidBookingId &&
              normalizeId(optimisticPaidBookingId) === normalizeId(b.id);

            const isCancelled = statusKey === "cancelled" || statusKey === "canceled";
            const isConfirmed = optimisticPaid || isConfirmedLike(statusKey, payKey);
            const isPaid = optimisticPaid || isPaidLike(statusKey, payKey);

            // ✅ pending seulement si PAS confirmé
            const isPending = statusKey === "pending" && !isConfirmed;

            const isPayingThis = payingId === b.id;

            const isFocused = !!focusId && focusId === normalizeId(b.id);
            const isHighlighted = highlightId === b.id;

            const expiresAt = b.expires_at ? new Date(b.expires_at).getTime() : null;
            const msLeft = expiresAt ? expiresAt - nowTick : null;

            const isExpired = isPending && typeof msLeft === "number" && msLeft <= 0;
            const reviewEligible =
              !isPending && !isCancelled && isConfirmed && isStayFinished(b.end_date);
            const hasReview = !!reviewIdByBookingId[b.id];

            let badge: React.ReactNode = (
              <PillBadge tone="neutral">{formatStatusFR(b.status)}</PillBadge>
            );
            if (isPaid) badge = <PillBadge tone="success">Payée</PillBadge>;
            else if (isConfirmed) badge = <PillBadge tone="neutral">confirmée</PillBadge>;
            else if (isPending)
              badge = (
                <PillBadge tone={isExpired ? "danger" : "warning"}>
                  {isExpired ? "Option expirée" : "Option (en attente)"}
                </PillBadge>
              );
            else if (isCancelled) badge = <PillBadge tone="danger">Annulée</PillBadge>;

            const showUrgent = isPending && !isExpired;

            return (
              <div
                key={b.id}
                ref={(el) => {
                  cardRefs.current[normalizeId(b.id)] = el;
                }}
                className="bl-card"
                style={{
                  padding: 14,
                  borderRadius: 16,
                  border: isFocused
                    ? "2px solid rgba(17, 24, 39, 0.9)"
                    : "1px solid rgba(0,0,0,0.08)",
                  background: isFocused ? "rgba(17, 24, 39, 0.02)" : "white",
                  boxShadow: isHighlighted
                    ? "0 0 0 6px rgba(17, 24, 39, 0.10)"
                    : isFocused
                    ? "0 10px 24px rgba(0,0,0,0.10)"
                    : undefined,
                  transition: "box-shadow 220ms ease, border-color 220ms ease",
                  opacity: isExpired ? 0.88 : 1,
                }}
              >
                <div className="bl-booking-row">
                  <Link
                    href={`/listing/${b.listing_id}`}
                    className="bl-booking-media"
                    style={{ textDecoration: "none" }}
                  >
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cover}
                        alt={listing?.title ?? "Annonce"}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: 12,
                          display: "block",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          background: "rgba(0,0,0,0.05)",
                          borderRadius: 12,
                        }}
                      />
                    )}
                  </Link>

                  <div className="bl-booking-body">
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <strong style={{ fontSize: 16, lineHeight: 1.2 }}>
                        {listing?.title ?? "Annonce"}
                      </strong>
                      {badge}
                      {showUrgent && <PillBadge tone="warning">Urgent</PillBadge>}
                      {isFocused && <PillBadge tone="neutral">Sélectionnée</PillBadge>}
                    </div>

                    <div style={{ marginTop: 6, opacity: 0.85, fontWeight: 800 }}>
                      {formatDateFR(b.start_date)} → {formatDateFR(b.end_date)}
                    </div>

                    <div style={{ marginTop: 6, fontWeight: 950, fontSize: 16 }}>
                      {euros(b.total_cents)}
                    </div>

                    {isPending && expiresAt && (
                      <div style={{ marginTop: 8, fontSize: 13, fontWeight: 850, opacity: 0.85 }}>
                        Option {isExpired ? "expirée" : `expire dans ${msLeftToText(msLeft as number)}`}
                      </div>
                    )}

                    {isPending ? (
                      <>
                        <PrimaryButton
                          onClick={() => payBooking(b.id)}
                          disabled={!!payingId || syncing || isPayingThis || isExpired}
                        >
                          {isExpired
                            ? "Option expirée"
                            : isPayingThis
                            ? "Redirection…"
                            : syncing
                            ? "Synchronisation…"
                            : "Payer maintenant"}
                        </PrimaryButton>

                        <div className="bl-actions-grid">
                          <SecondaryLinkButton href={`/listing/${b.listing_id}`}>
                            Retour à l’annonce
                          </SecondaryLinkButton>
                          <SecondaryLinkButton href={`/messages/${b.id}?autostart=1`}>
                            Contacter l’hôte
                          </SecondaryLinkButton>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ marginTop: 10, opacity: 0.75, fontSize: 13, fontWeight: 850 }}>
                          {isConfirmed
                            ? "Réservation confirmée. Paiement reçu."
                            : isPaid
                            ? "Paiement reçu."
                            : isCancelled
                            ? "Option expirée / réservation annulée."
                            : "Statut mis à jour."}
                        </div>

                        <div className="bl-actions-grid" style={{ marginTop: 10 }}>
                          <SecondaryLinkButton href={`/listing/${b.listing_id}`}>
                            Retour à l’annonce
                          </SecondaryLinkButton>
                          <SecondaryLinkButton href={`/messages/${b.id}?autostart=1`}>
                            Contacter l’hôte
                          </SecondaryLinkButton>

                          {reviewEligible && (
                            <SecondaryLinkButton
                              href={`/listing/${b.listing_id}?review=1&bookingId=${encodeURIComponent(
                                b.id
                              )}#reviews`}
                            >
                              {hasReview ? "Modifier mon avis" : "Laisser un avis"}
                            </SecondaryLinkButton>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style jsx global>{`
        .bl-booking-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          align-items: start;
        }

        .bl-booking-media {
          width: 100%;
          height: 180px;
          border-radius: 12px;
          overflow: hidden;
          background: rgba(0, 0, 0, 0.05);
        }

        .bl-booking-body {
          min-width: 0;
        }

        .bl-actions-grid {
          margin-top: 10px;
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }

        @media (min-width: 720px) {
          .bl-booking-row {
            grid-template-columns: 180px 1fr;
            gap: 14px;
          }
          .bl-booking-media {
            height: 120px;
          }
          .bl-actions-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (min-width: 980px) {
          .bl-actions-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
      `}</style>
    </main>
  );
}

"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type InboxItem = {
  booking_id: string;
  unread_count: number;
};

function sumUnread(items: InboxItem[]) {
  let n = 0;
  for (const it of items) n += Number(it.unread_count || 0);
  return n;
}

export default function TopbarClient() {
  const router = useRouter();
  const pathname = usePathname();

  const [checking, setChecking] = useState(true);
  const [uid, setUid] = useState<string | null>(null);

  const [loadingBadge, setLoadingBadge] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState<number>(0);

  // anti-spam refresh
  const refreshTimer = useRef<any>(null);

  // anti-concurrence (évite 2 fetch inbox en même temps)
  const inFlightRef = useRef(false);

  const isAuthPage = useMemo(() => pathname?.startsWith("/auth"), [pathname]);

  const refreshUnread = useCallback(async () => {
    // évite les refresh concurrents
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    setLoadingBadge(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token ?? null;
      const u = sessionData.session?.user?.id ?? null;

      if (!token || !u) {
        setUid(null);
        setUnreadTotal(0);
        return;
      }

      setUid(u);

      const res = await fetch("/api/messages/inbox", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (res.status === 401) {
        setUid(null);
        setUnreadTotal(0);
        return;
      }

      const json = await res.json().catch(() => ({}));
      if (!res.ok) return;

      const items = (json.items || []) as InboxItem[];
      setUnreadTotal(sumUnread(items));
    } finally {
      setLoadingBadge(false);
      inFlightRef.current = false;
    }
  }, []);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => {
      refreshUnread();
    }, 350);
  }, [refreshUnread]);

  // init auth + badge
  useEffect(() => {
    let alive = true;

    (async () => {
      setChecking(true);

      const { data } = await supabase.auth.getSession();
      const u = data.session?.user?.id ?? null;
      if (!alive) return;

      setUid(u);
      setChecking(false);

      // on charge le badge si connecté
      if (u) await refreshUnread();
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user?.id ?? null;
      setUid(u);
      setUnreadTotal(0);
      if (u) refreshUnread();
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, [refreshUnread]);

  // ✅ Refresh sur changement de route (pratique après mark-read /messages/[bookingId])
  useEffect(() => {
    if (!uid) return;
    scheduleRefresh();
  }, [pathname, uid, scheduleRefresh]);

  // ✅ Refresh au retour d’onglet / focus (fallback fiable)
  useEffect(() => {
    if (!uid) return;

    const onFocus = () => scheduleRefresh();
    const onVisibility = () => {
      if (document.visibilityState === "visible") scheduleRefresh();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [uid, scheduleRefresh]);

  // realtime: messages insert/update -> refresh badge
  useEffect(() => {
    if (!uid) return;

    const channel = supabase
      .channel(`rt-messages-${uid}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${uid}`,
        },
        () => {
          // insert (nouveau message) OU update (mark-read) -> badge doit bouger
          scheduleRefresh();
        }
      )
      .subscribe();

    // fallback: au cas où realtime n'est pas actif, on repoll toutes les 30s
    const poll = setInterval(() => {
      refreshUnread();
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [uid, refreshUnread, scheduleRefresh]);

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/auth");
    router.refresh();
  }

  const showBadge = !checking && uid && unreadTotal > 0;

  return (
    <header className="bl-topbar">
      <div className="bl-topbar-inner">
        {/* LOGO */}
        <div className="bl-brand">
          <Link className="bl-brand-link" href="/" style={{ display: "flex", alignItems: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-booking-light.png" alt="Booking Light" style={{ height: 48 }} />
          </Link>
        </div>

        {/* NAVIGATION */}
        <nav className="bl-nav">
          <Link className="bl-pill" href="/">
            Accueil
          </Link>
          <Link className="bl-pill" href="/publish">
            Publier
          </Link>
          <Link className="bl-pill" href="/my-listings">
            Mes annonces
          </Link>
          <Link className="bl-pill" href="/my-bookings">
            Mes réservations
          </Link>

          {/* Messages + badge (visible si connecté) */}
          {uid && (
            <Link className="bl-pill" href="/messages" style={{ position: "relative" }}>
              Messages

              {showBadge && (
                <span
                  style={{
                    marginLeft: 8,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 22,
                    height: 22,
                    padding: "0 7px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 900,
                    background: "rgba(17,24,39,1)",
                    color: "white",
                    opacity: loadingBadge ? 0.65 : 1,
                  }}
                  title="Messages non lus"
                >
                  {unreadTotal}
                </span>
              )}
            </Link>
          )}

          {/* Auth / Session */}
          {!uid ? (
            <Link className="bl-pill" href="/auth" aria-current={isAuthPage ? "page" : undefined}>
              Connexion
            </Link>
          ) : (
            <button
              className="bl-pill"
              onClick={logout}
              style={{ cursor: "pointer", border: "none", background: "transparent" }}
              type="button"
            >
              Déconnexion
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

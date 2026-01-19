"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { publicListingImageUrl } from "@/lib/storage";

type InboxItem = {
  booking_id: string;
  listing_id: string;
  listing_title: string | null;
  cover_image_path: string | null;
  other_user_id: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
};

function formatDateTimeFR(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

export default function MessagesInboxPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [uid, setUid] = useState<string | null>(null);

  // Debounce anti spam (Realtime peut pousser plusieurs events)
  const refreshTimer = useRef<any>(null);
  function scheduleRefresh(fn: () => void, delayMs = 350) {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(fn, delayMs);
  }

  async function load() {
    setLoading(true);
    setErrorMsg(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token ?? null;
    const userId = sessionData.session?.user?.id ?? null;

    if (!userId || !token) {
      setChecking(false);
      router.replace("/auth");
      setLoading(false);
      return;
    }

    setUid(userId);

    try {
      const res = await fetch("/api/messages/inbox", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (res.status === 401) {
        router.replace("/auth");
        return;
      }

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Erreur inbox");

      setItems((json.items || []) as InboxItem[]);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Erreur");
    } finally {
      setLoading(false);
    }
  }

  // Init load
  useEffect(() => {
    let alive = true;
    (async () => {
      setChecking(true);
      await load();
      if (!alive) return;
      setChecking(false);
    })();
    return () => {
      alive = false;
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Realtime Inbox
  useEffect(() => {
    if (!uid) return;

    const ch = supabase
      .channel(`inbox:${uid}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          // Messages qui me concernent en réception
          filter: `receiver_id=eq.${uid}`,
        },
        () => scheduleRefresh(load)
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          // Messages que j’envoie (impacte last_message, etc.)
          filter: `sender_id=eq.${uid}`,
        },
        () => scheduleRefresh(load)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  if (checking) {
    return (
      <main className="bl-container">
        <h1>Messages</h1>
        <p>Chargement…</p>
      </main>
    );
  }

  return (
    <main className="bl-container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <h1>Messages</h1>

        <button
          className="bl-btn"
          onClick={load}
          disabled={loading}
          style={{ borderRadius: 12, padding: "8px 12px", fontWeight: 900 }}
        >
          {loading ? "Rafraîchissement…" : "Rafraîchir"}
        </button>
      </div>

      {errorMsg && <div className="bl-alert bl-alert-error">{errorMsg}</div>}

      {items.length === 0 ? (
        <div className="bl-alert" style={{ marginTop: 12 }}>
          Aucune conversation pour l’instant.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
          {items.map((it) => {
            const cover = it.cover_image_path ? publicListingImageUrl(it.cover_image_path) : null;

            return (
              <Link
                key={it.booking_id}
                href={`/messages/${encodeURIComponent(it.booking_id)}`}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: 16,
                  padding: 12,
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  background: "white",
                }}
              >
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cover} alt="" style={{ width: 86, height: 62, objectFit: "cover", borderRadius: 12 }} />
                ) : (
                  <div style={{ width: 86, height: 62, borderRadius: 12, background: "rgba(0,0,0,0.06)" }} />
                )}

                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                    <div style={{ fontWeight: 950 }}>{it.listing_title ?? "Annonce"}</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>{formatDateTimeFR(it.last_message_at)}</div>
                  </div>

                  <div style={{ marginTop: 6, opacity: 0.85, fontSize: 13 }}>
                    {it.last_message ? it.last_message : "Aucun message"}
                  </div>
                </div>

                {it.unread_count > 0 && (
                  <div
                    style={{
                      minWidth: 28,
                      height: 28,
                      borderRadius: 999,
                      display: "grid",
                      placeItems: "center",
                      background: "rgba(17, 24, 39, 1)",
                      color: "white",
                      fontWeight: 950,
                      fontSize: 12,
                      padding: "0 8px",
                    }}
                    title="Messages non lus"
                  >
                    {it.unread_count}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}

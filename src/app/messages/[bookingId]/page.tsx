"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Msg = {
  id: string;
  booking_id: string;
  sender_id: string;
  receiver_id: string;
  body: string;
  created_at: string;
  read_by_host_at: string | null;
  read_by_renter_at: string | null;
};

function formatTimeFR(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(d);
}

function buildAutoMessage() {
  return "Bonjour, je vous contacte suite à ma réservation. Pouvez-vous me confirmer les détails (arrivée, accès, etc.) ? Merci.";
}

export default function MessagesThreadPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const bookingId = (params.bookingId as string) || "";
  const autostart = searchParams.get("autostart") === "1";

  const [checking, setChecking] = useState(true);
  const [uid, setUid] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const canSend = useMemo(() => text.trim().length > 0 && text.trim().length <= 2000, [text]);

  const getToken = useCallback(async () => {
    const { data: s } = await supabase.auth.getSession();
    return s.session?.access_token ?? null;
  }, []);

  // ✅ Anti-spam markRead:
  // On mémorise le dernier message "reçu" (sender != uid) qu'on a déjà marqué comme lu.
  const lastOtherMsgKeyRef = useRef<string>("");

  function computeLastOtherMsgKey(arr: Msg[], myUid: string | null) {
    if (!myUid) return "";
    // messages sont supposés triés par created_at asc côté API. On prend le dernier "non mien".
    for (let i = arr.length - 1; i >= 0; i--) {
      const m = arr[i];
      if (m.sender_id && m.sender_id !== myUid) {
        // key stable: id + created_at
        return `${m.id}:${m.created_at}`;
      }
    }
    return "";
  }

  async function loadThread(): Promise<Msg[]> {
    setErrorMsg(null);
    setLoading(true);

    const token = await getToken();
    if (!token) {
      router.replace("/auth");
      setLoading(false);
      return [];
    }

    const res = await fetch(`/api/messages/thread?bookingId=${encodeURIComponent(bookingId)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErrorMsg(json?.error ?? "Erreur chargement conversation.");
      setLoading(false);
      return [];
    }

    const arr = (json?.messages || []) as Msg[];
    setMessages(arr);
    setLoading(false);
    return arr;
  }

  // ✅ Mark read via POST (write séparé)
  // L'API décide si c'est "read_by_host_at" ou "read_by_renter_at" selon le rôle.
  async function markRead() {
    try {
      const token = await getToken();
      if (!token) return;

      await fetch("/api/messages/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bookingId }),
      });
    } catch {
      // silencieux
    }
  }

  // ✅ Marque comme lu seulement si un nouveau message "reçu" est apparu
  async function markReadIfNeeded(arr: Msg[]) {
    if (!uid) return;

    const nextKey = computeLastOtherMsgKey(arr, uid);

    // Rien reçu => rien à faire
    if (!nextKey) return;

    // Déjà marqué => stop
    if (lastOtherMsgKeyRef.current === nextKey) return;

    // Nouveau message reçu => on marque lu, puis on verrouille
    await markRead();
    lastOtherMsgKeyRef.current = nextKey;
  }

  async function sendBody(body: string) {
    const token = await getToken();
    if (!token) {
      router.replace("/auth");
      return { ok: false as const, error: "Non authentifié" };
    }

    const res = await fetch("/api/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ bookingId, body }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false as const, error: json?.error ?? "Erreur envoi message." };

    return { ok: true as const };
  }

  async function send() {
    const body = text.trim();
    if (!canSend) return;

    setErrorMsg(null);

    const r = await sendBody(body);
    if (!r.ok) {
      setErrorMsg(r.error);
      return;
    }

    setText("");

    // Recharge + markRead (au cas où l'API crée des flags côté autre)
    const arr = await loadThread();
    await markReadIfNeeded(arr);
  }

  async function manualRefresh() {
    const arr = await loadThread();
    await markReadIfNeeded(arr);
  }

  // ✅ Auto-message: uniquement si autostart=1 ET conversation vide
  async function maybeAutoStart(currentMessages: Msg[]) {
    if (!autostart) return;
    if (!bookingId) return;

    const key = `autostart:${bookingId}`;
    if (typeof window !== "undefined" && sessionStorage.getItem(key) === "1") return;

    if (currentMessages.length > 0) {
      if (typeof window !== "undefined") sessionStorage.setItem(key, "1");
      return;
    }

    const r = await sendBody(buildAutoMessage());
    if (!r.ok) return;

    if (typeof window !== "undefined") sessionStorage.setItem(key, "1");

    const arr = await loadThread();
    await markReadIfNeeded(arr);

    // Retirer autostart de l’URL (optionnel mais propre)
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("autostart");
      router.replace(url.pathname + (url.search ? url.search : ""), { scroll: false });
    } catch {}
  }

  // ✅ Au focus/retour onglet: on recharge + markRead (si besoin)
  useEffect(() => {
    if (!uid || !bookingId) return;

    const onVisibility = async () => {
      if (document.visibilityState !== "visible") return;
      const arr = await loadThread();
      await markReadIfNeeded(arr);
    };

    window.addEventListener("focus", onVisibility);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("focus", onVisibility);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, bookingId]);

  // Auth + init
  useEffect(() => {
    let alive = true;

    async function init() {
      setChecking(true);

      if (!bookingId) {
        setErrorMsg("bookingId manquant dans l’URL.");
        setChecking(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      const id = data.session?.user?.id ?? null;

      if (!id) {
        router.replace("/auth");
        return;
      }

      if (!alive) return;
      setUid(id);

      // 1) Charger la conversation
      const arr = await loadThread();

      // 2) Marquer lu immédiatement à l'ouverture si nécessaire
      await markReadIfNeeded(arr);

      // 3) Auto-start si demandé
      await maybeAutoStart(arr);

      if (!alive) return;
      setChecking(false);
    }

    init();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, router, autostart]);

  // ✅ Poll léger (toutes les 4s) => read + markRead uniquement si nouveau message reçu
  useEffect(() => {
    if (checking) return;
    if (!uid) return;

    const t = setInterval(async () => {
      const arr = await loadThread();
      // On marque lu seulement si nouveau message "reçu"
      await markReadIfNeeded(arr);
    }, 4000);

    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking, bookingId, uid]);

  // Auto scroll bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (checking) {
    return <main className="bl-container">Chargement…</main>;
  }

  return (
    <main className="bl-container">
      <div
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Conversation</h1>
          <div style={{ opacity: 0.75, marginTop: 4 }}>Réservation : {bookingId || "—"}</div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Link className="bl-link" href="/messages">
            ← Messages
          </Link>

          <button
            className="bl-btn"
            onClick={manualRefresh}
            style={{ borderRadius: 12, padding: "8px 12px", fontWeight: 900 }}
          >
            Rafraîchir
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bl-alert bl-alert-error" style={{ marginTop: 12 }}>
          {errorMsg}
        </div>
      )}

      {/* ✅ Carte conversation : pleine hauteur + scroll interne */}
      <div
        className="bl-panel bl-chat-card"
        style={{
          marginTop: 12,
          padding: 12,
          borderRadius: 16,
          border: "1px solid rgba(0,0,0,0.08)",
          background: "white",
        }}
      >
        {/* ✅ Zone messages scrollable */}
        <div className="bl-chat-messages" style={{ padding: 8 }}>
          {loading && messages.length === 0 ? (
            <div style={{ opacity: 0.7 }}>Chargement…</div>
          ) : messages.length === 0 ? (
            <div style={{ opacity: 0.7 }}>Aucun message. Tu peux envoyer le premier.</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {messages.map((m) => {
                const mine = uid && m.sender_id === uid;
                return (
                  <div key={m.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
                    <div
                      style={{
                        maxWidth: "78%",
                        padding: "10px 12px",
                        borderRadius: 14,
                        background: mine ? "rgba(17,24,39,1)" : "rgba(0,0,0,0.06)",
                        color: mine ? "white" : "rgba(17,24,39,1)",
                        border: mine ? "1px solid rgba(17,24,39,0.35)" : "1px solid rgba(0,0,0,0.08)",
                      }}
                    >
                      <div style={{ whiteSpace: "pre-wrap", fontWeight: 700, lineHeight: 1.35 }}>{m.body}</div>
                      <div style={{ marginTop: 6, fontSize: 12, opacity: mine ? 0.75 : 0.65 }}>
                        {formatTimeFR(m.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* ✅ Composer collé en bas */}
        <div className="bl-chat-composer">
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <textarea
              className="bl-chat-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Écrire un message…"
              style={{
                flex: 1,
                minHeight: 46,
                maxHeight: 120,
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.12)",
                padding: 10,
                fontWeight: 700,
                resize: "vertical",
              }}
            />

            <button
              className="bl-chat-send"
              onClick={send}
              disabled={!canSend}
              style={{
                width: 140,
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.10)",
                background: canSend ? "rgba(17,24,39,1)" : "rgba(0,0,0,0.08)",
                color: canSend ? "white" : "rgba(0,0,0,0.45)",
                fontWeight: 900,
                cursor: canSend ? "pointer" : "not-allowed",
              }}
            >
              Envoyer
            </button>
          </div>

          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
            Astuce : reste simple au début. Le “Booking-like”, c’est surtout la confiance et la traçabilité.
          </div>
        </div>
      </div>
    </main>
  );
}
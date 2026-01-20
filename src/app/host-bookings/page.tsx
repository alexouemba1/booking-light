// src/app/host-bookings/page.tsx
"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { publicListingImageUrl } from "@/lib/storage";

type HostBookingItem = {
  booking_id: string;
  listing_id: string;
  listing_title: string | null;
  cover_image_path: string | null;
  renter_id: string;
  start_date: string;
  end_date: string;
  total_cents: number;
  status: string;
  payment_status: string | null;
  created_at: string;

  // ✅ nouveaux champs
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
};

function euros(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

function formatDateFR(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function formatDateTimeFR(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(d);
}

function statusFR(status: string, payment_status: string | null) {
  const s = String(status || "").toLowerCase();
  const p = String(payment_status || "").toLowerCase();

  if (s === "pending") return "option (en attente)";
  if (s === "confirmed" && p === "paid") return "confirmée (payée)";
  if (s === "confirmed") return "confirmée";
  if (s === "paid" || p === "paid") return "payée";
  if (s === "cancelled" || s === "canceled") return "annulée";
  return status || "—";
}

function PillBadge({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 900,
        background: "rgba(0,0,0,0.04)",
        border: "1px solid rgba(0,0,0,0.08)",
        color: "rgba(0,0,0,0.75)",
      }}
    >
      {children}
    </span>
  );
}

function UnreadBadge({ n }: { n: number }) {
  if (!n || n <= 0) return null;
  return (
    <span
      title="Messages non lus"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        height: 24,
        minWidth: 24,
        padding: "0 8px",
        borderRadius: 999,
        background: "rgba(17,24,39,1)",
        color: "white",
        fontWeight: 950,
        fontSize: 12,
      }}
    >
      {n}
    </span>
  );
}

export default function HostBookingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = String(searchParams.get("listingId") || "").trim();

  const [checking, setChecking] = useState(true);
  const [items, setItems] = useState<HostBookingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErrorMsg(null);

    // ✅ Fix TS: supabase peut être typé comme nullable -> on "narrow"
    const sb = supabase;
    if (!sb) {
      setErrorMsg("Supabase non initialisé. Vérifie NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      setLoading(false);
      return;
    }

    const { data: s } = await sb.auth.getSession();
    const token = s.session?.access_token ?? null;
    const uid = s.session?.user?.id ?? null;

    if (!uid || !token) {
      router.replace("/auth");
      setLoading(false);
      return;
    }

    const qs = listingId ? `?listingId=${encodeURIComponent(listingId)}` : "";
    const res = await fetch(`/api/host/bookings${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErrorMsg(json?.error ?? "Erreur chargement réservations hôte.");
      setLoading(false);
      return;
    }

    setItems((json.items || []) as HostBookingItem[]);
    setLoading(false);
  }

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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

  const title = useMemo(() => {
    return listingId ? "Réservations reçues (annonce)" : "Réservations reçues";
  }, [listingId]);

  if (checking) {
    return (
      <main className="bl-container">
        <h1>{title}</h1>
        <p>Chargement…</p>
      </main>
    );
  }

  return (
    <main className="bl-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h1 style={{ margin: 0 }}>{title}</h1>
            {listingId && <PillBadge>Filtre actif</PillBadge>}
          </div>

          <div style={{ marginTop: 6, opacity: 0.75 }}>Ici tu vois les réservations sur tes annonces. Le mode “hôte”, sans mystère.</div>

          {listingId && (
            <div style={{ marginTop: 8 }}>
              <Link className="bl-link" href="/host-bookings" style={{ fontWeight: 900 }}>
                Voir toutes les réservations (retirer le filtre)
              </Link>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <Link className="bl-link" href="/my-listings">
            ← Mes annonces
          </Link>

          <button className="bl-btn" onClick={load} disabled={loading} style={{ borderRadius: 12, padding: "8px 12px", fontWeight: 900 }}>
            {loading ? "Rafraîchissement…" : "Rafraîchir"}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bl-alert bl-alert-error" style={{ marginTop: 12 }}>
          {errorMsg}
        </div>
      )}

      {items.length === 0 ? (
        <div className="bl-alert" style={{ marginTop: 12 }}>
          Aucune réservation pour le moment.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
          {items.map((it) => {
            const cover = it.cover_image_path ? publicListingImageUrl(it.cover_image_path) : null;

            return (
              <div
                key={it.booking_id}
                style={{
                  border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: 16,
                  padding: 12,
                  background: "white",
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cover} alt="" style={{ width: 110, height: 76, objectFit: "cover", borderRadius: 12 }} />
                ) : (
                  <div style={{ width: 110, height: 76, borderRadius: 12, background: "rgba(0,0,0,0.06)" }} />
                )}

                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ fontWeight: 950 }}>{it.listing_title ?? "Annonce"}</div>
                    <UnreadBadge n={it.unread_count} />
                  </div>

                  <div style={{ marginTop: 6, opacity: 0.85 }}>
                    {formatDateFR(it.start_date)} → {formatDateFR(it.end_date)}
                  </div>

                  <div style={{ marginTop: 6, fontWeight: 900 }}>{euros(it.total_cents)}</div>

                  <div style={{ marginTop: 6, fontSize: 13, opacity: 0.75 }}>Statut : {statusFR(it.status, it.payment_status)}</div>

                  <div style={{ marginTop: 8, fontSize: 13, opacity: 0.78 }}>
                    <strong>Dernier message :</strong> {it.last_message ? it.last_message : "—"}
                    {it.last_message_at ? (
                      <span style={{ marginLeft: 10, fontSize: 12, opacity: 0.7 }}>({formatDateTimeFR(it.last_message_at)})</span>
                    ) : null}
                  </div>
                </div>

                <div style={{ display: "grid", gap: 10, minWidth: 220 }}>
                  <Link
                    href={`/messages/${encodeURIComponent(it.booking_id)}`}
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
                      color: "rgba(17,24,39,1)",
                    }}
                  >
                    Ouvrir conversation
                  </Link>

                  <Link
                    href={`/listing/${encodeURIComponent(it.listing_id)}`}
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
                      color: "rgba(17,24,39,1)",
                    }}
                  >
                    Voir l’annonce
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

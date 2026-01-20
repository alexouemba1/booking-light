"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { publicListingImageUrl } from "@/lib/storage";

type ListingHome = {
  id: string;
  title: string;
  city: string | null;
  kind: string | null;
  billing_unit: string;
  price_cents: number;
  cover_image_path: string | null;
};

function formatUnit(u: string) {
  if (u === "night") return "nuit";
  if (u === "day") return "jour";
  if (u === "week") return "semaine";
  return u;
}

function getErrorMessage(e: unknown) {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  return "Erreur";
}

export default function HomePage() {
  const [items, setItems] = useState<ListingHome[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filtres (UI)
  const [city, setCity] = useState("");
  const [startDate, setStartDate] = useState(""); // YYYY-MM-DD
  const [endDate, setEndDate] = useState(""); // YYYY-MM-DD
  const [guests, setGuests] = useState<number>(1);

  async function search(next?: { city?: string; startDate?: string; endDate?: string; guests?: number }) {
    const c = (next?.city ?? city).trim();
    const s = (next?.startDate ?? startDate).trim();
    const e = (next?.endDate ?? endDate).trim();

    setLoading(true);
    setErrorMsg(null);

    try {
      const sp = new URLSearchParams();
      if (c) sp.set("city", c);
      if (s) sp.set("start_date", s);
      if (e) sp.set("end_date", e);
      sp.set("guests", String(next?.guests ?? guests ?? 1));

      const res = await fetch(`/api/search?${sp.toString()}`, { cache: "no-store" });
      const json: unknown = await res.json();

      if (!res.ok) {
        const msg =
          typeof json === "object" && json && "error" in json
            ? String((json as { error?: unknown }).error ?? "Erreur recherche")
            : "Erreur recherche";
        throw new Error(msg);
      }

      const itemsValue =
        typeof json === "object" && json && "items" in json ? (json as { items?: unknown }).items : [];
      setItems((itemsValue ?? []) as ListingHome[]);
    } catch (e: unknown) {
      setErrorMsg(getErrorMessage(e));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    search({ city: "", startDate: "", endDate: "", guests: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    search();
  }

  function onReset() {
    setCity("");
    setStartDate("");
    setEndDate("");
    setGuests(1);
    search({ city: "", startDate: "", endDate: "", guests: 1 });
  }

  const withPhoto = items.filter((x) => !!x.cover_image_path).length;

  return (
    <main className="bl-container">
      <div className="bl-hero">
        <div className="bl-hero-title">
          <h1 className="bl-h1">Booking Light</h1>
          <div className="bl-hero-meta">
            {items.length} annonce{items.length > 1 ? "s" : ""} · {withPhoto} avec photo
          </div>
        </div>

        <div className="bl-hero-card">
          <div className="bl-hero-card-title">Trouve un endroit où poser tes valises.</div>
          <div className="bl-hero-card-sub">Recherche une ville, puis clique sur une carte pour voir le détail et réserver.</div>

          <form onSubmit={onSubmit} style={{ marginTop: 12 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.4fr 1fr 1fr 0.9fr auto auto",
                gap: 10,
                alignItems: "end",
              }}
            >
              <div>
                <label className="bl-label">Ville</label>
                <input
                  className="bl-input"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex : Paris, Marseille…"
                />
              </div>

              <div>
                <label className="bl-label">Arrivée</label>
                <input className="bl-input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>

              <div>
                <label className="bl-label">Départ</label>
                <input className="bl-input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>

              <div>
                <label className="bl-label">Voyageurs</label>
                <input
                  className="bl-input"
                  type="number"
                  min={1}
                  value={guests}
                  onChange={(e) => setGuests(Math.max(1, Number(e.target.value) || 1))}
                />
              </div>

              <button type="submit" className={loading ? "bl-btn bl-btn-disabled" : "bl-btn bl-btn-primary"} disabled={loading}>
                {loading ? "Recherche…" : "Rechercher"}
              </button>

              <button type="button" className="bl-btn" onClick={onReset} disabled={loading}>
                Réinitialiser
              </button>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
              <Link className="bl-btn bl-btn-primary" href="/publish">
                + Publier une annonce
              </Link>
              <Link className="bl-btn" href="/my-listings">
                Mes annonces
              </Link>
            </div>
          </form>
        </div>
      </div>

      <section style={{ marginTop: 18 }}>
        {loading && <p>Chargement…</p>}

        {errorMsg && (
          <div className="bl-alert bl-alert-error">
            <strong>Erreur :</strong> {errorMsg}
          </div>
        )}

        {!loading && !errorMsg && items.length === 0 && <p>Aucune annonce pour le moment.</p>}

        {!loading && !errorMsg && items.length > 0 && (
          <div className="bl-grid">
            {items.map((l) => {
              const price = (l.price_cents / 100).toFixed(2).replace(".", ",");
              const img = l.cover_image_path ? publicListingImageUrl(l.cover_image_path) : null;

              return (
                <Link key={l.id} href={`/listing/${l.id}`} className="bl-card">
                  <div className="bl-card-media">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt={l.title} />
                    ) : (
                      <span>Pas d’image</span>
                    )}
                  </div>

                  <div className="bl-card-body">
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", justifyContent: "space-between" }}>
                      <div className="bl-card-title" style={{ lineHeight: 1.15 }}>
                        {l.title}
                      </div>

                      <div
                        style={{
                          flex: "0 0 auto",
                          whiteSpace: "nowrap",
                          padding: "6px 10px",
                          borderRadius: 999,
                          fontWeight: 950,
                          fontSize: 13,
                          border: "1px solid rgba(11,18,32,.12)",
                          background: "rgba(47,107,255,.10)",
                        }}
                        title="Prix"
                      >
                        {price} € / {formatUnit(l.billing_unit)}
                      </div>
                    </div>

                    <div className="bl-card-meta" style={{ marginTop: 8 }}>
                      {l.city ?? "Ville ?"} · {l.kind ?? "Type ?"}
                    </div>

                    <div className="bl-card-cta" style={{ marginTop: 10 }}>
                      Voir détails & réserver →
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

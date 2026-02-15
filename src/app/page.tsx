// FILE: src/app/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
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

function osmEmbedUrl(lat: number, lon: number, zoomRadiusDeg = 0.12) {
  const left = lon - zoomRadiusDeg;
  const right = lon + zoomRadiusDeg;
  const bottom = lat - zoomRadiusDeg;
  const top = lat + zoomRadiusDeg;

  const bbox = `${left},${bottom},${right},${top}`
    .split(",")
    .map((x) => encodeURIComponent(String(x)))
    .join("%2C");

  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${encodeURIComponent(
    `${lat},${lon}`
  )}`;
}

async function geocodeCity(city: string): Promise<{ lat: number; lon: number } | null> {
  const q = city.trim();
  if (!q) return null;

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;

  const data: any = await res.json().catch(() => null);
  const first = Array.isArray(data) ? data[0] : null;
  if (!first?.lat || !first?.lon) return null;

  const lat = Number(first.lat);
  const lon = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  return { lat, lon };
}

export default function HomePage() {
  const [items, setItems] = useState<ListingHome[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [city, setCity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [guests, setGuests] = useState<number>(1);

  const [mapTitle, setMapTitle] = useState("Carte (aperçu)");
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const [mapCenter, setMapCenter] = useState<{ lat: number; lon: number }>({
    lat: 48.8566,
    lon: 2.3522,
  });

  const mapSrc = useMemo(() => osmEmbedUrl(mapCenter.lat, mapCenter.lon), [mapCenter.lat, mapCenter.lon]);

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
      const json: any = await res.json();

      if (!res.ok) throw new Error(json?.error ?? "Erreur recherche");

      setItems(json?.items ?? []);
    } catch (e) {
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

  async function updateMapForCity(cityValue: string) {
    const c = cityValue.trim();
    setMapError(null);

    if (!c) {
      setMapTitle("Carte (aperçu)");
      setMapCenter({ lat: 48.8566, lon: 2.3522 });
      return;
    }

    setMapLoading(true);
    setMapTitle(`Carte — ${c}`);

    try {
      const geo = await geocodeCity(c);
      if (!geo) {
        setMapError("Ville introuvable. Essaie avec un nom plus précis.");
        setMapLoading(false);
        return;
      }
      setMapCenter({ lat: geo.lat, lon: geo.lon });
    } catch (e: any) {
      setMapError(e?.message ?? "Erreur carte.");
    } finally {
      setMapLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await Promise.all([search(), updateMapForCity(city)]);
  }

  function onReset() {
    setCity("");
    setStartDate("");
    setEndDate("");
    setGuests(1);
    setMapError(null);
    setMapLoading(false);
    setMapTitle("Carte (aperçu)");
    setMapCenter({ lat: 48.8566, lon: 2.3522 });
    search({ city: "", startDate: "", endDate: "", guests: 1 });
  }

  const withPhoto = items.filter((x) => !!x.cover_image_path).length;

  return (
    <main className="bl-container">
      <div className="bl-hero">
        <div className="bl-hero-title">
          <h1 className="bl-h1">Location d&apos;appartements et maisons en France – Réservation sécurisée</h1>

          <div className="bl-hero-meta">
            {items.length} annonce{items.length > 1 ? "s" : ""} · {withPhoto} avec photo
          </div>
        </div>

        <div className="bl-hero-card">
          <div className="bl-hero-card-title">Réserve en toute simplicité, publie gratuitement</div>
          <div className="bl-hero-card-sub">
            Une plateforme de mise en relation avec messagerie interne et paiement sécurisé. La commission éventuelle est
            affichée avant validation de la réservation.
          </div>

          <form onSubmit={onSubmit} style={{ marginTop: 12 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 10,
              }}
            >
              <div>
                <label className="bl-label">Ville</label>
                <input
                  className="bl-input"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex : Paris"
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

              <button type="submit" className="bl-btn bl-btn-primary" disabled={loading} style={{ width: "100%" }}>
                {loading ? "Recherche…" : "Rechercher"}
              </button>

              <button type="button" className="bl-btn" onClick={onReset} disabled={loading} style={{ width: "100%" }}>
                Réinitialiser
              </button>
            </div>

            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link className="bl-btn bl-btn-primary" href="/publish">
                + Publier une annonce (gratuit)
              </Link>
              <Link className="bl-btn" href="/my-listings">
                Mes annonces
              </Link>
            </div>

            <div
              style={{
                marginTop: 12,
                display: "grid",
                gap: 6,
                padding: 12,
                borderRadius: 14,
                border: "1px solid rgba(11,18,32,.12)",
                background: "rgba(0,0,0,0.02)",
                fontWeight: 800,
              }}
            >
              <div>✔️ 0 € pour publier une annonce</div>
              <div>✔️ Commission affichée avant réservation</div>
              <div>✔️ Plateforme française, support local</div>
            </div>
          </form>

          <div
            style={{
              marginTop: 14,
              borderRadius: 14,
              overflow: "hidden",
              border: "1px solid rgba(11,18,32,.12)",
            }}
          >
            <div style={{ padding: 10, fontWeight: 700, display: "flex", justifyContent: "space-between", gap: 10 }}>
              <span>{mapTitle}</span>
              <span style={{ opacity: 0.7, fontSize: 13 }}>{mapLoading ? "Mise à jour…" : ""}</span>
            </div>

            {mapError && (
              <div style={{ padding: "0 10px 10px 10px" }}>
                <div className="bl-alert bl-alert-error">
                  <strong>Carte :</strong> {mapError}
                </div>
              </div>
            )}

            <iframe
              title="Carte"
              src={mapSrc}
              style={{ width: "100%", height: 260, border: 0, display: "block" }}
              loading="lazy"
            />
          </div>
        </div>
      </div>

      {/* ✅ Bloc SEO (placé juste après le HERO) */}
      <section style={{ marginTop: 40 }}>
        <h2 style={{ fontWeight: 900 }}>Louer un logement en toute simplicité</h2>

        <p style={{ marginTop: 12, opacity: 0.9 }}>
          Booking-Light est une plateforme de location entre particuliers. Trouvez un appartement, une maison ou un studio
          pour une nuit, une semaine ou un mois. Réservation en ligne, paiement sécurisé, messagerie interne et commission
          transparente.
        </p>

        <p style={{ marginTop: 12, opacity: 0.9 }}>
          Publiez gratuitement votre annonce et recevez des réservations. Locations populaires : Paris, Marseille,
          Toulouse, Martinique et Guyane.
        </p>

        <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="bl-btn bl-btn-primary" href="/publish">
            Publier une annonce
          </Link>
          <Link className="bl-btn" href="/villes">
            Voir toutes les villes
          </Link>
        </div>
      </section>
{/* 🔎 Bloc SEO national */}
<section style={{ marginTop: 40, maxWidth: 900 }}>
  <h2 style={{ fontWeight: 900 }}>
    Location d’appartements et maisons partout en France
  </h2>

  <p style={{ marginTop: 12, lineHeight: 1.6 }}>
    Booking-Light est une plateforme française de location d’appartements et de maisons en courte et moyenne durée.
    Que vous recherchiez une location à Paris, Marseille, Toulouse, en Martinique ou en Guyane,
    vous pouvez réserver en ligne avec paiement sécurisé et messagerie intégrée.
  </p>

  <p style={{ marginTop: 12, lineHeight: 1.6 }}>
    Les propriétaires publient gratuitement leurs annonces et les voyageurs bénéficient
    d’une réservation simple, transparente et sécurisée. Chaque annonce affiche clairement
    le prix par nuit, semaine ou mois, ainsi que les informations essentielles avant validation.
  </p>

  <p style={{ marginTop: 12, lineHeight: 1.6 }}>
    Que ce soit pour un séjour touristique, un déplacement professionnel ou une location longue durée,
    Avec Booking-Light, publiez et réservez un logement partout dans le monde, que vous soyez en Europe, en Afrique, en Amérique ou ailleurs.
  </p>
</section>

{/* 🏠 Bloc spécial propriétaires */}
<section
  style={{
    marginTop: 50,
    padding: 28,
    borderRadius: 18,
    border: "1px solid rgba(11,18,32,.12)",
    background: "linear-gradient(135deg, rgba(47,107,255,.08), rgba(0,0,0,.02))",
    maxWidth: 1000,
  }}
>
  <h2 style={{ fontWeight: 900 }}>
    🏠 Vous êtes propriétaire ? Publiez en toute confiance.
  </h2>

  <p style={{ marginTop: 12, lineHeight: 1.6 }}>
    Booking-Light permet aux propriétaires de louer leur logement facilement,
    gratuitement et en toute sécurité.
  </p>

  <div
    style={{
      marginTop: 18,
      display: "grid",
      gap: 10,
      fontWeight: 600,
    }}
  >
    <div>✔ 0 € pour publier votre annonce</div>
    <div>✔ Paiement sécurisé via Stripe Connect</div>
    <div>✔ Commission claire et transparente</div>
    <div>✔ Messagerie intégrée avec les voyageurs</div>
    <div>✔ Plateforme française, support humain</div>
  </div>

  <div style={{ marginTop: 22 }}>
    <Link className="bl-btn bl-btn-primary" href="/publish">
      Publier mon logement gratuitement
    </Link>
  </div>

  <div style={{ marginTop: 10, fontSize: 14, opacity: 0.8 }}>
    🎯 Les premiers propriétaires bénéficient d’une mise en avant prioritaire.
  </div>
</section>

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
                    <div style={{ display: "flex", gap: 10, justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div className="bl-card-title">{l.title}</div>

                      <div
                        style={{
                          flex: "0 0 auto",
                          alignSelf: "flex-start",
                          whiteSpace: "nowrap",
                          padding: "6px 10px",
                          borderRadius: 999,
                          fontWeight: 700,
                          fontSize: 13,
                          border: "1px solid rgba(11,18,32,.12)",
                          background: "rgba(47,107,255,.10)",
                        }}
                        title="Prix"
                      >
                        {price} € / {formatUnit(l.billing_unit)}
                      </div>
                    </div>

                    <div className="bl-card-meta" style={{ marginTop: 6 }}>
                      {l.city ?? "Ville ?"} · {l.kind ?? "Type ?"}
                    </div>

                    <div className="bl-card-cta" style={{ marginTop: 8 }}>
                      Voir détails & réserver →
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* 🔥 Bloc SEO maillage interne */}
      <section style={{ marginTop: 40 }}>
        <h2 style={{ fontWeight: 900 }}>Locations populaires</h2>

        <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
          <Link href="/location-paris">Location à Paris</Link>
          <Link href="/location-marseille">Location à Marseille</Link>
          <Link href="/location-toulouse">Location à Toulouse</Link>
          <Link href="/location-martinique">Location en Martinique</Link>
          <Link href="/location-guyane">Location en Guyane</Link>
        </div>
      </section>
    </main>
  );
}
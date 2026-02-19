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

  // ✅ Premium (renvoyé par /api/search)
  is_premium?: boolean | null;
  premium_until?: string | null;
    rating_avg?: number | null;
  rating_count?: number | null;
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

// ✅ Premium actif (UI)
function isPremiumActive(l: ListingHome) {
  if (!l?.is_premium) return false;
  if (!l?.premium_until) return true; // fallback
  return new Date(l.premium_until).getTime() > Date.now();
}

// ✅ Tri UI “ceinture + bretelles” : premium actifs d’abord, puis premium_until desc
function sortHomeListings(items: ListingHome[]) {
  return [...items].sort((a, b) => {
    const ap = isPremiumActive(a) ? 1 : 0;
    const bp = isPremiumActive(b) ? 1 : 0;
    if (bp !== ap) return bp - ap;

    const aUntil = a.premium_until ? new Date(a.premium_until).getTime() : 0;
    const bUntil = b.premium_until ? new Date(b.premium_until).getTime() : 0;
    if (bUntil !== aUntil) return bUntil - aUntil;

    return 0; // l’API a déjà fait le tri complet
  });
}

export default function HomePage() {
  const [items, setItems] = useState<ListingHome[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [city, setCity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [guests, setGuests] = useState<number>(1);
  const GUESTS_MIN = 1;
  const GUESTS_MAX = 10;

  const [mapTitle, setMapTitle] = useState("Carte (aperçu)");
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const [mapCenter, setMapCenter] = useState<{ lat: number; lon: number }>({
    lat: 48.8566,
    lon: 2.3522,
  });

  const mapSrc = useMemo(() => osmEmbedUrl(mapCenter.lat, mapCenter.lon), [mapCenter.lat, mapCenter.lon]);

  // ✅ items triés côté UI
  const sortedItems = useMemo(() => sortHomeListings(items), [items]);

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

  const withPhoto = sortedItems.filter((x) => !!x.cover_image_path).length;

  return (
    <main className="bl-container">
      <div className="bl-hero">
        <div className="bl-hero-title">
          <h1 className="bl-h1">Louez partout dans le monde. Publiez gratuitement. Réservez en toute sécurité.</h1>

          <div className="bl-hero-meta">
            {sortedItems.length} annonce{sortedItems.length > 1 ? "s" : ""} · {withPhoto} avec photo
          </div>
        </div>

        <div className="bl-hero-card">
          <div className="bl-hero-card-title">Réserve en toute simplicité, publie gratuitement</div>
          <div className="bl-hero-card-sub">
            {/* ✨ Premium Trust Badge (animation VISIBLE) */}
            <div
              className="bl-trust-premium"
              style={{
                marginTop: 16,
                borderRadius: 18,
                border: "1px solid rgba(47,107,255,.22)",
                background: "linear-gradient(135deg, rgba(255,255,255,.70), rgba(47,107,255,.06))",
                boxShadow: "0 14px 40px rgba(0,0,0,.06)",
                padding: 14,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                className="bl-trust-glow"
                style={{
                  position: "absolute",
                  inset: -60,
                  background:
                    "radial-gradient(circle at 20% 20%, rgba(47,107,255,.26), transparent 42%), radial-gradient(circle at 80% 30%, rgba(16,185,129,.20), transparent 44%), radial-gradient(circle at 60% 80%, rgba(59,130,246,.18), transparent 45%)",
                  filter: "blur(6px)",
                  opacity: 0.9,
                  pointerEvents: "none",
                }}
              />

              <div style={{ position: "relative" }}>
                <div
                  style={{
                    fontWeight: 950,
                    letterSpacing: -0.2,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ fontSize: 14 }}>Confiance & Sécurité</span>

                  <span
                    className="bl-trust-chip"
                    style={{
                      padding: "5px 10px",
                      borderRadius: 999,
                      border: "1px solid rgba(0,0,0,.10)",
                      background: "rgba(255,255,255,.70)",
                      fontWeight: 900,
                      fontSize: 12,
                      opacity: 0.9,
                    }}
                  >
                    vérifié
                  </span>
                </div>

                <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                  {[
                    { t: "🔒 Paiement sécurisé (Stripe)", hint: "Paiement traité via Stripe" },
                    { t: "💬 Messagerie interne", hint: "Conversation et preuves dans l’app" },
                    { t: "🧾 Commission transparente", hint: "Affichée avant validation" },
                    { t: "🇫🇷 Support local", hint: "Plateforme française" },
                  ].map((x) => (
                    <span
                      key={x.t}
                      title={x.hint}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 10px",
                        borderRadius: 999,
                        border: "1px solid rgba(0,0,0,.10)",
                        background: "rgba(255,255,255,.78)",
                        fontWeight: 900,
                        fontSize: 12,
                        opacity: 0.95,
                        backdropFilter: "blur(8px)",
                      }}
                    >
                      {x.t}
                    </span>
                  ))}
                </div>

                <div style={{ marginTop: 10, fontSize: 12, fontWeight: 800, opacity: 0.7 }}>
                  Astuce : privilégie les annonces avec photo + profil complet.
                </div>
              </div>

              <style jsx global>{`
                .bl-trust-premium {
                  animation: bl-trust-pulse 2.8s ease-in-out infinite;
                  transform-origin: center;
                }
                .bl-trust-glow {
                  background-size: 140% 140%;
                  animation: bl-glow-move 3.2s ease-in-out infinite;
                  will-change: transform, background-position, opacity;
                }
                .bl-trust-chip {
                  animation: bl-chip-breathe 2.2s ease-in-out infinite;
                }

                /* ✅ Premium card look (sans casser la grille) */
                .bl-card-premium {
                  position: relative;
                  overflow: hidden;
                }
                .bl-card-premium::before {
                  content: "";
                  position: absolute;
                  inset: -2px;
                  background: radial-gradient(circle at 20% 20%, rgba(245, 158, 11, 0.22), transparent 55%),
                    radial-gradient(circle at 80% 30%, rgba(59, 130, 246, 0.12), transparent 58%);
                  filter: blur(10px);
                  opacity: 0.9;
                  pointer-events: none;
                }
                .bl-card-premium > * {
                  position: relative;
                  z-index: 1;
                }

                @keyframes bl-trust-pulse {
                  0% {
                    transform: translateY(0) scale(1);
                  }
                  50% {
                    transform: translateY(-2px) scale(1.01);
                  }
                  100% {
                    transform: translateY(0) scale(1);
                  }
                }
                @keyframes bl-glow-move {
                  0% {
                    transform: translateY(0) rotate(0deg);
                    background-position: 0% 0%;
                    opacity: 0.85;
                  }
                  50% {
                    transform: translateY(-10px) rotate(1.5deg);
                    background-position: 100% 50%;
                    opacity: 1;
                  }
                  100% {
                    transform: translateY(0) rotate(0deg);
                    background-position: 0% 0%;
                    opacity: 0.85;
                  }
                }
                @keyframes bl-chip-breathe {
                  0% {
                    transform: scale(1);
                  }
                  50% {
                    transform: scale(1.04);
                  }
                  100% {
                    transform: scale(1);
                  }
                }
              `}</style>
            </div>
            Une plateforme de mise en relation avec messagerie interne et paiement sécurisé. La commission éventuelle est affichée avant
            validation de la réservation.
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
                <input className="bl-input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex : Paris" />
              </div>

              <div>
                <label className="bl-label">Arrivée</label>
                <input className="bl-input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>

              <div>
                <label className="bl-label">Départ</label>
                <input className="bl-input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>

              {/* Voyageurs */}
              <div>
                <label className="bl-label">Voyageurs</label>

                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    borderRadius: 12,
                    border: "1px solid rgba(0,0,0,0.12)",
                    overflow: "hidden",
                    background: "white",
                    height: 40,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setGuests((g) => Math.max(GUESTS_MIN, g - 1))}
                    disabled={guests <= GUESTS_MIN}
                    style={{
                      width: 40,
                      height: 40,
                      border: "none",
                      background: "transparent",
                      fontSize: 18,
                      fontWeight: 900,
                      cursor: "pointer",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    –
                  </button>

                  <div
                    style={{
                      width: 48,
                      textAlign: "center",
                      fontWeight: 900,
                      fontSize: 15,
                    }}
                  >
                    {guests}
                  </div>

                  <button
                    type="button"
                    onClick={() => setGuests((g) => Math.min(GUESTS_MAX, g + 1))}
                    disabled={guests >= GUESTS_MAX}
                    style={{
                      width: 40,
                      height: 40,
                      border: "none",
                      background: "transparent",
                      fontSize: 18,
                      fontWeight: 900,
                      cursor: "pointer",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    +
                  </button>
                </div>

                <div
                  style={{
                    marginTop: 4,
                    fontSize: 12,
                    fontWeight: 700,
                    opacity: 0.6,
                  }}
                >
                  Min {GUESTS_MIN} · Max {GUESTS_MAX}
                </div>
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

            <iframe title="Carte" src={mapSrc} style={{ width: "100%", height: 260, border: 0, display: "block" }} loading="lazy" />
          </div>
        </div>
      </div>

      {/* ✅ Bloc SEO (placé juste après le HERO) */}
      <section style={{ marginTop: 40 }}>
        <h2 style={{ fontWeight: 900 }}>Louer un logement en toute simplicité</h2>

        <p style={{ marginTop: 12, opacity: 0.9 }}>
          Booking-Light est une plateforme de location entre particuliers. Trouvez un appartement, une maison ou un studio pour une nuit,
          une semaine ou un mois. Réservation en ligne, paiement sécurisé, messagerie interne et commission transparente.
        </p>

        <p style={{ marginTop: 12, opacity: 0.9 }}>
          Publiez gratuitement votre annonce et recevez des réservations. Locations populaires : Paris, Marseille, Toulouse, Martinique et
          Guyane.
        </p>
<div
  style={{
    marginTop: 18,
    padding: "20px 22px",
    borderRadius: 20,
    border: "1px solid rgba(37, 99, 235, .35)",
    background: "linear-gradient(180deg, rgba(37, 99, 235, .18), rgba(37, 99, 235, .05))",
    boxShadow: "0 18px 45px rgba(37, 99, 235, .12)",
    backdropFilter: "blur(2px)",
  }}
>
  <h3
    style={{
      margin: 0,
      fontWeight: 900,
      color: "#1e40af",
      fontSize: 19,
    }}
  >
    Vous êtes propriétaire ? Publiez en toute confiance.
  </h3>

  <p style={{ marginTop: 12, opacity: 0.95, lineHeight: 1.6 }}>
    Louez votre appartement, maison ou studio en courte ou moyenne durée. 
    Créez votre annonce, ajoutez vos photos, fixez vos tarifs et gérez vos disponibilités simplement.
  </p>

  <ul style={{ marginTop: 12, paddingLeft: 18, lineHeight: 1.6 }}>
    <li>Messagerie intégrée pour échanger facilement avec les voyageurs</li>
    <li>Réservation structurée et commission transparente</li>
    <li>Plateforme conçue pour la France, l’Europe, l’Afrique et l’international</li>
  </ul>

  <p style={{ marginTop: 12, opacity: 0.9, lineHeight: 1.6 }}>
    Vous gardez le contrôle total sur votre calendrier, vos conditions et vos prix — 
    le tout avec une expérience moderne, claire et professionnelle.
  </p>

  <section style={{ marginTop: 36 }}>
  <div
    style={{
      padding: "20px 22px",
      borderRadius: 18,
      border: "1px solid rgba(0,0,0,.06)",
      background: "#ffffff",
      boxShadow: "0 8px 28px rgba(0,0,0,.04)",
    }}
  >
    <h3 style={{ margin: 0, fontWeight: 900 }}>
      Une plateforme pensée pour les propriétaires exigeants
    </h3>

    <p style={{ marginTop: 12, opacity: 0.9, lineHeight: 1.6 }}>
      Publication simple, gestion claire des réservations, visibilité internationale.
      Booking-Light a été conçu pour offrir une expérience moderne et structurée,
      adaptée aux propriétaires qui souhaitent louer efficacement.
    </p>

    <p style={{ marginTop: 10, opacity: 0.85 }}>
      Vous contrôlez votre calendrier, vos tarifs et vos conditions — sans complexité inutile.
    </p>
  </div>
</section>
<section style={{ marginTop: 30 }}>
  <h3 style={{ fontWeight: 900 }}>
    Pourquoi publier votre logement sur Booking-Light ?
  </h3>

  <ul style={{ marginTop: 14, paddingLeft: 20, lineHeight: 1.7 }}>
    <li>Visibilité en France, en Europe et à l’international</li>
    <li>Mise en avant Premium pour apparaître en priorité</li>
    <li>Processus de réservation structuré et transparent</li>
    <li>Messagerie intégrée pour dialoguer facilement</li>
    <li>Interface simple, rapide et moderne</li>
  </ul>
</section>
<section
  style={{
    marginTop: 30,
    padding: "18px 22px",
    borderRadius: 18,
    background: "linear-gradient(180deg, rgba(245,158,11,.15), rgba(255,255,255,1))",
    border: "1px solid rgba(245,158,11,.35)",
  }}
>
  <h3 style={{ margin: 0, fontWeight: 900 }}>
    Option Premium ✨
  </h3>

  <p style={{ marginTop: 10, lineHeight: 1.6 }}>
    Augmentez la visibilité de votre annonce en activant l’option Premium.
    Votre logement apparaît en priorité et bénéficie d’une mise en avant distinctive.
  </p>

  <p style={{ marginTop: 8, opacity: 0.85 }}>
    Idéal pour maximiser vos réservations lors des périodes clés.
  </p>
</section>
  </div>
        <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="bl-btn bl-btn-primary" href="/publish">
            Publier une annonce
          </Link>
          <Link className="bl-btn" href="/villes">
            Voir toutes les villes
          </Link>
        </div>
      </section>

      <section style={{ marginTop: 18 }}>
        {loading && <p>Chargement…</p>}

        {errorMsg && (
          <div className="bl-alert bl-alert-error">
            <strong>Erreur :</strong> {errorMsg}
          </div>
        )}

        {!loading && !errorMsg && sortedItems.length === 0 && <p>Aucune annonce pour le moment.</p>}

        {!loading && !errorMsg && sortedItems.length > 0 && (
         <div
          className="bl-grid"
          style={{
          overflow: "visible",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 18,
         }}
          >
            {sortedItems.map((l) => {
              const premium = isPremiumActive(l);
              const price = (l.price_cents / 100).toFixed(2).replace(".", ",");
              const img = l.cover_image_path ? publicListingImageUrl(l.cover_image_path) : null;

              const baseShadow = premium ? "0 18px 55px rgba(245, 158, 11, .22)" : "0 10px 24px rgba(0,0,0,.04)";
              const hoverShadow = premium ? "0 26px 80px rgba(245, 158, 11, .32)" : "0 22px 50px rgba(0,0,0,.12)";

              return (
                <Link
                  key={l.id}
                  href={`/listing/${l.id}`}
                  className={`bl-card ${premium ? "bl-card-premium" : ""}`}
                  style={{
                    transition: "transform .18s ease, box-shadow .18s ease, border-color .18s ease",
                    boxShadow: baseShadow,
                    border: premium ? "1px solid rgba(245, 158, 11, .50)" : undefined,
                    background: premium ? "linear-gradient(135deg, rgba(255,255,255,1), rgba(245,158,11,.06))" : undefined,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = hoverShadow;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = baseShadow;
                  }}
                >
                  <div className="bl-card-media" style={{ position: "relative", height: premium ? 260 : 190, overflow: "hidden" }}>
                    {/* ✅ Badge Premium */}
                    {premium && (
                      <div
                        style={{
                          position: "absolute",
                          left: 10,
                          top: 10,
                          zIndex: 5,
                          padding: "7px 12px",
                          borderRadius: 999,
                          fontWeight: 950,
                          fontSize: 12,
                          border: "1px solid rgba(0,0,0,.12)",
                          background: "rgba(255, 211, 77, .94)",
                          color: "rgba(0,0,0,.88)",
                          boxShadow: "0 12px 28px rgba(245,158,11,.35)",
                          letterSpacing: -0.2,
                        }}
                        title="Annonce Premium"
                      >
                        Premium ⭐
                      </div>
                    )}

                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img}
                        alt={l.title}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          transition: "transform .35s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "scale(1.05)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                      />
                    ) : (
                      <span>Pas d’image</span>
                    )}
                  </div>

                  <div className="bl-card-body" style={{ padding: premium ? 16 : undefined }}>
                    <div style={{ display: "flex", gap: 10, justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div className="bl-card-title" style={{ fontSize: premium ? 18 : undefined, fontWeight: premium ? 950 : undefined }}>
                        {l.title}
                      </div>

                      <div
                        style={{
                          flex: "0 0 auto",
                          alignSelf: "flex-start",
                          whiteSpace: "nowrap",
                          padding: premium ? "7px 12px" : "6px 10px",
                          borderRadius: 999,
                          fontWeight: premium ? 900 : 700,
                          fontSize: 13,
                          border: premium ? "1px solid rgba(245, 158, 11, .45)" : "1px solid rgba(11,18,32,.12)",
                          background: premium ? "rgba(245, 158, 11, .14)" : "rgba(47,107,255,.10)",
                        }}
                        title="Prix"
                      >
                        {price} € / {formatUnit(l.billing_unit)}
                      </div>
                    </div>

                    <div className="bl-card-meta" style={{ marginTop: 6 }}>
                      {l.city ?? "Ville ?"} · {l.kind ?? "Type ?"}
                    </div>
                    {l.rating_avg != null && l.rating_count != null && l.rating_count > 0 ? (
                    <div style={{ marginTop: 6, fontSize: 13, fontWeight: 800 }}>
                    ⭐ {Number(l.rating_avg).toFixed(1)} ({l.rating_count} avis)
                    </div>
                    ) : (
                    <div style={{ marginTop: 6, fontSize: 13, opacity: 0.55 }}>
                    Aucun avis
                    </div>
                    )}
                    {/* ✅ petit texte premium discret */}
                    {premium && (
                      <div style={{ marginTop: 8, fontSize: 12, fontWeight: 900, opacity: 0.75 }}>
                        Mise en avant Premium · meilleure visibilité
                      </div>
                    )}

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
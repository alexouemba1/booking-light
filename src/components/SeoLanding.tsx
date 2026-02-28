import Link from "next/link";
import type { ReactNode } from "react";
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
  if (u === "month") return "mois";
  return u;
}

async function getListings(cityName: string): Promise<ListingHome[]> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lightbooker.com";
  const cities =
    cityName === "Guyane"
      ? ["Cayenne", "Kourou", "Saint-Laurent-du-Maroni"]
      : [cityName];

  const all: ListingHome[] = [];

  for (const city of cities) {
    const url = new URL("/api/search", siteUrl);
    url.searchParams.set("city", city);
    url.searchParams.set("guests", "1");

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) continue;

    const json = await res.json();
    const items = json?.items ?? [];
    all.push(...items);
  }

  return all;
}

export default async function SeoLanding(props: {
  titleH1: string;
  intro: string;
  cityName: string;
  faq: { q: string; a: string }[];
  backHref?: string;
  backLabel?: string;
  children?: ReactNode; // ✅ AJOUT (optionnel)
}) {
  const {
    titleH1,
    intro,
    cityName,
    faq,
    backHref = "/",
    backLabel = "Accueil",
    children, // ✅ AJOUT
  } = props;

  const items = await getListings(cityName);

  const faqLdJson = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((x) => ({
      "@type": "Question",
      name: x.q,
      acceptedAnswer: { "@type": "Answer", text: x.a },
    })),
  };

  return (
    <main className="bl-container">
      <div className="bl-detail-top" style={{ flexWrap: "wrap" }}>
        <Link className="bl-link" href={backHref}>
          ← {backLabel}
        </Link>
        <Link className="bl-link" href="/villes">
          Toutes les villes
        </Link>
      </div>

      <h1 className="bl-h1" style={{ marginTop: 12 }}>
        {titleH1}
      </h1>

      <p style={{ marginTop: 10, opacity: 0.85, fontWeight: 650 }}>{intro}</p>

      <section style={{ marginTop: 22 }}>
        <h2 style={{ fontWeight: 900 }}>Questions fréquentes</h2>
        <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
          {faq.map((x, i) => (
            <div key={i} className="bl-card" style={{ padding: 14 }}>
              <div style={{ fontWeight: 900 }}>{x.q}</div>
              <div style={{ marginTop: 6, opacity: 0.9 }}>{x.a}</div>
            </div>
          ))}
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLdJson) }} />

      <section style={{ marginTop: 22 }}>
        <h2 style={{ fontWeight: 900 }}>Annonces disponibles à {cityName}</h2>

        {items.length === 0 && (
          <p style={{ marginTop: 10, opacity: 0.85, fontWeight: 700 }}>
            Aucune annonce pour le moment. Revenez bientôt !
          </p>
        )}

        {items.length > 0 && (
          <div
  style={{
    marginTop: 12,
    display: "grid",
    gap: 16,
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    alignItems: "start",
  }}
>
  {items.map((l) => {
    const price = (l.price_cents / 100).toFixed(2).replace(".", ",");
    const img = l.cover_image_path ? publicListingImageUrl(l.cover_image_path) : null;

   return (
  <div key={l.id} style={{ maxWidth: 420 }}>
    <Link href={`/listing/${l.id}`} className="bl-card">
      <div className="bl-card-media" style={{ height: 180, overflow: "hidden" }}>
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={l.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
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
              fontWeight: 800,
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
          {l.city ?? cityName} · {l.kind ?? "Type ?"}
        </div>

        <div className="bl-card-cta" style={{ marginTop: 8 }}>
          Voir détails & réserver →
        </div>
      </div>
    </Link>
  </div>
);
  })}
</div>
        )}
      </section>

      {/* ✅ AJOUT : contenu SEO optionnel (ne s’affiche que si tu le passes) */}
      {children && <section style={{ marginTop: 40 }}>{children}</section>}
    </main>
  );
}
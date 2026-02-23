// FILE: src/app/layout.tsx
import "./globals.css";
import "./styles/zoom.css";

import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Script from "next/script";
import TopbarClient from "@/components/TopbarClient";

// ✅ On évite localhost en prod si jamais l'ENV n'est pas set
const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.trim()) ||
  (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.trim()) ||
  "https://lightbooker.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Booking-Light",
    template: "%s · Booking-Light",
  },
  description:
    "Booking-Light — location d’appartements et maisons en France (et Outre-mer). Publiez une annonce gratuitement, réservez en ligne avec paiement sécurisé et messagerie interne.",
  applicationName: "Booking-Light",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.ico",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Booking-Light",
    title: "Booking-Light",
    description:
      "Publiez une annonce gratuitement, gérez vos réservations et échangez via la messagerie interne. Paiement sécurisé.",
    images: [
      {
        url: "/android-chrome-512x512.png",
        width: 512,
        height: 512,
        alt: "Booking-Light",
      },
    ],
    locale: "fr_FR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Booking-Light",
    description:
      "Publiez une annonce gratuitement, gérez vos réservations et échangez via la messagerie interne. Paiement sécurisé.",
    images: ["/android-chrome-512x512.png"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="bl-body">
        <TopbarClient />

        <div className="bl-page">{children}</div>

        {/* ✅ Scripts analytics (placés dans <body> pour éviter les soucis d'hydration / insertBefore) */}
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-9TRP7B6V1M"
          strategy="afterInteractive"
        />
        <Script id="ga4" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-9TRP7B6V1M');
          `}
        </Script>

        {/* ✅ Microsoft Clarity (version stable: pas de snippet insertBefore) */}
        <Script
          id="ms-clarity"
          strategy="afterInteractive"
          src="https://www.clarity.ms/tag/vhs2k0057g"
        />

        <footer className="bl-footer">
          <div className="bl-footer-inner">
            <div className="bl-footer-left">
              <div className="bl-footer-brand">Booking-Light</div>

              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  alignItems: "center",
                  fontSize: 12,
                  fontWeight: 800,
                  color: "rgba(0,0,0,0.65)",
                  lineHeight: 1.4,
                }}
              >
                <span>🔒 Paiement sécurisé</span>
                <span>💬 Messagerie interne</span>
                <span>✔️ Réservations vérifiées</span>
              </div>
            </div>

            <nav className="bl-footer-nav" aria-label="Footer">
              <Link className="bl-footer-link" href="/about">
                À propos
              </Link>
              <Link className="bl-footer-link" href="/about">
                Comment ça marche ?
              </Link>
              <Link className="bl-footer-link" href="/contact">
                Contact
              </Link>
              <Link className="bl-footer-link" href="/terms">
                CGU
              </Link>
              <Link className="bl-footer-link" href="/cgv">
                CGV
              </Link>
              <Link className="bl-footer-link" href="/privacy">
                Confidentialité
              </Link>
            </nav>
          </div>

          {/* 🔽 Footer bottom avec WhatsApp */}
          <div className="bl-footer-bottom">
            <div className="bl-footer-inner bl-footer-bottom-inner">
              <div>© {new Date().getFullYear()} Booking-Light</div>

              <div
                className="bl-footer-muted"
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 16,
                  alignItems: "center",
                  lineHeight: 1.4,
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  Support :
                  <a className="bl-footer-link" href="mailto:booking@lightbooker.com">
                    booking@lightbooker.com
                  </a>
                </span>

                {/* ✅ Bouton WhatsApp */}
                <a
                  href="https://wa.me/33777399242"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Contacter sur WhatsApp"
                  className="bl-whatsapp-btn"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 32 32"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      fill="#25D366"
                      d="M16 3C9.383 3 4 8.383 4 15c0 2.676.902 5.17 2.414 7.176L5 29l7.01-1.395A11.93 11.93 0 0 0 16 27c6.617 0 12-5.383 12-12S22.617 3 16 3z"
                    />
                    <path
                      fill="#fff"
                      d="M13.82 9.83c-.24-.54-.49-.56-.72-.57h-.62c-.22 0-.57.08-.87.4-.3.32-1.15 1.12-1.15 2.74 0 1.62 1.18 3.18 1.34 3.4.16.22 2.28 3.65 5.63 4.97 2.78 1.1 3.35.88 3.95.82.6-.06 1.93-.79 2.2-1.55.27-.76.27-1.42.19-1.55-.08-.13-.3-.21-.63-.38-.33-.17-1.93-.95-2.23-1.06-.3-.11-.52-.17-.74.17-.22.34-.85 1.06-1.04 1.28-.19.22-.38.25-.71.08-.33-.17-1.39-.51-2.65-1.62-.98-.87-1.64-1.94-1.83-2.27-.19-.33-.02-.51.15-.68.15-.15.33-.38.49-.57.16-.19.21-.33.32-.55.11-.22.06-.42-.02-.59-.08-.17-.7-1.72-.96-2.27z"
                    />
                  </svg>

                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
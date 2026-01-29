// FILE: src/app/layout.tsx
import "./globals.css";
import "./styles/zoom.css";

import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Script from "next/script";
import TopbarClient from "@/components/TopbarClient";

const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.trim()) ||
  (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.trim()) ||
  "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Booking-Light",
    template: "%s · Booking-Light",
  },
  description:
    "Booking-Light — publiez une annonce gratuitement, gérez vos réservations et échangez via la messagerie interne.",
  applicationName: "Booking-Light",
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
      "Publiez une annonce gratuitement, gérez vos réservations et échangez via la messagerie interne.",
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
      "Publiez une annonce gratuitement, gérez vos réservations et échangez via la messagerie interne.",
    images: ["/android-chrome-512x512.png"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
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
      </head>

      <body className="bl-body">
        <TopbarClient />

        <div className="bl-page">{children}</div>

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

                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <a
                    className="bl-footer-link"
                    href="https://wa.me/33777399242"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    💬 WhatsApp : +33 7 77 39 92 42
                  </a>
                </span>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
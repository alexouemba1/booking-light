// FILE: src/app/layout.tsx
import "./globals.css";
import "./styles/zoom.css";

import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import TopbarClient from "@/components/TopbarClient";

const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.trim()) ||
  (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.trim()) ||
  "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "Booking Light",
    template: "%s · Booking Light",
  },

  description:
    "Booking Light — publiez une annonce, gérez vos réservations et échangez via la messagerie interne.",

  applicationName: "Booking Light",

  icons: {
    // ✅ On met PNG + ICO (fallback). Certains navigateurs/robots aiment le .ico.
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.ico" }, // fallback
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.ico",
  },

  manifest: "/site.webmanifest",

  openGraph: {
    type: "website",
    url: "/",
    siteName: "Booking Light",
    title: "Booking Light",
    description:
      "Publiez une annonce, gérez vos réservations et échangez via la messagerie interne.",
    images: [
      {
        url: "/android-chrome-512x512.png",
        width: 512,
        height: 512,
        alt: "Booking Light",
      },
    ],
    locale: "fr_FR",
  },

  twitter: {
    card: "summary_large_image",
    title: "Booking Light",
    description:
      "Publiez une annonce, gérez vos réservations et échangez via la messagerie interne.",
    images: ["/android-chrome-512x512.png"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="bl-body">
        <TopbarClient />

        <div className="bl-page">{children}</div>

        <footer className="bl-footer">
          <div className="bl-footer-inner">
            <div className="bl-footer-left">
              <div className="bl-footer-brand">Booking Light</div>

              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  fontSize: 12,
                  fontWeight: 800,
                  color: "rgba(0,0,0,0.65)",
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
              <Link className="bl-footer-link" href="/contact">
                Contact
              </Link>
              <Link className="bl-footer-link" href="/terms">
                Conditions générales
              </Link>
              <Link className="bl-footer-link" href="/privacy">
                Confidentialité
              </Link>
            </nav>
          </div>

          <div className="bl-footer-bottom">
            <div className="bl-footer-inner bl-footer-bottom-inner">
              <div>© {new Date().getFullYear()} Booking Light</div>
              <div className="bl-footer-muted">
                Support :{" "}
                <a className="bl-footer-link" href="mailto:contact@bookinglight.com">
                  contact@bookinglight.com
                </a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

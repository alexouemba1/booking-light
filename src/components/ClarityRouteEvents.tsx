// FILE: src/components/ClarityRouteEvents.tsx
"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { clarityEvent } from "@/lib/clarity";

/**
 * Déclenche automatiquement des events Clarity en fonction de l’URL,
 * sans devoir “trouver le bon endroit” dans le code métier.
 *
 * Par défaut, on déclenche reservation_validated si :
 * - le chemin contient un mot-clé "success/confirmation/merci/thank-you" etc.
 * - OU si l’URL contient ?success=1 / ?status=success / ?payment=success
 */
export default function ClarityRouteEvents() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Pour éviter de déclencher 2 fois sur la même URL (navigation, refresh)
  const lastFiredRef = useRef<string | null>(null);

  useEffect(() => {
    const qs = searchParams?.toString() ?? "";
    const urlKey = `${pathname}?${qs}`;

    if (lastFiredRef.current === urlKey) return;

    const p = (pathname || "").toLowerCase();

    // ✅ Mots-clés de pages "succès" (tu peux en ajouter si tu veux)
    const successPathKeywords = [
      "success",
      "confirmation",
      "confirm",
      "thank-you",
      "thanks",
      "merci",
      "paiement-reussi",
      "payment-success",
    ];

    const isSuccessPath = successPathKeywords.some((k) => p.includes(k));

    // ✅ Paramètres de succès (utile si Stripe renvoie des query params)
    const successParam =
      (searchParams?.get("success") ?? "").toLowerCase() ||
      (searchParams?.get("status") ?? "").toLowerCase() ||
      (searchParams?.get("payment") ?? "").toLowerCase();

    const isSuccessParam =
      successParam === "1" || successParam === "true" || successParam === "success" || successParam === "paid";

    if (isSuccessPath || isSuccessParam) {
      lastFiredRef.current = urlKey;

      clarityEvent("reservation_validated", {
        conversion: 1,
        success_url: urlKey,
      });
    }
  }, [pathname, searchParams]);

  return null;
}
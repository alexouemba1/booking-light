import { Suspense } from "react";
import MyBookingsClient from "./MyBookingsClient";

export const dynamic = "force-dynamic";
// Optionnel mais utile si tu veux être sûr de ne jamais avoir du cache:
export const revalidate = 0;

export default function Page() {
  return (
    <Suspense fallback={<main className="bl-container">Chargement…</main>}>
      <MyBookingsClient />
    </Suspense>
  );
}

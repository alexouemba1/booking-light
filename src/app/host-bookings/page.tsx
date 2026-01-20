// FILE: src/app/host-bookings/page.tsx
import { Suspense } from "react";
import HostBookingsClient from "./HostBookingsClient";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="bl-container">
          <h1>Réservations reçues</h1>
          <p>Chargement…</p>
        </main>
      }
    >
      <HostBookingsClient />
    </Suspense>
  );
}

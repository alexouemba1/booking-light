import { Suspense } from "react";
import PaymentsClient from "./PaymentsClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="bl-container">
          <h1>Paiements</h1>
          <p>Chargement…</p>
        </main>
      }
    >
      <PaymentsClient />
    </Suspense>
  );
}

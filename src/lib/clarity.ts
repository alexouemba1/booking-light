// FILE: src/lib/clarity.ts
declare global {
  interface Window {
    clarity?: (...args: any[]) => void;
  }
}

export function clarityEvent(name: string, data?: Record<string, string | number | boolean>) {
  try {
    if (typeof window === "undefined") return;
    const c = window.clarity;
    if (typeof c !== "function") return;

    if (data) {
      for (const [k, v] of Object.entries(data)) {
        c("set", k, String(v));
      }
    }

    c("event", name);
  } catch {
    // on ignore : jamais de crash user-side pour un outil analytics
  }
}
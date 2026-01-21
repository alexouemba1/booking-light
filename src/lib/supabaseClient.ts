import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Objectif:
 * - Ne PAS casser le build/SSR si les env vars ne sont pas disponibles au moment du prerender.
 * - Être strict côté navigateur (si tu ouvres le site sans env vars, on veut une erreur claire).
 */
function createSafeSupabaseClient(): SupabaseClient {
  // Si on est côté navigateur, on exige les variables.
  if (typeof window !== "undefined") {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        "Supabase env vars missing. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
    }
    return createClient(supabaseUrl, supabaseAnonKey);
  }

  // Côté serveur/build: on évite de crasher si env vars absentes.
  // On crée un client "placeholder" pour ne pas faire tomber l'import.
  // Important: ne pas exécuter de requêtes Supabase en build/prerender.
  return createClient(supabaseUrl ?? "http://localhost:54321", supabaseAnonKey ?? "public-anon-key");
}

export const supabase = createSafeSupabaseClient();

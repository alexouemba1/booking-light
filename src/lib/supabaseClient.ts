import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ✅ Sécurité build / prerender
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[supabaseClient] Variables manquantes. Client non initialisé (build/prerender)."
  );
}

// ⚠️ On crée le client seulement si les variables existent
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// FILE: src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * On ne retourne JAMAIS null.
 * Si les variables d'env ne sont pas définies, c'est une configuration invalide.
 * En production, tu dois les définir dans Vercel.
 */
if (!supabaseUrl || !supabaseAnonKey) {
  // On garde un log explicite (utile en preview/prod)
  // et on stoppe net (sinon tu découvres le problème 40 fichiers plus loin…)
  throw new Error(
    "[supabaseClient] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY manquantes. " +
      "Configure-les dans .env.local et dans Vercel (Project Settings → Environment Variables)."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

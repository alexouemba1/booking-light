// src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ⚠️ IMPORTANT :
// - Ce fichier est utilisé uniquement côté client ("use client")
// - Les variables NEXT_PUBLIC_* existent toujours côté navigateur sur Vercel
// - On NE met PAS de fallback null (ça casse le prerender)

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

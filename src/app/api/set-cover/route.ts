import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!url || !anon || !service) {
      return NextResponse.json(
        { error: "Config Supabase manquante (.env.local)" },
        { status: 500 }
      );
    }

    // 1) Vérifier que l'appel vient d'un user connecté
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const anonClient = createClient(url, anon);
    const { data: userData, error: userErr } = await anonClient.auth.getUser(token);

    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Session invalide" }, { status: 401 });
    }

    const userId = userData.user.id;

    // 2) Lire la requête
    const body = await req.json();
    const listingId = body?.listingId as string | undefined;
    const path = body?.path as string | undefined;

    if (!listingId || !path) {
      return NextResponse.json({ error: "listingId et path requis" }, { status: 400 });
    }

    // 3) Client service-role (droits admin)
    const admin = createClient(url, service);

    // 4) Sécurité : vérifier propriétaire
    const { data: listing, error: lErr } = await admin
      .from("listings")
      .select("id,user_id")
      .eq("id", listingId)
      .single();

    if (lErr || !listing) {
      return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
    }

    if (listing.user_id !== userId) {
      return NextResponse.json({ error: "Interdit" }, { status: 403 });
    }

    // 5) Update cover
    const { error: uErr } = await admin
      .from("listings")
      .update({ cover_image_path: path })
      .eq("id", listingId);

    if (uErr) {
      return NextResponse.json({ error: uErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Erreur serveur" }, { status: 500 });
  }
}

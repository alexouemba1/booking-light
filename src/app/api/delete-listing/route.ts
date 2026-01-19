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

    // 1) Vérifier utilisateur connecté via token
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

    // 2) Lire payload
    const body = await req.json();
    const listingId = body?.listingId as string | undefined;

    if (!listingId) {
      return NextResponse.json({ error: "listingId requis" }, { status: 400 });
    }

    // 3) Client admin (service role)
    const admin = createClient(url, service);

    // 4) Vérifier propriétaire
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

    // 5) Récupérer les paths des images
    const { data: imgs, error: imgErr } = await admin
      .from("listing_images")
      .select("path")
      .eq("listing_id", listingId);

    if (imgErr) {
      return NextResponse.json({ error: imgErr.message }, { status: 400 });
    }

    const paths = (imgs || []).map((x: any) => x.path).filter(Boolean);

    // 6) Supprimer les fichiers Storage (si présents)
    if (paths.length > 0) {
      const { error: rmErr } = await admin.storage
        .from("listing-images")
        .remove(paths);

      if (rmErr) {
        return NextResponse.json({ error: rmErr.message }, { status: 400 });
      }
    }

    // 7) Supprimer les lignes listing_images
    const { error: delImgsErr } = await admin
      .from("listing_images")
      .delete()
      .eq("listing_id", listingId);

    if (delImgsErr) {
      return NextResponse.json({ error: delImgsErr.message }, { status: 400 });
    }

    // 8) Supprimer l’annonce
    const { error: delListingErr } = await admin
      .from("listings")
      .delete()
      .eq("id", listingId);

    if (delListingErr) {
      return NextResponse.json({ error: delListingErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, removedFiles: paths.length });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Erreur serveur" },
      { status: 500 }
    );
  }
}

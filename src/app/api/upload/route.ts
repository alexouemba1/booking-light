import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, service);
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const listingId = String(form.get("listingId") || "");
    const file = form.get("file") as File | null;
    const positionRaw = String(form.get("position") || "0");
    const position = Number(positionRaw);

    if (!listingId) {
      return NextResponse.json({ error: "listingId manquant" }, { status: 400 });
    }
    if (!file) {
      return NextResponse.json({ error: "file manquant" }, { status: 400 });
    }

    const supabase = getServerSupabase();

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeExt = ext.replace(/[^a-z0-9]/g, "");
    const path = `${listingId}/${crypto.randomUUID()}.${safeExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // 1) Upload Storage
    const { error: upErr } = await supabase.storage
      .from("listing-images")
      .upload(path, bytes, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 400 });
    }

    // 2) Insert en base
    const { error: dbErr } = await supabase.from("listing_images").insert({
      listing_id: listingId,
      path,
      position: Number.isFinite(position) ? position : 0,
    });

    if (dbErr) {
      return NextResponse.json({ error: dbErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, path });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Erreur serveur" },
      { status: 500 }
    );
  }
}

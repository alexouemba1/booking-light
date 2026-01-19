// FILE: src/app/api/host/listings/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/host/listings
 * - Crée une annonce (listing) pour l'utilisateur authentifié (Bearer token)
 * - Tente d'envoyer un email de confirmation via Resend
 * - Ne bloque PAS la création si l'email échoue : renvoie un warning
 *
 * ENV attendues:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - RESEND_API_KEY
 * - EMAIL_FROM (ex: "Booking Light <no-reply@bookinglight.com>")
 * - NEXT_PUBLIC_SITE_URL (ex: "https://bookinglight.com" ou "http://localhost:3000")
 */

function j(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function getBearerToken(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m?.[1] ?? null;
}

function isNonEmptyString(v: any) {
  return typeof v === "string" && v.trim().length > 0;
}

function toInt(v: any, fallback = 0) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.trunc(n);
}

function escapeHtml(s: string) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeSiteUrl(raw: string | undefined) {
  const base = raw && raw.trim() ? raw.trim() : "http://localhost:3000";
  return base.replace(/\/$/, "");
}

function envMissing(names: string[]) {
  const missing = names.filter((n) => !process.env[n] || !String(process.env[n]).trim());
  return missing.length ? missing : null;
}

async function sendEmailResend(args: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  idempotencyKey?: string;
}) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const EMAIL_FROM = process.env.EMAIL_FROM;

  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY manquant. Configure l'envoi d'email côté serveur.");
  }
  if (!EMAIL_FROM) {
    throw new Error("EMAIL_FROM manquant (ex: Booking Light <no-reply@domaine.com>).");
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${RESEND_API_KEY}`,
    "Content-Type": "application/json",
  };

  // Idempotence (anti double-envoi en cas de retry)
  // Resend supporte un header Idempotency-Key (si non supporté, il est ignoré côté serveur)
  if (args.idempotencyKey) headers["Idempotency-Key"] = args.idempotencyKey;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers,
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
    }),
  });

  const raw = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(raw);
  } catch {
    // ignore
  }

  if (!res.ok) {
    const msg = json?.message || json?.error || raw || "Erreur email (Resend).";
    throw new Error(msg);
  }

  return json;
}

export async function POST(req: Request) {
  try {
    // 0) ENV Supabase (bloquant)
    const missingSupabase = envMissing(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
    if (missingSupabase) {
      return j({ error: `Config serveur manquante: ${missingSupabase.join(", ")}.` }, 500);
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // 1) Auth
    const token = getBearerToken(req);
    if (!token) return j({ error: "Non authentifié." }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) return j({ error: "Token invalide." }, 401);

    const uid = userData.user.id;
    const userEmail = userData.user.email || null;

    // 2) Body
    const body = await req.json();

    const title = isNonEmptyString(body?.title) ? String(body.title).trim() : "";
    const city = isNonEmptyString(body?.city) ? String(body.city).trim() : "";
    const kind = isNonEmptyString(body?.kind) ? String(body.kind).trim() : "";
    const billing_unit = isNonEmptyString(body?.billing_unit)
      ? String(body.billing_unit).trim()
      : "night";
    const price_cents = toInt(body?.price_cents, 0);

    const cover_image_path = isNonEmptyString(body?.cover_image_path)
      ? String(body.cover_image_path).trim()
      : null;

    if (!title) return j({ error: "Titre requis." }, 400);
    if (title.length > 120) return j({ error: "Titre trop long (max 120 caractères)." }, 400);

    if (!city) return j({ error: "Ville requise." }, 400);
    if (city.length > 80) return j({ error: "Ville trop longue (max 80 caractères)." }, 400);

    if (!kind) return j({ error: "Type requis." }, 400);
    if (kind.length > 60) return j({ error: "Type trop long." }, 400);

    if (!["night", "day", "week"].includes(billing_unit)) {
      return j({ error: "billing_unit invalide (night/day/week)." }, 400);
    }
    if (!Number.isFinite(price_cents) || price_cents <= 0) {
      return j({ error: "price_cents invalide (doit être > 0)." }, 400);
    }

    // 3) Insert listing
    const { data: created, error: insErr } = await admin
      .from("listings")
      .insert({
        user_id: uid,
        title,
        city,
        kind,
        price_cents,
        billing_unit,
        cover_image_path,
      })
      .select("id, user_id, title, city, kind, price_cents, billing_unit, cover_image_path")
      .single();

    if (insErr) return j({ error: insErr.message }, 400);

    // 4) Email (non bloquant)
    const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
    const listingUrl = `${SITE_URL}/listing/${encodeURIComponent(created.id)}`;
    const logoUrl = `${SITE_URL}/logo-booking-light.png`;

    let emailWarning: string | null = null;
    let emailAttempted = false;

    const isDev = process.env.NODE_ENV !== "production";

    if (userEmail) {
      emailAttempted = true;

      try {
        const missingEmail = envMissing(["RESEND_API_KEY", "EMAIL_FROM"]);
        if (missingEmail) {
          emailWarning = `${missingEmail.join(", ")} manquant. Configure l'envoi d'email côté serveur.`;
        } else {
          const subject = "Votre annonce est publiée sur Booking Light";

          const safeTitle = escapeHtml(created.title);
          const safeUrl = escapeHtml(listingUrl);
          const safeLogoUrl = escapeHtml(logoUrl);

          const html = `
            <div style="background:#f6f7fb;padding:22px 0;">
              <div style="max-width:640px;margin:0 auto;padding:0 14px;">
                <div style="background:#ffffff;border:1px solid #ececec;border-radius:16px;overflow:hidden;">
                  <div style="padding:18px 18px 8px 18px;">
                    <div style="display:flex;align-items:center;gap:12px;">
                      <img
                        src="${safeLogoUrl}"
                        alt="Booking Light"
                        width="140"
                        style="display:block;height:auto;max-width:140px;"
                      />
                      <div style="font-family:Arial,sans-serif;color:#111;font-weight:800;font-size:14px;line-height:1.2;">
                        Booking Light
                      </div>
                    </div>
                  </div>

                  <div style="padding:8px 18px 18px 18px;font-family:Arial,sans-serif;color:#111;line-height:1.55;">
                    <h2 style="margin:8px 0 10px 0;font-size:20px;letter-spacing:-0.2px;">
                      Annonce publiée
                    </h2>

                    <p style="margin:0 0 10px 0;">
                      Votre annonce <strong>${safeTitle}</strong> est bien enregistrée.
                    </p>

                    <div style="margin:14px 0 16px 0;">
                      <a
                        href="${safeUrl}"
                        target="_blank"
                        rel="noreferrer"
                        style="display:inline-block;background:#111;color:#fff;text-decoration:none;border-radius:10px;padding:12px 16px;font-weight:800;font-size:14px;"
                      >
                        Voir mon annonce
                      </a>
                    </div>

                    <p style="margin:0 0 10px 0;color:#444;">
                      Si le bouton ne s’affiche pas, utilisez ce lien :
                      <br/>
                      <a href="${safeUrl}" target="_blank" rel="noreferrer" style="color:#111;">
                        ${safeUrl}
                      </a>
                    </p>

                    <p style="margin:0;color:#666;font-size:13px;">
                      Vous pouvez modifier votre annonce à tout moment depuis votre espace.
                    </p>
                  </div>

                  <div style="border-top:1px solid #f0f0f0;padding:12px 18px;font-family:Arial,sans-serif;color:#777;font-size:12px;line-height:1.4;">
                    <div>Booking Light — Paiement sécurisé · Messagerie interne · Réservation traçable</div>
                    <div style="margin-top:6px;">Support : contact@bookinglight.com</div>
                  </div>
                </div>

                <div style="max-width:640px;margin:10px auto 0 auto;padding:0 14px;font-family:Arial,sans-serif;color:#9a9a9a;font-size:11px;line-height:1.4;">
                  <div>Si vous n’êtes pas à l’origine de cette action, vous pouvez ignorer cet email.</div>
                </div>
              </div>
            </div>
          `.trim();

          const text =
            `Annonce publiée\n\n` +
            `Votre annonce "${created.title}" est bien enregistrée.\n` +
            `Voir l’annonce: ${listingUrl}\n\n` +
            `Vous pouvez modifier votre annonce à tout moment depuis votre espace.\n\n` +
            `Support: contact@bookinglight.com`;

          const idempotencyKey = `listing-created:${created.id}:${userEmail}`;

          await sendEmailResend({
            to: userEmail,
            subject,
            html,
            text,
            idempotencyKey,
          });

          if (isDev) {
            // eslint-disable-next-line no-console
            console.log("[host/listings] email sent to:", userEmail, "listing:", created.id);
          }
        }
      } catch {
        // ✅ On ne renvoie plus le message Resend brut (anglais) à l'UI.
        // On affiche un message français propre.
        emailWarning = "Email non envoyé (mode test). L’envoi sera actif après validation du domaine.";

        if (isDev) {
          // eslint-disable-next-line no-console
          console.warn("[host/listings] email warning:", emailWarning);
        }
      }
    } else {
      emailAttempted = false;
      emailWarning = "Email utilisateur introuvable (Supabase Auth).";
    }

    return j(
      {
        ok: true,
        listing: created,
        email: {
          attempted: emailAttempted,
          warning: emailWarning,
        },
      },
      200
    );
  } catch (e: any) {
    return j({ error: e?.message ?? "Erreur serveur." }, 500);
  }
}

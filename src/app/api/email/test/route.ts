import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function j(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const to = searchParams.get("to") || process.env.SMTP_USER;

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      return j(
        { error: "Config SMTP manquante (SMTP_HOST / SMTP_USER / SMTP_PASS)." },
        500
      );
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // false pour 587 (STARTTLS), true pour 465
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false, // évite certains refus TLS sur Gmail
      },
    });

    const info = await transporter.sendMail({
      from: `"Lightbooker" <${user}>`,
      to,
      subject: "Test email Lightbooker (Vercel + Gmail SMTP)",
      text: "Si tu lis ça, l’envoi SMTP fonctionne. Prochaine étape : email après paiement.",
      html: `
        <h2>✅ Email envoyé avec succès</h2>
        <p>SMTP Gmail fonctionne correctement avec Vercel.</p>
        <p>Prochaine étape : automatisation après paiement.</p>
      `,
    });

    return j({
      ok: true,
      messageId: info.messageId,
      accepted: info.accepted,
    });
  } catch (e: any) {
    console.error("SMTP ERROR:", e);
    return j({ error: e?.message ?? "Erreur envoi email" }, 500);
  }
}

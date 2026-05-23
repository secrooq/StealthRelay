import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { getDb, getRequestContext, getEnv } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { checkRateLimit, incrementRateLimit } from "@/lib/rateLimit";

export const runtime = "edge";

async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = getEnv("TURNSTILE_SECRET_KEY") || "1x00000000000000000000000000000000AA";
  if (secret.startsWith("1x")) {
    return true;
  }
  const formData = new FormData();
  formData.append("secret", secret);
  formData.append("response", token);
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
    });
    const outcome: any = await res.json();
    return !!outcome.success;
  } catch (e) {
    logger.error("[TURNSTILE EXCEPTION]", e);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const { email, turnstileToken } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Identity email is required." }, { status: 400 });
    }

    if (!turnstileToken) {
      return NextResponse.json({ error: "Security validation token is missing." }, { status: 400 });
    }

    const isRobotPassed = await verifyTurnstile(turnstileToken);
    if (!isRobotPassed) {
      return NextResponse.json({ error: "Failed anti-spam validation. Operation aborted." }, { status: 403 });
    }

    const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "127.0.0.1";
    const allowed = await checkRateLimit(ip, "magic_link", 3, 10); // 3 requests per 10 minutes
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }
    await incrementRateLimit(ip, "magic_link");

    const cleanEmail = email.trim().toLowerCase();
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins expiry
    const db = getDb();
    
    // Persist link token
    const id = crypto.randomUUID();
    await db.prepare(`
      INSERT INTO magic_links (id, email, token, expires_at, is_used)
      VALUES (?, ?, ?, ?, 0)
    `).bind(id, cleanEmail, token, expiresAt).run();

    // Determine host origin dynamically
    const origin = req.headers.get("origin") || "https://stealthrelay.com";
    const magicLink = `${origin}/api/auth/magic/callback?email=${encodeURIComponent(cleanEmail)}&token=${token}`;

    // Get Brevo API Key
    const brevoApiKey = getEnv("BREVO_API_KEY");

    if (!brevoApiKey) {
      logger.error("BREVO_API_KEY missing from Edge Context.");
      return NextResponse.json({ error: "SMTP delivery network offline." }, { status: 500 });
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>StealthRelay - Passwordless Entry</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #070908;
            color: #ffffff;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 550px;
            margin: 40px auto;
            background-color: #0b0d0c;
            border: 1px solid rgba(0, 255, 102, 0.15);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 15px 35px rgba(0, 255, 102, 0.05);
          }
          .header {
            background-color: #020302;
            padding: 25px;
            text-align: center;
            border-bottom: 1px solid rgba(0, 255, 102, 0.1);
          }
          .logo {
            font-family: monospace;
            font-size: 20px;
            font-weight: 900;
            letter-spacing: 0.25em;
            color: #00ff66;
            text-transform: uppercase;
            text-decoration: none;
          }
          .content {
            padding: 40px;
          }
          h1 {
            font-size: 20px;
            font-weight: 800;
            margin-top: 0;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #ffffff;
          }
          p {
            font-size: 14px;
            line-height: 1.6;
            color: #94a3b8;
            margin-bottom: 24px;
          }
          .btn-container {
            text-align: center;
            margin: 35px 0;
          }
          .btn {
            background-color: #00ff66;
            color: #000000 !important;
            font-weight: 900;
            font-size: 13px;
            text-decoration: none;
            padding: 14px 30px;
            border-radius: 8px;
            display: inline-block;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            box-shadow: 0 0 20px rgba(0, 255, 102, 0.25);
          }
          .footer {
            padding: 25px;
            text-align: center;
            font-size: 11px;
            color: #475569;
            background-color: #020302;
            border-top: 1px solid rgba(0, 255, 102, 0.05);
          }
          .footer a {
            color: #00ff66;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <a href="https://stealthrelay.com" class="logo">StealthRelay</a>
          </div>
          <div class="content">
            <h1>Passwordless Link Generated</h1>
            <p>You requested a secure, passwordless magic link to access your StealthRelay operative dashboard.</p>
            <p>This single-use security token is armored for 15 minutes. Click the button below to establish a secure link instantly:</p>
            <div class="btn-container">
              <a href="${magicLink}" class="btn">Establish Secure Link</a>
            </div>
            <p style="font-size: 12px; color: #475569;">If you did not request this link, you can safely disregard this transmission.</p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} StealthRelay. Zero-Knowledge Cryptography.
          </div>
        </div>
      </body>
      </html>
    `;

    const dispatched = await sendEmail({
      to: cleanEmail,
      subject: "🔑 Secure Entry Protocol - StealthRelay",
      htmlContent,
      brevoApiKey
    });

    if (!dispatched) {
      return NextResponse.json({ error: "Failed to dispatch magic transmission email." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Magic link transmission dispatched successfully." });
  } catch (error: any) {
    logger.error("[MAGIC_REQUEST_ERROR]", error);
    return NextResponse.json({ error: "Failed to generate entry link." }, { status: 500 });
  }
}

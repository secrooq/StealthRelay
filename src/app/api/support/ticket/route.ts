import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from "@/lib/db";
import { logger } from "@/lib/logger";

export const runtime = 'edge';

async function verifyTurnstile(token: string, ip: string) {
  const secret = getEnv("TURNSTILE_SECRET_KEY") || "1x00000000000000000000000000000000AA";
  if (secret.startsWith("1x") || secret.startsWith("0x")) {
    return true;
  }
  
  const formData = new FormData();
  formData.append('secret', secret);
  formData.append('response', token);
  formData.append('remoteip', ip);

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: formData,
  });
  const outcome: any = await res.json();
  return outcome.success;
}

function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(request: NextRequest) {
  try {
    const { email, name, topic, message, turnstileToken } = await request.json();

    if (!email || !message) {
      return NextResponse.json({ error: "Required payload segments missing." }, { status: 400 });
    }

    // 1. Validate Ingress Anti-Spam
    if (!turnstileToken) {
      return NextResponse.json({ error: "Anti-robot clearing required." }, { status: 400 });
    }

    const clientIp = request.headers.get('cf-connecting-ip') || '127.0.0.1';
    const isRobotPassed = await verifyTurnstile(turnstileToken, clientIp);

    if (!isRobotPassed) {
      return NextResponse.json({ error: "Visual defense check failed. Denying access." }, { status: 403 });
    }

    const safeName = escapeHtml(name || "Anonymous Operative");
    const safeEmail = escapeHtml(email);
    const safeTopic = escapeHtml(topic || "General Intel Request");
    const safeMessage = escapeHtml(message);

    // 2. Dispatch to Command Center via Brevo Transactional Email
    const brevoKey = getEnv("BREVO_API_KEY");
    if (!brevoKey) {
      logger.warn("[SUPPORT TICKET] Brevo Key missing. Logging locally.");
      return NextResponse.json({ success: true, message: "Dev-mode: Support packet received successfully." });
    }

    const formattedBody = `
      <div style="font-family: monospace; background-color: #020203; color: #ededed; padding: 30px; border-radius: 8px; border: 1px solid #10b981;">
        <h2 style="color: #10b981; text-transform: uppercase; border-bottom: 1px solid #ffffff20; padding-bottom: 10px;">[ INCOMING_TICKET_INTEL ]</h2>
        <p><strong>SENDER_IDENTITY:</strong> ${safeName}</p>
        <p><strong>RETURN_VECTOR (EMAIL):</strong> ${safeEmail}</p>
        <p><strong>SECTOR_SUBJECT:</strong> ${safeTopic}</p>
        <div style="background-color: #050507; border: 1px dashed #ffffff30; padding: 15px; margin-top: 20px; color: #fff;">
           <p style="white-space: pre-wrap;">${safeMessage}</p>
        </div>
        <p style="font-size: 10px; color: #666; margin-top: 30px;">Transmission generated automatically via Stealth Relay Operational Bridge.</p>
      </div>
    `;

    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': brevoKey
      },
      body: JSON.stringify({
        sender: { name: "StealthRelay Bridge", email: "info@stealthrelay.com" },
        to: [{ email: "info@stealthrelay.com", name: "StealthRelay Operations" }],
        replyTo: { email: email, name: name || "Operative" },
        subject: `[SUPPORT] ${topic || 'Technical Inquiry'} - from ${name || email}`,
        htmlContent: formattedBody
      })
    });

    if (!brevoRes.ok) {
      const errText = await brevoRes.text();
      logger.error("[BREVO TRANSACTIONAL ERROR]", errText);
      return NextResponse.json({ error: "Routing vector disrupted. Please transmit via manual email to info@stealthrelay.com." }, { status: 502 });
    }

    return NextResponse.json({ success: true, message: "Intel received. Support dispatched." });
  } catch (e: any) {
    logger.error("[SUPPORT EXCEPTION]", e);
    return NextResponse.json({ error: "Core terminal disruption." }, { status: 500 });
  }
}

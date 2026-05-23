import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from "@/lib/db";

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

export async function POST(request: NextRequest) {
  try {
    const { email, turnstileToken } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Identifier missing." }, { status: 400 });
    }

    // 1. Verify Anti-Spam Perimeter Vector
    if (!turnstileToken) {
      return NextResponse.json({ error: "Security validation required." }, { status: 400 });
    }

    const clientIp = request.headers.get('cf-connecting-ip') || '127.0.0.1';
    const isRobotPassed = await verifyTurnstile(turnstileToken, clientIp);

    if (!isRobotPassed) {
      return NextResponse.json({ error: "Failed visual security handshake. Operations aborted." }, { status: 403 });
    }

    // 2. Synchronize with CRM Command (Brevo list enrollment)
    const { syncContactToBrevo } = await import("@/lib/email");
    const synced = await syncContactToBrevo(email);
    if (!synced) {
      console.warn("[BREVO] Sync fallback or partial warning. Continuing gracefully.");
    }

    return NextResponse.json({ success: true, message: "Operational updates initiated." });
  } catch (e: any) {
    console.error("[SUBSCRIBE EXCEPTION]", e);
    return NextResponse.json({ error: "System level disruption." }, { status: 500 });
  }
}

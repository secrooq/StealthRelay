import { NextResponse } from "next/server";
import { getDb, getEnv } from "@/lib/db";

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
    console.error("[TURNSTILE EXCEPTION]", e);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const { email, turnstileToken } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Identity email required." }, { status: 400 });
    }

    if (!turnstileToken) {
      return NextResponse.json({ error: "Anti-spam validation token is missing." }, { status: 400 });
    }

    const isRobotPassed = await verifyTurnstile(turnstileToken);
    if (!isRobotPassed) {
      return NextResponse.json({ error: "Failed anti-spam validation. Operation aborted." }, { status: 403 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const db = getDb();
    
    const user: any = await db.prepare(
      "SELECT salt, wrapped_vault_key_rec, iv_rec FROM vault_users WHERE user_id = ? LIMIT 1"
    ).bind(cleanEmail).first();

    if (!user || !user.wrapped_vault_key_rec || !user.iv_rec) {
      return NextResponse.json({ error: "Identity ledger record not found or recovery seeds are missing." }, { status: 404 });
    }

    return NextResponse.json({
      salt: user.salt,
      wrapped_vault_key_rec: user.wrapped_vault_key_rec,
      iv_rec: user.iv_rec
    });
  } catch (error: any) {
    console.error("[PRE_RECOVER_ERROR]", error);
    return NextResponse.json({ error: "Failed to retrieve recovery metadata." }, { status: 500 });
  }
}

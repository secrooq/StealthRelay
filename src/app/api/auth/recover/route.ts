import { NextResponse } from "next/server";
import { getDb, getEnv } from "@/lib/db";
import { logger } from "@/lib/logger";

export const runtime = "edge";

async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(salt),
      iterations: 100000,
      hash: "SHA-256"
    },
    passwordKey,
    { name: "HMAC", hash: "SHA-256", length: 256 },
    true,
    ["sign"]
  );

  const exported = await crypto.subtle.exportKey("raw", key);
  return Array.from(new Uint8Array(exported))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

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
    const { email, newPassword, wrappedKeyPwd, ivPwd, turnstileToken } = await req.json();

    if (!email || !newPassword || !wrappedKeyPwd || !ivPwd) {
      return NextResponse.json({ error: "Incomplete recovery payload." }, { status: 400 });
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

    // Verify user exists
    const user: any = await db.prepare(
      "SELECT user_id, salt FROM vault_users WHERE user_id = ? LIMIT 1"
    ).bind(cleanEmail).first();

    if (!user) {
      return NextResponse.json({ error: "Identity ledger record not found." }, { status: 404 });
    }

    // Hash the new passkey using existing salt
    const newPasswordHash = await hashPassword(newPassword, user.salt);

    // Atomically update passkey hash and wrapped pwd keys
    await db.prepare(`
      UPDATE vault_users 
      SET password_hash = ?, wrapped_vault_key_pwd = ?, iv_pwd = ?
      WHERE user_id = ?
    `).bind(newPasswordHash, wrappedKeyPwd, ivPwd, cleanEmail).run();

    return NextResponse.json({ success: true, message: "Security credentials successfully re-keyed. Identity recovered." });
  } catch (error: any) {
    logger.error("[RECOVER_ERROR]", error);
    return NextResponse.json({ error: "Failed to execute identity recovery." }, { status: 500 });
  }
}

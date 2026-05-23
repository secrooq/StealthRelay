import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";

export const runtime = "edge";

let isHighIterationsSupported: boolean | null = null;

async function checkHighIterationsSupport(): Promise<boolean> {
  if (isHighIterationsSupported !== null) return isHighIterationsSupported;
  try {
    const encTest = new TextEncoder();
    const testKey = await crypto.subtle.importKey("raw", encTest.encode("test"), { name: "PBKDF2" }, false, ["deriveBits"]);
    await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt: encTest.encode("salt"), iterations: 600000, hash: "SHA-256" },
      testKey,
      256
    );
    isHighIterationsSupported = true;
  } catch (e) {
    isHighIterationsSupported = false;
  }
  return isHighIterationsSupported;
}

// High-entropy PBKDF2 hashing helper
async function hashPassword(password: string, salt: string, iterations: number = 600000): Promise<string> {
  let targetIterations = iterations;
  if (targetIterations > 100000) {
    const supported = await checkHighIterationsSupport();
    if (!supported) {
      targetIterations = 100000;
    }
  }

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
      iterations: targetIterations,
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

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized access denied." }, { status: 401 });
    }

    const email = session.user.email.trim().toLowerCase();
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "New credential key must be at least 8 characters." }, { status: 400 });
    }

    const db = getDb();
    const user: any = await db.prepare(
      "SELECT salt, password_hash FROM vault_users WHERE user_id = ? LIMIT 1"
    ).bind(email).first();

    if (!user) {
      return NextResponse.json({ error: "Identity ledger record not found." }, { status: 404 });
    }

    // Verify current password hash
    let currentComputedHash = await hashPassword(currentPassword, user.salt);
    if (currentComputedHash !== user.password_hash) {
      const legacyHash = await hashPassword(currentPassword, user.salt, 100000);
      if (legacyHash !== user.password_hash) {
        return NextResponse.json({ error: "Invalid current credential key." }, { status: 400 });
      }
    }

    // Calculate new password hash
    const newComputedHash = await hashPassword(newPassword, user.salt);

    // Update password hash atomically
    await db.prepare(
      "UPDATE vault_users SET password_hash = ? WHERE user_id = ?"
    ).bind(newComputedHash, email).run();

    return NextResponse.json({ success: true, message: "Security credential key updated successfully." });
  } catch (error: any) {
    logger.error("[CHANGE_PASSWORD_ERROR]", error);
    return NextResponse.json({ error: error.message || "Failed to update security credentials." }, { status: 500 });
  }
}

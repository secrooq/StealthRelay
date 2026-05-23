import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";

export const runtime = "edge";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized access denied." }, { status: 401 });
    }

    const email = session.user.email.trim().toLowerCase();
    const db = getDb();
    
    const user: any = await db.prepare(
      "SELECT display_name, two_factor_enabled, two_factor_secret FROM vault_users WHERE user_id = ? LIMIT 1"
    ).bind(email).first();

    if (!user) {
      return NextResponse.json({ error: "User identity profile not found." }, { status: 404 });
    }

    return NextResponse.json({
      displayName: user.display_name || "Operative",
      twoFactorEnabled: user.two_factor_enabled === 1,
      twoFactorSecret: user.two_factor_secret || ""
    });
  } catch (error: any) {
    logger.error("[PROFILE_GET_ERROR]", error);
    return NextResponse.json({ error: "Failed to retrieve security profile." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized access denied." }, { status: 401 });
    }

    const email = session.user.email.trim().toLowerCase();
    const body = await req.json();
    const db = getDb();

    // Dynamically update fields if they are provided in body
    if ("displayName" in body) {
      await db.prepare(
        "UPDATE vault_users SET display_name = ? WHERE user_id = ?"
      ).bind(body.displayName, email).run();
    }

    if ("twoFactorEnabled" in body) {
      const enabled = body.twoFactorEnabled ? 1 : 0;
      const secret = body.twoFactorSecret || "";
      
      // If arming 2FA, verify the code first!
      if (enabled === 1 && secret) {
        const { verify } = await import("otplib");
        const totpCode = body.totpCode || "";
        const isValid = verify({ token: totpCode, secret });
        if (!isValid) {
          return NextResponse.json({ error: "Authenticator verification failed. Incorrect code." }, { status: 400 });
        }
      }

      await db.prepare(
        "UPDATE vault_users SET two_factor_enabled = ?, two_factor_secret = ? WHERE user_id = ?"
      ).bind(enabled, secret, email).run();
    }

    return NextResponse.json({ success: true, message: "Security settings ledger updated." });
  } catch (error: any) {
    logger.error("[PROFILE_POST_ERROR]", error);
    return NextResponse.json({ error: "Failed to update security profile." }, { status: 500 });
  }
}

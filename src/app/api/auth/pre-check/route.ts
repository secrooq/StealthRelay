import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Identity email required." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const db = getDb();
    
    const user: any = await db.prepare(
      "SELECT two_factor_enabled FROM vault_users WHERE user_id = ? LIMIT 1"
    ).bind(cleanEmail).first();

    if (!user) {
      // Obfuscate user presence: return 2FA disabled for non-existent users without explicitly exposing registration status.
      return NextResponse.json({ twoFactorEnabled: false, exists: false });
    }

    return NextResponse.json({
      twoFactorEnabled: user.two_factor_enabled === 1,
      exists: true
    });
  } catch (error: any) {
    console.error("[PRE_CHECK_ERROR]", error);
    return NextResponse.json({ twoFactorEnabled: false, error: "Security check failed." }, { status: 500 });
  }
}

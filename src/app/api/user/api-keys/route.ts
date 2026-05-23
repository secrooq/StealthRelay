import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";

export const runtime = "edge";

async function ensureTable(db: any) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS user_api_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      api_key TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_used_at DATETIME
    )
  `).run();
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized access denied." }, { status: 401 });
    }

    const email = session.user.email.trim().toLowerCase();
    const db = getDb();
    await ensureTable(db);

    const keys = await db.prepare(
      "SELECT id, api_key, created_at, last_used_at FROM user_api_keys WHERE user_id = ? ORDER BY created_at DESC"
    ).bind(email).all();

    return NextResponse.json({ keys: keys.results || [] });
  } catch (error: any) {
    console.error("[API_KEYS_GET_ERROR]", error);
    return NextResponse.json({ error: "Failed to retrieve API credentials." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized access denied." }, { status: 401 });
    }

    const email = session.user.email.trim().toLowerCase();
    const db = getDb();
    await ensureTable(db);

    // Generate a secure API Key: prefix + random cryptographic hex
    const randomBytes = crypto.getRandomValues(new Uint8Array(24));
    const hex = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
    const newApiKey = `sr_live_${hex}`;
    const id = crypto.randomUUID();

    await db.prepare(
      "INSERT INTO user_api_keys (id, user_id, api_key) VALUES (?, ?, ?)"
    ).bind(id, email, newApiKey).run();

    return NextResponse.json({ 
      id, 
      api_key: newApiKey, 
      created_at: new Date().toISOString() 
    });
  } catch (error: any) {
    console.error("[API_KEYS_POST_ERROR]", error);
    return NextResponse.json({ error: "Failed to generate API credential." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized access denied." }, { status: 401 });
    }

    const email = session.user.email.trim().toLowerCase();
    const { searchParams } = new URL(req.url);
    const keyId = searchParams.get("id");

    if (!keyId) {
      return NextResponse.json({ error: "API Key ID required." }, { status: 400 });
    }

    const db = getDb();
    await ensureTable(db);

    await db.prepare(
      "DELETE FROM user_api_keys WHERE id = ? AND user_id = ?"
    ).bind(keyId, email).run();

    return NextResponse.json({ success: true, message: "API Key revoked successfully." });
  } catch (error: any) {
    console.error("[API_KEYS_DELETE_ERROR]", error);
    return NextResponse.json({ error: "Failed to revoke API credential." }, { status: 500 });
  }
}

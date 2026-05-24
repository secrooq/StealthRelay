import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "edge";

async function hashIp(ip: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(ip);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function GET(request: Request) {
  try {
    const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "127.0.0.1";
    const hashedIp = await hashIp(ip);
    const db = getDb();

    // Ensure the table exists dynamically
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS rate_limits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip TEXT NOT NULL,
        route TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // Clean up old entries older than 24 hours
    await db.prepare(`
      DELETE FROM rate_limits 
      WHERE timestamp < datetime('now', '-24 hours')
    `).run();

    // Check count in last 24 hours
    const result: any = await db.prepare(`
      SELECT COUNT(*) as count 
      FROM rate_limits 
      WHERE ip = ? AND route = 'photo_bleach' AND timestamp >= datetime('now', '-24 hours')
    `).bind(hashedIp).first();

    const count = result?.count || 0;
    const allowed = count < 3;

    return NextResponse.json({
      success: true,
      allowed,
      count,
      limit: 3
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || "Database offline."
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "127.0.0.1";
    const hashedIp = await hashIp(ip);
    const db = getDb();

    // Ensure the table exists dynamically
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS rate_limits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip TEXT NOT NULL,
        route TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // Increment count by inserting an entry
    await db.prepare(`
      INSERT INTO rate_limits (ip, route) 
      VALUES (?, 'photo_bleach')
    `).bind(hashedIp).run();

    // Fetch new count in last 24 hours
    const result: any = await db.prepare(`
      SELECT COUNT(*) as count 
      FROM rate_limits 
      WHERE ip = ? AND route = 'photo_bleach' AND timestamp >= datetime('now', '-24 hours')
    `).bind(hashedIp).first();

    const count = result?.count || 0;
    const allowed = count < 3;

    return NextResponse.json({
      success: true,
      allowed,
      count,
      limit: 3
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || "Database write failed."
    }, { status: 500 });
  }
}

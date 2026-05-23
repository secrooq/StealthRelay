import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    // Restrict simulated checkout confirmation to development nodes
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "Simulated gateway is restricted to development nodes." }, { status: 403 });
    }

    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Clearance required." }, { status: 401 });
    }

    const email = session.user.email.trim().toLowerCase();
    const { plan, billing, seats } = await req.json();
    const parsedSeats = parseInt(String(seats || "1"), 10);
    const seatCount = isNaN(parsedSeats) ? 1 : parsedSeats;

    if (!plan) {
      return NextResponse.json({ error: "Missing plan allocation." }, { status: 400 });
    }

    const db = getDb();
    
    // Dynamic progressive migration to verify that the 'seats' column is active in the environment
    try {
      await db.prepare("ALTER TABLE user_subscriptions ADD COLUMN seats INTEGER DEFAULT 1").run();
    } catch {}

    // Set expiry to 1 month or 1 year from now based on billing Protocol
    const now = new Date();
    const expiry = new Date();
    if (billing === "yearly") {
      expiry.setFullYear(now.getFullYear() + 1);
    } else {
      expiry.setMonth(now.getMonth() + 1);
    }

    const expiryStr = expiry.toISOString();
    const createdStr = now.toISOString();

    // Upsert subscription with dynamic seat allocation
    await db.prepare(`
      INSERT OR REPLACE INTO user_subscriptions (user_id, plan, status, current_period_end, created_at, source, seats)
      VALUES (?, ?, 'ACTIVE', ?, ?, 'mock', ?)
    `).bind(email, plan, expiryStr, createdStr, seatCount).run();

    logger.info(`[MOCK_CHECKOUT_CONFIRM] Subscription successfully upgraded for ${email} -> Plan: ${plan}, Billing: ${billing}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error("[MOCK_CONFIRM_ERROR]", error);
    return NextResponse.json({ error: error.message || "Failed to update simulated billing state." }, { status: 500 });
  }
}

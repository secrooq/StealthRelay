import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { initStripe } from "@/lib/stripe";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { logger } from "@/lib/logger";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email.trim().toLowerCase();
    const origin = req.headers.get("origin") || "https://stealthrelay.com";

    // Dynamic Development Sandbox Override
    if (process.env.NODE_ENV === "development") {
      logger.info(`[STRIPE_PORTAL] Dev mode detected. Launching offline billing portal simulator for ${email}`);
      return NextResponse.json({ url: `/pricing/portal-simulator` });
    }

    const stripe = initStripe();
    const db = getRequestContext().env.DB;

    // Retrieve active Stripe customer from database
    const userSub: any = await db.prepare(
      "SELECT plan FROM user_subscriptions WHERE user_id = ? LIMIT 1"
    ).bind(email).first();

    // Standard Stripe billing portal requires a customer id.
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      logger.info(`[STRIPE_PORTAL] Customer identity not found for ${email}. Redirecting to simulation portal.`);
      return NextResponse.json({ url: "/pricing/portal-simulator" });
    }

    const customerId = customers.data[0].id;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/settings`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    logger.error("[STRIPE_PORTAL_ERROR] Stripe unavailable or misconfigured. Launching offline portal simulator.", error);
    return NextResponse.json({ url: "/pricing/portal-simulator" });
  }
}

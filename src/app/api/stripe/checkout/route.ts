import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { initStripe } from "@/lib/stripe";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { logger } from "@/lib/logger";

export const runtime = "edge";

// High-fidelity Price Matrix
const PRICING_MATRIX: Record<string, Record<string, { cents: number; interval: "month" | "year"; label: string }>> = {
  CONTRACTOR: {
    monthly: { cents: 1900, interval: "month", label: "Private Contractor Plan (Monthly)" },
    yearly: { cents: 18000, interval: "year", label: "Private Contractor Plan (Yearly)" }
  },
  PHANTOM: {
    monthly: { cents: 4900, interval: "month", label: "Phantom Entity Plan (Monthly)" },
    yearly: { cents: 49200, interval: "year", label: "Phantom Entity Plan (Yearly)" }
  },
  ENTERPRISE: {
    monthly: { cents: 9900, interval: "month", label: "Enterprise Core Plan (Monthly)" },
    yearly: { cents: 94800, interval: "year", label: "Enterprise Core Plan (Yearly)" }
  }
};

async function handleCheckout(req: Request, searchParams: URLSearchParams) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Administrative clearance required." }, { status: 401 });
    }

    const email = session.user.email.trim().toLowerCase();
    const origin = req.headers.get("origin") || new URL(req.url).origin || "https://stealthrelay.com";

    // 2. Parse Dynamic pricing parameters
    const plan = (searchParams.get("plan") || "CONTRACTOR").toUpperCase();
    const billing = (searchParams.get("billing") || "monthly").toLowerCase();

    const planConfig = PRICING_MATRIX[plan] || PRICING_MATRIX.CONTRACTOR;
    const pricing = planConfig[billing] || planConfig.monthly;

    let quantity = 1;
    let unitAmount = pricing.cents;

    if (plan === "ENTERPRISE") {
      const seatsRaw = searchParams.get("seats");
      const parsedSeats = parseInt(String(seatsRaw || "5"), 10);
      quantity = isNaN(parsedSeats) ? 5 : Math.max(5, parsedSeats);
      
      // Multi-Seat dynamic calculation ($99/seat/month monthly, or $79/seat/month yearly = $948/seat/year)
      if (billing === "yearly") {
        unitAmount = 94800; // $948.00 / seat / year in cents
      } else {
        unitAmount = 9900;  // $99.00 / seat / month in cents
      }
    }

    const stripe = initStripe();

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: email,
      allow_promotion_codes: true,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: plan === "ENTERPRISE" 
                ? `StealthRelay Sovereign Enterprise Core (${quantity} seats)`
                : `StealthRelay ${pricing.label}`,
              description: plan === "ENTERPRISE"
                ? `Zero-Knowledge organization vault, team burn grid, and multi-tenant telemetry for ${quantity} licensed seats.`
                : `Zero-Knowledge encryption relays and secure operational mesh. Plan: ${plan}`,
            },
            unit_amount: unitAmount,
            recurring: {
              interval: pricing.interval,
            },
          },
          quantity: quantity,
        },
      ],
      success_url: `${origin}/relay?billing_success=true`,
      cancel_url: `${origin}/pricing?billing_cancelled=true`,
      metadata: {
        userId: email,
        plan: plan,
        billing: billing,
        seats: String(quantity)
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    logger.error("[STRIPE_CHECKOUT_ERROR] Stripe unavailable or misconfigured. Activating simulation fallback.", error);
    
    // Graceful production & development checkout simulation fallback
    const plan = (searchParams.get("plan") || "CONTRACTOR").toUpperCase();
    const billing = (searchParams.get("billing") || "monthly").toLowerCase();
    const seatsRaw = searchParams.get("seats");
    const parsedSeats = parseInt(String(seatsRaw || "5"), 10);
    const quantity = isNaN(parsedSeats) ? 5 : Math.max(5, parsedSeats);

    const mockCheckoutUrl = `/pricing/checkout-simulator?plan=${plan}&billing=${billing}&seats=${quantity}`;
    return NextResponse.json({ url: mockCheckoutUrl });
  }
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  let payload: any = {};
  try {
    payload = await req.json();
  } catch {}

  // Merge payload parameters into query params
  if (payload.plan) searchParams.set("plan", payload.plan);
  if (payload.billing) searchParams.set("billing", payload.billing);
  if (payload.seats) searchParams.set("seats", String(payload.seats));

  return handleCheckout(req, searchParams);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const res = await handleCheckout(req, searchParams);

  // If simple GET link redirect requested, return 302 redirect directly rather than JSON URL
  if (res.status === 200) {
    const clone = res.clone();
    const data = await clone.json();
    return NextResponse.redirect(new URL(data.url, req.url).toString(), 302);
  }
  return res;
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSubscriptionStatus } from "@/lib/subscription";

export const runtime = "edge";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email.trim().toLowerCase();
    const sub = await getSubscriptionStatus(email);

    return NextResponse.json({
      email,
      plan: sub.plan,
      status: sub.status,
      current_period_end: sub.current_period_end,
      billing_period: (sub as any).billing_period || "monthly"
    });
  } catch (error: any) {
    console.error("[USER_SUBSCRIPTION_API_ERROR]", error);
    return NextResponse.json({ error: error.message || "Failed to retrieve subscription telemetry." }, { status: 500 });
  }
}

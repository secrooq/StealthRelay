import { NextResponse } from "next/server";
import { getEnv } from "@/lib/db";

export const runtime = "edge";

export async function GET() {
  try {
    const rawSiteKey = getEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY");
    const siteKey = (!rawSiteKey || rawSiteKey.startsWith("1x"))
      ? "0x4AAAAAAADOfEkQcnejCX1Cd"
      : rawSiteKey;

    return NextResponse.json({ siteKey });
  } catch (error) {
    // Fallback to Always Pass key on any exception
    return NextResponse.json({ siteKey: "0x4AAAAAAADOfEkQcnejCX1Cd" });
  }
}

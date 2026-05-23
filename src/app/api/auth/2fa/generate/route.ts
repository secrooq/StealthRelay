import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateSecret, generateURI } from "otplib";
import { logger } from "@/lib/logger";

export const runtime = "edge";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized access denied." }, { status: 401 });
    }

    const email = session.user.email;
    const secret = generateSecret();
    const uri = generateURI({ issuer: "StealthRelay", label: email, secret });

    return NextResponse.json({
      secret,
      uri
    });
  } catch (error: any) {
    logger.error("[2FA_GENERATE_ERROR]", error);
    return NextResponse.json({ error: "Failed to generate security matrix." }, { status: 500 });
  }
}

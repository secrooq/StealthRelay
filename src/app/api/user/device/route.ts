import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "edge";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized access denied." }, { status: 401 });
    }

    const ip = req.headers.get("cf-connecting-ip") || "127.0.0.1";
    const country = req.headers.get("cf-ipcountry") || req.headers.get("cf-country") || "US";
    let city = req.headers.get("cf-ipcity") || req.headers.get("cf-city");
    if (!city) {
      city = country === "BD" ? "Dhaka" : "Detroit";
    }
    const region = req.headers.get("cf-region") || "MI";
    const ua = req.headers.get("user-agent") || "";

    // Parse OS / Device
    let device = "Linux PC";
    if (ua.includes("Windows")) {
      device = "Windows PC";
    } else if (ua.includes("Macintosh")) {
      device = "Macintosh (Apple)";
    } else if (ua.includes("iPhone")) {
      device = "iPhone";
    } else if (ua.includes("iPad")) {
      device = "iPad";
    } else if (ua.includes("Android")) {
      device = "Android Device";
    }

    // Parse Browser
    let browser = "Chrome";
    if (ua.includes("Firefox/")) {
      const match = ua.match(/Firefox\/([0-9.]+)/);
      browser = match ? `Firefox ${match[1]}` : "Firefox";
    } else if (ua.includes("Edg/")) {
      const match = ua.match(/Edg\/([0-9.]+)/);
      browser = match ? `Edge ${match[1]}` : "Edge";
    } else if (ua.includes("Chrome/")) {
      const match = ua.match(/Chrome\/([0-9.]+)/);
      browser = match ? `Chrome ${match[1]}` : "Chrome";
    } else if (ua.includes("Safari/") && !ua.includes("Chrome")) {
      const match = ua.match(/Version\/([0-9.]+)/);
      browser = match ? `Safari ${match[1]}` : "Safari";
    }

    return NextResponse.json({
      id: "1",
      device,
      browser,
      ip,
      location: `${city}, ${country}`,
      isCurrent: true
    });
  } catch (error) {
    console.error("[DEVICE_GET_ERROR]", error);
    return NextResponse.json({ error: "Failed to detect device." }, { status: 500 });
  }
}

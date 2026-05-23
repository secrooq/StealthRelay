if (typeof globalThis !== "undefined") {
  const g = globalThis as any;
  if (!g.process) g.process = {};
  
  try {
    // Copy Cloudflare edge environment bindings safely without replacing the process.env Proxy
    const cfEnv = g.__cloudflare_env;
    if (cfEnv && typeof cfEnv === "object" && g.process.env) {
      for (const key of Object.keys(cfEnv)) {
        try {
          g.process.env[key] = String(cfEnv[key]);
        } catch (e) {
          // Ignore read-only or proxy-level set failures outside requests
        }
      }
    }
    
    // Apply defaults safely if they are not already set
    if (g.process.env) {
      try {
        if (!g.process.env.AUTH_SECRET) {
          g.process.env.AUTH_SECRET = "stealth_relay_nextauth_secret_key_edge_v1_2026";
        }
        if (!g.process.env.AUTH_TRUST_HOST) {
          g.process.env.AUTH_TRUST_HOST = "true";
        }
      } catch (e) {
        // Ignore read-only or proxy-level set failures outside requests
      }
    }
  } catch (e) {
    console.error("[MIDDLEWARE_ENV_PATCH_ERROR] Failed to patch process.env:", e);
  }
}


import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { getEnv } from "@/lib/db";
import { verifySession } from "@/lib/adminGuard";

// Protected paths requiring active user session
const PROTECTED_PREFIXES = ["/relay", "/vault", "/secret"];

function getAdminBypassSecret(): string {
  return (getEnv("ADMIN_BYPASS_SECRET") || crypto.randomUUID())
    .trim()
    .replace(/^["']|["']$/g, "");
}

export default auth(async (req) => {
  try {
    const pathname = req.nextUrl.pathname;
    const hostname = req.nextUrl.hostname;

    // A. ENFORCE STAGING BASIC AUTHENTICATION GATE
    const stagingPass = getEnv("STAGING_PASS");
    if (stagingPass) {
      const authHeader = req.headers.get("authorization");
      const expectedUser = getEnv("STAGING_USER") || "admin";
      
      let authenticated = false;
      if (authHeader && authHeader.startsWith("Basic ")) {
        try {
          const credentials = atob(authHeader.substring(6)).split(":");
          if (credentials[0] === expectedUser && credentials[1] === stagingPass) {
            authenticated = true;
          }
        } catch (e) {
          // Gracefully ignore malformed Base64 headers
        }
      }
      
      if (!authenticated) {
        return new NextResponse("Unauthorized Operational Entry.", {
          status: 401,
          headers: {
            "WWW-Authenticate": 'Basic realm="StealthRelay Staging Matrix"',
          },
        });
      }
    }

    // 1. CANONICAL DOMAIN REDIRECT (.pages.dev bypass)
    // Only redirect production pages.dev subdomain if not running staging/preview sandboxes
    if (hostname === "stealthrelay-antigravity.pages.dev" && !stagingPass && pathname !== "/api/test-sync") {
      const targetUrl = new URL(pathname + req.nextUrl.search, "https://stealthrelay.com");
      return NextResponse.redirect(targetUrl, { status: 308 });
    }

    // 2. ADMIN PANEL SECURITY GATING
    if (pathname.startsWith("/admin")) {
      if (pathname === "/admin/login") {
        return NextResponse.next();
      }

      // A. Check modern cryptographic session
      const sessionToken = req.cookies.get("stealth_admin_session")?.value?.trim();
      if (sessionToken) {
        const verified = await verifySession(sessionToken, getAdminBypassSecret());
        if (verified) {
          return NextResponse.next();
        }
      }

      // Access Denied -> Redirect to admin gateway
      const loginUrl = new URL("/admin/login", req.url);
      return NextResponse.redirect(loginUrl);
    }

    // 3. USER AREA SECURITY GATING
    const isProtected = PROTECTED_PREFIXES.some(prefix => pathname.startsWith(prefix));
    if (isProtected) {
      if (!req.auth) {
        // Redirect to unified cyberpunk login page
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", req.url);
        return NextResponse.redirect(loginUrl);
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error("[MIDDLEWARE_CRITICAL_RECOVERY]", error);
    return NextResponse.next();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

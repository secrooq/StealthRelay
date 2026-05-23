import { handlers } from "@/auth";
import { getOptionalRequestContext } from "@cloudflare/next-on-pages";
import { logger } from "@/lib/logger";

export const runtime = "edge";

function bindContext() {
  try {
    const ctx = getOptionalRequestContext();
    if (ctx?.env) {
      (globalThis as any).__cloudflare_env = ctx.env;
    }
  } catch (err) {
    logger.error("[AUTH_ROUTE_BIND_CONTEXT_ERROR]", err);
  }
}

export const GET = async (req: any) => {
  bindContext();
  return handlers.GET(req);
};

export const POST = async (req: any) => {
  bindContext();
  return handlers.POST(req);
};

import { getDb } from "./db";

export interface ApiKeyValidationResult {
  isValid: boolean;
  userId?: string;
}

export async function validateApiKey(req: Request): Promise<ApiKeyValidationResult> {
  try {
    let apiKey: string | null = null;

    // 1. Resolve API Key from Authorization Header (Bearer sr_live_...)
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      apiKey = authHeader.substring(7).trim();
    }

    // 2. Fallback to X-API-Key Header
    if (!apiKey) {
      apiKey = req.headers.get("x-api-key")?.trim() || null;
    }

    if (!apiKey || !apiKey.startsWith("sr_live_")) {
      return { isValid: false };
    }

    const db = getDb();
    
    // Ensure table exists to prevent errors
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS user_api_keys (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        api_key TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_used_at DATETIME
      )
    `).run();

    const record: any = await db.prepare(
      "SELECT user_id FROM user_api_keys WHERE api_key = ? LIMIT 1"
    ).bind(apiKey).first();

    if (!record) {
      return { isValid: false };
    }

    // Dynamic background update for telemetry metrics
    try {
      await db.prepare(
        "UPDATE user_api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE api_key = ?"
      ).bind(apiKey).run();
    } catch {
      // Ignore background write errors
    }

    return {
      isValid: true,
      userId: record.user_id
    };
  } catch (error) {
    console.error("[API_KEY_GUARD_ERROR]", error);
    return { isValid: false };
  }
}

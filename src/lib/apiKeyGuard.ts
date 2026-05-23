import { getDb } from "./db";
import { hashApiKey } from "./hash";

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
        masked_key TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_used_at DATETIME
      )
    `).run();

    const hashedKey = await hashApiKey(apiKey);

    // Check if the user is attempting to authenticate with a legacy plaintext key.
    // We enforce that the incoming apiKey MUST start with the valid prefix so attackers
    // cannot pass a stolen hash string as the apiKey itself (pass-the-hash attack).
    let record: any = await db.prepare(
      "SELECT user_id FROM user_api_keys WHERE api_key = ? LIMIT 1"
    ).bind(hashedKey).first();

    // Fallback support for pre-existing plaintext keys
    if (!record && apiKey.startsWith("sr_live_")) {
      record = await db.prepare(
        "SELECT user_id FROM user_api_keys WHERE api_key = ? LIMIT 1"
      ).bind(apiKey).first();

      // Optional: We could trigger a background migration here to hash this legacy key
      // now that the user has successfully authenticated with it.
    }

    if (!record) {
      return { isValid: false };
    }

    // Dynamic background update for telemetry metrics
    try {
      await db.prepare(
        "UPDATE user_api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE api_key = ? OR api_key = ?"
      ).bind(hashedKey, apiKey).run();
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

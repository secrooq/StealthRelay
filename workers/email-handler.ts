/**
 * StealthRelay Edge Email Vector
 * Standalone Cloudflare Worker for live inbound traffic forwarding.
 * BINDINGS REQUIRED:
 * - DB (D1 Database: stealthrelay-db)
 */

interface Env {
  DB: D1Database;
}

export default {
  async email(message: any, env: Env, ctx: any): Promise<void> {
    const rcptTo = message.to.toLowerCase(); // The alias used, e.g., xkj23@stealthrelay.com
    
    try {
      // 1. Query active aliasing from core D1
      const aliasRecord = await env.DB.prepare(
        `SELECT destination_email, is_active FROM relay_aliases WHERE LOWER(alias_address) = ?`
      ).bind(rcptTo).first() as { destination_email: string; is_active: number } | null;

      // 2. Drop if not found or paused
      if (!aliasRecord) {
        console.warn(`[INTERCEPT] DROP: No matching mask for ${rcptTo}`);
        message.setReject("Vector unregistered.");
        return;
      }

      if (aliasRecord.is_active !== 1) {
        console.warn(`[INTERCEPT] DROP: Mask ${rcptTo} is inactive.`);
        message.setReject("Vector currently disabled by operative.");
        return;
      }

      // 3. Incremental packet tracking
      ctx.waitUntil(
        env.DB.prepare(`UPDATE relay_aliases SET forward_count = forward_count + 1 WHERE LOWER(alias_address) = ?`)
          .bind(rcptTo).run()
      );

      // 4. Dispatch forward propagation
      console.log(`[INTERCEPT] ROUTE: ${rcptTo} -> ${aliasRecord.destination_email}`);
      await message.forward(aliasRecord.destination_email);

    } catch (err: any) {
      console.error("[INTERCEPT] CRITICAL SYSTEM FAILURE:", err.message);
      message.setReject("Grid instability. Try again later.");
    }
  }
};

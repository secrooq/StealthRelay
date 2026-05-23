import { getDb } from "./db";

export async function checkRateLimit(ip: string, route: string, maxRequests: number, windowMinutes: number): Promise<boolean> {
  const db = getDb();

  // Ensure table exists
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS rate_limits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip TEXT NOT NULL,
      route TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // Clean up old entries
  await db.prepare(`DELETE FROM rate_limits WHERE timestamp < datetime('now', '-${windowMinutes} minutes')`).run();

  // Check current count
  const result: any = await db.prepare(`
    SELECT COUNT(*) as count FROM rate_limits WHERE ip = ? AND route = ? AND timestamp >= datetime('now', '-${windowMinutes} minutes')
  `).bind(ip, route).first();

  const count = result?.count || 0;

  if (count >= maxRequests) {
    return false; // Rate limited
  }

  return true; // Allowed
}

export async function incrementRateLimit(ip: string, route: string): Promise<void> {
  const db = getDb();
  await db.prepare(`
    INSERT INTO rate_limits (ip, route) VALUES (?, ?)
  `).bind(ip, route).run();
}

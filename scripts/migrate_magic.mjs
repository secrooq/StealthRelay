import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';

const cwd = process.cwd();
const d1Dir = path.join(cwd, ".wrangler", "state", "v3", "d1", "miniflare-D1DatabaseObject");

if (fs.existsSync(d1Dir)) {
  const files = fs.readdirSync(d1Dir);
  const sqliteFile = files.find(f => f.endsWith(".sqlite"));
  if (sqliteFile) {
    const dbPath = path.join(d1Dir, sqliteFile);
    console.log(`[MIGRATING] Found database at: ${dbPath}`);
    const sqlDb = new DatabaseSync(dbPath);

    try {
      sqlDb.exec(`
        CREATE TABLE IF NOT EXISTS magic_links (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL,
          token TEXT UNIQUE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          expires_at DATETIME NOT NULL,
          is_used INTEGER DEFAULT 0
        );
      `);
      console.log("-> Created table magic_links successfully.");
    } catch (e) {
      console.error("-> Failed to create table magic_links:", e);
    }
  } else {
    console.log("[ERROR] SQLite database file not found in wrangler directories.");
  }
} else {
  console.log("[ERROR] Wrangler local D1 database state directory does not exist yet.");
}

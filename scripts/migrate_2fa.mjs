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
      sqlDb.exec("ALTER TABLE vault_users ADD COLUMN two_factor_enabled INTEGER DEFAULT 0;");
      console.log("-> Added column two_factor_enabled");
    } catch (e) {
      console.log("-> column two_factor_enabled already exists or skipped.");
    }

    try {
      sqlDb.exec("ALTER TABLE vault_users ADD COLUMN two_factor_secret TEXT;");
      console.log("-> Added column two_factor_secret");
    } catch (e) {
      console.log("-> column two_factor_secret already exists or skipped.");
    }

    try {
      sqlDb.exec("ALTER TABLE vault_users ADD COLUMN display_name TEXT;");
      console.log("-> Added column display_name");
    } catch (e) {
      console.log("-> column display_name already exists or skipped.");
    }

    console.log("[MIGRATION_COMPLETE] Database updated successfully.");
  } else {
    console.log("[ERROR] SQLite database file not found in wrangler directories.");
  }
} else {
  console.log("[ERROR] Wrangler local D1 database state directory does not exist yet.");
}

# Deployment Guide: StealthRelay Email Worker

This directory contains the independent Cloudflare Worker script that handles inbound SMTP events.

### 1. Create Wrangler Config
Create a `wrangler.toml` in this directory:
```toml
name = "stealthrelay-email-worker"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "stealthrelay-db"
database_id = "<PASTE_YOUR_SAME_D1_DATABASE_ID>"
```

### 2. Deploy
```bash
npx wrangler deploy
```

### 3. Cloudflare Setup
1. Go to Cloudflare Dashboard -> Email -> Email Routing.
2. Bind your active route/catch-all to this "Worker" instead of a static email address.
3. Done! Traffic automatically routes via the database maps you manage in your dashboard.

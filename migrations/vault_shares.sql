-- Zero-Knowledge Vault File Sharing Schema
CREATE TABLE IF NOT EXISTS vault_shares (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  file_name_encrypted TEXT NOT NULL, -- The original file name, client-encrypted!
  file_size INTEGER NOT NULL,
  mime_type TEXT,
  share_iv TEXT NOT NULL, -- The IV for the shared payload (file bytes + name)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME, -- Timestamp of auto-destruction
  access_password_hash TEXT -- PBKDF2 base64 hash of custom user access password, if active
);

CREATE INDEX IF NOT EXISTS idx_vault_shares_owner ON vault_shares(owner_id);
CREATE INDEX IF NOT EXISTS idx_vault_shares_expiry ON vault_shares(expires_at);

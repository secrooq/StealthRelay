-- schema.sql

-- 1. Table for StealthSecret (OneTimeSecret Clone)
CREATE TABLE IF NOT EXISTS stealth_secrets (
  id TEXT PRIMARY KEY,
  storage_key TEXT NOT NULL, 
  iv TEXT NOT NULL, -- Added to avoid customMetadata mock failures
  is_file INTEGER DEFAULT 0, 
  has_password INTEGER DEFAULT 0, 
  salt TEXT, 
  is_viewed INTEGER DEFAULT 0, 
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  allowed_countries TEXT, -- CSV list of allowed ISO Country Codes
  allowed_ips TEXT,       -- CSV list of CIDR ranges
  allowed_domains TEXT    -- CSV list of authorized viewer domains
);

-- 2. Table for Vault Users (Zero-Trust Root Keys)
-- Tracks the initialization of a user's vault and stores their twice-wrapped Master Vault Key.
CREATE TABLE IF NOT EXISTS vault_users (
  user_id TEXT PRIMARY KEY,             -- User Email or clerk ID fallback
  salt TEXT NOT NULL,                   -- Global user salt for PBKDF2 derivation
  password_hash TEXT,                   -- Hashed password for secure Auth.js login verification
  wrapped_vault_key_pwd TEXT NOT NULL, -- VaultKey encrypted with Master Password derivation
  iv_pwd TEXT NOT NULL,                 -- IV for password wrap
  wrapped_vault_key_rec TEXT NOT NULL, -- VaultKey encrypted with Recovery Mnemonic derivation
  iv_rec TEXT NOT NULL,                 -- IV for recovery wrap
  two_factor_enabled INTEGER DEFAULT 0, -- Dynamic Multi-Factor authentication status
  two_factor_secret TEXT,               -- Stored TOTP encryption secret key
  display_name TEXT,                    -- Customizable user screen handle nickname
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Table for StealthBox (Persistent Secure Storage)
-- Tracks individual user files. Metadata and file content encryption keys are wrapped by the user's VaultKey.
CREATE TABLE IF NOT EXISTS vault_files (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,               -- Ownership association
  storage_key TEXT NOT NULL,           -- R2 Location
  wrapped_key TEXT NOT NULL,           -- AES-GCM FileKey wrapped by VaultKey
  file_iv TEXT NOT NULL,               -- IV for the physical R2 payload
  encrypted_metadata TEXT NOT NULL,    -- Metadata (filename, type, size) encrypted by FileKey
  meta_iv TEXT NOT NULL,               -- IV for the metadata JSON
  file_size INTEGER NOT NULL,          -- Stored explicitly for analytics/UI, though also in encrypted metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vault_user_id ON vault_files(user_id);

-- 4. Table for StealthRelay (Masked Email Aliases)
CREATE TABLE IF NOT EXISTS relay_aliases (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,               -- Owner
  alias_address TEXT UNIQUE NOT NULL,  -- e.g., shadow-hawk-821@stealthrelay.com
  destination_email TEXT NOT NULL,     -- Target verified inbox
  label TEXT,                          -- Friendly usage description
  is_active INTEGER DEFAULT 1,         -- Kill-switch status
  forward_count INTEGER DEFAULT 0,     -- Usage analytics
  pgp_public_key TEXT,                 -- Armor Public Key for inline encryption
  encryption_enabled INTEGER DEFAULT 0, -- Master PGP switch
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_relay_user_id ON relay_aliases(user_id);
CREATE INDEX IF NOT EXISTS idx_relay_alias_address ON relay_aliases(alias_address);

-- 5. Table for Verified User Mailboxes (Multi-inbox management)
CREATE TABLE IF NOT EXISTS user_mailboxes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  is_verified INTEGER DEFAULT 0,
  verification_token TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Table for Bring Your Own Domain (BYOD Logic)
CREATE TABLE IF NOT EXISTS custom_domains (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  domain_name TEXT UNIQUE NOT NULL,
  is_verified INTEGER DEFAULT 0,
  catch_all_enabled INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Table for Zero-Knowledge Vault File Sharing
CREATE TABLE IF NOT EXISTS vault_shares (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  file_name_encrypted TEXT NOT NULL, -- Original filename, client-encrypted
  file_size INTEGER NOT NULL,
  mime_type TEXT,
  share_iv TEXT NOT NULL,            -- The IV for the re-encrypted file
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,               -- Auto-destruction timestamp
  access_password_hash TEXT          -- Optional PBKDF2 hash of access password
);

CREATE INDEX IF NOT EXISTS idx_vault_shares_owner ON vault_shares(owner_id);
CREATE INDEX IF NOT EXISTS idx_vault_shares_expiry ON vault_shares(expires_at);

-- 8. Table for Global System Configuration (Admin Panel overrides)
CREATE TABLE IF NOT EXISTS system_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 9. Table for Passwordless Magic Links Access Tokens
CREATE TABLE IF NOT EXISTS magic_links (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  is_used INTEGER DEFAULT 0
);

-- 10. Table for Administrative Role-Based Personnel
CREATE TABLE IF NOT EXISTS security_personnel (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('SUPER_ADMIN', 'ADMIN', 'DEVELOPER', 'VIEWER')),
  status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'BANNED')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 11. Table for Administrative Edge Sessions
CREATE TABLE IF NOT EXISTS admin_sessions (
  token TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

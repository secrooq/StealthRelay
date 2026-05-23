-- Table to track administrative/system auditing events
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT, -- Can be NULL for guest/anonymous actions
  action TEXT NOT NULL, -- 'SECRET_CREATED', 'ALIAS_CREATED', 'FILE_UPLOADED', 'ADMIN_LOGIN'
  resource_type TEXT, -- 'SECRET', 'VAULT', 'RELAY', 'ADMIN'
  resource_id TEXT, 
  severity TEXT DEFAULT 'INFO', -- 'INFO', 'WARNING', 'CRITICAL'
  details TEXT, -- JSON string containing relevant event metadata
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);

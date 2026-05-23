-- Intelligence Briefings (Blog)
CREATE TABLE IF NOT EXISTS blog_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  author_name TEXT DEFAULT 'Command Center',
  published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_published BOOLEAN DEFAULT 1
);

-- Operational Monetization (Subscriptions)
CREATE TABLE IF NOT EXISTS user_subscriptions (
  user_id TEXT PRIMARY KEY,
  plan TEXT NOT NULL DEFAULT 'FREE_OPERATOR',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  current_period_end DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Prefill sample articles
INSERT OR IGNORE INTO blog_posts (title, slug, excerpt, content, author_name) VALUES 
('The Quantum Threat to Digital Identity', 'quantum-threat-identity', 'How post-quantum logic mandates total inbox fragmentation.', 'Detailed tactical analysis of inbox spoofing and advanced zero-day tracking vectors...', 'Command Core'),
('Hardening Your Communication Vectors', 'hardening-comm-vectors', 'Strategies for deploying multi-layered alias defenses.', 'Operational protocol requires a fresh vector for every distinct third-party ingestion node...', 'Operative Delta'),
('Anatomy of a Digital Burn', 'anatomy-digital-burn', 'The physics of server-side memory overwrite cycles.', 'When a StealthSecret burns, it leaves no latent electromagnetic resonance on persistent storage...', 'Command Core');

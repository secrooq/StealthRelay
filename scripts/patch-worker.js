const fs = require('fs');
const path = require('path');

// Target directory where @cloudflare/next-on-pages outputs bundles
const targetDir = path.join(__dirname, '..', '.vercel', 'output', 'static', '_worker.js');

const PLAIN_KEYS = {};

// Helper to load and parse an environment file
function loadEnvFile(filename) {
  const envPath = path.join(__dirname, '..', filename);
  if (!fs.existsSync(envPath)) return;
  
  console.log(`Parsing environment file: ${filename}`);
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    
    const match = trimmed.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (match) {
      const key = match[1];
      let value = match[2].trim();
      // Remove surrounding quotes if they exist
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      PLAIN_KEYS[key] = value;
    }
  });
}

// Load .env.production first, then fall back/merge with .env.local
loadEnvFile('.env.production');
if (Object.keys(PLAIN_KEYS).length === 0) {
  loadEnvFile('.env.local');
}

// Also read from system process.env (e.g. on Cloudflare Pages build server)
const environmentKeys = [
  'AUTH_SECRET',
  'AUTH_GITHUB_ID',
  'AUTH_GITHUB_SECRET',
  'AUTH_GOOGLE_ID',
  'AUTH_GOOGLE_SECRET',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'BREVO_API_KEY',
  'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
  'TURNSTILE_SECRET_KEY',
  'ADMIN_BYPASS_SECRET',
  'AUTH_TRUST_HOST',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'AUTH_URL'
];

environmentKeys.forEach(key => {
  if (process.env[key]) {
    PLAIN_KEYS[key] = process.env[key].trim();
  }
});

// Ensure defaults and high-entropy fallbacks are loaded
if (!PLAIN_KEYS.AUTH_SECRET) {
  PLAIN_KEYS.AUTH_SECRET = "stealth_relay_nextauth_secret_key_edge_v1_2026";
}
PLAIN_KEYS.AUTH_TRUST_HOST = "true";
if (!PLAIN_KEYS.NEXTAUTH_URL) {
  PLAIN_KEYS.NEXTAUTH_URL = "https://stealthrelay.com";
}

console.log('Identified environment keys for runtime Proxy fallbacks:', Object.keys(PLAIN_KEYS));

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else {
      if (filePath.endsWith('.js')) {
        results.push(filePath);
      }
    }
  });
  return results;
}

try {
  console.log(`Patching workers in ${targetDir}...`);
  const files = walk(targetDir);
  let count = 0;
  
  files.forEach(file => {
    // Only patch entry point / specific non-chunk files or async_hooks imports
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    // Patch async_hooks to modern node:async_hooks syntax to prevent cloudflare warnings
    if (content.includes('"async_hooks"') || content.includes("'async_hooks'")) {
      content = content
        .replace(/"async_hooks"/g, '"node:async_hooks"')
        .replace(/'async_hooks'/g, "'node:async_hooks'");
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`Patched ${path.relative(targetDir, file)}`);
      count++;
    }
  });

  // Apply explicit entry point Proxy-level patch to _worker.js/index.js
  const entryFile = path.join(targetDir, 'index.js');
  if (fs.existsSync(entryFile)) {
    console.log(`Applying entry point Proxy-level patch to ${entryFile}...`);
    let entryContent = fs.readFileSync(entryFile, 'utf8');
    
    // Stringified fallbacks safe map to inject
    const fallbackString = JSON.stringify(PLAIN_KEYS, null, 2);

    const targetProxyString = `globalThis.process = {
				env: new Proxy(
					{},
					{
						ownKeys: () => Reflect.ownKeys(envAsyncLocalStorage.getStore()),
						getOwnPropertyDescriptor: (_, ...args) =>
							Reflect.getOwnPropertyDescriptor(envAsyncLocalStorage.getStore(), ...args),
						get: (_, property) => Reflect.get(envAsyncLocalStorage.getStore(), property),
						set: (_, property, value) => Reflect.set(envAsyncLocalStorage.getStore(), property, value),
				}),
			};`;

    const patchedProxyString = `globalThis.process = {
				env: new Proxy(
					{},
					{
						ownKeys: () => {
							const store = envAsyncLocalStorage.getStore();
							const storeKeys = store ? Reflect.ownKeys(store) : [];
							const fallbackKeys = Object.keys(${fallbackString});
							return Array.from(new Set([...storeKeys, ...fallbackKeys]));
						},
						getOwnPropertyDescriptor: (_, property) => {
							const store = envAsyncLocalStorage.getStore();
							if (store && Reflect.has(store, property)) {
								return Reflect.getOwnPropertyDescriptor(store, property);
							}
							const fallbacks = ${fallbackString};
							if (fallbacks[property] !== undefined) {
								return {
									value: fallbacks[property],
									writable: true,
									enumerable: true,
									configurable: true
								};
							}
							return undefined;
						},
						get: (_, property) => {
							const store = envAsyncLocalStorage.getStore();
							if (store && store[property] !== undefined) {
								return store[property];
							}
							const fallbacks = ${fallbackString};
							return fallbacks[property];
						},
						set: (_, property, value) => {
							const store = envAsyncLocalStorage.getStore();
							if (store) {
								return Reflect.set(store, property, value);
							}
							return false;
						},
				}),
			};`;

    if (entryContent.includes('envAsyncLocalStorage.getStore()')) {
      // Direct substring replacement
      entryContent = entryContent.replace(targetProxyString, patchedProxyString);
      // Fallback regex in case of slight whitespace variations
      if (!entryContent.includes('stealth_relay_nextauth_secret_key_edge_v1_2026')) {
        const regexFallback = /env:\s*new\s*Proxy\(\s*\{\}\s*,\s*\{\s*ownKeys:\s*\(\)\s*=>\s*Reflect\.ownKeys\(envAsyncLocalStorage\.getStore\(\)\),\s*getOwnPropertyDescriptor:\s*\(_, \.\.\.args\)\s*=>\s*Reflect\.getOwnPropertyDescriptor\(envAsyncLocalStorage\.getStore\(\),\s*\.\.\.args\),\s*get:\s*\(_, property\)\s*=>\s*Reflect\.get\(envAsyncLocalStorage\.getStore\(\),\s*property\),\s*set:\s*\(_, property,\s*value\)\s*=>\s*Reflect\.set\(envAsyncLocalStorage\.getStore\(\),\s*property,\s*value\),?\s*\}\)/;
        entryContent = entryContent.replace(regexFallback, `env: new Proxy(
					{},
					{
						ownKeys: () => {
							const store = envAsyncLocalStorage.getStore();
							const storeKeys = store ? Reflect.ownKeys(store) : [];
							const fallbackKeys = Object.keys(${fallbackString});
							return Array.from(new Set([...storeKeys, ...fallbackKeys]));
						},
						getOwnPropertyDescriptor: (_, property) => {
							const store = envAsyncLocalStorage.getStore();
							if (store && Reflect.has(store, property)) {
								return Reflect.getOwnPropertyDescriptor(store, property);
							}
							const fallbacks = ${fallbackString};
							if (fallbacks[property] !== undefined) {
								return {
									value: fallbacks[property],
									writable: true,
									enumerable: true,
									configurable: true
								};
							}
							return undefined;
						},
						get: (_, property) => {
							const store = envAsyncLocalStorage.getStore();
							if (store && store[property] !== undefined) {
								return store[property];
							}
							const fallbacks = ${fallbackString};
							return fallbacks[property];
						},
						set: (_, property, value) => {
							const store = envAsyncLocalStorage.getStore();
							if (store) {
								return Reflect.set(store, property, value);
							}
							return false;
						},
				})`);
      }
      fs.writeFileSync(entryFile, entryContent, 'utf8');
      console.log(`Successfully applied entry point Proxy-level patch to ${entryFile}`);
    } else {
      console.warn(`Could not find envAsyncLocalStorage.getStore() pattern inside ${entryFile}`);
    }
  }

  console.log(`Successfully patched ${count} files.`);
} catch (err) {
  console.error('Error patching worker files:', err);
  process.exit(1);
}

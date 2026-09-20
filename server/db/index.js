/* =========================================================
   Database layer entry point.

   Chooses the active backend:
   - PostgreSQL when DATABASE_URL is configured and reachable
   - JSON files otherwise (automatic fallback, never a crash)

   Every storefront / admin data operation must go through
   this layer (db.*). The API routes never touch the storage
   backend directly.
   ========================================================= */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const ENV_FILE = path.join(ROOT, '.env');

/* Load KEY=VALUE entries from .env into process.env.
   Existing environment variables always win. */
function loadEnv() {
  if (typeof process.loadEnvFile === 'function') {
    try {
      process.loadEnvFile(ENV_FILE);
      return;
    } catch (e) {
      if (e && e.code !== 'ENOENT') console.warn('[db] .env load warning:', e.message);
    }
  }
  if (!fs.existsSync(ENV_FILE)) return;
  const raw = fs.readFileSync(ENV_FILE, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith(';')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] == null) process.env[key] = value;
  }
}

function isTruthy(value) {
  return value === true || value === '1' || value === 'true' || value === 'yes';
}

/* Build the active adapter. Never throws: falls back to JSON. */
async function initDb(options) {
  loadEnv();

  const connectionString = process.env.DATABASE_URL && String(process.env.DATABASE_URL).trim();
  const forceJson = isTruthy(process.env.DB_BACKEND === 'json' ? '1' : process.env.DB_FORCE_JSON);

  if (connectionString && !forceJson) {
    try {
      const { createAdapter } = require('./postgres');
      const adapter = createAdapter({ connectionString, max: Number(process.env.DB_POOL_MAX) || 10 });
      await adapter.testConnection();
      console.log('[db] backend: PostgreSQL (' +
        (connectionString.includes('@') ? connectionString.split('@').pop() : 'configured') + ')');
      return adapter;
    } catch (e) {
      console.error('[db] PostgreSQL unavailable, falling back to JSON files.');
      console.error('[db]   reason: ' + e.message);
      if (options && options.hardFail) throw e;
    }
  }

  if (!connectionString) {
    console.log('[db] backend: JSON files (set DATABASE_URL in .env to use PostgreSQL).');
  } else {
    console.log('[db] backend: JSON files (explicit fallback).');
  }

  return require('./json').createAdapter();
}

module.exports = { initDb, loadEnv, ROOT };
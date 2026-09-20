/* =========================================================
   Nova migrations — applies server/db/migrations/*.sql in order.

   Usage:
     npm run db:migrate
     node server/db/migrate.js --url <DATABASE_URL>

   Each migration file is recorded in schema_migrations, so the
   same database is never applied twice. Works on any
   PostgreSQL-compatible database (Supabase, Neon, RDS, VPS…).
   ========================================================= */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { loadEnv } = require('./index');
const { normalizeConnection } = require('./postgres');

async function run(url) {
  loadEnv();
  const connectionString = String(url || process.env.DATABASE_URL || '').trim();
  if (!connectionString) {
    console.error('No DATABASE_URL. Set it in .env or pass --url <postgres://...>');
    process.exit(1);
  }

  const pool = new Pool(Object.assign({ connectionTimeoutMillis: 8000 }, normalizeConnection(connectionString)));
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (!files.length) {
    console.error('No migration files found in ' + migrationsDir);
    process.exit(1);
  }

  await pool.query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
       version INTEGER PRIMARY KEY,
       name TEXT NOT NULL,
       applied_at TIMESTAMPTZ DEFAULT now()
     )`
  );

  for (const file of files) {
    const version = parseInt(file.split('_')[0], 10);
    const name = file.replace(/^\d+_/, '').replace(/\.sql$/, '');
    const { rows } = await pool.query('SELECT 1 FROM schema_migrations WHERE version = $1', [version]);
    if (rows.length) {
      console.log(`[migrate] ${file} — already applied, skipping.`);
      continue;
    }
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(`[migrate] applying ${file} …`);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query(
        'INSERT INTO schema_migrations (version, name) VALUES ($1, $2)',
        [version, name]
      );
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  await pool.end();
  console.log('[migrate] done.');
}

if (require.main === module) {
  run().catch((e) => {
    console.error('[migrate] failed:', e.message);
    process.exit(1);
  });
}

module.exports = { run };
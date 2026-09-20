/* =========================================================
   Nova seed — imports the existing JSON data files
   (data/products.json, orders.json, settings.json,
   admin.json) into a PostgreSQL database.

   Usage:
     npm run db:seed
     node server/db/seed.js --url <DATABASE_URL> [--force]

   Without --force, only missing rows are inserted, so
   seeding is safe on an already-populated database.
   ========================================================= */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { loadEnv } = require('./index');
const { normalizeConnection } = require('./postgres');

const ROOT = path.join(__dirname, '..', '..');
const DATA_DIR = path.join(ROOT, 'data');

function readJson(name, def) {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, name), 'utf8'));
  } catch (e) {
    return def;
  }
}

async function run(argv) {
  loadEnv();
  const connectionString = String(argv.url || process.env.DATABASE_URL || '').trim();
  if (!connectionString) {
    console.error('No DATABASE_URL. Set it in .env or pass --url <postgres://...>');
    process.exit(1);
  }
  const force = argv.force === true;

  const pool = new Pool(Object.assign({ connectionTimeoutMillis: 8000 }, normalizeConnection(connectionString)));

  if (force) {
    await pool.query('TRUNCATE products, orders, settings, admin_account RESTART IDENTITY CASCADE');
  }

  /* ---------- products ---------- */
  const products = readJson('products.json', []);
  if (Array.isArray(products) && products.length) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const p of products) {
        const data = Object.assign({}, p, { id: Number(p.id) });
        await client.query(
          `INSERT INTO products (id, data) VALUES ($1, $2)
           ON CONFLICT (id) DO NOTHING`,
          [Number(p.id), JSON.stringify(data)]
        );
      }
      await client.query(
        "SELECT setval(pg_get_serial_sequence('products', 'id'), (SELECT COALESCE(MAX(id), 1) FROM products))"
      );
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
    console.log(`[seed] products: ${products.length} imported`);
  } else {
    console.log('[seed] products: no data file');
  }

  /* ---------- orders ---------- */
  const orders = readJson('orders.json', []);
  if (Array.isArray(orders) && orders.length) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const o of orders) {
        const id = Number(o.id);
        const data = Object.assign({}, o, { id });
        await client.query(
          `INSERT INTO orders (id, sid, status, product_id, created_at, updated_at, data)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO NOTHING`,
          [
            id,
            (o.sid != null ? String(o.sid) : null),
            String(o.status || 'pending'),
            (o.productId != null ? Number(o.productId) : null),
            (o.createdAt || new Date().toISOString()),
            (o.updatedAt || o.createdAt || new Date().toISOString()),
            JSON.stringify(data),
          ]
        );
      }
      await client.query(
        "SELECT setval(pg_get_serial_sequence('orders', 'id'), (SELECT COALESCE(MAX(id), 1) FROM orders))"
      );
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
    console.log(`[seed] orders: ${orders.length} imported`);
  } else {
    console.log('[seed] orders: no data file');
  }

  /* ---------- settings ---------- */
  const settings = readJson('settings.json', {});
  if (settings && typeof settings === 'object' && Object.keys(settings).length) {
    for (const [key, value] of Object.entries(settings)) {
      await pool.query(
        `INSERT INTO settings (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [String(key), JSON.stringify(value)]
      );
    }
    console.log(`[seed] settings: ${Object.keys(settings).length} keys imported`);
  } else {
    console.log('[seed] settings: no data file');
  }

  /* ---------- admin account ---------- */
  const admin = readJson('admin.json', null);
  if (admin && admin.code) {
    await pool.query(
      `INSERT INTO admin_account (id, code, pass_salt, pass_hash, name, created_at)
       VALUES (1, $1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      [
        String(admin.code),
        String(admin.passSalt || ''),
        String(admin.passHash || ''),
        String(admin.name || ''),
        (admin.createdAt || new Date().toISOString()),
      ]
    );
    console.log('[seed] admin: account imported');
  } else {
    console.log('[seed] admin: no account');
  }

  await pool.end();
  console.log('[seed] done.');
}

if (require.main === module) {
  const argv = {
    url: process.argv.find((a) => a.startsWith('--url=')),
    force: process.argv.includes('--force'),
  };
  if (argv.url) argv.url = argv.url.slice('--url='.length);
  run(argv).catch((e) => {
    console.error('[seed] failed:', e.message);
    process.exit(1);
  });
}

module.exports = { run };
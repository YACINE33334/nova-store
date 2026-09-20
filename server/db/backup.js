/* =========================================================
   Nova backup / export.

   Dumps whatever backend is active (PostgreSQL or JSON files)
   into a portable snapshot you can archive, migrate, or
   restore into any PostgreSQL:

     npm run db:backup       -> ./data/backups/nova-backup-<ts>.json
                                ./data/backups/nova-backup-<ts>.sql

   The .sql file contains the schema + INSERT statements, so it
   can be applied to any PostgreSQL-compatible database with:
     psql "DATABASE_URL" < nova-backup-<ts>.sql
   ========================================================= */
const fs = require('fs');
const path = require('path');
const { initDb, loadEnv } = require('./index');

function escStr(value) {
  if (value == null) return 'NULL';
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  return "'" + String(value).replace(/'/g, "''") + "'";
}

function toTs(value) {
  if (!value) return 'now()';
  if (value instanceof Date) return "'" + value.toISOString() + "'";
  return "'" + String(value) + "'";
}

async function main() {
  loadEnv();
  const outDir = path.resolve(process.argv.find((a) => a.startsWith('--dir=') && a.slice(6)) || path.join(__dirname, '..', '..', 'data', 'backups'));
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const db = await initDb({ hardFail: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const tag = 'nova-backup-' + ts;

  /* ---------- JSON snapshot (portable, backend-agnostic) ---------- */
  const [products, orders, settings, admin] = await Promise.all([
    db.listProducts(),
    db.listOrders(),
    db.getSettings(),
    db.getAdmin(),
  ]);
  const snapshot = { exportedAt: new Date().toISOString(), backend: db.backend, products, orders, settings, admin };
  const jsonPath = path.join(outDir, tag + '.json');
  fs.writeFileSync(jsonPath, JSON.stringify(snapshot, null, 2) + '\n');

  /* ---------- Portable SQL (schema + INSERTs) ---------- */
  let sql = '';
  sql += '-- Nova backup ' + ts + '\n';
  sql += '-- Backend: ' + db.backend + '\n\n';
  sql += 'BEGIN;\n\n';

  sql += '-- Schema (idempotent) --\n';
  const migDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migDir).filter((f) => f.endsWith('.sql')).sort();
  for (const f of files) {
    sql += '\n-- from ' + f + '\n' + fs.readFileSync(path.join(migDir, f), 'utf8') + '\n';
  }

  sql += '\n-- Products --\n';
  for (const p of products) {
    sql += 'INSERT INTO products (id, data) VALUES (' + escStr(p.id) + ', ' + escStr(JSON.stringify(p)) + ') ON CONFLICT (id) DO NOTHING;\n';
  }

  sql += '\n-- Orders --\n';
  for (const o of orders) {
    sql += 'INSERT INTO orders (id, sid, status, product_id, created_at, updated_at, data) VALUES (' +
      escStr(o.id) + ', ' + escStr(o.sid || null) + ', ' + escStr(o.status || 'pending') + ', ' +
      escStr(o.productId != null ? Number(o.productId) : null) + ', ' +
      toTs(o.createdAt) + ', ' + toTs(o.updatedAt || o.createdAt) + ', ' +
      escStr(JSON.stringify(Object.assign({}, o, { id: Number(o.id) }))) + ') ON CONFLICT (id) DO NOTHING;\n';
  }

  sql += '\n-- Settings --\n';
  for (const [key, value] of Object.entries(settings || {})) {
    sql += "INSERT INTO settings (key, value) VALUES (" + escStr(key) + ', ' + escStr(JSON.stringify(value)) + ') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;\n';
  }

  sql += '\n-- Admin --\n';
  if (admin) {
    sql += 'INSERT INTO admin_account (id, code, pass_salt, pass_hash, name, created_at) VALUES (1, ' +
      escStr(admin.code) + ', ' + escStr(admin.passSalt || '') + ', ' + escStr(admin.passHash || '') + ', ' +
      escStr(admin.name || '') + ', ' + toTs(admin.createdAt) + ') ON CONFLICT (id) DO NOTHING;\n';
  }

  sql += '\n-- Re-sync identity sequences --\n';
  sql += "SELECT setval(pg_get_serial_sequence('products', 'id'), (SELECT COALESCE(MAX(id), 1) FROM products));\n";
  sql += "SELECT setval(pg_get_serial_sequence('orders', 'id'), (SELECT COALESCE(MAX(id), 1) FROM orders));\n";
  sql += '\nCOMMIT;\n';

  const sqlPath = path.join(outDir, tag + '.sql');
  fs.writeFileSync(sqlPath, sql, 'utf8');

  console.log('[backup] JSON snapshot: ' + jsonPath);
  console.log('[backup] SQL dump:      ' + sqlPath);
  console.log('[backup] done.');
}

if (require.main === module) {
  main().catch((e) => {
    console.error('[backup] failed:', e.message);
    process.exit(1);
  });
}

module.exports = { main };
/* =========================================================
   JSON-file backend for the Nova database layer.
   Used when no PostgreSQL (DATABASE_URL) is configured, or
   as an automatic fallback when the database is unreachable.

   All query functions are async so the two backends share
   the exact same interface (see index.js for the contract).
   ========================================================= */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const DATA_DIR = path.join(ROOT, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const ADMIN_FILE = path.join(DATA_DIR, 'admin.json');

function stripBOM(raw) {
  if (raw.charCodeAt(0) === 0xFEFF) return raw.slice(1);
  return raw;
}

function readPath(file, def) {
  if (!fs.existsSync(file)) return def;
  try {
    const value = JSON.parse(stripBOM(fs.readFileSync(file, 'utf8')));
    return value == null ? def : value;
  } catch (e) {
    return def;
  }
}

function writePathAtomic(file, value) {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2) + '\n');
  fs.renameSync(tmp, file);
}

function createAdapter() {
  return {
    backend: 'json',

    /* ---------- products ---------- */
    async listProducts() {
      const list = readPath(PRODUCTS_FILE, []);
      return Array.isArray(list) ? list : [];
    },

    async getProduct(id) {
      const list = await this.listProducts();
      return list.find((p) => p.id === Number(id)) || null;
    },

    /* Upsert: inserts when product.id is missing, otherwise merges by id. */
    async saveProduct(product) {
      const list = await this.listProducts();
      if (product.id == null) {
        const id = list.reduce((m, p) => Math.max(m, Number(p.id) || 0), 0) + 1;
        const next = Object.assign({}, product, { id });
        list.push(next);
        writePathAtomic(PRODUCTS_FILE, list);
        return next;
      }
      const id = Number(product.id);
      const i = list.findIndex((p) => p.id === id);
      if (i === -1) {
        list.push(product);
      } else {
        list[i] = Object.assign({}, list[i], product, { id });
      }
      writePathAtomic(PRODUCTS_FILE, list);
      return Object.assign({}, list[i === -1 ? list.length - 1 : i]);
    },

    async deleteProduct(id) {
      const list = await this.listProducts();
      const next = list.filter((p) => p.id !== Number(id));
      if (next.length === list.length) return false;
      writePathAtomic(PRODUCTS_FILE, next);
      return true;
    },

    /* ---------- orders ---------- */
    async listOrders() {
      const list = readPath(ORDERS_FILE, []);
      return Array.isArray(list) ? list : [];
    },

    async findOrderBySid(sid) {
      if (!sid) return null;
      const list = await this.listOrders();
      return list.find((o) => o.sid === sid) || null;
    },

    /* Insert a new order, generating id + display code '#N'. */
    async createOrder(order) {
      const list = await this.listOrders();
      const nextId = list.reduce((m, o) => Math.max(m, Number(o.id) || 0), 0) + 1;
      const next = Object.assign({}, order, {
        id: nextId,
        code: '#' + nextId,
      });
      list.push(next);
      writePathAtomic(ORDERS_FILE, list);
      return Object.assign({}, next);
    },

    /* Update an existing order by id (merge full replacement). */
    async updateOrder(id, fullOrder) {
      const list = await this.listOrders();
      const i = list.findIndex((o) => o.id === Number(id));
      if (i === -1) return null;
      list[i] = Object.assign({}, fullOrder, { id: Number(id) });
      writePathAtomic(ORDERS_FILE, list);
      return Object.assign({}, list[i]);
    },

    /* Apply a batch of { id, patch } updates; returns changed count. */
    async bulkUpdateOrders(updates) {
      if (!Array.isArray(updates) || !updates.length) return 0;
      const list = await this.listOrders();
      let changed = 0;
      for (const u of updates) {
        if (!u || u.id == null) continue;
        const i = list.findIndex((o) => o.id === Number(u.id));
        if (i === -1) continue;
        list[i] = Object.assign({}, list[i], u.patch, { id: Number(u.id) });
        changed++;
      }
      if (changed) writePathAtomic(ORDERS_FILE, list);
      return changed;
    },

    /* ---------- settings ---------- */
    async getSettings() {
      return readPath(SETTINGS_FILE, {});
    },

    async saveSettings(obj) {
      writePathAtomic(SETTINGS_FILE, obj || {});
      return obj || {};
    },

    /* ---------- admin account ---------- */
    async hasAdmin() {
      return Boolean(readPath(ADMIN_FILE, null));
    },

    async getAdmin() {
      return readPath(ADMIN_FILE, null);
    },

    async saveAdmin(admin) {
      writePathAtomic(ADMIN_FILE, admin);
      return admin;
    },
  };
}

module.exports = { createAdapter, PRODUCTS_FILE, ORDERS_FILE, SETTINGS_FILE, ADMIN_FILE };
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { initDb } = require('./db');

const ROOT = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const ADMIN_DIR = path.join(ROOT, 'admin');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

/* =========================================================
   Auth: admin account + sessions. Credentials live in the
   database layer (PostgreSQL or JSON files), sessions stay
   in memory.
   ========================================================= */
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;
const sessions = new Map(); // token -> { code, createdAt }

function hashPassword(password, salt) {
  return crypto.scryptSync(String(password), salt, 64).toString('hex');
}

function verifyPassword(password, salt, expectedHex) {
  try {
    const a = Buffer.from(hashPassword(password, salt), 'hex');
    const b = Buffer.from(String(expectedHex), 'hex');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch (e) { return false; }
}

function parseCookies(req) {
  const out = {};
  const header = req.headers.cookie || '';
  header.split(';').forEach((part) => {
    const i = part.indexOf('=');
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

function getSession(req) {
  const token = parseCookies(req).nova_admin;
  if (!token) return null;
  const s = sessions.get(token);
  if (!s) return null;
  if (Date.now() - s.createdAt > SESSION_TTL) {
    sessions.delete(token);
    return null;
  }
  return s;
}

function setSession(res, code) {
  const token = crypto.randomBytes(24).toString('base64url');
  sessions.set(token, { code, createdAt: Date.now() });
  res.setHeader('Set-Cookie', 'nova_admin=' + token + '; Path=/; HttpOnly; SameSite=Lax; Max-Age=' + Math.floor(SESSION_TTL / 1000));
  return token;
}

function clearSession(res) {
  res.setHeader('Set-Cookie', 'nova_admin=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 2e6) {
        reject(Object.assign(new Error('Payload too large'), { status: 400 }));
        req.destroy();
      }
    });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch (e) { reject(Object.assign(new Error(e.message), { status: 400 })); }
    });
    req.on('error', reject);
  });
}

function readRawBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error('File too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

const DEF_LANDING = { headline: '', lead: '', cta: 'Buy Now', ctaLink: '#add', active: true };

function normalizeNewProduct(body) {
  return Object.assign({}, body, {
    rating: Number(body.rating) || 4.5,
    reviews: Number(body.reviews) || 0,
    images: Array.isArray(body.images) ? body.images : [],
    reviewsArray: Array.isArray(body.reviewsArray) ? body.reviewsArray : [],
    sku: body.sku || '',
    material: body.material || '',
    origen: body.origen || '',
    sold: body.sold == null ? null : Number(body.sold),
    low30: body.low30 !== false,
    landing: Object.assign({}, DEF_LANDING, body.landing || {}),
  });
}

/* =========================================================
   API routes — the only integration point between the
   Storefront / Admin Panel and the database layer (db).
   Nothing here depends on Supabase or on PostgreSQL.
   ========================================================= */
function createApiRoutes(db) {
  return async function apiRoutes(req, res, urlPath) {
    const method = req.method;

    // Admin-only API guard: mutating store data and reading orders require a session
    // (GET /api/products, POST /api/orders and GET /api/settings stay public for the storefront)
    if (['/api/products', '/api/settings', '/api/i18n', '/api/upload'].includes(urlPath) &&
        (method === 'POST' || method === 'DELETE' || method === 'PUT')) {
      if (!getSession(req)) {
        sendJson(res, 401, { error: 'No autenticado' });
        return true;
      }
    }
    if (urlPath === '/api/orders' && (method === 'GET' || method === 'HEAD')) {
      if (!getSession(req)) {
        sendJson(res, 401, { error: 'No autenticado' });
        return true;
      }
    }

    // GET /api/products  |  GET /api/products?id=N
    if (urlPath === '/api/products' && (method === 'GET' || method === 'HEAD')) {
      if (method === 'HEAD') { res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(); return true; }
      const id = Number(req.url.split('?')[1] ? new URLSearchParams(req.url.split('?')[1]).get('id') : NaN);
      if (req.url.includes('?') && !Number.isNaN(id)) {
        const p = await db.getProduct(id);
        sendJson(res, p ? 200 : 404, p || { error: 'Not found' });
      } else {
        sendJson(res, 200, await db.listProducts());
      }
      return true;
    }

    // POST /api/products — create (no id) or update (with id)
    if (urlPath === '/api/products' && method === 'POST') {
      const body = await readJsonBody(req);
      if (typeof body !== 'object' || !body || Array.isArray(body)) {
        sendJson(res, 400, { error: 'Invalid product payload' });
        return true;
      }
      let product = body;
      if (product.id == null) {
        product = normalizeNewProduct(body);
      } else {
        product = Object.assign({}, body, {
          id: Number(body.id),
          landing: Object.assign({}, DEF_LANDING, body.landing || {}),
        });
        const existing = await db.getProduct(product.id);
        if (existing) product = Object.assign({}, existing, product);
      }
      const saved = await db.saveProduct(product);
      sendJson(res, 201, saved);
      return true;
    }

    // DELETE /api/products?id=N
    if (urlPath === '/api/products' && method === 'DELETE') {
      const q = req.url.split('?')[1];
      const id = q ? Number(new URLSearchParams(q).get('id')) : NaN;
      if (Number.isNaN(id)) {
        sendJson(res, 400, { error: 'Missing ?id=' });
        return true;
      }
      const deleted = await db.deleteProduct(id);
      if (!deleted) {
        sendJson(res, 404, { error: 'Not found' });
        return true;
      }
      sendJson(res, 200, { ok: true });
      return true;
    }

    // GET /api/settings — read store settings (public)
    if (urlPath === '/api/settings' && (method === 'GET' || method === 'HEAD')) {
      sendJson(res, 200, await db.getSettings());
      return true;
    }

    // POST /api/settings — update store settings
    if (urlPath === '/api/settings' && method === 'POST') {
      const body = await readJsonBody(req);
      if (typeof body !== 'object' || !body || Array.isArray(body)) {
        sendJson(res, 400, { error: 'Invalid settings payload' });
        return true;
      }
      await db.saveSettings(body);
      sendJson(res, 200, { ok: true });
      return true;
    }

    // GET /api/i18n — checkout translations overrides (public, storefront reads it)
    if (urlPath === '/api/i18n' && (method === 'GET' || method === 'HEAD')) {
      if (method === 'HEAD') { res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(); return true; }
      const s = await db.getSettings();
      sendJson(res, 200, (s && s.checkoutI18n && typeof s.checkoutI18n === 'object') ? s.checkoutI18n : {});
      return true;
    }

    // POST /api/i18n — save checkout translations overrides (admin)
    if (urlPath === '/api/i18n' && method === 'POST') {
      const body = await readJsonBody(req);
      if (typeof body !== 'object' || !body || Array.isArray(body)) {
        sendJson(res, 400, { error: 'Invalid translation payload' });
        return true;
      }
      const s = await db.getSettings();
      const clean = {};
      Object.keys(body).forEach((k) => {
        const v = String(body[k] == null ? '' : body[k]).trim();
        if (v !== '') clean[k] = v;
      });
      s.checkoutI18n = clean;
      await db.saveSettings(s);
      sendJson(res, 200, { ok: true, count: Object.keys(clean).length });
      return true;
    }

    // POST /api/upload — receive an image and hand its bytes to the database
    // directly as a base64 data-URL (kept inside the product/settings JSON).
    // Nothing is written to disk, so image data lives only in Supabase.
    if (urlPath === '/api/upload' && method === 'POST') {
      const contentType = (req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
      const extMap = {
        'image/png': '.png',
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/webp': '.webp',
        'image/svg+xml': '.svg',
        'image/gif': '.gif',
      };
      const ext = extMap[contentType];
      if (!ext) {
        sendJson(res, 400, { error: 'Unsupported image type. Use PNG, JPG, WEBP, GIF or SVG.' });
        return true;
      }
      const buf = await readRawBody(req, 8 * 1024 * 1024);
      if (!buf.length) {
        sendJson(res, 400, { error: 'Empty body' });
        return true;
      }
      const MAX_SIZE = 4 * 1024 * 1024;
      if (buf.length > MAX_SIZE) {
        sendJson(res, 413, { error: 'Image too large. Max 4 MB.' });
        return true;
      }
      const dataUrl = 'data:' + contentType + ';base64,' + buf.toString('base64');
      sendJson(res, 201, { url: dataUrl, size: buf.length, type: contentType });
      return true;
    }

    // GET /api/orders — list all orders (newest first) [admin session required above]
    if (urlPath === '/api/orders' && (method === 'GET' || method === 'HEAD')) {
      if (method === 'HEAD') { res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(); return true; }
      const list = await db.listOrders();
      sendJson(res, 200, list.slice().reverse());
      return true;
    }

    // POST /api/orders — create/update order from Buy Now form.
    //  - with { action:'draft' } (or draft flag): idempotent upsert of a draft by
    //    checkout sid → one draft per checkout, status 'draft'.
    //  - otherwise (submit): if body.sid matches an existing draft, the SAME order
    //    is updated and moves draft → pending; else a new order is created.
    if (urlPath === '/api/orders' && method === 'POST') {
      const body = await readJsonBody(req);
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        sendJson(res, 400, { error: 'Invalid order payload' });
        return true;
      }
      const productId = Number(body.productId);
      const product = await db.getProduct(productId);
      if (!product) {
        sendJson(res, 404, { error: 'Product not found' });
        return true;
      }
      const qty = Math.max(1, Math.min(99, Number(body.qty) || 1));
      const name = String(body.name || '').trim();
      const phone = String(body.phone || '').trim();
      const location = String(body.location || '').trim();
      const sid = String(body.sid || '').trim();
      const isDraft = body.action === 'draft' || body.draft === true || body.draft === '1';

      const existing = sid ? await db.findOrderBySid(sid) : null;

      if (isDraft) {
        const anyData = name || phone || location || body.address || body.city || body.zip;
        if (!anyData) {
          sendJson(res, 200, { ok: true, saved: 0 });
          return true;
        }
        const now = new Date().toISOString();
        const patch = {
          productId: product.id,
          productName: product.name,
          price: Number(product.price) || 0,
          qty: qty,
          total: (Number(product.price) || 0) * qty,
          name: name,
          phone: phone,
          location: location,
          address: String(body.address || '').trim(),
          piso: String(body.piso || '').trim(),
          zip: String(body.zip || '').trim(),
          city: String(body.city || '').trim(),
          province: String(body.province || '').trim(),
          lat: Number.isFinite(Number(body.lat)) ? Number(body.lat) : null,
          lng: Number.isFinite(Number(body.lng)) ? Number(body.lng) : null,
        };
        if (existing) {
          // merge: keep previous values when the new ones are empty
          Object.keys(patch).forEach((k) => {
            if (patch[k] != null && patch[k] !== '') existing[k] = patch[k];
          });
          const updated = await db.updateOrder(existing.id, Object.assign({}, existing, {
            status: 'draft',
            updatedAt: now,
          }));
          sendJson(res, 200, { ok: true, saved: 1, draft: updated });
          return true;
        }
        const order = Object.assign({
          sid: sid || null,
          status: 'draft',
          createdAt: now,
          updatedAt: now,
        }, patch);
        const created = await db.createOrder(order);
        sendJson(res, 201, { ok: true, saved: 1, draft: created });
        return true;
      }

      // ---- final submit ----
      if (!name || !phone || !location) {
        sendJson(res, 400, { error: 'name, phone and location are required' });
        return true;
      }
      const now = new Date().toISOString();
      if (existing) {
        const updated = await db.updateOrder(existing.id, Object.assign({}, existing, {
          name: name,
          phone: phone,
          location: location,
          address: String(body.address || '').trim(),
          piso: String(body.piso || '').trim(),
          zip: String(body.zip || '').trim(),
          city: String(body.city || '').trim(),
          province: String(body.province || '').trim(),
          qty: qty,
          total: (Number(product.price) || 0) * qty,
          status: 'pending',
          updatedAt: now,
        }));
        sendJson(res, 200, updated);
        return true;
      }
      const order = {
        sid: sid || null,
        productId: product.id,
        productName: product.name,
        price: Number(product.price) || 0,
        qty: qty,
        total: (Number(product.price) || 0) * qty,
        name: name,
        phone: phone,
        location: location,
        address: String(body.address || '').trim(),
        piso: String(body.piso || '').trim(),
        zip: String(body.zip || '').trim(),
        city: String(body.city || '').trim(),
        province: String(body.province || '').trim(),
        lat: Number.isFinite(Number(body.lat)) ? Number(body.lat) : null,
        lng: Number.isFinite(Number(body.lng)) ? Number(body.lng) : null,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      };
      const created = await db.createOrder(order);
      sendJson(res, 201, created);
      return true;
    }

    // PUT /api/orders — update one or more orders from the spreadsheet (admin only)
    if (urlPath === '/api/orders' && method === 'PUT') {
      if (!getSession(req)) {
        sendJson(res, 401, { error: 'No autenticado' });
        return true;
      }
      const body = await readJsonBody(req);
      const updates = Array.isArray(body) ? body : (body && body.updates);
      if (!Array.isArray(updates)) {
        sendJson(res, 400, { error: 'Expected an array of order updates' });
        return true;
      }
      const ALLOWED = ['name', 'phone', 'address', 'piso', 'city', 'zip', 'province', 'status'];
      const clean = [];
      for (const u of updates) {
        if (!u || u.id == null) continue;
        const id = Number(u.id);
        const patch = u.patch || u;
        const np = {};
        for (const k of ALLOWED) {
          if (patch[k] !== undefined) np[k] = String(patch[k] == null ? '' : patch[k]).trim();
        }
        if (Object.keys(np).length) clean.push({ id, patch: np });
      }
      const changed = await db.bulkUpdateOrders(clean);
      sendJson(res, 200, { ok: true, changed });
      return true;
    }

    // POST /api/auth/setup — create the admin account (only when none exists)
    if (urlPath === '/api/auth/setup' && method === 'POST') {
      const body = await readJsonBody(req);
      if (await db.hasAdmin()) {
        sendJson(res, 409, { error: 'Ya existe una cuenta de administrador' });
        return true;
      }
      const code = String(body.code || '').trim();
      const password = String(body.password || '');
      if (code.length < 3) {
        sendJson(res, 400, { error: 'El código debe tener al menos 3 caracteres' });
        return true;
      }
      if (password.length < 6) {
        sendJson(res, 400, { error: 'La contraseña debe tener al menos 6 caracteres' });
        return true;
      }
      const salt = crypto.randomBytes(16).toString('hex');
      await db.saveAdmin({
        code: code,
        passSalt: salt,
        passHash: hashPassword(password, salt),
        name: String(body.name || '').trim(),
        createdAt: new Date().toISOString(),
      });
      setSession(res, code);
      sendJson(res, 200, { ok: true, code: code });
      return true;
    }

    // POST /api/auth/login — validate code + password
    if (urlPath === '/api/auth/login' && method === 'POST') {
      const body = await readJsonBody(req);
      const admin = await db.getAdmin();
      if (!admin) {
        sendJson(res, 409, { error: 'Aún no hay una cuenta de administrador configurada' });
        return true;
      }
      const code = String(body.code || '').trim();
      const password = String(body.password || '');
      if (code !== admin.code || !verifyPassword(password, admin.passSalt, admin.passHash)) {
        sendJson(res, 401, { error: 'El código o la contraseña son incorrectos' });
        return true;
      }
      setSession(res, admin.code);
      sendJson(res, 200, { ok: true, code: admin.code });
      return true;
    }

    // POST /api/auth/logout — clear the session
    if (urlPath === '/api/auth/logout' && method === 'POST') {
      const token = parseCookies(req).nova_admin;
      if (token) sessions.delete(token);
      clearSession(res);
      sendJson(res, 200, { ok: true });
      return true;
    }

    // GET /api/auth/me — current admin session (for page guard)
    if (urlPath === '/api/auth/me' && (method === 'GET' || method === 'HEAD')) {
      const s = getSession(req);
      if (!s) {
        sendJson(res, 401, { error: 'No autenticado' });
        return true;
      }
      const admin = (await db.getAdmin()) || {};
      sendJson(res, 200, { code: s.code, name: admin.name || '' });
      return true;
    }

    // GET /api/auth/status — public: is admin configured? is this browser in?
    if (urlPath === '/api/auth/status' && (method === 'GET' || method === 'HEAD')) {
      sendJson(res, 200, { setup: Boolean(await db.hasAdmin()), loggedIn: Boolean(getSession(req)) });
      return true;
    }

    return false;
  };
}

function cacheControl(filePath, res) {
  res.setHeader('Cache-Control', 'no-cache');
  const mtime = fs.statSync(filePath).mtime.toUTCString();
  res.setHeader('Last-Modified', mtime);
}

function serveStatic(req, res) {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);

  if (urlPath === '/' || urlPath === '') {
    urlPath = '/index.html';
  }

  let filePath = path.join(PUBLIC_DIR, urlPath);

  // Admin route detection: /admin or /admin/anything serves admin/index.html for SPA, assets serve directly
  if (urlPath.startsWith('/admin')) {
    const rel = urlPath.replace(/^\/admin/, '');
    const isLoginPage = rel === '/login' || rel === '/login.html';
    const isAsset = urlPath.startsWith('/admin/assets/');
    if (!isLoginPage && !isAsset && !getSession(req)) {
      res.writeHead(302, { Location: '/admin/login' });
      res.end();
      return;
    }
    if (rel === '' || rel === '/') {
      filePath = path.join(ADMIN_DIR, 'index.html');
    } else if (isLoginPage) {
      filePath = path.join(ADMIN_DIR, 'login.html');
    } else {
      const candidate = path.join(ADMIN_DIR, rel.replace(/^\//, ''));
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        filePath = candidate;
      } else {
        filePath = path.join(ADMIN_DIR, 'index.html');
      }
    }
  }

  const resolved = path.normalize(filePath);
  if (!resolved.startsWith(PUBLIC_DIR) && !resolved.startsWith(ADMIN_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';
    const mtime = stats.mtime.toUTCString();

    if (req.headers['if-modified-since'] === mtime) {
      res.writeHead(304, { 'Cache-Control': 'no-cache', 'Last-Modified': mtime });
      res.end();
      return;
    }

    cacheControl(filePath, res);
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
}

async function main() {
  const db = await initDb();

  const PORT = Number(process.env.PORT) || 3000;
  const apiRoutes = createApiRoutes(db);

  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);

    // Health probe for hosting platforms (Render, Railway, VPS monitors)
    if (urlPath === '/healthz' && (req.method === 'GET' || req.method === 'HEAD')) {
      sendJson(res, 200, { ok: true, db: db.backend });
      return;
    }

    // API routes short-circuit before static serving
    if (urlPath.startsWith('/api/')) {
      apiRoutes(req, res, urlPath).then((handled) => {
        if (!handled) sendJson(res, 404, { error: 'Unknown API route: ' + urlPath });
      }).catch((e) => {
        const status = e && e.status === 400 ? 400 : 500;
        if (!res.headersSent) {
          sendJson(res, status, { error: (status === 400 ? 'Bad JSON: ' : 'Internal error: ') + e.message });
        } else {
          console.error(e);
        }
      });
      return;
    }

    if (req.method === 'GET' || req.method === 'HEAD') {
      serveStatic(req, res);
    } else {
      res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Method Not Allowed');
    }
  });

  server.listen(PORT, () => {
    console.log(`Project Nova running at http://localhost:${PORT}`);
    console.log(`  Storefront:  http://localhost:${PORT}/`);
    console.log(`  Admin login: http://localhost:${PORT}/admin/login`);
  });
}

main().catch((e) => {
  console.error('Failed to start:', e);
  process.exit(1);
});
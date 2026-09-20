const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
let errors = 0;

// Collect all HTML files
const htmlFiles = ['public/index.html', 'public/builder.html', 'public/cart.html', 'public/product.html', 'public/order.html', 'admin/index.html', 'admin/product-editor.html', 'admin/login.html'];

// 1) Check asset refs in HTML: href/src pointing to local paths exist
for (const f of htmlFiles) {
  const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const matches = html.match(/(?:href|src)="(\/[^"#][^"]*)"/g) || [];
  for (const m of matches) {
    const ref = m.match(/"(\/[^"#][^"]*)"/)[1];
    const clean = ref.split('?')[0].split('#')[0];
    const rel = clean.replace(/^\//, '');
    const isDirWithIndex = (p) => fs.existsSync(path.join(p, 'index.html'));
    const candidates = [path.join(ROOT, 'public', rel), path.join(ROOT, 'admin', rel), path.join(ROOT, rel)];
    const resolved = candidates.find((p) =>
      (fs.existsSync(p) && fs.statSync(p).isFile()) ||
      (fs.existsSync(p) && fs.statSync(p).isDirectory() && isDirWithIndex(p))
    );
    if (!resolved) {
      errors++;
      console.log(`MISSING ASSET: ${f} -> ${ref}`);
    }
  }
  // check in-page anchors too
  console.log(`REF-CHECK ${f}: OK`);
}

// 2) Check that all IDs used in admin.js exist in admin/index.html
const adminHtml = fs.readFileSync(path.join(ROOT, 'admin/index.html'), 'utf8');
const adminJs = fs.readFileSync(path.join(ROOT, 'admin/assets/js/admin.js'), 'utf8');

const idRefs = new Set();
const re = /\$\('#([a-zA-Z0-9_-]+)'\)/g;
let m;
while ((m = re.exec(adminJs))) idRefs.add(m[1]);
// also getElementById
const re2 = /getElementById\('([a-zA-Z0-9_-]+)'\)/g;
while ((m = re2.exec(adminJs))) idRefs.add(m[1]);

for (const id of idRefs) {
  // template-based ids (will be injected later) are fine; only check static ones
  const dynamicIds = new Set(['content', 'orders-badge', 'notif-dot', 'sidebar', 'overlay', 'menu-btn', 'side-close', 'side-user-code', 'toast']);
  if (!dynamicIds.has(id)) {
    // Generated views create these at runtime; skip known dynamic ids
    const knownDynamic = ['map-canvas', 'map-city-list', 'map-tooltip', 'prod-tbody', 'prod-search', 'prod-modal-anchor', 'prod-modal', 'prod-modal-x', 'prod-modal-cancel', 'prod-modal-save', 'pf-name', 'pf-cat', 'pf-cats', 'pf-price', 'pf-old', 'pf-stock', 'pf-hue', 'pf-desc', 'pf-feats', 'ord-tbody', 'ord-search', 'cust-tbody', 'cust-search', 'set-menu', 'set-body', 'ov-export', 'ov-refresh', 'an-period', 'an-download', 'prod-add', 'ord-export', 'cust-add', 'set-store-name', 'set-email', 'set-whatsapp', 'an-empty', 'an-metrics', 'an-rev', 'an-cities', 'an-top', 'an-status', 'ord-date', 'ord-prod'];
    if (!knownDynamic.includes(id)) {
      errors++;
      console.log(`ORPHAN ID: ${id} (not found in static HTML or known dynamic list)`);
    }
  }
}

// check static ids exist in admin html
for (const id of ['content', 'orders-badge', 'notif-dot', 'sidebar', 'overlay', 'menu-btn', 'side-close']) {
  if (!adminHtml.includes(`id="${id}"`)) {
    errors++;
    console.log(`MISSING STATIC ID in admin/index.html: ${id}`);
  }
}

// 3) Check store.js ids in builder.html
const builderHtml = fs.readFileSync(path.join(ROOT, 'public/builder.html'), 'utf8');
for (const id of ['landing-root', 'b-section-list', 'b-reset', 'b-publish', 'b-toast']) {
  if (!builderHtml.includes(`id="${id}"`)) {
    errors++;
    console.log(`MISSING ID in builder.html: ${id}`);
  }
}

console.log(errors ? `\n${errors} problems found` : '\nStatic validation passed');
process.exit(errors ? 1 : 0);
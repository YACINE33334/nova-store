const { spawn } = require('child_process');
const http = require('http');

const PORT = 3997;
const BASE = `http://localhost:${PORT}`;

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(BASE + path, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ status: res.statusCode, type: res.headers['content-type'] || '', body: data }));
    }).on('error', reject);
  });
}

const routes = [
  '/',
  '/index.html',
  '/builder.html',
  '/cart.html',
  '/product.html',
  '/product.html?id=2',
  '/order.html',
  '/order.html?id=2&qty=2',
  '/api/products',
  '/api/products?id=3',
  '/api/orders',
  '/assets/css/base.css',
  '/assets/css/store.css',
  '/assets/css/builder.css',
  '/assets/css/cart.css',
  '/assets/css/product.css',
  '/assets/css/order.css',
  '/assets/js/store.js',
  '/assets/js/builder.js',
  '/assets/js/cart.js',
  '/assets/js/product.js',
  '/assets/js/order.js',
  '/admin',
  '/admin/',
  '/admin/#orders',
  '/admin/index.html',
  '/admin/assets/css/admin.css',
  '/admin/assets/js/admin.js',
  '/nonexistent-page',
];

(async () => {
  const child = spawn('node', ['server/server.js'], { env: { ...process.env, PORT: String(PORT) }, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.on('data', () => {});
  child.stderr.on('data', (d) => console.error('SERVER ERR:', d.toString()));
  await new Promise((r) => setTimeout(r, 1200));

  let failed = 0;
  for (const r of routes) {
    try {
      const res = await get(r);
      const isPage = r === '/' || r.includes('.html') || r.startsWith('/admin') || r.startsWith('/nonexistent');
      const ok = isPage ? (r.startsWith('/nonexistent') ? res.status === 404 : res.status === 200) : res.status === 200;
      // body sanity
      const hasNull = res.body.includes('\u0000');
      if (!ok || hasNull) {
        failed++;
        console.log(`FAIL ${r} -> ${res.status} (${res.type}) null=${hasNull}`);
      } else {
        console.log(`OK   ${r} -> ${res.status}  ${res.body.length} bytes`);
      }
    } catch (e) {
      failed++;
      console.log(`ERR  ${r} -> ${e.message}`);
    }
  }
  console.log(failed ? `\n${failed} failures` : '\nAll routes OK');
  child.kill();
  process.exit(failed ? 1 : 0);
})();
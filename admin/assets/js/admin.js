/* =========================================================
   NOVA — Admin Dashboard application
   Arabic RTL control panel
   ========================================================= */
(function () {
  'use strict';

  /* ---------------- Auth guard (Shopify-style) ---------------- */
  fetch('/api/auth/me', { cache: 'no-store' })
    .then((r) => {
      if (r.status === 401) {
        location.replace('/admin/login');
        return null;
      }
      return r.json();
    })
    .then((me) => {
      if (me && me.code) {
        const el = document.getElementById('side-user-code');
        if (el) el.textContent = me.code;
      }
    })
    .catch(() => {});

  /* ---------------- UI helpers ---------------- */
  const fmtMoney = (n) => {
    const s = Math.abs(n).toLocaleString('en-US');
    return (n < 0 ? '-$' : '$') + s;
  };
  const fmtNum = (n) => n.toLocaleString('en-US');
  const fmtPct = (n) => n.toFixed(1) + '%';

  const $ = (sel, scope) => (scope || document).querySelector(sel);
  const $$ = (sel, scope) => Array.from((scope || document).querySelectorAll(sel));

  const AVATAR_COLORS = ['#008060', '#7a5af8', '#ee46bc', '#12b76a', '#f79009', '#f04438', '#2e90fa'];
  const avatarColor = (seed) => AVATAR_COLORS[Math.abs(stringHash(seed)) % AVATAR_COLORS.length];
  function stringHash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
    return h;
  }

  function toast(msg, type) {
    let el = $('#toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.className = 'toast show' + (type === 'success' ? ' success' : '');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 2000);
  }

  /* ---------------- Custom confirm dialog (replaces native confirm) ---------------- */
  function showConfirm(opts) {
    const ovl = document.createElement('div');
    ovl.className = 'confirm-overlay';
    ovl.innerHTML = `
      <div class="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
        <div class="confirm-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>
        </div>
        <h3 class="confirm-title" id="confirm-title">${opts.title || 'تأكيد'}</h3>
        <p class="confirm-msg">${opts.message || ''}</p>
        <div class="confirm-actions">
          <button type="button" class="btn btn-secondary" data-confirm-cancel>إلغاء</button>
          <button type="button" class="btn ${opts.danger ? 'btn-danger' : 'btn-primary'}" data-confirm-ok>${opts.confirmText || 'تأكيد'}</button>
        </div>
      </div>`;
    document.body.appendChild(ovl);
    const close = () => {
      document.removeEventListener('keydown', onKey);
      ovl.remove();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    ovl.addEventListener('click', (e) => {
      if (e.target === ovl) close();
    });
    $( '[data-confirm-cancel]', ovl).addEventListener('click', close);
    $( '[data-confirm-ok]', ovl).addEventListener('click', () => {
      close();
      if (opts.onConfirm) opts.onConfirm();
    });
    requestAnimationFrame(() => ovl.classList.add('show'));
  }

  const icons = {
    visits: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
    orders: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h12l-1.2 12.2a1.5 1.5 0 0 1-1.5 1.3H8.7a1.5 1.5 0 0 1-1.5-1.3L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>',
    revenue: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    conv: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 7 13.5 15.5 8.5 10.5 2 17"/><path d="M16 7h6v6"/></svg>',
    aov: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/><path d="M8 15h4"/></svg>',
    customers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17.5" cy="9" r="2.5"/><path d="M16 14.5a4.5 4.5 0 0 1 5.5 4.4"/></svg>',
    trendUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="m6 15 4-4 3 3 5-6"/></svg>',
    trendDn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="m6 9 4 4 3-3 5 6"/></svg>',
  };

  /* ---------------- Mock data ---------------- */
  const metrics = {
    visits: { value: '128,430', delta: 12.4, trend: 'up', color: 'var(--sky)' },
    orders: { value: '3,842', delta: 8.1, trend: 'up', color: 'var(--success)' },
    revenue: { value: '$284,590', delta: 15.2, trend: 'up', color: 'var(--purple)' },
    conv: { value: '3.2%', delta: 0.6, trend: 'up', color: 'var(--pink)' },
    aov: { value: '$74.05', delta: 4.3, trend: 'up', color: 'var(--warning)' },
    newcust: { value: '1,204', delta: 2.8, trend: 'down', color: 'var(--teal)' },
  };

  const revenueSeries = [32, 41, 46, 38, 55, 62, 58, 71, 68, 82, 76, 95];
  const visitorsSeries = [4200, 5100, 4800, 6200, 5500, 7400, 6900, 8200, 7900, 9100, 8800, 10400];
  const monthsLabels = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

  const seedOrders = [
    { id: '#10284', customer: 'ليلى الموسى', email: 'laila@sample.com', date: '5 سبتمبر', total: 289.0, status: 'paid', items: 3 },
    { id: '#10283', customer: 'أحمد الشمري', email: 'ahmed@sample.com', date: '5 سبتمبر', total: 74.05, status: 'pending', items: 1 },
    { id: '#10282', customer: 'سارة النعيمي', email: 'sara@sample.com', date: '4 سبتمبر', total: 512.0, status: 'processing', items: 4 },
    { id: '#10281', customer: 'عمر الحسني', email: 'omar@sample.com', date: '4 سبتمبر', total: 130.0, status: 'paid', items: 2 },
    { id: '#10280', customer: 'نورة القحطاني', email: 'noura@sample.com', date: '3 سبتمبر', total: 46.0, status: 'cancelled', items: 1 },
    { id: '#10279', customer: 'خالد العتيبي', email: 'khaled@sample.com', date: '3 سبتمبر', total: 358.0, status: 'paid', items: 5 },
    { id: '#10278', customer: 'ريم الدوسري', email: 'reem@sample.com', date: '2 سبتمبر', total: 104.0, status: 'refunded', items: 2 },
    { id: '#10277', customer: 'فهد العنزي', email: 'fahad@sample.com', date: '2 سبتمبر', total: 190.0, status: 'delivered', items: 2 },
  ];
  let liveOrders = [];
  function allOrders() { return liveOrders.concat(seedOrders); }
  const pendingOrdersCount = () => allOrders().filter((o) => o.status === 'pending' || o.status === 'processing').length;

  const pad2 = (n) => String(n).padStart(2, '0');
  function fmtOrderDate(o) {
    if (o.createdAt) {
      const d = new Date(o.createdAt);
      if (!isNaN(d)) return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
    }
    return o.date || '';
  }
  function fmtOrderTotal(o) {
    return Number((o.total != null ? o.total : (o.price || 0) * (o.qty || 1)));
  }
  function fmtOrderItems(o) {
    return o.qty || o.items || 1;
  }
  function fmtOrderEmail(o) {
    return o.email || o.phone || '';
  }

  /* ---------------- Live product store (from /api/products) ---------------- */
  const productSeed = [
    { id: 1, name: 'Aurelia Linen Shirt', sku: 'AP-1201', sold: 84, hue: '#e7ecf3' },
    { id: 2, name: 'Meridian Wool Coat', sku: 'OW-32', sold: 61, hue: '#ece8df' },
    { id: 3, name: 'Oslo Ceramic Mug', sku: 'HM-11', sold: 210, hue: '#e5ece9' },
    { id: 4, name: 'Nordic Lounge Chair', sku: 'FN-08', sold: 27, hue: '#f0e6dd' },
    { id: 5, name: 'Silk Scarf — Folia', sku: 'AC-45', sold: 132, hue: '#e3e4ee' },
    { id: 6, name: 'Terraplanter X', sku: 'HM-19', sold: 55, hue: '#e6ede4' },
    { id: 7, name: 'Vela Table Lamp', sku: 'LT-03', sold: 41, hue: '#f1e9e0' },
    { id: 8, name: 'Strada Leather Tote', sku: 'AC-51', sold: 19, hue: '#e6e3dc' },
  ];

  let productStore = productSeed.slice();

  async function apiFetch(url, opts) {
    const res = await fetch(url, opts);
    if (!res.ok) {
      let msg = 'HTTP ' + res.status;
      try { const t = await res.json(); if (t && t.error) msg = t.error; } catch (e) { /* ignore */ }
      throw new Error(msg);
    }
    return res.json();
  }
  const apiProducts = () => apiFetch('/api/products', { cache: 'no-store' });
  const apiSaveProduct = (p) => apiFetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) });
  const apiDeleteProduct = (id) => apiFetch('/api/products?id=' + id, { method: 'DELETE' });

  function toAdminRow(p) {
    const s = productSeed.find((x) => x.id === Number(p.id)) || {};
    return Object.assign({ sku: s.sku || 'SKU-' + p.id, sold: s.sold != null ? s.sold : 0 }, p);
  }

  async function loadProducts() {
    try {
      const list = await apiProducts();
      if (Array.isArray(list) && list.length) {
        productStore = list.map(toAdminRow);
        const view = getView();
        if (view === 'products' || view === 'overview') views[view]();
      }
    } catch (e) { /* keep the seed store */ }
  }

  const cities = [
    { name: 'الرياض', count: 1240 },
    { name: 'جدة', count: 980 },
    { name: 'دبي', count: 720 },
    { name: 'أبوظبي', count: 540 },
    { name: 'الدوحة', count: 410 },
    { name: 'مسقط', count: 260 },
  ];
  const cityMax = Math.max(...cities.map((c) => c.count));

  // Dotted map coordinates (within 0..100)
  const cityPoints = { 'الرياض': [55, 62], 'جدة': [43, 55], 'دبي': [78, 38], 'أبوظبي': [72, 42], 'الدوحة': [68, 47], 'مسقط': [82, 58] };

  /* ==================================================== */
  /*  VIEW RENDERING                                       */
  /* ==================================================== */

  const views = {};

  /* ---------- SVG chart builders ---------- */
  function lineChart(data, opts) {
    opts = opts || {};
    const W = 640, H = 220, padL = 8, padR = 8, padT = 14, padB = 28;
    const innerW = W - padL - padR, innerH = H - padT - padB;
    const min = Math.min(...data), max = Math.max(...data);
    const range = max - min || 1;
    const stepX = innerW / (data.length - 1);
    const y = (v) => padT + innerH - ((v - min) / range) * innerH;

    let pts = data.map((v, i) => [padL + i * stepX, y(v)]);
    const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const area = 'M' + pts[0][0].toFixed(1) + ' ' + (padT + innerH).toFixed(1) + ' ' + line + ' L' + pts[pts.length - 1][0].toFixed(1) + ' ' + (padT + innerH).toFixed(1) + ' Z';

    const grid = [0.25, 0.5, 0.75].map((f) => {
      const yy = padT + innerH * f;
      return `<line x1="${padL}" y1="${yy}" x2="${W - padR}" y2="${yy}" stroke="var(--line)" stroke-width="1" stroke-dasharray="4 4"/>`;
    }).join('');

    const fill = opts.fill || '#008060';
    const stroke = opts.stroke || '#008060';

    const dots = pts.map((p, i) =>
      `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3" fill="${stroke}"><title>${monthsLabels[i]}: ${fmtNum(data[i])}</title></circle>`
    ).join('');

    const labels = monthsLabels.map((m, i) =>
      `<text x="${pts[i][0].toFixed(1)}" y="${H - 8}" text-anchor="middle" font-size="11" fill="var(--ink-muted)" font-family="inherit">${m.slice(0, 3)}</text>`
    ).join('');

    return `
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="الرسم البياني">
        <defs><linearGradient id="lg-${opts.id || 'g'}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${stroke}" stop-opacity="0.22"/>
          <stop offset="100%" stop-color="${stroke}" stop-opacity="0.01"/>
        </linearGradient></defs>
        ${grid}
        <path d="${area}" fill="url(#lg-${opts.id || 'g'})"/>
        <path d="${line}" fill="none" stroke="${stroke}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        ${dots}
        ${labels}
      </svg>`;
  }

  function barsChart(data, opts) {
    opts = opts || {};
    const W = 480, H = 220, padT = 16, padB = 28, pad = 12;
    const innerW = W - pad * 2, innerH = H - padT - padB;
    const max = Math.max(...data);
    const bw = innerW / data.length;
    const barW = Math.min(30, bw * 0.55);
    const color = opts.color || '#008060';

    const bars = data.map((v, i) => {
      const h = (v / max) * innerH;
      const x = pad + i * bw + (bw - barW) / 2;
      const y = padT + innerH - h;
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" rx="5" fill="${color}" opacity="0.85"><title>${monthsLabels[i]}: ${fmtNum(v)}</title></rect>`;
    }).join('');

    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="الرسم البياني الشريطي">${bars}</svg>`;
  }

  function donutChart(data, labels, colors) {
    const total = data.reduce((a, b) => a + b, 0);
    const R = 70, C = 2 * Math.PI * R;
    let acc = 0;
    const segs = data.map((v, i) => {
      const frac = v / total;
      const dash = frac * C;
      const offset = C * (0.25 - acc);
      acc += frac;
      return `<circle r="${R}" cx="100" cy="100" fill="none" stroke="${colors[i]}" stroke-width="20" stroke-dasharray="${dash} ${C - dash}" stroke-dashoffset="${offset}" transform="rotate(-90 100 100)"><title>${labels[i]}: ${fmtMoney(v)}</title></circle>`;
    }).join('');
    return `
      <svg viewBox="0 0 200 200" width="190" height="190" role="img">
        <circle cx="100" cy="100" r="${R}" fill="none" stroke="var(--line)" stroke-width="20"/>
        ${segs}
        <text x="100" y="94" text-anchor="middle" font-size="24" font-weight="800" fill="var(--ink)" font-family="inherit">${fmtMoney(total)}</text>
        <text x="100" y="116" text-anchor="middle" font-size="12" fill="var(--ink-muted)" font-family="inherit">الإيراد الإجمالي</text>
      </svg>`;
  }

  /* ---------- Map ---------- */
  function dottedMap(citiesActive) {
    const n = 320;
    let dots = '';
    for (let i = 0; i < n; i++) {
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      dots += `<line x1="${x}" y1="${y}" x2="${x + 0.01}" y2="${y}" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" opacity="0.12"/>`;
    }
    const pins = citiesActive
      .map((c) => {
        const p = cityPoints[c.name];
        if (!p) return '';
        return `<g transform="translate(${p[0]},${p[1]})"><circle r="${(c.count / cityMax) * 14 + 6}" fill="var(--accent)" opacity="0.14"/></g>`;
      })
      .join('');
    return `<svg class="map-bg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${dots}</svg>`;
  }

  /* ---------- Metric card ---------- */
  function metricCard(key, m, label) {
    const trend = m.trend === 'up' ? icons.trendUp : icons.trendDn;
    return `
      <div class="metric">
        <div class="metric-top">
          <span class="metric-label">${label}</span>
          <span class="metric-ic" style="background:${m.color}1f;color:${m.color}">${icons[key]}</span>
        </div>
        <div class="metric-value">${m.value}</div>
        <div class="metric-foot">
          <span class="trend ${m.trend}">${trend} ${m.delta}%</span>
          عن الفترة السابقة
        </div>
      </div>`;
  }

  /* ==================================================== */
  /*  VIEW: OVERVIEW                                       */
  /* ==================================================== */
  views.overview = function () {
    const el = $('#content');
    el.innerHTML = `
      <div class="page-head">
        <div>
          <h1>لوحة التحكم</h1>
          <p>نظرة عامة على أداء متجرك اليوم — الأحد، 6 سبتمبر</p>
        </div>
        <div class="page-head-actions">
          <button class="btn btn-secondary btn-sm" id="ov-export">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M4 21h16"/></svg>
            تصدير التقرير
          </button>
          <button class="btn btn-primary btn-sm" id="ov-refresh">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/></svg>
            تحديث
          </button>
        </div>
      </div>

      <div class="metrics">
        ${metricCard('visits', metrics.visits, 'إجمالي الزوار')}
        ${metricCard('orders', metrics.orders, 'إجمالي الطلبات')}
        ${metricCard('revenue', metrics.revenue, 'إجمالي الإيرادات')}
        ${metricCard('conv', metrics.conv, 'معدل التحويل')}
        ${metricCard('aov', metrics.aov, 'متوسط قيمة الطلب')}
        ${metricCard('customers', metrics.newcust, 'العملاء الجدد')}
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-head">
            <div>
              <div class="card-title">نظرة على الإيرادات</div>
              <div class="card-sub">الإيرادات الشهرية خلال السنة</div>
            </div>
            <div class="chart-legend"><span><span class="dot" style="background:var(--accent)"></span>الإيراد</span></div>
          </div>
          <div class="card-body">${lineChart(revenueSeries, { id: 'rev', stroke: '#008060' })}</div>
        </div>

        <div class="card">
          <div class="card-head">
            <div class="card-title">قنوات المبيعات</div>
            <div class="card-sub">توزيع الإيرادات</div>
          </div>
          <div class="card-body" style="display:flex;gap:20px;align-items:center;flex-wrap:wrap">
            <div>${donutChart([124000, 86000, 74600], ['المتجر', 'وسائل التواصل', 'الحملات'], ['#008060', '#12b76a', '#f79009'])}</div>
            <div class="donut-legend">
              <div class="lg-row"><span class="dot" style="background:#008060"></span>المتجر — 43%</div>
              <div class="lg-row"><span class="dot" style="background:#12b76a"></span>وسائل التواصل — 30%</div>
              <div class="lg-row"><span class="dot" style="background:#f79009"></span>الحملات — 26%</div>
            </div>
          </div>
          <style>.donut-legend{display:grid;gap:10px}.lg-row{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:var(--ink-soft)}.lg-row .dot{width:10px;height:10px;border-radius:50%}</style>
        </div>
      </div>

      <div class="grid-2b">
        <div class="card">
          <div class="card-head">
            <div>
              <div class="card-title">توزيع العملاء حسب المدينة</div>
              <div class="card-sub">المناطق الأكثر نشاطاً</div>
            </div>
          </div>
          <div class="card-body">
            <div class="map-wrap">
              <div class="map-canvas" id="map-canvas">
                <svg class="map-bg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" style="position:absolute;inset:0;width:100%;height:100%"></svg>
              </div>
              <div class="map-city-list" id="map-city-list"></div>
              <div class="map-tooltip" id="map-tooltip"></div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-head">
            <div>
              <div class="card-title">الزوار مقابل الطلبات</div>
              <div class="card-sub">آخر 12 شهراً</div>
            </div>
          </div>
          <div class="card-body">${barsChart(visitorsSeries, { color: '#7a5af8' })}</div>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div>
            <div class="card-title">أحدث الطلبات</div>
            <div class="card-sub">آخر 8 طلبات على المتجر</div>
          </div>
          <a href="#orders" class="btn btn-secondary btn-sm">عرض الكل</a>
        </div>
        <div class="table-wrap">
          <table class="table">
            <thead><tr><th>رقم الطلب</th><th>العميل</th><th>التاريخ</th><th>المنتجات</th><th>الإجمالي</th><th>الحالة</th></tr></thead>
            <tbody>${allOrders().slice(0, 6).map(orderRow).join('')}</tbody>
          </table>
        </div>
      </div>
    `;

    $('#ov-export').addEventListener('click', () => toast('تم تصدير التقرير'));
    $('#ov-refresh').addEventListener('click', () => toast('تم تحديث البيانات', 'success'));
    initMap();
  };

  function statusBadge(status) {
    const map = {
      paid: 'مدفوع', pending: 'قيد الانتظار', processing: 'قيد المعالجة',
      cancelled: 'ملغى', refunded: 'مسترد', delivered: 'تم التسليم',
      draft: 'غير مكتمل', confirmed: 'مؤكد', shipped: 'تم الشحن',
    };
    const label = map[status] || status;
    return `<span class="status ${status}"><span class="s-dot"></span>${label}</span>`;
  }
  window.__statusBadge = statusBadge;

  function escapeHTML(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function orderGeo(o) {
    const loc = String(o.location || '').trim();
    const m = loc.match(/^([\s\S]*?)\s*[,\s]\s*(\d{5})\s*(.+?)\s*$/);
    return {
      address: o.address || (m ? m[1].trim() : loc),
      zip: o.zip || (m ? m[2] : ''),
      city: o.city || (m ? m[3].replace(/[,\s]+$/, '') : ''),
    };
  }
  function orderRow(o) {
    const g = orderGeo(o);
    const cust = o.name || o.customer || '';
    const mapLink = (Number.isFinite(Number(o.lat)) && Number.isFinite(Number(o.lng)))
      ? ` <a class="cu-loc" target="_blank" rel="noopener" href="https://www.google.com/maps?q=${o.lat},${o.lng}">📍 mapa</a>`
      : '';
    const street = [g.address, o.piso].filter((x) => String(x || '').trim()).join(', ');
    const town = [o.province, g.city].filter((x) => String(x || '').trim()).join('، ');
    const addrLines =
      (street ? `<div class="od-addr">${escapeHTML(street)}</div>` : '') +
      (town || g.zip ? `<div class="od-sub">${escapeHTML([town, g.zip].filter(Boolean).join('، '))}</div>` : '') +
      (mapLink ? `<div class="od-map">${mapLink}</div>` : '');
    const dateCell = (o.status === 'draft')
      ? `<div>${fmtLeadActivity(o)}</div><div class="cu-opt">غير مكتمل</div>`
      : fmtOrderDate(o);
    return `
      <tr data-order="${o.id}"${o.status === 'draft' ? ' class="order-draft"' : ''}>
        <td class="cell-strong">${o.code || o.id}</td>
        <td><div class="cu-name">${escapeHTML(o.productName || '')}</div><div class="cu-opt">id ${o.productId != null ? o.productId : ''}</div></td>
        <td><div class="customer-cell"><span class="avatar" style="background:${avatarColor(cust)}">${String(cust || '?').charAt(0)}</span><div class="cu-name">${escapeHTML(cust)}</div></div></td>
        <td class="cell-num">${escapeHTML(o.phone || '')}</td>
        <td><div class="cu-loc">${addrLines}</div></td>
        <td>${escapeHTML(g.city || '')}</td>
        <td class="cell-num">${escapeHTML(g.zip || '')}</td>
        <td class="cell-num">${fmtOrderItems(o)}</td>
        <td class="cell-strong">${fmtMoney(fmtOrderTotal(o))}</td>
        <td>${dateCell}</td>
        <td>${statusBadge(o.status)}</td>
      </tr>`;
  }

  function fmtLeadActivity(o) {
    const s = o.updatedAt || o.createdAt;
    if (!s) return '';
    const d = new Date(s);
    if (isNaN(d)) return '';
    const p = (n) => String(n).padStart(2, '0');
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  function showOrderDetail(o) {
    if (!o) return;
    const g = orderGeo(o);
    const cust = o.name || o.customer || '';
    const map = (Number.isFinite(Number(o.lat)) && Number.isFinite(Number(o.lng)))
      ? `<p style="margin:10px 0 0"><a class="od-map" target="_blank" rel="noopener" href="https://www.google.com/maps?q=${o.lat},${o.lng}">📍 فتح الموقع في الخريطة</a></p>`
      : '';
    const item = (k, v, full) => `<div class="od-item${full ? ' full' : ''}"><div class="k">${escapeHTML(k)}</div><div class="v">${v || '—'}</div></div>`;
    const ovl = document.createElement('div');
    ovl.className = 'modal-overlay';
    ovl.innerHTML = `
      <div class="modal">
        <div class="modal-head">
          <h3>تفاصيل الطلب ${escapeHTML(o.code || o.id)}</h3>
          <button class="modal-x" aria-label="إغلاق" data-close>&times;</button>
        </div>
        <div class="modal-body">
          <div class="od-grid">
            ${item('رقم الطلب', escapeHTML(o.code || o.id))}
            ${item('المنتج', escapeHTML(o.productName || ''))}
            ${item('الكمية', fmtOrderItems(o))}
            ${item('الإجمالي', fmtMoney(fmtOrderTotal(o)))}
            ${item('الحالة', statusBadge(o.status))}
            ${item('التاريخ', fmtOrderDate(o))}
            ${o.status === 'draft' ? item('آخر نشاط', fmtLeadActivity(o) || '—') : ''}
          </div>
          <div class="od-divider">معلومات الزبون والعنوان</div>
          <div class="od-grid">
            ${item('الاسم الكامل', escapeHTML(cust))}
            ${item('الهاتف', escapeHTML(o.phone || ''))}
            ${item('Calle y número (العنوان)', escapeHTML(g.address || ''))}
            ${item('Piso / puerta (الدور / الباب)', escapeHTML(o.piso || ''))}
            ${item('Ciudad (المدينة)', escapeHTML(g.city || ''))}
            ${item('Código postal (الرمز البريدي)', escapeHTML(g.zip || ''))}
            ${item('Provincia (المقاطعة)', escapeHTML(o.province || ''))}
            ${map ? item('الموقع على الخريطة', map, true) : ''}
          </div>
        </div>
        <div class="modal-foot"><button class="btn btn-secondary" data-close>إغلاق</button></div>
      </div>`;
    document.body.appendChild(ovl);
    const close = () => ovl.remove();
    ovl.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', close));
    ovl.addEventListener('click', (e) => { if (e.target === ovl) close(); });
    const esc = (e) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } };
    document.addEventListener('keydown', esc);
  }

  /* ---------- Interactive map ---------- */
  function initMap() {
    const canvas = $('#map-canvas');
    const tooltip = $('#map-tooltip');
    const listEl = $('#map-city-list');

    // dots background
    const n = 260;
    let dots = '';
    for (let i = 0; i < n; i++) {
      const x = (Math.random() * 100).toFixed(1);
      const y = (Math.random() * 100).toFixed(1);
      dots += `<circle cx="${x}" cy="${y}" r="0.5" fill="var(--accent)" opacity="0.14"/>`;
    }
    canvas.innerHTML = `<svg class="map-bg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" style="width:100%;height:100%">${dots}</svg>`;

    cities.forEach((c) => {
      const [x, y] = cityPoints[c.name];
      const r = Math.round((c.count / cityMax) * 14 + 6);
      const pin = document.createElement('div');
      pin.className = 'map-pin';
      pin.style.left = x + '%';
      pin.style.top = y + '%';
      pin.dataset.city = c.name;
      canvas.appendChild(pin);
      pin.addEventListener('mouseenter', () => showTip(pin, c, x, y));
      pin.addEventListener('mouseleave', () => tooltip.classList.remove('show'));
    });

    // city legend list
    listEl.innerHTML = cities.map((c) => `
      <div class="city-row" data-city="${c.name}">
        <span>${c.name}</span>
        <div class="bar"><i style="width:${(c.count / cityMax) * 100}%"></i></div>
        <strong style="font-size:11px">${fmtNum(c.count)}</strong>
      </div>`).join('');

    listEl.querySelectorAll('.city-row').forEach((row) => {
      row.addEventListener('click', () => {
        const name = row.dataset.city;
        const pin = canvas.querySelector(`[data-city="${name}"]`);
        if (!pin) return;
        const c = cities.find((x) => x.name === name);
        const [x, y] = cityPoints[name];
        showTip(pin, c, x, y);
      });
    });

    function showTip(pin, c, x, y) {
      tooltip.innerHTML = `<div style="font-weight:700">${c.name}</div><div style="font-weight:500;opacity:.75">${fmtNum(c.count)} زائر</div>`;
      tooltip.classList.add('show');
      const t = tooltip.getBoundingClientRect();
      const cRect = canvas.getBoundingClientRect();
      let leftPx = (x / 100) * cRect.width;
      let topPx = (y / 100) * cRect.height;
      tooltip.style.left = Math.min(leftPx + 16, cRect.width - t.width - 8) + 'px';
      tooltip.style.top = Math.max(0, topPx - 46) + 'px';
    }
  }

  /* ==================================================== */
  /*  VIEW: ANALYTICS                                      */
  /* ==================================================== */
  const statusNames = {
    paid: 'مدفوع', pending: 'قيد الانتظار', processing: 'قيد المعالجة',
    cancelled: 'ملغى', refunded: 'مسترد', delivered: 'تم التسليم',
  };
  const statusColors = {
    paid: '#12b76a', delivered: '#12b76a',
    pending: '#f79009', processing: '#f79009',
    cancelled: '#ef4444', refunded: '#ef4444',
  };

  function anLine(values, labels, opts) {
    opts = opts || {};
    const W = 640, H = 220, padL = 8, padR = 8, padT = 14, padB = 28;
    const innerW = W - padL - padR, innerH = H - padT - padB;
    const min = Math.min(...values), max = Math.max(...values);
    const range = max - min || 1;
    const stepX = innerW / (values.length - 1);
    const y = (v) => padT + innerH - ((v - min) / range) * innerH;
    const pts = values.map((v, i) => [padL + i * stepX, y(v)]);
    const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const area = 'M' + pts[0][0].toFixed(1) + ' ' + (padT + innerH).toFixed(1) + ' ' + line + ' L' + pts[pts.length - 1][0].toFixed(1) + ' ' + (padT + innerH).toFixed(1) + ' Z';
    const stroke = opts.stroke || '#008060';
    const grid = [0.25, 0.5, 0.75].map((f) => {
      const yy = padT + innerH * f;
      return `<line x1="${padL}" y1="${yy}" x2="${W - padR}" y2="${yy}" stroke="var(--line)" stroke-width="1" stroke-dasharray="4 4"/>`;
    }).join('');
    const dots = pts.map((p, i) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3" fill="${stroke}"><title>${labels[i]}: ${fmtMoney(values[i])}</title></circle>`).join('');
    const xlabels = labels.map((m, i) => `<text x="${pts[i][0].toFixed(1)}" y="${H - 8}" text-anchor="middle" font-size="10.5" fill="var(--ink-muted)" font-family="inherit">${m}</text>`).join('');
    return `
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="الرسم البياني">
        <defs><linearGradient id="alg-${opts.id || 'g'}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${stroke}" stop-opacity="0.22"/><stop offset="100%" stop-color="${stroke}" stop-opacity="0.01"/></linearGradient></defs>
        ${grid}
        <path d="${area}" fill="url(#alg-${opts.id || 'g'})"/>
        <path d="${line}" fill="none" stroke="${stroke}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        ${dots}
        ${xlabels}
      </svg>`;
  }

  function computeAnalytics(list, period) {
    const now = new Date();
    let from;
    if (period === 'today') from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    else if (period === '30d') from = new Date(now.getTime() - 30 * 864e5);
    else if (period === 'year') from = new Date(now.getFullYear(), 0, 1);
    else from = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const valid = (list || []).filter((o) => {
      const d = new Date(o.createdAt);
      return !isNaN(d) && d >= from;
    });
    const prevEnd = new Date(from.getTime());
    const prevStart = new Date(from.getTime() - (now.getTime() - from.getTime()));
    const prev = (list || []).filter((o) => {
      const d = new Date(o.createdAt);
      return !isNaN(d) && d >= prevStart && d < prevEnd;
    });

    const sum = (arr) => arr.reduce((s, o) => s + fmtOrderTotal(o), 0);
    const revenue = sum(valid);
    const prevRevenue = sum(prev);
    const count = valid.length;
    const prevCount = prev.length;
    const units = valid.reduce((s, o) => s + Number(fmtOrderItems(o)), 0);
    const aov = count ? revenue / count : 0;
    const delta = (cur, prv) => {
      if (!prv) return cur > 0 ? '100' : '0';
      return ((cur - prv) / prv * 100).toFixed(1);
    };

    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: d.getFullYear() * 100 + d.getMonth(), label: d.toLocaleDateString('ar-EG', { month: 'short' }) });
    }
    const monthly = months.map(() => 0);
    valid.forEach((o) => {
      const d = new Date(o.createdAt);
      const idx = months.findIndex((m) => m.key === d.getFullYear() * 100 + d.getMonth());
      if (idx >= 0) monthly[idx] += fmtOrderTotal(o);
    });

    const pmap = {};
    valid.forEach((o) => {
      const k = o.productId != null ? o.productId : o.productName;
      if (!pmap[k]) pmap[k] = { name: o.productName || ('منتج ' + k), units: 0, revenue: 0 };
      pmap[k].units += Number(fmtOrderItems(o));
      pmap[k].revenue += fmtOrderTotal(o);
    });
    const top = Object.keys(pmap).map((k) => pmap[k]).sort((a, b) => b.units - a.units).slice(0, 5);

    const cmap = {};
    valid.forEach((o) => {
      const c = o.city || orderGeo(o).city || 'غير محدد';
      cmap[c] = (cmap[c] || 0) + 1;
    });
    const cities = Object.keys(cmap).map((c) => ({ name: c, count: cmap[c] })).sort((a, b) => b.count - a.count).slice(0, 6);

    const smap = {};
    valid.forEach((o) => { smap[o.status] = (smap[o.status] || 0) + 1; });
    const statuses = Object.keys(smap).map((s) => ({ name: statusNames[s] || s, count: smap[s], color: statusColors[s] || '#888' }))
      .sort((a, b) => b.count - a.count);

    return { from, revenue, prevRevenue, count, prevCount, units, aov, monthly, monthLabels: months.map((m) => m.label), top, cities, statuses, delta };
  }

  views.analytics = function () {
    const el = $('#content');
    el.innerHTML = `
      <div class="page-head">
        <div>
          <h1>الإحصائيات</h1>
          <p>تحليلات مُحسوبة من طلباتك الحقيقية</p>
        </div>
        <div class="page-head-actions">
          <select class="select" id="an-period">
            <option value="today">اليوم</option>
            <option value="30d">آخر 30 يوم</option>
            <option value="12m" selected>آخر 12 شهر</option>
            <option value="year">هذا العام</option>
          </select>
          <button class="btn btn-primary btn-sm" id="an-download"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M4 21h16"/></svg>تنزيل التقرير (CSV)</button>
        </div>
      </div>

      <div class="an-empty" id="an-empty" hidden><span>لا توجد طلبات في هذه الفترة بعد</span></div>

      <div class="metrics" id="an-metrics"></div>

      <div class="grid-2">
        <div class="card">
          <div class="card-head"><div><div class="card-title">الإيرادات الشهرية</div><div class="card-sub">مجمّعة حسب الشهر (بالفترة المحددة)</div></div></div>
          <div class="card-body" id="an-rev"></div>
        </div>
        <div class="card">
          <div class="card-head"><div><div class="card-title">المبيعات حسب المدينة</div><div class="card-sub">عدد الطلبات</div></div></div>
          <div class="card-body" id="an-cities"></div>
        </div>
      </div>

      <div class="grid-2b">
        <div class="card">
          <div class="card-head"><div><div class="card-title">أعلى المنتجات مبيعاً</div><div class="card-sub">حسب عدد الوحدات المباعة</div></div></div>
          <div class="card-body" id="an-top" style="display:grid;gap:16px"></div>
        </div>
        <div class="card">
          <div class="card-head"><div><div class="card-title">الطلبات حسب الحالة</div></div></div>
          <div class="card-body" id="an-status" style="display:grid;gap:14px"></div>
        </div>
      </div>
    `;

    let orders = [];
    let period = '12m';

    function render() {
      const d = computeAnalytics(orders, period);
      const noData = d.count === 0;
      $('#an-empty').hidden = !noData;

      const cards = [
        { key: 'orders', label: 'إجمالي الطلبات', value: d.count.toLocaleString('en-US'), delta: Math.abs(Number(d.delta(d.count, d.prevCount))), trend: d.count >= d.prevCount ? 'up' : 'down', color: 'var(--sky)' },
        { key: 'revenue', label: 'إجمالي الإيرادات', value: fmtMoney(d.revenue), delta: Math.abs(Number(d.delta(d.revenue, d.prevRevenue))), trend: d.revenue >= d.prevRevenue ? 'up' : 'down', color: 'var(--success)' },
        { key: 'aov', label: 'متوسط قيمة الطلب', value: fmtMoney(d.aov), delta: 0, trend: 'up', color: 'var(--purple)' },
      ];
      $('#an-metrics').innerHTML = cards.map((m) => metricCard(m.key, m, m.label)).join('');

      $('#an-rev').innerHTML = d.monthly.every((v) => v === 0)
        ? '<div class="empty">لا إيرادات بعد</div>'
        : anLine(d.monthly, d.monthLabels, { id: 'anline', stroke: '#008060' });

      const cMax = Math.max(1, ...d.cities.map((c) => c.count));
      $('#an-cities').innerHTML = d.cities.length ? d.cities.map((c) => `
        <div class="an-row">
          <span class="an-name">${escapeHTML(c.name)}</span>
          <div class="an-track"><div class="an-fill" style="width:${(c.count / cMax * 100).toFixed(0)}%"></div></div>
          <span class="an-val">${c.count}</span>
        </div>`).join('') : '<div class="empty">لا توجد مبيعات</div>';

      const pMax = Math.max(1, ...d.top.map((p) => p.units));
      $('#an-top').innerHTML = d.top.length ? d.top.map((p) => `
        <div class="progress">
          <div style="width:190px;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHTML(p.name)}</div>
          <div class="track"><div class="fill" style="width:${(p.units / pMax * 100).toFixed(0)}%;background:var(--accent)"></div></div>
          <span style="font-size:13px;font-weight:700;width:110px;text-align:left;white-space:nowrap">${fmtNum(p.units)} / ${fmtMoney(p.revenue)}</span>
        </div>`).join('') : '<div class="empty">لا مبيعات بعد</div>';

      const sMax = Math.max(1, ...d.statuses.map((s) => s.count));
      $('#an-status').innerHTML = d.statuses.length ? d.statuses.map((s) => `
        <div class="an-row">
          <span class="s-dot" style="background:${s.color}"></span>
          <span class="an-name">${escapeHTML(s.name)}</span>
          <div class="an-track"><div class="an-fill" style="width:${(s.count / sMax * 100).toFixed(0)}%;background:${s.color}"></div></div>
          <span class="an-val">${s.count}</span>
        </div>`).join('') : '<div class="empty">لا شيء</div>';
    }

    fetch('/api/orders', { cache: 'no-store' })
      .then((r) => r.json())
      .then((list) => { if (Array.isArray(list)) { orders = list; liveOrders = list; render(); } })
      .catch(() => render());
    $('#an-period').addEventListener('change', (e) => { period = e.target.value; render(); });
    $('#an-download').addEventListener('click', () => {
      const d = computeAnalytics(orders, period);
      if (!d.count) { toast('لا توجد طلبات لتصديرها'); return; }
      const rows = [['رقم الطلب', 'المنتج', 'الزبون', 'الهاتف', 'العنوان', 'المدينة', 'الرمز البريدي', 'الكمية', 'الإجمالي', 'الحالة', 'التاريخ']];
      orders.forEach((o) => {
        const g = orderGeo(o);
        rows.push([o.code || o.id, o.productName || '', o.name || o.customer || '', o.phone || '',
          g.address + (o.piso ? ', ' + o.piso : ''), g.city || '', g.zip || '',
          fmtOrderItems(o), fmtOrderTotal(o), statusNames[o.status] || o.status, o.createdAt ? new Date(o.createdAt).toLocaleString('ar-EG') : '']);
      });
      const csv = rows.map((r) => r.map((c) => '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"').join(',')).join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'orders-report.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
      toast('تم تنزيل التقرير', 'success');
    });
  };

  /* ==================================================== */
  /*  VIEW: PRODUCTS                                       */
  /* ==================================================== */
  let productFilter = 'all';
  let productSearch = '';
  views.products = function () {
    const el = $('#content');
    el.innerHTML = `
      <div class="page-head">
        <div>
          <h1>المنتجات</h1>
          <p>إدارة منتجات المتجر وصفحات الهبوط المرتبطة بها</p>
        </div>
        <div class="page-head-actions">
          <button class="btn btn-primary" id="prod-add"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>إضافة منتج</button>
        </div>
      </div>

      <div class="card">
        <div class="toolbar">
          <div class="toolbar-l">
            <div class="tabs">
              <button class="tab active" data-tab="all">الكل</button>
              <button class="tab" data-tab="active">نشط</button>
              <button class="tab" data-tab="inactive">خامل</button>
            </div>
          </div>
          <div class="toolbar-l">
            <div class="search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>
              <input type="text" id="prod-search" placeholder="ابحث عن منتج...">
            </div>
          </div>
        </div>
        <div class="table-wrap">
          <table class="table">
            <thead><tr><th>المنتج</th><th>السعر</th><th>المخزون</th><th>المبيعات</th><th>الحالة</th><th>صفحة الهبوط</th><th>إجراء</th></tr></thead>
            <tbody id="prod-tbody"></tbody>
          </table>
        </div>
      </div>
      <div id="prod-modal-anchor"></div>
    `;

    function statusOf(p) {
      return p.stock > 0 ? 'active' : 'inactive';
    }

    function thumbnail(p) {
      const src = (p.images && p.images.length && p.images[0] && String(p.images[0]).trim())
        ? p.images[0].trim()
        : '';
      if (src) {
        return `<span class="thumb"><img src="${src}" alt="" loading="lazy"></span>`;
      }
      return `<span class="thumb" style="background:${p.hue || '#e7ecf3'}"><svg viewBox="0 0 120 120"><g fill="none" stroke="rgba(11,11,13,.35)" stroke-width="1.5"><rect x="18" y="34" width="84" height="70" rx="8"/><circle cx="60" cy="64" r="16"/><path d="M18 76 L46 56 L74 74 L102 58"/></g></svg></span>`;
    }

    function renderRows() {
      const tb = $('#prod-tbody');
      const list = productStore.filter((p) => {
        const okTab = productFilter === 'all' || statusOf(p) === productFilter;
        const okSearch = !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku.toLowerCase().includes(productSearch.toLowerCase());
        return okTab && okSearch;
      });
      if (!list.length) {
        tb.innerHTML = `<tr><td colspan="7"><div class="empty">لا توجد منتجات مطابقة</div></td></tr>`;
        return;
      }
      tb.innerHTML = list.map((p) => `
        <tr>
          <td><div class="product-cell">${thumbnail(p)}<div><div class="cell-strong">${p.name}</div><div style="font-size:12px;color:var(--ink-muted)">${p.sku}</div></div></div></td>
          <td class="cell-strong">${fmtMoney(p.price)}</td>
          <td>${statusOf(p) === 'inactive' ? '<span style="color:var(--danger);font-weight:600">غير متوفر</span>' : p.stock + ' قطعة'}</td>
          <td>${fmtNum(p.sold)}</td>
          <td>${statusBadge(statusOf(p))}</td>
          <td>
            <a class="lp-chip" href="/product.html?id=${p.id}" target="_blank" rel="noopener" title="${landingTitle(p)}">صفحة الهبوط</a>
          </td>
          <td>
            <div class="row-actions">
              <button class="btn btn-secondary btn-sm btn-icon" data-lp-gen="${p.id}" title="توليد صفحة هبوط افتراضية (تصميم أوروبي)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4V2"/><path d="M15 10V8"/><path d="M15 16v-2"/><path d="M15 22v-2"/><path d="M12 6.5l.9 1.8 1.9.9-1.9.9-.9 1.8-.9-1.8-1.9-.9 1.9-.9Z"/><path d="M19 14l.8 1.6 1.7.9-1.7.9-.8 1.6-.9-1.6-1.7-.9 1.7-.9Z"/><path d="M4 15h2a2 2 0 0 1 0 4H4v3"/></svg>
                توليد</button>
              <a class="btn btn-secondary btn-sm" href="/product.html?id=${p.id}" target="_blank" rel="noopener" title="معاينة صفحة الهبوط كما يراها العميل (Storefront)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12h.01"/><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><path d="M12 12h.01"/></svg>
                معاينة</a>
              <a class="btn btn-secondary btn-sm" href="/admin/product-editor.html?id=${p.id}" title="تعديل محتوى صفحة الهبوط">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                تعديل</a>
              <button class="btn btn-secondary btn-sm" data-copy-link="${p.id}" title="نسخ رابط صفحة الهبوط">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                نسخ</a>
              <button class="btn btn-danger btn-sm btn-icon" data-del-product="${p.id}" title="حذف المنتج">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 13a2 2 0 0 0 2 1.8h6A2 2 0 0 0 17 20l1-13"/><path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/></svg>
                حذف</button>
            </div>
          </td>
        </tr>`).join('');
    }

    function landingTitle(p) {
      const l = p.landing || {};
      return (l.active === false ? 'معطّلة' : 'مفعّلة') + ' — ' + (l.headline || p.name);
    }

    function copyLink(id) {
      const url = location.origin + '/product.html?id=' + id;
      const done = () => toast('تم نسخ رابط صفحة الهبوط', 'success');
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(url).then(done).catch(() => fallbackCopy(url, done));
      } else {
        fallbackCopy(url, done);
      }
    }
    function fallbackCopy(text, done) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { toast('تعذر النسخ'); }
      document.body.removeChild(ta);
    }

    /* ---- Generate / reset a default European-style landing page ---- */
    async function generateDefaultLanding(id) {
      const p = productStore.find((x) => x.id === Number(id));
      if (!p) return;
      const prod = Object.assign({}, p, {
        landing: { headline: '', lead: 'Now available from ' + p.cat, cta: 'Buy Now', ctaLink: '#add', active: true },
        hue: p.hue,
        price: p.price,
        stock: p.stock,
        old: p.old != null ? p.old : null,
      });
      try {
        const saved = await apiSaveProduct(prod);
        const i = productStore.findIndex((x) => x.id === Number(saved.id));
        if (i !== -1) productStore[i] = Object.assign({}, toAdminRow(saved), productStore[i]);
        else productStore.push(saved);
        toast('تم توليد صفحة هبوط افتراضية', 'success');
        window.open('/product.html?id=' + saved.id, '_blank');
        renderRows();
      } catch (e) {
        toast('تعذر الحفظ: ' + e.message);
      }
    }

    async function removeProduct(id) {
      const p = productStore.find((x) => x.id === Number(id));
      const name = p ? p.name : '(#' + id + ')';
      showConfirm({
        title: 'حذف المنتج',
        message: 'هل تريد فعلًا حذف «' + name + '» نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.',
        confirmText: 'حذف نهائيًا',
        danger: true,
        onConfirm: async () => {
          try {
            await apiDeleteProduct(id);
            productStore = productStore.filter((x) => x.id !== Number(id));
            toast('تم حذف المنتج', 'success');
            renderRows();
          } catch (e) {
            toast('تعذر الحذف: ' + e.message);
          }
        },
      });
    }

    /* ---- Create product modal (auto-generates a default landing page) ---- */
    function openCreateModal() {
      const anchor = $('#prod-modal-anchor');
      anchor.innerHTML = `
        <div class="modal-overlay" id="prod-modal">
          <div class="modal">
            <div class="modal-head">
              <h3>إضافة منتج جديد</h3>
              <button class="modal-x" id="prod-modal-x" aria-label="إغلاق">&times;</button>
            </div>
            <div class="modal-body">
              <div class="form-row">
                <div class="form-group"><label class="form-label">اسم المنتج</label><input class="input" id="pf-name" placeholder="مثال: Aurelia Linen Shirt"></div>
                <div class="form-group"><label class="form-label">التصنيف</label><input class="input" id="pf-cat" list="pf-cats" placeholder="Apparel, Home ..."><datalist id="pf-cats"><option>Apparel</option><option>Outerwear</option><option>Home</option><option>Furniture</option><option>Accessories</option><option>Lighting</option></datalist></div>
              </div>
              <div class="form-row">
                <div class="form-group"><label class="form-label">السعر ($)</label><input class="input" id="pf-price" type="number" min="0" step="0.01"></div>
                <div class="form-group"><label class="form-label">السعر القديم ($)</label><input class="input" id="pf-old" type="number" min="0" step="0.01" placeholder="اختياري"></div>
              </div>
              <div class="form-row">
                <div class="form-group"><label class="form-label">المخزون</label><input class="input" id="pf-stock" type="number" min="0"></div>
                <div class="form-group"><label class="form-label">لون خلفية المنتج</label><input class="input" id="pf-hue" type="color" value="#e7ecf3" style="height:44px;padding:4px"></div>
              </div>
              <div class="form-group"><label class="form-label">وصف المنتج</label><textarea class="textarea" id="pf-desc" placeholder="وصف يظهر في صفحة الهبوط والمتجر"></textarea></div>
              <div class="form-group"><label class="form-label">المميزات (سطر لكل ميزة)</label><textarea class="textarea" id="pf-feats" placeholder="ميزة أولى&#10;ميزة ثانية&#10;ميزة ثالثة"></textarea></div>
              <p class="modal-note">سيتولّد تلقائياً صفحة هبوط افتراضية بتصميم أوروبي (صورة، عنوان، وصف، زر شراء) — يمكنك تعديلها بعد الإنشاء.</p>
            </div>
            <div class="modal-foot">
              <button class="btn btn-secondary" id="prod-modal-cancel">إلغاء</button>
              <button class="btn btn-primary" id="prod-modal-save">إنشاء المنتج وصفحة الهبوط</button>
            </div>
          </div>
        </div>`;

      function close() { anchor.innerHTML = ''; }
      $('#prod-modal-x').addEventListener('click', close);
      $('#prod-modal-cancel').addEventListener('click', close);
      $('#prod-modal').addEventListener('click', (e) => { if (e.target.id === 'prod-modal') close(); });

      $('#prod-modal-save').addEventListener('click', async () => {
        const name = $('#pf-name').value.trim();
        const cat = $('#pf-cat').value.trim();
        const price = Number($('#pf-price').value || 0);
        const stock = Number($('#pf-stock').value || 0);
        if (!name || !cat || price <= 0) { toast('أكمل الاسم والتصنيف والسعر'); return; }
        const features = $('#pf-feats').value.split(/\n+/).map((s) => s.trim()).filter(Boolean);
        const body = {
          name, cat, price,
          old: $('#pf-old').value ? Number($('#pf-old').value) : null,
          stock, hue: $('#pf-hue').value,
          desc: $('#pf-desc').value.trim() || 'A considered piece for everyday living — designed with the same quiet, European calm as the rest of the collection.',
          features: features.length ? features : ['Designed in a clean European style', 'Premium materials', 'Free shipping over $100'],
          // default landing page is generated server-side
        };
        try {
          const created = await apiSaveProduct(body);
          productStore.push(toAdminRow(created));
          renderRows();
          close();
          toast('تم إنشاء المنتج وصفحة الهبوط', 'success');
          window.open('/admin/product-editor.html?id=' + created.id, '_blank');
        } catch (e) {
          toast('تعذر الإنشاء: ' + e.message);
        }
      });
    }

    $('#prod-tbody').addEventListener('click', (e) => {
      const link = e.target.closest('[data-copy-link]');
      if (link) { e.preventDefault(); copyLink(link.dataset.copyLink); return; }
      const gen = e.target.closest('[data-lp-gen]');
      if (gen) { generateDefaultLanding(gen.dataset.lpGen); return; }
      const del = e.target.closest('[data-del-product]');
      if (del) { removeProduct(del.dataset.delProduct); return; }
    });

    renderRows();
    $$('[data-tab]', el).forEach((t) => {
      t.addEventListener('click', () => {
        $$('[data-tab]', el).forEach((x) => x.classList.remove('active'));
        t.classList.add('active');
        productFilter = t.dataset.tab;
        renderRows();
      });
    });
    $('#prod-search').addEventListener('input', (e) => { productSearch = e.target.value.trim(); renderRows(); });
    $('#prod-add').addEventListener('click', () => { window.location.href = '/admin/product-editor.html'; });
  };

  /* ==================================================== */
  /*  VIEW: ORDERS                                         */
  /* ==================================================== */
  let orderFilter = 'all';
  views.orders = function () {
    const el = $('#content');
    el.innerHTML = `
      <div class="page-head">
        <div>
          <h1>الطلبات</h1>
          <p>إدارة ومتابعة طلبات المتجر</p>
        </div>
        <div class="page-head-actions">
          <button class="btn btn-secondary btn-sm" id="ord-export">تصدير CSV</button>
        </div>
      </div>

      <div class="card">
        <div class="toolbar">
          <div class="tabs">
            <button class="tab active" data-tab="all">الكل</button>
            <button class="tab" data-tab="draft">غير مكتملة</button>
            <button class="tab" data-tab="pending">قيد الانتظار</button>
            <button class="tab" data-tab="processing">قيد المعالجة</button>
            <button class="tab" data-tab="paid">مدفوعة</button>
            <button class="tab" data-tab="cancelled">ملغاة</button>
          </div>
          <div class="search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>
            <input type="text" id="ord-search" placeholder="ابحث عن طلب أو عميل...">
          </div>
        </div>
        <div class="filters">
          <label class="f-label" for="ord-date">الفترة</label>
          <select class="select" id="ord-date">
            <option value="all">كل الفترات</option>
            <option value="today">طلبات اليوم</option>
            <option value="7d">آخر 7 أيام</option>
            <option value="30d">آخر شهر</option>
            <option value="30plus">أقدم من شهر</option>
          </select>
          <label class="f-label" for="ord-prod">المنتج</label>
          <select class="select" id="ord-prod"><option value="all">كل المنتجات</option></select>
        </div>
        <div class="table-wrap">
          <table class="table order-table">
            <thead><tr><th>رقم الطلب</th><th>المنتج</th><th>الزبون</th><th>الهاتف</th><th>العنوان</th><th>المدينة</th><th>الرمز البريدي</th><th>الكمية</th><th>الإجمالي</th><th>التاريخ</th><th>الحالة</th></tr></thead>
            <tbody id="ord-tbody"></tbody>
          </table>
        </div>
      </div>
    `;

    let search = '';
    let dateFilter = 'all';
    let prodFilter = 'all';

    const inDateRange = (o) => {
      if (dateFilter === 'all') return true;
      const d = o.createdAt ? new Date(o.createdAt) : null;
      if (!d || isNaN(d)) return true;
      const now = new Date();
      const day = 24 * 60 * 60 * 1000;
      if (dateFilter === 'today') return d.toDateString() === now.toDateString();
      if (dateFilter === '7d') return (now - d) <= 7 * day;
      if (dateFilter === '30d') return (now - d) <= 30 * day;
      if (dateFilter === '30plus') return (now - d) > 30 * day;
      return true;
    };

    function renderRows() {
      const tb = $('#ord-tbody');
      const list = liveOrders.filter((o) => {
        const okTab = orderFilter === 'all' || o.status === orderFilter;
        const okDate = inDateRange(o);
        const okProd = prodFilter === 'all' || String(o.productId) === prodFilter;
        const hay = (o.code || o.id) + ' ' + (o.customer || o.name || '') + ' ' + (o.phone || '') + ' ' + (o.productName || '');
        const okSearch = !search || hay.includes(search);
        return okTab && okDate && okProd && okSearch;
      });
      tb.innerHTML = list.length ? list.map(orderRow).join('') : `<tr><td colspan="11"><div class="empty">لا توجد طلبات مطابقة</div></td></tr>`;
    }
    renderRows();
    fetch('/api/orders', { cache: 'no-store' })
      .then((r) => r.json())
      .then((list) => {
        if (Array.isArray(list)) {
          liveOrders = list;
          const prodSel = $('#ord-prod');
          const names = {};
          list.forEach((o) => { if (o.productId != null && o.productName && !names[o.productId]) names[o.productId] = o.productName; });
          const opts = Object.keys(names).sort((a, b) => a - b).map((k) => `<option value="${k}">${escapeHTML(names[k])}</option>`).join('');
          prodSel.innerHTML = '<option value="all">كل المنتجات</option>' + opts;
          renderRows();
        }
      })
      .catch(() => {});
    $$('[data-tab]', el).forEach((t) => {
      t.addEventListener('click', () => {
        $$('[data-tab]', el).forEach((x) => x.classList.remove('active'));
        t.classList.add('active');
        orderFilter = t.dataset.tab;
        renderRows();
      });
    });
    $('#ord-search').addEventListener('input', (e) => { search = e.target.value.trim(); renderRows(); });
    $('#ord-date').addEventListener('change', (e) => { dateFilter = e.target.value; renderRows(); });
    $('#ord-prod').addEventListener('change', (e) => { prodFilter = e.target.value; renderRows(); });
    $('#ord-export').addEventListener('click', () => toast('تم تصدير الطلبات', 'success'));
    const tbody = $('#ord-tbody');
    if (tbody) {
      tbody.addEventListener('click', (e) => {
        const tr = e.target.closest('tr[data-order]');
        if (!tr || e.target.closest('a, button')) return;
        const found = liveOrders.find((o) => o.id === Number(tr.dataset.order));
        if (found) showOrderDetail(found);
      });
    }
  };

  /* ==================================================== */
  /*  VIEW: EXCEL (اكسل)                                   */
  /* ==================================================== */
  views.excel = function () {
    const el = $('#content');

    const COLS = [
      ['رقم الطلب', 'code'], ['المنتج', 'product'], ['الزبون', 'name'], ['الهاتف', 'phone'],
      ['Calle y número', 'address'], ['Piso / puerta', 'piso'], ['Ciudad', 'city'],
      ['Código postal', 'zip'], ['Provincia', 'province'], ['الكمية', 'qty'], ['الإجمالي', 'total'],
      ['الحالة', 'status'], ['التاريخ', 'date'],
    ];
    const KEYS = COLS.map((c) => c[1]);
    const SAVE_KEYS = ['name', 'phone', 'address', 'piso', 'city', 'zip', 'province', 'status'];
    const letter = (i) => String.fromCharCode(65 + i);

    let rows = [];          // per-order string rows
    let ids = [];           // order id per row index
    let active = { r: -1, c: -1 };
    let dirty = false;
    let fullOrders = [];    // all orders (unfiltered)

    el.innerHTML = `
      <div class="gs gs-full">
        <div class="gs-toolbar">
          <div class="gs-actions">
            <button class="btn btn-primary btn-sm" id="xl-save">حفظ</button>
            <button class="btn btn-secondary btn-sm" id="xl-xls">Excel</button>
            <button class="btn btn-secondary btn-sm" id="xl-csv">CSV</button>
          </div>
          <div class="gs-filters">
            <select class="input gs-filter-prod" id="xl-product" title="فلترة حسب المنتج"><option value="">الكل</option></select>
            <input class="input gs-filter-num" id="xl-from" placeholder="من رقم" dir="ltr" title="بداية النطاق" />
            <input class="input gs-filter-num" id="xl-to" placeholder="إلى رقم" dir="ltr" title="نهاية النطاق" />
          </div>
          <div class="gs-wrap">
            <div class="gs-ref" id="gs-ref"></div>
            <div class="gs-fx">fx</div>
            <input class="gs-formula" id="gs-formula" spellcheck="false" placeholder="عدّل قيمة الخلية المحددة هنا..." />
          </div>
        </div>
        <div class="gs-scroll" id="gs-scroll">
          <table class="gs-table">
            <thead>
              <tr class="gs-letters">
                <th class="gs-corner"></th>
                ${COLS.map((_, i) => `<th>${letter(i)}</th>`).join('')}
              </tr>
            </thead>
            <tbody id="gs-body">
              <tr class="gs-labels">
                <th class="gs-rownum">1</th>
                ${COLS.map((c) => `<td>[${letter(COLS.indexOf(c))}] ${escapeHTML(c[0])}</td>`).join('')}
              </tr>
            </tbody>
          </table>
        </div>
        <div class="gs-sheetbar">
          <span class="gs-tab active"><svg width="16" height="16" viewBox="0 0 24 24" fill="#188038"><path d="M4 4h7v7H4zm9 0h7v7h-7zM4 13h7v7H4zm9 0h7v7h-7z"/></svg>Orders 1</span>
          <span class="gs-status" id="gs-status">يتم التحميل…</span>
        </div>
      </div>
    `;

    const body = $('#gs-body');

    function renderSheet(list) {
      body.querySelectorAll('tr.gs-data').forEach((tr) => tr.remove());
      if (!list.length) {
        const msg = fullOrders.length ? 'لا توجد طلبات مطابقة للفلترة' : 'لا توجد طلبات بعد. أول طلب جديد سيظهر هنا تلقائياً.';
        body.insertAdjacentHTML('beforeend', `<tr class="gs-data"><th class="gs-rownum">2</th><td colspan="${COLS.length}" class="gs-empty">${msg}</td></tr>`);
        $('#gs-status').textContent = '0 صف من ' + fullOrders.length;
        return;
      }
      list.forEach((o, r) => {
        const g = orderGeo(o);
        const vals = [
          o.code || String(o.id), o.productName || '', o.name || o.customer || '', o.phone || '',
          g.address || '', o.piso || '', g.city || '', g.zip || '', o.province || '',
          fmtOrderItems(o), fmtMoney(fmtOrderTotal(o)), o.status || 'pending', fmtOrderDate(o),
        ];
        rows[r] = vals;
        ids[r] = o.id;
        const rowHtml = vals.map((v, c) => `<td><input class="gs-cell" data-r="${r}" data-c="${c}" value="${escapeHTML(v)}" spellcheck="false" /></td>`).join('');
        body.insertAdjacentHTML('beforeend', `<tr class="gs-data" data-r="${r}"><th class="gs-rownum">${r + 2}</th>${rowHtml}</tr>`);
      });
      $('#gs-status').textContent = list.length + ' من ' + fullOrders.length + ' صف';
    }

    const orderNumber = (o) => {
      const m = String(o.code || '').match(/\d+/);
      return m ? Number(m[0]) : Number(o.id);
    };
    const parseNum = (s) => {
      s = String(s == null ? '' : s).replace(/\D/g, '');
      return s === '' ? null : Number(s);
    };
    function filteredList() {
      const sel = $('#xl-product').value;
      const from = parseNum($('#xl-from').value);
      const to = parseNum($('#xl-to').value);
      return fullOrders.filter((o) => {
        if (sel && (o.productName || '').trim() !== sel) return false;
        const n = orderNumber(o);
        if (from != null && n < from) return false;
        if (to != null && n > to) return false;
        return true;
      });
    }
    function renderFiltered() {
      rows.length = 0;
      ids.length = 0;
      renderSheet(filteredList());
      setActive(0, 0);
      $('#gs-ref').textContent = fullOrders.length ? 'A2' : '';
    }
    function populateProducts(list) {
      const names = Array.from(new Set(list.map((o) => (o.productName || '').trim()).filter(Boolean)));
      const sel = $('#xl-product');
      sel.innerHTML = '<option value="">الكل</option>' + names.map((nm) => `<option value="${escapeHTML(nm)}">${escapeHTML(nm)}</option>`).join('');
    }

    function setActive(r, c) {
      active = { r, c };
      const inp = body.querySelector(`input.gs-cell[data-r="${r}"][data-c="${c}"]`);
      $('#gs-ref').textContent = letter(c) + (r + 2);
      if (inp) $('#gs-formula').value = inp.value;
      else $('#gs-formula').value = '';
    }

    body.addEventListener('click', (e) => {
      const inp = e.target.closest('input.gs-cell');
      if (!inp) return;
      setActive(Number(inp.dataset.r), Number(inp.dataset.c));
    });
    body.addEventListener('input', (e) => {
      const inp = e.target.closest('input.gs-cell');
      if (!inp) return;
      const r = Number(inp.dataset.r), c = Number(inp.dataset.c);
      if (rows[r]) rows[r][c] = inp.value;
      dirty = true;
      $('#gs-status').textContent = (active.r >= 0 && active.c >= 0 ? ((rows.length) + ' صف') : '') + ' • غير محفوظ';
      if (active.r === r && active.c === c) $('#gs-formula').value = inp.value;
    });
    body.addEventListener('keydown', (e) => {
      const inp = e.target.closest('input.gs-cell');
      if (!inp) return;
      const r = Number(inp.dataset.r), c = Number(inp.dataset.c);
      const next = (nr, nc) => {
        const target = body.querySelector(`input.gs-cell[data-r="${nr}"][data-c="${nc}"]`);
        if (target) { target.focus(); target.select(); setActive(nr, nc); }
      };
      if (e.key === 'Enter') { e.preventDefault(); next(r + 1, c); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); next(r + 1, c); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); next(r - 1, c); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); next(r, c - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); next(r, c + 1); }
    });
    $('#gs-formula').addEventListener('input', (e) => {
      if (active.r >= 0 && active.c >= 0) {
        const inp = body.querySelector(`input.gs-cell[data-r="${active.r}"][data-c="${active.c}"]`);
        if (inp) {
          inp.value = e.target.value;
          if (rows[active.r]) rows[active.r][active.c] = e.target.value;
          dirty = true;
        }
      }
    });
    $('#gs-formula').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && active.r >= 0) {
        e.preventDefault();
        const nr = active.r + 1;
        const target = body.querySelector(`input.gs-cell[data-r="${nr}"][data-c="${active.c}"]`);
        if (target) { target.focus(); target.select(); setActive(nr, active.c); }
        else document.getElementById('gs-formula').blur();
      }
    });

    function buildRowsForExport() {
      return rows.map((row, r) => ({
        code: row[0], product: row[1], name: row[2], phone: row[3], address: row[4],
        piso: row[5], city: row[6], zip: row[7], province: row[8], qty: row[9], total: row[10],
        status: row[11], date: row[12],
      }));
    }
    const HEADERS = COLS.map((c) => c[0]);
    function buildCsv(dataRows) {
      const esc = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
      return [HEADERS.map(esc).join(',')].concat(dataRows.map((r) => HEADERS.map((_, i) => esc(r[KEYS[i]])).join(','))).join('\r\n');
    }
    function buildXls(dataRows) {
      const head = '<tr>' + HEADERS.map((h) => `<th>${h}</th>`).join('') + '</tr>';
      const bodyRows = dataRows.map((r) => '<tr>' + HEADERS.map((_, i) => `<td>${String(r[KEYS[i]] == null ? '' : r[KEYS[i]])}</td>`).join('') + '</tr>').join('');
      return '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>الطلبات</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table border="1">' + head + bodyRows + '</table></body></html>';
    }
    function download(filename, mime, content) {
      const blob = new Blob(['\ufeff' + content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }

    $('#xl-xls').addEventListener('click', () => { download('orders.xls', 'application/vnd.ms-excel', buildXls(buildRowsForExport())); toast('تم تصدير Excel', 'success'); });
    $('#xl-csv').addEventListener('click', () => { download('orders.csv', 'text/csv', buildCsv(buildRowsForExport())); toast('تم تصدير CSV', 'success'); });
    $('#xl-save').addEventListener('click', () => {
      const updates = rows.map((row, r) => {
        const patch = {};
        SAVE_KEYS.forEach((k) => { patch[k] = row[KEYS.indexOf(k)]; });
        return { id: ids[r], patch };
      }).filter((u) => u.id != null && u.id !== undefined);
      if (!updates.length) { toast('لا توجد طلبات لحفظها'); return; }
      fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      }).then((res) => res.json()).then((d) => {
        if (d.ok) { dirty = false; toast('تم حفظ ' + d.changed + ' طلب', 'success'); $('#gs-status').textContent = rows.length + ' من ' + fullOrders.length + ' صف'; }
        else toast(d.error || 'خطأ في الحفظ');
      }).catch(() => toast('تعذر الاتصال بالخادم'));
    });

    $('#xl-product').addEventListener('change', renderFiltered);
    const applyRange = (e) => { if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== 'Tab') return; renderFiltered(); };
    $('#xl-from').addEventListener('keydown', applyRange);
    $('#xl-to').addEventListener('keydown', applyRange);
    $('#xl-from').addEventListener('change', renderFiltered);
    $('#xl-to').addEventListener('change', renderFiltered);

    fetch('/api/orders', { cache: 'no-store' })
      .then((r) => r.json())
      .then((list) => {
        if (!Array.isArray(list)) throw new Error('bad');
        fullOrders = list;
        populateProducts(list);
        renderFiltered();
      })
      .catch(() => { $('#gs-status').textContent = 'تعذر التحميل'; });
  };

  /* ==================================================== */
  /* ==================================================== */
  /*  VIEW: SETTINGS                                       */
  /* ==================================================== */
  views.settings = function () {
    const el = $('#content');
    el.innerHTML = `
      <div class="page-head">
        <div>
          <h1>الإعدادات</h1>
          <p>تخصيص إعدادات متجرك</p>
        </div>
      </div>

      <div class="settings-grid">
        <div class="card" style="margin-bottom:0">
          <div class="settings-menu" id="set-menu">
            <button class="active" data-panel="general">عام</button>
            <button data-panel="storefront">الواجهة</button>
          </div>
        </div>

        <div class="card">
          <div class="card-body" id="set-body"></div>
        </div>
      </div>
    `;

    let settings = {};

    const panels = {
      general: `
        <h3 class="card-title" style="margin-bottom:18px">إعدادات عامة</h3>
        <div class="form-group"><label class="form-label">اسم المتجر</label><input class="input" id="set-store-name"></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">البريد الإلكتروني</label><input class="input" type="email" id="set-email"></div>
          <div class="form-group"><label class="form-label">العملة</label><select class="select-full"><option>دولار أمريكي ($)</option><option>يورو (€)</option><option>دينار كويتي (د.ك)</option></select></div>
        </div>
        <div class="form-group"><label class="form-label">رابط واتساب (wa.me/...)</label><input class="input" id="set-whatsapp" placeholder="https://wa.me/34600000000" dir="ltr" /></div>
        <div class="form-group"><label class="form-label">وصف المتجر</label><textarea class="textarea">متجر حديث للعلامات المستقلة — تصميم أوروبي بسيط.</textarea></div>

        <div style="margin-top:8px">
          <div class="toggle-row"><div><div class="tt">تفعيل المتجر</div><div class="ts">إظهار المتجر للزوار</div></div><label class="switch"><input type="checkbox" checked><span class="slider"></span></label></div>
          <div class="toggle-row"><div><div class="tt">وضع الصيانة</div><div class="ts">إخفاء المتجر مؤقتاً أثناء الإعداد</div></div><label class="switch"><input type="checkbox"><span class="slider"></span></label></div>
          <div class="toggle-row"><div><div class="tt">إشعارات البريد</div><div class="ts">إرسال إشعارات الطلبات عبر البريد</div></div><label class="switch"><input type="checkbox" checked><span class="slider"></span></label></div>
        </div>
        <div class="save-bar"><button class="btn btn-primary set-save">حفظ التغييرات</button></div>
      `,
      storefront: `
        <h3 class="card-title" style="margin-bottom:18px">واجهة المتجر</h3>
        <div class="form-row">
          <div class="form-group"><label class="form-label">العنوان الرئيسي</label><input class="input" value="متجر أنيق وبسيط"></div>
          <div class="form-group"><label class="form-label">الوصف</label><input class="input" value="منتجات مختارة بعناية"></div>
        </div>
        <div class="form-group"><label class="form-label">اللون الأساسي</label><input class="input" type="color" value="#008060" style="height:42px;padding:4px"></div>
        <div style="display:grid;gap:12px">
          <div class="toggle-row"><div><div class="tt">إظهار تقييمات العملاء</div><div class="ts">عرض التقييمات في الصفحة الرئيسية</div></div><label class="switch"><input type="checkbox" checked><span class="slider"></span></label></div>
        </div>
        <div class="save-bar"><button class="btn btn-primary set-save">حفظ التغييرات</button></div>
      `,
    };

    function showPanel(name) {
      $('#set-body').innerHTML = panels[name];
      $$('#set-body .set-save').forEach((b) => b.addEventListener('click', () => {
        if ($('#set-store-name')) settings.storeName = $('#set-store-name').value.trim();
        if ($('#set-email')) settings.email = $('#set-email').value.trim();
        if ($('#set-whatsapp')) settings.whatsapp = $('#set-whatsapp').value.trim();
        fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) })
          .then(() => toast('تم حفظ الإعدادات', 'success'))
          .catch(() => toast('خطأ في الحفظ'));
      }));
      if (name === 'general') {
        fetch('/api/settings').then(r => r.json()).then(s => {
          settings = s || {};
          if ($('#set-store-name')) $('#set-store-name').value = settings.storeName || '';
          if ($('#set-email')) $('#set-email').value = settings.email || '';
          if ($('#set-whatsapp')) $('#set-whatsapp').value = settings.whatsapp || '';
        }).catch(() => {});
      }
    }
    showPanel('general');

    $$('#set-menu button').forEach((b) => {
      b.addEventListener('click', () => {
        $$('#set-menu button').forEach((x) => x.classList.remove('active'));
        b.classList.add('active');
        showPanel(b.dataset.panel);
      });
    });
  };

  /* ==================================================== */
  /*  ROUTER                                              */
  /* ==================================================== */
  function getView() {
    const hash = location.hash.replace(/^#/, '') || 'overview';
    const base = hash.split('?')[0].split('/')[0];
    return views[base] ? base : 'overview';
  }

  function navigate() {
    const view = getView();
    $$('.nav-item[data-view]').forEach((n) => n.classList.toggle('active', n.dataset.view === view));
    const nav = $('#content');
    document.body.classList.toggle('excel-mode', view === 'excel');
    nav.classList.toggle('content-full', view === 'excel');
    if (views[view]) views[view]();
    else views.overview();
  }

  function initSidebar() {
    $$('.nav-item[data-view]').forEach((n) => {
      n.addEventListener('click', () => {
        $$('.nav-item[data-view]').forEach((x) => x.classList.remove('active'));
        n.classList.add('active');
        closeSidebar();
      });
    });
    const menuBtn = $('#menu-btn'), overlay = $('#overlay'), sidebar = $('#sidebar');
    const closeSidebar = () => { sidebar.classList.remove('open'); overlay.classList.remove('show'); };
    if (menuBtn) menuBtn.addEventListener('click', () => { sidebar.classList.add('open'); overlay.classList.add('show'); });
    if (overlay) overlay.addEventListener('click', closeSidebar);
    $('#side-close').addEventListener('click', closeSidebar);
  }

  /* ---------- Init ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    function refreshBadge() {
      const n = pendingOrdersCount();
      $('#orders-badge').textContent = n;
      $('#notif-dot').style.display = n ? 'block' : 'none';
    }
    function loadLiveOrders() {
      fetch('/api/orders', { cache: 'no-store' })
        .then((r) => r.json())
        .then((list) => {
          if (Array.isArray(list)) {
            liveOrders = list;
            refreshBadge();
          }
        })
        .catch(() => {});
    }

    refreshBadge();
    loadLiveOrders();

    initSidebar();
    window.addEventListener('hashchange', navigate);
    navigate();
    loadProducts();
  });
})();

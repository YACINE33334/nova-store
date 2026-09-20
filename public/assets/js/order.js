/* =========================================================
   NOVA — Checkout para el mercado español (pago contra
   reembolso).

   Flujo:
     1. Nombre
     2. Teléfono
     3. Mapa de GOOGLE (incrustado, real) con búsqueda tipo
        Google Maps: escribe la calle, eliges la sugerencia
        o usas tu ubicación → el mapa de Google salta a tu
        punto exacto.
     4. Confirmación debajo del mapa:
        - dirección + código postal + ciudad + provincia auto
          (provincia editable a mano, opcional)
        - total a pagar contra reembolso
        - botón "Realizar pedido"
   Nota: sin API key el mapa de Google es interactivo (zoom,
   desplazamiento) pero no podemos leer una pulsación directa;
   la dirección se fija con la búsqueda / la ubicación.
   ========================================================= */
(function () {
  'use strict';

  const CURRENCY = '$';

  /* ---------------- traducciones del formulario ---------------- */
  const DEFAULTS = (window.NOVA_I18N_DEFAULTS) || {};
  let OVERRIDES = {};
  function t(key, vars) {
    let v = (OVERRIDES[key] != null && String(OVERRIDES[key]).trim() !== '')
      ? OVERRIDES[key]
      : (DEFAULTS[key] != null ? DEFAULTS[key] : key);
    v = String(v);
    if (vars) {
      Object.keys(vars).forEach((k) => { v = v.split('{' + k + '}').join(String(vars[k])); });
    }
    return v;
  }

  function currency(n) {
    return CURRENCY + n.toLocaleString('en-US', { minimumFractionDigits: 0 });
  }

  const productIcon = (hue, size) => `
    <svg width="${size}" height="${size}" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <g fill="none" stroke="rgba(11,11,13,.28)" stroke-width="1.5">
        <rect x="18" y="34" width="84" height="70" rx="8"/>
        <circle cx="60" cy="64" r="16"/>
        <path d="M18 76 L46 56 L74 74 L102 58"/>
      </g>
    </svg>`;

  const $ = (sel, scope) => (scope || document).querySelector(sel);

  async function fetchJson(url, opts) {
    const res = await fetch(url, Object.assign({ cache: 'no-store' }, opts));
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  }

  /* ---------------- mapa (Google incrustado) ---------------- */

  const ESPAÑA = { lat: 40.4637, lng: -3.7492 };

  let pendingCoords = null;
  function syncGoogleMap(ll) {
    const frame = $('#gmap-main');
    if (!frame || !ll) return;
    const wrap = $('#map-wrap');
    if (!wrap || wrap.hidden) { pendingCoords = ll; return; }
    frame.src = 'https://maps.google.com/maps?q=' + ll.lat + ',' + ll.lng + '&z=17&hl=es&output=embed';
  }

  function setCoords(ll) {
    const street = $('#cf-street');
    if (street) { street.dataset.lat = String(ll.lat); street.dataset.lng = String(ll.lng); }
  }

  function pick(addr, keys) {
    for (const k of keys) if (addr[k] && typeof addr[k] === 'string') return addr[k];
    return '';
  }

  function prefillFromAddress(addr, ll) {
    if (!addr) return;
    const road = pick(addr, ['road', 'pedestrian', 'footway', 'highway', 'square']);
    const number = pick(addr, ['house_number']);
    const street = road ? (number ? road + ', ' + number : road) : '';
    const zip = pick(addr, ['postcode']);
    const city = pick(addr, ['city', 'town', 'village', 'city_district', 'quarter']);
    const prov = pick(addr, ['state', 'province', 'region']);
    if (street) $('#cf-street').value = street;
    if (zip) $('#cf-zip').value = zip;
    if (city) $('#cf-city').value = city;
    if (prov) $('#cf-province').value = prov;
    if (ll) setCoords(ll);
    if (ll) syncGoogleMap(ll);
    else syncGoogleMap(lastLatLng);
  }

  let lastLatLng = null;
  function rememberCoords(ll) {
    if (!ll) return;
    lastLatLng = ll;
    setCoords(ll);
  }

  async function reverseGeocode(ll) {
    try {
      const url = 'https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&addressdetails=1&accept-language=es'
        + '&lat=' + ll.lat + '&lon=' + ll.lng;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const j = await res.json();
      rememberCoords(ll);
      prefillFromAddress(j.address, ll);
    } catch (e) { /* sin internet: se queda lo escrito */ }
  }

  /* ---------------- búsqueda (estilo Google Maps) ---------------- */

  let results = [];
  let suggestVisible = false;
  let searchTimer = null;

  async function searchAddresses(q) {
    const url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&addressdetails=1&countrycodes=es&accept-language=es&q='
      + encodeURIComponent(q);
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    return res.json();
  }

  function renderSuggest() {
    const box = $('#suggest');
    if (!box) return;
    if (!results.length) { box.hidden = true; suggestVisible = false; return; }
    box.innerHTML = results.map((r, i) => {
      const d = r.display_name || '';
      const comma = d.indexOf(',');
      const name = comma >= 0 ? d.slice(0, comma) : d;
      const meta = comma >= 0 ? d.slice(comma + 1).trim() : '';
      return `<button type="button" class="sug-item" role="option" data-i="${i}">
        <span class="sug-pin"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></span>
        <span><span class="sug-name">${escapeHtml(name)}</span><span class="sug-meta">${escapeHtml(meta)}</span></span>
      </button>`;
    }).join('');
    box.hidden = false;
    suggestVisible = true;
  }

  async function doSearch(q) {
    const box = $('#suggest');
    if (!q || q.length < 3) { box.hidden = true; results = []; return []; }
    try { results = await searchAddresses(q); } catch (e) { results = []; }
    renderSuggest();
    return results;
  }

  function chooseResult(idx) {
    const r = results[idx];
    const box = $('#suggest');
    box.hidden = true; suggestVisible = false;
    if (!r) return;
    const ll = { lat: parseFloat(r.lat), lng: parseFloat(r.lon) };
    rememberCoords(ll);
    $('#order-error').classList.remove('show');
    prefillFromAddress(r.address, ll);
    const card = $('#cf-card');
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function bindAutocomplete() {
    const input = $('#q-address');
    const box = $('#suggest');

    input.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => doSearch(input.value.trim()), 320);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (suggestVisible && results.length) chooseResult(0);
        else doSearch(input.value.trim()).then((r) => {
          if (!r || !r.length) showError(t('search_not_found', { q: input.value.trim() }));
        });
      } else if (e.key === 'Escape') {
        box.hidden = true; suggestVisible = false;
      }
    });

    input.addEventListener('blur', () => setTimeout(() => { box.hidden = true; suggestVisible = false; }, 150));
    box.addEventListener('click', (e) => { const it = e.target.closest('.sug-item'); if (it) chooseResult(Number(it.dataset.i)); });
  }

  /* ---------------- ubicación del usuario ---------------- */

  function bindLocate() {
    const btn = $('#loc-use');
    btn.addEventListener('click', () => {
      if (!navigator.geolocation) { showError(t('locate_no_geo')); return; }
      btn.textContent = t('locate_locating');
      btn.disabled = true;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const ll = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          rememberCoords(ll);
          reverseGeocode(ll);
          $('#order-error').classList.remove('show');
          btn.textContent = t('loc_use');
          btn.disabled = false;
        },
        () => {
          btn.textContent = t('loc_use');
          btn.disabled = false;
          showError(t('locate_fail'));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }

  function showError(msg) {
    const el = $('#order-error');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
  }

  /* ---------------- mapa opcional (colapsado) ---------------- */

  function bindMapToggle() {
    const btn = $('#map-toggle');
    const wrap = $('#map-wrap');
    if (!btn || !wrap) return;
    btn.addEventListener('click', () => {
      const open = wrap.hidden;
      wrap.hidden = !open;
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        const frame = $('#gmap-main');
        if (frame && pendingCoords) {
          frame.src = 'https://maps.google.com/maps?q=' + pendingCoords.lat + ',' + pendingCoords.lng + '&z=17&hl=es&output=embed';
          pendingCoords = null;
        }
      }
    });
  }

  /* ---------------- ciudad automática desde código postal ---------------- */

  let zipTimer = null;

  function bindZipCity() {
    const zipInput = $('#cf-zip');
    const cityInput = $('#cf-city');
    const provInput = $('#cf-province');
    if (!zipInput || !cityInput) return;

    cityInput.addEventListener('input', () => { cityInput.dataset.autofilled = '0'; });

    zipInput.addEventListener('input', () => {
      clearTimeout(zipTimer);
      const zip = zipInput.value.trim();
      if (!/^\d{5}$/.test(zip)) return;
      zipTimer = setTimeout(async () => {
        try {
          const url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=es&accept-language=es&postalcode='
            + zip;
          const res = await fetch(url, { headers: { Accept: 'application/json' } });
          const j = await res.json();
          if (!j || !j.length) return;
          const addr = j[0].address || {};
          const city = addr.city || addr.town || addr.village || addr.city_district || addr.quarter || '';
          const prov = addr.state || addr.province || addr.region || '';
          if (city && cityInput.dataset.autofilled !== '0') {
            cityInput.value = city;
            cityInput.dataset.autofilled = '1';
          }
          if (provInput && prov) {
            provInput.value = prov;
          }
        } catch (e) { /* sin internet: el cliente escribe la ciudad */ }
      }, 450);
    });
  }

  /* ---------------- formulario ---------------- */

  function buildLocationString() {
    const street = $('#cf-street').value.trim();
    const zip = $('#cf-zip').value.trim();
    const city = $('#cf-city').value.trim();
    const prov = $('#cf-province').value.trim();
    const parts = [street, [zip, city].filter(Boolean).join(' '), prov].filter(Boolean);
    return parts.join(', ');
  }

/* ---------------- borrador de pedido (checkout autosave) ---------------- */

  function leadSid() {
    try {
      let sid = localStorage.getItem('nova_checkout_sid');
      if (!sid) {
        sid = 'sid-' + (window.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2, 10));
        localStorage.setItem('nova_checkout_sid', sid);
      }
      return sid;
    } catch (e) { return 'sid-' + Date.now(); }
  }

  function collectLead(product, qty) {
    const v = (id) => {
      const el = $(id);
      return el ? el.value.trim() : '';
    };
    const name = v('#o-name');
    const phone = v('#o-phone');
    const street = v('#cf-street');
    const zip = v('#cf-zip');
    const city = v('#cf-city');
    const prov = v('#cf-province');
    if (!name && !phone && !street && !zip && !city && !prov) return null;
    const body = {
      action: 'draft',
      sid: leadSid(),
      productId: product.id,
      qty: qty,
      name, phone, address: street, city, zip, province: prov,
    };
    const el = $('#cf-street');
    if (el && el.dataset) {
      const lat = parseFloat(el.dataset.lat);
      const lng = parseFloat(el.dataset.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) { body.lat = lat; body.lng = lng; }
    }
    return body;
  }

  function bindLeadCapture(product, qty) {
    let timer = null;
    const post = (body) => {
      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        keepalive: true,
      }).catch(() => {});
    };
    const send = (immediate) => {
      clearTimeout(timer);
      const body = collectLead(product, qty);
      if (!body) return;
      if (immediate) post(body);
      else timer = setTimeout(() => post(body), 400);
    };
    const fields = ['#o-name', '#o-phone', '#cf-city', '#cf-street', '#cf-province', '#cf-zip'];
    fields.forEach((sel) => {
      const el = $(sel);
      if (el) {
        el.addEventListener('input', () => send(false));
        el.addEventListener('change', () => send(true));
        el.addEventListener('blur', () => send(true));
      }
    });
    const flush = () => send(true);
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush();
    });
  }

  function renderCheckout(product, qty) {
    const total = Number(product.price) * qty;
    const pimg = Array.isArray(product.images) && product.images[0] ? product.images[0] : null;
    const thumb = pimg
      ? `<img class="ck-img" src="${pimg}" alt="${product.name}">`
      : productIcon(product.hue || '#f5f5f5', 46);

    $('#order-root').innerHTML = `
      <div class="checkout">
        <div class="ck-cod">
          <div class="ck-cod-ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 3 6v6c0 5 3.8 8.4 9 10 5.2-1.6 9-5 9-10V6l-9-4Z"/><path d="M9 12.5l2 2 4-4.5"/></svg>
          </div>
          <div class="ck-cod-txt">
            <strong>${t('ck_cod_title')}</strong>
            <span>${t('ck_cod_sub')}</span>
          </div>
        </div>

        <div class="ck-prod">
          <div class="ck-thumb" style="background:${product.hue || '#f5f5f5'}">${thumb}</div>
          <div class="ck-prod-info">
            <div class="ck-prod-name">${product.name}</div>
            <div class="ck-prod-cat">${product.cat || t('ck_prod_label')} &middot; x${qty}</div>
          </div>
          <div class="ck-prod-price">${currency(total)}</div>
        </div>

        <form class="order-form" id="order-form" novalidate>
          <div class="ck-fields-head">
            <h2>${t('fields_head')}</h2>
            <p>${t('fields_sub')}</p>
          </div>
          <div class="order-field">
            <label for="o-name">${t('name_label')} <span>*</span></label>
            <input type="text" id="o-name" name="name" placeholder="${t('name_ph')}" autocomplete="name" required />
          </div>
          <div class="order-field">
            <label for="o-phone">${t('phone_label')} <span>*</span></label>
            <input type="tel" id="o-phone" name="phone" placeholder="${t('phone_ph')}" autocomplete="tel" required />
            <span class="hint">${t('phone_hint')}</span>
          </div>

          <div class="cf-card" id="cf-card">
            <div class="cf-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"/><circle cx="12" cy="10" r="3"/></svg>
              ${t('ship_title')}
            </div>
            <div class="cf-grid">
              <div class="cf-field wide">
                <label for="cf-city">${t('city_label')} <span>*</span></label>
                <input type="text" id="cf-city" name="city" placeholder="${t('city_ph')}" autocomplete="address-level2" required />
                <span class="hint">${t('city_hint')}</span>
              </div>
              <div class="cf-field wide">
                <label for="cf-street">${t('street_label')} <span>*</span></label>
                <input type="text" id="cf-street" name="address" placeholder="${t('street_ph')}" autocomplete="street-address" required />
              </div>
              <div class="cf-field">
                <label for="cf-province">${t('prov_label')}</label>
                <input type="text" id="cf-province" name="province" placeholder="${t('prov_ph')}" autocomplete="address-level1" />
              </div>
              <div class="cf-field">
                <label for="cf-zip">${t('zip_label')} <span>*</span></label>
                <input type="text" id="cf-zip" name="zip" inputmode="numeric" placeholder="${t('zip_ph')}" autocomplete="postal-code" maxlength="5" required />
              </div>
            </div>

            <button type="button" class="map-toggle" id="map-toggle" aria-expanded="false">
              <span class="mt-txt">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                <span>${t('map_toggle')}</span>
              </span>
              <svg class="mt-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </button>

            <div class="map-wrap" id="map-wrap" hidden>
              <div class="search-pill">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                <input type="text" id="q-address" placeholder="${t('search_ph')}" autocomplete="off" inputmode="search" />
              </div>
              <div class="suggest" id="suggest" role="listbox" hidden></div>
              <iframe id="gmap-main" class="o-gmap" title="Mapa de Google" src="https://maps.google.com/maps?ll=${ESPAÑA.lat},${ESPAÑA.lng}&z=6&hl=es&output=embed" loading="lazy" allowfullscreen referrerpolicy="no-referrer-when-downgrade"></iframe>
              <button type="button" class="loc-use" id="loc-use">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="9"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2"/></svg>
                ${t('loc_use')}
              </button>
              <div class="loc-caption"><span class="loc-hint">${t('loc_hint')}</span></div>
            </div>

            <div class="cf-pay">
              <div class="cf-pay-price"><span class="cp-label">${t('pay_label')}</span><span class="cp-amount">${currency(total)}</span></div>
              <button type="submit" class="btn btn-accent btn-lg" id="order-submit">${t('submit')}</button>
            </div>
          </div>

          <div class="order-error" id="order-error"></div>
        </form>
      </div>
    `;

    const form = $('#order-form');
    const errorBox = $('#order-error');
    const submitBtn = $('#order-submit');

    bindAutocomplete();
    bindLocate();
    bindMapToggle();
    bindZipCity();
    bindLeadCapture(product, qty);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = $('#o-name').value.trim();
      const phone = $('#o-phone').value.trim();
      const street = $('#cf-street').value.trim();
      const zip = $('#cf-zip').value.trim();
      const city = $('#cf-city').value.trim();

      if (!name || !phone) { showError(t('err_required_name_phone')); return; }
      if (!street) { showError(t('err_required_street')); return; }
      if (!zip) { showError(t('err_required_zip')); return; }
      if (!/^\d{5}$/.test(zip)) { showError(t('err_zip_format')); return; }
      if (!city) { showError(t('err_required_city')); return; }

      errorBox.classList.remove('show');
      submitBtn.disabled = true;
      submitBtn.textContent = t('submit_sending');

      const body = {
        sid: leadSid(),
        productId: product.id,
        name, phone, qty,
        location: buildLocationString(),
        address: street,
        zip: zip,
        city: city,
        province: $('#cf-province').value.trim(),
      };
      const lat = parseFloat($('#cf-street').dataset.lat);
      const lng = parseFloat($('#cf-street').dataset.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) { body.lat = lat; body.lng = lng; }

      const { ok, data, status } = await fetchJson('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (ok && data && data.id) {
        showSuccess(data, product);
      } else {
        submitBtn.disabled = false;
        submitBtn.textContent = t('submit');
        errorBox.textContent = (data && data.error) || t('err_generic', { status });
        errorBox.classList.add('show');
      }
    });
  }

  function showSuccess(order, product) {
    $('#order-root').innerHTML = `
      <div class="order-success show">
        <div class="ok-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg></div>
        <h2>${t('ok_title')}</h2>
        <div class="ok-ref">${t('ok_ref')} <strong>${escapeHtml(order.code)}</strong></div>

        <div class="ok-card">
          <div class="ok-row"><span>${t('ok_product')}</span><strong>${escapeHtml(product.name)} &times; ${order.qty}</strong></div>
          <div class="ok-row"><span>${t('ok_total')}</span><strong>${currency(order.total)}</strong></div>
          <div class="ok-row"><span>${t('ok_method')}</span><strong>${t('ok_cod')}</strong></div>
        </div>

        <div class="ok-card">
          <div class="ok-delivery-title">${t('ok_delivery_title')}</div>
          <div class="ok-row"><span>${t('ok_name')}</span><strong>${escapeHtml(order.name)}</strong></div>
          <div class="ok-row"><span>${t('ok_phone')}</span><strong dir="ltr">${escapeHtml(order.phone)}</strong></div>
          <div class="ok-row"><span>${t('ok_address')}</span><strong>${escapeHtml(order.location)}</strong></div>
        </div>

        <p class="ok-note">${t('ok_note')}</p>

        <div class="ok-actions">
          <a class="btn btn-accent" href="/#products">${t('ok_continue')}</a>
          <a class="btn btn-outline" href="/">${t('ok_home')}</a>
        </div>
      </div>`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderNoProduct(msg) {
    $('#order-root').innerHTML = `
      <div style="min-height:50vh;display:grid;place-items:center;text-align:center">
        <div>
          <h1 class="order-title">${t('np_title')}</h1>
          <p class="order-sub">${msg}</p>
          <a class="btn btn-accent" href="/#products">${t('np_back_shop')}</a>
        </div>
      </div>`;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  document.addEventListener('DOMContentLoaded', () => {
    const root = $('#order-root');
    if (!root) return;
    const id = Number(new URLSearchParams(location.search).get('id'));
    const qty = Math.max(1, Math.min(99, Number(new URLSearchParams(location.search).get('qty')) || 1));

    (async () => {
      try {
        const { data } = await fetchJson('/api/i18n');
        if (data && typeof data === 'object') OVERRIDES = data;
      } catch (e) { /* usamos el idioma por defecto */ }

      let product = null;
      try {
        const { ok, data } = await fetchJson('/api/products?id=' + id);
        if (ok && data && data.id) product = data;
      } catch (e) { /* fall through */ }
      if (!product && window.NovaStore) {
        product = window.NovaStore.catalog.find((p) => p.id === id) || null;
      }
      if (!product) { renderNoProduct(t('np_notfound')); return; }

      document.title = t('meta_title') + ' — ' + product.name;
      renderCheckout(product, qty);
    })();
  });
})();
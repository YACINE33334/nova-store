/* =========================================================
   NOVA — Cart controller
   ========================================================= */
(function () {
  'use strict';

  const CART_KEY = 'nova_cart';

  const fmt = (n) => '$' + n.toLocaleString('en-US');

  const getCart = () => {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch (e) { return []; }
  };
  const setCart = (c) => localStorage.setItem(CART_KEY, JSON.stringify(c));

  document.addEventListener('DOMContentLoaded', () => {
    const page = document.querySelector('.cart-page');
    const itemsEl = document.getElementById('cart-items');
    const stickyEl = document.getElementById('cart-sticky');
    const liveCatalog = () => (window.NovaStore && window.NovaStore.catalog)
      ? window.NovaStore.catalog
      : [];
    const product = (id) => liveCatalog().find((p) => p.id === id);
    let cart = getCart();

    function render() {
      if (!cart.length) {
        page.classList.add('empty');
        page.classList.remove('has-items');
        stickyEl.style.display = 'none';
        return;
      }
      page.classList.add('has-items');
      page.classList.remove('empty');
      stickyEl.style.display = 'block';

      const cat = liveCatalog();
      if (!cat.length) {
        itemsEl.innerHTML = '<div class="cart-loading" style="text-align:center;color:#8a8a8a;padding:32px 0;font-size:14px">Cargando productos…</div>';
        return;
      }
      const product = (id) => cat.find((p) => p.id === id);

      itemsEl.innerHTML = cart.map((it) => {
        const p = product(it.id);
        if (!p) return '';
        return `
          <div class="cart-item" data-id="${p.id}">
            <div class="thumb" style="background:${p.hue}">
              <svg width="44" height="44" viewBox="0 0 120 120"><g fill="none" stroke="rgba(11,11,13,.3)" stroke-width="1.5"><rect x="18" y="34" width="84" height="70" rx="8"/><circle cx="60" cy="64" r="16"/><path d="M18 76 L46 56 L74 74 L102 58"/></g></svg>
            </div>
            <div class="meta">
              <div class="name">${p.name}</div>
              <div class="cat">${p.cat} &middot; ${fmt(p.price)}</div>
              <button class="remove-btn" data-remove="${p.id}">Eliminar</button>
            </div>
            <div class="controls">
              <div class="qty">
                <button data-dec="${p.id}" aria-label="Reducir">&minus;</button>
                <span>${it.qty}</span>
                <button data-inc="${p.id}" aria-label="Aumentar">+</button>
              </div>
              <span class="line-total">${fmt(p.price * it.qty)}</span>
            </div>
          </div>`;
      }).join('');

      const sub = cart.reduce((s, it) => s + (product(it.id)?.price || 0) * it.qty, 0);
      const shipping = sub > 100 || sub === 0 ? 0 : 8;
      document.getElementById('sum-subtotal').textContent = fmt(sub);
      document.getElementById('sum-shipping').textContent = shipping === 0 ? 'Gratis' : fmt(shipping);
      document.getElementById('sum-total').textContent = fmt(sub + shipping);
      document.getElementById('sticky-total').textContent = fmt(sub + shipping);
    }

    itemsEl.addEventListener('click', (e) => {
      const inc = e.target.closest('[data-inc]');
      const dec = e.target.closest('[data-dec]');
      const rem = e.target.closest('[data-remove]');

      if (inc) {
        const it = cart.find((c) => c.id === Number(inc.dataset.inc));
        if (it) it.qty += 1;
      } else if (dec) {
        const it = cart.find((c) => c.id === Number(dec.dataset.dec));
        if (it) {
          it.qty -= 1;
          if (it.qty <= 0) cart = cart.filter((c) => c.id !== it.id);
        }
      } else if (rem) {
        cart = cart.filter((c) => c.id !== Number(rem.dataset.remove));
      } else {
        return;
      }
      setCart(cart);
      render();
      if (window.NovaStore) window.NovaStore.renderCartCount();
    });

    const doCheckout = () => {
      alert('¡Gracias! Esto es una compra de prueba: no se ha procesado ningún pago.');
    };
    document.getElementById('checkout').addEventListener('click', doCheckout);
    document.getElementById('checkout-sticky').addEventListener('click', doCheckout);

    render();
    if (window.NovaStore && window.NovaStore.ready) {
      window.NovaStore.ready.then(render);
    }
  });
})();

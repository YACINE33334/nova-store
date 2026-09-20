/* =========================================================
   NOVA — Storefront application
   ========================================================= */
(function () {
  'use strict';

  /* ---------- Product catalog ---------- */
  // `seed` is the built-in fallback; the live catalog is loaded from /api/products
  const seed = [
    {
      id: 1, name: 'Camisa de lino Aurelia', cat: 'Ropa', price: 78, old: null, tag: 'new', hue: '#e7ecf3',
      rating: 4.9, reviews: 214,
      desc: 'Corte europeo relajado, confeccionado con lino europeo transpirable. La Aurelia está hecha para usarse a diario: suave desde el primer lavado, con la estructura justa para mantener la línea temporada tras temporada.',
      features: ['Lino europeo 100%', 'Corte relajado con hombro caído', 'Botones de concha natural', 'Lavable a máquina a 30 °C'],
      stock: 142,
    },
    {
      id: 2, name: 'Abrigo de lana Meridian', cat: 'Prendas exteriores', price: 240, old: 290, tag: 'sale', hue: '#ece8df',
      rating: 4.8, reviews: 168,
      desc: 'Abrigo entallado en una mezcla de lana suavemente cepillada. Hombros limpios, una silueta discreta y un drapeado cálido que te acompaña en invierno sin nada de volumen.',
      features: ['Mezcla de tacto lana cepillada', 'Cuerpo forrado por completo', 'Dos bolsillos de parche', 'Horma europea regular'],
      stock: 36,
    },
    {
      id: 3, name: 'Taza de cerámica Oslo', cat: 'Hogar', price: 32, old: null, tag: null, hue: '#e5ece9',
      rating: 4.7, reviews: 342,
      desc: 'Una taza generosa de 350 ml hecha en gres y terminada con esmalte mate. Perfecta junto a una mañana tranquila, hecha para durar más que las modas.',
      features: ['Gres de 350 ml', 'Esmalte mate apto para alimentos', 'Apta para lavavajillas y microondas', 'Acabado a mano'],
      stock: 0,
    },
    {
      id: 4, name: 'Butaca de descanso Nordic', cat: 'Mobiliario', price: 420, old: null, tag: null, hue: '#f0e6dd',
      rating: 4.9, reviews: 96,
      desc: 'Una butaca escultórica en roble macizo y cuerda natural. Cuidada desde todos los ángulos, diseñada para años de uso diario.',
      features: ['Estructura de roble FSC macizo', 'Cuerda natural tejida a mano', 'Piezas planas sin herramientas', 'Envío gratuito'],
      stock: 12,
    },
    {
      id: 5, name: 'Foulard de seda — Folia', cat: 'Accesorios', price: 54, old: 68, tag: 'sale', hue: '#e3e4ee',
      rating: 4.8, reviews: 129,
      desc: 'Un foulard de seda de morera estampado con hojas y dobladillo cosido a mano. Ligero como el aire, estampado en pequeños lotes en Como.',
      features: ['Seda de morera 100%', 'Cantos cosidos a mano', '90 × 90 cm', 'En caja lista para regalar'],
      stock: 88,
    },
    {
      id: 6, name: 'Terraplanter X', cat: 'Hogar', price: 46, old: null, tag: 'new', hue: '#e6ede4',
      rating: 4.6, reviews: 78,
      desc: 'Una maceta autorriego con depósito de agua visible. Líneas limpias que dejan que tus plantas hablen por sí solas.',
      features: ['Depósito autorriego', 'Resina reciclada sin BPA', 'Apta para macetas de 4–6"', 'Disponible en tres neutros'],
      stock: 64,
    },
    {
      id: 7, name: 'Lámpara de mesa Vela', cat: 'Iluminación', price: 130, old: null, tag: null, hue: '#f1e9e0',
      rating: 4.9, reviews: 187,
      desc: 'Una lámpara de mesa arquitectónica y suave en cerámica torneada. Luz difusa, sombras delicadas y un interruptor con un clic satisfactorio.',
      features: ['Base de cerámica torneada', 'Pantalla difusora de tela', 'Regulador en línea', 'Bombilla E27 incluida'],
      stock: 8,
    },
    {
      id: 8, name: 'Bolso de piel Strada', cat: 'Accesorios', price: 190, old: 220, tag: 'sale', hue: '#e6e3dc',
      rating: 4.7, reviews: 143,
      desc: 'Un bolso estructurado en piel vegetal de grano pleno. Espacio de sobra para un portátil y para la vida; la pátina llega con el tiempo.',
      features: ['Piel vegetal de grano pleno', 'Cabe un portátil de 15"', 'Bolsillo interior con cremallera', 'Hecho en un taller familiar'],
      stock: 41,
    },
    {
      id: 10, name: 'Hervidor Inteligente de Alimentos', cat: 'Electrodomesticos', price: 89, old: 109, tag: 'sale', hue: '#f0f0f0',
      rating: 4.7, reviews: 20,
      desc: 'Hervidor inteligente con control digital de temperatura y temporizador programable. Perfecto para preparar cereales calientes, chocolate, té y más. Diseño compacto y elegante con acabados premium y base giratoria de 360°.',
      features: ['Control digital de temperatura con pantalla LED', 'Capacidad de 1.7 litros de acero inoxidable', 'Temporizador programable de hasta 24 horas', 'Base giratoria de 360° con cable enrollador', 'Funcion calentar rapida en 3 minutos', 'Diseño compacto y elegante con acabados premium'],
      stock: 45,
      images: ['/assets/img/foodwarmer-1.png', '/assets/img/foodwarmer-2.png', '/assets/img/foodwarmer-3.png', '/assets/img/foodwarmer-4.png']
    },
  ];

  let catalog = seed.slice();

  const format = (n) => '$' + n.toLocaleString('en-US');

  const currency = (n) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0 });

  const TAG_LABELS = { new: 'Nuevo', sale: 'Rebajas' };

  /* ---------- Local storage cart ---------- */
  const CART_KEY = 'nova_cart';
  const getCart = () => {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch (e) { return []; }
  };
  const setCart = (cart) => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    renderCartCount();
  };

  function renderCartCount() {
    const cart = getCart();
    const total = cart.reduce((s, i) => s + i.qty, 0);
    const el = document.querySelector('.cart-count');
    if (!el) return;
    el.textContent = total;
    el.style.display = total > 0 ? 'grid' : 'none';
  }

  function addToCart(id) {
    const cart = getCart();
    const item = cart.find((i) => i.id === id);
    if (item) item.qty += 1;
    else cart.push({ id, qty: 1 });
    setCart(cart);
    const btn = document.querySelector(`[data-add="${id}"]`);
    if (btn) {
      btn.classList.add('added');
      btn.textContent = 'Añadido \u2713';
      setTimeout(() => {
        btn.classList.remove('added');
        btn.textContent = 'Añadir al carrito';
      }, 1200);
    }
  }

  /* ---------- Product card ---------- */
  function productCard(p) {
    const price = p.old
      ? `<span class="price old">${currency(p.old)}</span><span class="price red">${currency(p.price)}</span>`
      : `<span class="price">${currency(p.price)}</span>`;
    const tag = p.tag
      ? `<span class="product-tag ${p.tag}">${TAG_LABELS[p.tag] || p.tag}</span>`
      : '';
    const hasImgs = p.images && p.images.length;
    return `
      <article class="product-card reveal">
        <a class="product-media" style="background:${hasImgs ? '#fff' : p.hue}" href="/product.html?id=${p.id}" aria-label="${p.name}">
          ${tag}
          ${hasImgs
            ? `<img src="${p.images[0]}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover">`
            : `<svg width="120" height="120" viewBox="0 0 120 120" aria-hidden="true"><g fill="none" stroke="rgba(11,11,13,.25)" stroke-width="1.5"><rect x="18" y="34" width="84" height="70" rx="8"/><circle cx="60" cy="64" r="16"/><path d="M18 76 L46 56 L74 74 L102 58"/></g></svg>`
          }
        </a>
        <div class="product-info">
          <span class="product-cat">${p.cat}</span>
          <h3 class="product-name"><a href="/product.html?id=${p.id}">${p.name}</a></h3>
          <div class="product-price">${price}</div>
          <button class="add-btn" data-add="${p.id}">Añadir al carrito</button>
        </div>
      </article>
    `;
  }

  /* ---------- Rendering ---------- */
  const visibleProducts = () => catalog.filter((p) => (p.landing || {}).active !== false);

  function renderProducts(scope) {
    const grid = scope.querySelector('[data-products]');
    if (!grid) return;
    grid.innerHTML = visibleProducts().map(productCard).join('');
  }

  function rerenderAll() {
    document.querySelectorAll('[data-products]').forEach((grid) => {
      if (grid.closest('#landing-root')) return;
      grid.innerHTML = visibleProducts().map(productCard).join('');
    });
    bindAddButtons(document);
    initReveal(document);
    initForm(document);
    const builder = document.getElementById('landing-root');
    if (builder) {
      renderProducts(builder);
      bindAddButtons(builder);
    }
  }

  async function loadCatalog() {
    try {
      const res = await fetch('/api/products', { cache: 'no-store' });
      if (!res.ok) throw new Error('bad status');
      const data = await res.json();
      if (Array.isArray(data) && data.length) {
        catalog = data;
        rerenderAll();
      }
    } catch (e) {
      // keep the built-in seed catalog
    }
  }

  function bindAddButtons(scope) {
    const scopeEl = scope || document;
    scopeEl.querySelectorAll('[data-add]').forEach((btn) => {
      btn.addEventListener('click', () => addToCart(Number(btn.dataset.add)));
    });
  }

  /* ---------- Reveal on scroll ---------- */
  function initReveal(scope) {
    const sc = scope || document;
    const els = sc.querySelectorAll('.reveal:not(.is-visible)');
    if (!('IntersectionObserver' in window)) {
      els.forEach((e) => e.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    els.forEach((e) => io.observe(e));
  }

  /* ---------- Mobile nav ---------- */
  function initNav() {
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.main-nav');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', () => {
      nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', nav.classList.contains('open'));
    });
    nav.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', () => nav.classList.remove('open'))
    );
  }

  /* ---------- Newsletter ---------- */
  function initForm(scope) {
    const sc = scope || document;
    sc.querySelectorAll('form[data-newsletter]').forEach((form) => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const note = form.parentElement.querySelector('.form-note');
        if (note) {
          note.textContent = '¡Gracias! Ya estás en la lista.';
          form.querySelector('input').value = '';
        }
      });
    });
  }

  /* ========================================================
     LANDING PAGE BUILDER
     Compose and render a landing page from a section list
     ======================================================== */
  const BUILDER_KEY = 'nova_landing_sections';
  const BUILDER_ACTIVE_KEY = 'nova_landing_active';

  const defaultSections = [
    { type: 'hero', title: 'Construye una marca que perdure.', text: 'Un sistema europeo minimalista para tiendas modernas: diseño limpio, tipografía honesta y cero ruido.', cta: 'Ver la colección', cta2: 'Ver productos', image: 'hero' },
    { type: 'features', title: 'Todo lo que necesitas, nada de lo que no.', text: 'Un conjunto de herramientas centrado en la claridad, la velocidad y el buen hacer.', items: [
      { icon: 'grid', title: 'Secciones modulares', text: 'Compón páginas con bloques limpios e intercambiables.' },
      { icon: 'bolt', title: 'Velocidad extrema', text: 'Un front-end ligero que carga al instante en cualquier dispositivo.' },
      { icon: 'shield', title: 'Fiabilidad', text: 'Diseños estables y comportamiento predecible, cero ruido.' }
    ] },
    { type: 'products', title: 'La colección', text: 'Objetos pensados para el día a día.' },
    { type: 'stats', title: 'Creciendo con calma', stats: [
      { num: '120K', lbl: 'Clientes' },
      { num: '480+', lbl: 'Productos' },
      { num: '99.9%', lbl: 'Disponibilidad' },
      { num: '4.9/5', lbl: 'Valoración' }
    ] },
    { type: 'testimonials', title: 'Amado por los creadores', items: [
      { quote: 'La experiencia de venta más limpia en la que hemos montado nuestra tienda. Simplemente desaparece de tu camino.', name: 'Elena Marchetti', role: 'Fundadora, Atelier Nord' },
      { quote: 'Migramos todo nuestro catálogo en un fin de semana. El constructor resulta increíblemente fácil.', name: 'Jonas Lindqvist', role: 'COO, Studio Magna' },
      { quote: 'Páginas estructuradas con belleza y un nivel de pulido que rara vez se ve en este sector.', name: 'Amira Haddad', role: 'Directora creativa, Mono' }
    ] },
    { type: 'cta', title: '¿Listo para crear algo que perdure?', text: 'Únete a miles de marcas independientes que venden en NOVA.', cta: 'Empezar' }
  ];

  const SVG_ICONS = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    bolt: '<path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/>'
  };

  function icon(name, size) {
    const body = SVG_ICONS[name] || '<circle cx="12" cy="12" r="10"/>';
    return `<svg width="${size||22}" height="${size||22}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
  }

  const renderers = {
    hero(s) {
      return `
      <section class="builder-section" data-sec="hero">
        <div class="container builder-hero-dark">
          <h1>${s.title || 'Tu titular aquí.'}</h1>
          <p>${s.text || ''}</p>
          <div class="hero-cta" style="justify-content:center">
            <a class="btn btn-primary" href="#products">${s.cta || 'Empezar'}</a>
            ${s.cta2 ? `<a class="btn btn-outline" href="#features" style="color:#fff;border-color:rgba(255,255,255,.3)">${s.cta2}</a>` : ''}
          </div>
        </div>
      </section>`;
    },
    features(s) {
      const items = s.items.length
        ? s.items.map((f) => `
          <article class="feature-card reveal">
            <div class="feature-icon">${icon(f.icon || 'grid')}</div>
            <h3>${f.title}</h3>
            <p>${f.text}</p>
          </article>`).join('')
        : '<p style="color:var(--color-ink-muted)">Añade características desde el panel del constructor.</p>';
      return `
      <section class="builder-section" id="features" data-sec="features">
        <div class="container">
          <div class="sec-head">
            <div>
              <span class="eyebrow">Por qué NOVA</span>
              <h2 class="section-title">${s.title || 'Características'}</h2>
              ${s.text ? `<p class="section-sub">${s.text}</p>` : ''}
            </div>
          </div>
          <div class="feature-grid">${items}</div>
        </div>
      </section>`;
    },
    products(s) {
      return `
      <section class="builder-section" id="products" data-sec="products">
        <div class="container">
          <div class="sec-head">
            <div>
              <span class="eyebrow">Tienda</span>
              <h2 class="section-title">${s.title || 'La colección'}</h2>
              ${s.text ? `<p class="section-sub">${s.text}</p>` : ''}
            </div>
          </div>
          <div class="product-grid" data-products></div>
        </div>
      </section>`;
    },
    stats(s) {
      const stats = s.stats.map((st) => `
        <div class="stat-card">
          <div class="num">${st.num}</div>
          <div class="lbl">${st.lbl}</div>
        </div>`).join('');
      return `
      <section class="builder-section" data-sec="stats">
        <div class="container">
          <div class="sec-head" style="text-align:center;justify-content:center">
            <div>
              <span class="eyebrow">Impacto</span>
              <h2 class="section-title">${s.title || 'En cifras'}</h2>
            </div>
          </div>
          <div class="stats-grid">${stats}</div>
        </div>
      </section>`;
    },
    testimonials(s) {
      const items = s.items.map((t) => `
        <div class="testimonial">
          <div class="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
          <blockquote>&ldquo;${t.quote}&rdquo;</blockquote>
          <footer>
            <div class="avatar">${t.name.charAt(0)}</div>
            <div><div class="name">${t.name}</div><div class="role">${t.role}</div></div>
          </footer>
        </div>`).join('');
      return `
      <section class="builder-section" data-sec="testimonials">
        <div class="container">
          <div class="sec-head">
            <div>
              <span class="eyebrow">Testimonios</span>
              <h2 class="section-title">${s.title || 'Lo que dicen los clientes'}</h2>
            </div>
          </div>
          <div class="testimonial-grid">${items}</div>
        </div>
      </section>`;
    },
    cta(s) {
      return `
      <section class="builder-section" data-sec="cta">
        <div class="container">
          <div class="cta-band">
            <h2>${s.title || '¿Listo para empezar?'}</h2>
            <p>${s.text || ''}</p>
            <a class="btn btn-primary" href="#contact">${s.cta || 'Empezar'}</a>
          </div>
        </div>
      </section>`;
    }
  };

  function loadSections() {
    try {
      const raw = localStorage.getItem(BUILDER_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch (e) { /* ignore */ }
    return JSON.parse(JSON.stringify(defaultSections));
  }

  function composeLanding(sections) {
    return sections.map((s) => (renderers[s.type] ? renderers[s.type](s) : '')).join('');
  }

  function initBuilder() {
    const out = document.getElementById('landing-root');
    if (!out) return;
    const sections = loadSections();
    out.innerHTML = composeLanding(sections);
    renderProducts(out);
    bindAddButtons(out);
    initReveal(out);
    initForm(out);

    // Expose a minimal builder API for the storefront "Builder" page
    window.NovaBuilder = {
      sections,
      save(next) {
        this.sections = next;
        localStorage.setItem(BUILDER_KEY, JSON.stringify(next));
        out.innerHTML = composeLanding(next);
        renderProducts(out);
        bindAddButtons(out);
        initReveal(out);
        initForm(out);
      },
      add(type) {
        const template = defaultSections.find((s) => s.type === type);
        if (!template) return;
        this.save(this.sections.concat(JSON.parse(JSON.stringify(template))));
      },
      remove(index) {
        const next = this.sections.slice();
        next.splice(index, 1);
        this.save(next);
      },
      move(index, dir) {
        const next = this.sections.slice();
        const target = index + dir;
        if (target < 0 || target >= next.length) return;
        const [item] = next.splice(index, 1);
        next.splice(target, 0, item);
        this.save(next);
      },
      reset() {
        this.save(JSON.parse(JSON.stringify(defaultSections)));
      }
    };
  }

  /* ---------- Init ---------- */
  // Expose shared store data for other modules (product.js, cart.js, admin …)
  window.NovaStore = {
    get catalog() { return catalog; },
    addToCart,
    getCart,
    currency,
    ready: loadCatalog(),
  };

  document.addEventListener('DOMContentLoaded', () => {
    renderCartCount();
    initNav();
    // Render every standalone product grid that is NOT part of the builder root
    rerenderAll();
    initBuilder();
  });
})();

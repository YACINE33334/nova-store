/* =========================================================
   NOVA — Product landing page
   Renders a clean, high-end landing page for a single product
   loaded from /product.html?id=<n>
   ========================================================= */
(function () {
  'use strict';

  function currency(n) {
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0 });
  }

  let waNumber = '';

  // Whitelist sanitizer for rich-text product descriptions (renders the safe
  // subset produced by the WYSIWYG editor; strips anything else).
  function sanitizeRich(html) {
    if (!html) return '';
    const allowed = new Set(['b', 'strong', 'i', 'em', 'u', 's', 'strike', 'h3', 'h4', 'ul', 'ol', 'li', 'p', 'br', 'blockquote', 'a', 'img', 'div', 'span']);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    (doc.body.querySelectorAll('*') || []).forEach((node) => {
      const tag = node.tagName.toLowerCase();
      if (!allowed.has(tag)) {
        node.replaceWith(...Array.from(node.childNodes));
        return;
      }
      if (tag === 'a') {
        const href = node.getAttribute('href') || '';
        if (!/^(https?:)?\/\//i.test(href) && !href.startsWith('#') && !href.startsWith('/')) {
          node.removeAttribute('href');
        } else {
          node.setAttribute('href', href);
          node.setAttribute('target', '_blank');
          node.setAttribute('rel', 'noopener');
        }
      }
      if (tag === 'img') {
        const src = node.getAttribute('src') || '';
        if (!/^(https?:)?\/\//i.test(src) && !src.startsWith('/')) {
          node.removeAttribute('src');
        } else {
          node.setAttribute('src', src);
          node.setAttribute('loading', 'lazy');
          node.setAttribute('style', 'max-width:100%;border-radius:10px;');
        }
      }
      if (tag === 'a' || tag === 'img' || tag === 'li') return;
      for (const attr of Array.from(node.attributes)) {
        if (attr.name !== 'href' && attr.name !== 'src' && attr.name !== 'style') node.removeAttribute(attr.name);
      }
    });
    return doc.body.innerHTML;
  }

  const productIcon = (hue, size) => `
    <svg width="${size}" height="${size}" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <g fill="none" stroke="rgba(11,11,13,.28)" stroke-width="1.5">
        <rect x="18" y="34" width="84" height="70" rx="8"/>
        <circle cx="60" cy="64" r="16"/>
        <path d="M18 76 L46 56 L74 74 L102 58"/>
      </g>
    </svg>`;

  function lighten(hex, amt) {
    try {
      let c = (hex || '#ffffff').replace('#', '');
      if (c.length === 3) c = c.split('').map((x) => x + x).join('');
      const n = parseInt(c, 16);
      let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
      const t = typeof amt === 'number' ? amt : 26;
      r = Math.min(255, r + t); g = Math.min(255, g + t); b = Math.min(255, b + t);
      return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    } catch (e) { return '#ffffff'; }
  }

  const starRow = (rating) => {
    let s = '';
    for (let i = 1; i <= 5; i++) {
      s += i <= Math.round(rating)
        ? '&#9733;'
        : '<span style="opacity:.3">&#9733;</span>';
    }
    return s;
  };

  const reviewsPool = [
    { n: 'Carmen Ruiz', c: 'España', d: 'el 15 de agosto de 2026', s: 5, h: 14, imgs: ['/assets/img/foodwarmer-1.png', '/assets/img/foodwarmer-4.png'], title: 'Calidad excelente y llegada perfecta', body: ['El producto llegó en perfecto estado y muy bien embalado. La calidad se nota desde el primer momento: los materiales y el acabado son de primera.', 'Llevo usando el producto cada día desde que llegó y cumple exactamente lo que promete. La relación calidad-precio me parece de lo mejor del mercado.'] },
    { n: 'Javier Ortega', c: 'Alemania', d: 'el 2 de agosto de 2026', s: 5, h: 9, title: 'Cumple su función a la perfección', body: ['Cumple perfectamente su función y lo uso a diario desde que llegó. No puedo estar más contento con el rendimiento.', 'El diseño es sobrio y elegante, y se sienta de maravilla en cualquier espacio. Repetiré sin duda con esta marca en el futuro.'] },
    { n: 'Lucía Fernández', c: 'Francia', d: 'el 18 de julio de 2026', s: 4, h: 21, imgs: ['/assets/img/foodwarmer-2.png'], title: 'Buen acabado, mejor de lo esperado', body: ['La calidad del acabado es muy buena y en persona luce mucho mejor que en las fotografías del anuncio.', 'Le doy cuatro estrellas porque el envío tardó más de lo prometido, algo que no está relacionado con el producto en sí. Por lo demás, todo correcto.'] },
    { n: 'Antonio Pérez', c: 'Reino Unido', d: 'el 5 de julio de 2026', s: 5, h: 33, imgs: ['/assets/img/foodwarmer-3.png', '/assets/img/foodwarmer-1.png'], title: 'Merece totalmente la pena', body: ['Al principio dudaba, pero merece totalmente la pena. Llevo un mes usándolo todos los días y funciona genial en todo momento.', 'La entrega fue rápida y el embalaje muy cuidada. Se nota que el fabricante pone atención a los detalles y a la experiencia del cliente.'] },
    { n: 'Marta Domínguez', c: 'Italia', d: 'el 20 de junio de 2026', s: 5, h: 7, imgs: ['/assets/img/foodwarmer-4.png'], title: 'Un acierto como regalo', body: ['Lo compré pensando en un regalo y fue un auténtico acierto que gustó muchísimo a la persona que lo recibió.', 'El empaquetado es muy cuidado, con una presentación que se nota de gama alta. La calidad del producto acompaña a la presentación.'] },
    { n: 'Diego Campos', c: 'Portugal', d: 'el 10 de junio de 2026', s: 4, h: 5, title: 'Bien fabricado, con pequeños detalles a mejorar', body: ['Sólido y bien fabricado, se nota que está hecho para durar en el tiempo y aguantar el uso diario.', 'El único pero es que las instrucciones vienen solo en inglés, aunque es fácil de entender por su diseño sencillo e intuitivo.'] },
    { n: 'Paula Navarro', c: 'España', d: 'el 28 de mayo de 2026', s: 5, h: 18, title: 'Entrega rápida y gran calidad', body: ['La entrega fue rapidísima y el producto llegó justo como lo describían en el anuncio, sin sorpresas.', 'Funcionó a la primera y todo perfecto. Definitivamente volveré a comprar aquí por el buen servicio y la calidad.'] },
    { n: 'Sergio Molina', c: 'España', d: 'el 14 de mayo de 2026', s: 3, h: 11, title: 'Correcto por el precio', body: ['Está bien para el precio que tiene. El acabado es correcto aunque no es perfecto: se le notan algunas imperfecciones pequeñas en el detalle.', 'Aun así, cumple lo que promete en su ficha y hace bien su función principal, que al final es lo importante.'] },
    { n: 'Andrés Torres', c: 'España', d: 'el 9 de abril de 2026', s: 5, h: 12, imgs: ['/assets/img/foodwarmer-2.png'], title: 'Muy contento con la compra', body: ['Sigo sorprendido por lo bien que está hecho para lo que cuesta. Se ve elegante y funciona como debe desde el primer día.', 'Lo he recomendado ya a dos amigos y ambos están igual de satisfechos. Sin duda una apuesta segura.'] },
    { n: 'Nora El Mansouri', c: 'Marruecos', d: 'el 27 de marzo de 2026', s: 4, h: 6, title: 'Muy buen producto, atención al detalle', body: ['El diseño es cuidado y los materiales se sienten de calidad. La presentación del embalaje también muy profesional.', 'Le falta muy poco para ser perfecto: un manual con más idiomas habría estado mejor, aunque por intuición se usa sin problemas.'] },
    { n: 'Hugo Ferreiro', c: 'España', d: 'el 12 de marzo de 2026', s: 5, h: 22, imgs: ['/assets/img/foodwarmer-4.png', '/assets/img/foodwarmer-3.png'], title: 'Compré con dudas y acerté', body: ['Leía reseñas por si merecía la pena y me animé. No ha podido salir mejor: calidad, acabados y funcionamiento están a la altura.', 'La entrega fue puntual y el paquete llegó impecable. Repetiré con esta tienda sin pensármelo.'] },
    { n: 'Isabel Romero', c: 'España', d: 'el 28 de febrero de 2026', s: 5, h: 4, title: 'Cumple todas las expectativas', body: ['Lo uso prácticamente a diario desde hace semanas y sigue como el primer día. Muy bien pensado y muy fácil de usar.', 'La relación calidad-precio es excelente. No tengo ninguna queja, al contrario.'] },
    { n: 'Marco Sandri', c: 'Italia', d: 'el 15 de febrero de 2026', s: 4, h: 9, title: 'Buen equilibrio entre precio y calidad', body: ['Por el precio que tiene, la construcción y el acabado están muy por encima de lo esperado.', 'Le doy cuatro estrellas porque creo que el cable podría ser un poco más largo, pero es un detalle menor.'] },
    { n: 'Inés Vidal', c: 'España', d: 'el 2 de febrero de 2026', s: 5, h: 15, imgs: ['/assets/img/foodwarmer-1.png'], title: 'Un regalo que acertó', body: ['Lo elegí como regalo y la reacción fue mejor de lo que imaginaba. La presentación y la calidad lo dicen todo.', 'Encima la entrega fue rápida y sin ninguna incidencia. Experiencia de compra impecable.'] },
    { n: 'Daniela Costa', c: 'Portugal', d: 'el 19 de enero de 2026', s: 5, h: 8, title: 'Perfecto para el día a día', body: ['Es justo lo que buscaba: sencillo, bien hecho y con un diseño que no desentona en ningún sitio.', 'Lo recomiendo sin reservas si quieres algo fiable sin pagar de más.'] },
    { n: 'Youssef Benali', c: 'Marruecos', d: 'el 7 de enero de 2026', s: 4, h: 5, title: 'Buena compra, pequeño margen de mejora', body: ['El producto funciona muy bien y el acabado está cuidado. El manejo de los ajustes es intuitivo.', 'Solo eché en falta un par de opciones extra, pero nada importante en el uso diario.'] },
    { n: 'Candela Ortiz', c: 'España', d: 'el 20 de diciembre de 2025', s: 5, h: 17, imgs: ['/assets/img/foodwarmer-4.png'], title: 'La mejor compra del año', body: ['Llevo meses comparando opciones y esta ha sido, sin discusión, la mejor elección posible.', 'Todo lo que promete en la ficha lo cumple, y con creces. El equipo de atención al cliente, de diez también.'] },
    { n: 'Emilio Ríos', c: 'España', d: 'el 5 de diciembre de 2025', s: 4, h: 7, title: 'Muy recomendable para este precio', body: ['No me arrepiento de la compra: cumple su función de forma sobresaliente y con un acabado muy aceptable.', 'Es posible que no quede a la altura de opciones el doble de caras, pero por este precio es difícil encontrar algo mejor.'] },
    { n: 'Amelie Laurent', c: 'Francia', d: 'el 22 de noviembre de 2025', s: 5, h: 11, title: 'Nada que objetar', body: ['Producto entregado a tiempo, embalaje impecable y calidad evidente desde el primer uso.', 'Aprendimos a usarlo sin leer casi el manual, así de intuitivo es. Volveremos a comprar aquí.'] },
    { n: 'Raúl Merino', c: 'España', d: 'el 8 de noviembre de 2025', s: 3, h: 13, title: 'Correcto, con matices', body: ['Cumple lo esencial y el precio es justo, pero los acabados podrían pulirse un poco más en ciertos detalles.', 'Si buscas algo funcional sin complicaciones, es una opción válida.'] }
  ];

  // Resolve the list of reviews to display for a product.
  // Custom per-product reviews (p.reviewsArray) take priority; otherwise we
  // fall back to a deterministic slice of the shared pool.
  function resolveReviews(p) {
    if (p.reviewsArray && p.reviewsArray.length) return p.reviewsArray;
    const list = [];
    for (let i = 0; i < reviewsPool.length; i++) {
      list.push(reviewsPool[(p.id * 3 + i) % reviewsPool.length]);
    }
    return list;
  }

  function ratingDist(r) {
    if (r >= 4.8) return { s5: 82, s4: 13, s3: 3, s2: 1, s1: 1 };
    if (r >= 4.7) return { s5: 78, s4: 15, s3: 4, s2: 1, s1: 2 };
    if (r >= 4.6) return { s5: 75, s4: 17, s3: 4, s2: 2, s1: 2 };
    if (r >= 4.5) return { s5: 72, s4: 18, s3: 5, s2: 2, s1: 3 };
    return { s5: 68, s4: 19, s3: 6, s2: 3, s1: 4 };
  }

  function reviewsHtml(p, list) {
    const totalCount = (p.reviewsArray && p.reviewsArray.length) ? list.length : (p.reviews || list.length);
    const pagePhotos = [];
    for (let i = 0; i < list.length; i++) {
      const r = list[i];
      if (r.imgs && r.imgs.length) r.imgs.forEach((src) => pagePhotos.push({ src, review: r }));
    }
    const thumbHtml = (ph, pi) => `
        <button class="rv-strip-thumb" type="button" data-pi="${pi}" aria-label="Foto de ${ph.review.n}">
          <img src="${ph.src}" alt="Foto de ${ph.review.n}">
        </button>`;
    const visibleReviews = list.slice(0, 6);
    const initThumbs = pagePhotos
      .filter((ph) => visibleReviews.includes(ph.review))
      .map((ph) => thumbHtml(ph, pagePhotos.indexOf(ph))).join('');
    const photoStrip = pagePhotos.length
      ? `
        <div class="rv-strip-sec">
          <div class="rv-strip-head">
            <h4>Fotos de clientes</h4>
            <a href="#" class="rv-strip-all">Ver todas las fotos &rarr;</a>
          </div>
          <div class="rv-strip">
            ${initThumbs}
          </div>
        </div>` : '';
    const d = ratingDist(p.rating);
    const bars = ['5', '4', '3', '2', '1'].map((s) => {
      const v = d['s' + s];
      return `
        <div class="rv-bar">
          <span class="rv-bar-label">${s} &star;</span>
          <span class="rv-bar-track"><span class="rv-bar-fill" style="width:${v}%"></span></span>
          <span class="rv-bar-pct">${v}%</span>
        </div>`;
    }).join('');
    const items = list.map((r, i) => {
      const rPhotos = (r.imgs || []).map((src) => {
        const pi = pagePhotos.findIndex((ph) => ph.src === src && ph.review === r);
        return `
          <button class="rv-photo" type="button" data-pi="${pi}" aria-label="Ver foto de ${r.n}">
            <img src="${src}" alt="Foto de ${r.n}">
          </button>`;
      }).join('');
      const photos = rPhotos
        ? `<div class="rv-photos">${rPhotos}</div>`
        : '';
      return `
      <article class="rv${i >= 6 ? ' rv-extra' : ''}" data-n="${r.n}" data-r="${r.s}" data-pol="${r.pol || (Number(r.s) >= 4 ? 'pos' : 'neg')}">
        <div class="rv-head">
          <span class="rv-avatar"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-3.9 0-7 2.2-7 6v1h14v-1c0-3.8-3.1-6-7-6Z"/></svg></span>
          <span class="rv-name">${r.n}</span>
        </div>
        <div class="rv-rating">
          <span class="rv-stars">${starRow(r.s)}</span>
          <h5 class="rv-title">${r.title}</h5>
        </div>
        <div class="rv-meta">Rese&ntilde;ado en ${r.c} ${r.d}</div>
        <div class="rv-verified">Compra verificada</div>
        <div class="rv-body">
          ${r.body.map((bp) => `<p>${bp}</p>`).join('')}
        </div>
        ${photos}
        <button class="rv-moretoggle" type="button" aria-expanded="false"><span>&or;</span> Leer m&aacute;s</button>
      </article>`;
    }).join('');
    return `
      <div class="reviews">
        <div class="rv-summary">
          <div class="rv-score">
            <div class="rv-score-num">${p.rating}</div>
            <div class="rv-score-stars">${starRow(p.rating)}</div>
            <div class="rv-score-total">${totalCount} ${totalCount === 1 ? 'rese&ntilde;a' : 'rese&ntilde;as'} &middot; ${p.sold ? p.sold + ' vendidos' : ''}</div>
          </div>
          <div class="rv-bars">${bars}</div>
          <button class="btn rv-write" type="button">Escribir una rese&ntilde;a</button>
        </div>
        <div class="rv-list">
          ${photoStrip}
          <div class="rv-filter">
            <button class="rv-chip active" type="button">Todas</button>
            <button class="rv-chip" type="button">Positivas</button>
            <button class="rv-chip" type="button">Negativas</button>
          </div>
          ${items}
          <button class="btn rv-more" type="button">Ver todas las rese&ntilde;as</button>
        </div>
      </div>`;
  }

  function renderNotFound(root) {
    root.innerHTML = `
      <section class="section" style="min-height:60vh">
        <div class="container" style="text-align:center;max-width:520px">
          <span class="eyebrow">Producto no encontrado</span>
          <h1 class="section-title">Este producto no existe.</h1>
          <p class="section-sub" style="margin:0 auto 24px">Es posible que la página se haya movido o que el producto ya no esté disponible.</p>
          <a class="btn btn-accent" href="/#products">Volver a la colección</a>
        </div>
      </section>`;
  }

  function render(product, root) {
    const cat = product.cat || 'Product';
    const resolvedReviews = resolveReviews(product);
    const reviewCount = (product.reviewsArray && product.reviewsArray.length)
      ? product.reviewsArray.length
      : (product.reviews || 0);
    const price = product.old
      ? `<span class="p-price">${currency(product.price)}</span><span class="p-price-old">${currency(product.old)}</span>`
      : `<span class="p-price">${currency(product.price)}</span>`;

    const waHref = waNumber
      ? `https://wa.me/${waNumber}?text=${encodeURIComponent('Hola, quiero hacer una consulta sobre el producto ' + (product.name || '') + '.')}`
      : `https://wa.me/?text=${encodeURIComponent('Hola, quiero hacer una consulta sobre el producto ' + (product.name || '') + '.')}`;

    const features = product.features && product.features.length
      ? product.features.map((f) => `
          <li class="p-feat">
            <span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg></span>
            ${f}
          </li>`).join('')
      : '<li class="p-feat" style="color:var(--color-ink-muted)">Más detalles muy pronto.</li>';

    // Badge on gallery
    let badge = '';
    if (product.old) badge = '<span class="p-gallery-badge sale">Rebajas</span>';
    else if (product.tag) badge = `<span class="p-gallery-badge ${product.tag}">${product.tag === 'new' ? 'Nuevo' : 'Rebajas'}</span>`;
    else if (product.stock === 0) badge = '<span class="p-gallery-badge zero">Agotado</span>';

    // Gallery: hue fallbacks + real images
    const galleryHues = [
      product.hue || '#e7ecf3',
      product.hue ? '#f2f0ea' : '#f2f0ea',
      product.hue ? lighten(product.hue) : '#e7ecf3'
    ];
    const productImgs = (product.images && product.images.length) ? product.images : null;
    const mainContent = productImgs
      ? `<img class="p-photo" src="${productImgs[0]}" alt="${product.name}">`
      : `<span class="p-main-slot">${productIcon(galleryHues[0], 300)}</span>`;
    const thumbs = (productImgs || galleryHues).map((src, i) => `
      <button class="p-thumb${i === 0 ? ' active' : ''}" data-thumb="${i}" style="background:${productImgs ? '#f5f5f5' : src}" aria-label="Ver imagen ${i + 1}">
        ${productImgs ? `<img src="${src}" alt="Imagen ${i + 1}">` : productIcon(src, 60)}
      </button>`).join('');

    // Variants (size + color selectors as placeholder UI)
    
    root.innerHTML = `
      <!-- BREADCRUMB -->
      <div class="container p-crumb">
        <a href="/">Inicio</a><span>/</span>
        <a href="/#products">Tienda</a><span>/</span>
        <span class="crumb-current">${product.name}</span>
      </div>

      <!-- PRODUCT: gallery + info -->
      <section class="container p-grid">
        <!-- Gallery -->
        <div class="p-gallery">
          <div class="p-main-img" style="background:${productImgs ? '#fff' : galleryHues[0]}">
            ${badge}
            ${mainContent}
          </div>
          <div class="p-thumbs">${thumbs}</div>
        </div>

        <!-- Info -->
        <div class="p-info">
          <span class="eyebrow">${cat}</span>
          <h1 class="p-title">${product.headline || product.name}</h1>
          <div class="p-rating">
            <span class="stars">${starRow(product.rating)}</span>
            <span class="p-reviews">${product.rating} &middot; <a href="#resenas">${reviewCount} ${reviewCount === 1 ? 'rese&ntilde;a' : 'rese&ntilde;as'}</a></span>
          </div>

          <div class="p-price-wrap">${price}
            ${product.old ? `<span class="p-save">Ahorra ${currency(product.old - product.price)}</span>` : ''}
          </div>

          ${product.low30 !== false ? `
          <div class="p-low30">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8h.01M12 12v4"/></svg>
            <span>Precio más bajo en los últimos 30 días</span>
          </div>` : ''}

          <img class="p-delivery-img" src="/assets/img/ZR.png" alt="Contra reembolso">

          <!-- Actions -->
          <div class="p-actions">
            <div class="p-buy-cta">
              <button class="btn btn-accent btn-lg p-buy-main" id="p-buy">${product.cta || 'Comprar ahora'}</button>
              <a class="p-wa" href="${waHref}" target="_blank" rel="noopener">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.85 9.85 0 0 0 12.04 2Zm5.83 14.12c-.25.7-1.45 1.33-2.03 1.41-.52.08-1.18.11-1.9-.12-.44-.14-1-.32-1.72-.63-3.02-1.3-4.99-4.34-5.14-4.54-.15-.2-1.23-1.63-1.23-3.11 0-1.48.78-2.21 1.05-2.51.28-.3.6-.38.8-.38.2 0 .4 0 .57.01.18.01.43-.07.67.51.25.59.84 2.04.91 2.19.07.15.12.32.02.51-.09.2-.14.32-.28.5-.14.17-.29.39-.42.52-.14.14-.28.29-.12.57.16.27.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.21 1.37.27.14.43.12.59-.07.16-.2.68-.79.86-1.06.18-.27.36-.22.6-.13.25.09 1.58.75 1.86.88.27.14.46.2.52.31.07.12.07.68-.18 1.37Z"/></svg>
                <span>¿Tienes alguna duda? Escríbenos</span>
              </a>
            </div>
          </div>

          <div class="p-trust reveal">
            <div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 2 3 6v6c0 5 3.8 8.4 9 10 5.2-1.6 9-5 9-10V6l-9-4Z"/><path d="m9 12 2 2 4-4"/></svg>Pago seguro</div>
            <div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 17h14M5 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm14 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"/><path d="M5 17V7h11l1.5 5H7"/></svg>Envío gratis</div>
            <div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 3"/></svg>Devoluciones en 30 días</div>
          </div>

          <div class="p-meta">
            <div><span>SKU</span><strong>${product.sku || 'NV-' + String(product.id).padStart(4, '0')}</strong></div>
            <div><span>Material</span><strong>${product.material || 'Grado premium'}</strong></div>
            <div><span>Origen</span><strong>${product.origen || 'Hecho en la UE'}</strong></div>
          </div>
        </div>
      </section>

      <!-- TABS -->
      <section class="p-tabs-sec">
        <div class="container">
          <div class="p-info-block">
          <h3 class="p-block-title">Detalles</h3>
          <div class="p-desc">${sanitizeRich(product.desc)}</div>
          <ul class="p-feats">${features}</ul>
          </div>

          <div class="p-info-block" id="resenas">
            <h3 class="p-block-title">Rese&ntilde;as (${reviewCount})</h3>
            ${reviewsHtml(product, resolvedReviews)}
          </div>

          <div class="p-info-block">
            <h3 class="p-block-title">Env&iacute;os y devoluciones</h3>
            <p>Env&iacute;o est&aacute;ndar gratuito en todos los pedidos superiores a 100&nbsp;&#36;. Los pedidos suelen enviarse en 24 horas y llegan en 3&ndash;5 d&iacute;as laborables.</p>
            <p>&iquest;No es exactamente lo que buscabas? Devuelve cualquier art&iacute;culo en un plazo de 30 d&iacute;as y te reembolsaremos el importe completo, sin preguntas.</p>
          </div>
        </div>
      </section>
    `;

    // --- Interactions ---

    // Review photos lightbox (strip + inline card photos, event delegation)
    const pagePhotos = [];
    for (let i = 0; i < resolvedReviews.length; i++) {
      const r = resolvedReviews[i];
      if (r.imgs && r.imgs.length) r.imgs.forEach((src) => pagePhotos.push({ src, review: r }));
    }
    root.addEventListener('click', (ev) => {
      const el = ev.target.closest('.rv-strip-thumb, .rv-photo');
      if (!el) return;
      const ph = pagePhotos[Number(el.getAttribute('data-pi'))];
        if (!ph) return;
        const r = ph.review;
        const old = document.querySelector('.rv-lbox');
        if (old) old.remove();
        const box = document.createElement('div');
        box.className = 'rv-lbox';
        box.innerHTML = `
          <div class="rv-lbox-backdrop"></div>
          <div class="rv-lbox-card">
            <figure class="rv-lbox-media">
              <img src="${ph.src}" alt="Foto del cliente">
            </figure>
            <aside class="rv-lbox-review">
              <div class="rv-lbox-review-head">
                <span class="rv-avatar"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-3.9 0-7 2.2-7 6v1h14v-1c0-3.8-3.1-6-7-6Z"/></svg></span>
                <div>
                  <div class="rv-name">${r.n}</div>
                  <div class="rv-rating">
                    <span class="rv-stars">${starRow(r.s)}</span>
                    <h5 class="rv-title">${r.title}</h5>
                  </div>
                  <div class="rv-meta">Rese&ntilde;ado en ${r.c} ${r.d}</div>
                  <div class="rv-verified">Compra verificada</div>
                </div>
              </div>
              <div class="rv-body">
                ${r.body.map((bp) => `<p>${bp}</p>`).join('')}
              </div>
            </aside>
            <button class="rv-lbox-close" type="button" aria-label="Cerrar">&times;</button>
          </div>`;
        document.body.appendChild(box);
        box.addEventListener('click', () => { box.remove(); document.body.style.overflow = ''; });
        box.querySelector('.rv-lbox-close').addEventListener('click', (e) => { e.stopPropagation(); box.remove(); document.body.style.overflow = ''; });
        document.querySelector('.rv-lbox-card').addEventListener('click', (e) => e.stopPropagation());
        document.body.style.overflow = 'hidden';
    });

    // Ver todas las reseñas toggle (shows/hides the extra reviews + strip photos)
    const moreBtn = root.querySelector('.rv-more');
    if (moreBtn) {
      moreBtn.addEventListener('click', () => {
        const rvList = root.querySelector('.rv-list');
        if (!rvList) return;
        const expanded = rvList.classList.toggle('expanded');
        moreBtn.textContent = expanded ? 'Ver menos' : 'Ver todas las rese\u00f1as';
        const strip = root.querySelector('.rv-strip');
        if (strip && pagePhotos.length) {
          strip.innerHTML = pagePhotos.map((ph, pi) => `
            <button class="rv-strip-thumb" type="button" data-pi="${pi}" aria-label="Foto de ${ph.review.n}">
              <img src="${ph.src}" alt="Foto de ${ph.review.n}">
            </button>`).join('');
        }
        const activeChip = root.querySelector('.rv-chip.active');
        if (activeChip) {
          const idx = [...root.querySelectorAll('.rv-chip')].indexOf(activeChip);
          applyFilter(idx === 0 ? 'all' : idx === 1 ? 'pos' : 'neg');
        }
        const hidden = document.querySelector('.rv-extra');
        if (hidden) hidden.scrollIntoView({ block: 'start' });
      });
    }

    // Filter chips: Todas / Positivas / Negativas
    const chips = root.querySelectorAll('.rv-chip');
    const applyFilter = (mode) => {
      const rvList = root.querySelector('.rv-list');
      if (!rvList) return;
      let expandNow = rvList.classList.contains('expanded');
      const matches = { top: 0, extra: 0 };
      root.querySelectorAll('.rv').forEach((card) => {
        const pol = card.dataset.pol;
        const match =
          mode === 'all' ? true :
          mode === 'pos' ? pol !== 'neg' :
          mode === 'neg' ? pol === 'neg' : true;
        if (match) {
          if (card.classList.contains('rv-extra')) matches.extra += 1;
          else matches.top += 1;
        }
      });
      if (mode !== 'all' && matches.top === 0 && matches.extra > 0) {
        expandNow = true;
      }
      root.querySelectorAll('.rv').forEach((card) => {
        const pol = card.dataset.pol;
        const match =
          mode === 'all' ? true :
          mode === 'pos' ? pol !== 'neg' :
          mode === 'neg' ? pol === 'neg' : true;
        const isExtra = card.classList.contains('rv-extra');
        const visible = match && (!isExtra || expandNow);
        card.style.display = visible ? '' : 'none';
      });
      if (expandNow) rvList.classList.add('expanded');
      moreBtn.textContent = (mode === 'pos')
        ? (expandNow ? 'Ver menos' : 'Ver todas las positivas')
        : (mode === 'neg')
          ? (expandNow ? 'Ver menos' : 'Ver todas las negativas')
          : (expandNow ? 'Ver menos' : 'Ver todas las rese\u00f1as');
    };
    chips.forEach((chip, idx) => {
      chip.addEventListener('click', () => {
        chips.forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        applyFilter(idx === 0 ? 'all' : idx === 1 ? 'pos' : 'neg');
      });
    });

    // Read more / Leer más toggle
    root.querySelectorAll('.rv').forEach((card) => {
      const body = card.querySelector('.rv-body');
      const toggle = card.querySelector('.rv-moretoggle');
      if (!body || !toggle) return;
      if (body.scrollHeight <= 260) {
        toggle.style.display = 'none';
      } else {
        body.classList.add('collapsed');
        toggle.addEventListener('click', () => {
          const expanded = body.classList.toggle('collapsed');
          toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
          toggle.innerHTML = expanded ? '<span>&or;</span> Leer m&aacute;s' : '<span>&and;</span> Leer menos';
        });
      }
    });

    // Size options
    
    // Gallery: main image + thumbnails (with swipe / horizontal-scroll)
    let curPhoto = 0;
    const photoCount = (productImgs || galleryHues).length;
    const mainImg = root.querySelector('.p-main-img');

    const showPhoto = (i) => {
      curPhoto = (i + photoCount) % photoCount;
      root.querySelectorAll('.p-thumb').forEach((t) => {
        t.classList.toggle('active', Number(t.getAttribute('data-thumb')) === curPhoto);
      });
      if (productImgs && mainImg.querySelector('.p-photo')) {
        mainImg.querySelector('.p-photo').src = productImgs[curPhoto];
      } else {
        const hue = galleryHues[curPhoto];
        mainImg.style.background = hue;
        mainImg.querySelector('.p-main-slot').innerHTML = productIcon(hue, 300);
      }
    };

    // Click on thumbnails
    root.querySelectorAll('.p-thumb').forEach((el) => {
      el.addEventListener('click', () => showPhoto(Number(el.getAttribute('data-thumb'))));
    });

    // Swipe (touch / mouse drag) on the big image
    let swipeStart = null;
    mainImg.addEventListener('pointerdown', (e) => { swipeStart = e.clientX; mainImg.classList.add('grabbing'); });
    mainImg.addEventListener('pointerup', (e) => {
      mainImg.classList.remove('grabbing');
      if (swipeStart === null) return;
      const dx = e.clientX - swipeStart;
      swipeStart = null;
      if (Math.abs(dx) < 40) return;
      showPhoto(dx < 0 ? curPhoto + 1 : curPhoto - 1);
    });
    mainImg.addEventListener('pointercancel', () => { swipeStart = null; mainImg.classList.remove('grabbing'); });
    mainImg.addEventListener('pointerleave', () => { mainImg.classList.remove('grabbing'); });

    // Horizontal scroll (trackpad / mouse wheel) on the big image
    mainImg.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      showPhoto(e.deltaX > 0 ? curPhoto + 1 : curPhoto - 1);
    }, { passive: false });

    // Buy Now → open the order form page with product, qty 1
    const goBuy = () => {
      location.href = '/order.html?id=' + product.id + '&qty=1';
    };
    $('#p-buy').addEventListener('click', goBuy);

    // Sticky bottom CTA: price + "Comprar ahora", shown only after scrolling past the buy section
    const stickyBar = document.getElementById('p-sticky');
    if (stickyBar) {
      const sp = document.getElementById('p-sticky-price');
      if (sp) sp.textContent = currency(product.price);
      if (product.old && sp) {
        sp.innerHTML = currency(product.price) + ' <s class="p-sticky-price-old">' + currency(product.old) + '</s>';
      }
      const stickyBtn = document.getElementById('p-buy-sticky');
      if (stickyBtn) stickyBtn.addEventListener('click', goBuy);

      const buyCta = root.querySelector('.p-buy-cta');
      const updateSticky = () => {
        if (!buyCta) { stickyBar.hidden = true; return; }
        stickyBar.hidden = !(buyCta.getBoundingClientRect().top < 0 && window.scrollY > 10);
      };
      updateSticky();
      window.addEventListener('scroll', updateSticky, { passive: true });
      window.addEventListener('resize', updateSticky);
    }

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
        });
      }, { threshold: 0.06 });
      root.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => io.observe(el));
    } else {
      root.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
    }
  }

  const $ = (sel, scope) => (scope || document).querySelector(sel);

  const RETRYABLE = [502, 503, 504];
  async function fetchJson(url, attempt) {
    let res;
    try {
      res = await fetch(url, { cache: 'no-store' });
    } catch (e) {
      if (!attempt) { await sleep(1200); return fetchJson(url, true); }
      throw e;
    }
    if (!res.ok && RETRYABLE.includes(res.status) && !attempt) {
      await sleep(1500);
      return fetchJson(url, true);
    }
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('product-root');
    if (!root) return;
    root.innerHTML = '<section class="section" style="min-height:60vh;display:grid;place-items:center"><div style="text-align:center;color:var(--color-ink-muted)">Cargando producto…</div></section>';
    const id = Number(new URLSearchParams(location.search).get('id'));

    (async () => {
      let product = null;
      // Store settings (WhatsApp number, etc.)
      try {
        const s = await fetchJson('/api/settings');
        if (s && s.whatsapp) {
          let num = String(s.whatsapp).trim();
          num = num.replace(/[^\d]/g, '').replace(/^00/, '');
          waNumber = num;
        }
      } catch (e) { /* keep default */ }
      // Primary source: the live API (works even if the shared catalog/JS is stale)
      try {
        const j = await fetchJson('/api/products?id=' + id);
        if (j && j.id) product = j;
      } catch (e) { /* fall through */ }
      // Fallback: shared catalog (seed / offline)
      if (!product && window.NovaStore) {
        product = window.NovaStore.catalog.find((p) => p.id === id) || null;
      }
      if (!product) { renderNotFound(root); return; }

      // Landing-page copy merges over the product data
      const P = Object.assign({}, product, product.landing || {});

      // Meta
      document.title = P.name + ' — NOVA';
      $('#og-title', document.head).setAttribute('content', P.name + ' — NOVA');
      $('#og-desc', document.head).setAttribute('content', P.desc.slice(0, 150));
      const mdesc = document.querySelector('meta[name="description"]');
      if (mdesc) mdesc.setAttribute('content', P.desc.slice(0, 160));

      render(P, root);
    })();
  });
})();
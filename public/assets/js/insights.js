/* =========================================================
   NOVA — Insights page
   Editorial article grid with category + search filters
   ========================================================= */
(function () {
  'use strict';

  const articles = [
    {
      cat: 'Novedades', date: '4 sept 2026', min: 3, title: 'Hervidor Inteligente: lo nuevo en tu cocina',
      ex: 'Control digital de temperatura, temporizador de 24 horas y un acabado pensado para durar. Así es nuestro nuevo hervidor.',
      hue: '#eef0f0', url: '/product.html?id=10',
    },
    {
      cat: 'Guías de compra', date: '29 ago 2026', min: 4, title: 'Guía de tallas: camisa Aurelia',
      ex: 'De la avalancha del hombro al largo del faldón: cómo elegir tu talla para que quede justo como te gusta.',
      hue: '#e7ecf3', url: '/product.html?id=1',
    },
    {
      cat: 'Cuidado', date: '21 ago 2026', min: 5, title: 'Cómo cuidar tu lino para que dure años',
      ex: 'Tres gestos sencillos que mantienen el lino suave sin perder su estructura, temporada tras temporada.',
      hue: '#f0ead8', url: '/product.html?id=1',
    },
    {
      cat: 'Detrás de escena', date: '12 ago 2026', min: 6, title: 'En el taller: seda de Como',
      ex: 'Visitamos el taller familiar que estampa nuestros foulards. Pequeños lotes, dobladillos cosidos a mano.',
      hue: '#e3e4ee', url: '/product.html?id=5',
    },
    {
      cat: 'Guías de compra', date: '30 jul 2026', min: 4, title: 'Montar tu tienda en NOVA, en 5 pasos',
      ex: 'Del catálogo al primer pedido sin fricción. Un recorrido breve por el constructor y el panel de administración.',
      hue: '#ece8df', url: '/builder.html',
    },
    {
      cat: 'Cuidado', date: '18 jul 2026', min: 3, title: 'Mantener tu abrigo Meridian impecable',
      ex: 'Cepillado en seco, perchas anchas y muy poca agua: cómo conservar la mezcla de lana como el primer día.',
      hue: '#eef1f7', url: '/product.html?id=2',
    },
  ];

  const grid = document.querySelector('[data-insights]');
  const empty = document.querySelector('.in-empty');
  const field = document.getElementById('in-search');
  const filter = document.getElementById('in-filter');

  if (!grid) return;

  function card(a) {
    return `
      <article class="in-card">
        <a class="in-media" style="background:${a.hue}" href="${a.url}" aria-label="${a.title}">
          <span class="in-tag">${a.cat}</span>
          <span class="in-mono" aria-hidden="true">${a.title.charAt(0)}</span>
        </a>
        <div class="in-body">
          <div class="in-meta">${a.date} · ${a.min} min de lectura</div>
          <h3 class="in-title"><a href="${a.url}">${a.title}</a></h3>
          <p class="in-ex">${a.ex}</p>
        </div>
      </article>`;
  }

  function render() {
    const cat = (filter.querySelector('.is-active') || {}).dataset?.cat || 'all';
    const q = (field.value || '').trim().toLowerCase();
    const shown = articles.filter((a) => {
      if (cat !== 'all' && a.cat !== cat) return false;
      if (q && !a.title.toLowerCase().includes(q)) return false;
      return true;
    });
    grid.innerHTML = shown.map(card).join('');
    if (empty) empty.style.display = shown.length ? 'none' : 'block';
  }

  if (filter) {
    filter.querySelectorAll('.in-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        filter.querySelectorAll('.in-chip').forEach((c) => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        render();
      });
    });
  }
  if (field) field.addEventListener('input', render);

  render();
})();
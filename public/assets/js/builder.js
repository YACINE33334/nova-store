/* =========================================================
   NOVA — Builder controller
   Wires the sidebar controls to window.NovaBuilder API
   ========================================================= */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    if (!window.NovaBuilder) return;
    const api = window.NovaBuilder;

    const listEl = document.getElementById('b-section-list');
    const toastEl = document.getElementById('b-toast');
    let toastTimer = null;

    /* ---- Toast ---- */
    function toast(msg) {
      if (!toastEl) return;
      toastEl.textContent = msg;
      toastEl.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1800);
    }

    /* ---- Section list render ---- */
    function renderList() {
      if (!listEl) return;
      listEl.innerHTML = '<div class="b-group-label">Página actual</div>';
      api.sections.forEach((s, i) => {
        const row = document.createElement('div');
        row.className = 'b-section-row';
        row.innerHTML = `
          <span class="n">${i + 1}</span>
          <span class="type">${s.type.replace(/_/g, ' ')}</span>
          <button class="b-row-btn" data-move="-1" title="Subir" aria-label="Subir">&#8593;</button>
          <button class="b-row-btn" data-move="1" title="Bajar" aria-label="Bajar">&#8595;</button>
          <button class="b-row-btn del" data-remove title="Eliminar" aria-label="Eliminar">&#10005;</button>
        `;
        row.querySelectorAll('[data-move]').forEach((mv) => {
          mv.addEventListener('click', () => {
            api.move(i, Number(mv.dataset.move));
            renderList();
            toast('Sección movida');
          });
        });
        row.querySelector('[data-remove]').addEventListener('click', () => {
          api.remove(i);
          renderList();
          toast('Sección eliminada');
        });
        listEl.appendChild(row);
      });
    }

    /* ---- Add section buttons ---- */
    document.querySelectorAll('[data-add-section]').forEach((btn) => {
      btn.addEventListener('click', () => {
        api.add(btn.dataset.addSection);
        renderList();
        toast('Sección añadida');
      });
    });

    /* ---- Reset ---- */
    const resetBtn = document.getElementById('b-reset');
    if (resetBtn) resetBtn.addEventListener('click', () => {
      api.reset();
      renderList();
      toast('Página restablecida');
    });

    /* ---- Publish ---- */
    const pubBtn = document.getElementById('b-publish');
    if (pubBtn) pubBtn.addEventListener('click', () => {
      toast('Publicado correctamente');
    });

    renderList();
  });
})();

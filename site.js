/* ================================================================
   L'Escale de Larcher — interactions (V2)
   1. Menu mobile   2. Lightbox   3. Filtres galerie   4. Carte au clic
   Aucune dépendance. Chaque bloc est inactif si ses éléments sont absents.
   ================================================================ */
(function () {
  'use strict';

  // ── 1) Menu mobile ───────────────────────────────────────────
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    var setOpen = function (open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setOpen(false);
        toggle.focus();
      }
    });
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('is-open') && !nav.contains(e.target) && !toggle.contains(e.target)) {
        setOpen(false);
      }
    });
    window.matchMedia('(min-width: 901px)').addEventListener('change', function (mq) {
      if (mq.matches) setOpen(false);
    });
  }

  // ── 2) Lightbox ──────────────────────────────────────────────
  // Toute <figure> dans un conteneur [data-gallery] s'ouvre en plein écran.
  // Les figures masquées (filtre galerie) sont exclues de la navigation.
  var containers = document.querySelectorAll('[data-gallery]');
  if (containers.length) {
    var lb = document.createElement('div');
    lb.className = 'lb';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Photo en plein écran');
    lb.innerHTML =
      '<button type="button" class="lb-close" aria-label="Fermer">×</button>' +
      '<button type="button" class="lb-prev" aria-label="Photo précédente">←</button>' +
      '<figure><img alt=""><figcaption></figcaption></figure>' +
      '<button type="button" class="lb-next" aria-label="Photo suivante">→</button>';
    document.body.appendChild(lb);

    var lbImg = lb.querySelector('img');
    var lbCap = lb.querySelector('figcaption');
    var list = [];
    var index = 0;
    var opener = null;

    var render = function () {
      var fig = list[index];
      var img = fig.querySelector('img');
      var cap = fig.querySelector('figcaption');
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt || '';
      var text = cap ? cap.textContent.trim() : (img.alt || '');
      lbCap.textContent = list.length > 1 ? text + ' — ' + (index + 1) + ' / ' + list.length : text;
    };
    var open = function (fig) {
      var root = fig.closest('[data-gallery]');
      list = Array.prototype.filter.call(root.querySelectorAll('figure'), function (f) { return !f.hidden; });
      index = Math.max(0, list.indexOf(fig));
      if (!list.length) return;
      opener = document.activeElement;
      render();
      lb.classList.add('is-open');
      document.body.classList.add('no-scroll');
      lb.querySelector('.lb-close').focus();
    };
    var close = function () {
      lb.classList.remove('is-open');
      document.body.classList.remove('no-scroll');
      lbImg.removeAttribute('src');
      if (opener && opener.focus) opener.focus();
    };
    var step = function (d) {
      if (!list.length) return;
      index = (index + d + list.length) % list.length;
      render();
    };

    containers.forEach(function (root) {
      root.querySelectorAll('figure').forEach(function (fig) {
        // Rend chaque photo atteignable au clavier
        fig.setAttribute('tabindex', '0');
        fig.setAttribute('role', 'button');
        fig.setAttribute('aria-label', 'Agrandir : ' + ((fig.querySelector('img') || {}).alt || 'photo'));
      });
      root.addEventListener('click', function (e) {
        var fig = e.target.closest('figure');
        if (fig && root.contains(fig)) open(fig);
      });
      root.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        var fig = e.target.closest('figure');
        if (fig) { e.preventDefault(); open(fig); }
      });
    });

    lb.querySelector('.lb-close').addEventListener('click', close);
    lb.querySelector('.lb-prev').addEventListener('click', function () { step(-1); });
    lb.querySelector('.lb-next').addEventListener('click', function () { step(1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'Tab') {
        // Piège le focus dans la boîte de dialogue
        var btns = lb.querySelectorAll('button');
        var first = btns[0], last = btns[btns.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  // ── 3) Filtres de la galerie ─────────────────────────────────
  var chips = document.querySelectorAll('.chip[data-cat]');
  if (chips.length) {
    var figures = document.querySelectorAll('.masonry figure');
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var cat = chip.getAttribute('data-cat');
        chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
        figures.forEach(function (f) {
          f.hidden = !(cat === 'all' || f.getAttribute('data-cat') === cat);
        });
      });
    });
  }

  // ── 4) Carte Google Maps chargée seulement au clic ───────────
  // Évite de déposer des traceurs Google sans action du visiteur (CNIL).
  var mapBtn = document.querySelector('[data-map-src]');
  if (mapBtn) {
    mapBtn.addEventListener('click', function () {
      var box = mapBtn.closest('.map');
      var iframe = document.createElement('iframe');
      iframe.src = mapBtn.getAttribute('data-map-src');
      iframe.title = 'Carte : L’Escale de Larcher';
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      iframe.allowFullscreen = true;
      box.replaceChildren(iframe);
    });
  }
})();

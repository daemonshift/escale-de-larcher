/* ================================================================
   L'Escale de Larcher — Couche d'interaction
   - Scroll progress
   - Reveal on scroll
   - Lightbox (gallery + story images)
   - Animated rating counter
   - Mobile menu body lock + smooth toggle
   - Hero load animation
   ================================================================ */

(function() {
  'use strict';

  // ── 1) Scroll progress bar ────────────────────────────────
  const progress = document.createElement('div');
  progress.className = 'ld-progress';
  document.body.appendChild(progress);

  let ticking = false;
  function updateProgress() {
    const h = document.documentElement;
    const scrolled = h.scrollTop / (h.scrollHeight - h.clientHeight);
    progress.style.width = (Math.min(1, Math.max(0, scrolled)) * 100) + '%';
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateProgress);
      ticking = true;
    }
  }, { passive: true });
  updateProgress();

  // ── 2) Reveal-on-scroll via IntersectionObserver ──────────
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('is-in'));
  }

  // ── 3) Hero load fade-in ──────────────────────────────────
  const hero = document.querySelector('.vb-hero');
  if (hero) {
    requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('is-loaded')));
  }

  // ── 4) Lightbox ───────────────────────────────────────────
  // Collect images: prefer explicit data-lightbox group, else
  // any .vb-gal-grid img / .vb-story-r img / .gl-grid img.
  function collectLightboxImages() {
    const groups = {};
    document.querySelectorAll('[data-lightbox]').forEach(el => {
      const g = el.getAttribute('data-lightbox');
      groups[g] = groups[g] || [];
      const img = el.querySelector('img');
      if (img) groups[g].push({ src: img.currentSrc || img.src, alt: img.alt, el });
    });
    return groups;
  }

  // Auto-tag gallery + story images as lightbox-able
  document.querySelectorAll('.vb-gal-grid > div').forEach(el => {
    if (!el.hasAttribute('data-lightbox')) el.setAttribute('data-lightbox', 'gallery');
  });
  document.querySelectorAll('.vb-story-r > div').forEach(el => {
    if (el.querySelector('img') && !el.hasAttribute('data-lightbox')) {
      el.setAttribute('data-lightbox', 'story');
    }
  });
  document.querySelectorAll('.pg-gal-grid > div').forEach(el => {
    if (!el.hasAttribute('data-lightbox')) el.setAttribute('data-lightbox', 'pg-gallery');
  });
  document.querySelectorAll('.gl-grid > figure').forEach(el => {
    if (!el.hasAttribute('data-lightbox')) el.setAttribute('data-lightbox', 'gl');
  });

  const groups = collectLightboxImages();
  const hasAnyLightbox = Object.keys(groups).length > 0;

  let overlay, imgWrap, captionEl, countEl, currentGroup, currentIndex;

  function buildOverlay() {
    overlay = document.createElement('div');
    overlay.className = 'lb-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = `
      <div class="lb-stage">
        <button class="lb-close" aria-label="Fermer">×</button>
        <span class="lb-count"></span>
        <button class="lb-prev" aria-label="Photo précédente">←</button>
        <div class="lb-img-wrap"><img alt=""></div>
        <button class="lb-next" aria-label="Photo suivante">→</button>
        <span class="lb-caption"></span>
      </div>
    `;
    document.body.appendChild(overlay);
    imgWrap = overlay.querySelector('.lb-img-wrap');
    captionEl = overlay.querySelector('.lb-caption');
    countEl = overlay.querySelector('.lb-count');
    overlay.querySelector('.lb-close').addEventListener('click', closeLb);
    overlay.querySelector('.lb-prev').addEventListener('click', () => navigate(-1));
    overlay.querySelector('.lb-next').addEventListener('click', () => navigate(1));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.classList.contains('lb-stage')) closeLb();
    });
  }

  function openLb(group, index) {
    if (!overlay) buildOverlay();
    currentGroup = groups[group];
    if (!currentGroup) return;
    currentIndex = index;
    renderLb();
    overlay.classList.add('is-open');
    document.body.classList.add('no-scroll');
  }

  function renderLb() {
    const item = currentGroup[currentIndex];
    const img = imgWrap.querySelector('img');
    imgWrap.classList.add('is-fading');
    setTimeout(() => {
      img.src = item.src;
      img.alt = item.alt || '';
      captionEl.textContent = item.alt || '';
      countEl.textContent = (currentIndex + 1).toString().padStart(2,'0') + ' / ' + currentGroup.length.toString().padStart(2,'0');
      imgWrap.classList.remove('is-fading');
    }, 180);
  }

  function navigate(d) {
    if (!currentGroup) return;
    currentIndex = (currentIndex + d + currentGroup.length) % currentGroup.length;
    renderLb();
  }

  function closeLb() {
    if (!overlay) return;
    overlay.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
  }

  if (hasAnyLightbox) {
    // Delegate clicks
    document.body.addEventListener('click', (e) => {
      const target = e.target.closest('[data-lightbox]');
      if (!target) return;
      // Don't intercept clicks on links inside
      if (e.target.closest('a')) return;
      const g = target.getAttribute('data-lightbox');
      const list = groups[g];
      if (!list) return;
      const idx = list.findIndex(item => item.el === target);
      if (idx === -1) return;
      e.preventDefault();
      openLb(g, idx);
    });

    document.addEventListener('keydown', (e) => {
      if (!overlay || !overlay.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeLb();
      else if (e.key === 'ArrowLeft') navigate(-1);
      else if (e.key === 'ArrowRight') navigate(1);
    });
  }

  // ── 5) Animated counter for rating ────────────────────────
  function animateCount(el, target, decimals, duration) {
    const start = performance.now();
    const startVal = 0;
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const val = startVal + (target - startVal) * eased;
      el.textContent = decimals > 0 ? val.toFixed(decimals).replace('.', ',') : Math.floor(val);
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = decimals > 0 ? target.toFixed(decimals).replace('.', ',') : target;
    }
    requestAnimationFrame(tick);
  }

  const rating = document.querySelector('.vb-rev-num .serif-italic');
  if (rating && 'IntersectionObserver' in window) {
    const orig = rating.textContent.trim();
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          animateCount(rating, 4.8, 1, 1400);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });
    io.observe(rating);
  }

  // ── 6) Mobile menu — body lock + body class for X morph ──
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  if (hamburger && mobileMenu) {
    const obs = new MutationObserver(() => {
      const isOpen = mobileMenu.classList.contains('open');
      document.body.classList.toggle('menu-open', isOpen);
      document.body.classList.toggle('no-scroll', isOpen);
    });
    obs.observe(mobileMenu, { attributes: true, attributeFilter: ['class'] });
  }

  // ── 7) Replace scrollIntoView with a safer scrollTo ──────
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id === '#' || id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      // Close mobile menu if open
      if (mobileMenu && mobileMenu.classList.contains('open')) {
        mobileMenu.classList.remove('open');
      }
      const y = target.getBoundingClientRect().top + window.scrollY - 0;
      window.scrollTo({ top: y, behavior: 'smooth' });
    });
  }, { once: true });

})();

// =========================================
// AURORA INTEL — Interações
// =========================================

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

// ---------- ANO NO FOOTER ----------
const yearEl = $('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ---------- CURSOR GLOW ----------
const glow = $('#cursorGlow');
if (glow && window.matchMedia('(pointer: fine)').matches) {
  let gx = 0, gy = 0, tx = 0, ty = 0;
  let active = false;

  window.addEventListener('mousemove', (e) => {
    tx = e.clientX;
    ty = e.clientY;
    if (!active) {
      active = true;
      glow.style.opacity = '1';
    }
  });

  window.addEventListener('mouseleave', () => {
    active = false;
    glow.style.opacity = '0';
  });

  (function animate() {
    gx += (tx - gx) * 0.12;
    gy += (ty - gy) * 0.12;
    glow.style.left = gx + 'px';
    glow.style.top  = gy + 'px';
    requestAnimationFrame(animate);
  })();
}

// ---------- REVEAL ON SCROLL ----------
const revealEls = $$('.reveal');

if ('IntersectionObserver' in window && revealEls.length) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('visible'));
}

// ---------- CONTAGEM ANIMADA DAS STATS ----------
const counters = $$('.stat-num');

function animateCount(el) {
  const target = parseInt(el.dataset.count, 10) || 0;
  const duration = 1400;
  const start = performance.now();

  function step(now) {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * eased);
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = target;
  }
  requestAnimationFrame(step);
}

if ('IntersectionObserver' in window && counters.length) {
  const cio = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        cio.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach((c) => cio.observe(c));
} else {
  counters.forEach((c) => c.textContent = c.dataset.count || '0');
}

// ---------- DEFANG TOGGLE DOS IOCs ----------
const defangBtn = $('#defangToggle');
const iocList = $('#iocList');

if (defangBtn && iocList) {
  let defanged = true;

  function applyDefang() {
    $$('.ioc code', iocList).forEach((code) => {
      const raw = code.dataset.raw || code.textContent;
      code.dataset.raw = raw;

      if (defanged) {
        // [.] para . , hxxp para http, etc.
        code.textContent = raw
          .replace(/\[\.\]/g, '.')
          .replace(/hxxp/gi, 'http')
          .replace(/\[:\]/g, ':');
      } else {
        // Reverter: aplicar defang
        code.textContent = raw
          .replace(/\./g, '[.]')
          .replace(/https?/gi, (m) => m.replace('t', 'x'))
          .replace(/:/g, '[:]');
      }
    });
  }

  // Guarda o valor original como defanged
  $$('.ioc code', iocList).forEach((code) => {
    code.dataset.raw = code.textContent;
  });

  defangBtn.addEventListener('click', () => {
    defanged = !defanged;
    defangBtn.textContent = `Defang: ${defanged ? 'ON' : 'OFF'}`;
    applyDefang();
  });
}

// ---------- NAV ATIVA POR SCROLL ----------
const sections = $$('main section[id]');
const navLinks = $$('.nav-links a');

if (sections.length && navLinks.length && 'IntersectionObserver' in window) {
  const navMap = new Map();
  navLinks.forEach((a) => {
    const id = a.getAttribute('href').replace('#', '');
    navMap.set(id, a);
  });

  const setActive = (id) => {
    navLinks.forEach((a) => a.classList.remove('active'));
    const link = navMap.get(id);
    if (link) link.classList.add('active');
  };

  const sio = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        setActive(entry.target.id);
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

  sections.forEach((s) => sio.observe(s));
}

// ---------- SCROLL SUAVE PARA LINKS INTERNOS ----------
$$('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length <= 1) return;
    const target = document.querySelector(id);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

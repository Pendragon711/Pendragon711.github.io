// =========================================
// DEEP INTEL — Interações (leves)
// =========================================

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

// ---------- ANO NO FOOTER ----------
const yearEl = $('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ---------- PARTÍCULAS PREMIUM (canvas leve) ----------
(function initParticles() {
  const canvas = document.getElementById('particles');
  if (!canvas) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 720px)').matches;
  if (reduce || isMobile) { canvas.style.display = 'none'; return; }

  const ctx = canvas.getContext('2d', { alpha: true });
  let w, h, points = [];
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const LINK_DIST = 160;
  const LINK_DIST_SQ = LINK_DIST * LINK_DIST;

  function resize() {
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function build() {
    const count = Math.min(45, Math.floor((w * h) / 26000));
    points = Array.from({ length: count }, () => {
      const isAmber = Math.random() < 0.18;
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.16,
        vy: (Math.random() - 0.5) * 0.16,
        r: Math.random() * 1.6 + 0.7,
        color: isAmber ? '245,158,11' : '34,211,238',
        glow: isAmber ? 0.75 : 0.55
      };
    });
  }

  function tick() {
    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < points.length; i++) {
      const a = points[i];
      for (let j = i + 1; j < points.length; j++) {
        const b = points[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < LINK_DIST_SQ) {
          const alpha = (1 - d2 / LINK_DIST_SQ) * 0.22;
          ctx.strokeStyle = `rgba(${a.color},${alpha})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    for (const p of points) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;

      ctx.beginPath();
      ctx.fillStyle = `rgba(${p.color},${p.glow})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(tick);
  }

  resize(); build();
  window.addEventListener('resize', () => { resize(); build(); }, { passive: true });
  tick();
})();

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
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('visible'));
}

// ---------- CONTAGEM DAS STATS ----------
const counters = $$('.stat-num');
function animateCount(el) {
  const target = parseInt(el.dataset.count, 10) || 0;
  const duration = 1200;
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

// ---------- DEFANG TOGGLE ----------
const defangBtn = $('#defangToggle');
const iocList = $('#iocList');
if (defangBtn && iocList) {
  let defanged = true;
  $$('.ioc code', iocList).forEach((code) => { code.dataset.raw = code.textContent; });
  function applyDefang() {
    $$('.ioc code', iocList).forEach((code) => {
      const raw = code.dataset.raw;
      code.textContent = defanged
        ? raw.replace(/\[\.\]/g, '.').replace(/hxxp/gi, 'http')
        : raw.replace(/\./g, '[.]').replace(/https?/gi, (m) => m.replace('t', 'x'));
    });
  }
  defangBtn.addEventListener('click', () => {
    defanged = !defanged;
    defangBtn.textContent = `Defang: ${defanged ? 'ON' : 'OFF'}`;
    applyDefang();
  });
}

// ---------- NAV ATIVA ----------
const sections = $$('main section[id]');
const navLinks = $$('.nav-links a');
if (sections.length && navLinks.length && 'IntersectionObserver' in window) {
  const navMap = new Map();
  navLinks.forEach((a) => navMap.set(a.getAttribute('href').replace('#',''), a));
  const setActive = (id) => {
    navLinks.forEach((a) => a.classList.remove('active'));
    const link = navMap.get(id);
    if (link) link.classList.add('active');
  };
  const sio = new IntersectionObserver((entries) => {
    entries.forEach((entry) => { if (entry.isIntersecting) setActive(entry.target.id); });
  }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
  sections.forEach((s) => sio.observe(s));
}

// ---------- SCROLL SUAVE ----------
$$('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length <= 1) return;
    const target = document.querySelector(id);
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});


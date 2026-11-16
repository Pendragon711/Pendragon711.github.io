// =========================================
// DEEP INTEL — Threat Intel Mesh & UI
// =========================================

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

// ---------- ANO NO FOOTER ----------
const yearEl = $('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ---------- MALHA DE THREAT INTELLIGENCE (Canvas Leve) ----------
(function initThreatMesh() {
  const canvas = document.getElementById('particles');
  if (!canvas) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 720px)').matches;
  if (reduce || isMobile) {
    canvas.style.display = 'none';
    return;
  }

  const ctx = canvas.getContext('2d', { alpha: true });
  let w = 0, h = 0;
  let nodes = [];
  let pulses = [];
  let animId = null;
  let lastPulseTime = 0;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const LINK_DIST = 185;
  const LINK_DIST_SQ = LINK_DIST * LINK_DIST;
  const INTEL_TAGS = ['IOC', 'C2', 'T1059', 'WAF', 'ASN', 'HASH', 'TTP', 'PCAP'];

  const mouse = { x: -9999, y: -9999, active: false };

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  }, { passive: true });

  window.addEventListener('mouseleave', () => {
    mouse.active = false;
  }, { passive: true });

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function buildMesh() {
    // Quantidade controlada (~28 a 36 nós) para manter < 0.2ms por frame
    const count = Math.min(36, Math.max(22, Math.floor((w * h) / 42000)));
    pulses = [];

    nodes = Array.from({ length: count }, (_, idx) => {
      const isHub = idx < 7; // 7 nós principais (pivôs de inteligência)
      const isAmber = isHub ? idx % 2 === 0 : Math.random() < 0.18;
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * (isHub ? 0.08 : 0.14),
        vy: (Math.random() - 0.5) * (isHub ? 0.08 : 0.14),
        r: isHub ? 2.6 : Math.random() * 1.1 + 0.9,
        isHub,
        isAmber,
        tag: isHub ? INTEL_TAGS[idx % INTEL_TAGS.length] : null,
        ping: 0 // brilho temporário quando recebe um pulso
      };
    });
  }

  function spawnPulse(now) {
    if (now - lastPulseTime < 1400 || pulses.length >= 4) return;

    // Procura dois nós conectados para enviar um pacote de telemetria
    for (let attempt = 0; attempt < 12; attempt++) {
      const i = Math.floor(Math.random() * nodes.length);
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > 3600 && d2 < LINK_DIST_SQ) {
          pulses.push({
            from: a,
            to: b,
            progress: 0,
            speed: 0.012 + Math.random() * 0.008,
            isAmber: a.isAmber || b.isAmber
          });
          lastPulseTime = now;
          return;
        }
      }
    }
  }

  function render(now) {
    ctx.clearRect(0, 0, w, h);
    ctx.font = '500 9px "JetBrains Mono", monospace';
    ctx.textBaseline = 'middle';

    // 1. Atualiza posições dos nós
    for (const n of nodes) {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 20 || n.x > w - 20) n.vx *= -1;
      if (n.y < 20 || n.y > h - 20) n.vy *= -1;
      if (n.ping > 0) n.ping = Math.max(0, n.ping - 0.02);
    }

    // 2. Desenha conexões da malha (arestas do grafo)
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;

        if (d2 < LINK_DIST_SQ) {
          const ratio = 1 - d2 / LINK_DIST_SQ;
          const isThreatEdge = a.isAmber && b.isAmber;
          const alpha = ratio * (isThreatEdge ? 0.24 : 0.16);

          ctx.strokeStyle = isThreatEdge
            ? `rgba(245, 158, 11, ${alpha})`
            : `rgba(34, 211, 238, ${alpha})`;
          ctx.lineWidth = (a.isHub || b.isHub) ? 0.85 : 0.55;

          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // Triangulação sutil com o cursor do mouse
      if (mouse.active) {
        const mdx = a.x - mouse.x;
        const mdy = a.y - mouse.y;
        const md2 = mdx * mdx + mdy * mdy;
        if (md2 < 24000) {
          const mAlpha = (1 - md2 / 24000) * 0.22;
          ctx.strokeStyle = `rgba(34, 211, 238, ${mAlpha})`;
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
    }

    // 3. Atualiza e desenha pulsos de telemetria trafegando nas arestas
    spawnPulse(now);
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i];
      p.progress += p.speed;

      if (p.progress >= 1) {
        p.to.ping = 1;
        pulses.splice(i, 1);
        continue;
      }

      const px = p.from.x + (p.to.x - p.from.x) * p.progress;
      const py = p.from.y + (p.to.y - p.from.y) * p.progress;

      ctx.beginPath();
      ctx.fillStyle = p.isAmber
        ? 'rgba(245, 158, 11, 0.9)'
        : 'rgba(34, 211, 238, 0.9)';
      ctx.arc(px, py, 2.1, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Desenha os nós (pivôs com anel tático + rótulo discreto)
    for (const n of nodes) {
      const rgb = n.isAmber ? '245, 158, 11' : '34, 211, 238';

      // Anel externo para Hubs ou nós atingidos por pulso
      if (n.isHub || n.ping > 0) {
        const ringRadius = n.r + 4.5 + n.ping * 4;
        const ringAlpha = n.isHub ? 0.28 + n.ping * 0.4 : n.ping * 0.45;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${rgb}, ${ringAlpha})`;
        ctx.lineWidth = 0.8;
        ctx.arc(n.x, n.y, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Núcleo do nó
      ctx.beginPath();
      ctx.fillStyle = `rgba(${rgb}, ${n.isHub ? 0.85 : 0.55})`;
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();

      // Micro-tag de inteligência nos hubs
      if (n.tag) {
        ctx.fillStyle = `rgba(${rgb}, ${0.32 + n.ping * 0.35})`;
        ctx.fillText(n.tag, n.x + 10, n.y);
      }
    }

    animId = requestAnimationFrame(render);
  }

  // Pausa a animação quando a aba não está visível (economia total de bateria/CPU)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (animId) cancelAnimationFrame(animId);
      animId = null;
    } else if (!animId) {
      animId = requestAnimationFrame(render);
    }
  });

  resize();
  buildMesh();
  window.addEventListener('resize', () => {
    resize();
    buildMesh();
  }, { passive: true });
  animId = requestAnimationFrame(render);
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

// ---------- DEFANG / REFANG TOGGLE (IOC FEED) ----------
const defangBtn = $('#defangToggle');
const iocList = $('#iocList');
if (defangBtn && iocList) {
  let defanged = true;
  $$('.ioc code', iocList).forEach((code) => {
    code.dataset.defanged = code.textContent;
  });

  function applyDefang() {
    $$('.ioc code', iocList).forEach((code) => {
      const safe = code.dataset.defanged;
      code.textContent = defanged
        ? safe
        : safe.replace(/\[\.\]/g, '.').replace(/hxxp/gi, 'http');
    });
  }

  defangBtn.addEventListener('click', () => {
    defanged = !defanged;
    defangBtn.textContent = `Defang: ${defanged ? 'ON' : 'OFF'}`;
    defangBtn.style.borderColor = defanged ? 'rgba(245, 158, 11, .35)' : 'rgba(244, 63, 94, .5)';
    defangBtn.style.color = defanged ? 'var(--amber)' : 'var(--rose)';
    defangBtn.style.background = defanged ? 'var(--amber-dim)' : 'rgba(244, 63, 94, .14)';
    applyDefang();
  });
}

// ---------- NAV ATIVA ----------
const sections = $$('main section[id]');
const navLinks = $$('.nav-links a');
if (sections.length && navLinks.length && 'IntersectionObserver' in window) {
  const navMap = new Map();
  navLinks.forEach((a) => navMap.set(a.getAttribute('href').replace('#', ''), a));
  const setActive = (id) => {
    navLinks.forEach((a) => a.classList.remove('active'));
    const link = navMap.get(id);
    if (link) link.classList.add('active');
  };
  const sio = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) setActive(entry.target.id);
    });
  }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
  sections.forEach((s) => sio.observe(s));
}

// ---------- SCROLL SUAVE ----------
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

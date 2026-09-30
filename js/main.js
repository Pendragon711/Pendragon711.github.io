const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const fine = matchMedia("(pointer: fine)").matches;
const root = document.documentElement;
const mouse = { x: -999, y: -999 };

/* Reveal ao rolar */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); }
}), { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach(el => io.observe(el));

/* Menu: seção atual */
const links = [...document.querySelectorAll(".links a")];
const secs = [...document.querySelectorAll("section[id]")];
const spy = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) links.forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id));
}), { rootMargin: "-45% 0px -50% 0px" });
secs.forEach(s => spy.observe(s));

/* Rede viva (hero) */
const cv = document.getElementById("net"), cx = cv.getContext("2d");
let W, H, pts = [], running = false;

function size() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  W = innerWidth; H = innerHeight;
  cv.width = W * dpr; cv.height = H * dpr;
  cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const n = Math.min(100, Math.round(W * H / 16000));
  pts = Array.from({ length: n }, () => ({
    x: Math.random() * W, y: Math.random() * H,
    vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3,
    r: Math.random() * 1.4 + .6
  }));
  if (reduced) draw();
}

function line(a, b, color) {
  cx.strokeStyle = color; cx.lineWidth = 1;
  cx.beginPath(); cx.moveTo(a.x, a.y); cx.lineTo(b.x, b.y); cx.stroke();
}

function draw() {
  cx.clearRect(0, 0, W, H);
  for (const p of pts) {
    const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
    if (!reduced && d < 110 && d > 0) { p.x += dx / d * (110 - d) * .03; p.y += dy / d * (110 - d) * .03; }
    if (!reduced) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
    }
  }
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    for (let j = i + 1; j < pts.length; j++) {
      const b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < 130) line(a, b, `rgba(225,29,46,${(1 - d / 130) * .35})`);
    }
    const m = Math.hypot(a.x - mouse.x, a.y - mouse.y);
    if (m < 190) line(a, mouse, `rgba(255,90,31,${(1 - m / 190) * .55})`);
    cx.fillStyle = "rgba(255,59,71,.85)";
    cx.beginPath(); cx.arc(a.x, a.y, a.r, 0, 7); cx.fill();
  }
}

function loop() {
  if (document.hidden) { running = false; return; }
  draw(); requestAnimationFrame(loop);
}
function start() { if (!running && !reduced) { running = true; loop(); } }

size(); start();
addEventListener("resize", size);
document.addEventListener("visibilitychange", start);

/* Cursor, spotlight e magnetismo */
const cur = document.getElementById("cur");
const mag = [...document.querySelectorAll(".btn,.links a")];
let cxp = 0, cyp = 0;

addEventListener("pointermove", e => {
  mouse.x = e.clientX; mouse.y = e.clientY;
  if (reduced) return;
  document.body.style.setProperty("--mx", e.clientX + "px");
  document.body.style.setProperty("--my", e.clientY + "px");
  if (!fine) return;
  cur.style.opacity = 1;
  cur.classList.toggle("big", !!e.target.closest("a,.proj,.card,.step,.stat"));
  mag.forEach(el => {
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const near = Math.hypot(dx, dy) < Math.max(r.width, 90) * .8;
    el.style.transform = near ? `translate(${dx * .25}px,${dy * .25}px)` : "";
  });
}, { passive: true });
document.addEventListener("pointerleave", () => { mouse.x = mouse.y = -999; cur.style.opacity = 0; });

if (fine && !reduced) {
  (function follow() {
    cxp += (mouse.x - cxp) * .18; cyp += (mouse.y - cyp) * .18;
    cur.style.transform = `translate(${cxp}px,${cyp}px)`;
    requestAnimationFrame(follow);
  })();
}

/* Linha de kill chain + atmosfera no scroll */
const rail = document.getElementById("rail"), fill = rail.firstElementChild;
const dots = secs.map(() => rail.appendChild(document.createElement("b")));
let marks = [];
function place() {
  const max = Math.max(1, root.scrollHeight - innerHeight);
  marks = secs.map(s => Math.min(1, s.offsetTop / max));
  dots.forEach((d, i) => d.style.top = marks[i] * 100 + "%");
}
const lerp = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const h1 = document.querySelector("h1");
let ticking = false;

function onScroll() {
  ticking = false;
  const max = Math.max(1, root.scrollHeight - innerHeight);
  const p = Math.min(1, scrollY / max);
  fill.style.height = p * 100 + "%";
  dots.forEach((d, i) => d.classList.toggle("on", p >= marks[i] - .001));
  const c = p < .5 ? lerp([8, 8, 10], [22, 9, 12], p * 2) : lerp([22, 9, 12], [9, 11, 14], (p - .5) * 2);
  document.body.style.backgroundColor = `rgb(${c})`;
  cv.style.opacity = .25 + .75 * Math.max(0, 1 - scrollY / innerHeight);
  if (!reduced) h1.style.transform = `translateY(${Math.min(scrollY, innerHeight) * .18}px)`;
}
addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
addEventListener("resize", () => { place(); onScroll(); });
addEventListener("load", () => { place(); onScroll(); });
place(); onScroll();

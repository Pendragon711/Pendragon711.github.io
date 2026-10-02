/* Rede viva: nós vermelhos flutuam, se ligam por linhas finas quando ficam perto,
   o mouse afasta os nós próximos e puxa linhas cor de brasa até eles.
   A rede ocupa a tela toda e esmaece com o scroll, sem sumir. */
(function () {
  var cv = document.getElementById('net');
  if (!cv || !cv.getContext) return;
  var cx = cv.getContext('2d');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var LINK = 140;   // distância para dois nós se ligarem
  var PUSH = 150;   // raio em que o mouse afasta os nós
  var PULL = 210;   // raio em que o mouse puxa linhas de brasa
  var MIN_FADE = 0.22;

  var W = 0, H = 0, nodes = [];
  var mouse = { x: -9999, y: -9999, on: false };

  function make() {
    var a = Math.random() * Math.PI * 2;
    var s = 0.15 + Math.random() * 0.25;
    return { x: Math.random() * W, y: Math.random() * H, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: 1.1 + Math.random() * 1.2 };
  }

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    cv.width = W * dpr;
    cv.height = H * dpr;
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.max(36, Math.min(110, Math.round((W * H) / 16000)));
    if (W < 700) n = Math.round(n * 0.6);
    while (nodes.length < n) nodes.push(make());
    nodes.length = Math.min(nodes.length, n);
    fade();
    if (reduce) draw();
  }

  function fade() {
    var o = Math.max(MIN_FADE, 1 - window.scrollY / (H * 0.9));
    cv.style.opacity = o;
  }

  function step() {
    for (var i = 0; i < nodes.length; i++) {
      var p = nodes[i];
      p.x += p.vx;
      p.y += p.vy;
      if (mouse.on) {
        var dx = p.x - mouse.x, dy = p.y - mouse.y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < PUSH && d > 0.01) {
          var f = (1 - d / PUSH) * 3;
          p.x += (dx / d) * f;
          p.y += (dy / d) * f;
        }
      }
      if (p.x < -20) p.x = W + 20; else if (p.x > W + 20) p.x = -20;
      if (p.y < -20) p.y = H + 20; else if (p.y > H + 20) p.y = -20;
    }
  }

  function draw() {
    cx.clearRect(0, 0, W, H);
    var i, j, a, b, dx, dy, d;

    cx.lineWidth = 1;
    for (i = 0; i < nodes.length; i++) {
      a = nodes[i];
      for (j = i + 1; j < nodes.length; j++) {
        b = nodes[j];
        dx = a.x - b.x; dy = a.y - b.y;
        if (dx > LINK || dx < -LINK || dy > LINK || dy < -LINK) continue;
        d = Math.sqrt(dx * dx + dy * dy);
        if (d < LINK) {
          cx.strokeStyle = 'rgba(225,29,46,' + ((1 - d / LINK) * 0.35).toFixed(3) + ')';
          cx.beginPath();
          cx.moveTo(a.x, a.y);
          cx.lineTo(b.x, b.y);
          cx.stroke();
        }
      }
    }

    if (mouse.on) {
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        dx = a.x - mouse.x; dy = a.y - mouse.y;
        d = Math.sqrt(dx * dx + dy * dy);
        if (d < PULL) {
          cx.strokeStyle = 'rgba(255,90,31,' + ((1 - d / PULL) * 0.65).toFixed(3) + ')';
          cx.beginPath();
          cx.moveTo(mouse.x, mouse.y);
          cx.lineTo(a.x, a.y);
          cx.stroke();
        }
      }
    }

    for (i = 0; i < nodes.length; i++) {
      a = nodes[i];
      dx = a.x - mouse.x; dy = a.y - mouse.y;
      var near = mouse.on && dx * dx + dy * dy < PULL * PULL;
      cx.fillStyle = near ? 'rgba(255,90,31,.95)' : 'rgba(225,29,46,.8)';
      cx.beginPath();
      cx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      cx.fill();
    }
  }

  function loop() {
    step();
    draw();
    requestAnimationFrame(loop);
  }

  window.addEventListener('pointermove', function (e) {
    mouse.x = e.clientX; mouse.y = e.clientY; mouse.on = true;
  }, { passive: true });
  window.addEventListener('pointerup', function (e) {
    if (e.pointerType === 'touch') mouse.on = false;
  }, { passive: true });
  document.documentElement.addEventListener('mouseleave', function () { mouse.on = false; });
  window.addEventListener('scroll', fade, { passive: true });
  window.addEventListener('resize', resize);

  resize();
  if (!reduce) requestAnimationFrame(loop);
})();

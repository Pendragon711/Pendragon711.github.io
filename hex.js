/* Visor forense: o fundo é um dump hexadecimal bem discreto.
   O cursor funciona como uma lente que realça os bytes por perto,
   e de tempos em tempos um trecho pisca em âmbar, como um indicador de comprometimento (IOC) encontrado.
   A camada de bytes é desenhada uma vez e só a lente e os IOCs são redesenhados a cada quadro. */
(function () {
  var cv = document.getElementById('hex');
  if (!cv || !cv.getContext) return;
  var cx = cv.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var CW = 30, CH = 22;        // tamanho da célula de cada byte
  var LENS = 130;              // raio da lente do cursor
  var FONT = '12px "IBM Plex Mono", monospace';
  var MIN_FADE = 0.5;

  var layer = document.createElement('canvas');
  var lx = layer.getContext('2d');
  var W = 0, H = 0, dpr = 1, cols = 0, rows = 0, bytes = [];
  var mouse = { x: -9999, y: -9999, on: false };
  var iocs = [], lastIoc = 0, running = false;

  function hex() {
    var n = (Math.random() * 256) | 0;
    return (n < 16 ? '0' : '') + n.toString(16);
  }

  function build() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    cv.width = layer.width = Math.round(W * dpr);
    cv.height = layer.height = Math.round(H * dpr);
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    lx.setTransform(dpr, 0, 0, dpr, 0, 0);

    cols = Math.ceil(W / CW) + 1;
    rows = Math.ceil(H / CH) + 1;
    bytes = new Array(cols * rows);
    lx.clearRect(0, 0, W, H);
    lx.font = FONT;
    lx.textBaseline = 'top';
    lx.fillStyle = 'rgba(108,199,255,.075)';
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var b = hex();
        bytes[r * cols + c] = b;
        lx.fillText(b, c * CW, r * CH);
      }
    }
    fade();
    draw(performance.now());
  }

  function fade() {
    cv.style.opacity = Math.max(MIN_FADE, 1 - window.scrollY / (H * 1.1));
  }

  function spawnIoc(now) {
    iocs.push({
      r: (Math.random() * rows) | 0,
      c: (Math.random() * Math.max(1, cols - 8)) | 0,
      len: 4 + ((Math.random() * 4) | 0),
      t0: now,
      life: 5200
    });
    lastIoc = now;
  }

  function draw(now) {
    cx.clearRect(0, 0, W, H);
    cx.drawImage(layer, 0, 0, W, H);
    cx.font = FONT;
    cx.textBaseline = 'top';

    // trechos que piscam em âmbar (IOC)
    if (!reduce) {
      if (iocs.length < 3 && now - lastIoc > 3500) spawnIoc(now);
      for (var k = iocs.length - 1; k >= 0; k--) {
        var o = iocs[k], p = (now - o.t0) / o.life;
        if (p >= 1) { iocs.splice(k, 1); continue; }
        var a = Math.sin(p * Math.PI) * 0.6;
        cx.fillStyle = 'rgba(255,159,67,' + (a * 0.14).toFixed(3) + ')';
        cx.fillRect(o.c * CW - 4, o.r * CH - 2, o.len * CW, CH);
        cx.fillStyle = 'rgba(255,159,67,' + a.toFixed(3) + ')';
        for (var j = 0; j < o.len; j++) {
          var idx = o.r * cols + o.c + j;
          if (bytes[idx]) cx.fillText(bytes[idx], (o.c + j) * CW, o.r * CH);
        }
      }
    }

    // lente do cursor
    if (mouse.on && !reduce) {
      var c0 = Math.max(0, Math.floor((mouse.x - LENS) / CW));
      var c1 = Math.min(cols - 1, Math.ceil((mouse.x + LENS) / CW));
      var r0 = Math.max(0, Math.floor((mouse.y - LENS) / CH));
      var r1 = Math.min(rows - 1, Math.ceil((mouse.y + LENS) / CH));
      for (var r = r0; r <= r1; r++) {
        for (var c = c0; c <= c1; c++) {
          var dx = c * CW + 9 - mouse.x, dy = r * CH + 7 - mouse.y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < LENS) {
            var t = 1 - d / LENS;
            cx.fillStyle = 'rgba(140,215,255,' + (0.08 + t * 0.7).toFixed(3) + ')';
            cx.fillText(bytes[r * cols + c], c * CW, r * CH);
          }
        }
      }
    }
  }

  function loop(now) {
    if (document.hidden) { running = false; return; }
    draw(now);
    requestAnimationFrame(loop);
  }
  function start() {
    if (reduce || running) return;
    running = true;
    requestAnimationFrame(loop);
  }

  window.addEventListener('pointermove', function (e) {
    mouse.x = e.clientX; mouse.y = e.clientY;
    mouse.on = e.pointerType !== 'touch';
  }, { passive: true });
  document.documentElement.addEventListener('mouseleave', function () { mouse.on = false; });
  window.addEventListener('scroll', fade, { passive: true });
  window.addEventListener('resize', build);
  document.addEventListener('visibilitychange', start);

  build();
  start();
})();

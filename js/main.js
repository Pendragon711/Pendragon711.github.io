// SEVASTOLINK // Personal Terminal
// Audio original sintetizado via Web Audio API.

const $ = s => document.querySelector(s);
const crt = $('#crt');
const view = $('#view');
const menu = $('#menu');
const power = $('#power');

const ITEMS = [
  ['perfil', 'PERFIL'],
  ['dfir', 'DFIR'],
  ['casos', 'CASOS'],
  ['exp', 'HISTÓRICO'],
  ['contato', 'CONTATO'],
  ['sys', 'UTILITY']
];

let ac, out;
let muted = false;
let sel = 0;
let booted = false;
let starting = false;
let skip = false;
let humNodes = [];
let glitchTimer = null;

const reducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
);

const wait = ms => new Promise(resolve =>
  setTimeout(resolve, skip ? 0 : ms)
);

// ---- AUDIO CORE ----
function audioInit() {
  if (ac) return true;

  try {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return false;

    ac = new AudioContextClass();
    out = ac.createGain();
    out.gain.value = 0.36;
    out.connect(ac.destination);
    return true;
  } catch {
    return false;
  }
}

function tone(f, d, type = 'square', v = 0.025, delay = 0, f2) {
  if (!ac || muted) return;

  const start = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const gain = ac.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(f, start);

  if (f2 && f2 > 0) {
    osc.frequency.exponentialRampToValueAtTime(
      f2, start + d
    );
  }

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(v, start + 0.006);
  gain.gain.exponentialRampToValueAtTime(
    0.0001, start + d
  );

  osc.connect(gain);
  gain.connect(out);
  osc.start(start);
  osc.stop(start + d + 0.02);
}

function noise(d, v = 0.04, hp = 500, lp = 7000) {
  if (!ac || muted) return;

  const length = Math.max(1, Math.floor(ac.sampleRate * d));
  const buffer = ac.createBuffer(1, length, ac.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    const fade = Math.pow(1 - i / length, 2);
    data[i] = (Math.random() * 2 - 1) * fade;
  }

  const source = ac.createBufferSource();
  const high = ac.createBiquadFilter();
  const low = ac.createBiquadFilter();
  const gain = ac.createGain();

  high.type = 'highpass';
  high.frequency.value = hp;

  low.type = 'lowpass';
  low.frequency.value = lp;

  gain.gain.value = v;

  source.buffer = buffer;
  source.connect(high);
  high.connect(low);
  low.connect(gain);
  gain.connect(out);
  source.start();
}

// ---- ORIGINAL TERMINAL SOUNDS ----

// Energização: relé, pulso grave e ruído de circuito.
function sPower() {
  noise(0.32, 0.10, 180, 2400);
  tone(48, 0.65, 'sine', 0.10);
  tone(92, 0.42, 'triangle', 0.025, 0.08, 58);
  tone(1250, 0.07, 'square', 0.012, 0.18, 760);
  noise(0.12, 0.035, 2400, 6500);
}

// Tecla: clique seco e curto.
function sKey() {
  noise(0.025, 0.018, 1000, 5200);
  tone(1380 + Math.random() * 180, 0.022, 'square', 0.009);
}

// Movimento de seleção.
function sMove() {
  tone(860, 0.035, 'triangle', 0.018, 0, 640);
  noise(0.018, 0.009, 1800, 6000);
}

// Acesso a uma pasta.
function sOpen() {
  noise(0.055, 0.035, 500, 4000);
  tone(420, 0.10, 'triangle', 0.028, 0, 285);
  tone(690, 0.045, 'square', 0.012, 0.035);
}

// Arquivo sendo recuperado.
function sRead() {
  tone(245, 0.13, 'sawtooth', 0.012, 0, 175);
  noise(0.12, 0.018, 700, 3000);
}

// Confirmação eletrônica.
function sOk() {
  tone(620, 0.055, 'square', 0.018);
  tone(930, 0.075, 'triangle', 0.022, 0.065);
}

// Retorno ao menu.
function sBack() {
  tone(380, 0.075, 'triangle', 0.022, 0, 245);
  noise(0.035, 0.012, 700, 3200);
}

// Comando inválido.
function sErr() {
  tone(210, 0.16, 'sawtooth', 0.025, 0, 135);
  noise(0.055, 0.018, 250, 1800);
}

// ---- ELECTRICAL ROOM TONE ----
function humStart() {
  if (!ac || muted || humNodes.length) return;

  // Harmônicos discretos: evitar um zumbido intrusivo.
  const low = ac.createOscillator();
  const harmonic = ac.createOscillator();
  const lowGain = ac.createGain();
  const harmonicGain = ac.createGain();

  low.type = 'sine';
  low.frequency.value = 50;
  lowGain.gain.value = 0.010;

  harmonic.type = 'triangle';
  harmonic.frequency.value = 100;
  harmonicGain.gain.value = 0.0025;

  low.connect(lowGain);
  lowGain.connect(out);
  harmonic.connect(harmonicGain);
  harmonicGain.connect(out);

  low.start();
  harmonic.start();

  // Ruído filtrado de baixa intensidade.
  const buffer = ac.createBuffer(
    1, ac.sampleRate * 2, ac.sampleRate
  );
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.25;
  }

  const source = ac.createBufferSource();
  const filter = ac.createBiquadFilter();
  const noiseGain = ac.createGain();

  source.buffer = buffer;
  source.loop = true;

  filter.type = 'lowpass';
  filter.frequency.value = 500;
  noiseGain.gain.value = 0.003;

  source.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(out);
  source.start();

  humNodes = [
    low, harmonic, source,
    lowGain, harmonicGain, noiseGain, filter
  ];
}

function humStop() {
  humNodes.forEach(node => {
    try {
      if (typeof node.stop === 'function') node.stop();
      node.disconnect();
    } catch {}
  });

  humNodes = [];
}

// ---- STATUS DISPLAY ----
function setStatus(message) {
  const sub = $('#sub');
  if (sub) sub.textContent = message;
}

function scheduleGlitch() {
  clearTimeout(glitchTimer);

  if (!booted) return;

  glitchTimer = setTimeout(() => {
    if (
      !crt.classList.contains('calm') &&
      !reducedMotion.matches
    ) {
      const bar = $('#bar');

      bar.classList.remove('go');
      void bar.offsetWidth;
      bar.classList.add('go');

      // Interferência sonora rara e muito baixa.
      if (Math.random() < 0.35) {
        noise(0.07, 0.012, 1800, 6000);
      }
    }

    scheduleGlitch();
  }, 14000 + Math.random() * 18000);
}

// ---- BOOT SEQUENCE ----
async function boot() {
  if (starting || booted) return;
  starting = true;
  skip = false;

  audioInit();

  if (ac && ac.state === 'suspended') {
    try {
      await ac.resume();
    } catch {}
  }

  power.classList.add('gone');
  crt.className = 'on';
  $('#flash').classList.remove('go');
  void $('#flash').offsetWidth;
  $('#flash').classList.add('go');

  sPower();
  setStatus('POWER BUS ONLINE // INITIALIZING');

  await wait(650);

  const bootScreen = $('#boot');
  bootScreen.classList.remove('hide');
  await wait(180);
  bootScreen.classList.add('go');

  noise(0.8, 0.025, 1800, 5200);
  await wait(900);

  const progress = $('#pf');

  for (let i = 1; i <= 24; i++) {
    progress.style.width = (i / 24 * 100) + '%';

    if (i % 4 === 0) {
      tone(580 + i * 12, 0.025, 'square', 0.009);
    }

    if (i === 9 || i === 18) {
      noise(0.06, 0.025, 1000, 3800);
    }

    await wait(45 + Math.random() * 45);
  }

  await wait(250);
  bootScreen.classList.add('hide');

  crt.classList.add('sync');
  noise(0.22, 0.055, 280, 2400);
  tone(125, 0.28, 'sawtooth', 0.025, 0, 55);

  await wait(350);
  crt.classList.remove('sync');

  $('#ui').classList.remove('hide');
  build();
  open(0, true);

  booted = true;
  starting = false;

  humStart();
  setStatus('SYSTEM READY // LOCAL ARCHIVE AVAILABLE');
  scheduleGlitch();
}

// ---- MENU ----
function build() {
  menu.querySelectorAll('button').forEach(b => b.remove());

  ITEMS.forEach(([key, label], index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.setAttribute('aria-label', label);

    button.onclick = () => {
      open(index);
      view.focus();
    };

    button.onmouseenter = () => {
      if (sel !== index) {
        mark(index);
        sMove();
      }
    };

    menu.append(button);
  });

  mark(sel);
}

function mark(index) {
  if (index < 0 || index >= ITEMS.length) return;

  sel = index;

  const buttons = menu.querySelectorAll('button');
  buttons.forEach((button, i) => {
    button.classList.toggle('sel', i === index);
    button.setAttribute('aria-current', i === index ? 'true' : 'false');
  });

  const connector = $('#conn');
  const button = buttons[index];

  if (!button || innerWidth <= 820) {
    connector.style.display = 'none';
    return;
  }

  connector.style.display = 'block';

  const cy = button.offsetTop + button.offsetHeight / 2 - menu.scrollTop;
  const title = $('#title');
  const ty = title.offsetTop + title.offsetHeight / 2;

  connector.style.top = Math.min(cy, ty) + 'px';
  connector.style.height = Math.abs(cy - ty) + 'px';
  connector.style.borderBottom = cy > ty
    ? '2px solid #e8efe9' : '0';
  connector.style.borderTop = cy > ty
    ? '0' : '2px solid #e8efe9';
}

function open(index, quiet = false) {
  if (index < 0 || index >= ITEMS.length) return;

  mark(index);

  const key = ITEMS[index][0];
  const template = $('#t-' + key);

  if (!template) {
    sErr();
    setStatus('ERROR // ARCHIVE NOT FOUND');
    return;
  }

  view.innerHTML = '';

  const fragment = template.content.cloneNode(true);
  const heading = fragment.querySelector('h2');

  $('#title').textContent = heading
    ? heading.textContent
    : ITEMS[index][1];

  view.append(fragment);
  view.classList.remove('ghost');
  void view.offsetWidth;
  view.classList.add('ghost');
  view.scrollTop = 0;

  const statuses = {
    perfil: 'PERSONNEL FILE // READ ONLY',
    dfir: 'SYSTEM DIAGNOSTICS // FORENSIC PROCEDURES',
    casos: 'ARCHIVE // CASE FILE RETRIEVAL',
    exp: 'PERSONNEL RECORD // EMPLOYMENT HISTORY',
    contato: 'COMMUNICATIONS // CONTACT DIRECTORY',
    sys: 'SYSTEM UTILITIES // DISPLAY CONFIGURATION'
  };

  setStatus(statuses[key] || 'SYSTEM READY');

  if (!quiet) {
    sOpen();
    setTimeout(() => {
      if (!muted && booted) sRead();
    }, 110);
  }

  if (key === 'sys') sysUI();
}

// ---- DISPLAY UTILITIES ----
function sysUI() {
  view.querySelectorAll('[data-fx]').forEach(button => {
    button.onclick = () => {
      const effect = button.dataset.fx;

      if (effect === 'curve') crt.classList.toggle('flat');
      if (effect === 'scan') crt.classList.toggle('noscan');
      if (effect === 'calm') {
        crt.classList.toggle('calm');

        if (crt.classList.contains('calm')) {
          $('#bar').classList.remove('go');
        }
      }

      sOk();
    };
  });
}

// ---- KEYBOARD ----
document.addEventListener('keydown', event => {
  if (starting && event.key === 'Escape') {
    skip = true;
    return;
  }

  if (!booted) {
    if (
      !starting &&
      !power.classList.contains('gone') &&
      event.key !== 'Tab'
    ) {
      boot();
    }
    return;
  }

  const key = event.key.toLowerCase();
  const tag = document.activeElement?.tagName;
  const inContent = document.activeElement === view;

  if (['arrowup', 'arrowdown', 'pageup', 'pagedown'].includes(key)) {
    if (tag === 'A' || tag === 'BUTTON') return;
  }

  if (key === 'arrowdown' && !inContent) {
    event.preventDefault();
    mark((sel + 1) % ITEMS.length);
    open(sel, true);
    sMove();
  } else if (key === 'arrowup' && !inContent) {
    event.preventDefault();
    mark((sel + ITEMS.length - 1) % ITEMS.length);
    open(sel, true);
    sMove();
  } else if (
    key === 'e' ||
    (key === 'enter' && !['BUTTON', 'A'].includes(tag))
  ) {
    if (tag === 'A') return;
    event.preventDefault();
    sKey();
    open(sel);
    view.focus();
  } else if (key === 'pagedown') {
    event.preventDefault();
    view.scrollBy(0, view.clientHeight * 0.8);
    sKey();
  } else if (key === 'pageup') {
    event.preventDefault();
    view.scrollBy(0, -view.clientHeight * 0.8);
    sKey();
  } else if (/^[1-6]$/.test(key)) {
    open(Number(key) - 1);
    view.focus();
  } else if (key === 'q' || key === 'escape') {
    event.preventDefault();
    view.blur();
    menu.querySelectorAll('button')[sel]?.focus();
    sBack();
  }
});

// ---- MUTE ----
$('#mute').onclick = event => {
  muted = !muted;

  event.currentTarget.textContent =
    `[SOM: ${muted ? 'DESLIGADO' : 'LIGADO'}]`;

  if (muted) {
    humStop();
  } else {
    audioInit();

    if (ac && ac.state === 'suspended') {
      ac.resume().catch(() => {});
    }

    humStart();
    sOk();
  }
};

// ---- POWER CONTROL ----
power.onclick = boot;

power.onkeydown = event => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    event.stopPropagation();
    boot();
  }
};

window.addEventListener('resize', () => {
  if (booted) mark(sel);
});

window.addEventListener('pagehide', () => {
  clearTimeout(glitchTimer);
  humStop();
});

power.focus();

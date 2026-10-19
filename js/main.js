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

// ---- ORIGINAL WAV AUDIO SYSTEM ----
const AUDIO_BASE = 'assets/audio/';

const audioFiles = {
  startup: 'Interactive_Terminal_Startup.wav',
  ambient: 'Interactive_Terminal_BG_Loop.wav',
  accept: 'UI_Accept_V2.wav',
  move: 'Move_cursor_1.wav',
  click: 'CLICK_01.wav',
  telem: 'Interactive_Terminal_Telem_01.wav',
  error: 'Interactive_Terminal_Telem_07.wav'
};

const audioPlayers = {};
let muted = false;
let sel = 0;
let booted = false;
let starting = false;
let skip = false;
let glitchTimer = null;

const reducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
);

const wait = ms => new Promise(resolve =>
  setTimeout(resolve, skip ? 0 : ms)
);

// Os arquivos sao carregados uma unica vez e reutilizados.
function audioInit() {
  if (Object.keys(audioPlayers).length) return true;

  try {
    for (const [key, filename] of Object.entries(audioFiles)) {
      const audio = new Audio(AUDIO_BASE + filename);
      audio.preload = 'auto';
      audio.volume = key === 'ambient' ? 0.12 : 0.48;
      audio.loop = key === 'ambient';
      audioPlayers[key] = audio;
    }

    return true;
  } catch (error) {
    console.error('Falha ao preparar o audio:', error);
    return false;
  }
}

function playAudio(key) {
  if (muted || !audioInit()) return Promise.resolve();

  const audio = audioPlayers[key];
  if (!audio) return Promise.resolve();

  try {
    audio.currentTime = 0;

    const result = audio.play();
    if (result && typeof result.catch === 'function') {
      return result.catch(error => {
        console.warn('Audio indisponivel:', key, error);
      });
    }

    return Promise.resolve();
  } catch (error) {
    console.warn('Falha ao reproduzir audio:', key, error);
    return Promise.resolve();
  }
}

function stopAudio(key, reset = false) {
  const audio = audioPlayers[key];
  if (!audio) return;

  audio.pause();
  if (reset) {
    try { audio.currentTime = 0; } catch {}
  }
}

function humStart() {
  if (!booted || muted) return;
  playAudio('ambient');
}

function humStop() {
  stopAudio('ambient');
}

// Compatibilidade com as chamadas existentes.
// Os efeitos sintetizados antigos ficam desativados.
function tone() {}
function noise() {}

function sPower() { playAudio('startup'); }
function sKey()   { playAudio('click'); }
function sMove()  { playAudio('move'); }
function sOpen()  { playAudio('telem'); }
function sRead()  {}
function sOk()    { playAudio('accept'); }
function sBack()  { playAudio('click'); }
function sErr()   { playAudio('error'); }

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
        // Sem efeito sintetizado: usar somente os WAVs originais.
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
  const bootStartedAt = performance.now();

  audioInit();

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

  await wait(Math.max(0, 7000 - (performance.now() - bootStartedAt)));
  if (skip) stopAudio('startup', true);
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
    Object.keys(audioPlayers).forEach(key => stopAudio(key));
    humStop();
  } else {
    audioInit();
    if (booted) humStart();
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


// === CONFIGURAÇÃO DO BOOT ===
const bootLines = [
  "INICIALIZANDO MU-TH-UR 6000...",
  "VERIFICANDO SISTEMAS DE CRIOGÊNESE... [OK]",
  "CARREGANDO MÓDULOS DE REDE... [OK]",
  "ESTABELECENDO UPLINK SEGURO... [OK]",
  "AUTENTICAÇÃO DE OFICIAL DE CIÊNCIAS: DANIEL WIDAL",
  "ACESSO CONCEDIDO.",
  "CARREGANDO INTERFACE PRINCIPAL..."
];

const bootScreen = document.getElementById('boot-screen');
const bootLog = document.getElementById('boot-log');
const terminal = document.getElementById('terminal');
const cmdInput = document.getElementById('cmd-input');
const outputArea = document.getElementById('output-area');

let lineIndex = 0;

function runBoot() {
  if (lineIndex < bootLines.length) {
    const div = document.createElement('div');
    div.className = 'boot-line';
    div.textContent = `> ${bootLines[lineIndex]}`;
    div.style.animationDelay = '0s';
    bootLog.appendChild(div);
    lineIndex++;

    // Velocidade variável para parecer real
    const delay = lineIndex === bootLines.length ? 800 : Math.random() * 300 + 100;
    setTimeout(runBoot, delay);
  } else {
    setTimeout(() => {
      bootScreen.style.opacity = '0';
      bootScreen.style.transition = 'opacity 1s ease';
      setTimeout(() => {
        bootScreen.style.display = 'none';
        terminal.classList.remove('hidden');
        cmdInput.focus();
        startMissionClock();
      }, 1000);
    }, 500);
  }
}

// Iniciar boot ao carregar
window.addEventListener('DOMContentLoaded', runBoot);

// === RELÓGIO DE MISSÃO ===
function startMissionClock() {
  const clockEl = document.getElementById('mission-time');
  // Data base fictícia da Nostromo (ano 2122)
  let baseTime = new Date('2122-06-15T08:00:00').getTime();

  setInterval(() => {
    baseTime += 1000; // Avança 1 segundo real = 1 segundo no jogo
    const d = new Date(baseTime);
    const year = d.getFullYear();
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    const secs = String(d.getSeconds()).padStart(2, '0');
    clockEl.textContent = `MISSION TIME: ${year}.${day}:${hours}:${mins}:${secs}`;
  }, 1000);
}

// === LÓGICA DO TERMINAL ===
const commands = {
  'help': 'COMANDOS DISPONÍVEIS: about, soc, dfir, projetos, experiencia, contato, clear',
  'about': 'sec-about',
  'soc': 'sec-soc',
  'dfir': 'sec-dfir',
  'projetos': 'sec-projetos',
  'experiencia': 'sec-experiencia',
  'contato': 'sec-contato',
  'clear': 'clear'
};

function processCommand(cmd) {
  const cleanCmd = cmd.trim().toLowerCase();

  // Adiciona o comando digitado ao histórico visual
  const historyLine = document.createElement('div');
  historyLine.innerHTML = `<span class="prompt">root@nostromo:~#</span> ${cleanCmd}`;
  outputArea.insertBefore(historyLine, outputArea.firstChild);

  if (cleanCmd === '') return;

  if (cleanCmd === 'clear') {
    // Remove todas as seções ativas e o histórico recente, mantendo a mensagem de boas-vindas
    document.querySelectorAll('.term-section').forEach(sec => sec.classList.remove('active'));
    // Opcional: limpar todo o outputArea e readicionar a welcome-msg
    return;
  }

  if (commands[cleanCmd]) {
    const target = commands[cleanCmd];
    if (target.startsWith('sec-')) {
      // Esconde todas as seções primeiro
      document.querySelectorAll('.term-section').forEach(sec => sec.classList.remove('active'));
      // Mostra a seção alvo
      const section = document.getElementById(target);
      if (section) {
        section.classList.add('active');
        // Rola suavemente para a seção
        setTimeout(() => {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  } else if (cleanCmd.startsWith('soc ')) {
    // Subcomando simples para demonstrar profundidade
    const sub = cleanCmd.split(' ')[1];
    const historySub = document.createElement('div');
    historySub.innerHTML = `<span style="color:var(--phosphor-dim)">> CARREGANDO PROTOCOLO: ${sub.toUpperCase()}...</span>`;
    outputArea.insertBefore(historySub, outputArea.firstChild);
    document.getElementById('sec-soc').classList.add('active');
    document.getElementById('sec-soc').scrollIntoView({ behavior: 'smooth' });
  } else {
    const errorLine = document.createElement('div');
    errorLine.innerHTML = `<span style="color:var(--alert)">ERRO: COMANDO '${cleanCmd}' NÃO RECONHECIDO. DIGITE 'help'.</span>`;
    outputArea.insertBefore(errorLine, outputArea.firstChild);
  }
}

// Listener para o Input (Tecla Enter)
cmdInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    processCommand(cmdInput.value);
    cmdInput.value = ''; // Limpa o input
  }
});

// Função global para os botões de clique rápido
window.runCmd = function(cmd) {
  cmdInput.value = cmd;
  processCommand(cmd);
  cmdInput.value = '';
  cmdInput.focus();
};

// Manter o foco no input sempre que clicar no terminal
terminal.addEventListener('click', () => {
  cmdInput.focus();
});

// Easter Egg: Konami Code ou comando secreto
// Se o usuário digitar '937', muda a cor para vermelho temporariamente
cmdInput.addEventListener('input', (e) => {
  if (e.target.value.toLowerCase().includes('937')) {
    document.documentElement.style.setProperty('--phosphor', '#ff5a2c');
    document.documentElement.style.setProperty('--phosphor-bright', '#ff9980');
    setTimeout(() => {
      document.documentElement.style.setProperty('--phosphor', '#ffb000');
      document.documentElement.style.setProperty('--phosphor-bright', '#ffe2a8');
    }, 3000);
  }
});

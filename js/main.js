const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const pad = n => String(n).padStart(2, "0");
const utc = (d = new Date()) => `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;

/* Relógio em UTC, como no turno de um SOC */
const clock = $("#clock");
function tick() { clock.textContent = utc() + " UTC"; }
tick();
setInterval(tick, 1000);

/* ---------- Fila de alertas (simulação com dados fictícios) ---------- */
const ALERTS = [
  { sev: "med", title: "E-mail com anexo .html reportado pelo usuário", src: "Gateway de e-mail",
    steps: ["Cabeçalhos: SPF, DKIM e DMARC falharam", "Domínio do remetente registrado há poucos dias", "Anexo aberto em sandbox: formulário de login falso", "O mesmo e-mail chegou a outros destinatários"],
    v: "esc", why: "Phishing confirmado. Bloquear o remetente, remover o e-mail das caixas e escalar." },
  { sev: "high", title: "Muitas falhas de login SSH em poucos minutos", src: "Wazuh",
    steps: ["IP de origem externo, sem relação com a empresa", "Mesmo IP tentando vários usuários: padrão de força bruta", "Nenhum login bem-sucedido depois das tentativas", "IP já listado em base de reputação"],
    v: "tp", why: "Ataque real, sem acesso obtido. IP bloqueado no firewall e registrado." },
  { sev: "med", title: "Login fora do horário vindo de outro país", src: "SIEM",
    steps: ["Usuário em viagem de trabalho, confirmado com o gestor", "Autenticação com MFA concluída", "Dispositivo já conhecido"],
    v: "fp", why: "Atividade legítima. Alerta encerrado, com nota para ajustar a regra." },
  { sev: "crit", title: "PowerShell com comando codificado em estação", src: "EDR",
    steps: ["Processo pai: documento do Office abrindo o PowerShell", "Comando decodificado baixa um arquivo de domínio externo", "Conexão de saída para IP sem reputação", "Nenhuma outra estação com o mesmo comportamento"],
    v: "esc", why: "Comportamento malicioso. Estação isolada e caso passado ao N2 com as evidências." },
  { sev: "low", title: "Pico de conexões bloqueadas no firewall", src: "Firewall",
    steps: ["Origem é o IP interno do scanner de vulnerabilidades", "Horário bate com a janela de varredura agendada", "Portas alvo dentro do escopo do scan"],
    v: "fp", why: "Varredura autorizada. Encerrado." },
  { sev: "high", title: "Antivírus removeu arquivo malicioso em estação", src: "Antivírus",
    steps: ["Hash consultado: malware conhecido", "Origem: download de um site comprometido", "Hash não encontrado em outras estações", "Sem execução suspeita depois da remoção"],
    v: "tp", why: "Ameaça contida pelo antivírus. Usuário orientado e URL bloqueada." }
];
const LABEL = { new: "novo", triage: "em triagem", fp: "falso positivo", esc: "escalado ao N2", tp: "contido" };
const VERDICT = { fp: "Falso positivo", esc: "Escalado ao N2", tp: "Verdadeiro positivo, contido" };

const queue = $("#queue"), detail = $("#detail");
const out = { open: $("#cOpen"), esc: $("#cEsc"), tp: $("#cTp"), fp: $("#cFp") };
const total = { esc: 0, tp: 0, fp: 0 };
const rows = [];
let cursor = 0, picked = false, selected = null;

function mkRow(a, time, state) {
  const li = document.createElement("li");
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `row sev-${a.sev}`;
  btn.setAttribute("aria-pressed", "false");
  const t = document.createElement("span"); t.className = "t"; t.textContent = time;
  const sv = document.createElement("span"); sv.className = "sv"; sv.setAttribute("aria-hidden", "true");
  const ti = document.createElement("span"); ti.className = "ti";
  const b = document.createElement("b"); b.textContent = a.title;
  const sm = document.createElement("small"); sm.textContent = a.src;
  ti.append(b, sm);
  const st = document.createElement("span");
  btn.append(t, sv, ti, st);
  li.append(btn);
  const row = { a, li, btn, st, state: "new" };
  btn.addEventListener("click", () => { picked = true; show(row, true); });
  setState(row, state, true);
  return row;
}

function setState(row, state, silent) {
  row.state = state;
  row.st.className = `st st-${state}`;
  row.st.textContent = LABEL[state];
  if (!silent) counts();
}

function counts() {
  out.open.textContent = rows.filter(r => r.state === "new" || r.state === "triage").length;
  out.esc.textContent = total.esc;
  out.tp.textContent = total.tp;
  out.fp.textContent = total.fp;
}

function show(row, still) {
  selected = row;
  rows.forEach(r => r.btn.setAttribute("aria-pressed", String(r === row)));
  const a = row.a;
  const done = row.state === "fp" || row.state === "esc" || row.state === "tp";
  const steps = a.steps.map((s, i) => `<li style="--i:${i}">${s}</li>`).join("");
  const verdict = done ? `<div class="dv ${a.v}"><b>${VERDICT[a.v]}</b>${a.why}</div>` : "";
  detail.className = "detail" + (still || reduced ? " static" : "");
  detail.innerHTML = `<p class="dh">${a.title}</p><ul class="dl">${steps}</ul>${verdict}`;
}

function resolve(row) {
  const v = row.a.v;
  total[v]++;
  setState(row, v);
  if (selected === row) {
    const html = detail.querySelector(".dl");
    const keep = html ? html.outerHTML : "";
    if (keep) {
      detail.classList.add("static");
      detail.insertAdjacentHTML("beforeend", `<div class="dv ${v}"><b>${VERDICT[v]}</b>${row.a.why}</div>`);
    } else show(row, true);
  }
  counts();
}

function add(a, time, state) {
  const row = mkRow(a, time, state);
  rows.unshift(row);
  queue.prepend(row.li);
  while (queue.children.length > 6) { queue.lastElementChild.remove(); rows.pop(); }
  return row;
}

/* Alertas já resolvidos para o painel não começar vazio */
[4, 2, 5].forEach((idx, k) => {
  const a = ALERTS[idx];
  const t = utc(new Date(Date.now() - (11 - k * 4) * 60000));
  total[a.v]++;
  add(a, t, a.v);
});
show(rows[0], true);
counts();

/* Novos alertas chegando, sendo triados e decididos */
function arrive() {
  if (document.hidden) return;
  const a = ALERTS[cursor++ % ALERTS.length];
  const row = add(a, utc(), "new");
  row.btn.classList.add("enter");
  counts();
  setTimeout(() => {
    setState(row, "triage");
    if (!picked) show(row);
    counts();
  }, 900);
  setTimeout(() => resolve(row), 900 + 4800);
}
if (!reduced) {
  setTimeout(arrive, 1800);
  setInterval(arrive, 7500);
}

/* ---------- Playbooks (abas) ---------- */
const tabs = $$('[role="tab"]'), panels = $$('[role="tabpanel"]');
function pick(i) {
  tabs.forEach((t, j) => {
    t.setAttribute("aria-selected", String(j === i));
    t.tabIndex = j === i ? 0 : -1;
    panels[j].hidden = j !== i;
  });
}
tabs.forEach((t, i) => {
  t.addEventListener("click", () => pick(i));
  t.addEventListener("keydown", e => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const k = (i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    pick(k);
    tabs[k].focus();
  });
});

/* ---------- Linha do tempo de exemplo e experiência ---------- */
const tlx = $("#tlx");
const seen = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add(e.target.id === "tlx" ? "in" : "on");
  seen.unobserve(e.target);
}), { threshold: 0.25 });
if (tlx) seen.observe(tlx);
$$(".tl .i").forEach(el => seen.observe(el));

/* ---------- Menu e linha de progresso ---------- */
const links = $$(".links a");
const secs = $$("main section[id]");
const spy = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) links.forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id));
}), { rootMargin: "-45% 0px -50% 0px" });
secs.forEach(s => spy.observe(s));

const root = document.documentElement;
const rail = $("#rail"), fill = rail.firstElementChild;
const dots = secs.map(() => rail.appendChild(document.createElement("b")));
let marks = [], ticking = false;
function place() {
  const max = Math.max(1, root.scrollHeight - innerHeight);
  marks = secs.map(s => Math.min(1, s.offsetTop / max));
  dots.forEach((d, i) => d.style.top = marks[i] * 100 + "%");
}
function onScroll() {
  ticking = false;
  const max = Math.max(1, root.scrollHeight - innerHeight);
  const p = Math.min(1, scrollY / max);
  fill.style.height = p * 100 + "%";
  dots.forEach((d, i) => d.classList.toggle("on", p >= marks[i] - .001));
}
addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
addEventListener("resize", () => { place(); onScroll(); });
addEventListener("load", () => { place(); onScroll(); });
place();
onScroll();

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Reveal ao rolar */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); }
}), { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach(el => io.observe(el));

/* Menu: destaca a seção atual */
const links = [...document.querySelectorAll(".links a")];
const spy = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) links.forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id));
}), { rootMargin: "-45% 0px -50% 0px" });
document.querySelectorAll("section[id]").forEach(s => spy.observe(s));

/* Luz vermelha que segue o mouse */
if (!reduced) {
  window.addEventListener("pointermove", e => {
    document.body.style.setProperty("--mx", e.clientX + "px");
    document.body.style.setProperty("--my", e.clientY + "px");
  }, { passive: true });
}

/* Terminal de recon (laboratório autorizado), digitado em loop */
const term = document.getElementById("term");
const script = [
  ["p",  "$ nmap -sV -sC -p- lab.local"],
  ["ok", "[+] 22/tcp ssh · 80/tcp http · 443/tcp https"],
  ["p",  "$ ffuf -u https://lab.local/FUZZ -w common.txt"],
  ["in", "[*] enumerando endpoints e parâmetros..."],
  ["wr", "[!] possível IDOR em /api/user/{id} — validar"],
  ["p",  "$ python ghost.py --scope authorized --report"],
  ["ok", "[+] achado documentado · CWE-639 · CVSS v3.1"],
  ["in", "[*] ambiente: laboratório autorizado"]
];

function line(cls, text) {
  const d = document.createElement("div");
  d.className = cls;
  d.textContent = text;
  return d;
}

async function run() {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const cur = document.createElement("span");
  cur.className = "cur";
  while (true) {
    term.textContent = "";
    for (const [cls, text] of script) {
      const d = line(cls, "");
      term.appendChild(d);
      d.appendChild(cur);
      if (cls === "p") {
        for (const ch of text) { d.insertBefore(document.createTextNode(ch), cur); await wait(28); }
        await wait(350);
      } else {
        d.insertBefore(document.createTextNode(text), cur);
        await wait(520);
      }
    }
    await wait(4200);
  }
}

if (term) {
  if (reduced) script.forEach(([c, t]) => term.appendChild(line(c, t)));
  else run();
}

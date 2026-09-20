/* =========================================================
   SCROLL REVEAL
========================================================= */

const observer = new IntersectionObserver(

  entries => {

    entries.forEach(entry => {

      if (entry.isIntersecting) {

        entry.target.classList.add("visible");

        observer.unobserve(entry.target);

      }

    });

  },

  { threshold: 0.12 }

);

document
  .querySelectorAll(".reveal")
  .forEach(el => observer.observe(el));


/* =========================================================
   RANDOM SECURITY EVENTS (terminal dinâmico)
========================================================= */

const terminal = document.querySelector(".terminal");

const prefersReduced = window
  .matchMedia("(prefers-reduced-motion: reduce)")
  .matches;


const events = [

  { type: "INFO",      text: "monitoring security events..." },
  { type: "INFO",      text: "correlating authentication logs..." },
  { type: "ALERT",     text: "suspicious SSH authentication pattern detected" },
  { type: "DETECTION", text: "event mapped to MITRE ATT&CK" },
  { type: "OK",        text: "security analysis completed" }

];


let eventIndex = 0;


function updateSecurityEvent() {

  if (!terminal) return;


  const event = events[eventIndex];


  const color =
    event.type === "ALERT"
      ? "yellow"
      : event.type === "DETECTION"
        ? "green"
        : "cyan";


  const line = document.createElement("div");

  line.innerHTML =
    `<span class="${color}">[${event.type}]</span> ${event.text}`;


  terminal.appendChild(line);


  if (terminal.children.length > 7) {

    terminal.removeChild(terminal.children[0]);

  }


  eventIndex = (eventIndex + 1) % events.length;

}


if (!prefersReduced && terminal) {

  setInterval(updateSecurityEvent, 4200);

}

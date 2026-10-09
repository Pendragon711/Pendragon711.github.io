// Scroll reveal
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// Nav background on scroll + active link
const nav = document.querySelector('.nav');
const links = document.querySelectorAll('.menu a');
const sections = document.querySelectorAll('section[id]');

function updateNav() {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}

function updateActiveLink() {
  const y = window.scrollY + 140;
  let current = '';
  sections.forEach(s => {
    if (s.offsetTop <= y) current = s.id;
  });
  links.forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === '#' + current);
  });
}

window.addEventListener('scroll', () => {
  updateNav();
  updateActiveLink();
}, { passive: true });

// Tabs de playbooks
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    tabs.forEach(t => t.classList.remove('active'));
    panels.forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.querySelector(`[data-panel="${target}"]`).classList.add('active');
  });
});

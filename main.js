'use strict';
const list = document.getElementById('project-list');
window.portfolioProjects.forEach((p, i) => {
  const article = document.createElement('article');
  article.className = 'project';
  const visual =
    p.kind === 'api'
      ? `<div class="code-block"><small>REQUEST / 001</small>${p.code}<span class="line"></span><span class="line"></span></div>`
      : p.kind === 'metrics'
        ? '<div class="bars">' +
          [32, 58, 43, 84, 66, 97]
            .map((h) => `<span style="--height:${h}%"></span>`)
            .join('') +
          '</div>'
        : '<div class="orbit"><span>run();</span></div>';
  article.innerHTML = `<div class="project-visual ${p.kind}" aria-hidden="true"><span class="visual-no">${p.number} / EXPERIMENT</span>${visual}<span class="visual-label">${p.label}</span></div><div class="project-info"><div class="project-category">${p.category}</div><h3>${p.title}</h3><p>${p.subtitle}</p><div class="tags">${p.tags.map((t) => `<span class="tag">${t}</span>`).join('')}</div><button type="button" aria-label="Explorar ${p.title}">Explorar la idea <span aria-hidden="true">＋</span></button></div>`;
  article
    .querySelector('button')
    .addEventListener('click', () => openProject(i));
  list.append(article);
});
const dialog = document.getElementById('project-dialog');
function openProject(i) {
  const p = window.portfolioProjects[i];
  document.getElementById('dialog-status').textContent = p.category;
  document.getElementById('dialog-title').textContent = p.title;
  document.getElementById('dialog-description').textContent = p.description;
  document.getElementById('dialog-next').textContent = p.next;
  document.getElementById('dialog-tags').replaceChildren(
    ...p.tags.map((t) => {
      const s = document.createElement('span');
      s.className = 'tag';
      s.textContent = t;
      return s;
    })
  );
  dialog.showModal();
}
dialog.querySelector('.close').onclick = () => dialog.close();
dialog.addEventListener('click', (e) => {
  if (e.target === dialog) {
    const r = dialog.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      dialog.close();
  }
});
function clock() {
  document.getElementById('clock').textContent = new Intl.DateTimeFormat(
    'es-ES',
    {
      timeZone: 'Europe/Madrid',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }
  ).format(new Date());
}
clock();
setInterval(clock, 60000);
document.getElementById('year').textContent = new Date().getFullYear();
const canvas = document.getElementById('objects'),
  ctx = canvas.getContext('2d'),
  reduce = matchMedia('(prefers-reduced-motion: reduce)');
let paused = reduce.matches,
  visible = true,
  frame = 0,
  lastTime = 0,
  w = 1,
  h = 1,
  phase = 0,
  scrollPhase = 0,
  scrollTarget = 0,
  pointer = { x: 0, y: 0 },
  target = { x: 0, y: 0 };
const motion = document.getElementById('motion');
function sync() {
  if (reduce.matches) paused = true;
  motion.textContent = reduce.matches
    ? 'Movimiento reducido'
    : paused
      ? 'Activar movimiento'
      : 'Pausar movimiento';
  motion.disabled = reduce.matches;
  document.body.classList.toggle('paused', paused);
  document.dispatchEvent(new Event('portfolio-motion-change'));
  updateSceneScroll();
  if (typeof schedule === 'function') schedule();
}
sync();
motion.onclick = () => {
  paused = !paused;
  sync();
};
reduce.addEventListener('change', () => {
  paused = reduce.matches;
  sync();
});
function resize() {
  const r = canvas.getBoundingClientRect();
  w = r.width;
  h = r.height;
  const d = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(w * d);
  canvas.height = Math.round(h * d);
  ctx.setTransform(d, 0, 0, d, 0, 0);
  updateSceneScroll();
  schedule();
}
function updateSceneScroll() {
  if (paused || reduce.matches) return;
  const rect = canvas.getBoundingClientRect();
  const distance = window.innerHeight / 2 - (rect.top + rect.height / 2);
  const strength = window.innerWidth <= 700 ? 0.45 : 0.9;
  scrollTarget =
    Math.max(-1, Math.min(1, distance / window.innerHeight)) * strength;
  if (visible && !document.hidden) schedule();
}
new ResizeObserver(resize).observe(canvas);
canvas.addEventListener('pointermove', (e) => {
  const r = canvas.getBoundingClientRect();
  target = {
    x: (e.clientX - r.left) / w - 0.5,
    y: (e.clientY - r.top) / h - 0.5
  };
});
canvas.addEventListener('pointerleave', () => (target = { x: 0, y: 0 }));
function point(x, y, z, a, cx, cy, s) {
  const ca = Math.cos(a),
    sa = Math.sin(a),
    cb = Math.cos(a * 0.53),
    sb = Math.sin(a * 0.53);
  let u = x * ca - z * sa,
    v = x * sa + z * ca;
  let yy = y * cb - v * sb,
    zz = y * sb + v * cb;
  let k = 3.8 / (3.8 + zz);
  return [cx + u * s * k, cy + yy * s * k];
}
function line(points, color, width = 1) {
  ctx.beginPath();
  points.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}
function draw(time) {
  frame = 0;
  const delta = lastTime ? Math.min((time - lastTime) / 16.667, 2) : 1;
  lastTime = time;
  if (!paused) {
    phase += 0.005 * delta;
    pointer.x += (target.x - pointer.x) * 0.04;
    pointer.y += (target.y - pointer.y) * 0.04;
    scrollPhase += (scrollTarget - scrollPhase) * 0.08 * delta;
  }
  ctx.clearRect(0, 0, w, h);
  const s = Math.min(w * 0.105, h * 0.3),
    a = phase + pointer.x * 0.9 + scrollPhase,
    b = pointer.y * 22;
  ctx.fillStyle = '#d1d3cb';
  for (let x = 22; x < w; x += 30)
    for (let y = 23; y < h; y += 30) {
      ctx.beginPath();
      ctx.arc(x, y, 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  // Three simple geometric studies: a wire sphere, a folded cube and concentric rings.
  const cx = w * 0.21,
    cy = h * 0.52 + b;
  for (let j = 0; j < 10; j++) {
    let pts = [];
    for (let k = 0; k <= 70; k++) {
      let t = (k / 70) * Math.PI * 2,
        l = (j / 10) * Math.PI;
      pts.push(
        point(
          Math.cos(t) * Math.cos(l),
          Math.sin(t),
          Math.cos(t) * Math.sin(l),
          a,
          cx,
          cy,
          s
        )
      );
    }
    line(pts, '#2c43ff', 0.9);
  }
  const verts = [];
  for (let x of [-1, 1])
    for (let y of [-1, 1]) for (let z of [-1, 1]) verts.push([x, y, z]);
  const pp = verts.map((v) =>
    point(...v, -a * 0.7, w * 0.53, h * 0.52 - b, s * 0.77)
  );
  for (let i = 0; i < 8; i++)
    for (let j = i + 1; j < 8; j++)
      if (verts[i].filter((v, k) => v !== verts[j][k]).length === 1)
        line([pp[i], pp[j]], '#222820', 1.4);
  for (let j = 0; j < 15; j++) {
    let pts = [];
    for (let k = 0; k <= 80; k++) {
      const t = (k / 80) * Math.PI * 2,
        r = 0.63 + j * 0.027;
      pts.push(
        point(
          Math.cos(t) * r,
          Math.sin(t) * r,
          (j - 7) * 0.032,
          a * 0.5 + 0.6,
          w * 0.82,
          h * 0.51 + b,
          s * 1.08
        )
      );
    }
    line(pts, j % 3 === 0 ? '#2c43ff' : '#737d62', 1);
  }
  if (!paused && visible && !document.hidden) schedule();
}
function schedule() {
  if (!frame) frame = requestAnimationFrame(draw);
}
new IntersectionObserver(
  (entries) => {
    visible = entries[0].isIntersecting;
    if (visible) {
      lastTime = 0;
      schedule();
    }
  },
  { threshold: 0 }
).observe(canvas);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    lastTime = 0;
    schedule();
  }
});
resize();
schedule();

// Keep the menu aligned with the section being read, without changing the URL on scroll.
const navLinks = [...document.querySelectorAll('nav a')];
const navSections = navLinks.map((a) =>
  document.querySelector(a.getAttribute('href'))
);
let scrollPending = false;
function updateNavigation() {
  scrollPending = false;
  updateSceneScroll();
  let current = null;
  for (const section of navSections) {
    if (section.getBoundingClientRect().top <= window.innerHeight * 0.38)
      current = section.id;
  }
  navLinks.forEach((a) => {
    if (a.hash === '#' + current) a.setAttribute('aria-current', 'location');
    else a.removeAttribute('aria-current');
  });
}
window.addEventListener(
  'scroll',
  () => {
    if (!scrollPending) {
      scrollPending = true;
      requestAnimationFrame(updateNavigation);
    }
  },
  { passive: true }
);
window.addEventListener('resize', updateNavigation);
updateNavigation();
dialog.addEventListener('close', () =>
  document.body.classList.remove('dialog-open')
);
new MutationObserver(() =>
  document.body.classList.toggle('dialog-open', dialog.open)
).observe(dialog, { attributes: true, attributeFilter: ['open'] });

// Horizontal entrances follow viewport progress and rewind when scrolling back.
const revealTargets = [...document.querySelectorAll(
  '.hero .eyebrow, .hero h1, .hero-bottom > *, .hero-foot, ' +
    '.section-heading > *, .project-visual, .project-info, ' +
    '.about-title, .about-copy, .stack > .kicker, .stack-heading > *, ' +
    '.stack-row, .contact > div, .footer-top, .footer-name, .footer-bottom'
)].map((element, index) => ({
  element,
  side: index % 2 === 0 ? -1 : 1,
  hero: Boolean(element.closest('.hero'))
}));
let revealFrame = 0;
const heroEntrances = [];
function updateReveals() {
  revealFrame = 0;
  const viewport = window.innerHeight;
  const headerBottom = document.querySelector('header').getBoundingClientRect().bottom;
  const compact = window.innerWidth <= 700;
  const travel = compact ? 64 : 130;
  const range = Math.min(viewport * 0.42, 360);
  // Horizontal translation does not alter these vertical measurements.
  const positions = revealTargets.map(({ element }) => element.getBoundingClientRect());
  revealTargets.forEach(({ element, side, hero }, index) => {
    if (reduce.matches || element.contains(document.activeElement)) {
      element.style.removeProperty('translate');
      element.style.removeProperty('opacity');
      return;
    }
    const { top, bottom } = positions[index];
    const enter = Math.max(0, Math.min(1, (viewport - top - 24) / range));
    const leave = Math.max(0, Math.min(1, (bottom - headerBottom) / range));
    // Hero also recedes as it leaves the top; other content stays solid while read.
    const progress = hero ? Math.min(enter, leave) : enter;
    const eased = 1 - Math.pow(1 - progress, 3);
    element.style.translate = `${(side * travel * (1 - eased)).toFixed(2)}px 0`;
    element.style.opacity = eased.toFixed(3);
  });
}
function requestReveals() {
  if (!revealFrame) revealFrame = requestAnimationFrame(updateReveals);
}
if (!reduce.matches) {
  revealTargets.filter(({ hero }) => hero).forEach(({ element, side }, index) => {
    const animation = element.animate(
      [
        { transform: `translateX(${side * (window.innerWidth <= 700 ? 64 : 130)}px)`, opacity: 0 },
        { transform: 'translateX(0)', opacity: 1 }
      ],
      { duration: 1000, delay: index * 110, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'backwards' }
    );
    heroEntrances.push(animation);
  });
}
reduce.addEventListener('change', () => {
  heroEntrances.forEach((animation) => animation.cancel());
  requestReveals();
});
window.addEventListener('scroll', requestReveals, { passive: true });
window.addEventListener('resize', requestReveals);
document.addEventListener('focusin', requestReveals);
document.addEventListener('focusout', requestReveals);
document.fonts.ready.then(requestReveals);
requestReveals();

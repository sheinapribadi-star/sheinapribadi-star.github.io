import './fonts.css';
import './style.css';
import './show.css';
import { initTheater, hangGarlands } from './theater.js';
import { initPopcorn, initSlushy } from './snack.js';

const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* ---------- house lights (localStorage, never cookies) ---------- */
const lights = $('.lights');
const meta = $('meta[name="theme-color"]');
function renderLights() {
  const down = root.dataset.lights === 'down';
  lights.setAttribute('aria-checked', String(down));
  $('.lights__state', lights).textContent = down ? 'down' : 'up';
  meta.setAttribute('content', down ? '#211819' : '#FFF5E4');
}
lights.addEventListener('click', () => {
  root.dataset.lights = root.dataset.lights === 'down' ? 'up' : 'down';
  try { localStorage.setItem('lights', root.dataset.lights); } catch (e) {}
  lights.classList.add('is-pulled');
  setTimeout(() => lights.classList.remove('is-pulled'), 260);
  renderLights();
});
renderLights();

/* ---------- the show: theater seats, snack bar, and (if motion is welcome) the scroll film ---------- */
const theater = initTheater();
hangGarlands();
initPopcorn();
initSlushy();
if (root.classList.contains('cine')) {
  const skip = $('.cinema__skip');
  import('./cine.js').then(({ initCine }) => initCine(theater)).catch(() => {
    root.classList.remove('cine'); if (skip) skip.hidden = true;
  });
}

/* ---------- chasing marquee bulbs ---------- */
const sign = $('.sign');
const bulbBox = $('.sign__bulbs');
function layBulbs() {
  const w = sign.clientWidth, h = sign.clientHeight, inset = 13, gap = 26;
  const pts = [];
  const W = w - inset * 2, H = h - inset * 2;
  const nx = Math.max(2, Math.round(W / gap)), ny = Math.max(2, Math.round(H / gap));
  for (let i = 0; i < nx; i++) pts.push([inset + (W * i) / nx, inset]);
  for (let i = 0; i < ny; i++) pts.push([inset + W, inset + (H * i) / ny]);
  for (let i = 0; i < nx; i++) pts.push([inset + W - (W * i) / nx, inset + H]);
  for (let i = 0; i < ny; i++) pts.push([inset, inset + H - (H * i) / ny]);
  bulbBox.replaceChildren(...pts.map(([x, y], i) => {
    const b = document.createElement('span');
    b.className = 'bulb'; b.dataset.p = String((i % 3) + 1);
    b.style.left = x + 'px'; b.style.top = y + 'px';
    return b;
  }));
}
new ResizeObserver(layBulbs).observe(sign);

/* ---------- popcorn ---------- */
const popBtn = $('.popcorn__btn');
const popCount = $('.popcorn__count');
let popped = 0;
popBtn.addEventListener('click', () => {
  const r = popBtn.getBoundingClientRect();
  const n = 6 + Math.floor(Math.random() * 4);
  for (let i = 0; i < n; i++) {
    const k = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    k.setAttribute('class', 'kernel'); k.setAttribute('aria-hidden', 'true');
    k.innerHTML = '<use href="#d-kernel"/>';
    const x0 = r.left + r.width / 2 - 13 + (Math.random() - .5) * 30, y0 = r.top + r.height * .25;
    k.style.left = x0 + 'px'; k.style.top = y0 + 'px';
    document.body.append(k);
    const dx = (Math.random() - .5) * 260, up = 90 + Math.random() * 130, spin = (Math.random() - .5) * 720;
    const anim = reduce.matches
      ? k.animate([{ opacity: 0, transform: `translate(${dx / 4}px, ${-up / 2}px)` }, { opacity: 1, offset: .3 }, { opacity: 0, transform: `translate(${dx / 4}px, ${-up / 2}px)` }], { duration: 900 })
      : k.animate([
          { transform: 'translate(0,0) scale(.3) rotate(0)', opacity: 1 },
          { transform: `translate(${dx * .5}px, ${-up}px) scale(1.1) rotate(${spin / 2}deg)`, opacity: 1, offset: .35, easing: 'cubic-bezier(.3,0,.7,1)' },
          { transform: `translate(${dx}px, ${innerHeight - y0 + 40}px) scale(1) rotate(${spin}deg)`, opacity: .9 },
        ], { duration: 1300 + Math.random() * 500, easing: 'cubic-bezier(.2,.6,.4,1)' });
    anim.onfinish = () => k.remove();
  }
  popped += n;
  popCount.textContent = `${popped} kernels popped`;
});

/* ---------- flip posters ---------- */
$$('.poster').forEach((poster) => {
  const front = $('.poster__front', poster), back = $('.poster__back', poster);
  const flipBtn = $('.poster__flip', poster), unflip = $('.poster__unflip', poster);
  const set = (flipped) => {
    poster.classList.toggle('is-flipped', flipped);
    flipBtn.setAttribute('aria-expanded', String(flipped));
    front.inert = flipped; back.inert = !flipped;
    setTimeout(() => (flipped ? $('.poster__backtitle', poster) : flipBtn).focus({ preventScroll: true }), reduce.matches ? 0 : 120);
  };
  flipBtn.addEventListener('click', () => set(true));
  unflip.addEventListener('click', () => set(false));
  back.addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
});

/* ---------- film strip controls ---------- */
const track = $('.strip__track');
$$('.strip__btn').forEach((b) => b.addEventListener('click', () => {
  const step = ($('.poster', track).offsetWidth + 26) * (innerWidth < 640 ? 1 : 2);
  track.scrollBy({ left: step * Number(b.dataset.dir), behavior: reduce.matches ? 'auto' : 'smooth' });
}));

/* ---------- concession stand: copy email ---------- */
const status = $('.copy__status');
$$('.copy').forEach((b) => b.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(b.dataset.copy); status.textContent = 'copied! thanks for stopping by'; b.textContent = 'copied'; }
  catch (e) { status.textContent = 'couldn’t copy. The address is right there, though!'; }
  setTimeout(() => { b.textContent = 'copy'; }, 2200);
}));

/* ---------- box office: count real numbers up as they scroll in ---------- */
const stats = $('.stats');
if (stats) {
  const counts = $$('.count', stats);
  const fmt = (n) => Math.round(n).toLocaleString('en-US');
  if (!reduce.matches) counts.forEach((el) => { el.textContent = '0'; });
  const run = () => {
    stats.classList.add('is-in');
    if (reduce.matches) return;
    counts.forEach((el, i) => {
      const to = Number(el.dataset.to), t0 = performance.now() + i * 90, dur = 1400 + Math.min(900, to / 4);
      const tick = (now) => {
        const k = Math.min(1, Math.max(0, (now - t0) / dur));
        const e = 1 - Math.pow(1 - k, 4);
        el.textContent = fmt(to * e);
        if (k < 1) requestAnimationFrame(tick);
      };
      el.textContent = '0';
      requestAnimationFrame(tick);
    });
  };
  new IntersectionObserver((entries, io) => { if (entries[0].isIntersecting) { io.disconnect(); run(); } }, { threshold: .35 }).observe(stats);
}

/* ---------- casting sheet: bars fill + radar grows on scroll; tap a trait to read it ---------- */
const cast = $('.actor') || $('.cast');
if (cast) {
  const read = { n: $('.cast__readn', cast), v: $('.cast__readv span', cast), d: $('.cast__readd', cast), box: $('.cast__readv', cast) };
  const traits = $$('.trait', cast);
  const DESC = {
    if: 'Empathetic, modest, supportive and value-driven',
    et: 'Decisive, proactive, forthright and objective',
    ef: 'Expressive, enthusiastic, engaging and outgoing',
    it: 'Introspective, factual, meticulous and analytical',
  };
  let raf = 0;
  const countTo = (to, from = 0) => {
    cancelAnimationFrame(raf);
    if (reduce.matches) { read.v.textContent = to; return; }
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / 700), e = 1 - Math.pow(1 - k, 3);
      read.v.textContent = Math.round(from + (to - from) * e);
      read.box.style.setProperty('--gx', k < 1 ? `${(Math.random() * 6 - 3).toFixed(1)}px` : '0px');
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  };
  const pick = (btn, animate = true) => {
    traits.forEach((t) => t.setAttribute('aria-pressed', String(t === btn)));
    $$('.radar__dot', cast).forEach((d) => d.classList.toggle('is-on', d.dataset.k === btn.dataset.k));
    read.n.textContent = $('.trait__name', btn).textContent;
    read.d.textContent = DESC[btn.dataset.k];
    const to = Number($('.tcount', btn).dataset.to);
    if (animate) countTo(to, Number(read.v.textContent) || 0); else read.v.textContent = to;
  };
  traits.forEach((t) => t.addEventListener('click', () => pick(t)));
  pick(traits[0], false);
  if (!reduce.matches) read.v.textContent = '0';
  new IntersectionObserver((entries, io) => {
    if (!entries[0].isIntersecting) return;
    io.disconnect();
    cast.classList.add('is-in');
    countTo(96);
  }, { threshold: .3 }).observe(cast);
}

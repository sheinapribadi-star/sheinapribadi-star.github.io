import './fonts.css';
import './style.css';

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

/* ---------- tear-the-ticket intro ---------- */
const intro = $('.intro');
const site = $('.site');
if (root.classList.contains('intro-on')) {
  const stub = $('.intro__stub', intro);
  site.inert = true;
  requestAnimationFrame(() => stub.focus({ preventScroll: true }));
  let done = false;
  const enter = () => {
    if (done) return; done = true;
    try { sessionStorage.setItem('ticket', 'torn'); } catch (e) {}
    intro.classList.add('is-torn');
    const finish = () => {
      root.classList.remove('intro-on');
      site.inert = false;
      intro.remove();
      $('#hero-title').focus({ preventScroll: true });
    };
    setTimeout(finish, reduce.matches ? 320 : 1150);
  };
  // drag the stub to tear it; a plain click/Enter/Space tears it too
  let start = null, moved = false;
  stub.addEventListener('pointerdown', (e) => { start = { x: e.clientX, y: e.clientY }; moved = false; stub.setPointerCapture(e.pointerId); intro.classList.add('is-dragging'); });
  stub.addEventListener('pointermove', (e) => {
    if (!start) return;
    const dx = Math.max(0, e.clientX - start.x), dy = Math.max(0, e.clientY - start.y);
    if (dx + dy > 6) moved = true;
    stub.style.setProperty('--dx', dx * .6 + 'px');
    stub.style.setProperty('--dy', dy * .6 + 'px');
    stub.style.setProperty('--rot', Math.min(28, (dx + dy) / 6) + 'deg');
    if (dx + dy > 120) { start = null; intro.classList.remove('is-dragging'); enter(); }
  });
  const release = () => {
    if (!start) return;
    start = null; intro.classList.remove('is-dragging');
    if (!moved) return; // click handler will tear
    stub.style.setProperty('--dx', '0px'); stub.style.setProperty('--dy', '0px'); stub.style.setProperty('--rot', '0deg');
  };
  stub.addEventListener('pointerup', release);
  stub.addEventListener('pointercancel', release);
  stub.addEventListener('click', () => { if (!moved || done) enter(); else moved = false; });
  $('.intro__skip', intro).addEventListener('click', enter);
  intro.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') enter();
    if (e.key === 'Tab') { // keep focus inside the ticket
      const f = [stub, $('.intro__skip', intro)];
      const i = f.indexOf(document.activeElement);
      e.preventDefault(); f[(i + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus();
    }
  });
} else if (intro) {
  intro.remove();
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

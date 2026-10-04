// The scroll film: ticket -> countdown leader -> opening credits -> camera pulls back into the theater.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

export function initCine({ aimBeam } = {}) {
  const root = document.documentElement;
  const show = $('.cinema'), stage = $('.stage', show), theater = $('#theater'), screen = $('#screen');
  const roll = $('.opening', show), skip = $('.cinema__skip', show);
  const small = matchMedia('(max-width: 760px)').matches;
  const dust = { mode: 0, boost: 0 };

  // split the name into letters for the pop-in
  $$('.cr-word').forEach((w) => { w.innerHTML = [...w.textContent].map((c) => `<span class="ch" aria-hidden="true">${c}</span>`).join(''); });

  // where the screen sits in the theater, at rest
  const geo = () => {
    const prev = theater.style.transform; theater.style.transform = 'none';
    const t = theater.getBoundingClientRect(), s = screen.getBoundingClientRect();
    theater.style.transform = prev;
    const vw = innerWidth, vh = innerHeight;
    const sx = s.left - t.left, sy = s.top - t.top;
    const k = Math.max(vw / s.width, vh / s.height) * 1.04;
    return { k, x: vw / 2 - k * (sx + s.width / 2), y: vh / 2 - k * (sy + s.height / 2), sx, sy, sw: s.width, sh: s.height, vw, vh };
  };
  let G = geo();
  theater.style.setProperty('--k', G.k);
  const len = () => innerHeight * (small ? 5.2 : 6.4);

  // projector.log: one line per beat of the film
  const lines = $$('.term__line', roll);
  const beats = [0, .03, .09, .25, .34, .47, .56, .68, .78, .85];
  let shown = -1;
  function logTo(p) {
    const n = beats.filter((b) => p >= b).length - 1;
    if (n === shown) return;
    lines.forEach((l, i) => { l.classList.toggle('is-on', i <= n && i > n - 5); l.classList.toggle('is-old', i < n); l.classList.toggle('is-new', i === n && n > shown); });
    shown = n;
  }
  logTo(0);
  gsap.set($$('.frame:not(.frame--ticket)', roll), { autoAlpha: 0 });
  gsap.set('.leader__num', { autoAlpha: 0 });
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: stage, start: 'top top', end: () => '+=' + len(), pin: true, scrub: .7, invalidateOnRefresh: true, anticipatePin: 1,
      onRefreshInit: () => { G = geo(); theater.style.setProperty('--k', G.k); },
      onUpdate: (st) => { dust.mode = st.progress > .86 ? 1 : 0; dust.boost = Math.min(5, Math.abs(st.getVelocity()) / 500); logTo(st.progress); skip.hidden = !st.isActive || st.progress > .97; },
      onToggle: (st) => { show.classList.toggle('is-live', st.isActive); skip.hidden = !st.isActive || st.progress > .97; },
    },
  });

  // 0 — 9 the ticket tears
  tl.to('.tk__stub', { y: () => innerHeight * .9, x: 60, rotation: 38, duration: 6, ease: 'power2.in' }, 1)
    .to('.tk__main', { y: -30, rotation: -4, duration: 4 }, 2)
    .to('.frame--ticket', { autoAlpha: 0, duration: 2 }, 6)
    .to('.opening__cue', { autoAlpha: 0, duration: 1.5 }, .5);
  // 8 — 24 countdown leader
  tl.to('.frame--leader', { autoAlpha: 1, duration: .8 }, 8)
    .fromTo('.leader', { scale: .7, rotation: -8 }, { scale: 1, rotation: 0, duration: 2, ease: 'back.out(2)' }, 8)
    .fromTo('.leader', { '--sweep': '0deg' }, { '--sweep': '360deg', duration: 4.6, repeat: 2 }, 9);
  ['3', '2', '1'].forEach((n, i) => {
    const at = 9 + i * 4.6;
    tl.fromTo(`.leader__num[data-n="${n}"]`, { autoAlpha: 0, scale: 1.4 }, { autoAlpha: 1, scale: 1, duration: .5, ease: 'back.out(3)' }, at)
      .to(`.leader__num[data-n="${n}"]`, { autoAlpha: 0, duration: .3 }, at + 4.3);
  });
  tl.to('.opening__flash', { opacity: .9, duration: .4 }, 22.6).to('.frame--leader', { autoAlpha: 0, duration: .2 }, 23).to('.opening__flash', { opacity: 0, duration: 1.4 }, 23);

  const glitch = (sel, at, px = 12) => tl.fromTo(sel, { '--gx': `${px}px` }, { '--gx': '0px', duration: 1.6, ease: 'steps(7)' }, at);
  const card = (sel, at, out, from = { y: 30, scale: .96 }) => {
    glitch(`${sel} .cr-house, ${sel} .cr-big`, at);
    tl.fromTo(sel, { autoAlpha: 0, ...from }, { autoAlpha: 1, y: 0, scale: 1, duration: 1.8, ease: 'power2.out' }, at)
      .to(sel, { autoAlpha: 0, y: -24, scale: 1.04, duration: 1.6, ease: 'power1.in' }, out);
  };
  // 24 — 33 presents
  card('.frame--presents', 24, 31.2);
  tl.fromTo('.frame--presents .cr-house', { letterSpacing: '.3em' }, { letterSpacing: '0em', duration: 6 }, 24);
  // 33 — 46 the name
  tl.to('.frame--name', { autoAlpha: 1, duration: .5 }, 33)
    .from('.frame--name .cr-small', { autoAlpha: 0, y: 16, duration: 1 }, 33)
    .from('.cr-name .ch', { autoAlpha: 0, y: () => gsap.utils.random(60, 140), rotation: () => gsap.utils.random(-40, 40), scale: .2, duration: 2.2, ease: 'back.out(2.2)', stagger: .28 }, 34)
    .from('.frame--name .cr-sub', { autoAlpha: 0, y: 14, duration: 1.2 }, 39.5)
    .from('.cr-doodle', { autoAlpha: 0, scale: 0, rotation: () => gsap.utils.random(-180, 180), duration: 1.4, ease: 'back.out(3)', stagger: .35 }, 36)
    .to('.cr-doodle', { rotation: () => gsap.utils.random(-50, 50), y: () => gsap.utils.random(-30, 30), duration: 6 }, 38)
    .to('.frame--name', { autoAlpha: 0, scale: 1.1, duration: 1.6, ease: 'power1.in' }, 44.4);
  glitch('.cr-name', 39, 16); glitch('.cr-name', 43.6, 22);
  // 46 — 55 school
  card('.frame--school', 46, 53.4, { y: 0, scale: .8 });
  // 55 — 67 credits roll upward
  tl.to('.frame--roles', { autoAlpha: 1, duration: .8 }, 55)
    .fromTo('.cr-roles', { yPercent: 0 }, { yPercent: -50, duration: 11.2 }, 55.2)
    .to('.frame--roles', { autoAlpha: 0, duration: 1 }, 66.2);
  // 67 — 80 featuring: title cards fly in
  tl.to('.frame--featuring', { autoAlpha: 1, duration: .5 }, 67)
    .from('.frame--featuring .cr-small', { autoAlpha: 0, scale: .6, duration: 1 }, 67)
    .from('.cr-feat li', { autoAlpha: 0, scale: .2, rotation: () => gsap.utils.random(-30, 30), y: () => gsap.utils.random(-80, 80), duration: 1.6, ease: 'back.out(1.8)', stagger: .55 }, 67.6)
    .to('.cr-feat li', { y: () => gsap.utils.random(-30, 30), x: () => gsap.utils.random(-24, 24), duration: 3, stagger: .1 }, 74.5)
    .to('.frame--featuring', { autoAlpha: 0, scale: .9, duration: 1.2 }, 78.8);
  // 80 — 85 and introducing you
  glitch('.frame--you .cr-big', 80);
  tl.fromTo('.frame--you', { autoAlpha: 0, y: 30, scale: .96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 1.8, ease: 'power2.out' }, 80);
  // ambient: sprockets run, reel spins
  tl.fromTo('.opening__sprockets', { backgroundPositionY: '0px' }, { backgroundPositionY: () => -innerHeight * 3 + 'px', duration: 85 }, 0)
    .fromTo('.opening__reel', { rotation: 0 }, { rotation: 1080, duration: 85 }, 0);
  // 84 — 100 the camera pulls back into the theater
  tl.fromTo(theater, { x: () => G.x, y: () => G.y, scale: () => G.k }, { x: 0, y: 0, scale: 1, duration: 15, ease: 'power2.inOut' }, 85)
    .to(roll, { x: () => G.sx + G.sw / 2 - G.vw / 2 * (G.sw / G.vw), y: () => G.sy + G.sh / 2 - G.vh / 2 * (G.sw / G.vw), scale: () => G.sw / G.vw, duration: 15, ease: 'power2.inOut' }, 85)
    .to(roll, { autoAlpha: 0, duration: 2 }, 85)
    .to('.screen__film', { autoAlpha: 0, duration: 3 }, 95.5)
    .from('.rows .row', { y: 60, opacity: 0, duration: 6, stagger: 1.4, ease: 'power2.out' }, 92)
    .from('.theater__aisle', { opacity: 0, duration: 3 }, 97)
    .from('.screen__idle > *', { opacity: 0, y: 14, duration: 2.5, stagger: .5 }, 96.5);

  // ticket stub: click/Enter tears it by rolling the film forward
  const st = tl.scrollTrigger;
  const toProgress = (p, smooth = true) => scrollTo({ top: st.start + (st.end - st.start) * p, behavior: smooth ? 'smooth' : 'instant' });
  $('.tk__stub').addEventListener('click', () => toProgress(.24));
  skip.addEventListener('click', () => {
    scrollTo({ top: st.end + 2, behavior: 'instant' });
    requestAnimationFrame(() => $('#theater-title').focus({ preventScroll: true }));
  });
  // a keyboard user tabbing into the theater should land in the finished room
  $('.rows').addEventListener('focusin', () => { if (st.progress < 1 && st.isActive) scrollTo({ top: st.end + 2, behavior: 'instant' }); });

  // topbar tucks away until the lobby
  const tb = (st) => root.classList.toggle('show-live', !st.isActive);
  ScrollTrigger.create({ trigger: '#lobby', start: 'top 70px', end: 'max', onToggle: tb, onRefresh: tb });
  ScrollTrigger.addEventListener('refresh', () => aimBeam && aimBeam());
  addEventListener('load', () => ScrollTrigger.refresh());
  document.fonts?.ready.then(() => ScrollTrigger.refresh());

  /* ---------- dust in the projector beam ---------- */
  const canvas = $('.dust', stage), ctx = canvas.getContext('2d');
  let W, H, dpr, motes = [], on = true;
  const size = () => {
    dpr = Math.min(devicePixelRatio || 1, 1.5); W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    motes = Array.from({ length: small ? 40 : 90 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.6 + .4, vx: (Math.random() - .5) * 8, vy: (Math.random() - .5) * 6 - 2, p: Math.random() * 6.3 }));
  };
  size(); addEventListener('resize', size);
  const inBeam = (x, y) => {
    if (dust.mode === 0) { const half = Math.tan(.42) * (y + H * .08); return Math.max(0, 1 - Math.abs(x - W / 2) / half); }
    // theater: cone from behind the audience (bottom centre) to the screen
    const s = screen.getBoundingClientRect(), c = canvas.getBoundingClientRect();
    const ty = s.top - c.top, by = H * 1.1;
    if (y < ty || y > by) return 0;
    const f = (y - ty) / (by - ty), half = (s.width / 2) * (1 - f);
    return Math.max(0, 1 - Math.abs(x - (s.left - c.left + s.width / 2)) / (half + 1)) * .8;
  };
  let lastT = performance.now();
  const loop = (now) => {
    if (!on) return;
    const dt = Math.min(.05, (now - lastT) / 1000); lastT = now;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    for (const m of motes) {
      const sp = 1 + dust.boost * 6;
      m.x += m.vx * dt * sp; m.y += (m.vy - dust.boost * 30) * dt * sp; m.p += dt * 1.5;
      if (m.x < 0) m.x += W; if (m.x > W) m.x -= W; if (m.y < 0) m.y += H; if (m.y > H) m.y -= H;
      const a = Math.min(1, inBeam(m.x, m.y) * (.45 + .4 * Math.sin(m.p)) * (1 + dust.boost * .5));
      if (a <= .02) continue;
      ctx.fillStyle = `rgba(255,240,210,${a})`;
      ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, 6.3); ctx.fill();
    }
    dust.boost *= .94;
    requestAnimationFrame(loop);
  };
  new IntersectionObserver(([e]) => { const was = on; on = e.isIntersecting; if (on && !was) { lastT = performance.now(); requestAnimationFrame(loop); } }).observe(stage);
  requestAnimationFrame(loop);
}

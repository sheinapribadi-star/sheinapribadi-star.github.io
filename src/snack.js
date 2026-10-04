// The snack bar: a popcorn machine with tiny hand-rolled 2D physics, and a slushy machine.
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)');

/* ===================== popcorn ===================== */
const KERNEL = new Path2D('M12 16c-5-5 1-12 7-8.4 2-6 10.6-6.2 12 0 6-2.2 10.4 4 6.4 9 4.4 4.4-.4 11.4-6.6 9.4-2 5.4-10.6 5.4-12.4-.6-6.4 2-11-4.4-6.4-9.4z');
const CURL = new Path2D('M18 18c1-1.6 3-2 4.6-1');

function sprites(dpr) {
  // a few pre-rendered kernels: plain, buttery, extra buttery
  return ['#FFF8E8', '#FFE7A6', '#FFD978'].map((fill, i) => {
    const size = 44 * dpr, c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    g.scale(dpr, dpr); g.translate(0, 4);
    g.lineJoin = 'round'; g.lineCap = 'round';
    g.fillStyle = fill; g.strokeStyle = '#3B2626'; g.lineWidth = 2.2;
    g.fill(KERNEL); g.stroke(KERNEL);
    if (i) { g.fillStyle = 'rgba(255,196,64,.55)'; g.beginPath(); g.ellipse(26, 18, 5, 3.5, .5, 0, 7); g.fill(); }
    g.lineWidth = 1.6; g.stroke(CURL);
    return c;
  });
}

export function initPopcorn() {
  const stage = $('.snack__stage');
  if (!stage) return;
  const canvas = $('.snack__canvas', stage), ctx = canvas.getContext('2d');
  const pm = $('.pm', stage), glass = $('.pm__glass', pm), mouth = $('.pm__mouth', pm);
  const popBtn = $('.pm__pop', pm), hatch = $('.pm__hatch', pm), crank = $('.pm__crank', pm);
  const count = $('#pm-count');
  const small = matchMedia('(max-width: 760px)').matches;
  const MAX = small ? 80 : 150;
  let dpr = 1, W = 0, H = 0, segs = [], kernels = [], puffs = [], art = [], bucketBox = null;
  let running = false, last = 0, visible = true, total = 0, open = false;
  const pointer = { x: -1e4, y: -1e4, vx: 0, vy: 0, t: 0, active: false };

  const seg = (x1, y1, x2, y2, door = false) => ({ x1, y1, x2, y2, door });
  function layout() {
    const s = stage.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, small ? 1.5 : 2);
    W = s.width; H = s.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    art = sprites(dpr);
    const rel = (el) => { const r = el.getBoundingClientRect(); return { l: r.left - s.left, t: r.top - s.top, r: r.right - s.left, b: r.bottom - s.top, w: r.width, h: r.height }; };
    segs = [];
    // glass case (inside the 6px frame); floor slopes down to the hatch
    const g = rel(glass), gl = g.l + 6, gr = g.r, gt = g.t + 4, gb = g.b - 6;
    segs.push(seg(gl, gt, gl, gb), seg(gl, gt, gr, gt), seg(gr, gt, gr, gb - 62), seg(gl, gb - 40, gr, gb), seg(gr, gb - 62, gr, gb, true));
    // machine body + roof are solid
    const roof = rel($('.pm__roof', pm)), base = rel($('.pm__base', pm));
    segs.push(seg(roof.l, roof.t + 20, roof.l + 30, roof.t), seg(roof.l + 30, roof.t, roof.r - 30, roof.t), seg(roof.r - 30, roof.t, roof.r, roof.t + 20), seg(roof.r, roof.t + 20, roof.r, roof.b));
    segs.push(seg(base.l, base.t, base.r, base.t), seg(base.r, base.t, base.r, base.b), seg(base.l, base.t, base.l, base.b));
    // bucket: tapered U
    const bk = rel($('.bucket', stage));
    bucketBox = bk;
    segs.push(seg(bk.l + 3, bk.t + 4, bk.l + bk.w * .16, bk.b - 3), seg(bk.l + bk.w * .16, bk.b - 3, bk.r - bk.w * .16, bk.b - 3), seg(bk.r - bk.w * .16, bk.b - 3, bk.r - 3, bk.t + 4));
    // counters + slushy machine
    $$('.counter', stage).forEach((c) => { const r = rel(c); segs.push(seg(r.l, r.t + 2, r.r, r.t + 2)); });
    const sl = $('.sl', stage);
    if (sl) { const r = rel(sl); segs.push(seg(r.l, r.t + 20, r.l + 20, r.t), seg(r.l + 20, r.t, r.r - 20, r.t), seg(r.r - 20, r.t, r.r, r.t + 20), seg(r.l, r.t + 20, r.l, r.b), seg(r.r, r.t + 20, r.r, r.b)); }
    const m = rel(mouth);
    mouthPt = { x: m.l, y: m.t };
    draw();
  }
  let mouthPt = { x: 0, y: 0 };

  function pop(n = 1) {
    for (let i = 0; i < n; i++) {
      const r = (small ? 7.5 : 8.5) + Math.random() * 2.8;
      kernels.push({ x: mouthPt.x + (Math.random() - .5) * 16, y: mouthPt.y + 6, vx: -40 + (Math.random() - .35) * 420, vy: -260 - Math.random() * 360,
        r, a: Math.random() * 6.3, av: (Math.random() - .5) * 14, s: .25, art: (Math.random() * 3) | 0, rest: 0, sleep: false, born: performance.now() });
      puffs.push({ x: mouthPt.x, y: mouthPt.y + 4, t: 0 });
      total++;
    }
    while (kernels.length > MAX) kernels.shift();
    pm.classList.add('is-popping');
    clearTimeout(pop.t); pop.t = setTimeout(() => pm.classList.remove('is-popping'), 220);
    if (reduce.matches) { settle(); draw(); } else wake();
    if (!seeding) tally();
  }
  let seeding = false;

  let tallyT = 0;
  function tally() {
    if (tallyT) return;
    tallyT = setTimeout(() => {
      tallyT = 0;
      const inBucket = kernels.filter((k) => bucketBox && k.x > bucketBox.l && k.x < bucketBox.r && k.y > bucketBox.t - 40 && k.y < bucketBox.b).length;
      count.innerHTML = `<b>${total}</b> popped${inBucket ? ` &middot; <b>${inBucket}</b> in your bucket` : open ? '' : ' &middot; open the hatch to fill your bucket'}`;
    }, reduce.matches ? 0 : 350);
  }

  /* --- physics --- */
  const G = 1500;
  function collideSeg(k, s) {
    if (s.door && open) return false;
    const dx = s.x2 - s.x1, dy = s.y2 - s.y1, len2 = dx * dx + dy * dy;
    let t = ((k.x - s.x1) * dx + (k.y - s.y1) * dy) / len2;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const px = s.x1 + t * dx, py = s.y1 + t * dy;
    let nx = k.x - px, ny = k.y - py;
    const d2 = nx * nx + ny * ny, r = k.r * k.s;
    if (d2 >= r * r) return false;
    const d = Math.sqrt(d2) || .0001; nx /= d; ny /= d;
    k.x += nx * (r - d); k.y += ny * (r - d);
    const vn = k.vx * nx + k.vy * ny;
    if (vn < 0) {
      const tx = k.vx - vn * nx, ty = k.vy - vn * ny;
      k.vx = tx * .86 - vn * nx * .32; k.vy = ty * .86 - vn * ny * .32;
      k.av = (tx * -ny + ty * nx) / r * .9;
    }
    return true;
  }
  function step(dt) {
    for (const k of kernels) {
      if (k.s < 1) k.s = Math.min(1, k.s + dt * 7);
      if (k.sleep) continue;
      k.vy += G * dt; k.vx *= .999; k.vy *= .999;
      k.x += k.vx * dt; k.y += k.vy * dt; k.a += k.av * dt; k.av *= .99;
    }
    for (let i = 0; i < kernels.length; i++) {
      const a = kernels[i];
      for (let j = i + 1; j < kernels.length; j++) {
        const b = kernels[j];
        if (a.sleep && b.sleep) continue;
        const dx = b.x - a.x, dy = b.y - a.y, rr = a.r * a.s + b.r * b.s;
        if (dx > rr || dx < -rr || dy > rr || dy < -rr) continue;
        const d2 = dx * dx + dy * dy;
        if (d2 >= rr * rr) continue;
        const d = Math.sqrt(d2) || .0001, nx = dx / d, ny = dy / d, o = rr - d;
        const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (a.sleep && rv < -90) a.sleep = false;
        if (b.sleep && rv < -90) b.sleep = false;
        const wa = a.sleep ? 0 : b.sleep ? 1 : .5, wb = 1 - wa;
        a.x -= nx * o * wa; a.y -= ny * o * wa; b.x += nx * o * wb; b.y += ny * o * wb;
        if (rv < 0) {
          const jimp = -(1.15) * rv;
          a.vx -= nx * jimp * wa; a.vy -= ny * jimp * wa; b.vx += nx * jimp * wb; b.vy += ny * jimp * wb;
          const f = .96; if (!a.sleep) { a.vx *= f; } if (!b.sleep) { b.vx *= f; }
        }
      }
    }
    for (const k of kernels) {
      if (k.sleep) continue;
      for (const s of segs) collideSeg(k, s);
      const sp = k.vx * k.vx + k.vy * k.vy;
      if (sp < 300) { k.rest += dt; if (k.rest > .35) { k.sleep = true; k.vx = k.vy = 0; k.av = 0; } } else k.rest = 0;
    }
    kernels = kernels.filter((k) => k.y < H + 40 && k.x > -40 && k.x < W + 40);
  }
  function settle() { for (let i = 0; i < 900 && kernels.some((k) => !k.sleep); i++) step(1 / 120); }

  function poke(x, y, vx, vy, radius) {
    let hit = false;
    for (const k of kernels) {
      const dx = k.x - x, dy = k.y - y, d = Math.hypot(dx, dy);
      if (d > radius + k.r) continue;
      hit = true; k.sleep = false; k.rest = 0;
      if (vx || vy) { k.vx += vx * .7; k.vy += vy * .7 - 60; }
      else { const f = (1 - d / (radius + k.r)) * 520 + 140; k.vx += (dx / (d || 1)) * f; k.vy -= f * 1.1; }
      k.av += (Math.random() - .5) * 20;
    }
    return hit;
  }
  // a sleeping kernel whose support vanished (hatch opened) needs a nudge
  function wakeAll() { kernels.forEach((k) => { k.sleep = false; k.rest = 0; }); wake(); }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    for (const p of puffs) {
      const a = 1 - p.t / .3;
      ctx.strokeStyle = `rgba(255,246,232,${a * .7})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(p.x, p.y, 4 + p.t * 60, 0, 6.3); ctx.stroke();
    }
    for (const k of kernels) {
      const sz = k.r * 2.4 * k.s;
      ctx.save(); ctx.translate(k.x, k.y); ctx.rotate(k.a);
      ctx.drawImage(art[k.art], -sz / 2, -sz / 2 - sz * .06, sz, sz);
      ctx.restore();
    }
  }
  function frame(now) {
    if (!running) return;
    const dt = Math.min(.033, (now - last) / 1000 || .016); last = now;
    for (let i = 0; i < 3; i++) step(dt / 3);
    puffs.forEach((p) => (p.t += dt)); puffs = puffs.filter((p) => p.t < .3);
    if (pointer.active && now - pointer.t < 60) poke(pointer.x, pointer.y, pointer.vx, pointer.vy, 16);
    draw();
    if (!visible || (!kernels.some((k) => !k.sleep) && !puffs.length && !holding)) { running = false; if (total) tally(); return; }
    requestAnimationFrame(frame);
  }
  function wake() { if (running || reduce.matches) return; running = true; last = performance.now(); requestAnimationFrame(frame); }

  /* --- controls --- */
  let holding = false, holdTimer = 0, fromPointer = false;
  const startHold = (e) => {
    e.preventDefault(); fromPointer = true; holding = true; popBtn.classList.add('is-down');
    popBtn.setPointerCapture?.(e.pointerId);
    pop(2);
    clearInterval(holdTimer); holdTimer = setInterval(() => pop(1 + (Math.random() < .5)), reduce.matches ? 400 : 90);
  };
  const endHold = () => { holding = false; popBtn.classList.remove('is-down'); clearInterval(holdTimer); };
  popBtn.addEventListener('pointerdown', startHold);
  popBtn.addEventListener('pointerup', endHold);
  popBtn.addEventListener('pointercancel', endHold);
  popBtn.addEventListener('lostpointercapture', endHold);
  popBtn.addEventListener('click', () => { if (fromPointer) { fromPointer = false; return; } pop(6); }); // keyboard
  popBtn.addEventListener('contextmenu', (e) => e.preventDefault());

  hatch.addEventListener('click', () => {
    open = !open;
    hatch.setAttribute('aria-pressed', String(open));
    hatch.textContent = open ? 'Close the hatch' : 'Open the hatch';
    pm.classList.toggle('is-open', open);
    if (open) kernels.forEach((k) => { k.vx += 90; });
    if (reduce.matches) { settle(); draw(); } else wakeAll();
    tally();
  });

  // crank: drag it round, or press it
  let angle = 0, acc = 0, drag = null;
  const turn = (deg) => {
    angle += deg; acc += Math.abs(deg);
    crank.style.setProperty('--a', `${angle}deg`);
    while (acc >= 50) { acc -= 50; pop(2); }
  };
  const centre = () => { const r = crank.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
  crank.addEventListener('pointerdown', (e) => { const c = centre(); drag = { a: Math.atan2(e.clientY - c.y, e.clientX - c.x), moved: 0 }; crank.setPointerCapture(e.pointerId); e.preventDefault(); });
  crank.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const c = centre(), a = Math.atan2(e.clientY - c.y, e.clientX - c.x);
    let d = a - drag.a; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI;
    drag.a = a; drag.moved += Math.abs(d);
    turn((d * 180) / Math.PI);
  });
  const endDrag = () => { if (drag && drag.moved > .3) crank._skip = true; drag = null; };
  crank.addEventListener('pointerup', endDrag);
  crank.addEventListener('pointercancel', endDrag);
  crank.addEventListener('click', () => { if (crank._skip) { crank._skip = false; return; } turn(100); });
  crank.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); turn(60); } if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); turn(-60); } });

  // touch the popcorn: hover-flick with a mouse, tap to boop
  canvas.addEventListener('pointermove', (e) => {
    if (reduce.matches) return;
    const r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, now = performance.now();
    const dt = Math.max(8, now - pointer.t) / 1000;
    pointer.vx = Math.max(-900, Math.min(900, (x - pointer.x) / dt)); pointer.vy = Math.max(-900, Math.min(900, (y - pointer.y) / dt));
    if (now - pointer.t > 120) { pointer.vx = pointer.vy = 0; }
    pointer.x = x; pointer.y = y; pointer.t = now; pointer.active = true;
    if (poke(x, y, pointer.vx, pointer.vy, 14)) wake();
  });
  canvas.addEventListener('pointerleave', () => { pointer.active = false; });
  canvas.addEventListener('pointerdown', (e) => {
    if (reduce.matches) return;
    const r = canvas.getBoundingClientRect();
    if (poke(e.clientX - r.left, e.clientY - r.top, 0, 0, 46)) wake();
  });

  new ResizeObserver(() => layout()).observe(stage);
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && kernels.some((k) => !k.sleep)) wake(); }).observe(stage);
  // a little welcome pile so the case is never empty
  layout();
  const seed = () => { seeding = true; for (let i = 0; i < (small ? 14 : 22); i++) { pop(1); kernels[kernels.length - 1].vy *= .4; } settle(); draw(); total = 0; seeding = false; count.innerHTML = 'The kettle&rsquo;s hot. Press <b>Pop!</b> or turn the crank.'; };
  if (document.fonts?.ready) document.fonts.ready.then(() => { layout(); seed(); }); else seed();
}

/* ===================== slushies ===================== */
const FLAVORS = {
  cherry: { name: 'Cherry Bomb', html: 'Say hi anytime: <a href="mailto:pribadisheina@gmail.com">pribadisheina@gmail.com</a>' },
  sky: { name: 'Blue Sky', html: 'Peek at the code: <a href="https://github.com/sheinapribadi-star">github.com/sheinapribadi-star</a>' },
  butter: { name: 'Lemon Butter', html: 'Fun fact: I grew up in Jakarta, and I speak English, Indonesian and a little Mandarin.' },
  mint: { name: 'Mint Condition', html: 'Fun fact: outside of work I boulder and watch too many movies.' },
};
const LAYER = 19, CAP = 4;

export function initSlushy() {
  const sl = $('.sl');
  if (!sl) return;
  const tray = $('.sl__tray', sl), cup = $('.cup', sl), fill = $('.cup__fill', cup), stream = $('.sl__stream', sl);
  const receipt = $('.receipt', sl), drink = $('.sl__drink', sl);
  const taps = $$('.tap', sl);
  const noz = document.createElement('div'); noz.className = 'sl__nozzles'; noz.setAttribute('aria-hidden', 'true');
  noz.innerHTML = '<i></i><i></i><i></i><i></i>'; tray.prepend(noz);
  let layers = 0, busy = false;
  const wait = (ms) => new Promise((r) => setTimeout(r, reduce.matches ? 0 : ms));
  const level = () => cup.style.setProperty('--lvl', `${layers * LAYER}px`);

  let order = 0;
  const printReceipt = (title, html) => {
    order++;
    let no = $('.receipt__no', receipt);
    if (!no) { no = document.createElement('p'); no.className = 'receipt__no'; no.setAttribute('aria-hidden', 'true'); receipt.prepend(no); }
    no.textContent = `order #${String(order).padStart(3, '0')} · snack bar`;
    $('.receipt__title', receipt).textContent = title;
    $('.receipt__body', receipt).innerHTML = html;
    receipt.classList.remove('is-printing'); void receipt.offsetWidth;
    if (!reduce.matches) receipt.classList.add('is-printing');
  };

  const queue = [];
  async function pour(tap) {
    if (busy) { if (queue.length < CAP) queue.push(tap); return; }
    const f = tap.dataset.f, flavor = FLAVORS[f];
    if (layers >= CAP) { printReceipt('Cup’s full!', 'Drink up first, then pour another round.'); return; }
    busy = true;
    const t = tray.getBoundingClientRect(), r = tap.getBoundingClientRect();
    const x = r.left + r.width / 2 - t.left;
    cup.style.setProperty('--cx', `${x}px`);
    stream.style.setProperty('--sx', `${x}px`);
    stream.style.setProperty('--c', `var(--f-${f})`);
    tap.classList.add('is-pulled');
    await wait(420);
    const layer = document.createElement('i');
    layer.className = 'layer'; layer.style.setProperty('--c', `var(--f-${f})`);
    fill.append(layer);
    const top = cup.offsetTop + cup.offsetHeight - layers * LAYER;
    stream.style.setProperty('--sh', `${Math.max(20, top - 12)}px`);
    stream.classList.add('is-on');
    await wait(120);
    layers++;
    cup.classList.add('has-drink'); level();
    if (reduce.matches) layer.style.height = `${LAYER}px`;
    else layer.animate([{ height: '0px' }, { height: `${LAYER}px` }], { duration: 850, easing: 'cubic-bezier(.3,.7,.4,1)', fill: 'forwards' });
    stream.style.setProperty('--sh', `${Math.max(20, top - 12 - LAYER)}px`);
    await wait(850);
    layer.style.height = `${LAYER}px`;
    stream.classList.remove('is-on'); tap.classList.remove('is-pulled');
    const bowl = $(`.bowl[data-f="${f}"]`, sl);
    const lvl = parseFloat(bowl.style.getPropertyValue('--lvl') || '74');
    bowl.style.setProperty('--lvl', `${Math.max(36, lvl - 9)}%`);
    printReceipt(flavor.name, flavor.html);
    if (layers >= CAP) {
      await wait(200);
      cup.classList.add('is-full', 'is-cheers');
      setTimeout(() => cup.classList.remove('is-cheers'), 700);
      cup.style.setProperty('--cx', '50%');
      drink.hidden = false;
      printReceipt('A four-flavor slushy', `${flavor.html}<br><br>Brain freeze not included. Cheers!`);
    }
    busy = false;
    if (queue.length) pour(queue.shift());
  }

  taps.forEach((tap) => tap.addEventListener('click', () => pour(tap)));
  drink.addEventListener('click', async () => {
    drink.hidden = true; cup.classList.remove('is-full');
    const ls = $$('.layer', fill).reverse();
    for (const l of ls) {
      if (!reduce.matches) await l.animate([{ height: `${LAYER}px` }, { height: '0px' }], { duration: 260, easing: 'ease-in', fill: 'forwards' }).finished;
      l.remove(); layers--; level();
    }
    layers = 0; level(); cup.classList.remove('has-drink');
    $$('.bowl', sl).forEach((b) => b.style.setProperty('--lvl', '74%'));
    printReceipt('Slurp.', 'Fresh cup, fresh flavors. Pick another!');
    taps[0].focus();
  });
}

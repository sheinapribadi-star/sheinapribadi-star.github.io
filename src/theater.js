// Seats -> big screen. Content is read from the readable sections below, so there is one source of truth.
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const TINTS = { sky: '#BFDDF2', rose: '#F6C1C4', butter: '#FFD66E', mint: '#CFE8D2' };

function readProject(id) {
  const feature = document.getElementById(id);
  if (feature && feature.classList.contains('feature')) {
    const body = $('.feature__body', feature);
    const img = $('.feature__screen img', feature);
    const year = $$('.chips li', feature).map((li) => li.textContent).find((t) => /^\d{4}/.test(t)) || '';
    return {
      kicker: `${$('.feature__kicker span', feature).textContent} · ${year}`,
      title: $('.feature__title', feature).textContent,
      desc: $(':scope > p:not(.feature__kicker):not(.fineprint):not(.tickets)', body).textContent,
      img: img && { src: img.getAttribute('src'), srcset: img.getAttribute('srcset') },
      tint: TINTS[feature.dataset.tint] || TINTS.sky,
      links: $$('.tickets a', feature).map((a) => ({ href: a.href, text: $('.ticket__main', a).firstChild.textContent.trim() })),
      more: `#${id}`,
    };
  }
  const back = document.getElementById(`${id}-back`);
  if (!back) return null;
  const poster = back.closest('.poster');
  const top = $$('.poster__top span', back).map((s) => s.textContent);
  return {
    kicker: top.join(' · '),
    badge: top[0],
    title: $('.poster__title', poster).firstChild.textContent.trim(),
    sub: $('.poster__subtitle', poster)?.textContent || '',
    desc: $('.poster__desc', back).textContent,
    href: $('.poster__backtitle a', back)?.href,
    doodle: $('.poster__front use', poster).getAttribute('href'),
    tint: TINTS[poster.dataset.tint] || TINTS.sky,
    links: $$('.poster__links a', back).map((a) => ({ href: a.href, text: a.firstChild.textContent.trim() })),
    more: '#repertory',
  };
}

function render(p, seatNo) {
  const wrap = document.createElement('div');
  wrap.className = 'np';
  const still = p.img
    ? `<img src="${p.img.src}" srcset="${p.img.srcset || ''}" sizes="(min-width: 760px) 360px, 90vw" alt="" decoding="async">`
    : `<svg class="doodle" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><use href="${p.doodle}"/></svg>`;
  const reel = p.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 24);
  wrap.innerHTML = `
    <p class="np__term" aria-hidden="true"><span><b>&#9654; playing</b> &middot; seat ${seatNo} &middot; ${reel}.reel</span><span>${(p.kicker.match(/\d{4}(?:[–-]\d{2})?/) || [''])[0]}</span></p>
    <div class="np__still" style="--tint:${p.tint}">${still}${p.badge ? `<span class="np__badge">${p.badge}</span>` : ''}</div>
    <div class="np__body">
      <p class="np__kicker"></p>
      <h3 class="np__title" tabindex="-1"></h3>${p.sub ? '<p class="np__sub"></p>' : ''}
      <p class="np__desc"></p>
      <p class="np__links"></p>
      <p class="np__more"><a href="${p.more}">more in the quick read below</a></p>
    </div>
    <button class="np__close" type="button" aria-label="Clear the screen">&times;</button>`;
  $('.np__kicker', wrap).textContent = p.kicker;
  if (p.href) {
    const t = document.createElement('a');
    t.href = p.href; t.textContent = p.title;
    $('.np__title', wrap).append(t);
  } else $('.np__title', wrap).textContent = p.title;
  if (p.sub) $('.np__sub', wrap).textContent = p.sub;
  $('.np__desc', wrap).textContent = p.desc;
  const links = $('.np__links', wrap);
  p.links.forEach((l) => {
    const a = document.createElement('a');
    a.href = l.href; a.textContent = l.text + ' ';
    const arrow = document.createElement('span'); arrow.setAttribute('aria-hidden', 'true'); arrow.textContent = '↗';
    a.append(arrow); links.append(a);
  });
  return wrap;
}

export function initTheater() {
  const screen = $('#screen');
  if (!screen) return;
  const play = $('.screen__play', screen);
  const flicker = $('.screen__flicker', screen);
  const seats = $$('button.seat');
  let current = null;

  const projector = () => {
    if (reduce.matches) return;
    flicker.animate(
      [{ opacity: 1 }, { opacity: .2, offset: .25 }, { opacity: .8, offset: .4 }, { opacity: .05, offset: .7 }, { opacity: 0 }],
      { duration: 520, easing: 'steps(1, end)' }
    );
    flicker.animate([{ backgroundPosition: '-300px 0' }, { backgroundPosition: '300px 0' }], { duration: 520 });
  };

  const clear = (focusSeat = true) => {
    const seat = current;
    current = null;
    seats.forEach((s) => s.setAttribute('aria-pressed', 'false'));
    screen.classList.remove('is-playing');
    play.replaceChildren();
    if (focusSeat && seat) seat.focus({ preventScroll: true });
  };

  const show = (seat) => {
    if (current === seat) { clear(); return; }
    const p = readProject(seat.dataset.play);
    if (!p) return;
    current = seat;
    seats.forEach((s) => s.setAttribute('aria-pressed', String(s === seat)));
    play.replaceChildren(render(p, $('.seat__no', seat).textContent));
    screen.classList.add('is-playing');
    $('.np__close', play).addEventListener('click', () => clear());
    projector();
    // keep the screen in view (on phones it can sit above the fold)
    const r = screen.getBoundingClientRect();
    if (r.top < 0 || r.bottom > innerHeight) screen.scrollIntoView({ block: 'nearest', behavior: reduce.matches ? 'auto' : 'smooth' });
  };

  seats.forEach((seat) => seat.addEventListener('click', () => show(seat)));
  screen.addEventListener('keydown', (e) => { if (e.key === 'Escape' && current) clear(); });
  $('.rows').addEventListener('keydown', (e) => { if (e.key === 'Escape' && current) { e.preventDefault(); clear(); } });

  // arrow keys move between seats like walking along the rows
  const rows = $$('.row').map((r) => $$('button.seat', r));
  $('.rows').addEventListener('keydown', (e) => {
    const i = rows.findIndex((r) => r.includes(document.activeElement));
    if (i < 0) return;
    const j = rows[i].indexOf(document.activeElement);
    let next = null;
    if (e.key === 'ArrowRight') next = rows[i][j + 1];
    if (e.key === 'ArrowLeft') next = rows[i][j - 1];
    if (e.key === 'ArrowUp' && rows[i - 1]) next = rows[i - 1][Math.min(j, rows[i - 1].length - 1)];
    if (e.key === 'ArrowDown' && rows[i + 1]) next = rows[i + 1][Math.min(j, rows[i + 1].length - 1)];
    if (next) { e.preventDefault(); next.focus(); }
  });

  // projector beam lands on the screen
  const theater = $('#theater');
  const aimBeam = () => {
    const t = theater.getBoundingClientRect(), s = screen.getBoundingClientRect();
    if (!t.width) return;
    const sx = (theater.offsetWidth / t.width) || 1; // undo any zoom transform
    const pct = (v, total) => `${(v * sx / total) * 100}%`;
    theater.style.setProperty('--bl', pct(s.left - t.left, theater.offsetWidth));
    theater.style.setProperty('--br', pct(s.right - t.left, theater.offsetWidth));
    theater.style.setProperty('--bt', pct(s.top - t.top, theater.offsetHeight));
    theater.style.setProperty('--bb', pct(s.bottom - t.top, theater.offsetHeight));
  };
  new ResizeObserver(aimBeam).observe(theater);
  return { aimBeam };
}

// string lights along a wavy wire
export function hangGarlands() {
  $$('.theater__garland, .snack__lights').forEach((g) => {
    const path = $('path', g), box = $('.garland__bulbs', g);
    const lay = () => {
      const w = g.clientWidth, h = g.clientHeight, n = Math.max(8, Math.round(w / 58));
      const len = path.getTotalLength();
      box.replaceChildren(...Array.from({ length: n }, (_, i) => {
        const pt = path.getPointAtLength(((i + .5) / n) * len);
        const b = document.createElement('i');
        b.style.left = `${(pt.x / 1000) * w}px`; b.style.top = `${(pt.y / 60) * h}px`;
        b.style.setProperty('--i', i);
        return b;
      }));
    };
    new ResizeObserver(lay).observe(g);
  });
}

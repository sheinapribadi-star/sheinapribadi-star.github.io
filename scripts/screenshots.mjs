// Usage: npm run build && npm run preview & node scripts/screenshots.mjs [baseUrl]
import { chromium } from 'playwright-core';
const BASE = process.argv[2] || 'http://localhost:4174/';
const OUT = process.env.OUT || new URL('../screenshots/', import.meta.url).pathname;
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const errors = [], origins = new Set();
let cookieCount = 0;
async function open(viewport, { mobile = false, dsf = 2, query = '', scheme = 'light', motion = 'no-preference' } = {}) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: dsf, isMobile: mobile, hasTouch: mobile, colorScheme: scheme, reducedMotion: motion });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push(e.message));
  p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  p.on('requestfailed', (r) => errors.push('failed ' + r.url()));
  p.on('response', (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));
  p.on('request', (r) => origins.add(new URL(r.url()).origin));
  await p.goto(BASE + query, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.evaluate(async () => { document.querySelectorAll('img[loading=lazy]').forEach((i) => (i.loading = 'eager')); await Promise.all([...document.images].map((i) => i.decode().catch(() => {}))); });
  await p.waitForTimeout(700);
  p.ctx = ctx;
  return p;
}
const pinLength = (p) => p.evaluate(() => { const s = document.querySelector('.pin-spacer'); return s ? s.offsetHeight - innerHeight : 0; });
const film = async (p, f) => { const L = await pinLength(p); await p.evaluate((y) => scrollTo(0, y), Math.round(L * f)); await p.waitForTimeout(1500); };
const toTheater = async (p) => { await film(p, .05); await p.click('.cinema__skip'); await p.waitForTimeout(1400); };
const toStage = async (p) => { await p.evaluate(() => { const s = document.querySelector('.snack__stage'); scrollTo(0, s.getBoundingClientRect().top + scrollY - (innerHeight - Math.min(innerHeight, s.offsetHeight)) / 2 - 20); }); await p.waitForTimeout(900); };
const hold = async (p, sel, ms) => { const b = await p.locator(sel).boundingBox(); await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await p.mouse.down(); await p.waitForTimeout(ms); };
const tapAll = async (p) => { for (const f of ['cherry', 'sky', 'butter', 'mint']) await p.click(`.tap[data-f="${f}"]`); await p.waitForTimeout(7200); };

/* ---------------- desktop: the film ---------------- */
let p = await open({ width: 1440, height: 900 });
for (const [f, name] of [[0, 'cine-01-ticket'], [.15, 'cine-02-countdown'], [.4, 'cine-03-starring'], [.6, 'cine-04-credits-roll'], [.73, 'cine-05-featuring'], [.84, 'cine-06-introducing'], [.925, 'cine-07-zoom-out']]) {
  await film(p, f); await p.screenshot({ path: OUT + name + '.png' });
}
await film(p, 1); await p.waitForTimeout(600);
await p.screenshot({ path: OUT + 'theater-seats.png' });
await p.hover('[data-play="p04"]'); await p.waitForTimeout(500);
await p.screenshot({ path: OUT + 'theater-seat-hover.png' });
await p.click('[data-play="aqe"]'); await p.waitForTimeout(1000);
await p.screenshot({ path: OUT + 'theater-seat-open-feature.png' });
await p.click('[data-play="p04"]'); await p.waitForTimeout(1000);
await p.screenshot({ path: OUT + 'theater-seat-open-matchup.png' });
await p.click('[data-play="p03"]'); await p.waitForTimeout(1000);
await p.screenshot({ path: OUT + 'theater-seat-open-berkeleytime.png' });
await p.click('[data-play="p08"]'); await p.waitForTimeout(1000);
await p.screenshot({ path: OUT + 'theater-seat-open-ace.png' });
await toStage(p);
await p.screenshot({ path: OUT + 'snack-bar.png' });
await hold(p, '.pm__pop', 900);
await p.screenshot({ path: OUT + 'snack-popcorn-mid-pop.png' });
await p.waitForTimeout(1200); await p.mouse.up();
await p.click('.pm__hatch'); await p.waitForTimeout(400);
await tapAll(p);
await p.screenshot({ path: OUT + 'snack-slushy-filled.png' });
cookieCount += (await p.ctx.cookies()).length;

/* ---------------- desktop: the quick read (existing sections) ---------------- */
p = await open({ width: 1440, height: 900 }, { query: '?nointro' });
const unstick = (pg) => pg.addStyleTag({ content: '.topbar{position:relative !important}' });
await p.locator('#lobby').scrollIntoViewIfNeeded(); await p.evaluate(() => scrollTo(0, document.querySelector('#lobby').offsetTop - 60)); await p.waitForTimeout(400);
await p.screenshot({ path: OUT + 'desktop-lobby.png' });
await unstick(p);
await p.locator('.opening').screenshot({ path: OUT + 'static-credits-fallback.png' });
await p.locator('#box-office').scrollIntoViewIfNeeded(); await p.waitForTimeout(700);
await p.locator('#box-office').screenshot({ path: OUT + 'desktop-box-office-counting.png' });
await p.waitForTimeout(2600);
await p.locator('#box-office').screenshot({ path: OUT + 'desktop-box-office.png' });
await p.locator('#now-showing').screenshot({ path: OUT + 'desktop-projects.png' });
await p.locator('.poster').nth(1).locator('.poster__flip').click(); await p.waitForTimeout(1000);
await p.locator('#repertory').screenshot({ path: OUT + 'desktop-repertory-flipped.png' });
await p.locator('.poster').nth(1).locator('.poster__unflip').click(); await p.waitForTimeout(900);
await p.locator('#filmography').screenshot({ path: OUT + 'desktop-showtimes-tickets.png' });
await p.locator('#awards').screenshot({ path: OUT + 'desktop-laurels.png' });
await p.locator('#casting').scrollIntoViewIfNeeded(); await p.waitForTimeout(1800);
await p.locator('#casting').screenshot({ path: OUT + 'desktop-casting-sheet.png' });
await p.locator('.specs').screenshot({ path: OUT + 'desktop-tech-specs.png' });
await p.locator('#casting').scrollIntoViewIfNeeded(); await p.waitForTimeout(2200);
await p.locator('#casting').screenshot({ path: OUT + 'desktop-casting-sheet.png' });
await p.locator('.trait').nth(1).click(); await p.waitForTimeout(900);
await p.locator('.cast__test').screenshot({ path: OUT + 'desktop-casting-trait-picked.png' });
await p.locator('.proud').screenshot({ path: OUT + 'desktop-proudest-moment.png' });
await p.locator('#concessions').screenshot({ path: OUT + 'desktop-contact.png' });
await p.locator('.credits').screenshot({ path: OUT + 'desktop-credits.png' });
await p.evaluate(() => scrollTo(0, document.querySelector('#lobby').offsetTop - 60));
await p.click('.lights'); await p.waitForTimeout(800);
await p.screenshot({ path: OUT + 'dark-lobby.png' });
await p.locator('#now-showing').screenshot({ path: OUT + 'dark-projects.png' });
await p.locator('#concessions').screenshot({ path: OUT + 'dark-contact.png' });
await p.locator('#box-office').screenshot({ path: OUT + 'dark-box-office.png' });
await p.locator('#filmography').screenshot({ path: OUT + 'dark-experience.png' });
await p.locator('#casting').screenshot({ path: OUT + 'dark-casting-sheet.png' });
cookieCount += (await p.ctx.cookies()).length;

// full pages at 1x (Chrome can't paint captures taller than ~16k device px); static fallback layout
p = await open({ width: 1440, height: 900 }, { dsf: 1, query: '?nointro' });
await p.screenshot({ path: OUT + 'desktop-full.png', fullPage: true });
p = await open({ width: 390, height: 844 }, { mobile: true, dsf: 1, query: '?nointro' });
await p.screenshot({ path: OUT + 'mobile-full.png', fullPage: true });

// reduced motion: static credits + instant seat swap
p = await open({ width: 1440, height: 900 }, { motion: 'reduce' });
await p.evaluate(() => document.querySelector('#theater').scrollIntoView()); await p.click('[data-play="cookie-lens"]'); await p.waitForTimeout(300);
await p.screenshot({ path: OUT + 'reduced-motion-theater.png' });

/* ---------------- mobile ---------------- */
p = await open({ width: 390, height: 844 }, { mobile: true });
await film(p, 0); await p.screenshot({ path: OUT + 'mobile-cine-ticket.png' });
await film(p, .4); await p.screenshot({ path: OUT + 'mobile-cine-starring.png' });
await film(p, .6); await p.screenshot({ path: OUT + 'mobile-cine-credits-roll.png' });
await film(p, .925); await p.screenshot({ path: OUT + 'mobile-cine-zoom-out.png' });
await film(p, 1); await p.waitForTimeout(500); await p.screenshot({ path: OUT + 'mobile-theater-seats.png' });
await p.tap('[data-play="p03"]'); await p.waitForTimeout(1200);
await p.screenshot({ path: OUT + 'mobile-seat-open.png' });
await p.evaluate(() => scrollTo(0, document.querySelector('.unit--pop').getBoundingClientRect().top + scrollY - 120)); await p.waitForTimeout(800);
for (let i = 0; i < 4; i++) { await p.tap('.pm__pop'); await p.waitForTimeout(140); }
await p.waitForTimeout(250);
await p.screenshot({ path: OUT + 'mobile-popcorn.png' });
await p.evaluate(() => scrollTo(0, document.querySelector('.unit--slush').getBoundingClientRect().top + scrollY - 40)); await p.waitForTimeout(500);
await tapAll(p);
await p.screenshot({ path: OUT + 'mobile-slushy-filled.png' });
await p.evaluate(() => scrollTo(0, document.querySelector('#lobby').offsetTop - 60)); await p.waitForTimeout(600);
await p.screenshot({ path: OUT + 'mobile-lobby.png' });
await p.evaluate(() => scrollTo(0, document.querySelector('#casting').offsetTop)); await p.waitForTimeout(2200);
await p.screenshot({ path: OUT + 'mobile-casting-sheet.png' });
await p.evaluate(() => scrollTo(0, document.querySelector('.cast__test').getBoundingClientRect().top + scrollY - 60)); await p.waitForTimeout(500);
await p.screenshot({ path: OUT + 'mobile-casting-test.png' });
cookieCount += (await p.ctx.cookies()).length;

console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no console errors');
console.log('origins requested:', [...origins].join(', '));
console.log('cookies set:', cookieCount);
await browser.close();

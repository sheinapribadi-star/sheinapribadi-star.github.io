// Usage: npm run build && npm run preview & node scripts/screenshots.mjs [baseUrl]
import { chromium } from 'playwright-core';
const BASE = process.argv[2] || 'http://localhost:4174/';
const OUT = new URL('../screenshots/', import.meta.url).pathname;
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const errors = [], origins = new Set();
let cookieCount = 0;
async function open(viewport, { mobile = false, dsf = 2, intro = true, scheme = 'light' } = {}) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: dsf, isMobile: mobile, hasTouch: mobile, colorScheme: scheme });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push(e.message));
  p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  p.on('requestfailed', (r) => errors.push('failed ' + r.url()));
  p.on('request', (r) => origins.add(new URL(r.url()).origin));
  await p.goto(BASE + (intro ? '' : '?nointro'), { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.evaluate(async () => { document.documentElement.style.scrollBehavior = 'auto'; document.querySelectorAll('img[loading=lazy]').forEach((i) => (i.loading = 'eager')); await Promise.all([...document.images].map((i) => i.decode().catch(() => {}))); });
  await p.waitForTimeout(400);
  p.ctx = ctx;
  return p;
}
const tear = async (p) => { await p.click('.intro__stub'); await p.waitForTimeout(1500); await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(200); };
const unstick = (p) => p.addStyleTag({ content: '.topbar{position:relative !important}' });

// full pages at 1x (Chrome can't paint captures taller than ~16k device px)
let p = await open({ width: 1440, height: 900 }, { dsf: 1, intro: false });
await p.screenshot({ path: OUT + 'desktop-full.png', fullPage: true });
await p.click('.lights'); await p.waitForTimeout(800);
await p.screenshot({ path: OUT + 'dark-full.png', fullPage: true });
p = await open({ width: 390, height: 844 }, { mobile: true, dsf: 1, intro: false });
await p.screenshot({ path: OUT + 'mobile-full.png', fullPage: true });

// desktop, with the intro
p = await open({ width: 1440, height: 900 });
await p.screenshot({ path: OUT + 'desktop-intro.png' });
await p.hover('.intro__stub'); await p.mouse.down(); await p.mouse.move(800, 560, { steps: 5 }); await p.waitForTimeout(100);
await p.screenshot({ path: OUT + 'desktop-intro-tearing.png' });
await p.mouse.up(); await p.waitForTimeout(1500); await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(300);
await p.screenshot({ path: OUT + 'desktop-hero.png' });
await p.click('.popcorn__btn'); await p.waitForTimeout(120); await p.click('.popcorn__btn'); await p.waitForTimeout(380);
await p.screenshot({ path: OUT + 'desktop-hero-popcorn.png' });
await p.waitForTimeout(1800);
await unstick(p);
await p.locator('#now-showing').screenshot({ path: OUT + 'desktop-projects.png' });
await p.locator('.poster').nth(1).locator('.poster__flip').click(); await p.waitForTimeout(1000);
await p.locator('#repertory').screenshot({ path: OUT + 'desktop-repertory-flipped.png' });
await p.locator('.poster').nth(1).locator('.poster__unflip').click(); await p.waitForTimeout(900);
await p.locator('#note').screenshot({ path: OUT + 'desktop-note.png' });
await p.locator('#filmography').screenshot({ path: OUT + 'desktop-experience.png' });
await p.locator('#awards').screenshot({ path: OUT + 'desktop-awards.png' });
await p.locator('#behind').screenshot({ path: OUT + 'desktop-about.png' });
await p.locator('#concessions').screenshot({ path: OUT + 'desktop-contact.png' });
await p.locator('.credits').screenshot({ path: OUT + 'desktop-credits.png' });
await p.evaluate(() => window.scrollTo(0, 0));
await p.click('.lights'); await p.waitForTimeout(800);
await p.screenshot({ path: OUT + 'dark-hero.png' });
await p.locator('#now-showing').screenshot({ path: OUT + 'dark-projects.png' });
await p.locator('.poster').nth(3).locator('.poster__flip').click(); await p.waitForTimeout(1000);
await p.locator('#repertory').screenshot({ path: OUT + 'dark-repertory.png' });
await p.locator('#concessions').screenshot({ path: OUT + 'dark-contact.png' });
cookieCount += (await p.ctx.cookies()).length;

p = await open({ width: 1024, height: 800 }, { intro: false });
await p.screenshot({ path: OUT + 'tablet-hero.png' });

p = await open({ width: 390, height: 844 }, { mobile: true });
await p.screenshot({ path: OUT + 'mobile-intro.png' });
await tear(p);
await p.screenshot({ path: OUT + 'mobile-hero.png' });
cookieCount += (await p.ctx.cookies()).length;

console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no console errors');
console.log('origins requested:', [...origins].join(', '));
console.log('cookies set:', cookieCount);
await browser.close();

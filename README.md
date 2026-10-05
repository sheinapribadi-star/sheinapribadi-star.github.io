# sheinapribadi-star.github.io

Sheina Pribadi's personal site, "Sheina's Picture House": her portfolio as a cozy little neighborhood cinema, with
a scroll-driven opening-credits film, a theater where every seat plays a project, a snack bar with a physics popcorn
machine and a slushy machine, then the quick read: chasing marquee bulbs, flip posters and a concession stand. It's a
static Vite build: vanilla JS, plus GSAP + ScrollTrigger (bundled locally and lazy-loaded) for the scroll film. No
backend, no keys, no cookies, and no third-party requests.

```bash
npm install
npm run dev          # local dev server
npm run build        # outputs dist/
npm run preview      # serves dist/ on http://localhost:4174
npm run screenshots  # Playwright + system Chrome, writes screenshots/ (needs preview running; gitignored)
```

Design notes, references and rules are in [DESIGN_BRIEF.md](DESIGN_BRIEF.md). Pushing to `main` deploys to
GitHub Pages via `.github/workflows/pages.yml` (set the Pages source to "GitHub Actions" in the repo settings).

Content lives directly in `index.html`. Images in `public/img/` are WebP, resized from the project screenshots.
Fonts (Shrikhand, Nunito, Caveat) are self-hosted from `src/fonts/` (all SIL OFL). Caveat is subset and instanced at weight 600.
Add `?nointro` to the URL to get the static (no scroll film) layout while developing. `prefers-reduced-motion` gets the same static layout.

### v4.1 (techy pass)
Terminal readout (`projector.log`), scanlines, glitch tweens and velocity-reactive dust in `src/cine.js` / `src/show.css`; box office count-up in `src/main.js`; all Vizzy profile content is now on the page. Screenshots: `node scripts/screenshots.mjs` (needs `npm run build && npm run preview`).

Live at https://sheinapribadi-star.github.io/ (GitHub Pages via `.github/workflows/pages.yml` on push to `main`).

# sheinapribadi-star.github.io

Sheina Pribadi's personal site, "Sheina's Picture House": her portfolio as a cozy little neighborhood cinema, with
a tear-the-ticket intro, chasing marquee bulbs, popcorn, flip posters and a concession stand. It's a static Vite build
with vanilla JS. No backend, no keys, no cookies, and no third-party requests.

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
Add `?nointro` to the URL to skip the ticket intro while developing.

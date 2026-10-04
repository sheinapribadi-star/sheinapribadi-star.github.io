# Design brief: "Sheina's Picture House"

A cozy little neighborhood cinema, the kind with a hand-painted sign, a striped awning over the
concession stand, and someone who knows your name at the box office. The site is Sheina's
portfolio presented as that cinema's program. It should feel **cute, warm and playful**, and also **made by a
person**: hand-drawn doodles, real interactions that reward poking around, and no template look.

## History
- v1 "Airmail Desk" was too close to danicahartawan.work's desk concept.
- v2 "Bioskop Pribadi" (Criterion/A24 repertory program) was too serious, and Sheina wanted all English.
- v3 (this one) keeps the movie theme and makes it charming.

## References and what we borrow
- **Small-town single-screen cinemas** (the Castro in SF, the Rio in Monterey, neighborhood houses
  with letter-board marquees). → Chasing-bulb marquee sign, letter board, "Admit one" ticket.
- **Vintage concession menus and paper popcorn buckets.** → The striped awning, the menu board with
  dotted leaders, and a striped bucket.
- **Hand-lettered indie zines and riso posters.** → Flat colour fields, chunky outlines, doodles with a
  slight wobble, and posters that are typographic rather than stock photos.

## Rules
- **Palette: warm and soft, with no purple and no gradients.** House lights up: cream `#FFF5E4`, paper
  `#FFFBF3`, cocoa ink `#3B2626`, muted `#76574F`, **cherry `#B8293F`** (accent and links), rose `#F6C1C4`,
  butter `#FFD66E`, sky `#BFDDF2`, mint `#CFE8D2`. House lights down: cocoa `#211819`, ink `#FBEFE0`,
  cherry lifts to `#FF8FA0`, and the pastels deepen. Every text pair passes AA. Pastels are only used as
  backgrounds, never as text on cream.
- **Type: one characterful face, one friendly face, one hand.** **Shrikhand** (a fat, retro italic
  display face) for the marquee, titles and posters. **Nunito** (rounded sans, variable) for everything you read.
  **Caveat** (handwriting, one subset static weight) only for little margin notes like "psst, click me".
- **Shapes: flat and outlined, never shadowy.** Cards have a 2px cocoa outline, a big radius, and a *hard*
  offset shadow in a pastel (`6px 6px 0`), like a sticker. No blurred drop shadows, glassmorphism or
  gradient blobs.
- **Doodles: hand-drawn and sparing.** Line doodles (sparkles, a popcorn bucket, a squiggle arrow, and one
  small icon per repertory poster) run through a gentle SVG displacement "wobble" filter so they
  don't look vector-perfect. No emoji used as icons, and no clip-art film reels or clapperboards.
- **Voice.** Sheina's own words, short and warm. The cinema language stays in labels and microcopy
  ("Now showing", "Tear to enter", "Concession stand"). The facts are unchanged and nothing is invented.

## Interactions (all keyboard-accessible, all calm under `prefers-reduced-motion`)
1. **Tear-the-ticket intro.** On the first visit in a session, an "Admit one" ticket covers the page. Click,
   press Enter, or drag the stub to tear it off and walk in. "Skip" and Escape also work. While it's open
   the site behind is `inert`. It's never shown without JS, and with reduced motion it simply fades.
2. **Chasing-bulb marquee.** The hero sign is ringed with bulbs generated to fit its size, with a
   three-phase chase. Under reduced motion they stay lit and steady.
3. **Popcorn.** The hand-drawn bucket in the hero is a button. Each click pops a handful of kernels that
   arc up and tumble down, and a little counter keeps score.
4. **Flip posters on a film strip.** The repertory is a horizontal film strip (scroll-snap, sprocket
   holes, prev/next buttons). Each poster flips over to show the details and links. Focus moves to the
   back and the hidden face is `inert`. Under reduced motion it crossfades instead of rotating.
5. **House lights.** A pull-switch toggles light and dark ("house lights up / down"). It follows the
   OS setting on first visit and is remembered in localStorage, never cookies.
6. **Concession stand.** Contact is a menu board under a striped awning. Items are "priced" *free*, and
   there's a copy-email button that says thanks.
7. **Hover delight.** Nav links get a hand-drawn squiggle underline, posters wiggle, tickets lift, and
   filmography rows grow a sparkle.

## Layout
Intro ticket → topbar (logo, nav, house lights) → hero marquee sign + popcorn + "Tonight's double
feature" letter board → Director's note + Currently in production → Now showing (two features,
with stills, chips and ticket links) → Repertory reel (film strip of 7 flip posters) → Filmography
(showtimes list) → Awards season (laurels), Schooling, Reviews → Behind the scenes (photo,
about, favorite quote, ticket stub) → Concession stand (contact) → end credits.

## Craft bar
Static Vite build with vanilla JS (~5 KB, no libraries). Fonts are self-hosted woff2 (~140 KB total, with
Caveat subset and instanced). WebP stills use srcset and lazy loading. No third-party requests and no cookies.
Semantic landmarks, skip link, visible focus rings, alt text, AA contrast in both lighting states, and
responsive from 360px up.

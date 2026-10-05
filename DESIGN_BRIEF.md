# Design brief: "Sheina's Picture House"

A cozy little neighborhood cinema, the kind with a hand-painted sign, a striped awning over the
concession stand, and someone who knows your name at the box office. The site is Sheina's
portfolio presented as that cinema's program. It should feel **cute, warm and playful**, and also **made by a
person**: hand-drawn doodles, real interactions that reward poking around, and no template look.

## History
- v1 "Airmail Desk" was too close to danicahartawan.work's desk concept.
- v2 "Bioskop Pribadi" (Criterion/A24 repertory program) was too serious, and Sheina wanted all English.
- v3 kept the movie theme and made it charming.
- v4 (this one) adds Sheina's expanded vision on top of v3: a dramatic, scroll-driven opening (like the
  lights going down at a real cinema), a camera pull-back into a seated theater where every seat plays a
  project, and an interactive snack bar. The v3 sections stay below as the quick, recruiter-friendly read.

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

## The show (v4): opening credits → theater → snack bar
The cinema interior is always dark (warm cocoa `#1C1214`, never purple) with cherry curtains, butter
brass, string lights and sconces. Outlines are a near-black `#140B0D`, like an inked cartoon.
- **Opening credits (scroll-driven, pinned; GSAP + ScrollTrigger, self-hosted and lazy-loaded).** The
  "Admit one" ticket is folded into the first frame: scrolling, clicking or pressing Enter tears the stub
  away. Then a countdown leader (3, 2, 1, sweep hand) with a flash, then "Sheina's Picture House proudly
  presents", her name popping in letter by letter with doodle sparkles, "filmed on location at UC
  Berkeley", an upward credits roll of her real roles, a "featuring" cascade of her nine project titles,
  and "and introducing you, in the good seats". Ambient motion throughout: a projector beam, dust motes
  drifting in the light (canvas), film grain, flickering scratches, running sprocket holes, a spinning reel.
  A fixed **Skip intro** button is always there, and the topbar tucks away until the lobby.
- **The pull-back.** The last credit is already on the cinema screen. The camera pulls back (a scaled
  transform on the theater, glued to the screen), revealing the curtains, stage lip and seats. Then the
  screen "lights up" to "Pick a seat, any seat".
- **Every seat is a project.** Nine seats in three rows (the two features are the premiere seats in the
  front row; the repertory fills the rest; dim decorative seats fill the edges, one with a popcorn bucket
  left on it). Hover or focus: the seat wiggles, tips back, glows and shows a tag. Click: the project
  plays on the big screen with a projector flicker (still or poster doodle, kicker, title, description,
  links, and a link to the quick read). Content is read from the readable sections, so there's one source
  of truth. Arrow keys walk between seats, Escape clears the screen, and the screen is a polite live region.
- **The snack bar.** A popcorn machine with tiny hand-rolled 2D physics on a canvas (no physics library):
  press and hold **Pop!** or drag the crank and kernels pop out of the tilting kettle, bounce, pile up, and
  can be poked and flicked. **Open the hatch** and they spill down into a striped bucket on the counter.
  The loop sleeps when everything settles and pauses offscreen. A slushy machine with four churning
  bowls (Cherry Bomb, Blue Sky, Lemon Butter, Mint Condition): pull a lever and the cup slides under the
  nozzle, a stream pours, and a swirly layer fills with bobbing ice. Each flavor prints a receipt with
  contact info or a real fun fact. Four layers earns a lid, a straw and a "Drink up!" button.
- **Reduced motion / no JS.** No pinning and no GSAP download: the credits render as a static, readable
  credits page above a static theater. Seats swap instantly, popcorn settles instantly, and slushies fill
  without pouring.

## Interactions in the quick read (all keyboard-accessible, all calm under `prefers-reduced-motion`)
1. **Ticket.** (Moved into the opening credits in v4.)
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
Opening credits (pinned scroll film) → theater with seats → snack bar (popcorn + slushies) → "Lights up!"
scalloped edge into the cream lobby → topbar (logo, nav, house lights) → hero marquee sign + popcorn + "Tonight's double
feature" letter board → Director's note + Currently in production → Now showing (two features,
with stills, chips and ticket links) → Repertory reel (film strip of 7 flip posters) → Filmography
(showtimes list) → Awards season (laurels), Schooling, Reviews → Behind the scenes (photo,
about, favorite quote, ticket stub) → Concession stand (contact) → end credits.

## Craft bar
Static Vite build. The quick read and the theater/snack bar are vanilla JS (~22 KB). The scroll film uses GSAP
+ ScrollTrigger (free, bundled locally, ~47 KB gzipped), lazy-loaded only when motion is welcome. Only
transforms and opacity animate. No blend modes, because they halved the frame rate in testing. Canvas loops sleep when idle or offscreen. Fonts are self-hosted woff2 (~140 KB total, with
Caveat subset and instanced). WebP stills use srcset and lazy loading. No third-party requests and no cookies.
Semantic landmarks, skip link, visible focus rings, alt text, AA contrast in both lighting states, and
responsive from 360px up.

## v4.1 addendum: vintage cinema meets tech

- **projector.log terminal** in the corner of the opening credits: one monospace line per film beat (load reel, countdown, cast, location, roles, featuring, zoom), revealed by scroll progress and rewound when you scroll back.
- **CRT scanlines + film grain + chromatic glitch:** a scanline overlay on the credits; title cards enter with a stepped RGB-split (`--gx`) glitch tween.
- **Dust particles react to scroll velocity:** they speed up and brighten in the projector beam when you scroll fast, then settle.
- **Screen readouts:** the idle screen shows `> projector ready · 9 reels loaded · awaiting seat_`, and each opened seat prints `▶ playing · seat B3 · neurowake.reel`.
- **Box office:** an LED board of real figures only, counting up when scrolled into view (static HTML shows the final values; no count-up under reduced motion), plus a ticker of more real numbers and a data bar for the Global RISE top 0.7%.
- **Snack bar receipts** are numbered (`order #001`).
- **Replaces the Vizzy profile:** full experience bullets (Cloudflare, WorkWhile, Energy Institute, Perplexity, Deloitte, Venture Strategy Solutions, URAP), all 7 projects and links, both degrees, honors, press, the proudest-moment card (BU $50K Top 3), the Readwise card, and a `sheina --specs` terminal card with skills, languages, interests and pronouns. Phone and GPA are deliberately left out; personality results appear in the casting sheet at her request.

## v4.2 (ship)
- **Casting sheet** (`#casting`): her Clarity 4D character profile staged as a casting file (archetype "A trusted and tactful trouble-shooter", a "Cast!" stamp) next to a `screen_test.log` terminal with a radar chart and four trait bars (96 / 61 / 54 / 50%) that fill on scroll. Tap a trait to spotlight it in the readout. Real numbers only.
- Deloitte copy: M&A deals in Indonesia, no USD-size claims. Berkeleytime links to berkeleytime.com wherever it is named, and it has its own Filmography entry (Aug 2026 – now).
- Perf: scanlines moved under the content (no full-screen overlay); grain layer shrunk and composited.

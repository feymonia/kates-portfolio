# Portfolio design system

One token layer (`design-system.css`) + components that consume it (`styles.css`).
Rule: no raw hex, font-size, weight, line-height or letter-spacing in component CSS.

Load order in `index.html`: `design-system.css` → `styles.css`.

Everything below is the Figma UI kit, section `UI Kit` (node `177:37824`),
drawn on a **1440** artboard. Four text styles, one tag in three states.

## Color

Two locked anchors — the page background and the heading tone. The warm
neutral axis runs between them; the Direct blues are the one hue allowed off
that axis, and they belong to the product.

| Token | Value | Use |
| --- | --- | --- |
| `--color-background-primary` | `#F3EFEA` | page background — **locked** |
| `--color-surface-primary` | `#FFFFFF` | plates: cards, availability pill — **locked** |
| `--color-surface-dark` | `#3A2F2F` | dark stages |
| `--color-text-primary` | `#4D3F3F` | headings, primary copy — **locked** |
| `--color-text-secondary` | `#776B6A` | body, navigation, metadata |
| `--color-text-muted` | → secondary | alias, see below |
| `--color-text-on-dark` | `#F6F2ED` | text on dark surfaces |
| `--color-border-default` | `#E2DCD4` | rules, dividers, chip borders |
| `--color-accent-primary` | `#5F5150` | hover underline, small details |
| `--color-accent-brand` | `#498BFF` | case tag text, Overdraft stage |
| `--color-accent-brand-surface` | `#E1EBFE` | plate under a case tag |
| `--color-accent-brand-border` | `#C7DBFF` | edge of a case tag |
| `--color-accent-brand-deep` | `#1247A5` | the "currently working at" tag, and nothing else |
| `--color-accent-brand-bright` | `#3782FF` | the employer's name in the meta line |
| `--color-text-meta` | `#A89C8F` | the meta line's words |
| `--color-text-meta-rule` | `#D2C8BB` | the slashes between them |
| `--color-status-positive` | `#14B61D` | availability dot |

The kit collapsed secondary and muted into one tone, so `--color-text-muted`
is now an alias. It is kept rather than deleted so a future kit can part the
two again without touching a component.

Two Direct blues, two jobs: the light pair (`brand` on `brand-surface` inside
`brand-border`) carries a case metric and may repeat; the deep one carries the
product itself and appears exactly once on the page. Neither is a text or
border colour anywhere else.

Contrast, measured against what each colour actually sits on:

| Pair | Ratio | WCAG AA |
| --- | --- | --- |
| `text-primary` on the page | 8.74:1 | passes |
| white on `brand-deep` (the Direct tag) | 8.50:1 | passes |
| `text-secondary` on a white card | 5.13:1 | passes |
| `text-secondary` on the page | 4.48:1 | two hundredths short of 4.5 |
| `brand-bright` on the hero haze | 3.33:1 | fails body, passes large text |
| `brand` on `brand-surface` (case tag) | 2.73:1 | fails |
| `text-meta` on the hero haze | 2.47:1 | fails |

`text-secondary` is the kit's one real divergence: the kit draws `#998E80`,
which reads 2.81:1 on the page, and the code takes it back to `#776B6A` on
the designer's call. That covers the navigation, the hero subtitle, the
captions and the footer — most of the running text — and it lands a hair
under the threshold rather than well under it.

What still fails is the small, light type that was never going to clear it:
the meta line at 12px and the case tags. The slashes in the meta line read
1.52:1 and that is fine — they are punctuation, and nothing is lost if they
fade.

### Controls over imagery

The slider dots are their own component — see below. The stage cursor comes
from the Figma frame `172:19127`:
`--size-control-cursor` 64px disc, a white arrow
`--size-control-cursor-arrow-w/h` 20 × 14 at stroke 2.

`--color-control-cursor` points at `--color-text-primary` — the heading
tone. It used to carry a cool near-black of its own; it was changed on
2026-10-04 so that the one control riding over imagery is still written in
the site's own ink. The white arrow sits on it at 10:1, and the disc reads
at 7.9:1 on the lightest stage it ever lands on.

Both controls keep their nominal size at every width: they are held by the
pointer, not by the layout, so they never take `--type-scale`.

## Typography

Two families: **Instrument Serif** (narrative) and **Inter** (information).
Four styles, named as the kit names them — two serif, two sans, nothing in
between and no third size of either. Every sans style is Medium; Instrument
Serif has one weight.

| Style | Family | Size / line | Weight | Tracking | Used for |
| --- | --- | --- | --- | --- | --- |
| H1 | Instrument Serif | 60 / 60 | 400 | −2.5% | hero statement, section titles |
| H2 | Instrument Serif | 48 / 56 | 400 | −2.5% | in-page statements, one step under H1 |
| Body | Inter | 18 / 30 | 500 | −1% | hero subtitle, descriptions, links, name/logo (serif italic at this size) |
| Label | Inter | 14 / 16 | 500 | −1% | navigation, tags, controls |
| Meta | Inter | 12 / 16 | 500 | **+10%** | the one line above the hero statement |

One heading sits outside the table. The kit draws "And other projects…"
(`218:49197`) at 64 / 64 while every other section title is H1's 60 / 60, so
`.other-projects__title` carries the size on itself. Four points between two
sibling headings may well be a slip rather than a decision — it is one
declaration either way.

Meta is the only style that opens up instead of tightening: it is read as a
row of facts, not as a sentence. It is also the only upper-case style, and the
case comes from CSS — the words are written normally in the markup so a screen
reader still hears words rather than letters.

Each style exists three ways:

- raw tokens — `--font-size-h1`, `--line-height-h1`, `--tracking-h1`
- composite `font` shorthand — `--type-h1` (pair with the matching `--tracking-*`)
- utility class — `.type-h1` (scale-aware, preferred in new markup)

Only the cuts the kit uses are loaded: Instrument Serif upright and italic,
Inter Medium. A weight that is not in the table is not in the webfont either.

### Optical scaling

The serif is drawn at the kit's 1440 artboard and shrinks below it with
`--display-scale: clamp(0.5, 100vw / 1440px, 1)`. Any block can override
`--type-scale` to scale every `.type-*` rule inside it. Body and label are
read rather than looked at — they keep their nominal size at every width and
never take the scale.

### Italics

Italic words inside a serif headline use Instrument Serif Italic at the same
size, line-height and tracking as the surrounding text — the `em` rules inherit
all three, so an italic can never introduce a new size.

## Layout

The kit is drawn on a 1440 page. Sections run `--width-content` 1376 wide,
so the 32px gutter is what is left over — not padding added on top of the
column. Every container uses the same expression, and there is only one:

```css
width: min(100% - 2 * var(--page-gutter), var(--width-content));
margin: 0 auto;
```

The hero column is narrower than a section: `--width-hero` 1292, with the
statement itself capped at `--width-hero-title` 856 so it breaks in two lines
the way the kit breaks it.

## Components

### Tag

Figma component `Tag` (`177:38341`), three states. They share a height (24),
a radius (900) and the Label style — only the palette and the leading icon
change, so a state is a colour decision and never a size.

| Class | Kit | Fill / border / text | Where |
| --- | --- | --- | --- |
| `.tag--neutral` | State 02 | `#F3EFEA` / none / secondary | every project card |
| `.tag--brand` | State 01 | `#1247A5` / `rgba(0,0,0,.2)` / white | the product, with the 16px Direct mark |
| `.tag--case` | State 03 | `#E1EBFE` / none / `#498BFF` | nothing today — see below |
| `.tag--mark` | State `-` | the mark itself, `#FC3F1D` | opens the row on every project built at Yandex |
| `.tag--studio` | State4 | `#4D3F3F` / none / a 31 × 12 wordmark | opens the row on the two cases built at the studio |

`.tag--mark` and `.tag--studio` both say who built the thing, and they say it
differently because the marks are shaped differently. Yandex signs with a square
glyph, so the glyph is the whole tag; the studio signs with a wordmark, so it
keeps the plate and the 12 of padding a chip has.

Only State 01 still carries a ring. The kit dropped the border from States 02
and 03 (`230:41143`), and the cards moved from the blue tag to the quiet one
with it, so `.tag--case` is defined and unused: the kit still draws the state,
and the page no longer wears it.

`.tag--mark` is the one tag that is not a chip: the 24px Yandex mark *is* the
tag, so it carries no plate and no ring. Its `alt` says "Yandex", because
which company a project was built at is content, not decoration.

`.tag--brand` carries a leading icon and gives up 8px of its left padding to
it (4 instead of 12), which is why the mark sits closer to the edge than the
text does on the right.

State 01's ring is drawn as an inset shadow, not a border. Figma strokes inside
the padding box, so a real border would push the tag 2px wider than it is
drawn — the widths land within 1px of the kit with the shadow, and were
consistently 1.5px over with a border.

One open discrepancy: the kit sets State 02's label in `#998E80`, and the code
sets it in `--color-text-secondary` `#776B6A`. That is the same divergence as
the body text, for the same reason — `#998E80` reads about 2.6:1 on the tag's
own `#F3EFEA` plate, well under the 4.5:1 a 14px label needs. The darker tone
clears it. It is one declaration if that call is wrong.

### Stage note

A handwritten aside pointing at something inside a frame — Figma `236:43198`.
It is the only place a third family appears: **Caveat** 28/24, `−2%`, in
`--color-ink-annotation` `#768CB7`, with a drawn arrow (`annotation-arrow.svg`)
leaving where the writing ends.

The family and the ink are listed with the media tokens rather than with the
type scale on purpose. A note is written *on* the imagery, the way a stage
colour is part of the imagery — it is not a fifth UI style, and nothing
outside a stage may use it.

Two placements, both written to the same 240 measure:

| Modifier | Where | Used for |
| --- | --- | --- |
| `--aside` | left of the frame, bottom-anchored, with the arrow | pointing at one thing inside a frame |
| `--label` | centred over the frame, bottom-anchored | naming the whole slide, as `Before` does |

Every number is a share of the stage width in `cqw`, against a
`container-type: inline-size` on the stage. That is what makes the note ride
its frame: at 1344 it lands on the kit's own 76 / 373 / 240, and it still
lands on them when the card is 311 wide. Both placements are anchored by
their bottom, so the arrow starts where the writing ends whatever the text
wraps to.

One consequence worth knowing: on a phone the stage is about a quarter of the
drawn width, so the note renders at about 6px and stops being readable. The
kit draws this screen only at 1440, so there is no answer in it — if the note
matters on mobile it needs either its own size below some width, or to be
dropped there.

### Slider dots

Figma component `Frame 2136139698` (`18:46588`), two variants. Both carry the
same white dots; only the pill changes, and it changes to stay legible on what
it sits under. Built by `slider.js`, never written by hand.

| | Pill | Token | Used on |
| --- | --- | --- | --- |
| Variant2 | `rgba(0,0,0,.15)` | `--color-control-pill-on-light` | default — light imagery |
| Default | `rgba(255,255,255,.2)` | `--color-control-pill-on-dark` | `.slider--on-dark`, dark frames |
| 2136139699 | `rgba(153,142,128,.6)` | `--color-control-pill-on-page` | the hero, where the dots sit on the page rather than on imagery |

Dot `--size-control-dot` 6px, `--gap-control-dot` 4, `--padding-control-pill`
9/12, radius 900 — three dots make the pill 50 × 24. Inactive
`--color-control-dot` `rgba(255,255,255,.5)`, active `#FFFFFF`. The pill sits
`--offset-control-pill` above the stage floor: 40 at the drawn size, shrinking
with the stage.

The kit's variant names read backwards for this site: its *Default* is the
white pill, but most stages here are light, so the dark pill is the CSS
default and `.slider--on-dark` opts into the white one. The tokens keep the
kit's meaning — on-light, on-dark — rather than its variant numbering.

`--size-control-pill-height` exists so a stage that has to keep a tall frame
clear of the dots can reserve the pill's band from the component's own height
instead of a number copied by hand.

### Oversized shot

A frame larger than the stage it sits on, cropped by it — Figma `230:41143`.
The app shot is a photograph with the phone already in it, so the stage places
it rather than composing it: 1455 × 1091 at (−111, −180) on a 1344 × 750 stage,
flush with the right edge and hanging off the other three.

Two rules make the crop survive a narrowing card. Every number is a share of the
stage width in `cqw`, so the frame rides the stage instead of drifting across
it. And only the width is written: the height comes from the file's own ratio,
because a second number here can drift from the first and skew the photograph.

### State stack

A frame whose point is a count rather than a picture: `[data-states]` holds one
screen in all its states, stacked on the spot, and `slider.js` cross-fades
through them. Every state is absolutely centred, so a taller one can never push
the stage or make it jump.

| | Value | Why |
| --- | --- | --- |
| hold | 1000ms | brisk enough to read as *many*, not as one picture hesitating |
| cross-fade | 300ms | a change, not a transition one waits out |

It runs only while its frame is on stage **and** the stage is on screen, like a
video. Pointing at the picture holds it — the state stays, and the cursor
leaving carries on from there rather than restarting the sequence. The hold is
on the states themselves, not the frame around them: only the state showing
takes the pointer, so reading the card or aiming for an edge zone never stops
it, and a click still pages. A finger cannot hover, so touch is ignored.

Asked for less motion, the cycle never starts and the first state simply stays.

### ProjectCard

The one card every case on the page is built from — Figma component
`Property 1=Default` (node `16:2`). Canonical markup:
[`components/project-card.html`](components/project-card.html); styles live in
the `ProjectCard` section of `styles.css`.

Anatomy, always in this order:

| Part | Style | Notes |
| --- | --- | --- |
| `__stage` | — | media, locked to `--ratio-card-stage` 1344 : 750 |
| `__caption` | — | 8px inset, one 8px gap down the column |
| `__tags` | `.tag--case`, 6 apart | any number, they wrap |
| `__title` | 44 / 44, its own size | `<em>` marks the italic words |
| `__description` | Body | one line per card, on every card since 14.10.2026 (hidden in the Figma component) |

The title is the one place a role does not point at a style. It used to be H2.
On 2026-09-30 the card (`177:26342`) moved to 44 set solid while the kit's H2
style stayed at 48/56, so the two parted and the role carries its own numbers
until they are one again. Worth resolving: either the kit's H2 should follow
the card down to 44/44, or the card is no longer an H2 at all and the style
needs a name.

Tags are 6 apart here and 4 apart in the hero. That is two decisions, so it
is two tokens: `--space-card-tag-gap` and `--space-tag-gap`.

Stage variants: none (warm backdrop, image cropped to fill), `--light` (pale
backdrop, image inset), `--overdraft` (brand-blue backdrop, image inset, dots
held clear of a tall frame), `--loyalty` (tinted plate, cut-out frames inset,
and a container so a note can be written over them). Add `slider--on-dark` for
light dots over dark frames.

A slide can also overrule the stage. `--screenshot` gives one slide its own
pale plate and floats a screenshot on it at a drawn size, with a radius and a
shadow, instead of letting a frame fill the stage — that is how the `Before`
slide sits among four that do fill it.

The slider needs no configuration: one `.slide` renders a static card, two or
more and `slider.js` builds the dots itself.

A frame can be a `<video>` instead of a picture — same `.project-card__ui`
class, so it takes the stage's fit and inset like any other frame. It runs
only while it is the frame on stage **and** the card is on screen; leave the
slide or scroll the card away and it pauses where it was, rather than
decoding video nobody is looking at. Mark it up `muted loop playsinline
preload="metadata"` and leave the playing to `slider.js`. Someone who asks
for less motion gets it stopped and the controls handed over instead of a
still they cannot start.

On a stage with two frames or more the pointer becomes the control. The native
cursor gives way to the 64px disc, which follows the pointer and turns its
arrow at the zone under it: right forward, left back — the same zones a click
uses, read from the same function, so the arrow can never promise a direction
the click won't take. It is built only behind `(hover: hover) and (pointer:
fine)`, so touch and coarse pointers keep the cursor they had and lose
nothing; a static card is never touched.

How wide a zone is comes from **`--slider-edge`**, a share of the width. It
defaults to `.5` — two halves meeting in the middle, which is what a card
wants, where every pixel should navigate. A stage with something to read or
click in the middle sets it lower: the hero uses `.22`, leaving the middle 56%
inert, where the disc hides, the native cursor comes back and a click does
nothing. A click that lands on a link or a button never navigates either,
whatever zone it is in.

Every card differs by its content alone. A rule for a single project does not
belong in the component — if a case needs something the card can't express,
the card gains a variant.

### Navigation

Figma frame `200:94687`. The bar is 80 tall and holds a 40px row: the
portrait and the wordmark at the left edge, the links centred **on the page**,
the availability pill at the right edge.

Three items on `space-between`, and nothing cleverer. The links look as though
they sit a few pixels left of the page centre, and they do — but that falls
out of the arithmetic, not out of a nudge: 1376 − 175 − 287 − 187 = 727, half
of it 363.5, and 32 + 175 + 363.5 is exactly where the frame puts them. The
same sum lands on the 1640 frame's 670.5. Nothing here is centred on purpose.

The bar carries **no fill**. It stands on the hero's own haze, with one rule
along the bottom, drawn always rather than on scroll. That is also why it is
not sticky: with nothing to hide behind, a bar that stayed put would have the
cards sliding under its text.

The wordmark has a size the scale does not carry — 18/40, its own token, the
40 being the height of the portrait it stands beside.

What the bar drops as it narrows, in order: the three non-CV links at 960, the
rest of the links at 560, the wordmark at 480. The portrait keeps marking home
after the name is gone, and the CV link and the pill survive to the narrowest
width — a visitor came for a way out and a status, not a label.

### Hero

Figma frame `173:23304`. One centred column, four parts, fixed gaps:

The hero is a slider of three versions of Kate — product designer
(`200:94679`), tennis (`173:23275`), pink ranger (`203:37850`). One structure,
three sets of content; there is no second hero markup anywhere.

| Part | Size | Gap below | Varies per slide |
| --- | --- | --- | --- |
| portrait | 280 × 280 | 40 | image |
| meta line | 16 tall, segments 14 apart, wrapping | 32 | text and accent |
| statement (H1) | max 856 wide | 16 | text |
| subtitle (Body) | max 830 wide | 56 | yes — each slide has its own since 14.10.2026 |
| dots | 24 tall, centred | — | no |

56 above the portrait and 82 under the dots: those put the rule at 862, where
the projects section starts.

### The hero's light

`.hero__glow` is the kit's own rectangle (`200:94680`) and nothing else: white,
862 × 683, at 310 / 118, under `filter: blur(500px)`. It is a layer inside the
hero, not a background on it.

It was a radial gradient until 2026-10-04, and that was wrong in a way worth
recording. A gradient painted on `.hero` has to fade out *somewhere*, and the
only place it can is the hero's own edge — which put a soft seam exactly where
the projects section begins, and gave the light a visible round edge the frame
does not have. Amplifying a diff against the render showed it as concentric
rings.

So: no clipping, no fade, no seam. The blur's own tail lifts the whole page by
a point or two, which is what the frame does too; the rectangle simply stops.
Measured against the render afterwards, the background matches within 0–2
points everywhere.

One number is taken from the first frame rather than agreed across the three:
the 32 under the meta line. `200:94679` draws 32 there; `173:23275` and
`203:37850` draw 16, which makes their hero blocks 228 tall against the first
one's 244. The hero is one system, so it takes one value, and the value it
takes is the one on the slide that gets tuned.

The three slides are stacked in one grid cell, so the tallest sets the height
once. Measured: all three come to the same height anyway — every statement is
two lines of 60 — but the stack is what guarantees that switching can never
move the projects section, whatever the copy becomes.

The last meta segment is a pair: a label in the row's grey, then a value
carrying a mark and taking the slide's accent through `--hero-accent`. That
accent is the only thing in the hero allowed to differ per slide — brand blue
on the first two, `--color-accent-pink` on the ranger.

Personal statements break by hand (`<br>`), the professional one wraps on its
measure. That is how the kit sets them: on the personal slides the line break
is part of the writing.

The portrait is a cut-out (`assets/kate.png`) standing straight on the page —
no plate, no radius, nothing cropping it. In Figma it is a component with a
variant axis, one variant per version of her; the code renders one of them.
The same file serves the 40px copy in the bar, where it is drawn 45 × 45 at
(−2.2, −0.8) so the head overflows the circle, on the one plate that survived:
`--gradient-avatar-plate-nav`.

The meta line is four segments and three slashes on one row, gap 14, with the
employer group closing to 4 around its 16px mark. It wraps at narrow widths and
takes an 8px row gap there.

Only the serif scales below 1440; the gaps, the portrait and the meta hold
their size, so the block keeps its proportions as the type shrinks.

## Mobile CSS architecture

### Requirement (from the brief, verbatim)

**Mobile CSS Architecture — Critical Requirement**

All mobile-specific styling must be properly organized and isolated from
desktop styles.

First, inspect the existing CSS architecture, design tokens, typography, and
responsive breakpoints.

Reuse existing design tokens wherever possible:

- Font families and font weights
- Text and background colors
- Border radii
- Spacing variables
- Existing visual effects

Create a dedicated mobile stylesheet, for example `mobile.css`, if this fits
the existing project architecture. Otherwise, use the project's existing
approach to responsive styling.

- All mobile-specific overrides must be scoped to mobile breakpoints
  (`max-width: 767px`).
- Do not modify global styles or desktop component styles to achieve
  mobile-specific results.
- Avoid duplicating existing CSS declarations. Inherit shared styles and
  override only properties that actually need to change on mobile.
- Use existing class names and component structure wherever possible. Do not
  create unnecessary new components or CSS abstractions.
- Keep mobile styles organized by section (Hero, Projects, Navigation, etc.)
  so they can be easily maintained and extended later.
- Do not use inline styles or `!important` as shortcuts.
- Before changing anything, identify which existing styles are safe to reuse
  and which require mobile-specific overrides.

**Important**

- The mobile version must inherit the existing design system, not introduce a
  separate one.
- Desktop styles remain the source of truth for shared visual properties.
- Mobile CSS only defines differences in layout, sizing, spacing, and
  responsive behavior.
- Do not create duplicate design tokens or redefine existing colors, fonts, or
  visual styles.

**Validation** — after each mobile change:

- Verify that desktop styling remains completely unchanged.
- Ensure mobile styles do not leak into tablet or desktop breakpoints.
- Confirm that existing animations and interactions still work.
- Check that no global CSS declarations were modified.
- Briefly report which CSS files were created or modified.

**Principle: mobile overrides, not rewrites.**

```css
/* Existing shared styles */
.hero-title {
  font-family: var(--font-serif);
  color: var(--text-primary);
  font-size: 64px;
}

/* Mobile-specific adjustments */
@media (max-width: 767px) {
  .hero-title {
    font-size: 36px;
    line-height: 1.1;
  }
}
```

One design system, and the phone layout is a separate adaptive view of it.

### How it is done here

All phone styling lives in `mobile.css`, loaded after `styles.css`, in one
`@media (max-width: 767px)` block, organised by section in page order: Hero,
Projects. New phone work goes into the section it belongs to.

- The same 767px is read by `matchMedia` in `slider.js` and `marquee.js`.
  Change them together or not at all.
- No new tokens. The one local custom property, `--tile-bg`, only points at an
  existing token.
- Overrides win on specificity and on loading later. Where a script would
  leave inline styles behind, it stops writing them at this width
  (`slider.js` does not position slides in the feed).
- Markup that exists only on a phone (the hero's running-line track) is built
  by script when the breakpoint holds and removed when it does not, so no
  desktop rule has to know about it.
- On a phone the cases are pictures alone: captions, the "Before" screenshot
  and the handwritten aside are not shown there.
- Known gap: older blocks in `styles.css` still use 720px. They predate this
  rule and were left alone; between 721 and 767px they do not apply while
  `mobile.css` does.

## Adding to the system

Reach for an existing token first. Add a new one only when a real need can't be
expressed by the five type styles above; put it in `design-system.css`, never
inline in a component. A sixth style is a conversation about the kit.

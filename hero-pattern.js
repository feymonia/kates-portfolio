/* hero-pattern.js — a hidden layer of code and design under the hero.
   (branch: hero-pattern)

   The structure exists over the whole hero: binary runs, the punctuation
   of code, short fragments, and the words of product design woven through
   them, gathered into soft clusters of uneven density with ragged edges —
   no band, no straight line anywhere. At rest it is a faint texture
   (8–12% where the clusters are dense, nothing in the gaps). The pointer
   is the light: within ~250px of it the layer comes up to 20–25%, in the
   gaps too, follows softly, and fades slowly when the pointer leaves.
   Near the pointer some symbols iterate: a run of 010101 becomes
   `layout`, holds, and dissolves back into code. A feathered mask keeps
   the headline, the subtitle, the meta line, the portrait and the dots
   clean whatever the pointer does.
   prefers-reduced-motion: drawn once, still. */
(() => {
  const hero = document.querySelector(".hero");
  const canvas = hero && hero.querySelector(".hero__pattern");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ——— Matter ——— */
  const CODE = ["0101", "1100", "0011", "10", "01", "0110", "1001", "000", "111", "110010", "001101", "{ }", "< >", "/", "=", ";", "[ ]", "=>", "( )", "//", "::", "&&", "const", "return", "async", "render", "state", "await", "map"];
  const DESIGN = ["design", "system", "interaction", "prototype", "iteration", "research", "usability", "interface", "experience", "component", "layout", "typography", "accessibility", "flow", "state", "feedback", "human", "product"];
  const stream = (() => {
    let s = 7; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    let out = "";
    while (out.length < 6000) { const r = rnd(); out += (r < 0.76 ? CODE[Math.floor(rnd() * CODE.length)] : DESIGN[Math.floor(rnd() * DESIGN.length)]) + (rnd() < 0.3 ? " " : ""); }
    return out;
  })();

  const CELL = 9, LINE = 12;
  const FONT = "500 10px ui-monospace, 'SF Mono', Menlo, Consolas, monospace";
  const REST = 0.11; // alpha in the densest clusters at rest
  const LIFT = 0.22; // added under the pointer
  const CAP = 0.25;
  const RADIUS = 250; // px, the pointer's reach
  const SHIFT = 1.2; // px, how far a symbol may move near the pointer
  const FEATHER = 100, PAD = 24; // the mask around the words
  const FADE_IN = 1.6;

  /* ——— Noise ——— */
  const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967295; };
  const smooth = (v) => v * v * (3 - 2 * v);
  const noise = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = smooth(x - xi), fy = smooth(y - yi); const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1); return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy; };
  const clampStep = (v, lo, hi) => smooth(Math.min(1, Math.max(0, (v - lo) / (hi - lo))));

  let W = 0, H = 0, dpr = 1, cols = 0, rows = 0, ink = "77, 63, 63";
  let OFF = 0; // the bar's height: the canvas starts that far above the hero
  const bar = document.querySelector("header.nav");
  let cluster, mask, glyph, heat; // per cell
  let t = 0, born = 0, lastMask = -1, lastSpawn = 0, lastIdle = 0;
  const mouse = { x: -1e4, y: -1e4, ex: -1e4, ey: -1e4, on: 0 };
  const overlays = [];

  const inkFromTheme = () => {
    const v = getComputedStyle(document.documentElement).getPropertyValue("--color-text-primary").trim();
    const m = v.match(/^#([0-9a-f]{6})$/i);
    if (m) ink = [1, 3, 5].map((i) => parseInt(m[1].slice(i - 1, i + 1), 16)).join(", ");
  };

  /* Clusters: a broad field of blobs with a finer grain inside, cut
     softly, so density rises and falls and edges stay ragged. Scaled to
     the hero in px, so a wider window gets more clusters, not bigger. */
  const build = () => {
    cols = Math.ceil(W / CELL) + 1; rows = Math.ceil(H / LINE) + 1;
    const n = cols * rows;
    cluster = new Float32Array(n); mask = new Float32Array(n).fill(1); glyph = new Int32Array(n); heat = new Float32Array(n);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const i = r * cols + c, x = c * CELL, y = r * LINE;
      const big = noise(x / 260 + 5, y / 220 + 9);
      const mid = noise(x / 110 + 40, y / 95 + 3);
      const fine = noise(x / 36, y / 30 + 77);
      const field = big * 0.55 + mid * 0.3 + fine * 0.15;
      cluster[i] = clampStep(field, 0.220, 0.318); // 0 in the gaps, 1 in the hearts
      glyph[i] = c + r * 53;
    }
  };

  /* The protected zone: the words of the slide on stage, the portrait,
     the dots — padded, then feathered */
  const remask = () => {
    const base = hero.getBoundingClientRect();
    const rects = [];
    const slide = hero.querySelector(".hero__slide[aria-hidden='false']") || hero.querySelector(".hero__slide");
    const parts = [".hero__portrait", ".hero__meta", ".hero__title", ".hero__subtitle"].map((s) => slide.querySelector(s)).concat([hero.querySelector(".slider__dots")]);
    const add = (el, pad, feather) => { if (!el) return; const b = el.getBoundingClientRect(); if (b.width && b.height) rects.push([b.left - base.left - pad, b.top - base.top + OFF - pad, b.right - base.left + pad, b.bottom - base.top + OFF + pad, feather]); };
    parts.forEach((el) => add(el, PAD, FEATHER));
    /* The bar's words get a tight zone of their own, so the texture runs
       on between them and the top is never cut off as a band */
    if (bar) bar.querySelectorAll(".brand, nav.links, .availability").forEach((el) => add(el, 8, 36));
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const i = r * cols + c, x = c * CELL + CELL / 2, y = r * LINE + LINE / 2;
      let m = 1;
      for (const [x0, y0, x1, y1, feather] of rects) { const dx = Math.max(x0 - x, 0, x - x1), dy = Math.max(y0 - y, 0, y - y1); m = Math.min(m, smooth(Math.min(1, Math.sqrt(dx * dx + dy * dy) / feather))); }
      /* The foot: the layer dissolves into the page over the last ~180px,
         each column a little earlier or later, so there is no line — and
         since this lives in the mask, the pointer cannot bring it back */
      const early = 70 * noise(c * 0.07 + 11, 3) + 20 * noise(c * 0.31 + 5, 8); // 0..90px sooner
      m *= clampStep(H - y - early, 0, 180);
      mask[i] = m;
    }
  };

  const resize = () => {
    const rect = hero.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    OFF = bar ? Math.round(bar.getBoundingClientRect().height) : 0;
    W = rect.width; H = rect.height + OFF;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px"; canvas.style.height = H + "px"; canvas.style.top = -OFF + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = FONT; ctx.textBaseline = "middle"; ctx.textAlign = "center";
    inkFromTheme();
    build(); remask(); lastMask = t;
  };

  /* A word iterates out of the code at (r, c): letters arrive one by one,
     hold, then dissolve the same way */
  const spawn = (r, c) => {
    if (r < 0 || r >= rows || c < 0) return;
    const word = DESIGN[Math.floor(Math.random() * DESIGN.length)];
    if (c + word.length >= cols) c = cols - word.length - 1;
    for (let k = 0; k < word.length; k++) { const i = r * cols + c + k; if (mask[i] < 0.5) return; }
    for (const o of overlays) if (o.r === r && Math.abs(o.c - c) < 14) return;
    overlays.push({ r, c, word, born: t });
  };
  const letterOf = (o, k) => {
    const age = t - o.born, step = 0.09, hold = 1.8, up = o.word.length * step, down = up + hold;
    if (age < up) return k < age / step ? o.word[k] : null;
    if (age < down) return o.word[k];
    return k >= (age - down) / step ? o.word[k] : null;
  };

  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    const arrive = still ? 1 : smooth(Math.min(1, (t - born) / FADE_IN));
    const breathe = 1 + 0.05 * Math.sin(t * 0.35);
    const letters = new Map();
    for (let k = overlays.length - 1; k >= 0; k--) {
      const o = overlays[k]; if (t - o.born > o.word.length * 0.18 + 2.0) { overlays.splice(k, 1); continue; }
      for (let j = 0; j < o.word.length; j++) { const ch = letterOf(o, j); if (ch) letters.set(o.r * cols + o.c + j, ch); }
    }
    for (let r = 0; r < rows; r++) {
      const y = r * LINE + LINE / 2;
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        if (mask[i] <= 0.01) continue;
        const x = c * CELL + CELL / 2;
        let target = 0;
        if (mouse.on) { const dx = x - mouse.ex, dy = y - mouse.ey; const q = 1 - Math.min(1, Math.sqrt(dx * dx + dy * dy) / RADIUS); target = smooth(q); }
        heat[i] += (target - heat[i]) * (target > heat[i] ? 0.12 : 0.035); // comes up quicker than it fades
        const h = heat[i] * mask[i], k = cluster[i];
        if (!still && hash(c >> 2, (r >> 1) + Math.floor(t * 0.5)) > 0.992 && Math.random() < 0.3) glyph[i] += 1;
        if (h > 0.3 && Math.random() < 0.015 * h) glyph[i] += 1;
        let ch = letters.get(i);
        if (!ch) { ch = stream[(glyph[i] + 6000) % stream.length]; if (ch === " ") continue; }
        /* at rest only the clusters show; the light reveals the gaps too */
        let a = (REST * k * breathe + LIFT * h * (0.7 + 0.3 * k) + (letters.has(i) ? 0.04 : 0)) * mask[i] * arrive;
        if (a < 0.006) continue;
        const ox = SHIFT * h * (noise(c * 0.9, r * 0.9 + t * 0.7) - 0.5) * 2;
        const oy = SHIFT * h * (noise(c * 0.9 + 50, r * 0.9 - t * 0.6) - 0.5) * 2;
        ctx.fillStyle = `rgba(${ink}, ${Math.min(CAP, a).toFixed(3)})`;
        ctx.fillText(ch, x + ox, y + oy);
      }
    }
  };

  let last = performance.now(), frame = 0;
  const step = (dt) => {
    t += dt;
    const k = 1 - Math.pow(0.0005, dt);
    mouse.ex += (mouse.x - mouse.ex) * k; mouse.ey += (mouse.y - mouse.ey) * k;
    if (t - lastMask > 1) { remask(); lastMask = t; }
    if (mouse.on && t - lastSpawn > 0.35) { lastSpawn = t; const a = Math.random() * Math.PI * 2, rr = Math.random() * RADIUS * 0.7; spawn(Math.round((mouse.ey + Math.sin(a) * rr) / LINE), Math.round((mouse.ex + Math.cos(a) * rr) / CELL)); }
    if (t - lastIdle > 4) { lastIdle = t; spawn(Math.floor(Math.random() * rows), Math.floor(Math.random() * cols)); }
    frame++;
    if (frame % 3 === 0) draw();
  };
  const tick = (now) => { const dt = Math.min(0.1, (now - last) / 1000); last = now; step(dt); requestAnimationFrame(tick); };
  if (new URLSearchParams(location.search).has("debug")) window.__hero = { mouse, step, draw, overlays };

  const start = () => {
    resize();
    if (still) { draw(); window.addEventListener("resize", () => { resize(); draw(); }); return; }
    born = t;
    const follow = (e) => { const b = hero.getBoundingClientRect(); mouse.x = e.clientX - b.left; mouse.y = e.clientY - b.top + OFF; if (!mouse.on) { mouse.ex = mouse.x; mouse.ey = mouse.y; } mouse.on = 1; };
    const leave = (e) => { const to = e.relatedTarget; if (to && (hero.contains(to) || (bar && bar.contains(to)))) return; mouse.on = 0; };
    hero.addEventListener("pointermove", follow); hero.addEventListener("pointerleave", leave);
    if (bar) { bar.addEventListener("pointermove", follow); bar.addEventListener("pointerleave", leave); }
    window.addEventListener("resize", resize);
    requestAnimationFrame(tick);
  };
  let started = false;
  const once = () => { if (!started) { started = true; start(); } };
  if (document.fonts && document.fonts.load) document.fonts.load(FONT).then(once, once); else once();
  setTimeout(once, 1000);
})();

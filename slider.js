/* Project card slider — circular, click and swipe driven.
   Markup:
     <div class="project-card__stage slider" data-slider>
       <div class="slider__viewport">
         <div class="slide">…</div>   ← one per frame
       </div>
     </div>
   Dots are generated here from the number of slides, so adding a case
   frame is a one-line markup change. A slider with a single slide stays
   static: no dots, no pointer cursor.

   Navigation: a click or tap in the right edge zone advances, in the left
   edge zone goes back; touch can also swipe. A frame that has to swap
   sides is repositioned without a transition while it sits off-stage, so
   nothing ever flies across the viewport.

   How wide an edge zone is comes from `--slider-edge`, a share of the
   width, default .5 — two halves with no gap between them, which is what
   a project card wants. A stage that has something to read or click in
   the middle sets it lower: the hero uses .22, leaving the middle 56%
   inert, where a click does nothing and the native cursor comes back.

   On a mouse or a pen the zones are made visible: the native cursor is
   replaced by a disc that follows the pointer with an arrow pointing at
   the zone under it. Touch and coarse pointers never see it and keep the
   cursor they had. */

(() => {
  "use strict";

  const TAP_SLOP = 10; // px of travel below which a touch counts as a tap
  const COMMIT_RATIO = 0.12; // share of width that commits a swipe
  const COMMIT_VELOCITY = 0.4; // px per ms — a quick flick commits too

  const mod = (a, b) => ((a % b) + b) % b;

  document.querySelectorAll("[data-slider]").forEach(init);

  function init(root) {
    const viewport = root.querySelector(".slider__viewport");
    const slides = Array.from(root.querySelectorAll(".slide"));
    if (!viewport || slides.length === 0) return;

    root.setAttribute("role", "group");
    root.setAttribute("aria-roledescription", "carousel");

    if (slides.length < 2) {
      root.dataset.static = "true";
      /* Static does not mean still: a lone frame may be a recording, and
         it plays on screen and rests off it, as in a full slider. */
      const lone = slides[0].querySelector("video");
      if (lone) {
        const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
        lone.controls = calm.matches;
        new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting && !calm.matches) {
              const started = lone.play();
              if (started) started.catch(() => {});
            } else {
              lone.pause();
            }
          },
          { threshold: 0.25 }
        ).observe(root);
      }
      return;
    }

    const count = slides.length;
    const placed = slides.map(() => null); // last offset rendered per slide
    let index = 0;

    /* One transition at a time: while it runs, further navigation piles up
       in `queued` instead of restarting the animation mid-flight. */
    let lock = 0;
    let queued = null;

    let swiping = false;
    let ignoreClick = false;
    let startX = 0;
    let startTime = 0;
    let delta = 0;
    let width = 1;

    /* Cached rather than read per pointermove: getComputedStyle in a move
       handler is the kind of thing that shows up as jank. */
    let edge = readEdge();

    function readEdge() {
      const value = parseFloat(
        getComputedStyle(root).getPropertyValue("--slider-edge")
      );
      return Number.isFinite(value) && value > 0 && value <= 0.5 ? value : 0.5;
    }

    slides.forEach((slide, i) => {
      slide.setAttribute("role", "group");
      slide.setAttribute("aria-roledescription", "slide");
      /* A slide that names itself keeps its name; the count is only a
         fallback for frames that have nothing to say. */
      if (!slide.hasAttribute("aria-label")) {
        slide.setAttribute("aria-label", `${i + 1} / ${count}`);
      }
      slide.querySelectorAll("img").forEach((img) => {
        img.draggable = false;
      });
    });

    /* Dots — Figma component "Frame 2136139698" */
    const dots = document.createElement("ul");
    dots.className = "slider__dots";
    const buttons = slides.map((_, i) => {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "slider__dot";
      button.setAttribute("aria-label", `Slide ${i + 1}`);
      button.addEventListener("click", () => goTo(i));
      item.appendChild(button);
      dots.appendChild(item);
      return button;
    });
    root.appendChild(dots);

    /* Stage cursor — Figma frame 172:19127. Built only where a fine
       pointer can reach it; everywhere else the viewport keeps its own
       cursor and nothing below runs. */
    const cursor = window.matchMedia("(hover: hover) and (pointer: fine)")
      .matches
      ? buildCursor()
      : null;

    function buildCursor() {
      const el = document.createElement("div");
      el.className = "slider__cursor";
      el.setAttribute("aria-hidden", "true");
      el.dataset.direction = "next";
      el.innerHTML =
        '<svg viewBox="0 0 20 14" fill="none" stroke="currentColor" ' +
        'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M1 7h18M13 1l6 6-6 6"/></svg>';
      root.classList.add("slider--has-cursor");
      /* Until the pointer says otherwise, assume the inert middle: a
         stage should not hide the cursor before it knows where it is. */
      root.dataset.zone = "none";
      root.appendChild(el);
      return el;
    }

    /* ——— State stacks ———
       A frame can also be one picture shown many ways: `[data-states]`
       holds a stack and steps through it on its own, so a visitor sees
       that a case was worked through rather than having to click for it.
       Gated exactly like a video — on stage and on screen, or stopped.

       It runs brisk on purpose: the point of the stack is the count, that
       this case was taken apart many ways, and a slow march reads as one
       picture that cannot make up its mind. Brisk only works if it can be
       stopped, so pointing at the picture holds it — see below. */
    const stacks = slides.map((slide) => slide.querySelector("[data-states]"));
    const hasStack = stacks.some(Boolean);
    const STATE_HOLD = 1000; // quick, but long enough to take one in
    let ticker = 0;
    let step_ = 0;
    let runningFor = -1; // which slide the ticker belongs to, −1 for none
    let held = false; // the cursor is on the picture, so it waits
    /* Paging onto a frame starts its sequence over — a video from the
       first second, a state stack from the first state — so the story is
       never joined halfway. Only a page turn resets: a hold, or scrolling
       away and back, carries on from where it was. */
    let shownStack = null; // the stack on stage the last time we looked
    let turned = false; // a page was just turned; the next start rewinds

    stacks.forEach((stack) => {
      if (!stack) return;
      const frames = stack.querySelectorAll("img");
      frames.forEach((frame, i) =>
        frame.setAttribute("data-current", i === 0 ? "true" : "false")
      );

      /* Hold on hover. The listeners sit on the states themselves, not on
         the stack around them: the stack spans the whole frame, while only
         the state showing takes the pointer (see the CSS), so this is the
         picture and nothing else — someone reading the card's words or
         aiming for an edge zone is never interrupted.

         Holding only stops the clock. The state on screen stays put, and
         when the cursor leaves the sequence carries on from there instead
         of starting over. */
      frames.forEach((frame) => {
        frame.addEventListener("pointerenter", (event) => {
          /* A finger cannot hover, and a touch that turns into a swipe can
             leave without a matching leave — it would stay held for good. */
          if (event.pointerType === "touch") return;
          held = true;
          syncStack();
        });
        frame.addEventListener("pointerleave", () => {
          held = false;
          syncStack();
        });
      });
    });

    /* ——— Video frames ———
       A frame can be a video instead of a picture. It runs only while it
       is the one on stage AND the stage is on screen: a card far down the
       page should not be decoding video nobody is looking at, and neither
       should a frame sitting off-stage behind the current one.

       Someone who asked for less motion gets it stopped and handed the
       controls instead, rather than a still they cannot start. */
    const videos = slides.map((slide) => slide.querySelector("video"));
    const hasVideo = videos.some(Boolean);
    const stillness = window.matchMedia("(prefers-reduced-motion: reduce)");
    let onScreen = false;

    /* On a phone the case is a feed, not a carousel: every frame sits one
       under the other (see styles.css), so "the one on stage" no longer
       means anything. A video or a state stack runs while it is itself on
       screen, whichever frame it belongs to. */
    const feed = window.matchMedia("(max-width: 767px)");
    /* Only a case on a project card unrolls into a feed. The hero is a
       slider on every width: its slides share one grid cell and are told
       apart solely by what render() writes inline, so it must keep
       rendering — otherwise all three show at once. */
    const feedable = root.classList.contains("project-card__stage");
    const inFeed = () => feedable && feed.matches;
    const seen = new Set();

    if (hasVideo || hasStack) {
      const own = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) seen.add(entry.target);
            else seen.delete(entry.target);
          });
          syncVideo();
        },
        { threshold: 0.25 }
      );
      videos.forEach((video) => video && own.observe(video));
      stacks.forEach((stack) => stack && own.observe(stack));

      videos.forEach((video) => {
        if (video) video.controls = stillness.matches;
      });
      new IntersectionObserver(
        (entries) => {
          onScreen = entries[0].isIntersecting;
          syncVideo();
        },
        { threshold: 0.25 }
      ).observe(root);
      stillness.addEventListener("change", () => {
        videos.forEach((video) => {
          if (video) video.controls = stillness.matches;
        });
        syncVideo();
      });
    }

    function syncStack() {
      if (!hasStack) return;
      const stack = inFeed()
        ? stacks.find((candidate) => candidate && seen.has(candidate))
        : stacks[index];
      /* Paging out from under a held cursor need not give us a leave, so
         let the hold go with the frame rather than risk it sticking. */
      if (!stack) held = false;
      const running =
        Boolean(stack) &&
        (inFeed() || onScreen) &&
        !held &&
        !stillness.matches;
      const wanted = running ? stacks.indexOf(stack) : -1;
      const fresh = stack !== shownStack;
      shownStack = stack || null;
      /* render() runs on every pointermove; restarting the timer there
         would keep resetting the hold and nothing would ever settle. */
      if (wanted === runningFor && !fresh) return;
      runningFor = wanted;
      clearInterval(ticker);
      if (!running) return;
      const frames = Array.from(stack.querySelectorAll("img"));
      if (frames.length < 2) return;
      if (fresh) {
        frames.forEach((frame, i) =>
          frame.setAttribute("data-current", i === 0 ? "true" : "false")
        );
        step_ = 0;
      }
      ticker = setInterval(() => {
        frames[step_].setAttribute("data-current", "false");
        step_ = (step_ + 1) % frames.length;
        frames[step_].setAttribute("data-current", "true");
      }, STATE_HOLD);
    }

    function syncVideo() {
      syncStack();
      if (!hasVideo) return;
      videos.forEach((video, i) => {
        if (!video) return;
        const wanted = inFeed()
          ? seen.has(video) && !stillness.matches
          : onScreen && i === index && !stillness.matches;
        if (wanted && video.paused) {
          if (turned && !inFeed()) {
            video.currentTime = 0;
            turned = false;
          }
          /* Autoplay can still be refused; the frame then simply sits. */
          const started = video.play();
          if (started) started.catch(() => {});
        } else if (!wanted && !video.paused) {
          video.pause();
        }
      });
    }

    /* Keyboard parity with the click targets */
    root.tabIndex = 0;
    root.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
      }
    });

    viewport.addEventListener("click", onClick);
    viewport.addEventListener("pointerdown", onDown);
    viewport.addEventListener("pointermove", onMove);
    viewport.addEventListener("pointerup", onUp);
    viewport.addEventListener("pointercancel", onUp);
    viewport.addEventListener("pointerenter", trackCursor);
    viewport.addEventListener("pointerleave", onLeave);
    window.addEventListener(
      "resize",
      () => {
        edge = readEdge();
        render(false);
      },
      { passive: true }
    );

    feed.addEventListener("change", () => render(false));
    render(false);

    /* Shortest signed distance from the current slide, so the track
       wraps in whichever direction the move is going. */
    function offsetOf(i) {
      let d = mod(i - index, count);
      if (d > count / 2) d -= count;
      return d;
    }

    function render(animate) {
      /* In the phone feed the slides are not positioned at all: they are
         plain blocks one under the other (mobile.css). Whatever a desktop
         render left inline is cleared, so the stylesheet needs no
         overrides to win against it. */
      if (inFeed()) {
        slides.forEach((slide, i) => {
          slide.style.transform = "";
          slide.style.opacity = "";
          slide.style.visibility = "";
          slide.style.transition = "";
          slide.setAttribute("aria-hidden", "false");
          placed[i] = null;
        });
        syncVideo();
        return;
      }
      slides.forEach((slide, i) => {
        const offset = offsetOf(i);
        const previous = placed[i];
        /* Swapping sides means crossing the whole stage — put the frame
           there instantly instead, it is off-stage before and after. */
        const wraps = previous !== null && Math.abs(offset - previous) > 1;
        slide.style.transition = animate && !wraps ? "" : "none";
        slide.style.transform = `translate3d(calc(${offset * 100}% + ${
          swiping ? delta : 0
        }px), 0, 0)`;
        /* A swipe drags its neighbours into view, so they stay opaque;
           otherwise only the current frame is. */
        slide.style.opacity = swiping || offset === 0 ? "1" : "0";
        /* Keep the two neighbours mounted so a wrap has something to show */
        slide.style.visibility = Math.abs(offset) <= 1 ? "visible" : "hidden";
        slide.setAttribute("aria-hidden", offset === 0 ? "false" : "true");
        placed[i] = offset;
      });
      buttons.forEach((button, i) =>
        button.setAttribute("aria-current", i === index ? "true" : "false")
      );
      /* The stage reads this when a frame needs the backdrop changed under
         it. Doing it on the stage rather than on the slide keeps one
         painted layer under the rounded corner: two of them, clipped by
         two radii, leave a hairline of the lower one along the edge. */
      root.dataset.slide = index;
      syncVideo();
    }

    /* Relative moves stack onto whatever is already queued, so a burst of
       clicks lands on the slide the user asked for. */
    function step(direction) {
      goTo((queued === null ? index : queued) + direction);
    }

    function goTo(next) {
      const target = mod(next, count);
      if (lock) {
        queued = target;
        return;
      }
      if (target === index) return;
      index = target;
      turned = true;
      render(true);
      hold();
      /* Anyone listening (analytics.js) learns which frame is on stage;
         the slider itself needs nothing from them. */
      root.dispatchEvent(
        new CustomEvent("slider:change", { bubbles: true, detail: { index } })
      );
    }

    function hold() {
      clearTimeout(lock);
      lock = setTimeout(() => {
        lock = 0;
        if (queued === null) return;
        const next = queued;
        queued = null;
        goTo(next);
      }, transitionMs());
    }

    function release() {
      clearTimeout(lock);
      lock = 0;
      queued = null;
    }

    /* Read the duration off the stylesheet so the lock and the CSS
       transition can never drift apart. It comes from --slide-duration
       rather than a slide's own `transition`, which is rewritten inline. */
    function transitionMs() {
      const value = getComputedStyle(root)
        .getPropertyValue("--slide-duration")
        .trim();
      const ms = parseFloat(value) || 0;
      return /ms$/.test(value) ? ms : ms * 1000;
    }

    /* −1 back, +1 forward, 0 nothing. One function decides it, and both
       the arrow and the click read it, so what the disc promises and what
       a click does can never drift apart. */
    function zoneOf(clientX) {
      const box = root.getBoundingClientRect();
      const share = (clientX - box.left) / (box.width || 1);
      if (share < edge) return -1;
      if (share > 1 - edge) return 1;
      return 0;
    }

    function navigateFrom(clientX) {
      const zone = zoneOf(clientX);
      if (zone !== 0) step(zone);
    }

    function trackCursor(event) {
      if (inFeed()) return; // a feed does not page
      if (!cursor || event.pointerType === "touch") return;
      /* Measured against the root, because that is what the disc is
         positioned against. On a card the two are the same box; on the
         hero the viewport sits inside the section's padding. */
      const box = root.getBoundingClientRect();
      const zone = zoneOf(event.clientX);
      /* The stylesheet reads this to give the middle its cursor back. */
      root.dataset.zone = zone === 0 ? "none" : zone < 0 ? "prev" : "next";
      if (zone === 0) {
        hideCursor();
        return;
      }
      cursor.style.setProperty("--cursor-x", `${event.clientX - box.left}px`);
      cursor.style.setProperty("--cursor-y", `${event.clientY - box.top}px`);
      cursor.dataset.direction = zone < 0 ? "prev" : "next";
      cursor.dataset.visible = "true";
    }

    function hideCursor() {
      if (cursor) cursor.dataset.visible = "false";
    }

    function onLeave() {
      hideCursor();
      root.dataset.zone = "none";
    }

    function onClick(event) {
      if (inFeed()) return; // a feed does not page
      /* A swipe ends with a synthetic click — that one is not navigation. */
      if (ignoreClick) {
        ignoreClick = false;
        return;
      }
      /* Whatever the visitor actually aimed at wins over the zone. */
      if (event.target.closest("a, button, input, select, textarea, label")) {
        return;
      }
      navigateFrom(event.clientX);
    }

    /* Mouse and pen navigate by click; only touch tracks the finger. */
    function onDown(event) {
      if (inFeed()) return; // a feed does not page
      ignoreClick = false;
      if (event.pointerType !== "touch") return;
      swiping = true;
      width = viewport.clientWidth || 1;
      startX = event.clientX;
      startTime = event.timeStamp;
      delta = 0;
      release();
      /* Throws when the pointer is already gone — the swipe still works
         off the events we get, so it must not take the handler down. */
      try {
        viewport.setPointerCapture(event.pointerId);
      } catch (error) {
        /* no capture: pointermove still reaches the viewport */
      }
      render(false);
    }

    function onMove(event) {
      trackCursor(event);
      if (!swiping) return;
      delta = event.clientX - startX;
      render(false);
    }

    function onUp(event) {
      if (!swiping) return;
      const distance = Math.abs(delta);
      const velocity = distance / Math.max(event.timeStamp - startTime, 1);
      const direction = delta < 0 ? 1 : -1;

      swiping = false;
      delta = 0;
      if (viewport.hasPointerCapture(event.pointerId)) {
        viewport.releasePointerCapture(event.pointerId);
      }

      /* Barely moved — leave it to the click that follows the tap. */
      if (distance <= TAP_SLOP) {
        render(false);
        return;
      }

      ignoreClick = true;
      if (distance > width * COMMIT_RATIO || velocity > COMMIT_VELOCITY) {
        index = mod(index + direction, count);
      }
      render(true);
      hold();
    }
  }
})();

/* motion.js — the scroll reveal.
   Each project card rises into place once, when about a fifth of it is
   on screen. Cards that arrive in the same frame take turns, one beat
   apart. Nothing is hidden again, nothing replays, and the page scrolls
   exactly as it did: the observer only adds a class. The entrance and
   the hover need no script and live in the stylesheet. */
(() => {
  const root = document.documentElement;
  const pending = root.classList.contains("reveal-pending");
  if (window.__revealFallback) clearTimeout(window.__revealFallback);
  if (!pending) return;

  const cards = Array.from(document.querySelectorAll(".project-card"));
  if (!cards.length) {
    root.classList.remove("reveal-pending");
    return;
  }

  const styles = getComputedStyle(root);
  const beat = parseFloat(styles.getPropertyValue("--motion-stagger")) || 110;
  const settle =
    parseFloat(styles.getPropertyValue("--motion-standard")) || 650;

  const reveal = (card, index) => {
    card.style.transitionDelay = index ? `${index * beat}ms` : "";
    card.classList.add("is-revealed");
    /* The delay serves the reveal alone; clear it once the card is up,
       so nothing later inherits a wait it did not ask for. */
    setTimeout(() => {
      card.style.transitionDelay = "";
    }, index * beat + settle + 50);
  };

  /* A card is "in" once about a fifth of it shows — or, for the tall
     feeds on a phone, once it fills a good part of the screen, so a long
     card does not wait for a fifth of itself that never fits at once. */
  const seen = (entry) =>
    entry.isIntersecting &&
    (entry.intersectionRatio >= 0.18 ||
      entry.intersectionRect.height >= window.innerHeight * 0.4);

  const observer = new IntersectionObserver(
    (entries) => {
      const arriving = entries
        .filter(seen)
        .map((entry) => entry.target)
        .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
      arriving.forEach((card, index) => {
        observer.unobserve(card);
        reveal(card, index);
      });
    },
    { threshold: [0.05, 0.1, 0.15, 0.18, 0.3, 0.5] }
  );

  cards.forEach((card) => observer.observe(card));

  /* Motion switched off mid-visit: show whatever is still waiting. */
  const stillness = matchMedia("(prefers-reduced-motion: reduce)");
  stillness.addEventListener("change", () => {
    if (!stillness.matches) return;
    observer.disconnect();
    cards.forEach((card) => card.classList.add("is-revealed"));
  });
})();

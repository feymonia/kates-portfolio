/* analytics.js — what people actually touch.
   GA4's own enhanced measurement already counts views, scroll depth and
   clicks that leave the site. This adds the clicks that stay on it and
   the two things a portfolio is really about: which case got looked at,
   and which frames of it got turned. Five events, nothing personal:

     contact_click      { place: header|contact, link: email|linkedin|cv }
     nav_click          { link: projects|contact }
     open_to_work_click { }
     case_view          { case }            — half the card on screen, once
     case_slide         { case, slide }     — a frame turned in a case
     hero_slide         { slide }           — the hero turned

   gtag() is defined inline in <head>; if the tag itself is blocked the
   calls just queue in dataLayer and nothing else happens. */
(() => {
  if (typeof window.gtag !== "function") return;
  const send = (name, params) => window.gtag("event", name, params || {});

  const kindOf = (href) => {
    if (!href) return null;
    if (href.startsWith("mailto:")) return "email";
    if (href.includes("linkedin.com")) return "linkedin";
    if (href.includes("drive.google.com")) return "cv";
    if (href === "#projects") return "projects";
    if (href === "#contact") return "contact";
    return null;
  };

  const caseOf = (node) => {
    const card = node.closest(".project-card");
    const title = card && card.querySelector(".project-card__title");
    return title ? title.textContent.replace(/\s+/g, " ").trim() : "";
  };

  /* Clicks: the bar, the status pill, the contact block */
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (!link) return;
    if (link.classList.contains("availability")) {
      send("open_to_work_click");
      return;
    }
    const kind = kindOf(link.getAttribute("href"));
    if (!kind) return;
    const inBar = Boolean(link.closest("header.nav"));
    const inContact = Boolean(link.closest(".contact"));
    if (!inBar && !inContact) return;
    if (kind === "projects" || kind === "contact") {
      send("nav_click", { link: kind });
    } else {
      send("contact_click", { place: inBar ? "header" : "contact", link: kind });
    }
  });

  /* Frames turned: slider.js announces every change */
  document.addEventListener("slider:change", (event) => {
    const root = event.target;
    const slide = (event.detail && event.detail.index) + 1;
    if (root.classList.contains("hero")) {
      send("hero_slide", { slide });
    } else {
      send("case_slide", { case: caseOf(root), slide });
    }
  });

  /* Cases looked at: half the card on screen, counted once per visit */
  if ("IntersectionObserver" in window) {
    const seen = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          seen.unobserve(entry.target);
          send("case_view", { case: caseOf(entry.target) });
        });
      },
      { threshold: 0.5 }
    );
    document.querySelectorAll(".project-card").forEach((card) => seen.observe(card));
  }
})();

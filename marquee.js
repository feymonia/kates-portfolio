/* Hero meta line as a running line on phones.

   On a desktop the line is a row that fits and nothing here runs. Under the
   phone breakpoint it would wrap to three lines, so it becomes one line that
   runs: the segments move into a track, and a copy follows the first so the
   loop has no seam. The track and its copy exist only while the breakpoint
   holds — on a desktop the markup is exactly what the page was written
   with, so no desktop rule has to know about them. Layout lives in
   mobile.css. */

(() => {
  const phone = window.matchMedia("(max-width: 767px)");

  function build(row) {
    if (row.querySelector(":scope > .hero__meta-track")) return;

    const track = document.createElement("span");
    track.className = "hero__meta-track";
    while (row.firstChild) track.appendChild(row.firstChild);

    /* The slash that closes the loop: between the last segment and the
       first of the next lap. */
    const seam = document.createElement("span");
    seam.className = "hero__meta-rule hero__meta-rule--loop";
    seam.setAttribute("aria-hidden", "true");
    seam.textContent = "/";
    track.appendChild(seam);

    const copy = track.cloneNode(true);
    copy.classList.add("hero__meta-track--copy");
    copy.setAttribute("aria-hidden", "true");

    row.append(track, copy);
  }

  function destroy(row) {
    const track = row.querySelector(":scope > .hero__meta-track");
    if (!track) return;
    track.querySelector(".hero__meta-rule--loop")?.remove();
    while (track.firstChild) row.insertBefore(track.firstChild, track);
    row.querySelector(":scope > .hero__meta-track--copy")?.remove();
    track.remove();
  }

  function sync() {
    document
      .querySelectorAll(".hero__meta")
      .forEach((row) => (phone.matches ? build(row) : destroy(row)));
  }

  phone.addEventListener("change", sync);
  sync();
})();

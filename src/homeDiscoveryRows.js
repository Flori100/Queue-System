/**
 * Horizontal category rows on the home page: smooth scroll-by-page, arrow visibility,
 * no auto-advance (user-controlled only).
 */

const ROW_SELECTOR = ".home-discovery-row";

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** @param {HTMLElement} viewport */
function scrollPage(viewport, dir) {
  const delta = viewport.clientWidth * dir;
  if (prefersReducedMotion()) {
    viewport.scrollLeft += delta;
    return;
  }
  viewport.scrollBy({ left: delta, behavior: "smooth" });
}

/** @param {HTMLElement} viewport @param {HTMLButtonElement} prev @param {HTMLButtonElement} next */
function syncArrows(viewport, prev, next) {
  const max = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
  const eps = 3;
  const atStart = viewport.scrollLeft <= eps;
  const atEnd = viewport.scrollLeft >= max - eps;
  const scrollable = max > eps;

  if (!scrollable) {
    prev.hidden = true;
    next.hidden = true;
    prev.disabled = true;
    next.disabled = true;
    return;
  }

  prev.hidden = false;
  next.hidden = false;
  prev.disabled = atStart;
  next.disabled = atEnd;
}

/** @param {HTMLElement} row */
function bindRow(row) {
  const viewport = row.querySelector(".home-discovery-row__viewport");
  const prev = row.querySelector(".home-discovery-row__arrow--prev");
  const next = row.querySelector(".home-discovery-row__arrow--next");
  if (
    !(viewport instanceof HTMLElement) ||
    !(prev instanceof HTMLButtonElement) ||
    !(next instanceof HTMLButtonElement)
  ) {
    return;
  }

  const onScroll = function () {
    syncArrows(viewport, prev, next);
  };

  prev.addEventListener("click", function () {
    scrollPage(viewport, -1);
  });
  next.addEventListener("click", function () {
    scrollPage(viewport, 1);
  });

  viewport.addEventListener("scroll", onScroll, { passive: true });
  if (typeof ResizeObserver !== "undefined") {
    const ro = new ResizeObserver(onScroll);
    ro.observe(viewport);
  } else {
    window.addEventListener("resize", onScroll, { passive: true });
  }

  if (typeof viewport.addEventListener === "function") {
    viewport.addEventListener("scrollend", onScroll, { passive: true });
  }

  onScroll();
}

function init() {
  document.querySelectorAll(ROW_SELECTOR).forEach(function (el) {
    if (el instanceof HTMLElement) bindRow(el);
  });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
}

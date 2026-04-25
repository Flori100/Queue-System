/**
 * Removes the home "What people say" section from the DOM when opening bare /explore (Explore all),
 * and re-inserts it when the user returns (including bfcache). See index.html markup.
 */

const REVIEWS_SELECTOR = "#mainContent .home-section--reviews";

/** @type {HTMLElement | null} */
let detachedReviews = null;
/** @type {Comment | null} */
let reviewsMarker = null;

function detachHomeReviews() {
  if (detachedReviews) return;
  const el = document.querySelector(REVIEWS_SELECTOR);
  if (!el || !el.parentNode) return;
  const marker = document.createComment("qlist-home-reviews");
  el.parentNode.insertBefore(marker, el);
  detachedReviews = el;
  reviewsMarker = marker;
  el.remove();
}

function restoreHomeReviews() {
  if (!detachedReviews || !reviewsMarker || !reviewsMarker.parentNode) {
    detachedReviews = null;
    reviewsMarker = null;
    return;
  }
  reviewsMarker.parentNode.insertBefore(detachedReviews, reviewsMarker);
  reviewsMarker.remove();
  detachedReviews = null;
  reviewsMarker = null;
}

function isBareExploreHref(href) {
  if (!href || typeof href !== "string") return false;
  try {
    const u = new URL(href, window.location.href);
    const path = (u.pathname || "").replace(/\/$/, "") || "/";
    const isExplorePath =
      path === "/explore" || path.endsWith("/explore") || /\/explore\.html$/i.test(u.pathname);
    if (!isExplorePath) return false;
    const c = (u.searchParams.get("category") || "").trim();
    return !c;
  } catch (_e) {
    return false;
  }
}

function shouldIgnoreNavigateClick(e, anchor) {
  return (
    e.defaultPrevented ||
    e.button !== 0 ||
    e.metaKey ||
    e.ctrlKey ||
    e.shiftKey ||
    e.altKey ||
    anchor.getAttribute("download") != null ||
    String(anchor.getAttribute("rel") || "")
      .toLowerCase()
      .split(/\s+/)
      .includes("external")
  );
}

function init() {
  if (!document.getElementById("mainContent")) return;

  document.addEventListener(
    "click",
    function (e) {
      const a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
      if (!a || shouldIgnoreNavigateClick(e, a)) return;
      const href = a.getAttribute("href");
      if (!isBareExploreHref(href)) return;
      if (a.target === "_blank") return;
      detachHomeReviews();
    },
    true,
  );

  window.addEventListener("pageshow", function () {
    restoreHomeReviews();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}

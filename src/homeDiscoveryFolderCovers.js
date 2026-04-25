/**
 * Fills home discovery row "View all" folder collages with reliable demo cover URLs.
 * (Place cards in the static shell often have no `img.place-card__cover`, so copying from cards leaves src empty.)
 */

const UNSPLASH_QS = "?auto=format&fit=crop&w=400&q=80";

const FOLDER_DEMO_COVERS = {
  barbershop: [
    `https://images.unsplash.com/photo-1503951914875-452162b0f3f1${UNSPLASH_QS}`,
    `https://images.unsplash.com/photo-1503951458645-643d53d2c407${UNSPLASH_QS}`,
    `https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f${UNSPLASH_QS}`,
  ],
  spa: [
    `https://images.unsplash.com/photo-1544161515-4ab6ce6db874${UNSPLASH_QS}`,
    `https://images.unsplash.com/photo-1519823551278-64ac92734fb1${UNSPLASH_QS}`,
    `https://images.unsplash.com/photo-1500336624523-d727130c3328${UNSPLASH_QS}`,
  ],
  nails: [
    `https://images.unsplash.com/photo-1604654894610-df63bc536371${UNSPLASH_QS}`,
    `https://images.unsplash.com/photo-1519014816548-bf646fa2112d${UNSPLASH_QS}`,
    `https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9${UNSPLASH_QS}`,
  ],
  fitness: [
    `https://images.unsplash.com/photo-1534438327276-14e5300c3a48${UNSPLASH_QS}`,
    `https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b${UNSPLASH_QS}`,
    `https://images.unsplash.com/photo-1517649763962-0c62306601b7${UNSPLASH_QS}`,
  ],
};

const COVER_IMG_CLASS = "home-discovery-folder__cover w-24 h-20 object-cover rounded-xl";

function categoryKeyFromFolder(folder) {
  try {
    const href = folder.getAttribute("href") || "";
    const u = new URL(href, typeof window !== "undefined" ? window.location.origin : "https://example.com");
    const raw = (u.searchParams.get("category") || "").toLowerCase();
    if (raw && FOLDER_DEMO_COVERS[raw]) return raw;
  } catch (e) {
    /* ignore */
  }
  return null;
}

function fillHomeDiscoveryFolders() {
  document.querySelectorAll("[data-home-category-folder]").forEach(function (folder) {
    if (!(folder instanceof HTMLElement)) return;
    const key = categoryKeyFromFolder(folder);
    const demos = key ? FOLDER_DEMO_COVERS[key] : null;
    const covers = folder.querySelectorAll(".home-discovery-folder__cover");
    const viewport = folder.closest(".home-discovery-row__viewport");
    const cards = viewport ? viewport.querySelectorAll(".place-card") : [];

    for (let i = 0; i < covers.length; i++) {
      const el = covers[i];
      if (!(el instanceof HTMLImageElement)) continue;

      el.className = `${COVER_IMG_CLASS} home-discovery-folder__cover--${i}`;

      let src = demos && demos[i] ? demos[i] : "";
      if (!src && cards[i]) {
        const srcImg = cards[i].querySelector("img.place-card__cover");
        const fromCard = srcImg && srcImg.getAttribute("src");
        if (fromCard && /^https?:\/\//i.test(fromCard.trim())) {
          src = fromCard.trim();
        }
      }
      if (src) {
        el.setAttribute("src", src);
        el.setAttribute("alt", "");
        el.setAttribute("width", "96");
        el.setAttribute("height", "80");
      }
    }
  });
}

function init() {
  fillHomeDiscoveryFolders();
  window.addEventListener("load", fillHomeDiscoveryFolders, { once: true });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
}

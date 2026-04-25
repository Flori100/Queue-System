import { createHomeDiscoveryFolderElement } from "./homeDiscoveryFolderCard.js";

/**
 * Keeps each browse-row viewport as one logical strip: business cards, then the folder tile.
 * Renders via a single `.map()` over a combined array (cards + folder sentinel).
 */
export function ensureHomeDiscoveryBrowseRows() {
  const root = document.getElementById("home-discovery-browse-rows");
  if (!root) return;

  const viewports = root.querySelectorAll(".home-discovery-row__viewport");
  for (let i = 0; i < viewports.length; i++) {
    const vp = viewports[i];
    if (!(vp instanceof HTMLElement)) continue;
    const row = vp.closest(".home-discovery-row");
    const isTrendingPopularRow = row instanceof HTMLElement && row.id === "home-trending-popular";

    const cards = Array.from(vp.querySelectorAll(":scope > .place-card"));
    let folder = vp.querySelector(":scope > [data-home-category-folder]");
    const canonical =
      (cards[0] && cards[0].getAttribute("data-category")) ||
      (folder && folder.getAttribute("data-home-folder-category")) ||
      "";

    if (isTrendingPopularRow) {
      vp.replaceChildren(...cards);
      continue;
    }

    if (!(folder instanceof HTMLAnchorElement) && canonical) {
      folder = createHomeDiscoveryFolderElement(canonical, {
        label: "View all",
        overlayText: "View all",
      });
      vp.appendChild(folder);
    }

    if (!(folder instanceof HTMLElement) || cards.length === 0) continue;

    const titleEl = row && row.querySelector(".home-discovery-row__title");
    const titleText = titleEl && titleEl.textContent ? titleEl.textContent.trim() : "";

    const items = [...cards, folder];
    vp.replaceChildren(
      ...items.map(function (el) {
        if (el === folder && titleText && !el.hasAttribute("data-home-static-folder-overlay")) {
          const ov = el.querySelector(".home-discovery-folder__overlay-text");
          if (ov) ov.textContent = `View all ${titleText}`;
        }
        return el;
      }),
    );
  }
}

function bootBrowse() {
  ensureHomeDiscoveryBrowseRows();
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootBrowse, { once: true });
  } else {
    bootBrowse();
  }
}

/**
 * "Browse by category" tiles: open unified search results (`/search?category=…`) for that category only.
 */

import { categoryPageHrefForCanonicalCategory } from "./businessesData.js";

function init() {
  const buttons = document.querySelectorAll(".home-category-grid [data-browse-category]");
  for (let i = 0; i < buttons.length; i++) {
    const btn = buttons[i];
    if (!(btn instanceof HTMLButtonElement)) continue;
    if (btn.dataset.qlistBrowseBound === "1") continue;
    btn.dataset.qlistBrowseBound = "1";
    btn.addEventListener("click", function () {
      const value = btn.getAttribute("data-browse-category") || "";
      window.location.assign(categoryPageHrefForCanonicalCategory(value));
    });
  }
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
}

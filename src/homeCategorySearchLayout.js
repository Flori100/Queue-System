/**
 * When a service category is selected from the hero picker, replaces the default
 * home browse rail with up to three focused rails (Trending, New, Most popular)
 * for that category only, and suppresses unrelated home sections.
 *
 * Listings are filtered by distance to the user anchor (browser location, typed city,
 * or Tirana demo default), sorted nearest first with rating as tie-breaker.
 */

import { createHomeDiscoveryFolderElement } from "./homeDiscoveryFolderCard.js";
import { haversineKm } from "./geoDistance.js";
import {
  getAnchorForCategoryLayout,
  getPinnedUserLocation,
  getRadiusKm,
  setRadiusKm,
} from "./userProximityContext.js";

const MAIN_ID = "mainContent";
const BROWSE_ID = "home-discovery-browse-rows";
const FILTER_STACK_ID = "home-category-filter-rows";
const VP_TREND = "home-filter-viewport-trending";
const VP_NEW = "home-filter-viewport-new";
const VP_POP = "home-filter-viewport-popular";
const ROW_TREND = "home-filter-row-trending";
const ROW_NEW = "home-filter-row-new";
const ROW_POP = "home-filter-row-popular";

/** @type {Map<HTMLElement, HTMLElement[]> | null} */
let originalOrder = null;

let applying = false;

function getActiveCategory() {
  const combo = document.getElementById("services-picker-combobox");
  return (combo && combo.getAttribute("data-active-category")) || "";
}

function captureOriginalOrder() {
  const browse = document.getElementById(BROWSE_ID);
  if (!browse) return;
  /** @type {Map<HTMLElement, HTMLElement[]>} */
  const map = new Map();
  const vps = browse.querySelectorAll(".home-discovery-row__viewport");
  for (let i = 0; i < vps.length; i++) {
    const vp = vps[i];
    if (!(vp instanceof HTMLElement)) continue;
    map.set(vp, Array.from(vp.querySelectorAll(":scope > *")));
  }
  originalOrder = map;
}

function restoreBrowseCards() {
  if (!originalOrder) return;
  originalOrder.forEach(function (cards, vp) {
    vp.replaceChildren.apply(vp, cards);
  });
}

function clearFilterViewports() {
  const a = document.getElementById(VP_TREND);
  const b = document.getElementById(VP_NEW);
  const c = document.getElementById(VP_POP);
  if (a) a.replaceChildren();
  if (b) b.replaceChildren();
  if (c) c.replaceChildren();
}

function parseRating(card) {
  const el = card.querySelector(".place-card__rating");
  if (!el) return 0;
  const m = el.textContent.match(/(\d+\.\d+|\d+)/);
  return m ? parseFloat(m[1]) : 0;
}

/** @param {HTMLElement} card @returns {{ lat: number; lng: number } | null} */
function parseDataLatLng(card) {
  const lat = parseFloat(card.getAttribute("data-lat") || "");
  const lng = parseFloat(card.getAttribute("data-lng") || "");
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function categoryNearLabel(cat) {
  const u = String(cat || "");
  if (u === "Barbershop") return "Barbers";
  if (u === "HairSalon") return "Hair salons";
  if (u === "Nails") return "Nail studios";
  if (u === "Fitness") return "Gyms & fitness";
  if (u === "Spa") return "Spas";
  if (u === "Dentist") return "Dentists";
  if (u === "Dermatology") return "Dermatologists";
  if (u === "Taxi") return "Taxi & rides";
  return u;
}

function shortPlaceName(full) {
  const s = String(full || "")
    .split(",")[0]
    .trim();
  return s || String(full || "").trim();
}

/**
 * @param {HTMLElement[]} pool
 * @param {{ lat: number; lng: number }} anchor
 * @param {number} radiusKm
 * @returns {{ trending: HTMLElement[]; neww: HTMLElement[]; popular: HTMLElement[]; visibleCount: number }}
 */
function segmentPoolByProximity(pool, anchor, radiusKm) {
  /** @type {{ card: HTMLElement; distKm: number; rating: number }[]} */
  const scored = [];
  for (let i = 0; i < pool.length; i++) {
    const card = pool[i];
    const ll = parseDataLatLng(card);
    if (!ll) continue;
    const distKm = haversineKm(anchor.lat, anchor.lng, ll.lat, ll.lng);
    if (distKm > radiusKm) continue;
    scored.push({ card, distKm, rating: parseRating(card) });
  }
  scored.sort(function (a, b) {
    if (a.distKm !== b.distKm) return a.distKm - b.distKm;
    return b.rating - a.rating;
  });
  const sorted = scored.map(function (s) {
    return s.card;
  });
  return {
    trending: sorted.slice(0, 8),
    neww: sorted.slice(8, 16),
    popular: sorted.slice(16, 24),
    visibleCount: sorted.length,
  };
}

function getPoolForCategory(category) {
  if (!originalOrder || !category) return [];
  /** @type {HTMLElement[]} */
  const out = [];
  originalOrder.forEach(function (children) {
    for (let i = 0; i < children.length; i++) {
      const c = children[i];
      if (!(c instanceof HTMLElement)) continue;
      if (!c.classList.contains("place-card")) continue;
      if ((c.getAttribute("data-category") || "") === category) {
        out.push(c);
      }
    }
  });
  return out;
}

function setRowVisible(rowId, visible) {
  const row = document.getElementById(rowId);
  if (!row) return;
  if (visible) {
    row.removeAttribute("hidden");
  } else {
    row.setAttribute("hidden", "");
  }
}

/**
 * @param {object} opts
 * @param {string} opts.category
 * @param {string} opts.label
 * @param {number} opts.rawPoolLen
 * @param {number} opts.visibleCount
 * @param {{ lat: number; lng: number; label: string }} opts.anchor
 * @param {number} opts.radiusKm
 */
function updateCategoryChrome(opts) {
  const category = opts.category;
  const label = opts.label;
  const rawPoolLen = opts.rawPoolLen;
  const visibleCount = opts.visibleCount;
  const anchor = opts.anchor;
  const radiusKm = opts.radiusKm;

  const locEl = document.getElementById("home-category-location-context");
  const intro = document.getElementById("home-category-search-intro");
  const empty = document.getElementById("home-category-search-empty");
  const chips = document.getElementById("home-radius-filter-chips");

  const pin = getPinnedUserLocation();

  if (locEl) {
    if (!category || rawPoolLen === 0) {
      locEl.setAttribute("hidden", "");
      locEl.textContent = "";
    } else {
      locEl.removeAttribute("hidden");
      let line = "";
      if (pin && pin.source === "geo") {
        line = `Near you · within ${radiusKm} km`;
      } else if (pin && pin.source === "search") {
        line = `${categoryNearLabel(category)} near ${shortPlaceName(pin.label)} · within ${radiusKm} km`;
      } else {
        line = `Enable location or enter a city to see nearby businesses — demo results within ${radiusKm} km of ${anchor.label}.`;
      }
      locEl.textContent = line;
    }
  }

  if (intro) {
    if (category && visibleCount > 0) {
      intro.removeAttribute("hidden");
      intro.textContent = "";
      const lead = document.createTextNode("Showing ");
      const strong = document.createElement("strong");
      strong.textContent = label || category;
      const tail = document.createTextNode(
        " — nearest listings first, then new and highly rated picks nearby."
      );
      intro.appendChild(lead);
      intro.appendChild(strong);
      intro.appendChild(tail);
    } else {
      intro.setAttribute("hidden", "");
      intro.textContent = "";
    }
  }

  if (empty) {
    if (!category) {
      empty.setAttribute("hidden", "");
      empty.textContent = "";
    } else if (rawPoolLen === 0) {
      empty.removeAttribute("hidden");
      empty.textContent =
        "No businesses in this category on the home demo yet. Try another category or clear the search.";
    } else if (visibleCount === 0) {
      empty.removeAttribute("hidden");
      empty.textContent = `No businesses in this category within ${radiusKm} km of ${anchor.label}. Try a wider radius or another area.`;
    } else {
      empty.setAttribute("hidden", "");
      empty.textContent = "";
    }
  }

  if (chips) {
    if (category && rawPoolLen > 0) {
      chips.removeAttribute("hidden");
      const r = radiusKm;
      const btns = chips.querySelectorAll("[data-radius-km]");
      for (let b = 0; b < btns.length; b++) {
        const btn = btns[b];
        if (!(btn instanceof HTMLElement)) continue;
        const v = parseInt(btn.getAttribute("data-radius-km") || "", 10);
        btn.classList.toggle("home-radius-chip--active", v === r);
        btn.setAttribute("aria-pressed", v === r ? "true" : "false");
      }
    } else {
      chips.setAttribute("hidden", "");
    }
  }
}

function relayoutCarousels() {
  window.dispatchEvent(new Event("resize"));
  window.requestAnimationFrame(function () {
    window.requestAnimationFrame(function () {
      window.dispatchEvent(new Event("resize"));
    });
  });
}

function wireRadiusChipsOnce() {
  const wrap = document.getElementById("home-radius-filter-chips");
  if (!wrap || wrap.dataset.wired === "1") return;
  wrap.dataset.wired = "1";
  wrap.addEventListener("click", function (e) {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    const btn = t.closest("[data-radius-km]");
    if (!(btn instanceof HTMLElement)) return;
    const km = parseInt(btn.getAttribute("data-radius-km") || "", 10);
    if (km !== 5 && km !== 10 && km !== 20) return;
    setRadiusKm(/** @type {5 | 10 | 20} */ (km));
  });
}

function applyCategoryFocus() {
  const main = document.getElementById(MAIN_ID);
  const browse = document.getElementById(BROWSE_ID);
  const filterStack = document.getElementById(FILTER_STACK_ID);
  const vpTrend = document.getElementById(VP_TREND);
  const vpNew = document.getElementById(VP_NEW);
  const vpPop = document.getElementById(VP_POP);
  if (!main || !browse || !filterStack || !vpTrend || !vpNew || !vpPop) return;

  const category = getActiveCategory();
  const input = document.getElementById("services-picker-input");
  const label = (input && input.value.trim()) || category;

  if (!category) {
    main.classList.remove("main--category-search-focus");
    browse.removeAttribute("hidden");
    filterStack.setAttribute("hidden", "");
    restoreBrowseCards();
    clearFilterViewports();
    setRowVisible(ROW_TREND, false);
    setRowVisible(ROW_NEW, false);
    setRowVisible(ROW_POP, false);
    updateCategoryChrome({
      category: "",
      label: "",
      rawPoolLen: 0,
      visibleCount: 0,
      anchor: { lat: 0, lng: 0, label: "" },
      radiusKm: getRadiusKm(),
    });
    relayoutCarousels();
    return;
  }

  if (!originalOrder) {
    captureOriginalOrder();
  }

  restoreBrowseCards();
  clearFilterViewports();

  const pool = getPoolForCategory(category);
  const anchor = getAnchorForCategoryLayout();
  const radiusKm = getRadiusKm();
  const parts = segmentPoolByProximity(pool, anchor, radiusKm);

  main.classList.add("main--category-search-focus");
  browse.setAttribute("hidden", "");
  filterStack.removeAttribute("hidden");

  updateCategoryChrome({
    category,
    label,
    rawPoolLen: pool.length,
    visibleCount: parts.visibleCount,
    anchor,
    radiusKm,
  });

  if (pool.length === 0 || parts.visibleCount === 0) {
    filterStack.setAttribute("hidden", "");
    setRowVisible(ROW_TREND, false);
    setRowVisible(ROW_NEW, false);
    setRowVisible(ROW_POP, false);
    relayoutCarousels();
    return;
  }

  function withTrailingFolder(cards) {
    if (cards.length === 0) return [];
    const folder = createHomeDiscoveryFolderElement(category, {
      label: "View all",
      overlayText: `View all ${category}`,
    });
    return [...cards, folder];
  }

  vpTrend.replaceChildren.apply(vpTrend, withTrailingFolder(parts.trending));
  vpNew.replaceChildren.apply(vpNew, withTrailingFolder(parts.neww));
  vpPop.replaceChildren.apply(vpPop, withTrailingFolder(parts.popular));

  setRowVisible(ROW_TREND, parts.trending.length > 0);
  setRowVisible(ROW_NEW, parts.neww.length > 0);
  setRowVisible(ROW_POP, parts.popular.length > 0);

  relayoutCarousels();
}

function onFiltersChanged() {
  if (applying) return;
  applying = true;
  try {
    applyCategoryFocus();
  } finally {
    applying = false;
  }
}

function boot() {
  if (!document.getElementById(MAIN_ID)) return;
  captureOriginalOrder();
  wireRadiusChipsOnce();
  document.addEventListener("qlist:filters-changed", onFiltersChanged);
  document.addEventListener("qlist:proximity-changed", onFiltersChanged);
  onFiltersChanged();
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
}

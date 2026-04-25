import "./categoryListingCards.css";
import {
  BUSINESS_ROWS,
  exploreSlugToCanonicalCategory,
  resolveBusiness,
} from "./businessesData.js";
import { getDemoListingsForCategoryPage } from "./demo/categoryDemoListings.js";
import "./businessFavorites.js";
import { disposeCategoryMap, mountCategoryLeafletMap } from "./categoryLeafletMap.js";
import "./heroLocationQuery.js";
import { initSearchBar } from "./searchBarInit.js";
import { initServicesPicker } from "./serviceCategoryFilter.js";
import { initCurrentLocationPicker } from "./currentLocation.js";
import { initDatePicker } from "./datePickerInit.js";
import { getPinnedUserLocation } from "./userProximityContext.js";
import { haversineKm } from "./geoDistance.js";

/** Same label mix as homepage discover carousels (badges vary per card). */
const LISTING_BADGES = [
  "Top rated",
  "New",
  "Editor’s pick",
  "Popular",
  "Classic",
  "Staff pick",
];

function titleForCategory(canonical) {
  if (canonical === "Spa") return "Spa & massage";
  if (canonical === "Fitness") return "Gym / Fitness";
  if (canonical === "HairSalon") return "Hair salon";
  if (canonical === "Dentist") return "Dentist";
  if (canonical === "Dermatology") return "Dermatology";
  return canonical || "Category";
}

function buildCard(row, index) {
  const b = resolveBusiness(row.id);
  if (!b) return null;
  const article = document.createElement("article");
  article.className =
    "place-card rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200";
  article.setAttribute("data-business-id", b.id);
  article.setAttribute("data-id", b.id);
  article.setAttribute("data-category", b.category);
  article.setAttribute("data-city", b.city);
  if (typeof b.lat === "number" && typeof b.lng === "number") {
    article.setAttribute("data-lat", String(b.lat));
    article.setAttribute("data-lng", String(b.lng));
  }
  const areaLine = String(b.address || "").split(",")[0]?.trim();
  if (areaLine) {
    article.setAttribute("data-area-label", areaLine);
  }

  const image = document.createElement("div");
  image.className = "place-card__image";
  const badge = document.createElement("span");
  badge.className = "place-card__badge";
  const i = typeof index === "number" && !isNaN(index) ? index : 0;
  badge.textContent = LISTING_BADGES[i % LISTING_BADGES.length];
  image.appendChild(badge);

  const body = document.createElement("div");
  body.className = "place-card__body";
  const rowEl = document.createElement("div");
  rowEl.className = "place-card__row";

  const h4 = document.createElement("h4");
  h4.className = "place-card__name";
  h4.textContent = b.name;

  const rating = document.createElement("span");
  rating.className = "place-card__rating";
  rating.title = `${b.averageRating} out of 5`;
  rating.innerHTML =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>';
  rating.appendChild(document.createTextNode(String(b.averageRating)));

  rowEl.appendChild(h4);
  rowEl.appendChild(rating);

  const meta = document.createElement("p");
  meta.className = "place-card__meta";
  meta.textContent = b.description || "";

  const tags = document.createElement("div");
  tags.className = "place-card__tags";

  body.appendChild(rowEl);
  body.appendChild(meta);
  body.appendChild(tags);
  article.appendChild(image);
  article.appendChild(body);
  return article;
}

function ensurePlaceCardCover(card) {
  const wrap = card.querySelector(".place-card__image");
  if (!wrap) return;
  const id = card.getAttribute("data-business-id");
  const b = id ? resolveBusiness(id) : null;
  let img = wrap.querySelector("img.place-card__cover");
  if (!img) {
    img = document.createElement("img");
    img.className = "place-card__cover";
    img.setAttribute("width", "720");
    img.setAttribute("height", "540");
    img.setAttribute("loading", "lazy");
    img.setAttribute("decoding", "async");
    wrap.prepend(img);
  }
  const nameEl = card.querySelector(".place-card__name");
  img.setAttribute(
    "alt",
    nameEl && nameEl.textContent ? nameEl.textContent.trim() + " — cover" : "Place cover image",
  );
  img.removeAttribute("data-cover-fallback");
  img.onerror = null;
  const primary = b && b.coverImage ? String(b.coverImage).trim() : "";
  if (primary) {
    img.src = primary;
  }
}

/**
 * @param {number} v
 * @param {number} lo
 * @param {number} hi
 */
/**
 * Lat/lng for map — current category rows only.
 * @param {ReadonlyArray<{ id: string }>} rows
 * @returns {Array<{ id: string; lat: number; lng: number; name: string }>}
 */
function collectCategoryMapPoints(rows) {
  const points = [];
  for (let i = 0; i < rows.length; i++) {
    const b = resolveBusiness(rows[i].id);
    if (!b || typeof b.lat !== "number" || typeof b.lng !== "number") continue;
    if (!Number.isFinite(b.lat) || !Number.isFinite(b.lng)) continue;
    points.push({ id: b.id, lat: b.lat, lng: b.lng, name: b.name });
  }
  return points;
}

function popularityScoreForBusiness(business) {
  if (!business) return 0;
  const reviewCount = Number(business.reviewCount || 0);
  const avgRating = Number(business.averageRating || 0);
  return reviewCount * 2 + avgRating * 10;
}

function renderCategoryPageLayout(mainEl) {
  if (!mainEl) return;
  mainEl.innerHTML = `
    <header class="category-top">
      <a href="./index.html" class="category-back">← Back to home</a>
      <h1 class="category-title" id="category-page-title">Category</h1>
      <div class="hero-search-shell w-full" id="hero-search-shell">
        <div class="hero-search-host flex w-full justify-start" id="hero-search-host">
          <div id="hero-search-bar-anchor" class="hero-search-bar-anchor" aria-hidden="true"></div>
          <div class="search-bar search-bar--hero">
          <form
            id="hero-search-bar"
            class="flex w-full items-center"
            role="search"
            aria-label="Find appointments"
            onsubmit="event.preventDefault()"
          >
            <div class="services-picker-wrap">
              <div class="search-field services-picker-combo" id="services-picker-combobox">
                <svg class="search-field__icon w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="7"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="text"
                  class="services-picker-input"
                  id="services-picker-input"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded="false"
                  aria-controls="services-picker-dropdown"
                  aria-haspopup="listbox"
                  aria-label="Service category"
                  autocomplete="off"
                  spellcheck="false"
                  placeholder="All services"
                  data-placeholder-expanded="All services"
                  data-placeholder-compact="Service"
                />
                <div class="services-picker-suffix">
                  <button
                    type="button"
                    class="services-picker-clear-btn"
                    id="services-picker-clear"
                    hidden
                    aria-label="Clear category search"
                    tabindex="-1"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="services-picker-chevron-btn"
                    id="services-picker-chevron"
                    aria-label="Browse all categories"
                    tabindex="-1"
                  >
                    <svg class="search-field__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                </div>
              </div>
              <div
                class="services-picker-dropdown"
                id="services-picker-dropdown"
                role="listbox"
                aria-labelledby="services-picker-input"
                aria-hidden="true"
              >
                <ul class="services-picker-dropdown__list" id="services-picker-list"></ul>
              </div>
            </div>
            <div class="hero-location-query-wrap">
              <input
                type="text"
                id="hero-location-query"
                class="hero-location-query"
                placeholder="City or area"
                aria-label="City or area"
                autocomplete="address-level2"
                maxlength="120"
              />
            </div>
            <div class="current-location-wrap">
              <button
                type="button"
                class="search-field current-location-btn"
                id="current-location-btn"
                aria-label="Filter businesses by your current city. Click again to show all."
              >
                <svg class="search-field__icon w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span class="search-field__label-stack">
                  <span class="search-field__text search-field__text--sticky-full">Current location</span>
                  <span class="search-field__text search-field__text--sticky-compact" aria-hidden="true">Location</span>
                </span>
              </button>
              <div
                class="location-preview-card rounded-2xl"
                id="location-preview-card"
                hidden
                aria-live="polite"
              >
                <div class="location-preview-card__map">
                  <div
                    id="location-preview-map"
                    role="img"
                    aria-label="Map centered on your location"
                  ></div>
                </div>
                <p class="location-preview-card__label" id="location-preview-label"></p>
              </div>
            </div>
            <div class="date-picker-wrap">
              <button
                type="button"
                class="search-field"
                id="date-picker-btn"
                aria-haspopup="dialog"
                aria-expanded="false"
                aria-controls="date-picker-dropdown"
                aria-label="Choose appointment date. Any time."
              >
                <svg class="search-field__icon w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span class="search-field__label-stack">
                  <span class="search-field__text search-field__text--sticky-full" id="date-picker-label-full">Any time</span>
                  <span class="search-field__text search-field__text--sticky-compact" id="date-picker-label-compact" aria-hidden="true">Time</span>
                </span>
              </button>
              <div
                class="date-picker-dropdown"
                id="date-picker-dropdown"
                role="dialog"
                aria-modal="false"
                aria-label="Select a date"
                hidden
              >
                <div class="date-picker__header">
                  <button type="button" class="date-picker__nav" id="date-picker-prev" aria-label="Previous month">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>
                  <div class="date-picker__month-year">
                    <label class="visually-hidden" for="date-picker-month">Month</label>
                    <select id="date-picker-month" class="date-picker__select" aria-label="Month"></select>
                    <label class="visually-hidden" for="date-picker-year">Year</label>
                    <select id="date-picker-year" class="date-picker__select" aria-label="Year"></select>
                  </div>
                  <button type="button" class="date-picker__nav" id="date-picker-next" aria-label="Next month">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </div>
                <div class="date-picker__weekdays" aria-hidden="true">
                  <span class="date-picker__weekday">Sun</span>
                  <span class="date-picker__weekday">Mon</span>
                  <span class="date-picker__weekday">Tue</span>
                  <span class="date-picker__weekday">Wed</span>
                  <span class="date-picker__weekday">Thu</span>
                  <span class="date-picker__weekday">Fri</span>
                  <span class="date-picker__weekday">Sat</span>
                </div>
                <div class="date-picker__grid" id="date-picker-grid" role="grid" aria-label="Days"></div>
              </div>
            </div>
            <button
              type="submit"
              class="search-btn search-btn--icon bg-cta flex shrink-0 items-center justify-center rounded-full self-center text-cta-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Search"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <span class="visually-hidden">Search</span>
            </button>
          </form>
          </div>
        </div>
      </div>
      <p id="category-page-empty" class="category-page-empty" hidden role="status"></p>
    </header>
    <section class="category-controls" aria-label="Sort and filters">
      <label class="category-sort">
        Sort
        <select id="category-sort">
          <option value="top-rated">Top rated</option>
          <option value="nearest">Nearest</option>
          <option value="most-popular">Most popular</option>
        </select>
      </label>
      <div class="category-chip-row" role="group" aria-label="Quick filters">
        <button type="button" class="category-chip" data-chip-filter="distance-5">Within 5km</button>
        <button type="button" class="category-chip" data-chip-filter="distance-10">Within 10km</button>
        <button type="button" class="category-chip" data-chip-filter="distance-20">Within 20km</button>
        <button type="button" class="category-chip" data-chip-filter="rating-45">Rating 4.5+</button>
        <button type="button" class="category-chip" data-chip-filter="available-today">Available today</button>
        <button type="button" class="category-clear-filters" id="category-clear-filters" disabled>Clear filters</button>
      </div>
    </section>
    <div class="category-split">
      <div id="mainContent">
        <p id="category-result-feedback" class="category-result-feedback" aria-live="polite">0 results found</p>
        <div id="category-page-grid" class="category-grid qlist-trending-place-cards" aria-live="polite"></div>
      </div>
      <aside class="category-map" aria-label="Map of businesses in this category">
        <div
          id="map"
          class="category-map__canvas"
          role="application"
          aria-label="Map of listings in this category"
        ></div>
        <p id="category-page-map-caption" class="category-map__caption">Map</p>
      </aside>
    </div>
  `;
}

function run() {
  const main = document.querySelector("main.category-shell");
  if (!main) return;
  const hasExistingLayout =
    !!main.querySelector("#hero-search-bar") &&
    !!main.querySelector("#category-page-grid") &&
    !!main.querySelector("#mainContent");
  if (!hasExistingLayout) {
    renderCategoryPageLayout(main);
  }

  const params = new URLSearchParams(window.location.search);
  const slug = (params.get("category") || "").trim().toLowerCase();
  const canonical = exploreSlugToCanonicalCategory(slug);

  const titleEl = document.getElementById("category-page-title");
  const emptyEl = document.getElementById("category-page-empty");
  const grid = document.getElementById("category-page-grid");
  const mapCaption = document.getElementById("category-page-map-caption");
  const mapHost = document.getElementById("map");
  const sortEl = document.getElementById("category-sort");
  const chipEls = document.querySelectorAll(".category-chip");
  const clearFiltersEl = document.getElementById("category-clear-filters");
  const resultFeedbackEl = document.getElementById("category-result-feedback");

  if (!titleEl || !grid) return;

  if (!canonical) {
    document.title = "Search – QList";
    titleEl.textContent = "Pick a category";
    if (emptyEl) {
      emptyEl.hidden = false;
      emptyEl.textContent =
        "Add ?category= to the URL (for example /search?category=barbershop), or use Browse by category / View all on the home page.";
    }
    grid.innerHTML = "";
    if (mapCaption) mapCaption.textContent = "Map";
    if (mapHost) {
      disposeCategoryMap();
      mapHost.innerHTML = "";
      mapHost.hidden = true;
    }
    if (resultFeedbackEl) resultFeedbackEl.textContent = "0 results found";
    return;
  }

  document.title = titleForCategory(canonical) + " – QList";
  titleEl.textContent = titleForCategory(canonical);
  const rows =
    canonical === "Taxi"
      ? BUSINESS_ROWS.filter((r) => r.category === "Taxi")
      : getDemoListingsForCategoryPage(canonical);
  const rowBusinesses = rows.map((row) => ({ row, business: resolveBusiness(row.id) }));
  function selectedCategoryFromPicker() {
    const combo = document.getElementById("services-picker-combobox");
    if (!combo) return "";
    const v = combo.getAttribute("data-active-category") || "";
    return String(v).trim();
  }

  function applyCategorySelection(entries) {
    const selected = selectedCategoryFromPicker();
    if (!selected) return entries;
    return entries.filter((entry) => String(entry.business?.category || "").trim() === selected);
  }

  const initialPin = getPinnedUserLocation();
  let currentLocationLabel = initialPin ? String(initialPin.label || "").split(",")[0].trim() : "";

  function sortEntries(entries) {
    const mode = sortEl ? sortEl.value : "top-rated";
    const copy = entries.slice();
    if (mode === "nearest") {
      // UI-only nearest proxy without live geolocation/backend.
      copy.sort((a, b) => String(a.business?.city || "").localeCompare(String(b.business?.city || "")));
      return copy;
    }
    if (mode === "most-popular") {
      copy.sort(
        (a, b) => popularityScoreForBusiness(b.business) - popularityScoreForBusiness(a.business),
      );
      return copy;
    }
    copy.sort((a, b) => Number(b.business?.averageRating || 0) - Number(a.business?.averageRating || 0));
    return copy;
  }

  function getActiveChipFilters() {
    const active = [];
    for (let i = 0; i < chipEls.length; i++) {
      if (!chipEls[i].classList.contains("is-active")) continue;
      const id = chipEls[i].getAttribute("data-chip-filter");
      if (id) active.push(id);
    }
    return active;
  }

  function applyMockChipFilters(entries) {
    const activeFilters = getActiveChipFilters();
    if (!activeFilters.length) return entries;
    const reductionByCount = activeFilters.length * 2;
    let keepCount = Math.max(entries.length - reductionByCount, 0);
    if (activeFilters.includes("available-today")) {
      keepCount = Math.max(keepCount - 1, 0);
    }
    return entries.slice(0, keepCount);
  }

  function applyLocationSelection(entries) {
    const pin = getPinnedUserLocation();
    if (!pin) return entries;
    const withDistance = [];
    for (let i = 0; i < entries.length; i++) {
      const row = entries[i];
      const b = row.business;
      if (!b || typeof b.lat !== "number" || typeof b.lng !== "number") continue;
      if (!Number.isFinite(b.lat) || !Number.isFinite(b.lng)) continue;
      withDistance.push({
        ...row,
        distanceKm: haversineKm(pin.lat, pin.lng, b.lat, b.lng),
      });
    }
    withDistance.sort(function (a, b) {
      const d = Number(a.distanceKm || 0) - Number(b.distanceKm || 0);
      if (d !== 0) return d;
      return Number(b.business?.averageRating || 0) - Number(a.business?.averageRating || 0);
    });
    const keep = Math.max(4, Math.min(12, withDistance.length));
    return withDistance.slice(0, keep);
  }

  function updateTitleForLocation() {
    const base = titleForCategory(canonical);
    if (!titleEl) return;
    if (!currentLocationLabel) {
      titleEl.textContent = base;
      document.title = base + " – QList";
      return;
    }
    titleEl.textContent = base + " in " + currentLocationLabel;
    document.title = base + " in " + currentLocationLabel + " – QList";
  }

  function pluralizeCategoryResultName(count) {
    const label = String(titleForCategory(canonical) || "Result").trim().toLowerCase();
    if (count === 1) {
      return label.endsWith("s") ? label.slice(0, -1) : label;
    }
    return label.endsWith("s") ? label : label + "s";
  }

  function renderListings() {
    const categoryFiltered = applyCategorySelection(rowBusinesses);
    const sorted = sortEntries(categoryFiltered);
    const withLocation = applyLocationSelection(sorted);
    const filtered = applyMockChipFilters(withLocation);
    grid.innerHTML = "";
    if (!categoryFiltered.length && emptyEl) {
      const selected = selectedCategoryFromPicker();
      emptyEl.hidden = false;
      emptyEl.textContent = selected
        ? "No listings match the selected category."
        : "No demo listings in this category yet. Pick another category from All categories or change the URL.";
    } else if (!rowBusinesses.length && emptyEl) {
      emptyEl.hidden = false;
      emptyEl.textContent =
        "No demo listings in this category yet. Pick another category from All categories or change the URL.";
    } else if (emptyEl) {
      emptyEl.hidden = true;
      emptyEl.textContent = "";
    }

    for (let i = 0; i < filtered.length; i++) {
      const el = buildCard(filtered[i].row, i);
      if (el) grid.appendChild(el);
    }
    const cards = grid.querySelectorAll(".place-card");
    for (let j = 0; j < cards.length; j++) {
      ensurePlaceCardCover(cards[j]);
    }

    if (mapHost) {
      disposeCategoryMap();
      mapHost.innerHTML = "";
    }
    if (resultFeedbackEl) {
      const resultName = pluralizeCategoryResultName(filtered.length);
      resultFeedbackEl.textContent = filtered.length + " " + resultName + " found";
    }

    if (!filtered.length) {
      if (mapCaption) mapCaption.textContent = "No pins — refine filters";
      if (mapHost) mapHost.hidden = true;
      return;
    }
    if (mapHost) mapHost.hidden = false;
    if (mapHost) {
      mountCategoryLeafletMap({
        containerEl: mapHost,
        captionEl: mapCaption,
        points: collectCategoryMapPoints(filtered.map((entry) => entry.row)),
        gridEl: grid,
        canonical,
      });
    }
  }

  function updateClearFiltersState() {
    if (!clearFiltersEl) return;
    let hasActiveChip = false;
    for (let i = 0; i < chipEls.length; i++) {
      if (chipEls[i].classList.contains("is-active")) {
        hasActiveChip = true;
        break;
      }
    }
    clearFiltersEl.disabled = !hasActiveChip;
  }

  if (sortEl) {
    sortEl.addEventListener("change", renderListings);
  }
  for (let i = 0; i < chipEls.length; i++) {
    chipEls[i].addEventListener("click", () => {
      chipEls[i].classList.toggle("is-active");
      updateClearFiltersState();
      renderListings();
    });
  }
  if (clearFiltersEl) {
    clearFiltersEl.addEventListener("click", () => {
      for (let i = 0; i < chipEls.length; i++) {
        chipEls[i].classList.remove("is-active");
      }
      updateClearFiltersState();
      renderListings();
    });
  }

  updateClearFiltersState();
  updateTitleForLocation();

  renderListings();

  document.addEventListener("qlist:proximity-changed", () => {
    const pin = getPinnedUserLocation();
    currentLocationLabel = pin ? String(pin.label || "").split(",")[0].trim() : "";
    updateTitleForLocation();
    renderListings();
  });

  document.addEventListener("qlist:filters-changed", renderListings);

  void import("./placeCardNav.js").then(function () {
    document.dispatchEvent(new Event("qlist:hv-cards-render"));
  });
}

function initCategorySearchControls() {
  initSearchBar();
  initServicesPicker();
  initCurrentLocationPicker();
  initDatePicker();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initCategorySearchControls();
    run();
  }, { once: true });
} else {
  initCategorySearchControls();
  run();
}

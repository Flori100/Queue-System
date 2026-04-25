import {
  clearPinnedUserLocation,
  getPinnedUserLocation,
  getRadiusKm,
  setPinnedUserLocation,
} from "./userProximityContext.js";
import { applyPinnedProximityToCards } from "./proximityCardVisibility.js";

const PREVIEW_HIDE_MS = 4000;

/** OSM raster tiles (staticmap.openstreetmap.de is often 503 — tiles are reliable for a page background). */
const OSM_TILE_BASE = "https://tile.openstreetmap.org";
const TIRANA_MAP_Z = 12;
/** 2×2 tile block around Tirana (41.3275, 19.8187) at zoom 12. */
const TIRANA_TILE_MOSAIC = [
  [2272, 1529],
  [2273, 1529],
  [2272, 1530],
  [2273, 1530],
];

function latLonToTileXY(lat, lng, zoom) {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
  return { x, y, z: zoom };
}

/** Single OSM tile URL for the map tile that contains this point (user location background). */
function buildUserMapTileUrl(lat, lng) {
  const t = latLonToTileXY(lat, lng, 13);
  return OSM_TILE_BASE + "/" + t.z + "/" + t.x + "/" + t.y + ".png";
}

function tileUrl(z, x, y) {
  return OSM_TILE_BASE + "/" + z + "/" + x + "/" + y + ".png";
}

function mapTargets() {
  const html = document.documentElement;
  const body = document.body;
  const out = [];
  if (html) out.push(html);
  if (body) out.push(body);
  return out;
}

function removeLegacyAppContentMapStack() {
  const appContent = document.getElementById("app-content");
  if (!appContent) return;
  const legacy = appContent.querySelector(".qlist-map-bg-stack");
  if (legacy) {
    legacy.remove();
  }
  appContent.classList.remove("qlist-app-content-map-bg");
  appContent.removeAttribute("data-qlist-map-scope");
}

function stripLegacyBodyMapStack() {
  const body = document.body;
  if (!body) return;
  const stacks = body.querySelectorAll(":scope > .qlist-map-bg-stack");
  for (let i = 0; i < stacks.length; i++) {
    stacks[i].remove();
  }
}

function clearRootMapBackgrounds() {
  paintSolidRootBackground();
}

/** Page shell: solid white (no map tiles). */
function paintSolidRootBackground() {
  for (const el of mapTargets()) {
    el.style.setProperty("background-color", "#ffffff", "important");
    el.style.setProperty("background-image", "none", "important");
    el.style.removeProperty("background-size");
    el.style.removeProperty("background-position");
    el.style.removeProperty("background-repeat");
  }
}

function paintTiranaTileMosaic() {
  paintSolidRootBackground();
}

function paintBodyMapFromUrl(_url) {
  paintSolidRootBackground();
}

/** Remove legacy fixed scrim (body map is CSS-only + optional inline paint). */
function removeBodyMapScrim() {
  const body = document.body;
  if (!body) return;
  const scrim = body.querySelector(":scope > .qlist-map-bg-scrim");
  if (scrim) {
    scrim.remove();
  }
}

/**
 * Sets the page shell background (solid white; url ignored).
 * @param {string} _url
 * @param {{ scope?: "world" | "user" }} [opts]
 */
function applyMapToBody(_url, opts) {
  const body = document.body;
  if (!body) return;
  const scope =
    opts && opts.scope === "user" ? "user" : "world";
  removeLegacyAppContentMapStack();
  stripLegacyBodyMapStack();
  removeBodyMapScrim();

  body.setAttribute("data-qlist-map-scope", scope);
  paintSolidRootBackground();
}

function resetBodyMapToWorld() {
  const body = document.body;
  if (body) {
    body.setAttribute("data-qlist-map-scope", "world");
  }
  removeLegacyAppContentMapStack();
  stripLegacyBodyMapStack();
  removeBodyMapScrim();
  paintTiranaTileMosaic();
}

function initBodyMapOnce() {
  const body = document.body;
  if (!body || body.dataset.qlistMapShellInit === "1") {
    return;
  }
  body.dataset.qlistMapShellInit = "1";
  resetBodyMapToWorld();
}

function isCardShownForRow(card) {
  return (
    !card.classList.contains("place-card--location-hidden") &&
    !card.classList.contains("place-card--category-hidden")
  );
}

function refreshFilterRows() {
  const main = document.getElementById("mainContent");
  if (!main) return;
  const cityBtns = document.querySelectorAll(
    "#current-location-btn"
  );
  const catCombos = document.querySelectorAll(
    "#services-picker-combobox"
  );
  let cityActive = false;
  for (let i = 0; i < cityBtns.length; i++) {
    if (cityBtns[i].getAttribute("data-active-city")) {
      cityActive = true;
      break;
    }
  }
  let categoryActive = false;
  for (let j = 0; j < catCombos.length; j++) {
    if (catCombos[j].getAttribute("data-active-category")) {
      categoryActive = true;
      break;
    }
  }
  const filterActive = cityActive || categoryActive;
  const rows = main.querySelectorAll(".cards-row");
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const cards = row.querySelectorAll(".place-card");
    let anyVisible = false;
    for (let j = 0; j < cards.length; j++) {
      if (isCardShownForRow(cards[j])) {
        anyVisible = true;
        break;
      }
    }
    row.classList.toggle("cards-row--empty-filter", filterActive && !anyVisible);
  }
}

function relayoutCardSliders() {
  window.dispatchEvent(new Event("resize"));
  window.requestAnimationFrame(function () {
    window.requestAnimationFrame(function () {
      window.dispatchEvent(new Event("resize"));
    });
  });
}

document.addEventListener("qlist:filters-changed", function () {
  refreshFilterRows();
  relayoutCardSliders();
});

let leafletPromise = null;
function loadLeaflet() {
  if (!leafletPromise) {
    leafletPromise = import("leaflet").then(function (mod) {
      const L = mod.default || mod;
      return import("leaflet/dist/leaflet.css")
        .catch(function () {
          /* stylesheet is optional for debugging */
        })
        .then(function () {
          return L;
        });
    });
  }
  return leafletPromise;
}

export function initCurrentLocationPicker() {
  initBodyMapOnce();

  const main = document.getElementById("mainContent");
  const emptyEl = document.getElementById("city-filter-empty");
  const previewCard = document.getElementById("location-preview-card");
  const mapEl = document.getElementById("location-preview-map");
  const previewLabel = document.getElementById("location-preview-label");
  const locationBtns = document.querySelectorAll(
    "#current-location-btn"
  );
  if (!locationBtns.length || !previewCard || !mapEl || !previewLabel) {
    console.log("current location init skipped: missing DOM nodes");
    return;
  }
  if (document.body.dataset.qlistLocInit === "1") {
    return;
  }
  document.body.dataset.qlistLocInit = "1";

  const previewWrap = previewCard.closest(".current-location-wrap");
  let anchorBtn = locationBtns[0];

  function syncLocationButtons(fn) {
    for (let i = 0; i < locationBtns.length; i++) {
      fn(locationBtns[i]);
    }
  }

  function portalPreviewToBody() {
    if (!previewWrap) return;
    if (previewCard.parentElement !== document.body) {
      document.body.appendChild(previewCard);
    }
  }

  function restorePreviewIntoWrap() {
    if (!previewWrap) return;
    if (previewCard.parentElement === document.body) {
      previewWrap.appendChild(previewCard);
    }
  }

  const defaultLabel = "Current location";
  const locatingLabel = "Locating…";

  /** Hero uses one row; sticky header uses compact + full label spans when present. */
  function compactLocationButtonLabel(fullText) {
    const s = String(fullText || "");
    if (s === defaultLabel) return "Location";
    if (s === locatingLabel) return "…";
    if (s.length > 16) return s.slice(0, 14) + "…";
    return s;
  }

  function applyLocationButtonLabels(button, fullText) {
    const fullEl = button.querySelector(".search-field__text--sticky-full");
    const compactEl = button.querySelector(".search-field__text--sticky-compact");
    if (fullEl) fullEl.textContent = fullText;
    if (compactEl) compactEl.textContent = compactLocationButtonLabel(fullText);
  }

  let mapInstance = null;
  let hideTimer = null;
  let mountTimer = null;
  let invalidateAgainTimer = null;
  let outsideHandler = null;
  let layoutListenersAttached = false;
  let geoWatch = null;

  function applyLocationPageBackground(lat, lng) {
    applyMapToBody(buildUserMapTileUrl(lat, lng), { scope: "user" });
  }

  function clearMapMountTimers() {
    if (mountTimer != null) {
      clearTimeout(mountTimer);
      mountTimer = null;
    }
    if (invalidateAgainTimer != null) {
      clearTimeout(invalidateAgainTimer);
      invalidateAgainTimer = null;
    }
  }

  function onViewportChange() {
    if (previewCard.hidden) return;
    positionPreviewCard();
  }

  function positionPreviewCard() {
    if (!previewCard.hidden) {
      portalPreviewToBody();
      previewCard.style.zIndex = "2147483000";
    }
    const r = anchorBtn.getBoundingClientRect();
    const w = Math.min(260, Math.max(200, window.innerWidth - 24));
    let x = r.left + r.width / 2 - w / 2;
    const pad = 12;
    x = Math.max(pad, Math.min(x, window.innerWidth - w - pad));
    const estH = 260;
    let y = r.bottom + 10;
    if (y + estH > window.innerHeight - pad) {
      y = Math.max(pad, r.top - estH - 10);
    }
    previewCard.classList.add("location-preview-card--fixed");
    previewCard.style.setProperty("--lp-x", Math.round(x) + "px");
    previewCard.style.setProperty("--lp-y", Math.round(y) + "px");
    previewCard.style.width = w + "px";
    if (!layoutListenersAttached) {
      layoutListenersAttached = true;
      window.addEventListener("scroll", onViewportChange, true);
      window.addEventListener("resize", onViewportChange);
    }
    if (mapInstance) {
      window.setTimeout(function () {
        if (mapInstance) mapInstance.invalidateSize();
      }, 0);
    }
  }

  function detachLayoutListeners() {
    if (layoutListenersAttached) {
      layoutListenersAttached = false;
      window.removeEventListener("scroll", onViewportChange, true);
      window.removeEventListener("resize", onViewportChange);
    }
    previewCard.classList.remove("location-preview-card--fixed");
    previewCard.style.removeProperty("--lp-x");
    previewCard.style.removeProperty("--lp-y");
    previewCard.style.width = "";
  }

  function destroyMap() {
    if (mapInstance) {
      mapInstance.remove();
      mapInstance = null;
    }
  }

  function clearHideTimer() {
    if (hideTimer != null) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
  }

  function detachOutsideClose() {
    if (outsideHandler) {
      document.removeEventListener("pointerdown", outsideHandler, true);
      outsideHandler = null;
    }
  }

  function hideLocationPreview() {
    if (geoWatch != null) {
      clearTimeout(geoWatch);
      geoWatch = null;
    }
    clearHideTimer();
    clearMapMountTimers();
    detachOutsideClose();
    detachLayoutListeners();
    destroyMap();
    previewCard.hidden = true;
    previewCard.setAttribute("hidden", "");
    previewLabel.textContent = "";
    previewCard.style.removeProperty("z-index");
    restorePreviewIntoWrap();
    syncLocationButtons(function (b) {
      b.classList.remove("search-field--loading");
      b.removeAttribute("aria-busy");
      if (!b.getAttribute("data-active-city")) {
        applyLocationButtonLabels(b, defaultLabel);
      }
    });
  }

  /** Map + geolocation errors: keep feedback in the popover (city-filter-empty is easy to miss). */
  function showPreviewMessage(message) {
    destroyMap();
    clearMapMountTimers();
    detachOutsideClose();
    detachLayoutListeners();
    previewLabel.textContent = message || "";
    previewCard.hidden = false;
    previewCard.removeAttribute("hidden");
    positionPreviewCard();
    scheduleAutoHide();
    window.setTimeout(function () {
      attachOutsideClose();
    }, 120);
  }

  function attachOutsideClose() {
    detachOutsideClose();
    outsideHandler = function (e) {
      if (previewCard.hidden) return;
      const t = e.target;
      if (previewCard.contains(t)) return;
      for (let i = 0; i < locationBtns.length; i++) {
        if (locationBtns[i].contains(t)) return;
      }
      hideLocationPreview();
    };
    document.addEventListener("pointerdown", outsideHandler, true);
  }

  function scheduleAutoHide() {
    clearHideTimer();
    hideTimer = window.setTimeout(function () {
      hideTimer = null;
      hideLocationPreview();
    }, PREVIEW_HIDE_MS);
  }

  function showLocationPreview(lat, lng, displayName) {
    destroyMap();
    clearMapMountTimers();
    detachLayoutListeners();
    previewLabel.textContent = displayName || "";
    previewCard.hidden = false;
    previewCard.removeAttribute("hidden");
    positionPreviewCard();
    mapEl.replaceChildren();

    const latLng = [lat, lng];

    loadLeaflet()
      .then(function (L) {
        if (previewCard.hidden) return;

        mountTimer = window.setTimeout(function () {
          mountTimer = null;
          if (previewCard.hidden) return;

          try {
            if (mapInstance) {
              mapInstance.remove();
              mapInstance = null;
            }

            mapInstance = L.map("location-preview-map", {
              center: latLng,
              zoom: 13,
              zoomControl: false,
              attributionControl: true,
              scrollWheelZoom: true,
            });

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
              maxZoom: 19,
              attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            }).addTo(mapInstance);

            L.marker(latLng).addTo(mapInstance);

            positionPreviewCard();

            invalidateAgainTimer = window.setTimeout(function () {
              invalidateAgainTimer = null;
              if (!mapInstance || previewCard.hidden) return;
              mapInstance.invalidateSize();
            }, 100);
          } catch (mapErr) {
            console.log("map init failed", mapErr);
            mapInstance = null;
            previewLabel.textContent =
              "Could not open the map here. Your coordinates were received.";
            positionPreviewCard();
            scheduleAutoHide();
          }
        }, 300);
      })
      .catch(function (err) {
        console.log("leaflet load failed", err);
        mapInstance = null;
        previewLabel.textContent =
          "Map library failed to load. Check the console or your network.";
        positionPreviewCard();
        scheduleAutoHide();
      });

    scheduleAutoHide();
    window.setTimeout(function () {
      attachOutsideClose();
    }, 120);
  }

  function allCards() {
    if (!main) return [];
    return main.querySelectorAll(".place-card");
  }

  function syncCityFilterEmptyMessage() {
    if (!emptyEl || !main) return;
    const pin = getPinnedUserLocation();
    if (!pin) {
      emptyEl.hidden = true;
      emptyEl.textContent = "";
      return;
    }
    const list = main.querySelectorAll(".place-card");
    let any = false;
    for (let i = 0; i < list.length; i++) {
      const c = list[i];
      if (
        !c.classList.contains("place-card--location-hidden") &&
        !c.classList.contains("place-card--category-hidden")
      ) {
        any = true;
        break;
      }
    }
    if (any) {
      emptyEl.hidden = true;
      emptyEl.textContent = "";
    } else {
      emptyEl.hidden = false;
      emptyEl.textContent =
        "No businesses within " +
        getRadiusKm() +
        " km of your location. Widen the radius, try another area, or clear the location filter.";
    }
  }

  function clearFilter() {
    hideLocationPreview();
    resetBodyMapToWorld();
    clearPinnedUserLocation();
    const heroLoc = document.getElementById("hero-location-query");
    if (heroLoc instanceof HTMLInputElement) {
      heroLoc.value = "";
    }
    syncLocationButtons(function (b) {
      b.removeAttribute("data-active-city");
      applyLocationButtonLabels(b, defaultLabel);
      b.classList.remove("search-field--loading");
      b.removeAttribute("aria-busy");
    });
    if (emptyEl) {
      emptyEl.hidden = true;
      emptyEl.textContent = "";
    }
    refreshFilterRows();
    relayoutCardSliders();
  }

  function formatLocationLabel(data) {
    const parts = [];
    const mainPart = String(data.city || data.locality || "").trim();
    if (mainPart) parts.push(mainPart);
    const sub = String(data.principalSubdivision || "").trim();
    if (sub && parts.indexOf(sub) === -1) parts.push(sub);
    const country = String(data.countryName || "").trim();
    if (country && parts.indexOf(country) === -1) parts.push(country);
    const line = parts.join(", ");
    return line || pickCityName(data);
  }

  function reverseGeocode(lat, lng) {
    const url =
      "https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=" +
      encodeURIComponent(lat) +
      "&longitude=" +
      encodeURIComponent(lng) +
      "&localityLanguage=en";
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error("geo");
      return r.json();
    });
  }

  function pickCityName(data) {
    return (
      data.city ||
      data.locality ||
      data.principalSubdivision ||
      ""
    ).trim();
  }

  function onLocationClick(e) {
    const btn = e.currentTarget;
    anchorBtn = btn;
    if (btn.getAttribute("data-active-city")) {
      clearFilter();
      return;
    }

    console.log("button clicked");
    console.log("clicked");

    if (!navigator.geolocation) {
      console.log("geolocation not available");
      showPreviewMessage("Location is not supported in this browser.");
      if (emptyEl) {
        emptyEl.hidden = false;
        emptyEl.textContent = "Location is not supported in this browser.";
      }
      return;
    }

    previewCard.hidden = false;
    previewCard.removeAttribute("hidden");
    previewLabel.textContent = locatingLabel;
    positionPreviewCard();
    scheduleAutoHide();
    window.setTimeout(function () {
      attachOutsideClose();
    }, 120);

    syncLocationButtons(function (b) {
      b.classList.add("search-field--loading");
      b.setAttribute("aria-busy", "true");
      applyLocationButtonLabels(b, locatingLabel);
    });
    if (emptyEl) {
      emptyEl.hidden = true;
      emptyEl.textContent = "";
    }

    if (geoWatch != null) {
      clearTimeout(geoWatch);
      geoWatch = null;
    }
    geoWatch = window.setTimeout(function () {
      geoWatch = null;
      let anyLoading = false;
      for (let i = 0; i < locationBtns.length; i++) {
        if (locationBtns[i].classList.contains("search-field--loading")) {
          anyLoading = true;
          break;
        }
      }
      if (!anyLoading) return;
      syncLocationButtons(function (b) {
        b.classList.remove("search-field--loading");
        b.removeAttribute("aria-busy");
        applyLocationButtonLabels(b, defaultLabel);
      });
      showPreviewMessage(
        "Location is taking too long. Try again or check system location settings."
      );
      if (emptyEl) {
        emptyEl.hidden = false;
        emptyEl.textContent = "Location request timed out.";
      }
    }, 20000);

    navigator.geolocation.getCurrentPosition(
      function (pos) {
        if (geoWatch != null) {
          clearTimeout(geoWatch);
          geoWatch = null;
        }
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        console.log("got location", lat, lng);

        applyLocationPageBackground(lat, lng);

        setPinnedUserLocation(lat, lng, "Near you", "geo");
        applyPinnedProximityToCards();
        syncCityFilterEmptyMessage();

        syncLocationButtons(function (b) {
          b.classList.remove("search-field--loading");
          b.removeAttribute("aria-busy");
          b.setAttribute("data-active-city", "Near you");
          applyLocationButtonLabels(b, "Near you");
        });

        showLocationPreview(lat, lng, "Your location");

        reverseGeocode(lat, lng)
          .then(function (data) {
            const city = pickCityName(data);
            const label =
              formatLocationLabel(data) ||
              city ||
              lat.toFixed(3) + ", " + lng.toFixed(3);
            previewLabel.textContent = label;
            setPinnedUserLocation(lat, lng, label, "geo");
            applyPinnedProximityToCards();
            syncLocationButtons(function (b) {
              b.setAttribute("data-active-city", label);
              applyLocationButtonLabels(b, label);
            });
            syncCityFilterEmptyMessage();
            if (!previewCard.hidden) scheduleAutoHide();
          })
          .catch(function (err) {
            console.log("reverse geocode failed", err);
            setPinnedUserLocation(lat, lng, "Near you", "geo");
            applyPinnedProximityToCards();
            syncLocationButtons(function (b) {
              b.setAttribute("data-active-city", "Near you");
              applyLocationButtonLabels(b, "Near you");
            });
            syncCityFilterEmptyMessage();
            previewLabel.textContent = "Your location";
            if (!previewCard.hidden) scheduleAutoHide();
          });
      },
      function (err) {
        if (geoWatch != null) {
          clearTimeout(geoWatch);
          geoWatch = null;
        }
        console.log("geolocation error", err && err.code, err && err.message);
        syncLocationButtons(function (b) {
          b.classList.remove("search-field--loading");
          b.removeAttribute("aria-busy");
          applyLocationButtonLabels(b, defaultLabel);
        });
        var msg = "Location permission is required to filter by city.";
        if (err && err.code === 1) msg = "Location permission denied.";
        else if (err && err.code === 2) msg = "Location unavailable.";
        else if (err && err.code === 3) msg = "Location request timed out.";
        showPreviewMessage(msg);
        if (emptyEl) {
          emptyEl.hidden = false;
          emptyEl.textContent = msg;
        }
      },
      { enableHighAccuracy: false, maximumAge: 600000, timeout: 15000 }
    );
  }

  document.addEventListener("qlist:proximity-changed", function () {
    applyPinnedProximityToCards();
    const pin = getPinnedUserLocation();
    if (pin) {
      syncLocationButtons(function (b) {
        b.setAttribute("data-active-city", pin.label);
        applyLocationButtonLabels(b, pin.label);
      });
    } else {
      syncLocationButtons(function (b) {
        b.removeAttribute("data-active-city");
        applyLocationButtonLabels(b, defaultLabel);
      });
    }
    syncCityFilterEmptyMessage();
    refreshFilterRows();
    relayoutCardSliders();
  });

  for (let bi = 0; bi < locationBtns.length; bi++) {
    locationBtns[bi].addEventListener("click", onLocationClick);
  }
  console.log("[currentLocation] ready");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCurrentLocationPicker, { once: true });
} else {
  initCurrentLocationPicker();
}

/**
 * OpenStreetMap (Leaflet) for category / search listing pages — no API key.
 */

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { businessPath } from "./businessesData.js";

/** @typedef {{ id: string; lat: number; lng: number; name: string }} CategoryMapPoint */

const TIRANA = /** @type {[number, number]} */ ([41.3275, 19.8187]);
const DEFAULT_ZOOM = 13;

/** @type {null | {
 *   map: import("leaflet").Map;
 *   markersById: Map<string, import("leaflet").Marker>;
 *   gridEl: HTMLElement;
 *   resizeObserver: ResizeObserver;
 *   highlightedId: string | null;
 *   gridAbort: AbortController;
 * }} */
let session = null;

/**
 * @param {import("leaflet").Map} map
 * @param {ReadonlyArray<CategoryMapPoint>} points
 */
function fitMapToPoints(map, points) {
  if (!points.length) {
    map.setView(TIRANA, DEFAULT_ZOOM);
    return;
  }
  if (points.length === 1) {
    map.setView([points[0].lat, points[0].lng], 14);
    return;
  }
  const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
  map.fitBounds(bounds, { padding: [56, 56], maxZoom: 16 });
}

function createMarkerIcon() {
  return L.divIcon({
    className: "qlist-map-marker",
    html: '<div class="qlist-map-pin-inner" aria-hidden="true"></div>',
    iconSize: [22, 28],
    iconAnchor: [11, 28],
    popupAnchor: [0, -26],
  });
}

/**
 * @param {string | null} id
 */
function setMarkerHighlight(id) {
  if (!session) return;
  const prev = session.highlightedId;
  if (prev === id) return;
  session.highlightedId = id;

  if (prev) {
    const prevM = session.markersById.get(prev);
    const prevEl = prevM && typeof prevM.getElement === "function" ? prevM.getElement() : null;
    if (prevEl) prevEl.classList.remove("qlist-map-marker--highlight");
    const prevCard = session.gridEl.querySelector('.place-card[data-business-id="' + prev + '"]');
    if (prevCard && prevCard instanceof HTMLElement) {
      prevCard.classList.remove("place-card--map-hover");
    }
  }

  if (id) {
    const m = session.markersById.get(id);
    const el = m && typeof m.getElement === "function" ? m.getElement() : null;
    if (el) el.classList.add("qlist-map-marker--highlight");
    const card = session.gridEl.querySelector('.place-card[data-business-id="' + id + '"]');
    if (card && card instanceof HTMLElement) {
      card.classList.add("place-card--map-hover");
    }
  }
}

/**
 * @param {string} businessId
 * @param {import("leaflet").Map} map
 * @param {Map<string, import("leaflet").Marker>} markersById
 */
function centerOnMarker(businessId, map, markersById) {
  const marker = markersById.get(businessId);
  if (!marker) return;
  const ll = marker.getLatLng();
  const z = map.getZoom();
  map.flyTo(ll, typeof z === "number" && z >= 15 ? z : 15, { duration: 0.35 });
}

function teardownSession() {
  if (!session) return;
  try {
    session.map.remove();
  } catch {
    /* ignore */
  }
  session.resizeObserver.disconnect();
  session.gridAbort.abort();
  session = null;
}

/** Call before removing the map container from the DOM (e.g. category change). */
export function disposeCategoryMap() {
  teardownSession();
}

/**
 * @param {HTMLElement} containerEl
 * @param {HTMLElement | null} captionEl
 * @param {ReadonlyArray<CategoryMapPoint>} points
 * @param {HTMLElement} gridEl
 * @param {string} canonical
 * @returns {void}
 */
export function mountCategoryLeafletMap({ containerEl, captionEl, points, gridEl, canonical }) {
  if (!containerEl) return;

  teardownSession();

  const map = L.map(containerEl, {
    zoomControl: true,
    attributionControl: true,
    scrollWheelZoom: true,
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);

  /** @type {Map<string, import("leaflet").Marker>} */
  const markersById = new Map();

  points.forEach((p) => {
    if (typeof p.lat !== "number" || typeof p.lng !== "number") return;
    if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) return;

    const marker = L.marker([p.lat, p.lng], { icon: createMarkerIcon() }).addTo(map);
    markersById.set(p.id, marker);

    marker.on("click", function () {
      window.location.href = businessPath(p.id);
    });

    marker.on("mouseover", function () {
      setMarkerHighlight(p.id);
    });
    marker.on("mouseout", function () {
      setMarkerHighlight(null);
    });
  });

  fitMapToPoints(map, points);

  if (captionEl) {
    const n = points.length;
    if (!n) {
      captionEl.textContent = "No locations with coordinates — " + canonical + " · OpenStreetMap";
    } else {
      captionEl.textContent =
        (n === 1 ? "1 place — " : n + " places — ") + canonical + " · OpenStreetMap";
    }
  }

  const gridAbort = new AbortController();
  const signal = gridAbort.signal;

  function onPointerDown(e) {
    const t = e.target;
    if (!(t instanceof Element)) return;
    const card = t.closest(".place-card");
    if (!card || !gridEl.contains(card)) return;
    const id = card.getAttribute("data-business-id");
    if (!id) return;
    centerOnMarker(id, map, markersById);
    setMarkerHighlight(id);
  }

  function clearCardHighlight() {
    setMarkerHighlight(null);
  }

  gridEl.addEventListener("pointerdown", onPointerDown, { capture: true, signal });
  const cards = gridEl.querySelectorAll(".place-card");
  cards.forEach(function (card) {
    card.addEventListener(
      "mouseenter",
      function (e) {
        const t = e.currentTarget;
        if (!(t instanceof HTMLElement)) return;
        const id = t.getAttribute("data-business-id");
        if (id) setMarkerHighlight(id);
      },
      { signal },
    );
    card.addEventListener("mouseleave", clearCardHighlight, { signal });
    card.addEventListener(
      "focusin",
      function (e) {
        const t = e.currentTarget;
        if (!(t instanceof HTMLElement)) return;
        const id = t.getAttribute("data-business-id");
        if (!id) return;
        centerOnMarker(id, map, markersById);
        setMarkerHighlight(id);
      },
      { signal },
    );
    card.addEventListener("focusout", clearCardHighlight, { signal });
  });

  const resizeObserver = new ResizeObserver(function () {
    map.invalidateSize();
  });
  resizeObserver.observe(containerEl);

  session = {
    map,
    markersById,
    gridEl,
    resizeObserver,
    highlightedId: null,
    gridAbort,
  };

  window.setTimeout(function () {
    map.invalidateSize();
  }, 200);
}

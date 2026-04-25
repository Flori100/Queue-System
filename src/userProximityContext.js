/**
 * Shared “where is the user searching from?” state for home discovery + location controls.
 * Category-focused rails use {@link getAnchorForCategoryLayout}; global card dimming uses {@link getPinnedUserLocation}.
 */

const RADIUS_KEY = "qlist-proximity-radius-km";

/** Demo default when no GPS / manual city (matches primary demo listings). */
export const DEMO_DEFAULT_ANCHOR = {
  lat: 41.3275,
  lng: 19.8187,
  label: "Tirana",
  source: /** @type {const} */ ("demo_default"),
};

/** @type {{ lat: number; lng: number; label: string; source: "geo" | "search" } | null} */
let pinnedUserLocation = null;

function dispatch() {
  document.dispatchEvent(new CustomEvent("qlist:proximity-changed", { bubbles: true }));
}

/**
 * Browser geolocation or forward-geocoded city from the hero field.
 * @returns {{ lat: number; lng: number; label: string; source: "geo" | "search" } | null}
 */
export function getPinnedUserLocation() {
  return pinnedUserLocation;
}

/**
 * @param {number} lat
 * @param {number} lng
 * @param {string} label
 * @param {"geo" | "search"} source
 */
export function setPinnedUserLocation(lat, lng, label, source) {
  pinnedUserLocation = {
    lat,
    lng,
    label: String(label || "").trim() || "Selected location",
    source,
  };
  dispatch();
}

export function clearPinnedUserLocation() {
  if (pinnedUserLocation === null) return;
  pinnedUserLocation = null;
  dispatch();
}

/**
 * Category rails: real user anchor if set, otherwise demo city center so the slice is never “world random”.
 */
export function getAnchorForCategoryLayout() {
  if (pinnedUserLocation) {
    return pinnedUserLocation;
  }
  return DEMO_DEFAULT_ANCHOR;
}

export function getRadiusKm() {
  try {
    const raw = sessionStorage.getItem(RADIUS_KEY);
    const n = raw != null ? parseInt(raw, 10) : 10;
    if (n === 5 || n === 10 || n === 20) return n;
  } catch (_e) {
    /* ignore */
  }
  return 10;
}

/** @param {5 | 10 | 20} km */
export function setRadiusKm(km) {
  try {
    sessionStorage.setItem(RADIUS_KEY, String(km));
  } catch (_e) {
    /* ignore */
  }
  dispatch();
}

/**
 * Forward geocode typed city/area (Open-Meteo geocoding API, browser-friendly CORS).
 */
import { setPinnedUserLocation } from "./userProximityContext.js";

const DEBOUNCE_MS = 450;

/** @param {unknown} v @returns {v is number} */
function isFiniteNum(v) {
  return typeof v === "number" && Number.isFinite(v);
}

/**
 * @param {string} q
 * @returns {Promise<{ lat: number; lng: number; label: string } | null>}
 */
async function forwardGeocode(q) {
  const query = String(q || "").trim();
  if (query.length < 2) return null;
  const url =
    "https://geocoding-api.open-meteo.com/v1/search?name=" +
    encodeURIComponent(query) +
    "&count=1&language=en&format=json";
  const r = await fetch(url);
  if (!r.ok) return null;
  const data = await r.json();
  const row = data && data.results && data.results[0];
  if (!row) return null;
  const lat = row.latitude;
  const lng = row.longitude;
  if (!isFiniteNum(lat) || !isFiniteNum(lng)) return null;
  const name = String(row.name || "").trim();
  const admin = String(row.admin1 || "").trim();
  const country = String(row.country || "").trim();
  const label = [name, admin, country].filter(Boolean).join(", ");
  return { lat, lng, label: label || name || query };
}

function init() {
  const input = document.getElementById("hero-location-query");
  if (!input || !(input instanceof HTMLInputElement)) return;

  let t = null;
  function schedule() {
    if (t != null) clearTimeout(t);
    t = window.setTimeout(async function () {
      t = null;
      const v = input.value.trim();
      if (v.length < 2) return;
      input.classList.add("hero-location-query--loading");
      try {
        const hit = await forwardGeocode(v);
        input.classList.remove("hero-location-query--loading");
        if (hit) {
          setPinnedUserLocation(hit.lat, hit.lng, hit.label, "search");
        }
      } catch (_e) {
        input.classList.remove("hero-location-query--loading");
      }
    }, DEBOUNCE_MS);
  }

  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (t != null) clearTimeout(t);
      t = null;
      void (async function () {
        const v = input.value.trim();
        if (v.length < 2) return;
        input.classList.add("hero-location-query--loading");
        try {
          const hit = await forwardGeocode(v);
          input.classList.remove("hero-location-query--loading");
          if (hit) {
            setPinnedUserLocation(hit.lat, hit.lng, hit.label, "search");
          }
        } catch (_e) {
          input.classList.remove("hero-location-query--loading");
        }
      })();
    }
  });

  input.addEventListener("input", schedule);
  input.addEventListener("blur", function () {
    const v = input.value.trim();
    if (v.length >= 2) schedule();
  });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
}

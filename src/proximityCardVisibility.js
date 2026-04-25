/**
 * Toggles `place-card--location-hidden` from distance to the user’s pinned location (hero / GPS).
 * Category rails use their own radius + anchor; this is for the non-category “browse” experience.
 */
import { haversineKm } from "./geoDistance.js";
import { getPinnedUserLocation, getRadiusKm } from "./userProximityContext.js";

export function applyPinnedProximityToCards() {
  const main = document.getElementById("mainContent");
  if (!main) return;
  const pinned = getPinnedUserLocation();
  const cards = main.querySelectorAll(".place-card");
  if (!pinned) {
    for (let i = 0; i < cards.length; i++) {
      cards[i].classList.remove("place-card--location-hidden");
    }
    return;
  }
  const radiusKm = getRadiusKm();
  for (let j = 0; j < cards.length; j++) {
    const card = cards[j];
    const lat = parseFloat(card.getAttribute("data-lat") || "");
    const lng = parseFloat(card.getAttribute("data-lng") || "");
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      card.classList.add("place-card--location-hidden");
      continue;
    }
    const d = haversineKm(pinned.lat, pinned.lng, lat, lng);
    card.classList.toggle("place-card--location-hidden", d > radiusKm);
  }
}

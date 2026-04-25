/**
 * Ensures each listing card exposes lat/lng for proximity filtering (matches `resolveBusiness` / registry).
 */
import { resolveBusiness } from "./businessesData.js";

function firstLineAddress(address) {
  const line = String(address || "").trim();
  if (!line) return "";
  const parts = line.split(",");
  return parts[0] ? parts[0].trim() : "";
}

function hydrate() {
  const main = document.getElementById("mainContent");
  if (!main) return;
  const cards = main.querySelectorAll(".place-card[data-business-id]");
  for (let i = 0; i < cards.length; i++) {
    const el = cards[i];
    const id = el.getAttribute("data-business-id");
    if (!id) continue;
    const b = resolveBusiness(id);
    if (!b || typeof b.lat !== "number" || typeof b.lng !== "number") continue;
    el.setAttribute("data-lat", String(b.lat));
    el.setAttribute("data-lng", String(b.lng));
    if (b.city) {
      el.setAttribute("data-city", b.city);
    }
    const area = firstLineAddress(b.address) || b.city || "";
    if (area) {
      el.setAttribute("data-area-label", area);
    }
  }
}

function run() {
  hydrate();
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }
}

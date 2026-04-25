import { categoryPageHrefForCanonicalCategory } from "./businessesData.js";

/**
 * “View all” tile: navigates to unified search results (`/search?category=…`).
 * @param {string} canonicalCategory e.g. `Barbershop` (matches `data-category` on cards)
 * @param {{ label?: string; overlayText?: string; ariaName?: string }} [opts]
 * @returns {HTMLAnchorElement}
 */
export function createHomeDiscoveryFolderElement(canonicalCategory, opts) {
  const label = (opts && opts.label && opts.label.trim()) || "View all";
  const overlayText =
    (opts && opts.overlayText && opts.overlayText.trim()) ||
    (label === "View all" ? `View all ${canonicalCategory}` : label);
  const aria =
    (opts && opts.ariaName && opts.ariaName.trim()) ||
    `View all ${canonicalCategory} listings in search results`;

  const a = document.createElement("a");
  a.className =
    "home-discovery-folder shadow-sm hover:shadow-md transition-shadow duration-200";
  a.setAttribute("data-home-category-folder", "");
  a.href = categoryPageHrefForCanonicalCategory(canonicalCategory);
  a.setAttribute("aria-label", aria);

  const media = document.createElement("div");
  media.className = "home-discovery-folder__media";

  const collage = document.createElement("div");
  collage.className = "home-discovery-folder__collage";
  collage.setAttribute("aria-hidden", "true");

  const tileLarge = document.createElement("div");
  tileLarge.className = "home-discovery-folder__tile home-discovery-folder__tile--large";
  const img0 = document.createElement("img");
  img0.className =
    "home-discovery-folder__cover home-discovery-folder__cover--0 w-24 h-20 object-cover rounded-xl";
  img0.setAttribute("alt", "");
  img0.setAttribute("width", "96");
  img0.setAttribute("height", "80");
  img0.setAttribute("loading", "lazy");
  img0.setAttribute("decoding", "async");
  tileLarge.appendChild(img0);

  const stack = document.createElement("div");
  stack.className = "home-discovery-folder__stack";

  const tileS1 = document.createElement("div");
  tileS1.className = "home-discovery-folder__tile home-discovery-folder__tile--small";
  const img1 = document.createElement("img");
  img1.className =
    "home-discovery-folder__cover home-discovery-folder__cover--1 w-24 h-20 object-cover rounded-xl";
  img1.setAttribute("alt", "");
  img1.setAttribute("width", "96");
  img1.setAttribute("height", "80");
  img1.setAttribute("loading", "lazy");
  img1.setAttribute("decoding", "async");
  tileS1.appendChild(img1);

  const tileS2 = document.createElement("div");
  tileS2.className = "home-discovery-folder__tile home-discovery-folder__tile--small";
  const img2 = document.createElement("img");
  img2.className =
    "home-discovery-folder__cover home-discovery-folder__cover--2 w-24 h-20 object-cover rounded-xl";
  img2.setAttribute("alt", "");
  img2.setAttribute("width", "96");
  img2.setAttribute("height", "80");
  img2.setAttribute("loading", "lazy");
  img2.setAttribute("decoding", "async");
  tileS2.appendChild(img2);

  stack.appendChild(tileS1);
  stack.appendChild(tileS2);

  collage.appendChild(tileLarge);
  collage.appendChild(stack);

  const overlay = document.createElement("div");
  overlay.className = "home-discovery-folder__overlay";
  overlay.setAttribute("aria-hidden", "true");
  const overlayLine = document.createElement("span");
  overlayLine.className = "home-discovery-folder__overlay-text";
  overlayLine.textContent = overlayText;
  overlay.appendChild(overlayLine);

  media.appendChild(collage);
  media.appendChild(overlay);

  const footer = document.createElement("div");
  footer.className = "home-discovery-folder__footer";
  const lab = document.createElement("span");
  lab.className = "home-discovery-folder__label";
  lab.setAttribute("aria-hidden", "true");
  lab.textContent = "\u200b";
  footer.appendChild(lab);

  a.appendChild(media);
  a.appendChild(footer);
  return a;
}

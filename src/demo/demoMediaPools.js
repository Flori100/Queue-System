/**
 * Curated Unsplash URLs for listing galleries and staff avatars (see demoMediaPools.json).
 * Replaces deprecated source.unsplash.com URLs so images load reliably in the UI.
 */

import pools from "./demoMediaPools.json";

/** Seven photos per listing (6+ requirement); ten listings per category in demo data. */
export const DEMO_PHOTOS_PER_LISTING = 7;

/**
 * @param {string} category canonical e.g. `Barbershop`
 * @param {number} ordinalInCategory 0-based index within the category’s demo bundle
 * @returns {string[]}
 */
export function sliceDemoGallery(category, ordinalInCategory) {
  const key = String(category || "").trim();
  const pool = pools.galleryByCategory[key] || pools.galleryByCategory.Spa;
  const n = pool.length;
  if (!n) return [];
  const ord = Math.max(0, Number(ordinalInCategory) || 0);
  const start = ord * DEMO_PHOTOS_PER_LISTING;
  if (start + DEMO_PHOTOS_PER_LISTING <= n) {
    return pool.slice(start, start + DEMO_PHOTOS_PER_LISTING);
  }
  /** Rare fallback if a pool is shorter than expected. */
  const tail = pool.slice(start, n);
  const need = DEMO_PHOTOS_PER_LISTING - tail.length;
  return [...tail, ...pool.slice(0, Math.max(0, need))].slice(0, DEMO_PHOTOS_PER_LISTING);
}

/**
 * Stable portrait for demo staff; `globalSerial` must be unique per staff member in the demo registry.
 * @param {number} globalSerial
 */
export function demoStaffPortraitUrl(globalSerial) {
  const list = pools.staffPortraits;
  if (!list || !list.length) return "";
  const i = Math.abs(Number(globalSerial) || 0) % list.length;
  return list[i];
}

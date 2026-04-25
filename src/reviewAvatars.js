/** Stable demo portraits for review rows until real profile URLs exist. */

const DEMO_REVIEW_AVATAR_URLS = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=128&h=128&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&h=128&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=128&h=128&q=80",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=128&h=128&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=128&h=128&q=80",
];

/**
 * @param {string} [name]
 * @returns {string}
 */
export function reviewAuthorInitial(name) {
  const s = String(name ?? "").trim();
  if (!s) return "?";
  return s.charAt(0).toUpperCase();
}

/**
 * @param {string} [name]
 * @param {number} [index]
 * @returns {string}
 */
export function demoReviewAvatarUrl(name, index = 0) {
  let acc = (Number(index) || 0) * 13;
  const str = String(name ?? "");
  for (let i = 0; i < str.length; i++) acc += str.charCodeAt(i);
  const idx = Math.abs(acc) % DEMO_REVIEW_AVATAR_URLS.length;
  return DEMO_REVIEW_AVATAR_URLS[idx];
}

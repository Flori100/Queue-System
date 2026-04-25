/**
 * Liked businesses + collections: mirrors `favorite_folders` + `favorites` tables (see schema/favorites.sql).
 * Persisted per signed-in user in localStorage (demo); swap for REST/AJAX using the same shapes.
 */

export const PENDING_FAVORITE_KEY = "qlist-pending-favorite-business-id";

const STATE_VERSION = 1;
const LEGACY_PREFIX = "qlist-user-business-likes:";
const STATE_PREFIX = "qlist-favorites-v1:";
const LAST_FOLDER_PREFIX = "qlist-last-favorite-folder:";

/** @returns {{ email?: string } | null} */
export function readAuthSession() {
  try {
    const A = window.QListAuth;
    if (A && typeof A.readSession === "function") return A.readSession();
  } catch (_e) {
    /* ignore */
  }
  return null;
}

/** @param {string} email */
function normalizeEmail(email) {
  const A = window.QListAuth;
  return A && typeof A.normalizeEmail === "function"
    ? A.normalizeEmail(email)
    : String(email || "").trim().toLowerCase();
}

/** @param {string} email */
export function likesStorageKey(email) {
  return `${LEGACY_PREFIX}${normalizeEmail(email)}`;
}

/** @param {string} email */
export function favoritesStateKey(email) {
  return `${STATE_PREFIX}${normalizeEmail(email)}`;
}

function lastFolderKey(email) {
  return `${LAST_FOLDER_PREFIX}${normalizeEmail(email)}`;
}

function newId() {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch (_e) {
    /* ignore */
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * @typedef {{ id: string; name: string }} FavoriteFolderRow
 * @typedef {{ id: string; business_id: string; folder_id: string }} FavoriteRow
 * @typedef {{ version: number; folders: FavoriteFolderRow[]; favorites: FavoriteRow[] }} FavoritesStateV1
 */

/** @returns {FavoritesStateV1} */
function emptyState() {
  const defaultFolder = { id: newId(), name: "Saved" };
  return {
    version: STATE_VERSION,
    folders: [defaultFolder],
    favorites: [],
  };
}

/** @param {unknown} raw @returns {FavoritesStateV1 | null} */
function parseState(raw) {
  if (!raw || typeof raw !== "string") return null;
  try {
    const v = JSON.parse(raw);
    if (!v || typeof v !== "object") return null;
    if (v.version !== STATE_VERSION) return null;
    const folders = Array.isArray(v.folders) ? v.folders : [];
    const favorites = Array.isArray(v.favorites) ? v.favorites : [];
    const cleanFolders = folders
      .filter((f) => f && typeof f.id === "string" && typeof f.name === "string" && f.name.trim())
      .map((f) => ({ id: f.id, name: String(f.name).trim() }));
    const cleanFav = favorites.filter(
      (r) => r && typeof r.id === "string" && typeof r.business_id === "string" && typeof r.folder_id === "string",
    );
    if (!cleanFolders.length) return null;
    return { version: STATE_VERSION, folders: cleanFolders, favorites: cleanFav };
  } catch (_e) {
    return null;
  }
}

/** @param {string} email @returns {FavoritesStateV1} */
export function readFavoritesState(email) {
  if (!email) return emptyState();
  let state = null;
  try {
    state = parseState(localStorage.getItem(favoritesStateKey(email)));
  } catch (_e) {
    state = null;
  }
  if (state) return migrateOrphanFavorites(email, state);

  let legacy = [];
  try {
    const raw = localStorage.getItem(likesStorageKey(email));
    if (raw) {
      const v = JSON.parse(raw);
      if (Array.isArray(v)) legacy = v.filter((x) => typeof x === "string" && x.length);
    }
  } catch (_e) {
    legacy = [];
  }

  const s = emptyState();
  const defaultFolderId = s.folders[0].id;
  for (const bid of legacy) {
    if (s.favorites.some((f) => f.business_id === bid)) continue;
    s.favorites.push({ id: newId(), business_id: bid, folder_id: defaultFolderId });
  }
  if (legacy.length) {
    try {
      writeFavoritesState(email, s);
      localStorage.removeItem(likesStorageKey(email));
    } catch (_e) {
      /* ignore */
    }
  }
  return s;
}

/** @param {string} email @param {FavoritesStateV1} state */
function migrateOrphanFavorites(email, state) {
  const folderIds = new Set(state.folders.map((f) => f.id));
  const fallback = state.folders[0]?.id;
  if (!fallback) return state;
  let changed = false;
  for (const fav of state.favorites) {
    if (!folderIds.has(fav.folder_id)) {
      fav.folder_id = fallback;
      changed = true;
    }
  }
  if (changed && email) writeFavoritesState(email, state);
  return state;
}

/** @param {string} email @param {FavoritesStateV1} state */
export function writeFavoritesState(email, state) {
  if (!email) return;
  try {
    localStorage.setItem(favoritesStateKey(email), JSON.stringify(state));
  } catch (_e) {
    /* ignore */
  }
}

/** @param {string} email @returns {string[]} */
export function readLikedIds(email) {
  const s = readFavoritesState(email);
  return s.favorites.map((f) => f.business_id);
}

/** @param {string} email @param {string} businessId */
export function isBusinessLiked(email, businessId) {
  return readFavoritesState(email).favorites.some((f) => f.business_id === businessId);
}

/** @param {string} email */
export function getLastUsedFolderId(email) {
  if (!email) return null;
  try {
    const raw = sessionStorage.getItem(lastFolderKey(email));
    if (!raw) return null;
    const s = readFavoritesState(email);
    if (s.folders.some((f) => f.id === raw)) return raw;
  } catch (_e) {
    /* ignore */
  }
  return readFavoritesState(email).folders[0]?.id ?? null;
}

/** @param {string} email @param {string} folderId */
export function setLastUsedFolderId(email, folderId) {
  if (!email || !folderId) return;
  try {
    sessionStorage.setItem(lastFolderKey(email), folderId);
  } catch (_e) {
    /* ignore */
  }
}

/**
 * @param {string} email
 * @param {string} businessId
 * @param {string} [folderId] folder when adding; defaults to last-used or first folder
 */
export function addFavorite(email, businessId, folderId) {
  const s = readFavoritesState(email);
  if (s.favorites.some((f) => f.business_id === businessId)) return false;
  let fid = folderId && s.folders.some((f) => f.id === folderId) ? folderId : getLastUsedFolderId(email);
  if (!fid || !s.folders.some((f) => f.id === fid)) fid = s.folders[0].id;
  s.favorites.push({ id: newId(), business_id: businessId, folder_id: fid });
  writeFavoritesState(email, s);
  setLastUsedFolderId(email, fid);
  return true;
}

/** @param {string} email @param {string} businessId */
export function removeFavorite(email, businessId) {
  const s = readFavoritesState(email);
  const next = s.favorites.filter((f) => f.business_id !== businessId);
  if (next.length === s.favorites.length) return false;
  s.favorites = next;
  writeFavoritesState(email, s);
  return true;
}

/** @param {string} email @param {string} businessId @param {string} folderId */
export function moveFavoriteToFolder(email, businessId, folderId) {
  const s = readFavoritesState(email);
  if (!s.folders.some((f) => f.id === folderId)) return false;
  const row = s.favorites.find((f) => f.business_id === businessId);
  if (!row) return false;
  row.folder_id = folderId;
  writeFavoritesState(email, s);
  setLastUsedFolderId(email, folderId);
  return true;
}

/**
 * @param {string} email
 * @param {string} businessId
 * @param {{ folderId?: string }} [opts] when liking, optional folder
 * @returns {boolean} new liked state
 */
export function toggleLikeForUser(email, businessId, opts) {
  const s = readFavoritesState(email);
  const exists = s.favorites.some((f) => f.business_id === businessId);
  if (exists) {
    removeFavorite(email, businessId);
    return false;
  }
  const folderId = opts?.folderId;
  addFavorite(email, businessId, folderId);
  return true;
}

/** @param {string} email @param {string} name @returns {FavoriteFolderRow | null} */
export function createFolder(email, name) {
  const trimmed = String(name || "").trim();
  if (!trimmed || !email) return null;
  const s = readFavoritesState(email);
  const row = { id: newId(), name: trimmed };
  s.folders.push(row);
  writeFavoritesState(email, s);
  setLastUsedFolderId(email, row.id);
  return row;
}

/** @param {string} email @param {string} folderId @param {string} name */
export function renameFolder(email, folderId, name) {
  const trimmed = String(name || "").trim();
  if (!trimmed || !email) return false;
  const s = readFavoritesState(email);
  const f = s.folders.find((x) => x.id === folderId);
  if (!f) return false;
  f.name = trimmed;
  writeFavoritesState(email, s);
  return true;
}

/**
 * @param {string} email
 * @param {string} folderId
 * @param {{ mode: "move"; targetFolderId: string } | { mode: "delete_items" }}} options
 */
export function deleteFolder(email, folderId, options) {
  const s = readFavoritesState(email);
  if (s.folders.length <= 1) return { ok: false, error: "Cannot delete the last collection." };
  const idx = s.folders.findIndex((f) => f.id === folderId);
  if (idx < 0) return { ok: false, error: "Collection not found." };

  if (options.mode === "delete_items") {
    s.favorites = s.favorites.filter((f) => f.folder_id !== folderId);
  } else {
    const target = options.targetFolderId;
    if (!target || target === folderId || !s.folders.some((f) => f.id === target)) {
      return { ok: false, error: "Invalid target collection." };
    }
    for (const fav of s.favorites) {
      if (fav.folder_id === folderId) fav.folder_id = target;
    }
  }
  s.folders.splice(idx, 1);
  writeFavoritesState(email, s);
  return { ok: true };
}

export function emitFavoritesChanged() {
  try {
    window.dispatchEvent(new CustomEvent("qlist:favorites-changed", { bubbles: true }));
  } catch (_e) {
    /* ignore */
  }
}

/** @returns {boolean} whether a pending like was applied */
export function applyPendingFavoriteAfterLogin() {
  const session = readAuthSession();
  if (!session?.email) return false;
  let pending = null;
  try {
    pending = sessionStorage.getItem(PENDING_FAVORITE_KEY);
  } catch (_e) {
    /* ignore */
  }
  if (!pending) return false;
  if (!isBusinessLiked(session.email, pending)) {
    addFavorite(session.email, pending, getLastUsedFolderId(session.email));
  }
  try {
    sessionStorage.removeItem(PENDING_FAVORITE_KEY);
  } catch (_e) {
    /* ignore */
  }
  return true;
}

/** @param {string} businessId */
export function requestLoginToFavorite(businessId) {
  try {
    sessionStorage.setItem(PENDING_FAVORITE_KEY, businessId);
  } catch (_e) {
    /* ignore */
  }
  if (typeof window.__qlistOpenConsumerAuth === "function") {
    window.__qlistOpenConsumerAuth();
    return;
  }
  try {
    const url = new URL("./index.html", window.location.href);
    // window.location.assign(url.href);
  } catch (_e) {
    /* ignore */
  }
}

/** @param {string} email @param {string} businessId @returns {string | null} */
export function getFolderIdForBusiness(email, businessId) {
  const s = readFavoritesState(email);
  return s.favorites.find((f) => f.business_id === businessId)?.folder_id ?? null;
}

/** @param {string} email @param {string} folderId @returns {string[]} */
export function listBusinessIdsInFolder(email, folderId) {
  const s = readFavoritesState(email);
  return s.favorites.filter((f) => f.folder_id === folderId).map((f) => f.business_id);
}

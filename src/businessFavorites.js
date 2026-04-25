/**
 * Liked businesses + collections on the home page (authenticated users only).
 */

import {
  BUSINESS_ROWS,
  resolveBusiness,
  resolveBusinessIdFromListingCard,
} from "./businessesData.js";
import {
  addFavorite,
  applyPendingFavoriteAfterLogin,
  createFolder,
  deleteFolder,
  emitFavoritesChanged,
  getLastUsedFolderId,
  isBusinessLiked,
  moveFavoriteToFolder,
  readAuthSession,
  readFavoritesState,
  removeFavorite,
  renameFolder,
  requestLoginToFavorite,
  setLastUsedFolderId,
} from "./businessLikesStore.js";

const LIKED_TAB_KEY = "qlist-liked-ui-tab";

/** @param {HTMLButtonElement} btn @param {boolean} liked */
function setButtonVisual(btn, liked) {
  btn.classList.toggle("is-liked", liked);
  btn.setAttribute("aria-pressed", liked ? "true" : "false");
  btn.setAttribute(
    "aria-label",
    liked ? "Remove from liked businesses" : "Add to liked businesses",
  );
}

function syncAllFavoriteButtons() {
  const session = readAuthSession();
  const email = session?.email;
  document.querySelectorAll(".place-card__favorite-btn").forEach((el) => {
    if (!(el instanceof HTMLButtonElement)) return;
    const id = el.getAttribute("data-favorite-business-id");
    if (!id || !email) {
      setButtonVisual(el, false);
      return;
    }
    setButtonVisual(el, isBusinessLiked(email, id));
  });
}

function getLikedTab() {
  try {
    return sessionStorage.getItem(LIKED_TAB_KEY) || "all";
  } catch (_e) {
    return "all";
  }
}

function setLikedTab(id) {
  try {
    sessionStorage.setItem(LIKED_TAB_KEY, id);
  } catch (_e) {
    /* ignore */
  }
}

/** @param {(typeof BUSINESS_ROWS)[number]} row */
function createPlaceCardFromRow(row) {
  const b = resolveBusiness(row.id);
  if (!b) return document.createElement("article");

  const article = document.createElement("article");
  article.className =
    "place-card shadow-sm hover:shadow-md transition-shadow duration-200";
  article.setAttribute("data-business-id", b.id);
  article.setAttribute("data-category", b.category);
  article.setAttribute("data-city", b.city);
  if (typeof b.lat === "number" && typeof b.lng === "number") {
    article.setAttribute("data-lat", String(b.lat));
    article.setAttribute("data-lng", String(b.lng));
  }
  const areaLine = String(b.address || "").split(",")[0]?.trim();
  if (areaLine) {
    article.setAttribute("data-area-label", areaLine);
  }

  const image = document.createElement("div");
  image.className = "place-card__image";
  const badge = document.createElement("span");
  badge.className = "place-card__badge";
  badge.textContent = "Saved";
  image.appendChild(badge);

  const body = document.createElement("div");
  body.className = "place-card__body";
  const rowEl = document.createElement("div");
  rowEl.className = "place-card__row";

  const h4 = document.createElement("h4");
  h4.className = "place-card__name";
  h4.textContent = b.name;

  const rating = document.createElement("span");
  rating.className = "place-card__rating";
  rating.title = `${b.averageRating} out of 5`;
  rating.innerHTML =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg> ';
  rating.appendChild(document.createTextNode(String(b.averageRating)));

  rowEl.appendChild(h4);
  rowEl.appendChild(rating);

  const meta = document.createElement("p");
  meta.className = "place-card__meta";
  meta.textContent = b.description || "";

  const tags = document.createElement("div");
  tags.className = "place-card__tags";
  const tag = document.createElement("span");
  tag.className = "tag";
  tag.textContent = b.category;
  tags.appendChild(tag);

  body.appendChild(rowEl);
  body.appendChild(meta);
  body.appendChild(tags);
  article.appendChild(image);
  article.appendChild(body);
  return article;
}

/** @param {HTMLElement} track @param {string[]} businessIds */
function fillTrackWithBusinesses(track, businessIds) {
  track.innerHTML = "";
  const seen = new Set();
  for (const id of businessIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    const row = BUSINESS_ROWS.find((r) => r.id === id);
    if (!row) continue;
    track.appendChild(createPlaceCardFromRow(row));
  }
}

/** @param {string} email @param {{ folders: { id: string; name: string }[]; favorites: { folder_id: string }[] }} state */
function renderFolderPills(email, state) {
  const toolbar = document.getElementById("liked-folders-toolbar");
  const pills = document.getElementById("liked-folders-pills");
  if (!toolbar || !pills) return;

  const total = state.favorites.length;
  let tab = getLikedTab();
  if (tab !== "all" && !state.folders.some((f) => f.id === tab)) {
    tab = "all";
    setLikedTab("all");
  }

  pills.innerHTML = "";
  const mk = (id, label, count, selected) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "liked-folder-pill";
    b.setAttribute("role", "tab");
    b.setAttribute("aria-selected", selected ? "true" : "false");
    b.dataset.tab = id;
    b.textContent = count != null ? `${label} (${count})` : label;
    b.addEventListener("click", () => {
      setLikedTab(id);
      refreshLikedSection();
    });
    pills.appendChild(b);
  };

  mk("all", "All", total, tab === "all");
  for (const f of state.folders) {
    const c = state.favorites.filter((x) => x.folder_id === f.id).length;
    mk(f.id, f.name, c, tab === f.id);
  }

  toolbar.hidden = false;
}

function removeSaveBar() {
  const el = document.getElementById("qlist-like-save-bar");
  if (el) el.remove();
}

/** @param {HTMLButtonElement} anchor @param {string} email @param {string} businessId */
function showSaveCollectionBar(anchor, email, businessId) {
  removeSaveBar();
  const state = readFavoritesState(email);
  const bar = document.createElement("div");
  bar.id = "qlist-like-save-bar";
  bar.className = "qlist-like-save-bar";

  const lab = document.createElement("label");
  lab.htmlFor = "qlist-like-save-folder-select";
  lab.textContent = "Collection";
  const sel = document.createElement("select");
  sel.id = "qlist-like-save-folder-select";
  for (const f of state.folders) {
    const o = document.createElement("option");
    o.value = f.id;
    o.textContent = f.name;
    sel.appendChild(o);
  }
  const cur = readFavoritesState(email).favorites.find((x) => x.business_id === businessId);
  if (cur) sel.value = cur.folder_id;

  sel.addEventListener("change", () => {
    moveFavoriteToFolder(email, businessId, sel.value);
    setLastUsedFolderId(email, sel.value);
    emitFavoritesChanged();
    refreshLikedSection();
  });

  const rowNew = document.createElement("div");
  rowNew.className = "qlist-like-save-bar__new";
  const inp = document.createElement("input");
  inp.type = "text";
  inp.placeholder = "New collection…";
  inp.setAttribute("aria-label", "New collection name");
  const btnNew = document.createElement("button");
  btnNew.type = "button";
  btnNew.textContent = "Add";
  btnNew.addEventListener("click", () => {
    const name = inp.value.trim();
    if (!name) return;
    const folder = createFolder(email, name);
    inp.value = "";
    if (!folder) return;
    moveFavoriteToFolder(email, businessId, folder.id);
    emitFavoritesChanged();
    refreshLikedSection();
    removeSaveBar();
    showSaveCollectionBar(anchor, email, businessId);
  });

  const dismiss = document.createElement("button");
  dismiss.type = "button";
  dismiss.className = "qlist-like-save-bar__dismiss";
  dismiss.textContent = "Done";
  dismiss.addEventListener("click", () => removeSaveBar());

  rowNew.appendChild(inp);
  rowNew.appendChild(btnNew);
  bar.appendChild(lab);
  bar.appendChild(sel);
  bar.appendChild(rowNew);
  bar.appendChild(dismiss);
  bar.style.position = "fixed";
  bar.style.zIndex = "80";
  document.body.appendChild(bar);

  const r = anchor.getBoundingClientRect();
  requestAnimationFrame(() => {
    const w = bar.offsetWidth || 240;
    const h = bar.offsetHeight || 120;
    const left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8));
    const top = Math.min(window.innerHeight - h - 8, r.bottom + 6);
    bar.style.left = `${left}px`;
    bar.style.top = `${top}px`;
  });

  window.setTimeout(() => removeSaveBar(), 12000);
  const onKey = (e) => {
    if (e.key === "Escape") {
      removeSaveBar();
      window.removeEventListener("keydown", onKey);
    }
  };
  window.addEventListener("keydown", onKey);
}

/** @param {string} email */
function openFoldersManageDialog(email) {
  const existing = document.getElementById("qlist-folders-dialog-overlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "qlist-folders-dialog-overlay";
  overlay.className = "qlist-folders-dialog-overlay";

  const dlg = document.createElement("div");
  dlg.className = "qlist-folders-dialog";
  dlg.setAttribute("role", "dialog");
  dlg.setAttribute("aria-modal", "true");
  dlg.setAttribute("aria-labelledby", "qlist-folders-dialog-title");

  const title = document.createElement("h3");
  title.id = "qlist-folders-dialog-title";
  title.textContent = "Collections";

  const rebuild = () => {
    overlay.remove();
    openFoldersManageDialog(email);
  };

  const newRow = document.createElement("div");
  newRow.className = "qlist-folders-dialog__new";
  const newInp = document.createElement("input");
  newInp.type = "text";
  newInp.placeholder = "New collection name";
  const newBtn = document.createElement("button");
  newBtn.type = "button";
  newBtn.textContent = "Create";
  newBtn.addEventListener("click", () => {
    const n = newInp.value.trim();
    if (!n) return;
    createFolder(email, n);
    emitFavoritesChanged();
    refreshLikedSection();
    rebuild();
  });
  newRow.appendChild(newInp);
  newRow.appendChild(newBtn);

  const list = document.createElement("div");
  const state = readFavoritesState(email);
  for (const f of state.folders) {
    const row = document.createElement("div");
    row.className = "qlist-folders-dialog__row";

    const nameInp = document.createElement("input");
    nameInp.type = "text";
    nameInp.value = f.name;
    nameInp.setAttribute("aria-label", `Rename ${f.name}`);

    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.textContent = "Rename";
    saveBtn.addEventListener("click", () => {
      renameFolder(email, f.id, nameInp.value);
      emitFavoritesChanged();
      refreshLikedSection();
      rebuild();
    });

    row.appendChild(nameInp);
    row.appendChild(saveBtn);

    if (state.folders.length > 1) {
      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "qlist-folders-dialog__danger";
      delBtn.textContent = "Delete…";
      delBtn.addEventListener("click", () => {
        const others = state.folders.filter((x) => x.id !== f.id);
        const target = window.prompt(
          `Move saved places to another collection? Enter exactly one of: ${others.map((x) => x.name).join(", ")}`,
          others[0]?.name || "",
        );
        if (target == null) return;
        const match = others.find((x) => x.name.trim().toLowerCase() === String(target).trim().toLowerCase());
        if (!match) {
          if (window.confirm("No match. Delete this collection and remove all saved places inside it?")) {
            const r = deleteFolder(email, f.id, { mode: "delete_items" });
            if (!r.ok) window.alert(r.error || "Could not delete");
            else {
              emitFavoritesChanged();
              refreshLikedSection();
              rebuild();
            }
          }
          return;
        }
        const r = deleteFolder(email, f.id, { mode: "move", targetFolderId: match.id });
        if (!r.ok) window.alert(r.error || "Could not delete");
        else {
          emitFavoritesChanged();
          refreshLikedSection();
          rebuild();
        }
      });
      row.appendChild(delBtn);
    }

    list.appendChild(row);
  }

  const foot = document.createElement("div");
  foot.className = "qlist-folders-dialog__footer";
  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.textContent = "Close";
  closeBtn.addEventListener("click", () => overlay.remove());
  foot.appendChild(closeBtn);

  dlg.appendChild(title);
  dlg.appendChild(newRow);
  dlg.appendChild(list);
  dlg.appendChild(foot);
  overlay.appendChild(dlg);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });
  dlg.addEventListener("click", (e) => e.stopPropagation());
  document.body.appendChild(overlay);
  newInp.focus();
}

function wireManageButtonOnce() {
  const btn = document.getElementById("liked-folders-manage");
  if (!btn || btn.dataset.wired === "1") return;
  btn.dataset.wired = "1";
  btn.addEventListener("click", () => {
    const s = readAuthSession();
    if (!s?.email) return;
    openFoldersManageDialog(s.email);
  });
}

function refreshLikedSection() {
  const section = document.getElementById("home-liked-businesses");
  const track = document.getElementById("liked-businesses-track");
  const allGroups = document.getElementById("liked-businesses-all-groups");
  const singleWrap = document.getElementById("liked-businesses-single-wrap");
  const empty = document.getElementById("liked-businesses-empty");
  const toolbar = document.getElementById("liked-folders-toolbar");
  if (!section || !track || !empty) return;

  const session = readAuthSession();
  if (!session?.email) {
    section.hidden = true;
    return;
  }

  const state = readFavoritesState(session.email);
  const ids = state.favorites.map((f) => f.business_id);

  if (!ids.length) {
    section.hidden = true;
    empty.hidden = true;
    if (toolbar) toolbar.hidden = true;
    if (allGroups) {
      allGroups.hidden = true;
      allGroups.innerHTML = "";
    }
    track.innerHTML = "";
    if (singleWrap) singleWrap.hidden = false;
    return;
  }

  section.hidden = false;
  empty.hidden = true;
  wireManageButtonOnce();
  renderFolderPills(session.email, state);

  let tab = getLikedTab();
  if (tab !== "all" && !state.folders.some((f) => f.id === tab)) {
    tab = "all";
    setLikedTab("all");
  }

  if (tab === "all") {
    if (singleWrap) singleWrap.hidden = true;
    if (allGroups) {
      allGroups.hidden = false;
      allGroups.innerHTML = "";
      for (const folder of state.folders) {
        const inFolder = state.favorites.filter((x) => x.folder_id === folder.id).map((x) => x.business_id);
        if (!inFolder.length) continue;
        const grp = document.createElement("div");
        grp.className = "liked-folder-group";
        const h = document.createElement("h3");
        h.className = "liked-folder-group__title";
        h.textContent = folder.name;
        const innerTrack = document.createElement("div");
        innerTrack.className = "liked-folder-group__track";
        fillTrackWithBusinesses(innerTrack, inFolder);
        grp.appendChild(h);
        grp.appendChild(innerTrack);
        allGroups.appendChild(grp);
      }
    }
    track.innerHTML = "";
  } else {
    if (allGroups) {
      allGroups.hidden = true;
      allGroups.innerHTML = "";
    }
    if (singleWrap) singleWrap.hidden = false;
    const inFolder = state.favorites.filter((x) => x.folder_id === tab).map((x) => x.business_id);
    fillTrackWithBusinesses(track, inFolder);
  }

  try {
    const scope = section;
    if (typeof window.__qlistEnsurePlaceCardCoversIn === "function") {
      window.__qlistEnsurePlaceCardCoversIn(scope);
    }
  } catch (_e) {
    /* ignore */
  }

  bindFavoriteButtons(section);
  syncAllFavoriteButtons();

  try {
    document.dispatchEvent(new CustomEvent("qlist:hv-cards-render", { bubbles: true }));
  } catch (_e) {
    /* ignore */
  }
}

/** @param {ParentNode} root */
function bindFavoriteButtons(root) {
  const scope = root && "querySelectorAll" in root ? root : document;
  scope.querySelectorAll(".place-card").forEach((card) => {
    if (!(card instanceof HTMLElement)) return;
    if (card.closest("#business-spa-root")) return;
    if (card.getAttribute("data-marquee-clone") === "true") return;
    if (card.querySelector(":scope > .place-card__favorite-btn")) return;

    const businessId = resolveBusinessIdFromListingCard(card);
    if (!businessId) return;

    card.setAttribute("data-business-id", businessId);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "place-card__favorite-btn";
    btn.setAttribute("data-favorite-business-id", businessId);
    btn.setAttribute("aria-pressed", "false");
    btn.setAttribute("aria-label", "Add to liked businesses");
    btn.innerHTML =
      '<svg class="place-card__favorite-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">' +
      '<path class="place-card__favorite-outline" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>' +
      '<path class="place-card__favorite-fill" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>' +
      "</svg>";

    card.appendChild(btn);

    const session = readAuthSession();
    if (session?.email) {
      setButtonVisual(btn, isBusinessLiked(session.email, businessId));
    }
  });
}

function onFavoriteClick(ev) {
  const t = ev.target;
  const btn = t && typeof t.closest === "function" ? t.closest(".place-card__favorite-btn") : null;
  if (!(btn instanceof HTMLButtonElement)) return;

  ev.preventDefault();
  ev.stopPropagation();

  const businessId = btn.getAttribute("data-favorite-business-id");
  if (!businessId) return;

  const session = readAuthSession();
  if (!session?.email) {
    requestLoginToFavorite(businessId);
    return;
  }

  const email = session.email;
  const wasLiked = isBusinessLiked(email, businessId);

  if (wasLiked) {
    removeFavorite(email, businessId);
    setButtonVisual(btn, false);
    document.querySelectorAll(".place-card__favorite-btn").forEach((b) => {
      if (b instanceof HTMLButtonElement && b.getAttribute("data-favorite-business-id") === businessId) {
        setButtonVisual(b, false);
      }
    });
    removeSaveBar();
  } else {
    addFavorite(email, businessId, getLastUsedFolderId(email));
    setButtonVisual(btn, true);
    document.querySelectorAll(".place-card__favorite-btn").forEach((b) => {
      if (b instanceof HTMLButtonElement && b.getAttribute("data-favorite-business-id") === businessId) {
        setButtonVisual(b, true);
      }
    });
    showSaveCollectionBar(btn, email, businessId);
  }

  refreshLikedSection();
  emitFavoritesChanged();
}

function boot() {
  bindFavoriteButtons(document);
  const appliedPending = applyPendingFavoriteAfterLogin();
  syncAllFavoriteButtons();
  refreshLikedSection();
  if (appliedPending) emitFavoritesChanged();

  document.addEventListener("click", onFavoriteClick, true);

  document.addEventListener(
    "qlist:hv-cards-render",
    () => {
      bindFavoriteButtons(document);
      syncAllFavoriteButtons();
    },
    false,
  );

  window.addEventListener("qlist:favorites-changed", () => {
    syncAllFavoriteButtons();
    refreshLikedSection();
  });

  window.addEventListener("qlist:session-changed", () => {
    const applied = applyPendingFavoriteAfterLogin();
    syncAllFavoriteButtons();
    refreshLikedSection();
    if (applied) emitFavoritesChanged();
  });

  window.addEventListener("storage", (e) => {
    if (!e.key) return;
    if (!e.key.startsWith("qlist-favorites-v1:") && !e.key.startsWith("qlist-user-business-likes:")) return;
    syncAllFavoriteButtons();
    refreshLikedSection();
  });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    queueMicrotask(boot);
  }
}

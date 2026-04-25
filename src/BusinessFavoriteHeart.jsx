import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  addFavorite,
  createFolder,
  emitFavoritesChanged,
  getLastUsedFolderId,
  isBusinessLiked,
  moveFavoriteToFolder,
  readAuthSession,
  readFavoritesState,
  removeFavorite,
  requestLoginToFavorite,
  setLastUsedFolderId,
} from "./businessLikesStore.js";

const HEART_SVG = (
  <svg className="place-card__favorite-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path
      className="place-card__favorite-outline"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
    />
    <path
      className="place-card__favorite-fill"
      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
    />
  </svg>
);

/** @param {{ open: boolean; anchorEl: HTMLElement | null; email: string; businessId: string; onClose: () => void }} props */
function FavoriteFolderBar({ open, anchorEl, email, businessId, onClose }) {
  const uid = useId().replace(/:/g, "");
  const barRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const newFolderInputRef = useRef(/** @type {HTMLInputElement | null} */ (null));

  useLayoutEffect(() => {
    if (!open || !anchorEl || !barRef.current) return;
    const r = anchorEl.getBoundingClientRect();
    const bar = barRef.current;
    const w = bar.offsetWidth || 260;
    const h = bar.offsetHeight || 140;
    const left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8));
    const top = Math.min(window.innerHeight - h - 8, r.bottom + 6);
    bar.style.left = `${left}px`;
    bar.style.top = `${top}px`;
  }, [open, anchorEl, businessId]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(onClose, 12000);
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !email) return null;

  const state = readFavoritesState(email);
  const row = state.favorites.find((x) => x.business_id === businessId);

  return createPortal(
    <div ref={barRef} className="qlist-like-save-bar" style={{ position: "fixed", zIndex: 100 }}>
      <label htmlFor={`biz-like-folder-select-${uid}`}>Collection</label>
      <select
        id={`biz-like-folder-select-${uid}`}
        value={row?.folder_id ?? state.folders[0]?.id ?? ""}
        onChange={(e) => {
          moveFavoriteToFolder(email, businessId, e.target.value);
          setLastUsedFolderId(email, e.target.value);
          emitFavoritesChanged();
        }}
      >
        {state.folders.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
          </option>
        ))}
      </select>
      <div className="qlist-like-save-bar__new">
        <input
          ref={newFolderInputRef}
          type="text"
          placeholder="New collection…"
          aria-label="New collection name"
        />
        <button
          type="button"
          onClick={() => {
            const inp = newFolderInputRef.current;
            const name = inp ? String(inp.value || "").trim() : "";
            if (!name) return;
            const folder = createFolder(email, name);
            if (inp) inp.value = "";
            if (folder) {
              moveFavoriteToFolder(email, businessId, folder.id);
              emitFavoritesChanged();
            }
          }}
        >
          Add
        </button>
      </div>
      <button type="button" className="qlist-like-save-bar__dismiss" onClick={onClose}>
        Done
      </button>
    </div>,
    document.body,
  );
}

/**
 * Favorite control aligned like listing cards (`place-card__favorite-btn` in globals.css).
 * @param {{ businessId: string; className?: string }} props
 */
export function BusinessFavoriteHeart({ businessId, className = "" }) {
  const [liked, setLiked] = useState(false);
  const [folderBar, setFolderBar] = useState(false);
  const btnRef = useRef(/** @type {HTMLButtonElement | null} */ (null));

  const syncFromStorage = useCallback(() => {
    const session = readAuthSession();
    const email = session?.email;
    setLiked(email ? isBusinessLiked(email, businessId) : false);
    if (!email || !isBusinessLiked(email, businessId)) setFolderBar(false);
  }, [businessId]);

  useEffect(() => {
    syncFromStorage();
    const onSession = () => syncFromStorage();
    const onStorage = (e) => {
      if (
        e.key &&
        (e.key.startsWith("qlist-favorites-v1:") || e.key.startsWith("qlist-user-business-likes:"))
      ) {
        syncFromStorage();
      }
    };
    const onFavorites = () => syncFromStorage();
    window.addEventListener("qlist:session-changed", onSession);
    window.addEventListener("storage", onStorage);
    window.addEventListener("qlist:favorites-changed", onFavorites);
    return () => {
      window.removeEventListener("qlist:session-changed", onSession);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("qlist:favorites-changed", onFavorites);
    };
  }, [syncFromStorage]);

  const session = readAuthSession();
  const email = session?.email ?? "";

  const onClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session?.email) {
      requestLoginToFavorite(businessId);
      return;
    }

    if (liked) {
      removeFavorite(session.email, businessId);
      setLiked(false);
      setFolderBar(false);
      emitFavoritesChanged();
      return;
    }
    addFavorite(session.email, businessId, getLastUsedFolderId(session.email));
    setLiked(true);
    setFolderBar(true);
    emitFavoritesChanged();
  };

  const label = liked ? "Remove from liked businesses" : "Add to liked businesses";

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={`place-card__favorite-btn ${liked ? "is-liked" : ""} ${className}`.trim()}
        data-favorite-business-id={businessId}
        aria-pressed={liked ? "true" : "false"}
        aria-label={label}
        onClick={onClick}
      >
        {HEART_SVG}
      </button>
      <FavoriteFolderBar
        open={folderBar && Boolean(liked)}
        anchorEl={btnRef.current}
        email={email}
        businessId={businessId}
        onClose={() => setFolderBar(false)}
      />
    </>
  );
}

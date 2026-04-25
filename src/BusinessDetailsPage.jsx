import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  buildSlotsForDay,
  dateToDayKey,
  filterAvailableSlots,
  minutesToHM,
  parseHMToMinutes,
  toISODate,
} from "./bookingSlots.js";
import {
  businessPath,
  categoryPageHrefForCanonicalCategory,
  homeHref,
  recommendedBusinesses,
  resolveBusiness,
} from "./businessesData.js";
import { BusinessFavoriteHeart } from "./BusinessFavoriteHeart.jsx";
import { QlistLogo } from "./QlistLogo.jsx";
import { StaffProfessionalModal } from "./StaffProfessionalModal.jsx";
import { demoReviewAvatarUrl, reviewAuthorInitial } from "./reviewAvatars.js";

function ReviewAuthor({ name, avatarUrl, index = 0 }) {
  const [imgFailed, setImgFailed] = useState(false);
  const initial = reviewAuthorInitial(name);
  const src = (avatarUrl && String(avatarUrl).trim()) || demoReviewAvatarUrl(name, index);
  const showFallback = imgFailed || !src;

  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <span className="relative inline-flex h-8 w-8 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
        {!showFallback ? (
          <img
            src={src}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span
            className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-700"
            aria-hidden="true"
          >
            {initial}
          </span>
        )}
      </span>
      <span className="truncate font-medium text-slate-900">{name}</span>
    </span>
  );
}

function Stars({ rating, size = "md" }) {
  const full = Math.round(rating);
  const cls = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className={cls + (i < full ? " text-amber-500" : " text-slate-300")}
          fill={i < full ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.2"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  );
}

const carouselArrowBtnClass =
  "absolute top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#0A0F1E]/12 bg-white text-[#0A0F1E] shadow-sm transition hover:border-[#0A0F1E]/22 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A0F1E]/35 active:scale-[0.97]";

/** @param {unknown} layoutKey */
function useHorizontalSnapScroller(layoutKey) {
  const scrollerRef = useRef(/** @type {HTMLUListElement | null} */ (null));
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const [overflows, setOverflows] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    if (max <= 4) {
      setCanLeft(false);
      setCanRight(false);
      setOverflows(false);
      return;
    }
    setOverflows(true);
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < max - 4);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      ro.disconnect();
    };
  }, [layoutKey, updateArrows]);

  const scrollNext = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const x = el.scrollLeft + 6;
    for (const child of el.children) {
      if (!(child instanceof HTMLElement)) continue;
      if (child.offsetLeft > x) {
        el.scrollTo({ left: child.offsetLeft, behavior: "smooth" });
        return;
      }
    }
    el.scrollTo({ left: el.scrollWidth - el.clientWidth, behavior: "smooth" });
  }, []);

  const scrollPrev = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const x = el.scrollLeft - 6;
    const kids = [...el.children].reverse();
    for (const child of kids) {
      if (!(child instanceof HTMLElement)) continue;
      if (child.offsetLeft < x) {
        el.scrollTo({ left: child.offsetLeft, behavior: "smooth" });
        return;
      }
    }
    el.scrollTo({ left: 0, behavior: "smooth" });
  }, []);

  const padClass = overflows ? "px-10" : "px-0";
  return { scrollerRef, canLeft, canRight, padClass, scrollNext, scrollPrev };
}

/** @param {{ reviews: Array<{ userName: string; avatarUrl?: string; rating: number; comment: string }> }} props */
function ReviewsCarousel({ reviews }) {
  const layoutKey = reviews.map((r) => r.userName).join("\0");
  const { scrollerRef, canLeft, canRight, padClass, scrollNext, scrollPrev } = useHorizontalSnapScroller(layoutKey);

  return (
    <div className="relative mt-6">
      {canLeft ? (
        <button type="button" className={`${carouselArrowBtnClass} left-0`} onClick={scrollPrev} aria-label="Previous reviews">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ) : null}
      {canRight ? (
        <button type="button" className={`${carouselArrowBtnClass} right-0`} onClick={scrollNext} aria-label="Next reviews">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ) : null}

      <ul
        ref={scrollerRef}
        className={
          "flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden " +
          padClass
        }
        role="list"
      >
        {reviews.map((r, idx) => (
          <li
            key={r.userName + idx}
            className="w-[min(300px,calc(100vw-4.5rem))] shrink-0 snap-start sm:w-[300px]"
          >
            <div className="flex h-full flex-col rounded-xl border border-[#0A0F1E]/10 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                <ReviewAuthor name={r.userName} avatarUrl={r.avatarUrl} index={idx} />
                <Stars rating={r.rating} size="sm" />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{r.comment}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** @typedef {{ id: string; name: string; category: string; averageRating: number; images: string[] }} RecommendedBiz */

/**
 * Static stacked-gallery URLs for the “See all” folder tile (one disjoint triple per canonical category).
 * Picsum `seed` URLs are deterministic — swap for `/public/...` assets like `barber1.jpg` when you add files.
 * @type {Record<string, readonly [string, string, string]>}
 */
const SIMILAR_PLACES_FOLDER_STACK_BY_CATEGORY = {
  Barbershop: [
    "https://picsum.photos/seed/qlist-fold-barber-1/384/320",
    "https://picsum.photos/seed/qlist-fold-barber-2/384/320",
    "https://picsum.photos/seed/qlist-fold-barber-3/384/320",
  ],
  Spa: [
    "https://picsum.photos/seed/qlist-fold-spa-1/384/320",
    "https://picsum.photos/seed/qlist-fold-spa-2/384/320",
    "https://picsum.photos/seed/qlist-fold-spa-3/384/320",
  ],
  Fitness: [
    "https://picsum.photos/seed/qlist-fold-fitness-1/384/320",
    "https://picsum.photos/seed/qlist-fold-fitness-2/384/320",
    "https://picsum.photos/seed/qlist-fold-fitness-3/384/320",
  ],
  Nails: [
    "https://picsum.photos/seed/qlist-fold-nails-1/384/320",
    "https://picsum.photos/seed/qlist-fold-nails-2/384/320",
    "https://picsum.photos/seed/qlist-fold-nails-3/384/320",
  ],
  Taxi: [
    "https://picsum.photos/seed/qlist-fold-taxi-1/384/320",
    "https://picsum.photos/seed/qlist-fold-taxi-2/384/320",
    "https://picsum.photos/seed/qlist-fold-taxi-3/384/320",
  ],
};

const SIMILAR_PLACES_FOLDER_STACK_DEFAULT = [
  "https://picsum.photos/seed/qlist-fold-other-1/384/320",
  "https://picsum.photos/seed/qlist-fold-other-2/384/320",
  "https://picsum.photos/seed/qlist-fold-other-3/384/320",
];

/** @param {string} category */
function similarPlacesFolderStackImages(category) {
  const key = typeof category === "string" ? category.trim() : "";
  const triple = SIMILAR_PLACES_FOLDER_STACK_BY_CATEGORY[key];
  return triple ?? SIMILAR_PLACES_FOLDER_STACK_DEFAULT;
}

/** @param {{ href: string; category: string }} props */
function SimilarPlacesFolderCard({ href, category }) {
  const [demo1, demo2, demo3] = similarPlacesFolderStackImages(category);
  return (
    <div className="group relative h-full min-h-[240px]">
      <div className="relative flex h-full min-h-[240px] flex-col overflow-visible rounded-xl border border-dashed border-[#0A0F1E]/25 bg-white shadow-sm transition-[transform,box-shadow,border-color] duration-200 ease-out will-change-transform group-hover:scale-105 group-hover:border-[#0A0F1E]/40 group-hover:shadow-md">
        <a
          href={href}
          className="place-card__stretched-link"
          aria-label={`See all ${category} listings on Explore`}
        />
        <div className="relative z-[1] flex min-h-0 flex-1 flex-col items-center justify-center p-3">
          <div className="relative mx-auto mb-3 h-24 w-32 shrink-0" aria-hidden="true">
            <img
              src={demo1}
              alt=""
              className="absolute left-0 top-2 z-10 h-20 w-24 rotate-[-6deg] rounded-xl object-cover shadow-md shadow-slate-900/15 ring-1 ring-qlist-night/5"
              loading="lazy"
              decoding="async"
            />
            <img
              src={demo2}
              alt=""
              className="absolute left-6 top-0 z-20 h-20 w-24 rotate-[4deg] rounded-xl object-cover shadow-md shadow-slate-900/15 ring-1 ring-qlist-night/5"
              loading="lazy"
              decoding="async"
            />
            <img
              src={demo3}
              alt=""
              className="absolute left-12 top-3 z-30 h-20 w-24 rotate-[10deg] rounded-xl object-cover shadow-md shadow-slate-900/15 ring-1 ring-qlist-night/5"
              loading="lazy"
              decoding="async"
            />
          </div>
          <p className="relative z-[1] text-center text-sm font-semibold text-slate-800">See all</p>
          <p className="relative z-[1] mt-0.5 text-center text-xs font-medium uppercase tracking-[0.06em] text-slate-400">{category}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * @param {{ items: RecommendedBiz[]; folder?: { href: string; category: string } | null }} props
 * Folder tile is appended as the last entry in the same flex row as business cards (single map).
 */
function RecommendedPlacesCarousel({ items, folder }) {
  const carouselItems = folder ? [...items, { type: "folder", href: folder.href, category: folder.category }] : items;
  const layoutKey = carouselItems.map((x) => ("type" in x && x.type === "folder" ? "folder" : x.id)).join("\0");
  const { scrollerRef, canLeft, canRight, padClass, scrollNext, scrollPrev } = useHorizontalSnapScroller(layoutKey);

  return (
    <div className="relative mt-5">
      {canLeft ? (
        <button
          type="button"
          className={`${carouselArrowBtnClass} left-0`}
          onClick={scrollPrev}
          aria-label="Previous similar places"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ) : null}
      {canRight ? (
        <button
          type="button"
          className={`${carouselArrowBtnClass} right-0`}
          onClick={scrollNext}
          aria-label="Next similar places"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ) : null}

      <ul
        ref={scrollerRef}
        className={
          "flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden " +
          padClass
        }
        role="list"
      >
        {carouselItems.map((item) => {
          if ("type" in item && item.type === "folder") {
            return (
              <li key="folder" className="w-[min(220px,calc(100vw-4.5rem))] shrink-0 snap-start sm:w-[220px]">
                <SimilarPlacesFolderCard href={item.href} category={item.category} />
              </li>
            );
          }
          const b = item;
          return (
            <li key={b.id} className="w-[min(220px,calc(100vw-4.5rem))] shrink-0 snap-start sm:w-[220px]">
              <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-[#0A0F1E]/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[#0A0F1E]/18 hover:shadow-md">
                <a href={businessPath(b.id)} className="place-card__stretched-link" aria-label={`View ${b.name}`} />
                <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
                  <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-slate-100">
                    {b.images?.[0] ? (
                      <img
                        src={b.images[0]}
                        alt=""
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-slate-300" aria-hidden="true">
                        {b.name.slice(0, 1)}
                      </div>
                    )}
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col p-3.5">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug text-slate-800 group-hover:text-slate-900">{b.name}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <Stars rating={b.averageRating} size="sm" />
                      <span className="text-xs font-medium text-slate-600">{b.averageRating.toFixed(1)}</span>
                    </div>
                    <p className="mt-1.5 text-xs font-medium uppercase tracking-[0.06em] text-slate-400">{b.category}</p>
                  </div>
                </div>
                <BusinessFavoriteHeart businessId={b.id} className="z-[7]" />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Full-screen photo viewer: horizontal strip with native scroll (wheel / touchpad).
 * Index changes only from explicit controls (arrows / keyboard), not from scroll position.
 * @param {{
 *   open: boolean;
 *   activeIndex: number;
 *   images: string[];
 *   businessName: string;
 *   onClose: () => void;
 *   onIndexChange: (next: number) => void;
 * }} props
 */
function PhotoLightbox({ open, activeIndex, images, businessName, onClose, onIndexChange }) {
  const n = images.length;
  const safeIndex = n > 0 ? ((activeIndex % n) + n) % n : 0;

  const modalRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const stripRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const safeIndexRef = useRef(safeIndex);

  safeIndexRef.current = safeIndex;

  useLayoutEffect(() => {
    if (!open || n <= 1) return;
    const strip = stripRef.current;
    if (!strip) return;
    const alignToIndex = () => {
      const w = strip.clientWidth;
      if (w < 1) return;
      const target = safeIndex * w;
      if (Math.abs(strip.scrollLeft - target) > 2) {
        strip.scrollTo({ left: target, behavior: "instant" });
      }
    };
    alignToIndex();
    const ro = new ResizeObserver(() => alignToIndex());
    ro.observe(strip);
    return () => ro.disconnect();
  }, [open, n, safeIndex]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (n <= 1) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onIndexChange((safeIndexRef.current - 1 + n) % n);
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        onIndexChange((safeIndexRef.current + 1) % n);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, n, onClose, onIndexChange]);

  if (!open || n === 0) return null;

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center overscroll-contain bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={businessName ? `Photos · ${businessName}` : "Photos"}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button
        type="button"
        className="absolute right-6 top-6 z-[60] text-2xl leading-none text-white transition hover:text-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Close"
      >
        ✕
      </button>
      {n > 1 ? (
        <>
          <button
            type="button"
            className="absolute left-6 top-1/2 z-[60] -translate-y-1/2 text-3xl leading-none text-white transition hover:text-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            onClick={(e) => {
              e.stopPropagation();
              onIndexChange((safeIndex - 1 + n) % n);
            }}
            aria-label="Previous photo"
          >
            ‹
          </button>
          <button
            type="button"
            className="absolute right-6 top-1/2 z-[60] -translate-y-1/2 text-3xl leading-none text-white transition hover:text-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            onClick={(e) => {
              e.stopPropagation();
              onIndexChange((safeIndex + 1) % n);
            }}
            aria-label="Next photo"
          >
            ›
          </button>
        </>
      ) : null}
      <div className="z-[1] flex w-full max-w-full justify-center px-4" onClick={(e) => e.stopPropagation()}>
        <div
          ref={stripRef}
          className={
            "flex max-h-[min(80vh,100dvh-6rem)] w-full max-w-[min(100vw-2rem,100%)] flex-nowrap overflow-x-auto overflow-y-hidden overscroll-x-contain " +
            "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden " +
            (n > 1 ? "touch-pan-x" : "touch-pan-y")
          }
        >
          {images.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className="flex min-h-[min(80vh,100dvh-6rem)] min-w-full shrink-0 items-center justify-center"
            >
              <img
                src={src}
                alt=""
                draggable={false}
                loading={i === safeIndex ? "eager" : "lazy"}
                decoding="async"
                className="max-h-[80vh] max-w-[75%] rounded-2xl object-cover shadow-2xl"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** @param {{ open: boolean; onClose: () => void; businessName: string; shareUrl: string }} props */
function ShareModal({ open, onClose, businessName, shareUrl }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[115] flex items-center justify-center bg-black/40 px-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-[#0A0F1E]/10 bg-white p-6 shadow-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="share-modal-title" className="text-lg font-semibold text-slate-900">
          Share
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          {businessName ? (
            <>
              Share <span className="font-medium text-slate-800">{businessName}</span> with clients or friends.
            </>
          ) : (
            "Share this listing."
          )}
        </p>
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Link</p>
          <p className="mt-1 break-all text-sm text-slate-800">{shareUrl || "—"}</p>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Native share, QR code, and copy-to-clipboard will plug in here.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-qlist-night py-3 text-sm font-medium text-white shadow-sm transition hover:bg-qlist-night-hover"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function BookingModal({ open, onClose, businessName, serviceNames, timeLabel, staffNote }) {
  if (!open) return null;
  const servicesLine =
    serviceNames && serviceNames.length ? serviceNames.join(" · ") : "";
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-[#0A0F1E]/10 bg-white p-6 shadow-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="booking-modal-title" className="text-lg font-semibold text-slate-900">
          Booking
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          {businessName ? (
            <>
              <span className="font-medium text-slate-800">{businessName}</span>
              {servicesLine ? (
                <>
                  {" · "}
                  <span className="font-medium text-slate-800">{servicesLine}</span>
                </>
              ) : null}
              {timeLabel ? (
                <>
                  {" · "}
                  {timeLabel}
                </>
              ) : null}
            </>
          ) : null}
          {!businessName && !servicesLine ? "Confirm your selection to continue." : null}
        </p>
        {staffNote ? (
          <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {staffNote}
          </p>
        ) : null}
        <p className="mt-2 text-sm text-slate-500">Checkout flow coming soon.</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-qlist-night py-3 text-sm font-medium text-white shadow-sm transition hover:bg-qlist-night-hover"
        >
          Close
        </button>
      </div>
    </div>
  );
}

const cardShell =
  "rounded-xl border border-[#0A0F1E]/10 bg-white p-6 shadow-sm md:p-8";

const STAFF_GRID_MAX_INITIAL = 8;

/**
 * @param {{
 *   member: {
 *     id: string;
 *     name: string;
 *     role?: string;
 *     photo?: string;
 *     serviceIds: string[];
 *     rating?: number;
 *     reviewCount?: number;
 *   };
 *   index: number;
 *   selected: boolean;
 *   onToggle: (id: string) => void;
 * }} props
 */
function StaffSelectTile({ member, index, selected, onToggle }) {
  const [imgFailed, setImgFailed] = useState(false);
  const initial = reviewAuthorInitial(member.name);
  const customPhoto = member.photo && String(member.photo).trim();
  const src = customPhoto || demoReviewAvatarUrl(member.name, index);

  return (
    <li className="min-w-0 list-none">
      <button
        type="button"
        onClick={() => onToggle(member.id)}
        aria-pressed={selected}
        className={
          "flex w-full flex-col items-center rounded-xl border-0 bg-transparent px-1 pb-1 pt-0.5 text-center transition-opacity duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-qlist-night focus-visible:ring-offset-2 " +
          (selected ? "opacity-100" : "opacity-70 hover:opacity-100")
        }
      >
        <span
          className={
            "relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-slate-100 md:h-16 md:w-16 " +
            (selected
              ? "ring-2 ring-qlist-night ring-offset-2 ring-offset-white"
              : "ring-0 ring-offset-0")
          }
        >
          {!imgFailed ? (
            <img
              src={src}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-600">
              {initial}
            </span>
          )}
        </span>
        <p className="mt-2 min-w-0 max-w-full truncate text-xs font-semibold text-slate-900 md:text-[13px]">
          {member.name}
        </p>
        {member.role ? (
          <p className="mt-0.5 min-w-0 max-w-full truncate text-[11px] font-medium leading-snug text-slate-500">
            {member.role}
          </p>
        ) : null}
        {typeof member.rating === "number" && Number.isFinite(member.rating) ? (
          <p className="mt-1 inline-flex items-center justify-center gap-0.5 text-[10px] font-semibold text-amber-700 md:text-[11px]">
            <span className="text-amber-500" aria-hidden="true">
              ★
            </span>
            {member.rating.toFixed(1)}
            {typeof member.reviewCount === "number" && member.reviewCount > 0 ? (
              <span className="font-medium text-slate-400">({member.reviewCount})</span>
            ) : null}
          </p>
        ) : null}
      </button>
    </li>
  );
}

/**
 * Minimal row avatar for the main-column professionals preview (opens detail modal).
 * @param {{ name: string; photo?: string; index: number; onOpen: () => void; rating?: number; subtitle?: string | null }} props
 */
function ProfessionalRowAvatar({ name, photo, index, onOpen, rating, subtitle }) {
  const [imgFailed, setImgFailed] = useState(false);
  const initial = reviewAuthorInitial(name);
  const customPhoto = photo && String(photo).trim();
  const src = customPhoto || demoReviewAvatarUrl(name, index);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-[4.75rem] shrink-0 cursor-pointer flex-col items-center border-0 bg-transparent p-0 text-center outline-none transition-transform duration-200 ease-out hover:scale-105 focus-visible:ring-2 focus-visible:ring-qlist-night focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8FAFC] md:w-[5.25rem]"
    >
      <span className="pointer-events-none h-12 w-12 shrink-0 overflow-hidden rounded-full bg-slate-100 md:h-14 md:w-14">
        {!imgFailed ? (
          <img
            src={src}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-600">
            {initial}
          </span>
        )}
      </span>
      <span className="pointer-events-none mt-2 w-full truncate text-[11px] font-semibold leading-tight text-slate-900 md:text-xs">
        {name}
      </span>
      {subtitle ? (
        <span className="pointer-events-none mt-0.5 line-clamp-2 min-h-[1.5rem] w-full px-0.5 text-[9px] font-medium leading-tight text-emerald-700 md:text-[10px]">
          {subtitle}
        </span>
      ) : typeof rating === "number" && Number.isFinite(rating) ? (
        <span className="pointer-events-none mt-0.5 text-[9px] font-semibold text-amber-700 md:text-[10px]">
          {rating.toFixed(1)} ★
        </span>
      ) : null}
    </button>
  );
}

/** @param {string | undefined} price */
function parsePriceValue(price) {
  if (!price || typeof price !== "string") return null;
  const t = price.trim();
  if (/\bfree\b/i.test(t)) return 0;
  const m = t.match(/\$\s*([\d,]+(?:\.\d{2})?)/);
  if (m) return Number(m[1].replace(/,/g, ""));
  return null;
}

/** @param {string | undefined} duration */
function parseDurationMinutes(duration) {
  if (!duration || typeof duration !== "string") return null;
  if (/varies/i.test(duration)) return null;
  let mins = 0;
  const hrM = duration.match(/(\d+(?:\.\d+)?)\s*(?:hr|h)\b/i);
  const minM = duration.match(/(\d+)\s*min/i);
  if (hrM) mins += Math.round(parseFloat(hrM[1]) * 60);
  if (minM) mins += parseInt(minM[1], 10);
  return mins > 0 ? mins : null;
}

/** @param {number} totalMin */
function formatTotalDuration(totalMin) {
  if (!Number.isFinite(totalMin) || totalMin <= 0) return null;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h && m) return `${h} hr ${m} min`;
  if (h) return `${h} hr`;
  return `${m} min`;
}

/** @param {number} n */
function formatMoney(n) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);
}

/** @param {string} startHM @param {number} durationMin */
function formatSlotRangeLabel(startHM, durationMin) {
  if (!startHM || !Number.isFinite(durationMin) || durationMin <= 0) return startHM || "";
  const a = parseHMToMinutes(startHM);
  return `${startHM}–${minutesToHM(a + durationMin)}`;
}

/** @param {string} iso yyyy-mm-dd */
function parseLocalISODate(iso) {
  const p = String(iso || "").split("-").map((x) => parseInt(x, 10));
  if (p.length !== 3 || p.some((n) => Number.isNaN(n))) return new Date();
  return new Date(p[0], p[1] - 1, p[2]);
}

/**
 * @param {Record<string, { enabled: boolean; start: string; end: string }>} sched
 * @param {Date} [from]
 */
function firstEnabledDayISO(sched, from = new Date()) {
  const cur = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  for (let i = 0; i < 56; i++) {
    const dk = dateToDayKey(cur);
    if (sched[dk]?.enabled) return toISODate(cur);
    cur.setDate(cur.getDate() + 1);
  }
  return toISODate(from);
}

/** @param {string} iso */
function formatDateChipLabel(iso) {
  const d = parseLocalISODate(iso);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

/** @param {string} hm "HH:mm" */
function formatClockLabel(hm) {
  const m = String(hm || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return hm;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (Number.isNaN(h) || Number.isNaN(min)) return hm;
  const d = new Date(2000, 0, 1, h, min);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/**
 * @param {Record<string, { enabled: boolean; start: string; end: string }>} weeklySchedule
 * @param {Date} [now]
 */
function getOpenClosedState(weeklySchedule, now = new Date()) {
  const dk = dateToDayKey(now);
  const row = weeklySchedule[dk];
  if (!row?.enabled) {
    return { open: false, label: "Closed today", detail: null };
  }
  const cur = now.getHours() * 60 + now.getMinutes();
  const start = parseHMToMinutes(row.start);
  const end = parseHMToMinutes(row.end);
  if (cur < start) {
    return {
      open: false,
      label: "Closed",
      detail: `Opens today ${formatClockLabel(row.start)}`,
    };
  }
  if (cur >= end) {
    let walk = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    for (let i = 0; i < 8; i++) {
      const nk = dateToDayKey(walk);
      const nr = weeklySchedule[nk];
      if (nr?.enabled) {
        return {
          open: false,
          label: "Closed",
          detail: `Opens ${walk.toLocaleDateString(undefined, { weekday: "long" })} ${formatClockLabel(nr.start)}`,
        };
      }
      walk.setDate(walk.getDate() + 1);
    }
    return { open: false, label: "Closed", detail: "Check schedule for hours" };
  }
  return {
    open: true,
    label: "Open now",
    detail: `Until ${formatClockLabel(row.end)}`,
  };
}

/** @param {Array<{ duration?: string }>} services */
function pickDefaultDurationMinutes(services) {
  if (!Array.isArray(services)) return null;
  for (const s of services) {
    const d = parseDurationMinutes(s.duration);
    if (d != null && d > 0) return d;
  }
  return null;
}

/** @param {Array<{ id?: string; name?: string; duration?: string }>} services */
function makeResolveBookingDuration(services) {
  return function resolveBookingDuration(serviceId, serviceName) {
    void serviceId;
    if (serviceName) {
      const match = services.find((s) => String(s.name) === String(serviceName));
      if (match) {
        const m = parseDurationMinutes(match.duration);
        if (m != null && m > 0) return m;
      }
    }
    return 30;
  };
}

/**
 * @param {{
 *   schedule: Record<string, { enabled: boolean; start: string; end: string }>;
 *   bookings: Array<{ date?: string; startTime?: string; endTime?: string; time?: string; status?: string; serviceId?: string; service?: string; staffId?: string }>;
 *   durationMin: number;
 *   services: Array<{ id?: string; name?: string; duration?: string }>;
 *   fromDate: Date;
 *   maxDays: number;
 * }} p
 */
function findFirstAvailableSlot(p) {
  const resolve = makeResolveBookingDuration(p.services);
  const cur = new Date(p.fromDate.getFullYear(), p.fromDate.getMonth(), p.fromDate.getDate());
  for (let i = 0; i < p.maxDays; i++) {
    const iso = toISODate(cur);
    const dk = dateToDayKey(cur);
    const row = p.schedule[dk];
    if (row?.enabled) {
      const candidates = buildSlotsForDay(row.start, row.end, p.durationMin);
      const avail = filterAvailableSlots(iso, candidates, p.durationMin, p.bookings, resolve);
      if (avail.length) return { dateISO: iso, slot: avail[0] };
    }
    cur.setDate(cur.getDate() + 1);
  }
  return null;
}

/** @param {string} dateISO @param {string} slotHM @param {Date} [now] */
function formatNextAvailableHuman(dateISO, slotHM, now = new Date()) {
  const todayISO = toISODate(now);
  const tmr = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const tomorrowISO = toISODate(tmr);
  const clock = formatClockLabel(slotHM);
  if (dateISO === todayISO) return `Today ${clock}`;
  if (dateISO === tomorrowISO) return `Tomorrow ${clock}`;
  const d = parseLocalISODate(dateISO);
  const dayPart = d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
  return `${dayPart} · ${clock}`;
}

/**
 * @param {Record<string, { enabled: boolean; start: string; end: string }>} sched
 * @param {string} startISO inclusive
 * @param {number} numDays
 */
function enumerateDayISOs(sched, startISO, numDays) {
  const out = [];
  const start = parseLocalISODate(startISO);
  const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  for (let i = 0; i < numDays; i++) {
    const dk = dateToDayKey(cur);
    if (sched[dk]?.enabled) out.push(toISODate(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

/**
 * @param {{
 *   hasService: boolean;
 *   needsProfessional: boolean;
 *   hasProfessional: boolean;
 *   hasTime: boolean;
 * }} props
 */
function BookingFlowSteps({ hasService, needsProfessional, hasProfessional, hasTime }) {
  const proDone = !needsProfessional || hasProfessional;
  const steps = needsProfessional
    ? [
        { key: "svc", label: "Service", done: hasService },
        { key: "pro", label: "Professional", done: proDone },
        { key: "time", label: "Time", done: hasTime },
      ]
    : [
        { key: "svc", label: "Service", done: hasService },
        { key: "time", label: "Time", done: hasTime },
      ];

  return (
    <nav aria-label="Booking steps" className="mt-4">
      <ol className="flex flex-wrap items-center gap-y-2">
        {steps.map((step, idx) => {
          const active =
            step.key === "svc"
              ? !hasService
              : step.key === "pro"
                ? hasService && needsProfessional && !hasProfessional
                : hasService && proDone && !hasTime;
          return (
            <li key={step.key} className="flex min-w-0 items-center">
              {idx > 0 ? (
                <span className="mx-2 shrink-0 text-slate-300" aria-hidden="true">
                  →
                </span>
              ) : null}
              <span
                className={
                  "inline-flex min-w-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold sm:text-xs " +
                  (step.done
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : active
                      ? "border-qlist-night bg-qlist-night text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-500")
                }
              >
                <span
                  className={
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] " +
                    (step.done ? "bg-emerald-600 text-white" : active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500")
                  }
                  aria-hidden="true"
                >
                  {step.done ? "✓" : idx + 1}
                </span>
                <span className="truncate">{step.label}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function BusinessDetailsPage() {
  const { id } = useParams();
  const business = useMemo(() => (id ? resolveBusiness(id) : null), [id]);
  const recommended = useMemo(() => (id ? recommendedBusinesses(id, { limit: 12 }) : []), [id]);
  const [selectedIndices, setSelectedIndices] = useState(() => new Set());
  const [selectedSlot, setSelectedSlot] = useState(/** @type {string | null} */ (null));
  const [bookingOpen, setBookingOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(/** @type {number | null} */ (null));

  const [bookingStaffNote, setBookingStaffNote] = useState(/** @type {string | null} */ (null));
  const [selectedStaffId, setSelectedStaffId] = useState(/** @type {string | null} */ (null));
  const [staffGridExpanded, setStaffGridExpanded] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [selectedBookingDateISO, setSelectedBookingDateISO] = useState(() => toISODate(new Date()));
  const [staffDetailModalIndex, setStaffDetailModalIndex] = useState(/** @type {number | null} */ (null));
  const bookingPanelRef = useRef(/** @type {HTMLElement | null} */ (null));

  const selectedServiceIds = useMemo(() => {
    if (!business) return new Set();
    const svcList = business.services || [];
    const ids = new Set();
    for (const i of selectedIndices) {
      const sid = svcList[i]?.id;
      if (sid) ids.add(sid);
    }
    return ids;
  }, [business, selectedIndices]);

  const filteredStaffForPicker = useMemo(() => {
    if (!business?.staff?.length) return [];
    const staffList = business.staff.filter((m) => m.bookable !== false);
    if (selectedServiceIds.size === 0) return staffList;
    return staffList.filter((m) => (m.serviceIds || []).some((sid) => selectedServiceIds.has(sid)));
  }, [business, selectedServiceIds]);

  useEffect(() => {
    if (!selectedStaffId) return;
    if (!filteredStaffForPicker.some((m) => m.id === selectedStaffId)) {
      setSelectedStaffId(null);
    }
  }, [selectedStaffId, filteredStaffForPicker]);

  useEffect(() => {
    setSelectedIndices(new Set());
    setSelectedSlot(null);
    setBookingOpen(false);
    setBookingStaffNote(null);
    setSelectedStaffId(null);
    setStaffGridExpanded(false);
    setLightboxIndex(null);
    setStaffDetailModalIndex(null);
    setSelectedBookingDateISO(toISODate(new Date()));
  }, [id]);

  useEffect(() => {
    setShareUrl(typeof window !== "undefined" ? window.location.href : "");
  }, [id]);

  if (!business) {
    console.error("Business not found:", id);
    return null;
  }

  const {
    name,
    description,
    images,
    services,
    reviews,
    averageRating,
    reviewCount: listingReviewCount,
    weeklySchedule,
    calendarBookings,
    address,
    lat,
    lng,
    staff = [],
    staffSectionEnabled = false,
    staffSectionTitle = "Staff",
  } = business;

  const displayedReviewCount =
    typeof listingReviewCount === "number" && Number.isFinite(listingReviewCount)
      ? listingReviewCount
      : reviews.length;

  const { selectedServices, totals } = useMemo(() => {
    const ordered = [...selectedIndices].sort((a, b) => a - b);
    const selectedServices = ordered
      .map((i) => services[i])
      .filter((s) => Boolean(s));
    let priceSum = 0;
    let priceAll = true;
    let durSum = 0;
    let durAll = true;
    for (const s of selectedServices) {
      const p = parsePriceValue(s.price);
      if (p === null) priceAll = false;
      else priceSum += p;
      const d = parseDurationMinutes(s.duration);
      if (d === null) durAll = false;
      else durSum += d;
    }
    return { selectedServices, totals: { priceSum, priceAll, durSum, durAll } };
  }, [selectedIndices, services]);

  const showStaffSection =
    staffSectionEnabled && Array.isArray(staff) && staff.length > 0 && selectedServices.length > 0;

  const staffFlowNeedsPro = showStaffSection;

  const selectedStaffMember = useMemo(() => {
    if (!business?.staff || !selectedStaffId) return null;
    return business.staff.find((m) => m.id === selectedStaffId) ?? null;
  }, [business, selectedStaffId]);

  const effectiveWeeklySchedule = useMemo(() => {
    const s = selectedStaffMember?.weeklySchedule;
    if (s && typeof s === "object") return s;
    return weeklySchedule;
  }, [selectedStaffMember, weeklySchedule]);

  const bookingsForAvailability = useMemo(() => {
    if (!staffFlowNeedsPro || !selectedStaffId) return calendarBookings;
    return calendarBookings.filter((b) => !b.staffId || b.staffId === selectedStaffId);
  }, [staffFlowNeedsPro, selectedStaffId, calendarBookings]);

  const selectableDateISOs = useMemo(() => {
    const sched = staffFlowNeedsPro && selectedStaffId ? effectiveWeeklySchedule : weeklySchedule;
    return enumerateDayISOs(sched, toISODate(new Date()), 21);
  }, [staffFlowNeedsPro, selectedStaffId, effectiveWeeklySchedule, weeklySchedule]);

  useEffect(() => {
    if (!staffFlowNeedsPro || !selectedStaffId) return;
    setSelectedBookingDateISO((prev) => {
      const sched = effectiveWeeklySchedule;
      const d = parseLocalISODate(prev);
      if (sched[dateToDayKey(d)]?.enabled) return prev;
      return firstEnabledDayISO(sched, new Date());
    });
  }, [selectedStaffId, staffFlowNeedsPro, effectiveWeeklySchedule]);

  useEffect(() => {
    if (!selectableDateISOs.includes(selectedBookingDateISO)) {
      const next = selectableDateISOs[0] ?? toISODate(new Date());
      if (next !== selectedBookingDateISO) setSelectedBookingDateISO(next);
    }
  }, [selectableDateISOs, selectedBookingDateISO]);

  const availableSlotsForSelectedDate = useMemo(() => {
    if (!selectedServices.length || !totals.durAll || totals.durSum <= 0) return [];
    if (staffFlowNeedsPro && !selectedStaffId) return [];
    const sched = staffFlowNeedsPro && selectedStaffId ? effectiveWeeklySchedule : weeklySchedule;
    const dayD = parseLocalISODate(selectedBookingDateISO);
    const dayKey = dateToDayKey(dayD);
    const row = sched[dayKey];
    if (!row || !row.enabled) return [];
    const dateISO = selectedBookingDateISO;
    const candidates = buildSlotsForDay(row.start, row.end, totals.durSum);
    function resolveBookingDuration(serviceId, serviceName) {
      void serviceId;
      if (serviceName) {
        const match = services.find((s) => String(s.name) === String(serviceName));
        if (match) {
          const m = parseDurationMinutes(match.duration);
          if (m != null && m > 0) return m;
        }
      }
      return 30;
    }
    return filterAvailableSlots(dateISO, candidates, totals.durSum, bookingsForAvailability, resolveBookingDuration);
  }, [
    business.id,
    totals.durAll,
    totals.durSum,
    weeklySchedule,
    effectiveWeeklySchedule,
    bookingsForAvailability,
    services,
    selectedServices.length,
    selectedBookingDateISO,
    staffFlowNeedsPro,
    selectedStaffId,
  ]);

  useEffect(() => {
    if (selectedSlot && !availableSlotsForSelectedDate.includes(selectedSlot)) {
      setSelectedSlot(null);
    }
  }, [selectedSlot, availableSlotsForSelectedDate]);

  const totalPriceLabel =
    selectedServices.length === 0
      ? "—"
      : totals.priceAll
        ? formatMoney(totals.priceSum)
        : totals.priceSum > 0
          ? `${formatMoney(totals.priceSum)}+`
          : "—";

  const totalDurationLabel =
    selectedServices.length === 0
      ? null
      : totals.durAll
        ? formatTotalDuration(totals.durSum)
        : totals.durSum > 0
          ? `${formatTotalDuration(totals.durSum)}+`
          : null;

  useEffect(() => {
    if (selectedServiceIds.size === 0) setSelectedStaffId(null);
  }, [selectedServiceIds.size]);

  function onBookNow() {
    if (selectedStaffMember) {
      const rolePart = selectedStaffMember.role ? ` (${selectedStaffMember.role})` : "";
      setBookingStaffNote(`Requested professional: ${selectedStaffMember.name}${rolePart}`);
    } else {
      setBookingStaffNote(null);
    }
    setBookingOpen(true);
  }

  const applyProfessionalFromModal = useCallback(
    ({ member, serviceId }) => {
      const idx = services.findIndex((s) => s.id === serviceId);
      const next = new Set();
      if (idx >= 0) {
        const svc = services[idx];
        const offers =
          (member.serviceIds || []).includes(svc.id) || (svc.linkedStaff || []).some((p) => p.id === member.id);
        if (offers) next.add(idx);
      }
      setSelectedIndices(next);
      setSelectedSlot(null);
      if (member.bookable !== false) setSelectedStaffId(member.id);
      else setSelectedStaffId(null);
      setStaffGridExpanded(true);
      setStaffDetailModalIndex(null);
      requestAnimationFrame(() => {
        bookingPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    },
    [services],
  );

  const staffMemberAtModal =
    staffDetailModalIndex != null && staff[staffDetailModalIndex] ? staff[staffDetailModalIndex] : null;
  const modalPanelSyncedServiceId =
    selectedStaffMember &&
    staffMemberAtModal &&
    selectedStaffMember.id === staffMemberAtModal.id &&
    selectedServices.length === 1
      ? selectedServices[0].id
      : null;

  const openState = useMemo(() => getOpenClosedState(weeklySchedule, new Date()), [weeklySchedule]);

  const defaultDemoDuration = useMemo(() => pickDefaultDurationMinutes(services), [services]);

  const previewStaffBookable = useMemo(
    () => (Array.isArray(staff) ? staff.filter((m) => m.bookable !== false) : []),
    [staff],
  );

  const nextAvailablePublic = useMemo(() => {
    if (defaultDemoDuration == null) return null;
    if (staffSectionEnabled && previewStaffBookable.length > 0) {
      let best = /** @type {{ dateISO: string; slot: string } | null} */ (null);
      for (const m of previewStaffBookable) {
        const sched = m.weeklySchedule || weeklySchedule;
        const bookings = (calendarBookings || []).filter((b) => !b.staffId || b.staffId === m.id);
        const hit = findFirstAvailableSlot({
          schedule: sched,
          bookings,
          durationMin: defaultDemoDuration,
          services,
          fromDate: new Date(),
          maxDays: 28,
        });
        if (!hit) continue;
        const key = `${hit.dateISO}T${hit.slot}`;
        const bestKey = best ? `${best.dateISO}T${best.slot}` : null;
        if (!bestKey || key < bestKey) best = hit;
      }
      return best;
    }
    return findFirstAvailableSlot({
      schedule: weeklySchedule,
      bookings: calendarBookings || [],
      durationMin: defaultDemoDuration,
      services,
      fromDate: new Date(),
      maxDays: 28,
    });
  }, [
    defaultDemoDuration,
    weeklySchedule,
    calendarBookings,
    services,
    staffSectionEnabled,
    previewStaffBookable,
  ]);

  const staffNextSlotLabel = useMemo(() => {
    const out = /** @type {Record<string, string>} */ ({});
    if (defaultDemoDuration == null || !previewStaffBookable.length) return out;
    const now = new Date();
    for (const m of previewStaffBookable) {
      const sched = m.weeklySchedule || weeklySchedule;
      const bookings = (calendarBookings || []).filter((b) => !b.staffId || b.staffId === m.id);
      const hit = findFirstAvailableSlot({
        schedule: sched,
        bookings,
        durationMin: defaultDemoDuration,
        services,
        fromDate: now,
        maxDays: 28,
      });
      if (hit) out[m.id] = `Next: ${formatNextAvailableHuman(hit.dateISO, hit.slot, now)}`;
    }
    return out;
  }, [defaultDemoDuration, previewStaffBookable, weeklySchedule, calendarBookings, services]);

  const hasBookableTimeChoice =
    selectedServices.length > 0 &&
    totals.durAll &&
    (!staffFlowNeedsPro || Boolean(selectedStaffId)) &&
    (!staffFlowNeedsPro || filteredStaffForPicker.length > 0);

  const bookingStepHasTime = Boolean(selectedSlot && hasBookableTimeChoice);

  const handleQuickBook = useCallback(() => {
    const svcs = business.services || [];
    const stf = business.staff || [];
    const ws = business.weeklySchedule;
    const cb = business.calendarBookings || [];
    const sse = business.staffSectionEnabled === true;

    let chosenIdx = -1;
    let chosenStaffId = /** @type {string | null} */ (null);
    for (let i = 0; i < svcs.length; i++) {
      const d = parseDurationMinutes(svcs[i].duration);
      if (d == null || d <= 0) continue;
      const pros = stf.filter((m) => m.bookable !== false && (m.serviceIds || []).includes(svcs[i].id));
      if (sse && stf.length > 0 && !pros.length) continue;
      chosenIdx = i;
      chosenStaffId = pros[0]?.id ?? null;
      break;
    }
    if (chosenIdx < 0) return;

    const dur = parseDurationMinutes(svcs[chosenIdx].duration);
    if (dur == null || dur <= 0) return;

    const member = stf.find((m) => m.id === chosenStaffId);
    const sched = member?.weeklySchedule || ws;
    const bookings = cb.filter((b) => !chosenStaffId || !b.staffId || b.staffId === chosenStaffId);
    const hit = findFirstAvailableSlot({
      schedule: sched,
      bookings,
      durationMin: dur,
      services: svcs,
      fromDate: new Date(),
      maxDays: 28,
    });

    setSelectedIndices(new Set([chosenIdx]));
    setSelectedStaffId(chosenStaffId);
    setStaffGridExpanded(true);
    if (hit) {
      setSelectedBookingDateISO(hit.dateISO);
      setSelectedSlot(hit.slot);
    } else {
      setSelectedBookingDateISO(toISODate(new Date()));
      setSelectedSlot(null);
    }
    requestAnimationFrame(() => {
      bookingPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [business]);

  const quickBookDisabled = useMemo(() => {
    const svcs = business.services || [];
    const stf = business.staff || [];
    const sse = business.staffSectionEnabled === true;
    const hasFixed = svcs.some((s) => {
      const d = parseDurationMinutes(s.duration);
      return d != null && d > 0;
    });
    if (!hasFixed) return true;
    if (!sse || !stf.length) return false;
    return !svcs.some((s) => {
      const d = parseDurationMinutes(s.duration);
      if (d == null || d <= 0) return false;
      return stf.some((m) => m.bookable !== false && (m.serviceIds || []).includes(s.id));
    });
  }, [business]);

  const directionsHref = useMemo(() => {
    if (address && String(address).trim()) {
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(String(address).trim())}`;
    }
    if (typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng)) {
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${lat},${lng}`)}`;
    }
    return null;
  }, [address, lat, lng]);

  const mapsPlaceHref =
    typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng)
      ? `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}`
      : null;

  const bookingStepProDone = !staffFlowNeedsPro || Boolean(selectedStaffId);

  return (
    <div className="min-h-screen bg-[#FAFCFD] pb-20 font-sans text-[#0A0F1E] antialiased">
      <PhotoLightbox
        open={lightboxIndex != null}
        activeIndex={lightboxIndex ?? 0}
        images={images}
        businessName={name}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
      />

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        businessName={name}
        shareUrl={shareUrl}
      />

      <BookingModal
        open={bookingOpen}
        onClose={() => {
          setBookingOpen(false);
          setBookingStaffNote(null);
        }}
        businessName={name}
        serviceNames={selectedServices.map((s) => s.name)}
        timeLabel={
          selectedSlot && totals.durAll && totals.durSum > 0
            ? `${formatSlotRangeLabel(selectedSlot, totals.durSum)} · ${selectedBookingDateISO}`
            : selectedSlot ?? ""
        }
        staffNote={bookingStaffNote}
      />

      <StaffProfessionalModal
        open={staffDetailModalIndex !== null}
        activeIndex={staffDetailModalIndex ?? 0}
        staffMembers={staff}
        onActiveIndexChange={setStaffDetailModalIndex}
        onClose={() => setStaffDetailModalIndex(null)}
        services={services}
        averageRating={averageRating}
        reviewsFallbackCount={reviews.length}
        panelSyncedServiceId={modalPanelSyncedServiceId}
        onBook={applyProfessionalFromModal}
      />

      <header className="border-b border-[#0A0F1E]/10 bg-[#F3F7FA]">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-6 md:px-8 md:pb-12 md:pt-8">
          <nav
            className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
            aria-label="Listing"
          >
            <a href={homeHref()} className="logo" aria-label="QList home">
              <QlistLogo />
            </a>
            <a
              href={homeHref()}
              className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-900 hover:decoration-slate-500"
            >
              <span aria-hidden="true">←</span> Back
            </a>
          </nav>

          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6 lg:mb-6">
            <h1 className="min-w-0 flex-1 text-3xl font-semibold tracking-tight text-slate-900 md:text-[2rem] lg:text-[2.25rem]">
              {name}
            </h1>
            <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end sm:pt-0.5">
              <button
                type="button"
                onClick={handleQuickBook}
                disabled={quickBookDisabled}
                className="inline-flex items-center gap-2 rounded-full border border-[#0A0F1E] bg-[#0A0F1E] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#121a30] disabled:cursor-not-allowed disabled:border-[#0A0F1E]/25 disabled:bg-[#0A0F1E]/35 disabled:text-white/80"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34.05-.08.07-.12C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.17c.6 0 .59.32.38.66-.19.34-.05.08-.07.12C14.52 13.06 12.58 16.46 10 21z" />
                </svg>
                Quick book
              </button>
              <button
                type="button"
                onClick={() => setShareOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-[#0A0F1E] bg-transparent px-4 py-2 text-sm font-semibold text-[#0A0F1E] shadow-none transition hover:bg-[#0A0F1E]/5"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" strokeLinecap="round" />
                  <path d="M16 6l-4-4-4 4M12 2v14" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Share
              </button>
              <div className="flex items-center gap-2 rounded-full border border-[#0A0F1E] bg-white py-1 pl-3 pr-1.5 shadow-sm">
                <span className="text-sm font-semibold text-[#0A0F1E]" aria-hidden="true">
                  Save
                </span>
                <BusinessFavoriteHeart businessId={business.id} className="place-card__favorite-btn--toolbar" />
              </div>
            </div>
          </div>

          <div className="mb-8 flex flex-col gap-3 sm:mb-10 md:flex-row md:flex-wrap md:items-center md:justify-between lg:mb-10">
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 text-sm">
              <span className="inline-flex items-center gap-2">
                <Stars rating={averageRating} />
                <span className="font-semibold text-slate-900">{averageRating.toFixed(1)}</span>
              </span>
              <a
                href="#listing-reviews"
                className="font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-900 hover:decoration-slate-500"
              >
                {displayedReviewCount} reviews
              </a>
              <span
                className={
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 " +
                  (openState.open
                    ? "bg-emerald-50 text-emerald-900 ring-emerald-200/80"
                    : "bg-slate-100 text-slate-700 ring-slate-200/80")
                }
              >
                <span className={"h-1.5 w-1.5 shrink-0 rounded-full " + (openState.open ? "bg-emerald-500" : "bg-slate-400")} aria-hidden="true" />
                {openState.label}
              </span>
              {openState.detail ? <span className="w-full text-slate-500 sm:w-auto">{openState.detail}</span> : null}
            </div>
            {nextAvailablePublic ? (
              <p className="text-sm font-medium text-slate-800">
                Next available:{" "}
                <span className="text-emerald-800">
                  {formatNextAvailableHuman(nextAvailablePublic.dateISO, nextAvailablePublic.slot, new Date())}
                </span>
              </p>
            ) : (
              <p className="text-sm text-slate-500">Pick a service with a fixed duration to see live openings.</p>
            )}
          </div>

          <p className="mb-8 max-w-3xl text-base leading-relaxed text-slate-600 md:mb-10 lg:text-[1.05rem]">{description}</p>

          <div className="flex flex-col gap-2 md:flex-row md:gap-3 md:h-[min(400px,48vh)] md:min-h-[280px]">
            <div className="relative aspect-[16/11] w-full min-h-[200px] shrink-0 overflow-hidden rounded-xl border border-[#0A0F1E]/10 bg-white md:aspect-auto md:min-h-0 md:flex-[1.65] md:flex-shrink-0">
              <button
                type="button"
                onClick={() => setLightboxIndex(0)}
                aria-label="View photo 1 larger"
                className="group relative block h-full min-h-0 w-full cursor-zoom-in border-0 bg-transparent p-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-qlist-night focus-visible:ring-offset-2"
              >
                <img
                  src={images[0]}
                  alt=""
                  className="h-full w-full object-cover transition duration-300 group-hover:opacity-95"
                  draggable={false}
                />
              </button>
            </div>

            {images.length > 1 ? (
              <>
                <div className="flex gap-2 md:hidden">
                  {images.slice(1, 4).map((src, idx) => {
                    const globalIdx = idx + 1;
                    return (
                      <button
                        key={`${src}-m-${idx}`}
                        type="button"
                        onClick={() => setLightboxIndex(globalIdx)}
                        aria-label={`View photo ${globalIdx + 1} larger`}
                        className="relative min-h-0 flex-1 cursor-zoom-in overflow-hidden rounded-lg border border-[#0A0F1E]/10 bg-white p-0 aspect-[4/3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0F1E] focus-visible:ring-offset-2"
                      >
                        <img src={src} alt="" className="h-full w-full object-cover" draggable={false} />
                      </button>
                    );
                  })}
                </div>
                <div className="hidden h-full min-h-0 w-full flex-col gap-3 md:flex md:w-[min(32%,380px)] md:max-w-[400px] md:flex-shrink-0">
                  {images.slice(1, 4).map((src, idx) => {
                    const globalIdx = idx + 1;
                    return (
                      <button
                        key={`${src}-${idx}`}
                        type="button"
                        onClick={() => setLightboxIndex(globalIdx)}
                        aria-label={`View photo ${globalIdx + 1} larger`}
                        className="relative min-h-0 flex-1 cursor-zoom-in overflow-hidden rounded-xl border border-[#0A0F1E]/10 bg-white p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0F1E] focus-visible:ring-offset-2"
                      >
                        <img src={src} alt="" className="h-full w-full object-cover" draggable={false} />
                      </button>
                    );
                  })}
                </div>
              </>
            ) : null}
          </div>

          {images.length > 1 ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 md:mt-5">
              <p className="text-sm text-slate-500">
                {images.length} photos
                {images.length > 4 ? ` · ${images.length - 4} more in the viewer` : ""}
              </p>
              <button
                type="button"
                onClick={() => setLightboxIndex(0)}
                className="inline-flex items-center gap-2 rounded-lg border border-[#0A0F1E] bg-transparent px-4 py-2 text-sm font-semibold text-[#0A0F1E] shadow-none transition hover:bg-[#0A0F1E]/5"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
                View all photos
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 pt-6 md:px-8 md:pt-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,30%)] lg:gap-8 lg:items-start">
          <div className="order-1 min-w-0 lg:order-none">
            <section className="relative z-10 rounded-xl border border-[#0A0F1E]/10 bg-white p-5 pb-5 shadow-sm md:p-6 md:pb-5">
              <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Services</h2>
              <ul className="mt-4 space-y-2.5">
                {services.map((s, idx) => {
                  const active = selectedIndices.has(idx);
                  const popular = s.popular === true;
                  return (
                    <li key={`${s.name}-${s.duration}-${idx}`}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSlot(null);
                          setSelectedIndices((prev) => {
                            const next = new Set(prev);
                            if (next.has(idx)) next.delete(idx);
                            else next.add(idx);
                            return next;
                          });
                        }}
                        aria-pressed={active}
                        className={
                          "group flex w-full flex-col gap-3 rounded-xl border-2 p-4 text-left transition duration-150 sm:flex-row sm:items-center sm:justify-between " +
                          (active
                            ? "scale-[1.01] border-qlist-night bg-slate-50 shadow-md ring-2 ring-qlist-night/10"
                            : popular
                              ? "border-amber-200/90 bg-gradient-to-br from-amber-50/80 to-white hover:border-amber-300 hover:shadow-md"
                              : "border-[#0A0F1E]/12 bg-white hover:scale-[1.005] hover:border-[#0A0F1E]/22 hover:shadow-md")
                        }
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className={"font-semibold " + (active ? "text-slate-900" : "text-slate-900")}>{s.name}</p>
                            {popular ? (
                              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-900 ring-1 ring-amber-400/40">
                                Popular
                              </span>
                            ) : null}
                          </div>
                          <p className="text-sm text-slate-600">
                            <span>{s.duration}</span>
                            <span className="mx-2 text-slate-300">·</span>
                            <span>{s.price}</span>
                          </p>
                        </div>
                        <span
                          className={
                            "shrink-0 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition " +
                            (active
                              ? "bg-qlist-night text-white"
                              : "bg-slate-100 text-slate-600 ring-1 ring-slate-200/80 group-hover:bg-slate-200/80")
                          }
                        >
                          {active ? "Selected" : "Select"}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section
              id="listing-reviews"
              className={`${cardShell} relative z-10 mt-8 scroll-mt-24`}
              aria-labelledby="business-reviews-heading"
            >
              <div className="flex flex-wrap items-end justify-between gap-4">
                <h2 id="business-reviews-heading" className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-600">
                  Reviews
                </h2>
                <div className="flex items-center gap-2">
                  <Stars rating={averageRating} />
                  <span className="text-sm font-semibold text-slate-800">{averageRating.toFixed(1)}</span>
                  <span className="text-sm text-slate-500">({displayedReviewCount})</span>
                </div>
              </div>
              <ReviewsCarousel reviews={reviews} />
            </section>

            {staffSectionEnabled && Array.isArray(staff) && staff.length > 0 ? (
              <section className="relative z-10 mt-6 md:mt-8" aria-label={`${staffSectionTitle} preview`}>
                <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{staffSectionTitle}</h2>
                <ul className="mt-4 flex list-none flex-row flex-nowrap items-start gap-6 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:gap-8">
                  {staff.map((member, idx) => (
                    <li key={member.id} className="shrink-0 list-none">
                      <ProfessionalRowAvatar
                        name={member.name}
                        photo={member.photo}
                        index={idx}
                        onOpen={() => setStaffDetailModalIndex(idx)}
                        rating={typeof member.rating === "number" ? member.rating : undefined}
                        subtitle={staffNextSlotLabel[member.id] ?? null}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className={`${cardShell} mt-12`}>
              <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Availability</h2>
              {nextAvailablePublic ? (
                <p className="mt-5 text-lg font-semibold tracking-tight text-slate-900">
                  Next available:{" "}
                  <span className="text-emerald-800">
                    {formatNextAvailableHuman(nextAvailablePublic.dateISO, nextAvailablePublic.slot, new Date())}
                  </span>
                </p>
              ) : (
                <p className="mt-5 text-sm text-slate-600">
                  Add a service with a clear duration to see the next bookable time for this location.
                </p>
              )}
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                Times in the booking panel respect each professional&apos;s hours and what&apos;s already on the calendar.
              </p>
            </section>

            <section className="mt-8 rounded-xl border border-[#0A0F1E]/10 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Location</h2>
                <div className="flex flex-wrap gap-2">
                  {directionsHref ? (
                    <a
                      href={directionsHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-qlist-night bg-qlist-night px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-qlist-night-hover"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                        <circle cx="12" cy="9" r="2.5" />
                      </svg>
                      Get directions
                    </a>
                  ) : null}
                  {mapsPlaceHref ? (
                    <a
                      href={mapsPlaceHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#0A0F1E] bg-transparent px-3 py-2 text-xs font-semibold text-[#0A0F1E] shadow-none transition hover:bg-[#0A0F1E]/5"
                    >
                      Open map
                    </a>
                  ) : null}
                </div>
              </div>
              {typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng) ? (
                <iframe
                  title={`Map of ${name}`}
                  className="mt-5 h-[300px] w-full rounded-xl border border-[#0A0F1E]/10 shadow-sm"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}&z=14&output=embed`}
                />
              ) : (
                <p className="mt-5 text-sm text-slate-600">Location map is not available for this listing.</p>
              )}
              {address ? (
                <p className="mt-4 text-sm leading-relaxed text-slate-700">{address}</p>
              ) : null}
            </section>
          </div>

          <aside
            ref={bookingPanelRef}
            id="booking-appointment-panel"
            className="relative z-10 order-3 flex min-h-0 w-full min-w-0 flex-col scroll-mt-4 lg:order-none lg:h-full"
          >
            <div className="sticky top-0 z-10 w-full max-h-[calc(100dvh-1rem)] shrink-0 self-start overflow-y-auto rounded-xl border border-[#0A0F1E]/10 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">Book appointment</h2>
                <button
                  type="button"
                  onClick={handleQuickBook}
                  disabled={quickBookDisabled}
                  className="shrink-0 rounded-lg border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-200 disabled:text-slate-500"
                >
                  Quick book
                </button>
              </div>
              <BookingFlowSteps
                hasService={selectedServices.length > 0}
                needsProfessional={staffFlowNeedsPro}
                hasProfessional={bookingStepProDone}
                hasTime={bookingStepHasTime}
              />
              <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                Quick book chooses the first compatible service{staffFlowNeedsPro ? ", assigns a professional" : ""},
                and the earliest open slot.
              </p>

              <div className="mt-4 border-b border-slate-100 pb-5">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Selected services</p>
                {selectedServices.length ? (
                  <ul className="mt-3 space-y-3">
                    {selectedServices.map((svc, i) => (
                      <li
                        key={`${svc.name}-${svc.duration}-${i}`}
                        className="rounded-lg border border-slate-100 bg-slate-50/90 px-3 py-3"
                      >
                        <p className="text-sm font-semibold text-slate-900">{svc.name}</p>
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm text-slate-600">
                          <span>{svc.duration}</span>
                          <span className="font-medium text-slate-800">{svc.price}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-base text-slate-400">Tap services to add — click again to remove</p>
                )}
                {showStaffSection && selectedStaffMember ? (
                  <div className="mt-4 rounded-lg border border-[#0A0F1E]/10 bg-white px-3 py-2.5 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Selected professional</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{selectedStaffMember.name}</p>
                    {selectedStaffMember.role ? (
                      <p className="mt-0.5 text-xs text-slate-600">{selectedStaffMember.role}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {showStaffSection ? (
                <div className="mt-5 border-b border-slate-100 pb-5" aria-labelledby="booking-staff-heading">
                  <h3 id="booking-staff-heading" className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {staffSectionTitle}
                  </h3>
                  {filteredStaffForPicker.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-600">
                      No professionals are linked to these services yet. Try a different service combination.
                    </p>
                  ) : (
                    <>
                      <ul
                        className="mt-3 grid list-none grid-cols-3 gap-x-2 gap-y-4 sm:grid-cols-4"
                        role="list"
                      >
                        {(staffGridExpanded
                          ? filteredStaffForPicker
                          : filteredStaffForPicker.slice(0, STAFF_GRID_MAX_INITIAL)
                        ).map((member, idx) => (
                          <StaffSelectTile
                            key={member.id}
                            member={member}
                            index={idx}
                            selected={selectedStaffId === member.id}
                            onToggle={(staffId) => {
                              setSelectedSlot(null);
                              setSelectedStaffId((prev) => (prev === staffId ? null : staffId));
                            }}
                          />
                        ))}
                      </ul>
                      {filteredStaffForPicker.length > STAFF_GRID_MAX_INITIAL ? (
                        <div className="mt-3 flex justify-center">
                          <button
                            type="button"
                            onClick={() => setStaffGridExpanded((v) => !v)}
                            className="text-xs font-semibold text-slate-700 underline decoration-slate-300 underline-offset-2 transition hover:text-slate-900 hover:decoration-slate-500 md:text-sm"
                          >
                            {staffGridExpanded
                              ? "Show less"
                              : `See all (${filteredStaffForPicker.length})`}
                          </button>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              ) : null}

              {selectedServices.length === 0 ? (
                <div className="mt-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Date &amp; time</p>
                  <p className="mt-3 text-sm text-slate-500">Select a service first. The calendar opens after that.</p>
                </div>
              ) : !totals.durAll ? (
                <div className="mt-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Date &amp; time</p>
                  <p className="mt-3 text-sm text-slate-500">
                    Choose services with fixed durations (not &quot;Varies&quot;) to see bookable slots.
                  </p>
                </div>
              ) : staffFlowNeedsPro && filteredStaffForPicker.length === 0 ? (
                <div className="mt-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Date &amp; time</p>
                  <p className="mt-3 text-sm text-slate-500">
                    Add a professional for this service combination to load a calendar.
                  </p>
                </div>
              ) : staffFlowNeedsPro && !selectedStaffId ? (
                <div className="mt-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Date &amp; time</p>
                  <p className="mt-3 text-sm text-slate-600">
                    Select a professional to see available dates and times. Slots use their schedule and existing
                    bookings.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-5">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Select date</p>
                    <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {selectableDateISOs.map((iso) => {
                        const picked = selectedBookingDateISO === iso;
                        return (
                          <button
                            key={iso}
                            type="button"
                            onClick={() => {
                              setSelectedBookingDateISO(iso);
                              setSelectedSlot(null);
                            }}
                            className={
                              "shrink-0 rounded-lg border px-3 py-2 text-left text-xs font-semibold transition sm:text-sm " +
                              (picked
                                ? "border-qlist-night bg-qlist-night text-white shadow-sm"
                                : "border-[#0A0F1E]/12 bg-white text-[#0A0F1E]/90 hover:border-[#0A0F1E]/22 hover:shadow-sm")
                            }
                          >
                            {formatDateChipLabel(iso)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Available times</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDateChipLabel(selectedBookingDateISO)}
                      {staffFlowNeedsPro && selectedStaffMember ? ` · ${selectedStaffMember.name}` : ""} — tap a start
                      time.
                    </p>
                    {availableSlotsForSelectedDate.length === 0 ? (
                      <p className="mt-3 text-sm text-slate-500">
                        No openings on this day for this duration and schedule.
                      </p>
                    ) : (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {availableSlotsForSelectedDate.map((t) => {
                          const picked = selectedSlot === t;
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setSelectedSlot(t)}
                              className={
                                "min-w-[4.25rem] rounded-lg border px-3 py-2 text-sm font-medium transition " +
                                (picked
                                  ? "border-qlist-night bg-qlist-night text-white shadow-sm"
                                  : "border-[#0A0F1E]/12 bg-white text-[#0A0F1E]/90 hover:border-[#0A0F1E]/22 hover:shadow-sm")
                              }
                            >
                              {t}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedServices.length > 0 ? (
                <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                  {totalDurationLabel ? (
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="text-slate-500">Total duration</span>
                      <span className="font-medium text-slate-900">{totalDurationLabel}</span>
                    </div>
                  ) : null}
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-base font-semibold text-slate-900">Total</span>
                    <span className="text-base font-semibold text-slate-900">{totalPriceLabel}</span>
                  </div>
                  {selectedServices.length > 0 && (!totals.priceAll || !totals.durAll) ? (
                    <p className="text-xs leading-relaxed text-slate-500">
                      *Totals may be incomplete when a price or duration isn&apos;t a fixed amount.
                    </p>
                  ) : null}
                </div>
              ) : null}

              <button
                type="button"
                onClick={onBookNow}
                className="mt-6 w-full rounded-xl bg-qlist-night py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-qlist-night-hover disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={
                  selectedServices.length === 0 ||
                  !totals.durAll ||
                  (staffFlowNeedsPro && !selectedStaffId) ||
                  availableSlotsForSelectedDate.length === 0 ||
                  !selectedSlot
                }
              >
                Book Now
              </button>
              {selectedServices.length === 0 ? (
                <p className="mt-2 text-center text-xs text-slate-500">Select at least one service to continue.</p>
              ) : !totals.durAll ? (
                <p className="mt-2 text-center text-xs text-slate-500">Fixed durations are required to pick a time.</p>
              ) : staffFlowNeedsPro && filteredStaffForPicker.length === 0 ? (
                <p className="mt-2 text-center text-xs text-slate-500">Choose services that match a listed professional.</p>
              ) : staffFlowNeedsPro && !selectedStaffId ? (
                <p className="mt-2 text-center text-xs text-slate-500">Select a professional to continue.</p>
              ) : availableSlotsForSelectedDate.length === 0 ? (
                <p className="mt-2 text-center text-xs text-slate-500">No times on this day — try another date.</p>
              ) : !selectedSlot ? (
                <p className="mt-2 text-center text-xs text-slate-500">Pick a start time to continue.</p>
              ) : null}
            </div>
          </aside>

          {recommended.length > 0 ? (
            <section
              className="order-2 min-w-0 w-full border-t border-slate-200/50 pt-10 lg:order-none lg:col-span-2"
              aria-labelledby="similar-places-heading"
            >
              <h2 id="similar-places-heading" className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                Similar places
              </h2>
              <RecommendedPlacesCarousel
                items={recommended}
                folder={{
                  href: categoryPageHrefForCanonicalCategory(business.category),
                  category: business.category,
                }}
              />
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

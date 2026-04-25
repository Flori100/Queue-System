import { useEffect, useState } from "react";
import { demoReviewAvatarUrl, reviewAuthorInitial } from "./reviewAvatars.js";

function Stars({ rating, size = "md" }) {
  const full = Math.round(rating);
  const cls = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className={cls + (i < full ? " text-amber-500" : " text-muted-foreground/35")}
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

const staffModalNavArrowClass =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/90 bg-white text-lg font-semibold leading-none text-foreground shadow-sm transition hover:border-border hover:bg-muted/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring/60 disabled:pointer-events-none disabled:opacity-35";

/**
 * @param {{
 *   id: string;
 *   serviceIds?: string[];
 * }} member
 * @param {ReadonlyArray<{ id: string; name: string; duration?: string; price?: string; linkedStaff?: { id: string }[] }>} services
 */
function staffModalServices(member, services) {
  const ids = new Set(member.serviceIds || []);
  const out = [];
  for (const s of services) {
    const linked = (s.linkedStaff || []).some((p) => p.id === member.id);
    if (ids.has(s.id) || linked) out.push(s);
  }
  return out;
}

/**
 * @param {{
 *   open: boolean;
 *   activeIndex: number;
 *   staffMembers: Array<{
 *     id: string;
 *     name: string;
 *     role?: string;
 *     description?: string;
 *     photo?: string;
 *     serviceIds?: string[];
 *     bookable?: boolean;
 *     rating?: number;
 *     reviewCount?: number;
 *   }>;
 *   onActiveIndexChange: (index: number) => void;
 *   onClose: () => void;
 *   services: ReadonlyArray<{
 *     id: string;
 *     name: string;
 *     duration?: string;
 *     price?: string;
 *     linkedStaff?: { id: string }[];
 *   }>;
 *   averageRating: number;
 *   reviewsFallbackCount: number;
 *   panelSyncedServiceId?: string | null;
 *   onBook: (detail: { member: (typeof staffMembers)[0]; serviceId: string }) => void;
 * }} props
 */
export function StaffProfessionalModal({
  open,
  activeIndex,
  staffMembers,
  onActiveIndexChange,
  onClose,
  services,
  averageRating,
  reviewsFallbackCount,
  panelSyncedServiceId = null,
  onBook,
}) {
  const n = staffMembers.length;
  const safeIdx = n > 0 ? ((activeIndex % n) + n) % n : 0;
  const member = staffMembers[safeIdx];
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [member?.id, open]);

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
        onActiveIndexChange((safeIdx - 1 + n) % n);
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        onActiveIndexChange((safeIdx + 1) % n);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, n, onClose, onActiveIndexChange, safeIdx]);

  if (!open || !member) return null;

  const initial = reviewAuthorInitial(member.name);
  const customPhoto = member.photo && String(member.photo).trim();
  const src = customPhoto || demoReviewAvatarUrl(member.name, safeIdx);
  const offered = staffModalServices(member, services);
  const displayRating = typeof member.rating === "number" && Number.isFinite(member.rating) ? member.rating : averageRating;
  const displayReviews =
    typeof member.reviewCount === "number" && member.reviewCount >= 0 ? member.reviewCount : reviewsFallbackCount;

  const goPrev = () => {
    if (n <= 1) return;
    onActiveIndexChange((safeIdx - 1 + n) % n);
  };
  const goNext = () => {
    if (n <= 1) return;
    onActiveIndexChange((safeIdx + 1) % n);
  };

  return (
    <div
      className="fixed inset-0 z-[118] flex items-center justify-center bg-qlist-night/50 p-3 backdrop-blur-md sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="staff-professional-modal-title"
      onClick={onClose}
    >
      <div
        className="flex max-w-[700px] w-full items-stretch justify-center gap-1.5 sm:gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={staffModalNavArrowClass + " self-center max-sm:mt-[2.75rem]"}
          aria-label="Previous professional"
          onClick={goPrev}
          disabled={n <= 1}
        >
          ‹
        </button>
        <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-2xl bg-white shadow-[0_8px_40px_rgba(0,0,0,0.12)] ring-1 ring-border/80">
          <button
            type="button"
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted/60 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring/60"
            aria-label="Close"
            onClick={onClose}
          >
            <span className="text-xl leading-none" aria-hidden="true">
              ×
            </span>
          </button>
          <div className="max-h-[min(85vh,calc(100dvh-2rem))] overflow-y-auto px-5 pb-6 pt-12 sm:px-7 sm:pb-7 sm:pt-8">
            <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:gap-6 sm:text-left">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full bg-muted sm:h-28 sm:w-28">
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
                  <span className="flex h-full w-full items-center justify-center text-2xl font-semibold text-muted-foreground">
                    {initial}
                  </span>
                )}
              </div>
              <div className="mt-4 min-w-0 flex-1 sm:mt-0">
                <h2 id="staff-professional-modal-title" className="text-xl font-semibold tracking-tight text-foreground">
                  {member.name}
                </h2>
                {member.role ? (
                  <p className="mt-1 text-sm font-medium text-muted-foreground">{member.role}</p>
                ) : null}
              </div>
            </div>
            {member.description ? (
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{member.description}</p>
            ) : null}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <Stars rating={displayRating} />
              <span className="text-sm font-semibold text-foreground">{displayRating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">({displayReviews} reviews)</span>
            </div>
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Services</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Choose a service this professional offers. Only listed options can be selected.
              </p>
              {offered.length ? (
                <ul className="mt-3 space-y-2">
                  {offered.map((s) => {
                    const synced = panelSyncedServiceId === s.id;
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => onBook({ member, serviceId: s.id })}
                          aria-pressed={synced}
                          aria-label={`Select ${s.name} with ${member.name}`}
                          className={
                            "flex w-full items-start justify-between gap-3 rounded-xl border-2 px-3 py-3 text-left text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring/60 " +
                            (synced
                              ? "border-qlist-night bg-muted shadow-md ring-2 ring-qlist-night/10"
                              : "border-border bg-muted/90 hover:border-border hover:bg-white hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)]")
                          }
                        >
                          <span className="min-w-0 flex-1">
                            <span className="font-semibold text-foreground">{s.name}</span>
                            {s.duration || s.price ? (
                              <span className="mt-0.5 block text-xs text-muted-foreground">
                                {[s.duration, s.price].filter(Boolean).join(" · ")}
                              </span>
                            ) : null}
                          </span>
                          <span
                            className={
                              "shrink-0 self-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide " +
                              (synced
                                ? "bg-qlist-night text-white"
                                : "bg-white text-foreground ring-1 ring-border/90")
                            }
                          >
                            {synced ? "Selected" : "Select"}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">No linked services for this listing yet.</p>
              )}
            </div>
            {member.bookable === false ? (
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Online booking may not be available for this professional; you can still pick a service and continue in
                the panel.
              </p>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          className={staffModalNavArrowClass + " self-center max-sm:mt-[2.75rem]"}
          aria-label="Next professional"
          onClick={goNext}
          disabled={n <= 1}
        >
          ›
        </button>
      </div>
    </div>
  );
}

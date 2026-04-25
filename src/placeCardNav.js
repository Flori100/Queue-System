import { resolveBusinessIdFromListingCard } from "./businessesData.js";

const NAV_BOUND_FLAG = "qlistCardNavBound";

function navigateToBusiness(id) {
  window.location.href = "/business/" + encodeURIComponent(id);
}

function isInteractiveTarget(target) {
  if (!target || !target.closest) return false;
  return Boolean(target.closest('a, button, input, select, textarea, [role="button"], [role="link"]'));
}

function maybeNavigateFromCardTarget(target) {
  if (isInteractiveTarget(target)) return;
  const card = target && target.closest ? target.closest(".place-card") : null;
  if (!card) return;
  const id = resolveBusinessIdFromListingCard(card);
  if (!id) return;
  navigateToBusiness(id);
}

function bindCardNavigationOnce() {
  if (!document.body || document.body.dataset[NAV_BOUND_FLAG] === "1") return;
  document.body.dataset[NAV_BOUND_FLAG] = "1";

  document.addEventListener("click", function onCardClick(event) {
    maybeNavigateFromCardTarget(event.target);
  });

  document.addEventListener("keydown", function onCardKeydown(event) {
    if (event.key !== "Enter") return;
    maybeNavigateFromCardTarget(event.target);
  });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindCardNavigationOnce, { once: true });
  } else {
    bindCardNavigationOnce();
  }
}

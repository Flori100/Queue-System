/**
 * Pointer-driven 3D tilt for static HTML cards (homepage + explore).
 * Singleton: safe to call `initCardTilt` / `refreshCardTilt` after DOM updates (e.g. HV card pager).
 */
import "./card-tilt.css";
import {
  qlistTiltPresets,
  qlistTiltSpring,
  qlistTiltScaleSpring,
  qlistSpringStep,
  qlistTilePlateShadow,
  QLIST_TILT_NARROW_MQ,
} from "./tiltConstants.js";

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function isNarrowViewport() {
  return (
    typeof window === "undefined" ||
    (window.matchMedia && window.matchMedia(QLIST_TILT_NARROW_MQ).matches)
  );
}

/** @type {{ el: HTMLElement, preset: (typeof qlistTiltPresets)["tile"], rx: number, ry: number, rxT: number, ryT: number, s: number, sT: number, hover: boolean, vrx: number, vry: number, vs: number }[]} */
const allStates = [];
let raf = null;
let lastTickTime = 0;
let resizeListenerBound = false;

function shadowFor(rx, ry, scale, preset) {
  return qlistTilePlateShadow(rx, ry, scale, preset.maxTiltDeg, preset.hoverScale);
}

function clearInline(st) {
  st.el.style.transform = "";
  st.el.style.boxShadow = "";
  st.el.classList.remove("qlist-tilt--active");
}

function tick(now) {
  raf = null;
  let dt = (now - lastTickTime) / 1000;
  lastTickTime = now;
  dt = Math.min(0.064, Math.max(0.001, dt));

  const epsR = 0.06;
  const epsS = 0.004;
  const epsV = 0.25;
  let needsNext = false;

  for (let i = 0; i < allStates.length; i++) {
    const st = allStates[i];
    const { preset } = st;

    const rxStep = qlistSpringStep(qlistTiltSpring, st.rx, st.vrx, st.rxT, dt);
    const ryStep = qlistSpringStep(qlistTiltSpring, st.ry, st.vry, st.ryT, dt);
    const sStep = qlistSpringStep(qlistTiltScaleSpring, st.s, st.vs, st.sT, dt);
    st.rx = rxStep.value;
    st.vrx = rxStep.velocity;
    st.ry = ryStep.value;
    st.vry = ryStep.velocity;
    st.s = sStep.value;
    st.vs = sStep.velocity;

    const settled =
      !st.hover &&
      Math.abs(st.rx) < epsR &&
      Math.abs(st.ry) < epsR &&
      Math.abs(st.s - 1) < epsS &&
      Math.abs(st.rxT) < 0.001 &&
      Math.abs(st.ryT) < 0.001 &&
      Math.abs(st.vrx) < epsV &&
      Math.abs(st.vry) < epsV &&
      Math.abs(st.vs) < epsV;

    if (settled) {
      st.rx = st.ry = st.rxT = st.ryT = 0;
      st.s = st.sT = 1;
      st.vrx = st.vry = st.vs = 0;
      clearInline(st);
      continue;
    }

    needsNext = true;
    const p = preset.perspectivePx;
    st.el.style.transform = `perspective(${p}px) rotateX(${st.rx}deg) rotateY(${st.ry}deg) scale(${st.s})`;

    if (st.hover || Math.abs(st.s - 1) > epsS || Math.abs(st.rx) > epsR || Math.abs(st.ry) > epsR) {
      st.el.style.boxShadow = shadowFor(st.rx, st.ry, st.s, preset);
    } else {
      st.el.style.boxShadow = "";
    }
  }

  if (needsNext) scheduleTick();
}

function scheduleTick() {
  if (raf != null) return;
  raf = requestAnimationFrame(tick);
}

function onResizeNarrow() {
  if (!isNarrowViewport()) return;
  for (let j = 0; j < allStates.length; j++) {
    const st = allStates[j];
    st.hover = false;
    st.rx = st.ry = st.rxT = st.ryT = 0;
    st.s = st.sT = 1;
    st.vrx = st.vry = st.vs = 0;
    clearInline(st);
  }
  if (raf != null) {
    cancelAnimationFrame(raf);
    raf = null;
  }
}

function ensureResizeListener() {
  if (resizeListenerBound) return;
  resizeListenerBound = true;
  window.addEventListener("resize", onResizeNarrow, { passive: true });
}

/**
 * @param {ParentNode} [root]
 */
export function initCardTilt(root) {
  if (typeof document === "undefined" || prefersReducedMotion() || isNarrowViewport()) {
    return;
  }

  const scope = root && root.querySelectorAll ? root : document;

  /** @param {Element} el */
  function pushState(el, preset) {
    if (!(el instanceof HTMLElement)) return;
    if (el.dataset.qlistTiltBound === "1") return;
    if (el.hidden || el.hasAttribute("hidden")) return;

    const st = {
      el,
      preset,
      rx: 0,
      ry: 0,
      rxT: 0,
      ryT: 0,
      s: 1,
      sT: 1,
      hover: false,
      vrx: 0,
      vry: 0,
      vs: 0,
    };
    el.dataset.qlistTiltBound = "1";
    el.style.transformOrigin = "50% 50%";
    el.style.transformStyle = "preserve-3d";
    el.style.webkitTransformStyle = "preserve-3d";
    allStates.push(st);

    function onEnter(e) {
      if (isNarrowViewport()) return;
      st.hover = true;
      st.sT = preset.hoverScale;
      st.el.classList.add("qlist-tilt--active");
      onMove(e);
    }

    function onMove(e) {
      if (!st.hover || isNarrowViewport()) return;
      const r = st.el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return;
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      st.rxT = (py - 0.5) * -preset.maxTiltDeg;
      st.ryT = (px - 0.5) * preset.maxTiltDeg;
      scheduleTick();
    }

    function onLeave() {
      st.hover = false;
      st.rxT = 0;
      st.ryT = 0;
      st.sT = 1;
      scheduleTick();
    }

    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("pointercancel", onLeave);
  }

  const tile = qlistTiltPresets.tile;
  const chip = qlistTiltPresets.chip;

  scope.querySelectorAll(".place-card").forEach((el) => pushState(el, tile));

  scope.querySelectorAll(".search-field.bg-card").forEach((el) => {
    if (el.closest(".dash-card")) return;
    pushState(el, chip);
  });

  ensureResizeListener();
}

/** Re-scan for `.place-card` / search chips under `root` (idempotent per element). */
export function refreshCardTilt(root) {
  initCardTilt(root || document);
}

function boot() {
  if (prefersReducedMotion()) return;
  lastTickTime = performance.now();
  initCardTilt(document);
}

if (typeof document !== "undefined") {
  document.addEventListener(
    "qlist:hv-cards-render",
    function () {
      refreshCardTilt(document);
    },
    false
  );

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
}

if (typeof window !== "undefined") {
  window.__qlistRefreshCardTilt = refreshCardTilt;
}

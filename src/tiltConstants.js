/** Shared tilt tuning: React (TiltedCard) + vanilla (cardTilt). */

export const QLIST_TILT_NARROW_MQ = "(max-width: 640px)";

/** Framer Motion springs — ~250ms ease-out feel, minimal overshoot */
export const qlistTiltSpring = { stiffness: 168, damping: 26, mass: 0.92 };
export const qlistTiltScaleSpring = { stiffness: 200, damping: 28, mass: 0.95 };

/**
 * One physics step (semi-implicit Euler) for the same stiffness/damping/mass
 * configs Framer Motion `useSpring` uses — keeps vanilla card tilt aligned.
 * @param {{ stiffness: number; damping: number; mass: number }} config
 * @param {number} value
 * @param {number} velocity
 * @param {number} target
 * @param {number} dt seconds (clamp before calling for stability)
 */
export function qlistSpringStep(config, value, velocity, target, dt) {
  const { stiffness, damping, mass } = config;
  const displacement = target - value;
  const acceleration = (stiffness * displacement - damping * velocity) / mass;
  const newVelocity = velocity + acceleration * dt;
  const newValue = value + newVelocity * dt;
  return { value: newValue, velocity: newVelocity };
}

/**
 * Plate shadow for listing-style cards — single source for TiltedCard + cardTilt.
 */
export function qlistTilePlateShadow(rx, ry, scale, maxTiltDeg, hoverScale) {
  const tiltT = Math.min(1, (Math.abs(rx) + Math.abs(ry)) / (2 * maxTiltDeg));
  const zoomT = Math.min(1, Math.max(0, (scale - 1) / Math.max(0.001, hoverScale - 1)));
  const t = Math.min(1, tiltT * 0.4 + zoomT * 0.85);
  const y = 14 + t * 22;
  const blur = 36 + t * 26;
  const spread = -16 - t * 12;
  const dark =
    typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  const baseA = dark ? 0.1 : 0.055;
  const liftA = dark ? 0.16 + t * 0.28 : 0.075 + t * 0.14;
  return `0 1px 2px hsl(0 0% 0% / ${baseA}), 0 ${y}px ${blur}px ${spread}px hsl(0 0% 0% / ${liftA})`;
}

/**
 * Presets: motion uses `qlistTiltSpring` / `qlistTiltScaleSpring` + these angles/scales.
 * `tile` = listing cards; `chip` = compact search chips in the hero.
 */
export const qlistTiltPresets = {
  tile: {
    maxTiltDeg: 4,
    hoverScale: 1.02,
    perspectivePx: 1400,
  },
  chip: {
    maxTiltDeg: 4,
    hoverScale: 1.02,
    perspectivePx: 1400,
  },
};

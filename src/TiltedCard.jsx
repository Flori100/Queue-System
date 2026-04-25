import { useCallback, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  qlistTiltPresets,
  qlistTiltScaleSpring,
  qlistTiltSpring,
  qlistTilePlateShadow,
  QLIST_TILT_NARROW_MQ,
} from "./tiltConstants.js";

const { maxTiltDeg, hoverScale, perspectivePx } = qlistTiltPresets.tile;

function isNarrowViewport() {
  if (typeof window === "undefined") return true;
  return window.matchMedia(QLIST_TILT_NARROW_MQ).matches;
}

export function TiltedCard({ caption, children }) {
  const innerRef = useRef(null);
  const rotateX = useSpring(0, qlistTiltSpring);
  const rotateY = useSpring(0, qlistTiltSpring);
  const scale = useSpring(1, qlistTiltScaleSpring);
  const capX = useMotionValue(0);
  const capY = useMotionValue(0);
  const capOpacity = useSpring(0, { stiffness: 400, damping: 40 });
  const capXShifted = useTransform(capX, (v) => v - 48);
  const capYShifted = useTransform(capY, (v) => v - 40);

  const plateShadow = useTransform([rotateX, rotateY, scale], ([rx, ry, sc]) =>
    qlistTilePlateShadow(rx, ry, sc, maxTiltDeg, hoverScale)
  );

  const move = useCallback(
    (e) => {
      const el = innerRef.current;
      if (!el || isNarrowViewport()) return;

      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const tiltX = (py - 0.5) * -maxTiltDeg;
      const tiltY = (px - 0.5) * maxTiltDeg;
      rotateX.set(tiltX);
      rotateY.set(tiltY);

      capX.set(e.clientX - rect.left);
      capY.set(e.clientY - rect.top);
    },
    [capX, capY, rotateX, rotateY]
  );

  const leave = useCallback(() => {
    rotateX.set(0);
    rotateY.set(0);
    scale.set(1);
    capOpacity.set(0);
  }, [capOpacity, rotateX, rotateY, scale]);

  const enter = useCallback(
    (e) => {
      if (isNarrowViewport()) return;
      capOpacity.set(1);
      scale.set(hoverScale);
      move(e);
    },
    [capOpacity, move, scale]
  );

  return (
    <figure
      className="tilted-card-figure"
      style={{ perspective: `${perspectivePx}px` }}
    >
      <p className="tilted-card-mobile-alert">Tilt this card on a larger screen.</p>
      <motion.div
        ref={innerRef}
        className="tilted-card-inner"
        onPointerMove={move}
        onPointerEnter={enter}
        onPointerLeave={leave}
        style={{
          rotateX,
          rotateY,
          scale,
          transformStyle: "preserve-3d",
        }}
      >
        <motion.div className="tilted-card-img" aria-hidden="true" style={{ boxShadow: plateShadow }} />
        <div className="tilted-card-overlay">{children}</div>
        <motion.span
          className="tilted-card-caption"
          style={{
            x: capXShifted,
            y: capYShifted,
            opacity: capOpacity,
          }}
        >
          {caption}
        </motion.span>
      </motion.div>
    </figure>
  );
}

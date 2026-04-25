/* Vite entry: ensure Tailwind globals are bundled and injected by Vite. */
import "./globals.css";

/* Location logic first; React island is optional and must not block it. */
function isBusinessDetailPath() {
  if (typeof window === "undefined") return false;
  return /\/business\/[^/]+\/?$/i.test(window.location.pathname);
}

if (isBusinessDetailPath()) {
  import("./businessShellMount.jsx").catch(function (e) {
    console.warn("[qlist] Business page failed to load:", e);
  });
} else {
  import("./homeShellInit.js");
}
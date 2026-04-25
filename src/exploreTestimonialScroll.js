import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const cards = gsap.utils.toArray(
  ".explore-section .explore-card:not([data-marquee-clone])",
);

if (cards.length) {
  const prefersReduced =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReduced) {
    gsap.set(cards, { y: 0, opacity: 1 });
  } else {
    gsap.from(".explore-section .explore-card:not([data-marquee-clone])", {
      y: 100,
      opacity: 0,
      duration: 0.8,
      stagger: 0.2,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".explore-section",
        start: "top 80%",
      },
    });
  }
}

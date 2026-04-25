import { TiltedCard } from "./TiltedCard.jsx";

const cards = [
  {
    caption: "Trust & safety",
    title: "Verified businesses",
    body: "Every partner is reviewed for licensing, hygiene standards, and consistent quality—so you always know who you are booking.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    caption: "Live calendar sync",
    title: "Real-time availability",
    body: "See open slots that actually sync with the salon calendar. Book in under a minute—no phone tag, no guessing.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    caption: "Your routine",
    title: "Built around you",
    body: "Save favorite stylists, get smart reminders, and reschedule in a tap when life gets busy.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
];

export function FeatureCards() {
  return (
    <>
      {cards.map((c) => (
        <article key={c.title} className="feature-card feature-card--tilt">
          <TiltedCard caption={c.caption}>
            <div className="feature-card__icon" aria-hidden="true">
              {c.icon}
            </div>
            <h3>{c.title}</h3>
            <p>{c.body}</p>
          </TiltedCard>
        </article>
      ))}
    </>
  );
}

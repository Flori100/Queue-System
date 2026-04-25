/** Inline logo SVG (same markup as static HTML headers). */
export function QlistLogo(props) {
  return (
    <svg
      width="190"
      height="50"
      viewBox="0 0 170 40"
      fill="none"
      style={{ color: "hsl(var(--primary))" }}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Q */}
      <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" />

      {/* Tail (smooth, premium angle) */}
      <path
        d="M26 29 L35 35 L49 23"
        transform="translate(2 2)"
        style={{ color: "hsl(var(--cta))" }}
        stroke="currentColor"
        strokeWidth="4.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Text (optical spacing + baseline tweak) */}
      <text
        x="47.7"
        y="27"
        fontFamily="Space Grotesk, Inter, sans-serif"
        fontSize="18"
        fontWeight="600"
        fill="currentColor"
      >
        List
      </text>
    </svg>
  );
}

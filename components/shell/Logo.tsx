/**
 * Three people and the paths between them: one node larger, you, with two
 * connections branching away and a third hop implied. It reads at 16px in a
 * browser tab and at 64px as an app icon, and it is not a letter in a box.
 */
export function Logo({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      role="img"
      aria-label="LinkedIn Intelligence"
    >
      {/* paths first, so the nodes sit on top of them */}
      <path
        d="M7 8.5 L16.5 5.5 M7 8.5 L15.5 17 M16.5 5.5 L15.5 17"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.45"
      />
      <circle cx="7" cy="8.5" r="3.6" fill="currentColor" />
      <circle cx="16.8" cy="5.4" r="2.1" fill="currentColor" opacity="0.8" />
      <circle cx="15.6" cy="17.2" r="2.6" fill="currentColor" opacity="0.62" />
    </svg>
  );
}

/**
 * Pip, a small owl. Drawn rather than illustrated so it stays a few hundred bytes,
 * inherits the accent colour and never looks like stock art. Blinks only when
 * motion is allowed.
 */
export function Mascot({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      role="img"
      aria-label="Pip, your guide"
    >
      {/* body */}
      <path
        d="M24 5c9.4 0 15.5 6.8 15.5 16.4 0 11.6-6.6 21.6-15.5 21.6S8.5 33 8.5 21.4C8.5 11.8 14.6 5 24 5Z"
        fill="currentColor"
        opacity="0.16"
      />
      {/* ear tufts */}
      <path d="M12.5 10.5 10 4.5l6 3.2M35.5 10.5 38 4.5l-6 3.2" fill="currentColor" opacity="0.5" />
      {/* face disc */}
      <ellipse cx="24" cy="20" rx="13" ry="12" fill="currentColor" opacity="0.1" />
      {/* eyes */}
      <circle cx="18.4" cy="19.4" r="5.1" fill="var(--panel)" />
      <circle cx="29.6" cy="19.4" r="5.1" fill="var(--panel)" />
      <circle cx="18.4" cy="19.4" r="5.1" stroke="currentColor" strokeWidth="1.2" opacity="0.55" />
      <circle cx="29.6" cy="19.4" r="5.1" stroke="currentColor" strokeWidth="1.2" opacity="0.55" />
      <circle className="mascot-eye" cx="19.2" cy="19.8" r="2.3" fill="currentColor" />
      <circle className="mascot-eye" cx="28.8" cy="19.8" r="2.3" fill="currentColor" />
      {/* beak */}
      <path d="M24 22.6 26.4 26 21.6 26Z" fill="currentColor" opacity="0.75" />
      {/* wing, a small nod to the node-and-path mark */}
      <path d="M13.5 26c0 5 2 9 4.6 11.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.4" />
      <path d="M34.5 26c0 5-2 9-4.6 11.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.4" />
      {/* feet */}
      <path d="M20 43.2v1.6M28 43.2v1.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

export function Logo({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <img
      src="/nest-logo.webp"
      alt="NesT"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: "contain" }}
    />
  );
}

import type { SVGProps } from "react";

export function LogoMark({
  size = 40,
  title = "Pesara",
  className,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number; title?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      role="img"
      aria-label={title}
      className={className}
      {...props}
    >
      <rect width="64" height="64" rx="14" fill="#1A3C32" />
      <path
        d="M22.5 49.5C23 40 23.2 31.5 23.6 24.8C24 18.8 27.8 15.2 34.2 15.6C40.8 16 44.8 20.6 44.2 26.6C43.6 32.4 38.4 36.2 32.4 35.4"
        stroke="#F4EFE6"
        strokeWidth="6.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M39.2 16.2C41.6 13.1 45.8 12.4 48.2 14.6C50.4 16.6 50.2 20.6 47.4 23.2C44.8 25.6 40.8 25.8 38.6 23.6C37.4 22.4 37.2 19.6 39.2 16.2Z"
        fill="#2F8F62"
      />
      <path
        d="M38.8 19.8C39.6 18.2 41.4 17.2 42.8 17.6C43.2 19.2 42.6 21.4 41.2 22.6C40 23.6 38.6 23.4 38.2 22.2C38 21.4 38.3 20.6 38.8 19.8Z"
        fill="#C4A46A"
      />
    </svg>
  );
}

export function LogoLockup({
  size = 36,
  inverted = true,
}: {
  size?: number;
  inverted?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-3">
      <LogoMark size={size} />
      <span
        className={`text-[0.95rem] font-medium tracking-[0.18em] uppercase ${
          inverted ? "text-cream" : "text-ink"
        }`}
      >
        Pesara
      </span>
    </span>
  );
}

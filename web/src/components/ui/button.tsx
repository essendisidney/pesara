import Link from "next/link";
import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Button({
  children,
  href,
  variant = "primary",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "ghost" | "line";
}) {
  const styles = {
    primary: "bg-gold text-ink hover:bg-gold/90",
    secondary: "bg-cream text-ink hover:bg-cream/90",
    ghost: "bg-transparent text-cream hover:bg-white/5",
    line: "border border-line bg-transparent text-cream hover:border-gold/60",
  }[variant];
  const classNames = cn(
    "inline-flex h-12 items-center justify-center rounded-[2px] px-6 text-[12px] font-medium tracking-[0.16em] uppercase transition-colors focus-visible:outline-1 focus-visible:outline-offset-3 focus-visible:outline-gold disabled:opacity-50",
    styles,
    className,
  );
  if (href) {
    return (
      <Link href={href} className={classNames}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={classNames} {...props}>
      {children}
    </button>
  );
}

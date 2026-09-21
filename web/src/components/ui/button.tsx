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
    ghost: "bg-transparent text-cream hover:bg-white/6",
    line: "border border-line bg-transparent text-cream hover:border-gold/50",
  }[variant];
  const classNames = cn(
    "inline-flex h-12 items-center justify-center rounded-full px-6 text-sm font-medium tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-50",
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

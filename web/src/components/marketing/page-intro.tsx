import type { ReactNode } from "react";

export function PageIntro({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="mx-auto max-w-6xl px-5 pt-16 pb-10">
      {eyebrow ? (
        <p className="text-xs font-semibold tracking-[0.2em] text-gold uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
        {title}
      </h1>
      {children ? (
        <div className="mt-5 max-w-2xl text-lg leading-relaxed text-mute">{children}</div>
      ) : null}
    </header>
  );
}

import type { ReactNode } from "react";
import { Eyebrow } from "@/components/marketing/frame";

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
    <header className="mx-auto max-w-6xl px-5 pt-20 pb-12">
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h1 className="mt-5 max-w-3xl text-4xl leading-[1.05] font-medium tracking-[-0.045em] sm:text-6xl">
        {title}
      </h1>
      {children ? (
        <div className="mt-6 max-w-xl text-base leading-relaxed text-mute sm:text-lg">
          {children}
        </div>
      ) : null}
    </header>
  );
}

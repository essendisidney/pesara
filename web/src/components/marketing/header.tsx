"use client";

import Link from "next/link";
import { useState } from "react";
import { LogoLockup } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { nav } from "@/config/site";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/80 backdrop-blur-2xl">
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-6 px-5">
        <Link href="/" aria-label="Pesara home" className="shrink-0">
          <LogoLockup inverted />
        </Link>
        <nav className="hidden items-center gap-7 text-[13px] whitespace-nowrap text-mute lg:flex">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-cream">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden shrink-0 items-center gap-5 lg:flex">
          <Link href="/login" className="text-[13px] whitespace-nowrap text-mute hover:text-cream">
            Sign in
          </Link>
          <Button href="/submit" className="h-10 px-5 whitespace-nowrap">
            Submit Your Idea
          </Button>
        </div>
        <div className="flex items-center gap-3 lg:hidden">
          <Button href="/submit" className="hidden h-10 px-4 whitespace-nowrap sm:inline-flex">
            Submit Your Idea
          </Button>
          <button
            type="button"
            className="min-h-11 px-2 text-[13px] font-medium text-cream"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>
      {open ? (
        <div id="mobile-menu" className="border-t border-line px-5 py-5 lg:hidden">
          <div className="flex flex-col gap-1 text-base">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="py-2.5">
                {item.label}
              </Link>
            ))}
            <Link href="/login" onClick={() => setOpen(false)} className="py-2.5 text-mute">
              Sign in
            </Link>
            <div className="mt-3">
              <Button href="/submit">Submit Your Idea</Button>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

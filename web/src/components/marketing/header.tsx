"use client";

import Link from "next/link";
import { useState } from "react";
import { LogoLockup } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { nav } from "@/config/site";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-ink/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" aria-label="Pesara home">
          <LogoLockup inverted />
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-mute md:flex">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-cream">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login" className="text-sm text-mute hover:text-cream">
            Sign in
          </Link>
          <Button href="/submit" className="h-10 px-5">
            Submit Your Idea
          </Button>
        </div>
        <button
          type="button"
          className="text-sm text-cream md:hidden"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>
      {open ? (
        <div className="border-t border-line px-5 py-4 md:hidden">
          <div className="flex flex-col gap-3 text-sm">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
            <Link href="/login" onClick={() => setOpen(false)}>
              Sign in
            </Link>
            <Button href="/submit">Submit Your Idea</Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}

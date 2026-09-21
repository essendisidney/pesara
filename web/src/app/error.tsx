"use client";

import { SiteShell } from "@/components/marketing/site-shell";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <SiteShell>
      <section className="mx-auto max-w-2xl px-5 py-24">
        <h1 className="text-3xl font-semibold">Something broke.</h1>
        <p className="mt-4 text-mute">The idea is still yours. Try again.</p>
        <div className="mt-8 flex gap-3">
          <Button onClick={reset}>Retry</Button>
          <Button href="/" variant="line">
            Home
          </Button>
        </div>
      </section>
    </SiteShell>
  );
}

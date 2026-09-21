import { SiteShell } from "@/components/marketing/site-shell";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <SiteShell>
      <section className="mx-auto max-w-2xl px-5 py-24">
        <h1 className="text-3xl font-semibold">This page is not built yet.</h1>
        <p className="mt-4 text-mute">Return to Pesara, or send the idea anyway.</p>
        <div className="mt-8 flex gap-3">
          <Button href="/">Home</Button>
          <Button href="/submit" variant="line">
            Submit Your Idea
          </Button>
        </div>
      </section>
    </SiteShell>
  );
}

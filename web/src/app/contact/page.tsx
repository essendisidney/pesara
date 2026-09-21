"use client";

import { useState } from "react";
import { SiteShell } from "@/components/marketing/site-shell";
import { PageIntro } from "@/components/marketing/page-intro";
import { Button } from "@/components/ui/button";

const types = [
  "Build software",
  "Submit idea",
  "Corporate partnership",
  "Investor",
  "University",
  "Media",
  "Other",
] as const;

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <SiteShell>
      <PageIntro eyebrow="Contact" title="Talk to Pesara.">
        Tell us why you are writing. We route each inquiry to the right desk.
      </PageIntro>
      <form
        className="mx-auto max-w-xl space-y-4 px-5 pb-24"
        onSubmit={(event) => {
          event.preventDefault();
          setSent(true);
        }}
      >
        <label className="block text-sm">
          Name
          <input required name="name" className="mt-2 h-12 w-full rounded-none border border-line bg-ink-2 px-3" />
        </label>
        <label className="block text-sm">
          Email
          <input required type="email" name="email" className="mt-2 h-12 w-full border border-line bg-ink-2 px-3" />
        </label>
        <label className="block text-sm">
          Inquiry type
          <select name="type" className="mt-2 h-12 w-full border border-line bg-ink-2 px-3">
            {types.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Message
          <textarea required name="message" rows={5} className="mt-2 w-full border border-line bg-ink-2 p-3" />
        </label>
        {sent ? (
          <p className="text-sm text-gold">Received. Pesara will reply if there is a fit.</p>
        ) : (
          <Button type="submit">Send</Button>
        )}
      </form>
    </SiteShell>
  );
}

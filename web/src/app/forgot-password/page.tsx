"use client";

import { useState, type FormEvent } from "react";
import { SiteShell } from "@/components/marketing/site-shell";
import { PageIntro } from "@/components/marketing/page-intro";
import { Button } from "@/components/ui/button";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isSupabaseConfigured()) {
      setMessage("Password reset requires Supabase environment variables.");
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setMessage(error ? error.message : "If that account exists, we sent a reset link.");
  }

  return (
    <SiteShell>
      <PageIntro eyebrow="Account" title="Reset your password.">
        Email verification and reset run through Supabase Auth. Passwords are never stored in plaintext.
      </PageIntro>
      <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-4 px-5 pb-24">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-12 w-full border border-line bg-ink-2 px-3"
        />
        {message ? <p className="text-sm text-gold">{message}</p> : null}
        <Button type="submit">Send reset link</Button>
      </form>
    </SiteShell>
  );
}

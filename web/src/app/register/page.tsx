"use client";

import { useState, type FormEvent } from "react";
import { SiteShell } from "@/components/marketing/site-shell";
import { PageIntro } from "@/components/marketing/page-intro";
import { Button } from "@/components/ui/button";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isSupabaseConfigured()) {
      setMessage("Registration requires Supabase environment variables.");
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    setMessage(
      error
        ? error.message
        : "Check your email to verify. Then sign in and submit an idea.",
    );
  }

  return (
    <SiteShell>
      <PageIntro eyebrow="Account" title="Create a founder account.">
        Email verification is required. Your idea is not public.
      </PageIntro>
      <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-4 px-5 pb-24">
        <input
          required
          placeholder="Full name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          className="h-12 w-full border border-line bg-ink-2 px-3"
        />
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-12 w-full border border-line bg-ink-2 px-3"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-12 w-full border border-line bg-ink-2 px-3"
        />
        {message ? <p className="text-sm text-gold">{message}</p> : null}
        <Button type="submit">Register</Button>
      </form>
    </SiteShell>
  );
}

"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteShell } from "@/components/marketing/site-shell";
import { PageIntro } from "@/components/marketing/page-intro";
import { Button } from "@/components/ui/button";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

function RegisterForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/submit";
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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) {
      setMessage(error.message);
      return;
    }
    if (data.session) {
      router.push(next.startsWith("/") ? next : "/submit");
      router.refresh();
      return;
    }
    setMessage("Check your email to verify. Then sign in and continue your idea.");
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-4 px-5 pb-24">
      <input
        required
        placeholder="Full name"
        value={fullName}
        onChange={(event) => setFullName(event.target.value)}
        className="h-12 w-full rounded-[2px] border border-line bg-ink-2/80 px-3"
      />
      <input
        type="email"
        required
        placeholder="Email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className="h-12 w-full rounded-[2px] border border-line bg-ink-2/80 px-3"
      />
      <input
        type="password"
        required
        minLength={8}
        placeholder="Password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className="h-12 w-full rounded-[2px] border border-line bg-ink-2/80 px-3"
      />
      {message ? <p className="text-sm text-gold">{message}</p> : null}
      <Button type="submit">Register</Button>
    </form>
  );
}

export default function RegisterPage() {
  return (
    <SiteShell>
      <PageIntro eyebrow="Account" title="Create a founder account.">
        Email verification is required. Your idea is not public.
      </PageIntro>
      <Suspense>
        <RegisterForm />
      </Suspense>
    </SiteShell>
  );
}

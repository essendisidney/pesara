"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteShell } from "@/components/marketing/site-shell";
import { PageIntro } from "@/components/marketing/page-intro";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured, createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isSupabaseConfigured()) {
      setMessage("Authentication requires Supabase environment variables.");
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message);
      return;
    }
    router.push(next.startsWith("/") ? next : "/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-4 px-5 pb-24">
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
        placeholder="Password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className="h-12 w-full rounded-[2px] border border-line bg-ink-2/80 px-3"
      />
      {message ? <p className="text-sm text-gold">{message}</p> : null}
      <Button type="submit">Sign in</Button>
      <p className="text-sm text-mute">
        New here?{" "}
        <a href={`/register?next=${encodeURIComponent(next)}`} className="text-cream">
          Create an account
        </a>
        {" · "}
        <a href="/forgot-password" className="text-cream">
          Reset password
        </a>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <SiteShell>
      <PageIntro eyebrow="Account" title="Sign in.">
        Founders track applications here. Pesara does not use this as a customer portal for loans.
      </PageIntro>
      <Suspense>
        <LoginForm />
      </Suspense>
    </SiteShell>
  );
}

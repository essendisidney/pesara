"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { SiteShell } from "@/components/marketing/site-shell";
import { PageIntro } from "@/components/marketing/page-intro";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured, createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
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
    setMessage(error ? error.message : "Signed in. Open your dashboard.");
    if (!error) router.push("/dashboard");
  }

  return (
    <SiteShell>
      <PageIntro eyebrow="Account" title="Sign in.">
        Founders track applications here. Pesara does not use this as a customer portal for loans.
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
        <input
          type="password"
          required
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-12 w-full border border-line bg-ink-2 px-3"
        />
        {message ? <p className="text-sm text-gold">{message}</p> : null}
        <Button type="submit">Sign in</Button>
        <p className="text-sm text-mute">
          New here? <a href="/register" className="text-cream">Create an account</a>
          {" · "}
          <a href="/forgot-password" className="text-cream">Reset password</a>
        </p>
      </form>
    </SiteShell>
  );
}

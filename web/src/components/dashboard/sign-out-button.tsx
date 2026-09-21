"use client";

import { signOutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <Button type="submit" variant="ghost" className="h-10 px-3 text-[11px]">
        Sign out
      </Button>
    </form>
  );
}

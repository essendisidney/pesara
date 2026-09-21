"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const personas = [
  "Founder",
  "Investor",
  "Technologist",
  "Business",
  "Student",
  "Other",
] as const;

export function WaitlistForm() {
  const [sent, setSent] = useState(false);

  return (
    <form
      className="mt-8 grid max-w-xl gap-3 sm:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        setSent(true);
      }}
    >
      <label className="text-sm sm:col-span-1">
        Name
        <Input name="name" required />
      </label>
      <label className="text-sm">
        Email
        <Input name="email" type="email" required />
      </label>
      <label className="text-sm">
        Country
        <Input name="country" defaultValue="Kenya" />
      </label>
      <label className="text-sm">
        I am a
        <select
          name="persona"
          className="mt-2 h-12 w-full border border-line bg-ink-2 px-3 text-sm"
          defaultValue="Founder"
        >
          {personas.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </label>
      <label className="text-sm sm:col-span-2">
        Interests
        <Input name="interests" />
      </label>
      <label className="flex items-start gap-3 text-sm sm:col-span-2">
        <input type="checkbox" name="consent" required className="mt-1" />
        <span className="text-mute">
          I agree to hear from Pesara about the studio. This box is never pre-ticked.
        </span>
      </label>
      {sent ? (
        <p className="text-sm text-gold sm:col-span-2">
          Noted. You can leave at any time. The waitlist writes to Pesara once the
          database is connected.
        </p>
      ) : (
        <div className="sm:col-span-2">
          <Button type="submit">Join the community</Button>
        </div>
      )}
    </form>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { requireFounder } from "@/lib/auth/session";
import { listFounderApplications } from "@/lib/applications/actions";
import { greetingForNairobi } from "@/lib/application";
import { nextFounderAction } from "@/lib/applications/stages";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const auth = await requireFounder();
  const applications = await listFounderApplications();

  return (
    <>
      <p className="text-xs tracking-[0.18em] text-gold uppercase">Founder</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        {greetingForNairobi()}, {auth.firstName}
      </h1>
      <div className="mt-10 flex items-end justify-between gap-4">
        <h2 className="text-xl font-semibold">Your ideas</h2>
        <Button href="/submit" className="h-10 px-4">
          Create another idea
        </Button>
      </div>
      {applications.length === 0 ? (
        <p className="mt-6 max-w-xl text-sm text-mute">
          Nothing on this account yet. Start with the problem you have discovered.
        </p>
      ) : (
        <ul className="mt-6 grid gap-4">
          {applications.map((item) => (
            <li key={item.id} className="border border-line px-5 py-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-medium">{item.payload.ideaName || "Untitled idea"}</p>
                  <p className="mt-1 font-mono text-[11px] tracking-[0.16em] text-gold">
                    {item.reference ?? "Draft"}
                  </p>
                  <p className="mt-3 text-sm text-mute">
                    {item.submitted_at
                      ? `Submitted ${new Date(item.submitted_at).toLocaleDateString()}`
                      : "Not submitted yet"}
                  </p>
                  <p className="mt-1 text-sm capitalize text-cream">{item.stage.replaceAll("_", " ")}</p>
                  <p className="mt-2 text-xs text-mute">
                    Last activity {new Date(item.last_activity_at ?? item.updated_at).toLocaleString()}
                  </p>
                  <p className="mt-2 text-sm text-mute">{nextFounderAction(item.stage)}</p>
                </div>
                <Button href={`/dashboard/ideas/${item.id}`} variant="line" className="h-10 px-4">
                  View Application
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {applications.length === 0 ? (
        <div className="mt-8">
          <Button href="/submit">Submit Your Idea</Button>
        </div>
      ) : null}
      <p className="mt-10 text-sm">
        <Link href="/submit" className="text-gold">
          Continue an idea →
        </Link>
      </p>
    </>
  );
}

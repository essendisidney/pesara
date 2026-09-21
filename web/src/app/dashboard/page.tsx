import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Dashboard" };

const stages = [
  "Submitted",
  "Initial screening",
  "Founder interview",
  "Validation",
  "Committee review",
  "Venture structuring",
  "Build",
  "Launch",
];

export default function DashboardPage() {
  return (
    <>
      <p className="text-xs tracking-[0.18em] text-gold uppercase">Founder</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Your pipeline</h1>
      <p className="mt-3 max-w-xl text-sm text-mute">
        After you submit, this rail shows where the idea sits. Administrators
        move the stage. You see founder-facing updates only.
      </p>
      <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stages.map((stage, index) => (
          <li key={stage} className="border border-line px-4 py-4">
            <p className="text-[11px] text-mute">{String(index + 1).padStart(2, "0")}</p>
            <p className="mt-1 text-sm">{stage}</p>
            <p className="mt-2 text-xs text-mute">
              {index === 0 ? "Start by submitting" : "Waiting"}
            </p>
          </li>
        ))}
      </ol>
      <p className="mt-10 text-sm">
        <Link href="/submit" className="text-gold">
          Submit or continue an idea →
        </Link>
      </p>
    </>
  );
}

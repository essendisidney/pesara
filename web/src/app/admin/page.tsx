import { MetricCard } from "@/components/ui/empty-state";
import Link from "next/link";

const metrics = [
  "New applications",
  "Under screening",
  "Validation sprints",
  "Committee review",
  "Accepted ventures",
  "Products building",
  "Live ventures",
  "Revenue-generating ventures",
];

export default function AdminPage() {
  return (
    <>
      <p className="text-xs tracking-[0.18em] text-gold uppercase">Operating system</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Command centre</h1>
      <p className="mt-3 max-w-xl text-sm text-mute">
        Counts stay at zero until real applications exist. Roles gate this
        surface once Supabase is connected.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((item) => (
          <MetricCard key={item} label={item} value="0" />
        ))}
      </div>
      <p className="mt-8 text-sm text-mute">
        Funnel, conversion and screening times appear when the pipeline has
        volume.{" "}
        <Link href="/admin/applications" className="text-gold">
          Open applications
        </Link>
      </p>
    </>
  );
}

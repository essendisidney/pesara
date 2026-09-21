import type { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard/shell";
import { requireFounder } from "@/lib/auth/session";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  await requireFounder();
  return <DashboardShell>{children}</DashboardShell>;
}

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/shell";
import { requireStaff } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireStaff();
  return <AdminShell>{children}</AdminShell>;
}

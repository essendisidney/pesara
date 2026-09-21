import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/validation/env";
import { isStaffRole, type Role } from "@/lib/permissions/roles";

export type AuthContext = {
  userId: string;
  email: string | undefined;
  fullName: string;
  firstName: string;
  role: Role;
};

function firstNameFrom(fullName: string, email: string | undefined): string {
  const named = fullName.trim().split(/\s+/)[0];
  if (named) return named;
  const local = email?.split("@")[0];
  return local ? local : "there";
}

export async function getAuthContext(): Promise<AuthContext | null> {
  if (!supabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .maybeSingle();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", data.user.id)
    .maybeSingle();

  const metaName =
    typeof data.user.user_metadata.full_name === "string"
      ? data.user.user_metadata.full_name
      : "";
  const fullName = profile?.full_name || metaName || "";
  const role = (roleRow?.role as Role | undefined) ?? "FOUNDER";

  return {
    userId: data.user.id,
    email: data.user.email,
    fullName,
    firstName: firstNameFrom(fullName, data.user.email),
    role,
  };
}

export async function requireFounder(): Promise<AuthContext> {
  const auth = await getAuthContext();
  if (!auth) redirect("/login?next=/dashboard");
  return auth;
}

export async function requireStaff(): Promise<AuthContext> {
  const auth = await getAuthContext();
  if (!auth) redirect("/login?next=/admin");
  if (!isStaffRole(auth.role)) redirect("/dashboard");
  return auth;
}

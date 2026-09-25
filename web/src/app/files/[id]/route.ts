import { NextResponse } from "next/server";
import { isUuid } from "@/lib/admin/pipeline";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/validation/env";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!isUuid(id) || !supabaseConfigured()) return new NextResponse("Not found", { status: 404 });
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return new NextResponse("Not found", { status: 404 });
  const { data: document } = await supabase.from("application_documents").select("path").eq("id", id).maybeSingle();
  const path = typeof document?.path === "string" ? document.path : "";
  if (!path) return new NextResponse("Not found", { status: 404 });
  const signed = await supabase.storage.from("application-documents").createSignedUrl(path, 60);
  if (signed.error || !signed.data?.signedUrl) return new NextResponse("Not found", { status: 404 });
  return NextResponse.redirect(signed.data.signedUrl);
}

import { AdminPlaceholder } from "@/components/admin/shell";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AdminPlaceholder title="Application">
      Reference file {id}. Founder-facing feedback is stored separately from
      internal notes.
    </AdminPlaceholder>
  );
}

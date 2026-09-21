import { AdminPlaceholder } from "@/components/admin/shell";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AdminPlaceholder title="Venture">
      Data room {id}: founders, agreements, KPIs, documents. Ownership labels
      are never automatic.
    </AdminPlaceholder>
  );
}

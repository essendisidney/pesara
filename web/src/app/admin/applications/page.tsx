import { PipelineBoard } from "@/components/admin/pipeline";
import { knownMessage, PAGE_ERRORS, parsePipelineQuery } from "@/lib/admin/pipeline";
import { loadPipeline } from "@/lib/admin/queries";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = parsePipelineQuery(params);
  const result = await loadPipeline(query);
  return (
    <PipelineBoard
      query={query}
      result={result}
      notice={null}
      error={knownMessage(PAGE_ERRORS, params.error)}
    />
  );
}

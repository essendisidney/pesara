export type PublicMetric = { label: string; value: string };

export async function getPublicMetrics(): Promise<{
  ready: boolean;
  items: PublicMetric[];
}> {
  return { ready: false, items: [] };
}

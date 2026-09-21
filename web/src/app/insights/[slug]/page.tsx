import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Article" };

export default function InsightArticlePage() {
  notFound();
}

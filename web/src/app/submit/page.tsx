import type { Metadata } from "next";
import { SubmitWizard } from "@/components/marketing/submit-wizard";

export const metadata: Metadata = {
  title: "Submit Your Idea",
  description: "Tell Pesara the problem you have discovered. Evidence before engineering.",
};

export default function SubmitPage() {
  return <SubmitWizard />;
}

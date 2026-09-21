import type { Metadata } from "next";
import { SubmitWizard } from "@/components/marketing/submit-wizard";
import { getAuthContext } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Submit Your Idea",
  description: "Tell Pesara the problem you have discovered. Evidence before engineering.",
};

export default async function SubmitPage() {
  const auth = await getAuthContext();
  return <SubmitWizard signedIn={Boolean(auth)} />;
}

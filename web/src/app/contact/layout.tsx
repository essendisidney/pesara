import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Contact" };

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children;
}

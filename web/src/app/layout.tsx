import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { site } from "@/config/site";
import "./globals.css";

const sans = Geist({
  subsets: ["latin"],
  variable: "--font-ui",
  display: "swap",
});

const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono-ui",
  display: "swap",
});

const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.title,
    template: "%s — Pesara",
  },
  description: site.description,
  applicationName: "Pesara Limited",
  openGraph: {
    title: site.title,
    description: site.description,
    url: site.url,
    siteName: "Pesara Limited",
    locale: "en_KE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
  },
  icons: {
    icon: "/pesara-mark.svg",
    apple: "/pesara-mark.svg",
  },
};

const organisationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Pesara Limited",
  url: site.url,
  description: site.description,
  slogan: site.tagline,
  areaServed: "Worldwide",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${display.variable} h-full dark`}>
      <body className={`${sans.className} min-h-full antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organisationJsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}

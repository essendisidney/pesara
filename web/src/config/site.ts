export const site = {
  name: "Pesara Limited",
  tagline: "We get paid when you get paid.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://pesara.africa",
  description:
    "Pesara co-builds technology companies with founders. You bring the idea, we bring the technology and the payment rails, and we share what the business earns.",
  title: "Pesara — You bring the idea. We bring the technology.",
} as const;

export const nav = [
  { href: "/partnership", label: "Partnership" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/for-founders", label: "Founders" },
  { href: "/services", label: "Services" },
  { href: "/insights", label: "Insights" },
] as const;

export const site = {
  name: "Pesara Limited",
  tagline: "Ideas deserve execution.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://pesara.africa",
  description:
    "Pesara partners with founders and businesses to validate, build and launch technology ventures from Africa to the world.",
  title: "Pesara — From Idea to Technology Company",
} as const;

export const nav = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/for-founders", label: "Founders" },
  { href: "/for-businesses", label: "Businesses" },
  { href: "/services", label: "Services" },
  { href: "/insights", label: "Insights" },
] as const;

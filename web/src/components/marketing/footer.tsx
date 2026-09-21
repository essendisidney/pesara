import Link from "next/link";
import { LogoLockup } from "@/components/logo";

const groups = [
  {
    title: "Studio",
    links: [
      { href: "/about", label: "About" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/portfolio", label: "Portfolio" },
      { href: "/opportunities", label: "Opportunities" },
    ],
  },
  {
    title: "Partners",
    links: [
      { href: "/for-founders", label: "For founders" },
      { href: "/for-businesses", label: "For businesses" },
      { href: "/services", label: "Services" },
      { href: "/submit", label: "Submit idea" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/insights", label: "Insights" },
      { href: "/contact", label: "Contact" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/cookies", label: "Cookies" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-ink">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-4">
        <div>
          <LogoLockup inverted />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-mute">
            Ideas deserve execution.
          </p>
        </div>
        {groups.map((group) => (
          <div key={group.title}>
            <p className="text-xs font-semibold tracking-[0.16em] text-gold uppercase">
              {group.title}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-mute">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-cream">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-6 text-xs text-mute sm:flex-row sm:items-center sm:justify-between">
          <p>Pesara Limited. Built in Africa. Built for anywhere.</p>
          <p>© {new Date().getFullYear()}</p>
        </div>
      </div>
    </footer>
  );
}

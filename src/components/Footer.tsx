import { Link } from "@tanstack/react-router";

const sections = [
  {
    title: "Explore",
    links: [
      { label: "How It Works", to: "/how-it-works" },
    //   { label: "Become a Helper", to: "/become-a-helper" },
    ],
  },
  {
    title: "Support",
    links: [{ label: "Contact Us", to: "/contact" }],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms & Conditions", to: "/terms" },
      { label: "Privacy Policy", to: "/privacy" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/40">
      <div className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <p className="font-display text-lg font-semibold tracking-tight text-foreground">
              HELPBE
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Be the help someone needs.
            </p>
          </div>

          {sections.map((section) => (
            <nav key={section.title} aria-label={section.title}>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </p>
              <ul className="mt-3 space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-foreground/80 transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <p className="mt-10 text-xs text-muted-foreground">
          © 2026 HELPBE. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

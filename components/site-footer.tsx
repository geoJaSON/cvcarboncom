import Image from "next/image";
import Link from "next/link";
import { TideRule } from "@/components/ui";
import { EMAIL, PORTAL, REGISTRY } from "@/lib/site";

const COLUMNS = [
  {
    heading: "About",
    links: [
      { href: "/science", label: "The Science" },
      { href: "/history", label: "The History" },
      { href: "/beyond-carbon", label: "Beyond Carbon" },
      { href: "/team", label: "Meet the Team" },
    ],
  },
  {
    heading: "Our Work",
    links: [
      { href: "/restoration", label: "Restoring Oyster Habitat" },
      { href: "/partnering", label: "Partnering with Oystermen" },
      { href: "/guide", label: "Field App Guide" },
      { href: "/contact", label: "Contact" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative bg-abyss text-mist">
      <TideRule className="text-abyss" flip />

      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.1fr]">
          <div>
            <Image
              src="/images/cv-carbon-logo.png"
              alt="CV Carbon"
              width={880}
              height={300}
              className="h-11 w-auto brightness-0 invert"
            />
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-mist/70">
              Restoring ecosystems by partnering with the commercial oyster industry to
              re-establish historic reefs using proceeds from carbon capture credits.
            </p>
            <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-verdigris/40 bg-verdigris/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-verdigris">
              <span className="h-1.5 w-1.5 rounded-full bg-verdigris" aria-hidden="true" />
              30% of gross revenue back into the water
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.heading}>
              <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-steel-400">
                {column.heading}
              </h2>
              <ul className="mt-5 space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-mist/80 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-steel-400">
              Get in Touch
            </h2>
            <a
              href={EMAIL.href}
              className="mt-5 block break-words font-display text-xl text-white transition-colors hover:text-verdigris"
            >
              {EMAIL.display}
            </a>
            <p className="mt-3 text-sm leading-relaxed text-mist/60">
              Gulf of Mexico &amp; U.S. East Coast
              <br />
              Houston, Texas
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {[REGISTRY, PORTAL].map((dest) => (
                <a
                  key={dest.href}
                  href={dest.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:border-verdigris hover:bg-verdigris"
                >
                  {dest.longLabel}
                  <svg viewBox="0 0 12 12" aria-hidden="true" className="h-2.5 w-2.5">
                    <path
                      d="M3 9L9 3M9 3H4M9 3v5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-white/10 pt-8 text-xs uppercase tracking-[0.14em] text-mist/50 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} CV Carbon &middot; All Rights Reserved</p>
          <a
            href={EMAIL.href}
            className="normal-case tracking-normal transition-colors hover:text-white"
          >
            {EMAIL.display}
          </a>
        </div>
      </div>
    </footer>
  );
}

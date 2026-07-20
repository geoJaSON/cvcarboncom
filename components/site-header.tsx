"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { EMAIL, REGISTRY } from "@/lib/site";

const ExternalArrow = () => (
  <svg viewBox="0 0 12 12" aria-hidden="true" className="h-2.5 w-2.5 shrink-0 opacity-70">
    <path
      d="M3 9L9 3M9 3H4M9 3v5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Mirrors the original site's information architecture — HOME / ABOUT /
 * RESTORATION / PARTNERING / CONTACT — with the four editorial pages
 * gathered under ABOUT.
 */
const ABOUT_LINKS = [
  { href: "/science", label: "The Science", blurb: "How oysters capture and store carbon" },
  { href: "/history", label: "The History", blurb: "The impact of oyster shell mining" },
  { href: "/beyond-carbon", label: "Beyond Carbon", blurb: "The other benefits of oyster reefs" },
  { href: "/team", label: "Meet the Team", blurb: "The people behind CV Carbon" },
  { href: "/guide", label: "Field App Guide", blurb: "Using the CV Carbon Field app on the water" },
];

const NAV_LINKS = [
  { href: "/restoration", label: "Restoration" },
  { href: "/partnering", label: "Partnering" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  const aboutActive = ABOUT_LINKS.some((link) => pathname === link.href);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled || menuOpen
          ? "bg-abyss/95 backdrop-blur-md shadow-[0_1px_0_rgba(255,255,255,0.08)]"
          : "bg-gradient-to-b from-abyss/70 to-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4 lg:px-10">
        <Link href="/" aria-label="CV Carbon — home" className="relative z-10 shrink-0">
          <Image
            src="/images/cv-carbon-logo.png"
            alt="CV Carbon"
            width={880}
            height={300}
            priority
            className="h-9 w-auto brightness-0 invert sm:h-10"
          />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          <NavLink href="/" active={pathname === "/"}>
            Home
          </NavLink>

          {/* Hover/focus-revealed submenu. The group wrapper keeps it open
              while the pointer travels from trigger to panel. */}
          <div className="group relative">
            <button
              type="button"
              aria-expanded={false}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition-colors ${
                aboutActive ? "text-white" : "text-mist hover:text-white"
              }`}
            >
              About
              <svg
                viewBox="0 0 10 6"
                className="h-1.5 w-2.5 transition-transform duration-300 group-hover:rotate-180"
                aria-hidden="true"
              >
                <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>

            <div className="invisible absolute left-0 top-full w-80 translate-y-1 pt-3 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
              <div className="overflow-hidden rounded-xl border border-white/10 bg-abyss/95 p-2 shadow-2xl backdrop-blur-md">
                {ABOUT_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`block rounded-lg px-4 py-3 transition-colors hover:bg-white/5 ${
                      pathname === link.href ? "bg-white/5" : ""
                    }`}
                  >
                    <span className="block text-sm font-semibold text-white">{link.label}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-mist/70">
                      {link.blurb}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {NAV_LINKS.map((link) => (
            <NavLink key={link.href} href={link.href} active={pathname === link.href}>
              {link.label}
            </NavLink>
          ))}

          <a
            href={REGISTRY.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-mist transition-colors hover:text-white"
          >
            {REGISTRY.label}
            <ExternalArrow />
          </a>

          <a
            href={EMAIL.href}
            className="ml-3 rounded-full bg-verdigris px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-verdigris-600"
          >
            Message Us
          </a>
        </nav>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          className="relative z-10 flex h-10 w-10 flex-col items-center justify-center gap-1.5 lg:hidden"
        >
          <span
            className={`block h-px w-6 bg-white transition-transform duration-300 ${
              menuOpen ? "translate-y-[3.5px] rotate-45" : ""
            }`}
          />
          <span
            className={`block h-px w-6 bg-white transition-transform duration-300 ${
              menuOpen ? "-translate-y-[3.5px] -rotate-45" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile drawer */}
      <div
        className={`overflow-y-auto overscroll-contain border-t border-white/10 transition-[max-height] duration-500 lg:hidden ${
          menuOpen ? "max-h-[calc(100dvh-4.5rem)]" : "max-h-0 border-t-0"
        }`}
      >
        <nav aria-label="Mobile" className="space-y-1 px-6 py-6">
          <MobileLink href="/" onNavigate={closeMenu}>
            Home
          </MobileLink>
          {ABOUT_LINKS.map((link) => (
            <MobileLink key={link.href} href={link.href} onNavigate={closeMenu}>
              {link.label}
            </MobileLink>
          ))}
          {NAV_LINKS.map((link) => (
            <MobileLink key={link.href} href={link.href} onNavigate={closeMenu}>
              {link.label}
            </MobileLink>
          ))}
          <a
            href={REGISTRY.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={closeMenu}
            className="flex items-center gap-2 border-b border-white/5 py-3 font-display text-lg text-white"
          >
            {REGISTRY.longLabel}
            <ExternalArrow />
          </a>
          <a
            href={EMAIL.href}
            onClick={closeMenu}
            className="mt-4 block rounded-full bg-verdigris px-5 py-3 text-center text-xs font-semibold uppercase tracking-[0.16em] text-white"
          >
            Message Us
          </a>
        </nav>
      </div>
    </header>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition-colors ${
        active ? "text-white" : "text-mist hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}

function MobileLink({
  href,
  children,
  onNavigate,
}: {
  href: string;
  children: React.ReactNode;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="block border-b border-white/5 py-3 font-display text-lg text-white"
    >
      {children}
    </Link>
  );
}

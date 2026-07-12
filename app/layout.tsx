import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT", "WONK"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cvcarbon.com"),
  title: {
    default: "CV Carbon — Oyster Reef Restoration & Blue Carbon Credits",
    template: "%s — CV Carbon",
  },
  description:
    "CV Carbon restores ecosystems by partnering with the commercial oyster industry to re-establish historic reefs, funded by verified carbon capture credits.",
  openGraph: {
    title: "CV Carbon — Oyster Reef Restoration & Blue Carbon Credits",
    description:
      "Restoring historic oyster reefs in partnership with commercial oystermen, funded by verified carbon capture credits.",
    type: "website",
    siteName: "CV Carbon",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="min-h-screen antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-verdigris focus:px-5 focus:py-3 focus:text-xs focus:font-semibold focus:uppercase focus:tracking-[0.16em] focus:text-white"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";
import { Reveal } from "@/components/reveal";
import { PORTAL } from "@/lib/site";
import { PageHero, Section, SectionHeading } from "@/components/ui";

export const metadata = {
  title: "Field App Guide",
  description:
    "A step-by-step walkthrough of CV Carbon Field — the mobile app oystermen, staff, and verifiers use to record polling, dredge and point samples, cultch placement, and notes on the water, online or off.",
};

/* ------------------------------------------------------------------ */
/* Local building blocks — chips, steps, callouts, and an inline       */
/* "UI label" so exact button names stand out inside prose.            */
/* ------------------------------------------------------------------ */

function Ui({ children }: { children: ReactNode }) {
  return (
    <span className="whitespace-nowrap rounded-md bg-navy/[0.07] px-1.5 py-0.5 text-[0.9em] font-semibold text-navy">
      {children}
    </span>
  );
}

const ROLE_STYLES = {
  everyone: { label: "Everyone", cls: "border-steel/40 bg-steel/10 text-steel" },
  clients: { label: "Leaseholders", cls: "border-verdigris/40 bg-verdigris/10 text-verdigris-600" },
  staff: { label: "CV Carbon staff", cls: "border-navy/30 bg-navy/10 text-navy" },
  verifiers: { label: "Verifiers", cls: "border-sand bg-sand/30 text-ink/70" },
} as const;

function RoleChip({ role }: { role: keyof typeof ROLE_STYLES }) {
  const s = ROLE_STYLES[role];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.14em] ${s.cls}`}
    >
      {s.label}
    </span>
  );
}

function Steps({ children }: { children: ReactNode }) {
  return <ol className="mt-5 space-y-4">{children}</ol>;
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy font-display text-sm text-white">
        {n}
      </span>
      <div className="pt-0.5 text-[0.9375rem] leading-relaxed text-ink/75">{children}</div>
    </li>
  );
}

function Callout({
  tone = "tip",
  title,
  children,
}: {
  tone?: "tip" | "warn";
  title: string;
  children: ReactNode;
}) {
  const styles =
    tone === "warn"
      ? "border-sand bg-sand/20"
      : "border-verdigris/30 bg-verdigris/[0.06]";
  const eyebrow = tone === "warn" ? "text-ink/60" : "text-verdigris-600";
  return (
    <div className={`mt-6 rounded-lg border p-5 ${styles}`}>
      <p className={`text-[0.625rem] font-semibold uppercase tracking-[0.16em] ${eyebrow}`}>
        {title}
      </p>
      <div className="mt-2 text-sm leading-relaxed text-ink/75">{children}</div>
    </div>
  );
}

function FieldList({ items }: { items: { name: string; note: string }[] }) {
  return (
    <dl className="mt-5 space-y-2.5">
      {items.map((f) => (
        <div key={f.name} className="flex gap-3 text-sm leading-relaxed">
          <dt className="w-36 shrink-0 font-semibold text-navy">{f.name}</dt>
          <dd className="text-ink/65">{f.note}</dd>
        </div>
      ))}
    </dl>
  );
}

/* One collection mode = one card. Glyphs match the app's tab bar.      */
function ModeCard({
  glyph,
  name,
  tagline,
  children,
}: {
  glyph: string;
  name: string;
  tagline: string;
  children: ReactNode;
}) {
  return (
    <Reveal>
      <article className="rounded-lg border border-navy/10 bg-white p-8 sm:p-10">
        <div className="flex items-center gap-4">
          <span
            aria-hidden="true"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-navy text-xl text-white"
          >
            {glyph}
          </span>
          <div>
            <h3 className="font-display text-2xl text-navy">{name}</h3>
            <p className="mt-0.5 text-sm text-ink/60">{tagline}</p>
          </div>
        </div>
        <div className="mt-6">{children}</div>
      </article>
    </Reveal>
  );
}

/* ------------------------------------------------------------------ */
/* On-page navigation                                                   */
/* ------------------------------------------------------------------ */

const CONTENTS = [
  { href: "#get-started", n: "01", label: "Getting started", blurb: "Sign in and find your way around" },
  { href: "#map", n: "02", label: "Reading the map", blurb: "Layers, years, search, and GPS" },
  { href: "#collect", n: "03", label: "Recording field work", blurb: "The five collection modes" },
  { href: "#offline", n: "04", label: "Working offline", blurb: "Download areas, sync later" },
  { href: "#sync", n: "05", label: "Syncing your work", blurb: "The queue, retries, and receipts" },
  { href: "#clients", n: "06", label: "For leaseholders", blurb: "Dashboard and reimbursements" },
  { href: "#staff", n: "07", label: "For staff & verifiers", blurb: "Time, checks, verification" },
  { href: "#help", n: "08", label: "Troubleshooting", blurb: "Quick answers and support" },
];

export default function GuidePage() {
  return (
    <>
      <PageHero
        eyebrow="Field App Guide"
        title={
          <>
            CV Carbon Field,
            <br />
            step by step
          </>
        }
        standfirst="CV Carbon Field is the mobile app our partner oystermen, staff, and independent verifiers use to record survey work on the water — polling passes, dredge and point samples, cultch placement, and field notes. This guide walks through every screen. Everything you save works offline and syncs on its own when you're back in coverage."
        image="/images/boat-wheelhouse.jpg"
        alt="View from the wheelhouse of a working oyster boat"
        position="center"
      />

      {/* Table of contents */}
      <Section className="bg-pearl">
        <SectionHeading
          eyebrow="On this page"
          title="Jump to a section"
          intro={
            <p>
              New to the app? Read straight through &mdash; it takes about ten minutes. Otherwise,
              jump to the part of the day you&rsquo;re on.
            </p>
          }
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CONTENTS.map((item, i) => (
            <Reveal key={item.href} delay={(i % 4) * 70}>
              <a
                href={item.href}
                className="group block h-full rounded-lg border border-navy/10 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-verdigris/40 hover:shadow-[0_18px_40px_-24px_rgba(13,42,68,0.45)]"
              >
                <span className="font-display text-sm text-verdigris">{item.n}</span>
                <p className="mt-3 font-display text-lg leading-snug text-navy group-hover:text-verdigris-600">
                  {item.label}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-ink/55">{item.blurb}</p>
              </a>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ------------------------------------------------------------ */}
      {/* 01 — Getting started                                          */}
      {/* ------------------------------------------------------------ */}
      <Section id="get-started" className="border-t border-navy/10 bg-white">
        <div className="flex flex-wrap items-center gap-3">
          <RoleChip role="everyone" />
        </div>
        <SectionHeading
          eyebrow="01 · Getting started"
          title="Sign in and find your way around"
          intro={
            <p>
              Accounts are set up by CV Carbon as part of program onboarding &mdash; there is no
              self-signup. The app runs on iOS and Android phones and tablets; a device with GPS is
              all the hardware you need. The <strong>first sign-in needs an internet
              connection</strong>; after that, the app is built to spend whole days offline.
            </p>
          }
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-2">
          <Reveal>
            <div className="rounded-lg border border-navy/10 bg-pearl p-8">
              <h3 className="font-display text-xl text-navy">Signing in</h3>
              <Steps>
                <Step n={1}>
                  Open the app and enter your <Ui>Email</Ui> and <Ui>Password</Ui>, then tap{" "}
                  <Ui>Sign In</Ui>.
                </Step>
                <Step n={2}>
                  Forgot your password? Type your email first, then tap{" "}
                  <Ui>Forgot password?</Ui> &mdash; a reset link arrives by email and opens a
                  set-new-password page in your browser.
                </Step>
                <Step n={3}>
                  You land on the map. That&rsquo;s home base &mdash; every feature starts from
                  here.
                </Step>
              </Steps>
              <Callout tone="tip" title="Which build am I on?">
                The version number is printed at the bottom of the sign-in screen and under{" "}
                <Ui>Settings</Ui>. Include it whenever you report a problem.
              </Callout>
            </div>
          </Reveal>

          <Reveal delay={90}>
            <div className="rounded-lg border border-navy/10 bg-pearl p-8">
              <h3 className="font-display text-xl text-navy">The menu</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink/70">
                Tap the <Ui>&#9776;</Ui> button in the top-left corner of the map. What you see
                depends on your role &mdash; the full list:
              </p>
              <FieldList
                items={[
                  { name: "Dashboard", note: "Sampling progress and lease status (leaseholders and staff)." },
                  { name: "Offline areas", note: "Download map areas for use without a connection." },
                  { name: "Time & expenses", note: "Log hours and receipts (CV Carbon staff)." },
                  { name: "Check delivery", note: "Log a delivered check (CV Carbon staff)." },
                  { name: "Bedding reimbursement", note: "Request cultch reimbursement (leaseholders)." },
                  { name: "Settings", note: "Your name, email, role, app version, and sign out." },
                ]}
              />
              <Callout tone="tip" title="Signing out is safe">
                Any unsynced field work stays on the device and uploads when you sign back in. The
                app tells you so before you confirm.
              </Callout>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ------------------------------------------------------------ */}
      {/* 02 — Reading the map                                          */}
      {/* ------------------------------------------------------------ */}
      <Section id="map" className="border-t border-navy/10 bg-pearl">
        <div className="flex flex-wrap items-center gap-3">
          <RoleChip role="everyone" />
        </div>
        <SectionHeading
          eyebrow="02 · Reading the map"
          title="Layers, years, search, and your position"
          intro={
            <p>
              The map shows lease boundaries over satellite imagery, with your samples, cultch
              placements, and notes layered on top. A blue dot tracks your position; when
              you&rsquo;re inside a lease, a <strong>Current lease</strong> banner at the top of the
              screen names it &mdash; and everything you record is tagged to it automatically.
            </p>
          }
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          <Reveal>
            <div className="h-full rounded-lg border border-navy/10 bg-white p-7">
              <h3 className="font-display text-lg text-navy">Layers &amp; year</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink/70">
                The layers button in the top-right opens the map controls. Pick the{" "}
                <Ui>Year</Ui> you&rsquo;re working (this filters samples), and toggle layers:
                leases, owned leases, harvest closures, field notes, polling points, dredge samples,
                point samples, and bedding. Bedding has its own year filter &mdash; it defaults to{" "}
                <Ui>All</Ui> so every year of cultch investment stays visible.
              </p>
            </div>
          </Reveal>
          <Reveal delay={70}>
            <div className="h-full rounded-lg border border-navy/10 bg-white p-7">
              <h3 className="font-display text-lg text-navy">Find a lease</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink/70">
                Tap the search button in the top-right of the header and type at least two
                characters of a <strong>lease number or entity name</strong>. Tap a result and the
                map flies there. You&rsquo;ll only ever see leases your account has access to.
              </p>
            </div>
          </Reveal>
          <Reveal delay={140}>
            <div className="h-full rounded-lg border border-navy/10 bg-white p-7">
              <h3 className="font-display text-lg text-navy">Follow me</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink/70">
                The round button in the bottom-right keeps the map centered on your position
                (<Ui>&#9673;</Ui> following &middot; <Ui>&#9678;</Ui> idle). It stays disabled until
                the device has a GPS fix. If location permission is off, a banner offers to open
                your device settings.
              </p>
            </div>
          </Reveal>
          <Reveal>
            <div className="h-full rounded-lg border border-navy/10 bg-white p-7">
              <h3 className="font-display text-lg text-navy">Tap anything</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink/70">
                Tap a lease, sample, or note to open its detail card &mdash; substrate, counts,
                dates, and attached photos. Photos need a connection; tap{" "}
                <Ui>View photos</Ui> to load them into a full-screen viewer you can swipe through.
              </p>
            </div>
          </Reveal>
          <Reveal delay={70}>
            <div className="h-full rounded-lg border border-navy/10 bg-white p-7">
              <h3 className="font-display text-lg text-navy">Refreshing data</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink/70">
                Samples load automatically for the area you&rsquo;re looking at, and the refresh
                button (top-right, under the layers button) pulls the latest on demand. Zoomed way
                out? A <em>&ldquo;Zoom in to load samples&rdquo;</em> hint appears &mdash; the view
                covers too much water to fetch; zoom to lease scale and it loads on its own.
              </p>
            </div>
          </Reveal>
          <Reveal delay={140}>
            <div className="h-full rounded-lg border border-navy/10 bg-white p-7">
              <h3 className="font-display text-lg text-navy">Measure</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink/70">
                The ruler button on the left edge measures <Ui>Distance</Ui> or <Ui>Area</Ui>: tap
                the map to drop points and read the live total, with <Ui>Undo</Ui> and{" "}
                <Ui>Clear</Ui> to adjust. <Ui>Done</Ui> closes it and clears the sketch.
              </p>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ------------------------------------------------------------ */}
      {/* 03 — Recording field work                                     */}
      {/* ------------------------------------------------------------ */}
      <Section id="collect" className="border-t border-navy/10 bg-white">
        <div className="flex flex-wrap items-center gap-3">
          <RoleChip role="everyone" />
        </div>
        <SectionHeading
          eyebrow="03 · Recording field work"
          title="The five collection modes"
          intro={
            <>
              <p>
                The bar along the bottom of the map is the collection launcher:{" "}
                <strong>Poll</strong>, <strong>Dredge</strong>, <strong>Point</strong>,{" "}
                <strong>Bedding</strong>, and <strong>Notes</strong>. Tap one and its form slides up
                over the live map &mdash; the map keeps working behind it, so you can watch your
                track draw as you go.
              </p>
              <p>
                Two rules cover all five modes. First, <strong>saving never needs a
                connection</strong> &mdash; work is stored on the device and synced later. Second,
                the app guards your entry: closing or switching modes with unsaved data asks{" "}
                <em>&ldquo;Discard entry?&rdquo;</em> before anything is lost.
              </p>
            </>
          }
        />

        <div className="mt-12 space-y-8">
          <ModeCard glyph="•" name="Poll" tagline="Rapid-fire bottom checks at your position">
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <p className="text-sm leading-relaxed text-ink/70">
                  Quick polling is built for speed: one tap drops a color-coded point at your GPS
                  position &mdash; no confirmation, just a buzz &mdash; and the form stays open for
                  the next drop. Work the pole, tap the bottom type, repeat.
                </p>
                <FieldList
                  items={[
                    { name: "Bottom types", note: "Solid Reef · Scattered Shell · Mud · Firm Bottom · Buried Shell" },
                    { name: "Location & date", note: "Captured automatically from GPS; date is set to today." },
                  ]}
                />
              </div>
              <div>
                <Steps>
                  <Step n={1}>
                    Tap <Ui>Poll</Ui>. The buttons stay disabled until the device has a GPS fix.
                  </Step>
                  <Step n={2}>
                    At each polling spot, tap the bottom type you found. The point drops instantly
                    and the running count ticks up.
                  </Step>
                  <Step n={3}>
                    Tap <Ui>&#10005;</Ui> when the pass is done.
                  </Step>
                </Steps>
                <Callout tone="tip" title="Weak GPS">
                  A weak or stale fix shows a banner but <em>never blocks saving</em> &mdash; drops
                  are recorded with the best position available.
                </Callout>
              </div>
            </div>
          </ModeCard>

          <ModeCard glyph="〰" name="Dredge" tagline="Record a tow path and what came up">
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <p className="text-sm leading-relaxed text-ink/70">
                  A dredge sample records the actual path of your tow with GPS, then the oyster
                  count from the catch. Together with the dredge width, that computes density
                  &mdash; the number the program&rsquo;s math runs on.
                </p>
                <FieldList
                  items={[
                    { name: "Track", note: "Recorded live; length shows in feet as you tow." },
                    { name: "Oyster count", note: "Whole number of live oysters in the catch." },
                    { name: "Dredge width", note: "In INCHES (e.g. 36) — remembered from your last sample." },
                    { name: "Photo", note: "Optional photo of the catch." },
                  ]}
                />
              </div>
              <div>
                <Steps>
                  <Step n={1}>
                    Tap <Ui>Dredge</Ui>, then <Ui>Start recording</Ui> as the dredge goes down. The
                    distance readout counts up as you tow.
                  </Step>
                  <Step n={2}>
                    Tap <Ui>Stop recording</Ui> when the dredge comes up. Botched tow?{" "}
                    <Ui>Record again</Ui> starts the track over.
                  </Step>
                  <Step n={3}>
                    Enter the <Ui>Oyster count</Ui> and confirm the <Ui>Dredge width (inches)</Ui>,
                    add a photo if you like, and tap <Ui>Save sample</Ui>.
                  </Step>
                </Steps>
                <Callout tone="warn" title="Width is inches — and required">
                  Density can&rsquo;t be computed without the width, so the form won&rsquo;t save
                  without it. Measure the mouth of the dredge in inches, not feet.
                </Callout>
                <Callout tone="warn" title="Keep the app open while recording">
                  GPS pauses if the app goes to the background mid-tow, which can cut a corner off
                  the track. If that happens the form warns you &mdash; consider re-recording.
                </Callout>
              </div>
            </div>
          </ModeCard>

          <ModeCard glyph="✚" name="Point" tagline="A single sample at one spot">
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <p className="text-sm leading-relaxed text-ink/70">
                  A point sample is a one-spot count &mdash; by hand, tongs, a diver, or a short
                  dredge set &mdash; dropped at your GPS position.
                </p>
                <FieldList
                  items={[
                    { name: "Sample type", note: "Hand · Tong · Dredge · Diver · Other" },
                    { name: "Oyster count", note: "Whole number of live oysters." },
                    { name: "Sample width", note: "In inches (e.g. 24) — required." },
                    { name: "Water depth", note: "Feet, optional." },
                    { name: "Photo", note: "Optional." },
                  ]}
                />
              </div>
              <div>
                <Steps>
                  <Step n={1}>
                    Tap <Ui>Point</Ui> at the sample spot and wait for the GPS-ready note.
                  </Step>
                  <Step n={2}>Pick the sample type and enter the count and width.</Step>
                  <Step n={3}>
                    Add depth or a photo if useful, then tap <Ui>Save sample</Ui>.
                  </Step>
                </Steps>
              </div>
            </div>
          </ModeCard>

          <ModeCard glyph="▬" name="Bedding" tagline="Record a cultch placement run">
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <p className="text-sm leading-relaxed text-ink/70">
                  Bedding records where cultch went over the side &mdash; the run is tracked with
                  GPS just like a tow, then the load is described. Placement records are what tie
                  your reimbursements and reef-building credit to the water.
                </p>
                <FieldList
                  items={[
                    { name: "Track", note: "Recorded live along the placement run." },
                    { name: "Amount & units", note: "Cubic yards or metric tons." },
                    { name: "Material", note: "Shell · Crushed concrete · Limestone" },
                    { name: "Placement photos", note: "Three guided slots: Loaded · Unloading · Unloaded." },
                    { name: "Notes", note: "Optional." },
                  ]}
                />
              </div>
              <div>
                <Steps>
                  <Step n={1}>
                    Before the run, take the <Ui>Loaded</Ui> photo &mdash; the form prompts you for
                    the right photo at each stage.
                  </Step>
                  <Step n={2}>
                    Tap <Ui>Start recording</Ui> as placement begins and run your pattern;{" "}
                    <Ui>Stop recording</Ui> when the load is out. Snap <Ui>Unloading</Ui> along the
                    way.
                  </Step>
                  <Step n={3}>
                    Enter the <Ui>Amount</Ui>, pick the units and material, take the{" "}
                    <Ui>Unloaded</Ui> photo, and tap <Ui>Save placement</Ui>.
                  </Step>
                </Steps>
                <Callout tone="tip" title="Photos help, never block">
                  The three photos document the load for reimbursement review, but a missing photo
                  never stops the save.
                </Callout>
              </div>
            </div>
          </ModeCard>

          <ModeCard glyph="✎" name="Notes" tagline="Mark a hazard, disturbance, or point of interest">
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <p className="text-sm leading-relaxed text-ink/70">
                  A note pins a comment to the water as a <strong>point</strong>, a{" "}
                  <strong>line</strong>, or an <strong>area</strong> &mdash; a snag, a poached
                  corner, a channel worth remembering. Lines and areas can be drawn by tapping the
                  map or traced by walking (or idling) the boat along them with GPS.
                </p>
                <FieldList
                  items={[
                    { name: "Shape", note: "Point · Line · Area" },
                    { name: "Capture", note: "Draw on map, or walk with GPS." },
                    { name: "Type", note: "Hazard · Disturbance · POI · Navigation · Other" },
                    { name: "Comments", note: "Required — say what you saw." },
                    { name: "Visibility", note: "My group (you, your group, and CV Carbon) or Public (everyone's map)." },
                  ]}
                />
              </div>
              <div>
                <Steps>
                  <Step n={1}>
                    Tap <Ui>Notes</Ui> and pick the shape. A point drops right at your position.
                  </Step>
                  <Step n={2}>
                    For a line or area, choose <Ui>Draw on map</Ui> &mdash; the form tucks away
                    while you tap out the shape, with <Ui>Undo</Ui> / <Ui>Done</Ui> on a floating
                    bar &mdash; or <Ui>Walk with GPS</Ui> to trace it as you move.
                  </Step>
                  <Step n={3}>
                    Pick the note type, write your comment, set who can see it, and tap{" "}
                    <Ui>Save note</Ui>.
                  </Step>
                </Steps>
              </div>
            </div>
          </ModeCard>
        </div>
      </Section>

      {/* ------------------------------------------------------------ */}
      {/* 04 — Working offline (dark band)                              */}
      {/* ------------------------------------------------------------ */}
      <section id="offline" className="relative bg-navy px-6 py-24 sm:py-28 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="04 · Working offline"
            tone="light"
            title="Download the map before you leave the dock"
            intro={
              <p>
                There&rsquo;s no signal on most of the water &mdash; the app assumes that. Saving
                field work already needs no connection; downloading an{" "}
                <strong>offline area</strong> also keeps the satellite basemap, lease outlines,
                polling points, and your dredge, point, and bedding samples visible while
                you&rsquo;re out.
              </p>
            }
          />

          <div className="mt-12 grid gap-10 lg:grid-cols-2">
            <Reveal>
              <div className="rounded-lg border border-white/15 bg-white/[0.04] p-8">
                <h3 className="font-display text-xl text-white">Downloading an area</h3>
                <ol className="mt-5 space-y-4">
                  {[
                    <>
                      At the dock (on Wi-Fi or cell signal), open the menu and tap{" "}
                      <strong>Offline areas</strong>, then <strong>Select area on map</strong>.
                    </>,
                    <>
                      Tap one corner of the water you work, then the opposite corner &mdash; a
                      rectangle covers the area.
                    </>,
                    <>
                      Name it something you&rsquo;ll recognize and tap{" "}
                      <strong>Download area</strong>. You can leave the screen &mdash; the download
                      continues and shows its progress under Offline areas.
                    </>,
                  ].map((body, i) => (
                    <li key={i} className="flex gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-verdigris font-display text-sm text-white">
                        {i + 1}
                      </span>
                      <div className="pt-0.5 text-[0.9375rem] leading-relaxed text-mist/85">
                        {body}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </Reveal>

            <Reveal delay={90}>
              <div className="rounded-lg border border-white/15 bg-white/[0.04] p-8">
                <h3 className="font-display text-xl text-white">Good to know</h3>
                <ul className="mt-5 space-y-4 text-[0.9375rem] leading-relaxed text-mist/85">
                  <li className="border-l-2 border-verdigris/60 pl-4">
                    <strong className="text-white">Size limit.</strong> Very large rectangles are
                    rejected with a tile-count message &mdash; zoom in and cover your working water,
                    not the whole coast. Several smaller named areas beat one giant one.
                  </li>
                  <li className="border-l-2 border-verdigris/60 pl-4">
                    <strong className="text-white">Keeping areas fresh.</strong> Each saved area has
                    a refresh button that re-pulls its samples, and a delete that frees the space.
                    An interrupted download can be resumed from the same list.
                  </li>
                  <li className="border-l-2 border-verdigris/60 pl-4">
                    <strong className="text-white">What still needs signal.</strong> The dashboard,
                    photo viewing, lease search, and the bedding reimbursement form are online-only.
                    Everything you <em>record</em> works offline.
                  </li>
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* 05 — Syncing                                                  */}
      {/* ------------------------------------------------------------ */}
      <Section id="sync" className="bg-pearl">
        <div className="flex flex-wrap items-center gap-3">
          <RoleChip role="everyone" />
        </div>
        <SectionHeading
          eyebrow="05 · Syncing your work"
          title="Save first, sync whenever"
          intro={
            <p>
              Everything you save goes into a queue on the device and uploads automatically the
              moment the app has any connection &mdash; you never have to press a sync button. The
              small pill in the top-left corner of the map is the whole story at a glance.
            </p>
          }
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-lg border border-navy/10 bg-white p-8">
              <h3 className="font-display text-xl text-navy">The sync pill</h3>
              <dl className="mt-5 space-y-3 text-sm leading-relaxed">
                <div className="flex gap-3">
                  <dt className="w-28 shrink-0 font-semibold text-verdigris-600">Synced</dt>
                  <dd className="text-ink/65">All clear — everything is uploaded, with the last sync time.</dd>
                </div>
                <div className="flex gap-3">
                  <dt className="w-28 shrink-0 font-semibold text-[#a16207]">N pending</dt>
                  <dd className="text-ink/65">
                    Saved work waiting for a connection. Normal all day on the water — it clears
                    itself when you&rsquo;re back in coverage.
                  </dd>
                </div>
                <div className="flex gap-3">
                  <dt className="w-28 shrink-0 font-semibold text-steel">Syncing&hellip;</dt>
                  <dd className="text-ink/65">Upload in progress.</dd>
                </div>
                <div className="flex gap-3">
                  <dt className="w-28 shrink-0 font-semibold text-[#b91c1c]">N errors</dt>
                  <dd className="text-ink/65">
                    Something was rejected — tap the pill to see which rows and retry.
                  </dd>
                </div>
              </dl>
            </div>
          </Reveal>
          <Reveal delay={90}>
            <div className="h-full rounded-lg border border-navy/10 bg-white p-8">
              <h3 className="font-display text-xl text-navy">Inside the queue</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink/70">
                Tap the pill to open the <Ui>Sync queue</Ui>: every waiting record with its status,
                plus <Ui>Retry now</Ui> for errors and <Ui>Export JSON</Ui>, which shares the queue
                as a file you can email to support if something ever refuses to go up.
              </p>
              <Callout tone="tip" title="No duplicates, ever">
                Every record carries its own ID from the moment it&rsquo;s saved, so a flaky
                connection that retries an upload can&rsquo;t create doubles &mdash; and a
                just-synced sample stays on your map instead of disappearing.
              </Callout>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ------------------------------------------------------------ */}
      {/* 06 — For leaseholders                                         */}
      {/* ------------------------------------------------------------ */}
      <Section id="clients" className="border-t border-navy/10 bg-white">
        <div className="flex flex-wrap items-center gap-3">
          <RoleChip role="clients" />
        </div>
        <SectionHeading
          eyebrow="06 · For leaseholders"
          title="Your dashboard and cultch reimbursements"
          intro={
            <p>
              Two screens exist specifically for partner oystermen: the dashboard that shows where
              each lease stands, and the bedding reimbursement request that turns a cultch receipt
              into a payment.
            </p>
          }
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-2">
          <Reveal>
            <div className="rounded-lg border border-navy/10 bg-pearl p-8">
              <h3 className="font-display text-xl text-navy">Dashboard</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink/70">
                Menu &rarr; <Ui>Dashboard</Ui>. Every lease linked to your account is listed with
                two pills: sampling status (<Ui>Not Sampled</Ui> &middot;{" "}
                <Ui>Need Additional Sample</Ui> &middot; <Ui>Sampled</Ui>) and polling coverage
                (<Ui>No Polling Data</Ui> &middot; <Ui>Needs More</Ui> &middot; <Ui>Good</Ui>).
                Leases needing attention float to the top; tap the chips to filter, tap a lease to
                fly the map to it. It&rsquo;s the quickest answer to{" "}
                <em>&ldquo;where should I sample today?&rdquo;</em>
              </p>
              <Callout tone="tip" title="Needs a connection">
                The dashboard reads live status, so it&rsquo;s online-only &mdash; check it before
                you leave the dock.
              </Callout>
            </div>
          </Reveal>

          <Reveal delay={90}>
            <div className="rounded-lg border border-navy/10 bg-pearl p-8">
              <h3 className="font-display text-xl text-navy">Bedding reimbursement</h3>
              <Steps>
                <Step n={1}>
                  Menu &rarr; <Ui>Bedding reimbursement</Ui>. If you belong to more than one
                  entity, pick which one is requesting.
                </Step>
                <Step n={2}>
                  Enter the <Ui>Receipt tonnage (short tons)</Ui> and the placement start and end
                  dates; supplier and invoice number are optional but speed up review.
                </Step>
                <Step n={3}>
                  Attach the receipt &mdash; <Ui>Take photo</Ui> or <Ui>Choose file</Ui> (a scan or
                  PDF works) &mdash; and tap <Ui>Submit request</Ui>.
                </Step>
              </Steps>
              <p className="mt-5 text-sm leading-relaxed text-ink/70">
                You get a request number (BR-&hellip;) on the spot, and the{" "}
                <Ui>Your requests</Ui> list below the form tracks it: Submitted &rarr; In review
                &rarr; Approved &rarr; Paid, with <Ui>Awaiting documents</Ui> or{" "}
                <Ui>Needs attention</Ui> if we need anything from you.
              </p>
              <Callout tone="warn" title="Online only">
                Reimbursement requests submit straight to CV Carbon, so this form needs a
                connection &mdash; it doesn&rsquo;t queue offline.
              </Callout>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ------------------------------------------------------------ */}
      {/* 07 — Staff & verifiers                                        */}
      {/* ------------------------------------------------------------ */}
      <Section id="staff" className="border-t border-navy/10 bg-pearl">
        <div className="flex flex-wrap items-center gap-3">
          <RoleChip role="staff" />
          <RoleChip role="verifiers" />
        </div>
        <SectionHeading
          eyebrow="07 · For staff & verifiers"
          title="Time, checks, and verification mode"
          intro={
            <p>
              CV Carbon staff and independent verifiers see a few extra tools. They work exactly
              like the rest of the app: fill in, save, let the queue sync.
            </p>
          }
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          <Reveal>
            <div className="h-full rounded-lg border border-navy/10 bg-white p-7">
              <h3 className="font-display text-lg text-navy">Time &amp; expenses</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink/70">
                Menu &rarr; <Ui>Time &amp; expenses</Ui> (internal staff). Pick the day, log
                morning/afternoon clock times, mileage, and whether a company boat was used; the
                Expenses tab takes a category, amount, description, and a receipt photo. Entries
                queue offline like everything else &mdash; review and <em>submit</em> the finished
                timesheet in the web portal.
              </p>
            </div>
          </Reveal>
          <Reveal delay={70}>
            <div className="h-full rounded-lg border border-navy/10 bg-white p-7">
              <h3 className="font-display text-lg text-navy">Check delivery</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink/70">
                Menu &rarr; <Ui>Check delivery</Ui> (internal staff). Hand-delivering a payment?
                Log the check number, amount, who it&rsquo;s made out to, and who received it
                &mdash; the app stamps the time and GPS location automatically at save, creating a
                proof-of-delivery record.
              </p>
            </div>
          </Reveal>
          <Reveal delay={140}>
            <div className="h-full rounded-lg border border-navy/10 bg-white p-7">
              <h3 className="font-display text-lg text-navy">Verification mode</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink/70">
                Verifiers land in verification mode automatically; internal staff can switch it on
                from the layers panel. Dredge and point samples collected in this mode save as{" "}
                <strong>verification samples</strong> &mdash; the dredge form shows a live
                pass/fail verdict against the lease&rsquo;s density requirement, with a notes
                field. Offline, the verdict saves as <em>Pending</em> and is computed when the
                sample syncs.
              </p>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ------------------------------------------------------------ */}
      {/* 08 — Troubleshooting                                          */}
      {/* ------------------------------------------------------------ */}
      <Section id="help" className="border-t border-navy/10 bg-white">
        <SectionHeading
          eyebrow="08 · Troubleshooting"
          title="Quick answers"
          intro={
            <p>
              The short list that solves most days on the water. Still stuck? Include your app
              version (bottom of the sign-in screen or in Settings) when you get in touch.
            </p>
          }
        />

        <div className="mt-12 grid gap-x-12 gap-y-8 lg:grid-cols-2">
          {[
            {
              q: "The map shows no samples.",
              a: (
                <>
                  You&rsquo;re probably zoomed out past the loading gate &mdash; watch for the{" "}
                  <em>&ldquo;Zoom in to load samples&rdquo;</em> hint. Zoom to lease scale, or tap
                  the refresh button. Also check the layers panel: the layer (or the year) you
                  expect may simply be toggled off.
                </>
              ),
            },
            {
              q: "The sync pill has said “pending” all day.",
              a: (
                <>
                  That&rsquo;s normal offshore &mdash; pending means safely saved on the device.
                  It uploads by itself once you&rsquo;re back in coverage. If it still says pending
                  on good Wi-Fi, tap the pill and use <Ui>Retry now</Ui>.
                </>
              ),
            },
            {
              q: "My follow-me button is grayed out.",
              a: (
                <>
                  The device has no GPS fix yet. Step away from metal cabins and give it a minute;
                  if a permission banner shows, tap it to open device settings and allow location.
                </>
              ),
            },
            {
              q: "Photos won't open on a sample.",
              a: (
                <>
                  Attachment photos stream from the server, so they need a connection &mdash;
                  the card says <em>&ldquo;Reconnect to view attachments.&rdquo;</em> The sample
                  data itself is still there offline.
                </>
              ),
            },
            {
              q: "I forgot my password.",
              a: (
                <>
                  On the sign-in screen, type your email, then tap <Ui>Forgot password?</Ui>. The
                  email link opens a page to set a new one, and you sign in with it right away.
                </>
              ),
            },
            {
              q: "I saved something by mistake.",
              a: (
                <>
                  Saved records upload as-is &mdash; there&rsquo;s no delete in the field app. Note
                  the lease and rough time and let CV Carbon know; we&rsquo;ll correct it in the
                  registry data.
                </>
              ),
            },
          ].map((item, i) => (
            <Reveal key={item.q} delay={(i % 2) * 80}>
              <div className="border-l-2 border-verdigris/50 pl-5">
                <h3 className="font-display text-lg text-navy">{item.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/70">{item.a}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-16 flex flex-col items-start justify-between gap-6 rounded-lg bg-navy px-8 py-10 sm:flex-row sm:items-center sm:px-12">
            <div>
              <p className="eyebrow text-steel-400">Need a hand?</p>
              <p className="mt-2 font-display text-2xl text-white">
                We&rsquo;ll walk you through it.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center rounded-full bg-verdigris px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-verdigris-600"
              >
                Contact us
              </Link>
              <a
                href={PORTAL.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:border-white hover:bg-white/10"
              >
                Open the Client Portal
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
            </div>
          </div>
        </Reveal>
      </Section>
    </>
  );
}

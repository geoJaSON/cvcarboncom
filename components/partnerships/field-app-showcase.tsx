"use client";

import Link from "next/link";
import { useState } from "react";
import "./field-app-showcase.css";

type CaptureMode = "poll" | "dredge" | "point" | "bedding" | "notes";

type Mode = {
  id: CaptureMode;
  label: string;
  glyph: string;
  short: string;
  description: string;
  captures: string[];
};

const MODES: Mode[] = [
  {
    id: "poll",
    label: "Pole",
    glyph: "•",
    short: "Robust sounding checks",
    description:
      "Work the pole, tap the bottom type, repeat. Each tap drops a color-coded point at the boat's GPS position and leaves the form ready for the next one.",
    captures: ["Bottom type", "GPS position", "Date and operator"],
  },
  {
    id: "dredge",
    label: "Dredge Sample",
    glyph: "〰",
    short: "Tow path + oyster count",
    description:
      "The phone traces the tow while the dredge is down. Add the catch count and dredge width and the survey has the inputs it needs to calculate oyster density.",
    captures: ["Live tow track", "Oyster count + width", "Optional catch photo"],
  },
  {
    id: "point",
    label: "Point Sample",
    glyph: "✣",
    short: "One sample, one position",
    description:
      "Record a patent tong or quadrat at a single location, with the count, sample width, water depth and a photo.",
    captures: ["Sample method", "Count + dimensions", "Depth and photo"],
  },
  {
    id: "bedding",
    label: "Bedding",
    glyph: "▬",
    short: "Cultch placement",
    description:
      "Create a line to record exactly where cultch goes into the water, then attach the amount, type of material, and guided photos that connect the work to the water.",
    captures: ["Placement track", "Material + quantity", "Photos"],
  },
  {
    id: "notes",
    label: "Notes",
    glyph: "✎",
    short: "What the map needs to remember",
    description:
      "Pin a hazard, disturbance or point of interest—or draw a line or area. Notes can stay with your group or be shared across the working map.",
    captures: ["Point, line or area", "Type + comments", "Private, Team, or Public visibility"],
  },
];

export function FieldAppShowcase() {
  const [activeId, setActiveId] = useState<CaptureMode>("poll");
  const active = MODES.find((mode) => mode.id === activeId) ?? MODES[0];

  return (
    <div className="field-app-showcase">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)] lg:items-end">
        <div>
          <p className="eyebrow text-steel-400">Act two: the field app</p>
          <h2 className="mt-5 max-w-4xl font-display text-4xl leading-[1.08] text-white sm:text-5xl lg:text-6xl">
            We provide the tools, you record the data.
          </h2>
        </div>
        <div className="prose-cv field-app-intro max-w-xl">
          <p>
            Our mobile application, CV Carbon Field, allows you to record the data needed to participate in our carbon capture project. Data collection include sounding the bottom, sampling for oyster density, and documenting loads of cultch placement. You always have access to your own data on your phone or computer. Plus your data is protected.
          </p>
          <p>The app works offline and syncs when the phone finds coverage again.</p>
        </div>
      </div>

      <div className="mt-14 grid items-center gap-10 lg:grid-cols-[minmax(15rem,0.8fr)_minmax(19rem,23rem)_minmax(15rem,0.8fr)] lg:gap-8 xl:gap-14">
        <div className="field-app-mode-list" role="tablist" aria-label="Field app collection modes">
          {MODES.map((mode, index) => {
            const selected = mode.id === activeId;
            return (
              <button
                key={mode.id}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls="field-app-phone-panel"
                id={`field-app-tab-${mode.id}`}
                className="field-app-mode"
                data-active={selected}
                onClick={() => setActiveId(mode.id)}
              >
                <span className="field-app-mode-index">0{index + 1}</span>
                <span className="field-app-mode-glyph" aria-hidden="true">{mode.glyph}</span>
                <span>
                  <strong>{mode.label}</strong>
                  <small>{mode.short}</small>
                </span>
              </button>
            );
          })}
        </div>

        <PhonePreview active={activeId} />

        <div
          className="field-app-detail"
          role="tabpanel"
          id="field-app-phone-panel"
          aria-labelledby={`field-app-tab-${active.id}`}
        >
          <p className="eyebrow text-steel-400">{active.label}</p>
          <h3 className="mt-3 font-display text-3xl leading-tight text-white">{active.short}</h3>
          <p className="mt-5 text-sm leading-7 text-mist/75">{active.description}</p>

          <div className="mt-7 border-t border-white/10 pt-5">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-mist/45">
              Captured with every save
            </p>
            <ul className="mt-4 space-y-3">
              {active.captures.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-mist/85">
                  <span className="field-app-check" aria-hidden="true">
                    <svg viewBox="0 0 12 12"><path d="m2.2 6.2 2.2 2.2 5.4-5" /></svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 rounded-sm border border-steel/30 bg-navy/55 p-5">
            <div className="flex items-center gap-3">
              <OfflineIcon />
              <div>
                <p className="text-sm font-semibold text-white">Built for remote areas without signal</p>
                <p className="mt-1 text-xs leading-5 text-mist/60">
                  Saved on the device first. Synced automatically later.
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/guide"
            className="mt-7 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-mist transition-colors hover:text-white"
          >
            Open the full field app guide <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function PhonePreview({ active }: { active: CaptureMode }) {
  return (
    <div
      className="field-app-phone-wrap"
      role="img"
      aria-label={`CV Carbon Field ${active} screen preview`}
    >
      <div className="field-app-phone-halo" aria-hidden="true" />
      <div className="field-app-phone" aria-hidden="true">
        <div className="field-app-phone-speaker" aria-hidden="true" />
        <div className="field-app-screen">
          <div className="field-app-status">
            <span>9:41</span>
            <span className="field-app-status-icons" aria-hidden="true">
              <svg viewBox="0 0 42 12">
                <path d="M2 10V8m4 2V6m4 4V4m4 6V2" />
                <path d="M21 5.5c3.5-3.2 7.6-3.2 11 0M24 8c2-1.8 3.5-1.8 5.5 0" />
                <rect x="35" y="2" width="6" height="8" rx="1" />
              </svg>
            </span>
          </div>

          <div className="field-app-header">
            <MenuIcon />
            <strong>CV Carbon Field</strong>
            <SearchIcon />
          </div>

          <div className="field-app-map">
            <FieldMap active={active} />
            <div className="field-app-map-controls" aria-hidden="true"><span>+</span><span>&minus;</span></div>
            <div className="field-app-location" aria-hidden="true">
              <svg viewBox="0 0 16 16"><path d="M8 1.4 13.6 14 8 11.4 2.4 14 8 1.4Z" /></svg>
            </div>
            <CaptureSheet active={active} />
          </div>
        </div>
      </div>
      <p className="field-app-phone-caption">Interactive product preview</p>
    </div>
  );
}

function FieldMap({ active }: { active: CaptureMode }) {
  return (
    <svg className="field-app-map-art" viewBox="0 0 320 520" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="field-water" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6f9eaa" />
          <stop offset="0.55" stopColor="#2f7185" />
          <stop offset="1" stopColor="#164b64" />
        </linearGradient>
        <linearGradient id="field-marsh" x1="0" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor="#7f8663" />
          <stop offset="1" stopColor="#4f664f" />
        </linearGradient>
        <filter id="field-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.25" />
        </filter>
      </defs>
      <rect width="320" height="520" fill="url(#field-water)" />
      <path d="M-8 5h135l-9 25 22 18-11 28-29 9-6 23-39 8-18 31-45 11Z" fill="url(#field-marsh)" />
      <path d="M326 22c-36 15-55 38-69 69-11 24-30 33-51 43-20 10-28 30-24 50 4 23-9 37-36 51l18 22c35-15 56-39 60-71 3-22 10-31 35-42 26-12 44-37 54-64Z" fill="#728466" />
      <path d="M-5 278c35-11 65-9 89 8 18 12 39 12 63 0l20 27c-35 22-63 23-94 4-22-13-49-13-78-2Z" fill="#617557" />
      <g fill="none" stroke="#d7ceb7" strokeWidth="1.2" strokeDasharray="5 3" opacity="0.9">
        <path d="m73 138 94-17 27 66-94 22Z" />
        <path d="m105 222 99-22 21 76-102 20Z" />
      </g>
      <g fill="#eef3f5" fontFamily="Arial, sans-serif" fontSize="7" fontWeight="700" opacity="0.9">
        <text x="103" y="157">LEASE 30260</text><text x="143" y="237">LEASE 36166</text>
      </g>
      {active === "poll" ? <PollMarks /> : null}
      {active === "dredge" ? <DredgeMark /> : null}
      {active === "point" ? <PointMark /> : null}
      {active === "bedding" ? <BeddingMark /> : null}
      {active === "notes" ? <NotesMark /> : null}
    </svg>
  );
}

function PollMarks() {
  const marks = [[113,151,"#d6c5aa"],[132,145,"#d6c5aa"],[150,160,"#c5d8e3"],[122,175,"#d6c5aa"],[146,184,"#3e7191"],[166,172,"#d6c5aa"],[176,195,"#2f8a74"],[139,204,"#c5d8e3"]] as const;
  return (
    <g className="field-app-map-marks" filter="url(#field-shadow)">
      {marks.map(([cx, cy, fill], index) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4.5" fill={fill} stroke="#fff" strokeWidth="1.5" style={{ animationDelay: `${index * 70}ms` }} />
      ))}
    </g>
  );
}

function DredgeMark() {
  const path = "M91 191c18-8 29-3 42 10 12 12 23 9 37-5 13-13 27-14 43-3";
  return (
    <g className="field-app-map-marks" fill="none" filter="url(#field-shadow)">
      <path className="field-app-trace" d={path} stroke="#f8f6f2" strokeWidth="5" strokeLinecap="round" />
      <path className="field-app-trace" d={path} stroke="#2f8a74" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="91" cy="191" r="4" fill="#fff" stroke="#2f8a74" strokeWidth="2" />
      <circle cx="213" cy="193" r="5" fill="#2f8a74" stroke="#fff" strokeWidth="2" />
    </g>
  );
}

function PointMark() {
  return (
    <g className="field-app-map-marks" transform="translate(158 181)" filter="url(#field-shadow)">
      <circle r="15" fill="#fff" opacity="0.92" /><circle r="8" fill="#1b4060" />
      <path d="M-4 0h8M0-4v8" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
    </g>
  );
}

function BeddingMark() {
  const path = "M86 246c27-26 55-28 84-9s54 16 79-10";
  return (
    <g className="field-app-map-marks" fill="none" filter="url(#field-shadow)">
      <path className="field-app-trace" d={path} stroke="#f8f6f2" strokeWidth="9" strokeLinecap="round" />
      <path className="field-app-trace" d={path} stroke="#d6c5aa" strokeWidth="5" strokeLinecap="round" strokeDasharray="3 4" />
      <circle cx="249" cy="227" r="5" fill="#d6c5aa" stroke="#fff" strokeWidth="2" />
    </g>
  );
}

function NotesMark() {
  return (
    <g className="field-app-map-marks" filter="url(#field-shadow)">
      <path d="m115 154 57-21 36 42-19 47-62-7-22-35Z" fill="#e2694e" fillOpacity="0.24" stroke="#e2694e" strokeWidth="2.5" strokeDasharray="5 3" />
      <g transform="translate(171 164)">
        <path d="M0-13c-7 0-12 5-12 12 0 9 12 20 12 20S12 8 12-1C12-8 7-13 0-13Z" fill="#e2694e" />
        <path d="M-4-2h8M0-6v8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
      </g>
    </g>
  );
}

function CaptureSheet({ active }: { active: CaptureMode }) {
  return (
    <div className="field-app-sheet" key={active}>
      <div className="field-app-sheet-handle" />
      {active === "poll" ? <PollSheet /> : null}
      {active === "dredge" ? <DredgeSheet /> : null}
      {active === "point" ? <PointSheet /> : null}
      {active === "bedding" ? <BeddingSheet /> : null}
      {active === "notes" ? <NotesSheet /> : null}
    </div>
  );
}

function SheetTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="field-app-sheet-title">
      <div><strong>{title}</strong><small>{subtitle}</small></div><span aria-hidden="true">&times;</span>
    </div>
  );
}

function PollSheet() {
  return <><SheetTitle title="Quick polling" subtitle="Lease 30260" /><div className="field-app-ready-row"><span><i /> GPS ready</span><strong>12 drops</strong></div><p className="field-app-mini-label">Tap the bottom type</p><div className="field-app-poll-grid"><span><i className="is-reef" />Solid reef</span><span><i className="is-shell" />Scattered shell</span><span><i className="is-mud" />Mud</span><span><i className="is-firm" />Firm bottom</span></div></>;
}

function DredgeSheet() {
  return <><SheetTitle title="Dredge sample" subtitle="Lease 30260" /><div className="field-app-recording"><span><i /> Recording tow</span><strong>186 ft</strong></div><div className="field-app-form-grid"><MiniField label="Oyster count" value="148" /><MiniField label="Dredge width" value={'36"'} /></div><div className="field-app-primary">Stop recording</div></>;
}

function PointSheet() {
  return <><SheetTitle title="Point sample" subtitle="GPS position ready" /><p className="field-app-mini-label">Sample type</p><div className="field-app-chip-row"><span className="is-active">Hand</span><span>Tong</span><span>Dredge</span><span>Diver</span></div><div className="field-app-form-grid"><MiniField label="Oyster count" value="42" /><MiniField label="Sample width" value={'24"'} /></div><div className="field-app-primary">Save sample</div></>;
}

function BeddingSheet() {
  return <><SheetTitle title="Bedding placement" subtitle="Lease 36166" /><div className="field-app-recording is-complete"><span>Track complete</span><strong>0.42 mi</strong></div><div className="field-app-form-grid"><MiniField label="Amount" value="125 CY" /><MiniField label="Material" value="Concrete" /></div><div className="field-app-photo-row"><span>✓ Loaded</span><span>✓ Unloading</span><span>+ Unloaded</span></div><div className="field-app-primary">Save placement</div></>;
}

function NotesSheet() {
  return <><SheetTitle title="Note" subtitle="Anywhere on the water" /><div className="field-app-chip-row"><span>Point</span><span>Line</span><span className="is-active">Area</span></div><div className="field-app-note-box"><small>Type</small><strong>Hazard</strong><p>Loose gear near channel edge</p></div><div className="field-app-primary">Save note</div></>;
}

function MiniField({ label, value }: { label: string; value: string }) {
  return <div className="field-app-mini-field"><small>{label}</small><strong>{value}</strong></div>;
}

function MenuIcon() {
  return <svg className="field-app-header-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5h14M3 10h14M3 15h14" /></svg>;
}

function SearchIcon() {
  return <svg className="field-app-header-icon" viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5" /><path d="m12.3 12.3 4 4" /></svg>;
}

function OfflineIcon() {
  return <span className="field-app-offline-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5.2 8.8A10 10 0 0 1 19 8.2M8.4 12.2a5.5 5.5 0 0 1 7.2-.3M11 16a1.5 1.5 0 0 1 2 0M3 3l18 18" /></svg></span>;
}

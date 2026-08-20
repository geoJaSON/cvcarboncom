"use client";

import type { FeatureCollection } from "geojson";
import { useEffect, useState } from "react";

/* ------------------------------------------------------------------
   Static snapshot pack, baked from the survey database by
   web_app_v2/py_tools/generate_story_snapshot.py in the app repo and
   committed under public/data/story/. Every file is optional at
   runtime: the page renders fully without them and lights layers up
   as they arrive.
   ------------------------------------------------------------------ */

export type BBox = [number, number, number, number];

export type StoryManifest = {
  snapshot_date: string;
  bounds: { overall: BBox } & Record<string, BBox>;
  stats: {
    leases_total?: number;
    leases_in_program?: number;
    entities_enrolled?: number;
    parishes?: number;
    states?: number;
    signed_acres?: number;
    polling_points?: number;
    dredge_samples?: number;
    point_samples?: number;
    bedding_placements?: number;
    bedding_short_tons?: number;
    bedding_track_miles?: number;
    css_acres?: { low?: number; med?: number; high?: number; total?: number; year?: number };
    net_mt_total?: number;
    gross_mt_total?: number;
    credits?: {
      total?: number;
      issued?: number;
      retired?: number;
      by_vintage?: { year: number; count: number }[];
    };
    samples_by_year?: { year: number; dredges: number; points: number; polling: number }[];
    bedding_by_year?: { year: number; placements: number; short_tons: number }[];
    css_by_year?: { year: number; low_acres: number; med_acres: number; high_acres: number }[];
  };
};

export type StoryFeatureCollection = FeatureCollection;

/* The construction ledger — how much reef each year's bedding built new
   and how much it re-shelled. Baked from Jason's per-year bedding layers
   by scripts/bake_reef_construction.py; absent file, absent chart. */
export type ConstructionManifest = {
  generated?: string;
  method?: string;
  /** Buffer half-width applied to raw placement tracks, in feet. */
  buffer_ft?: number | null;
  by_year: {
    year: number;
    constructed_acres: number;
    restored_acres: number;
    /** The year's whole dissolved bedding footprint, before splitting. */
    bedded_acres?: number;
  }[];
};

/** Substrate codes shipped by scripts/bake_lease_case.py. */
export type SubstrateCode = "mud" | "firm" | "scat" | "buried" | "reef";

/* One lease told start to finish — chapter five's data pack, baked by
   scripts/bake_lease_case.py from the raw survey exports. Optional like
   everything else: no files, no chapter. */
export type CaseStudyManifest = {
  lease_number: string;
  location: string;
  county: string;
  state: string;
  acres: number | null;
  bounds: { lease: BBox; view: BBox };
  before: CasePhaseStats;
  after: CasePhaseStats;
  bedding: {
    placements: number;
    window: [string, string];
    materials: string[];
    /** Unitless lines count as tons; cubic-yard/no-amount lines excluded. */
    short_tons: number | null;
    excluded_from_total?: number;
  };
  media?: { src: string; alt: string; caption?: string }[];
  video?: { src: string; poster?: string; caption?: string; muteLoop?: boolean } | null;
};

export type CasePhaseStats = {
  points: number;
  window: [string, string];
  classes: Partial<Record<SubstrateCode, number>>;
  pct_unproductive: number | null;
  pct_reef: number | null;
};

/* The lease 32024 field save — the bonus chapter told when the ?32024
   flag is up. Same shape as the case study, plus the one barge load
   that went down on the poled reef and was caught from out of state.
   Baked by scripts/bake_lease_save.py. */
export type SaveManifest = {
  lease_number: string;
  location: string;
  county: string;
  state: string;
  acres: number | null;
  bounds: { lease: BBox; view: BBox };
  before: CasePhaseStats;
  after: CasePhaseStats;
  bedding: {
    placements: number;
    window: [string, string];
    materials: string[];
    short_tons: number | null;
    /** Keyed by year: the build ran in two seasons a year apart. */
    campaigns?: Record<string, SaveCampaign>;
  };
  error_load: {
    objectid: number;
    /** 1-based position in the date-ordered replay. */
    placement_index: number;
    short_tons: number | null;
    material: string | null;
    date: string | null;
  } | null;
  /** One row per survey session: how long capture took to become a record. */
  provenance?: SaveSession[];
  /** Field photos matched to a placement; bedding features index into this. */
  photos?: SavePhoto[];
  /** Adams Bay marsh loss around the lease — the sediment source that buries shell. */
  marsh?: SaveMarsh;
  /** Known limits on the numbers above, surfaced rather than buried. */
  caveats?: { id: string; detail: string; affects?: string[] }[];
};

export type SaveCampaign = {
  placements: number;
  short_tons: number;
  window: [string, string] | null;
};

export type SaveSession = {
  date: string;
  phase: "before" | "after";
  points: number;
  /** Median hours from pole-in-the-mud to a row in the database. */
  lag_hours_median: number | null;
  /** Median seconds between consecutive soundings — the boat's working pace. */
  cadence_seconds_median: number | null;
};

export type SavePhoto = {
  src: string;
  alt: string;
  caption: string;
  width: number | null;
  height: number | null;
  objectid: number;
  placement_index: number;
  confidence: "high" | "medium" | "low" | null;
  /** Metres from the photo's GPS to the placement track it is matched to. */
  dist_to_track_m: number | null;
  taken_local: string | null;
};

export type SaveMarsh = {
  source: string;
  aoi_leases: number;
  acres_lost: number;
  hectares_lost: number;
  acres_per_year: number;
  study_area_pct_change: number;
  leases_losing_marsh: number;
  pct_marsh_within_500m: number;
  distance_to_marsh_increase_m: number;
  steepest_year: string;
  steepest_cause: string;
  storms: { name: string; date: string; cat: number; landfall: string }[];
  chronic: string;
  mechanism: string;
  limit: string;
};

/* The field gallery — overflow home for photos that don't fit the
   curated bands. Maintained by scripts/add_gallery_photos.py; absent
   file, absent band. */
export type GalleryPhoto = {
  src: string;
  alt: string;
  caption?: string;
  /** Source dimensions drive the field roll's editorial crop widths. */
  width?: number;
  height?: number;
  /** Original filename, recorded by add_gallery_photos.py for dedupe. */
  source?: string;
};
export type GalleryManifest = { photos: GalleryPhoto[] };

/* A scrubbable photo sequence — the same place on different days. Both
   the frames and the band's own copy live in the file, so aiming this
   at a new set of photographs never touches the components. */
export type SequenceFrame = {
  src: string;
  alt: string;
  /** Short tick label under the scrubber: "May 2025", "Before", "Day 1". */
  label?: string;
  /** Shown beneath the frame and swapped as the reader scrubs. */
  caption?: string;
};

export type SequenceManifest = {
  eyebrow?: string;
  title: string;
  intro?: string;
  /** Shape of the frame box; every photo is cropped to it. */
  aspect?: "portrait" | "landscape" | "square";
  frames: SequenceFrame[];
};

export type StoryData = {
  manifest: StoryManifest | null;
  caseManifest: CaseStudyManifest | null;
  saveManifest: SaveManifest | null;
  gallery: GalleryManifest | null;
  sequence: SequenceManifest | null;
  construction: ConstructionManifest | null;
  layers: {
    bedding: StoryFeatureCollection | null;
    cssTiers: StoryFeatureCollection | null;
    /* Banked-carbon columns per grid cell and vintage ({year, mt, base,
       top} points), baked by py_tools/bake_carbon_columns.py in the app
       repo. Replaced the raw sample-density grid in chapter three. */
    carbon: StoryFeatureCollection | null;
    coverage: StoryFeatureCollection | null;
    counties: StoryFeatureCollection | null;
    caseBoundary: StoryFeatureCollection | null;
    casePolling: StoryFeatureCollection | null;
    caseBedding: StoryFeatureCollection | null;
    /* The 32024 field save, URL-gated like the venture leases. */
    saveBoundary: StoryFeatureCollection | null;
    savePolling: StoryFeatureCollection | null;
    saveBedding: StoryFeatureCollection | null;
    /* Enrolled lease boundaries. Not produced by the bake yet; the
       venture inset draws them when the file appears and falls back to
       surveyed reef alone until then. */
    leases: StoryFeatureCollection | null;
  };
  /** True once every fetch has settled, hit or miss. */
  ready: boolean;
};

const BASE = "/data/story";

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    // Default cache mode revalidates against the server (cheap 304s), so
    // a re-baked snapshot shows up for returning visitors after deploy.
    const res = await fetch(`${BASE}/${path}`);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/* The lease layer is the one heavy file that most visitors never see:
   it is drawn only by the venture band's inset, which is URL-gated. Its
   fetch shares the Promise.all barrier with everything else, so pulling
   it unconditionally would delay the whole chart for every reader to
   serve a page they did not open. Callers opt in. */
export function useStoryData({
  leases: wantLeases = false,
  save: wantSave = false,
}: { leases?: boolean; save?: boolean } = {}): StoryData {
  const [data, setData] = useState<StoryData>({
    manifest: null,
    caseManifest: null,
    saveManifest: null,
    gallery: null,
    sequence: null,
    construction: null,
    layers: {
      bedding: null,
      cssTiers: null,
      carbon: null,
      coverage: null,
      counties: null,
      caseBoundary: null,
      casePolling: null,
      caseBedding: null,
      saveBoundary: null,
      savePolling: null,
      saveBedding: null,
      leases: null,
    },
    ready: false,
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [
        manifest,
        bedding,
        cssTiers,
        carbon,
        coverage,
        counties,
        caseManifest,
        caseBoundary,
        casePolling,
        caseBedding,
        gallery,
        sequence,
        construction,
        leases,
        saveManifest,
        saveBoundary,
        savePolling,
        saveBedding,
      ] = await Promise.all([
        fetchJson<StoryManifest>("manifest.json"),
        fetchJson<StoryFeatureCollection>("bedding.geojson"),
        fetchJson<StoryFeatureCollection>("css_tiers.geojson"),
        fetchJson<StoryFeatureCollection>("carbon_columns.geojson"),
        fetchJson<StoryFeatureCollection>("coverage.geojson"),
        fetchJson<StoryFeatureCollection>("counties.geojson"),
        fetchJson<CaseStudyManifest>("lease_30260.json"),
        fetchJson<StoryFeatureCollection>("lease_30260_boundary.geojson"),
        fetchJson<StoryFeatureCollection>("lease_30260_polling.geojson"),
        fetchJson<StoryFeatureCollection>("lease_30260_bedding.geojson"),
        fetchJson<GalleryManifest>("gallery.json"),
        fetchJson<SequenceManifest>("sequence.json"),
        fetchJson<ConstructionManifest>("construction.json"),
        wantLeases
          ? fetchJson<StoryFeatureCollection>("leases.geojson")
          : Promise.resolve(null),
        /* The field-save pack rides only behind its URL flag, same
           reasoning as the venture leases: don't tax every reader's
           Promise.all barrier with a chapter they cannot see. */
        wantSave ? fetchJson<SaveManifest>("lease_32024.json") : Promise.resolve(null),
        wantSave
          ? fetchJson<StoryFeatureCollection>("lease_32024_boundary.geojson")
          : Promise.resolve(null),
        wantSave
          ? fetchJson<StoryFeatureCollection>("lease_32024_polling.geojson")
          : Promise.resolve(null),
        wantSave
          ? fetchJson<StoryFeatureCollection>("lease_32024_bedding.geojson")
          : Promise.resolve(null),
      ]);
      if (cancelled) return;
      setData({
        manifest,
        caseManifest,
        saveManifest,
        gallery,
        sequence,
        construction,
        layers: {
          bedding,
          cssTiers,
          carbon,
          coverage,
          counties,
          caseBoundary,
          casePolling,
          caseBedding,
          saveBoundary,
          savePolling,
          saveBedding,
          leases,
        },
        ready: true,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [wantLeases, wantSave]);

  return data;
}

/* ------------------------------------------------------------------
   Derived reads over the snapshot.
   ------------------------------------------------------------------ */

export type StorySeason = {
  year: number;
  polling: number;
  dredges: number;
  points: number;
  /** The bake caught this season mid-flight — the boats are still out. */
  inProgress: boolean;
};

/** The most recent survey season in the snapshot, and whether it had
    closed when the snapshot was baked. A season whose year reaches the
    snapshot's own year is by definition still being worked. */
export function latestSeason(manifest: StoryManifest | null): StorySeason | null {
  const rows = manifest?.stats?.samples_by_year;
  if (!rows || rows.length === 0) return null;
  const latest = rows.reduce((a, b) => (b.year > a.year ? b : a));
  const snapshotYear = Number(manifest?.snapshot_date?.slice(0, 4));
  return {
    year: latest.year,
    polling: latest.polling,
    dredges: latest.dredges,
    points: latest.points,
    inProgress: Number.isFinite(snapshotYear) && latest.year >= snapshotYear,
  };
}

/** Reef acreage a case-study lease gained between its two survey
    passes: the sounding share that flipped to solid reef, applied to
    the lease's acres and floored — claim down, never up. Quoted by both
    the case-study chapter and the invitation-only opener, so it lives
    here rather than in whichever one happened to need it first. */
export function newReefAcres(cs: CaseStudyManifest | null): number | null {
  if (cs?.acres == null || cs.after.pct_reef == null || cs.before.pct_reef == null) return null;
  return Math.floor((cs.acres * (cs.after.pct_reef - cs.before.pct_reef)) / 100);
}

/* ------------------------------------------------------------------
   Formatting helpers — stats render as an em dash until the snapshot
   provides them, so a missing bake never shows a wrong number.
   ------------------------------------------------------------------ */

export function fmtInt(n: number | undefined | null): string {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
}

export function fmtCompact(n: number | undefined | null): string {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

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

export type StoryData = {
  manifest: StoryManifest | null;
  layers: {
    bedding: StoryFeatureCollection | null;
    cssTiers: StoryFeatureCollection | null;
    density: StoryFeatureCollection | null;
    coverage: StoryFeatureCollection | null;
    counties: StoryFeatureCollection | null;
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

export function useStoryData(): StoryData {
  const [data, setData] = useState<StoryData>({
    manifest: null,
    layers: {
      bedding: null,
      cssTiers: null,
      density: null,
      coverage: null,
      counties: null,
    },
    ready: false,
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [manifest, bedding, cssTiers, density, coverage, counties] = await Promise.all([
        fetchJson<StoryManifest>("manifest.json"),
        fetchJson<StoryFeatureCollection>("bedding.geojson"),
        fetchJson<StoryFeatureCollection>("css_tiers.geojson"),
        fetchJson<StoryFeatureCollection>("density.geojson"),
        fetchJson<StoryFeatureCollection>("coverage.geojson"),
        fetchJson<StoryFeatureCollection>("counties.geojson"),
      ]);
      if (cancelled) return;
      setData({
        manifest,
        layers: { bedding, cssTiers, density, coverage, counties },
        ready: true,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return data;
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

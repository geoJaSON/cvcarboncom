"""Bake the oyster lease boundaries for /story from a raw ArcGIS export.

Usage:
    python scripts/bake_leases.py [source.geojson]

Default source: ~/Downloads/Leases_ExportF_FeaturesToJSO.geojson

Writes public/data/story/leases.geojson, the optional layer the venture
band's pull-back inset draws around a site. Optional like the rest of
the snapshot pack: no file, no lease outlines, and the inset falls back
to surveyed reef alone.

Quirks handled here, verified against the 2026-08 export:
  - The export is EPSG:3857 in fact as well as in its header, unlike the
    bedding lines in bake_lease_case.py — reprojected here.
  - Forty-odd ArcGIS attributes ride along per feature (editor names,
    GlobalIDs, timestamps) and account for most of the 15 MB. Only the
    handful the page could ever show survives the bake.
  - Coordinates are rounded to five places (~1 m), well under a pixel at
    any zoom this layer is drawn at, which roughly halves the geometry.
"""

import json
import math
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "public" / "data" / "story"
DEFAULT_SRC = Path.home() / "Downloads" / "Leases_ExportF_FeaturesToJSO.geojson"

# The only attributes the page has any use for. Everything else in the
# export is ArcGIS bookkeeping or internal workflow state, and internal
# workflow state has no business on a page we hand to a buyer.
KEEP = ("lease_number", "acres", "county")
PLACES = 5


def merc_to_lonlat(x: float, y: float) -> tuple[float, float]:
    lon = x / 20037508.342789244 * 180.0
    lat = math.degrees(2 * math.atan(math.exp(y / 6378137.0)) - math.pi / 2)
    return lon, lat


def walk_coords(coords, fn):
    if isinstance(coords[0], (int, float)):
        return fn(coords)
    return [walk_coords(c, fn) for c in coords]


def convert(coord):
    lon, lat = merc_to_lonlat(coord[0], coord[1])
    return [round(lon, PLACES), round(lat, PLACES)]


def main() -> None:
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SRC
    if not src.exists():
        raise SystemExit(f"source not found: {src}")

    raw = json.loads(src.read_text(encoding="utf-8"))
    crs = (raw.get("crs") or {}).get("properties", {}).get("name", "")
    if "3857" not in str(crs):
        print(f"! source CRS is {crs!r}, expected EPSG:3857 — check before shipping")

    features = []
    skipped = 0
    for f in raw.get("features", []):
        geometry = f.get("geometry")
        if not geometry or geometry.get("type") not in ("Polygon", "MultiPolygon"):
            skipped += 1
            continue
        props = f.get("properties") or {}
        acres = props.get("acres")
        features.append(
            {
                "type": "Feature",
                "properties": {
                    "lease": props.get("lease_number"),
                    "acres": round(acres, 1) if isinstance(acres, (int, float)) else None,
                    "county": props.get("county"),
                },
                "geometry": {
                    "type": geometry["type"],
                    "coordinates": walk_coords(geometry["coordinates"], convert),
                },
            }
        )

    out = {"type": "FeatureCollection", "name": "leases", "features": features}
    path = OUT / "leases.geojson"
    path.write_text(json.dumps(out, separators=(",", ":")), encoding="utf-8")

    acres = sum(f["properties"]["acres"] or 0 for f in features)
    size = path.stat().st_size / 1_048_576
    print(f"leases.geojson  {len(features)} leases, {acres:,.0f} acres, {size:.2f} MB")
    if skipped:
        print(f"skipped {skipped} features with no usable polygon geometry")


if __name__ == "__main__":
    main()

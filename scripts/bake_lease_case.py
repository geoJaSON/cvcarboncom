"""Bake the lease 30260 case-study pack for /story from raw survey exports.

Usage:
    python scripts/bake_lease_case.py [source_dir]

Reads lease.geojson, polling_data.geojson, and bedding_lines.geojson from
source_dir (default: ~/Downloads/lease_data) and writes the four optional
snapshot files under public/data/story/. The story page renders fully
without them and lights the chapter up when they exist — same contract as
the main snapshot bake (generate_story_snapshot.py in the app repo).

Quirks handled here, verified against the 2026-08 export:
  - lease.geojson and polling_data.geojson are EPSG:3857; bedding_lines
    declares 3857 in its CRS header but actually contains WGS84 lon/lat.
  - Tonnage rule per Jason (2026-08-07): lines with a null units field
    are tons; lines in cubic yards or with no amount are excluded from
    the total (but still drawn and counted as placements).
"""

import json
import math
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

DIVIDER = datetime(2025, 5, 1, tzinfo=timezone.utc)
OUT = Path(__file__).resolve().parent.parent / "public" / "data" / "story"

# Editorial media for the case-study band. Files live under
# public/images/lease-30260/; entries ride through every rebake.
MEDIA = [
    {
        "src": "/images/lease-30260/cultch-barge-loaded.jpg",
        "alt": "Barge deck loaded with piles of shell and limestone cultch, a crewman working the water cannons",
        "caption": "Bedding material staged on the barge, paid for with carbon credits — washed over the side exactly where the chart says.",
    },
    {
        "src": "/images/lease-30260/spat-on-rock-hand.jpg",
        "alt": "A hand holding two pieces of river rock with young oyster spat cemented to them",
        "caption": "Rock recovered from the lease after bedding: new oyster spat already cemented on and building shell.",
    },
    {
        "src": "/images/lease-30260/spat-on-rock-pile.jpg",
        "alt": "A pile of river rock on deck, nearly every piece carrying young oyster spat",
        "caption": "Not one lucky rock — a deck sample of the placed river rock, spat on nearly every piece. This is the reef the December resurvey confirmed.",
    },
    {
        "src": "/images/lease-30260/dredge-sample.jpg",
        "alt": "Survey dredge basket full of oysters being hauled aboard at the boat's rail",
        "caption": "A density sample comes aboard. Every tow is counted by hand and logged to the field maps on the spot.",
    },
    {
        "src": "/images/lease-30260/polling-reef-outline.png",
        "alt": "Map of thousands of colored polling points outlining reef across two oyster leases",
        "caption": "Thousands of soundings, plotted — dense enough that the reef outlines itself.",
    },
]

# Set once the highlight cut lands in public/video/:
#   {"src": "/video/lease-30260.mp4", "poster": "/images/lease-30260/poster.jpg",
#    "caption": "...", "muteLoop": True}
VIDEO = None

# Survey substrate vocabulary -> compact codes shipped to the map.
SUBSTRATE_CODES = {
    "Mud": "mud",
    "Firm/Hard Bottom": "firm",
    "Scattered Shell": "scat",
    "Buried Shell": "buried",
    "Solid Reef": "reef",
}
UNPRODUCTIVE = {"mud", "firm"}


def merc_to_lonlat(x: float, y: float) -> tuple[float, float]:
    lon = x / 20037508.342789244 * 180.0
    lat = math.degrees(2 * math.atan(math.exp(y / 6378137.0)) - math.pi / 2)
    return lon, lat


def walk_coords(coords, fn):
    if isinstance(coords[0], (int, float)):
        return fn(coords)
    return [walk_coords(c, fn) for c in coords]


def reproject(geometry):
    return {
        "type": geometry["type"],
        "coordinates": walk_coords(
            geometry["coordinates"], lambda c: list(merc_to_lonlat(c[0], c[1]))
        ),
    }


def round_coords(geometry, places=6):
    return {
        "type": geometry["type"],
        "coordinates": walk_coords(
            geometry["coordinates"], lambda c: [round(c[0], places), round(c[1], places)]
        ),
    }


def bbox_of(geometries):
    w = s = math.inf
    e = n = -math.inf

    def visit(c):
        nonlocal w, s, e, n
        w, s = min(w, c[0]), min(s, c[1])
        e, n = max(e, c[0]), max(n, c[1])
        return c

    for g in geometries:
        walk_coords(g["coordinates"], visit)
    return [w, s, e, n]


def pad_bbox(b, frac=0.15):
    dx, dy = (b[2] - b[0]) * frac, (b[3] - b[1]) * frac
    return [round(b[0] - dx, 5), round(b[1] - dy, 5), round(b[2] + dx, 5), round(b[3] + dy, 5)]


def parse_date(ts):
    if not ts:
        return None
    return datetime.fromisoformat(ts.replace("Z", "+00:00"))


def fc(features, name):
    return {"type": "FeatureCollection", "name": name, "features": features}


def write(path: Path, payload):
    path.write_text(json.dumps(payload, separators=(",", ":")), encoding="utf-8")
    print(f"wrote {path.name}  ({path.stat().st_size:,} bytes)")


def main():
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.home() / "Downloads" / "lease_data"
    lease = json.loads((src / "lease.geojson").read_text(encoding="utf-8"))
    polling = json.loads((src / "polling_data.geojson").read_text(encoding="utf-8"))
    bedding = json.loads((src / "bedding_lines.geojson").read_text(encoding="utf-8"))
    OUT.mkdir(parents=True, exist_ok=True)

    # ---- boundary ----
    lf = lease["features"][0]
    lp = lf["properties"]
    boundary_geom = round_coords(reproject(lf["geometry"]))
    boundary = fc(
        [
            {
                "type": "Feature",
                "properties": {
                    "lease_number": lp.get("lease_number"),
                    "location": (lp.get("location") or "").title(),
                    "county": lp.get("county"),
                    "state": lp.get("state"),
                    "acres": lp.get("acres"),
                },
                "geometry": boundary_geom,
            }
        ],
        "lease_30260_boundary",
    )

    # ---- polling, split at the bedding divider ----
    points = []
    windows = {"before": [], "after": []}
    classes = {"before": Counter(), "after": Counter()}
    for f in polling["features"]:
        d = parse_date(f["properties"].get("polling_date"))
        code = SUBSTRATE_CODES.get(f["properties"].get("substrate"))
        if d is None or code is None:
            continue
        phase = "before" if d < DIVIDER else "after"
        windows[phase].append(d)
        classes[phase][code] += 1
        points.append(
            {
                "type": "Feature",
                "properties": {"s": code, "phase": phase},
                "geometry": round_coords(reproject(f["geometry"])),
            }
        )
    polling_out = fc(points, "lease_30260_polling")

    # ---- bedding, date-ordered so feature index replays chronologically ----
    lines = []
    tons = 0.0
    excluded = 0
    materials = Counter()
    for f in sorted(
        bedding["features"],
        key=lambda f: f["properties"].get("deployment_date") or "9999",
    ):
        p = f["properties"]
        d = parse_date(p.get("deployment_date"))
        if p.get("amount") and p.get("units") in ("Tons", None):
            tons += p["amount"]
        else:
            excluded += 1
        materials[p.get("bedding_cultch_placement")] += 1
        lines.append(
            {
                "type": "Feature",
                "properties": {
                    "d": d.date().isoformat() if d else None,
                    "material": p.get("bedding_cultch_placement"),
                },
                # Already WGS84 despite the file's 3857 header.
                "geometry": round_coords(f["geometry"]),
            }
        )
    bedding_out = fc(lines, "lease_30260_bedding")
    bed_dates = sorted(d for f in lines if (d := f["properties"]["d"]))

    # ---- manifest ----
    def phase_stats(phase):
        total = sum(classes[phase].values())
        shell = total - sum(classes[phase][c] for c in UNPRODUCTIVE)
        ds = sorted(windows[phase])
        return {
            "points": total,
            "window": [ds[0].date().isoformat(), ds[-1].date().isoformat()],
            "classes": dict(classes[phase]),
            "pct_unproductive": round(100 * (total - shell) / total, 1) if total else None,
            "pct_reef": round(100 * classes[phase]["reef"] / total, 1) if total else None,
        }

    lease_bbox = bbox_of([boundary_geom])
    view_bbox = pad_bbox(
        bbox_of([boundary_geom] + [f["geometry"] for f in points]), 0.15
    )

    manifest = {
        "lease_number": lp.get("lease_number"),
        "location": (lp.get("location") or "").title(),
        "county": lp.get("county"),
        "state": lp.get("state"),
        "acres": lp.get("acres"),
        "bounds": {"lease": [round(v, 5) for v in lease_bbox], "view": view_bbox},
        "before": phase_stats("before"),
        "after": phase_stats("after"),
        "bedding": {
            "placements": len(lines),
            "window": [bed_dates[0], bed_dates[-1]],
            "materials": [m for m, _ in materials.most_common() if m],
            "short_tons": round(tons),
            "excluded_from_total": excluded,
        },
        "media": MEDIA,
        "video": VIDEO,
    }

    write(OUT / "lease_30260_boundary.geojson", boundary)
    write(OUT / "lease_30260_polling.geojson", polling_out)
    write(OUT / "lease_30260_bedding.geojson", bedding_out)
    write(OUT / "lease_30260.json", manifest)
    print(json.dumps(manifest["before"], indent=2))
    print(json.dumps(manifest["after"], indent=2))
    print(json.dumps(manifest["bedding"], indent=2))
    print(f"bounds.view = {view_bbox}")


if __name__ == "__main__":
    main()

"""Bake the lease 32024 field-save pack for /story from raw survey exports.

Usage:
    python scripts/bake_lease_save.py [source_dir]

Reads lease_32024.geojson, poling.geojson, and bedding.geojson from
source_dir (default: ./32024) and writes the four optional snapshot files
under public/data/story/. Same contract as the other bakes: the story page
renders fully without them and lights the bonus chapter up when they exist.

The story this pack carries: the leaseholder poled the lease in June 2023
and found an island of live reef in bare bottom. Bedding began May 2025,
planned around the island using the app's live position over the substrate
data. Placement OBJECTID 10 was laid by a captain directly on the poled
reef while the leaseholder watched from out of state; he called it in, the
captain dredge-checked the bottom (oysters), and the remaining loads went
into the unproductive water. The lease was repolled Nov-Dec 2025.

Differences from the 30260 export handled here, verified 2026-08-20:
  - every layer is already WGS84 lon/lat (a guard reprojects if a future
    re-export arrives in EPSG:3857);
  - dates are epoch milliseconds, not ISO strings;
  - all bedding lines carry units == "Tons", so every amount counts.

Phase divider: the first deployment_date. The five 2025-04-30 soundings
are a pre-work check and land in "before" with the 2023 poll — the split
matches the export's own archive == "bedded" flag exactly (459 points).
"""

import json
import math
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "public" / "data" / "story"

# The errant barge load placed on the poled reef and caught remotely.
ERR_OBJECTID = 10

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


def normalize(geometry, places=6):
    """Round to 6 places; reproject first if the export is web-mercator."""
    probe: list[float] = []

    def grab(c):
        if not probe:
            probe.extend(c[:2])
        return c

    walk_coords(geometry["coordinates"], grab)
    mercator = abs(probe[0]) > 360 or abs(probe[1]) > 360

    def fix(c):
        lon, lat = merc_to_lonlat(c[0], c[1]) if mercator else (c[0], c[1])
        return [round(lon, places), round(lat, places)]

    return {"type": geometry["type"], "coordinates": walk_coords(geometry["coordinates"], fix)}


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


def parse_ms(ms):
    if not ms:
        return None
    return datetime.fromtimestamp(ms / 1000, timezone.utc)


def fc(features, name):
    return {"type": "FeatureCollection", "name": name, "features": features}


def write(path: Path, payload):
    path.write_text(json.dumps(payload, separators=(",", ":")), encoding="utf-8")
    print(f"wrote {path.name}  ({path.stat().st_size:,} bytes)")


def main():
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent / "32024"
    lease = json.loads((src / "lease_32024.geojson").read_text(encoding="utf-8"))
    polling = json.loads((src / "poling.geojson").read_text(encoding="utf-8"))
    bedding = json.loads((src / "bedding.geojson").read_text(encoding="utf-8"))
    OUT.mkdir(parents=True, exist_ok=True)

    # ---- boundary ----
    lf = lease["features"][0]
    lp = lf["properties"]
    boundary_geom = normalize(lf["geometry"])
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
        "lease_32024_boundary",
    )

    # ---- divider: the moment the barges started ----
    deploy_dates = sorted(
        d for f in bedding["features"] if (d := parse_ms(f["properties"].get("deployment_date")))
    )
    divider = deploy_dates[0]

    # ---- polling, split at the divider ----
    points = []
    windows = {"before": [], "after": []}
    classes = {"before": Counter(), "after": Counter()}
    for f in polling["features"]:
        d = parse_ms(f["properties"].get("polling_date"))
        code = SUBSTRATE_CODES.get(f["properties"].get("substrate"))
        if d is None or code is None:
            continue
        phase = "before" if d < divider else "after"
        windows[phase].append(d)
        classes[phase][code] += 1
        points.append(
            {
                "type": "Feature",
                "properties": {"s": code, "phase": phase},
                "geometry": normalize(f["geometry"]),
            }
        )
    polling_out = fc(points, "lease_32024_polling")

    # ---- bedding, date-ordered so feature index replays chronologically ----
    lines = []
    tons = 0.0
    materials = Counter()
    err_load = None
    for f in sorted(bedding["features"], key=lambda f: f["properties"].get("deployment_date") or 0):
        p = f["properties"]
        d = parse_ms(p.get("deployment_date"))
        if p.get("amount") and p.get("units") in ("Tons", None):
            tons += p["amount"]
        materials[p.get("bedding_cultch_placement")] += 1
        is_err = p.get("OBJECTID") == ERR_OBJECTID
        props = {
            "d": d.date().isoformat() if d else None,
            "material": p.get("bedding_cultch_placement"),
        }
        if is_err:
            props["err"] = 1
            err_load = {
                "objectid": ERR_OBJECTID,
                "placement_index": len(lines) + 1,
                "short_tons": round(p.get("amount") or 0),
                "material": p.get("bedding_cultch_placement"),
                "date": props["d"],
            }
        lines.append({"type": "Feature", "properties": props, "geometry": normalize(f["geometry"])})
    bedding_out = fc(lines, "lease_32024_bedding")
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
    view_bbox = pad_bbox(bbox_of([boundary_geom] + [f["geometry"] for f in points]), 0.15)

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
        },
        "error_load": err_load,
    }

    write(OUT / "lease_32024_boundary.geojson", boundary)
    write(OUT / "lease_32024_polling.geojson", polling_out)
    write(OUT / "lease_32024_bedding.geojson", bedding_out)
    write(OUT / "lease_32024.json", manifest)
    print(json.dumps(manifest["before"], indent=2))
    print(json.dumps(manifest["after"], indent=2))
    print(json.dumps(manifest["bedding"], indent=2))
    print(json.dumps(manifest["error_load"], indent=2))
    print(f"bounds.view = {view_bbox}")


if __name__ == "__main__":
    main()

"""Bake the Bay Boudreau case-study pack for /story: leases 30260 and 36166.

Usage:
    python scripts/bake_bay_boudreau.py [lease_36166_source_dir]

Chapter five tells two adjoining leases under one leaseholder as a single
record. This script merges:

  - lease 30260, read from the pack scripts/bake_lease_case.py already
    baked into public/data/story/ (its raw export is no longer on disk,
    so the baked lease_30260_* files are the source of truth there);
  - lease 36166, baked here from the raw export in ./bay_Boudreau/.

and writes bay_boudreau.json plus the three bay_boudreau_*.geojson layers.
Same contract as every other pack: absent files, absent chapter.

Lease 36166 export quirks, verified against the 2026-08-25 files:
  - lease.geojson and polling.geojson are EPSG:3857; bedding.geojson is
    WGS84 lon/lat. normalize() sniffs each geometry and reprojects.
  - dates are epoch milliseconds.
  - Tonnage rule per Jason (2026-08-07): lines with a null units field
    are tons; cubic-yard/no-amount lines are excluded from the total but
    still drawn and counted as placements.

Phase divider per lease: its own first deployment_date. For 36166 that is
2025-05-08; every pre-work sounding predates it by weeks, so the split is
unambiguous (942 before / 1,274 after).
"""

import json
import math
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "data" / "story"

SUBSTRATE_CODES = {
    "Mud": "mud",
    "Firm/Hard Bottom": "firm",
    "Scattered Shell": "scat",
    "Buried Shell": "buried",
    "Solid Reef": "reef",
}
UNPRODUCTIVE = {"mud", "firm"}


# ---- geometry helpers (shared idiom with the other bakes) ----

def merc_to_lonlat(x: float, y: float) -> tuple[float, float]:
    lon = x / 20037508.342789244 * 180.0
    lat = math.degrees(2 * math.atan(math.exp(y / 6378137.0)) - math.pi / 2)
    return lon, lat


def walk_coords(coords, fn):
    if isinstance(coords[0], (int, float)):
        return fn(coords)
    return [walk_coords(c, fn) for c in coords]


def normalize(geometry, places=6):
    """Round to 6 places; reproject first if this geometry is web-mercator."""
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


def union_bbox(boxes):
    return [
        min(b[0] for b in boxes),
        min(b[1] for b in boxes),
        max(b[2] for b in boxes),
        max(b[3] for b in boxes),
    ]


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


def phase_stats(classes: Counter, dates: list):
    total = sum(classes.values())
    shell = total - sum(classes[c] for c in UNPRODUCTIVE)
    ds = sorted(dates)
    return {
        "points": total,
        "window": [ds[0], ds[-1]] if ds else None,
        "classes": dict(classes),
        "pct_unproductive": round(100 * (total - shell) / total, 1) if total else None,
        "pct_reef": round(100 * classes["reef"] / total, 1) if total else None,
    }


# ---- one lease, either from a raw export or from an already-baked pack ----
#
# Both paths return the same shape:
#   {"lease": {...per-lease stats...}, "meta": {location, county, state},
#    "boundary": feature, "polling": [features], "bedding": [features]}
# with every feature stamped with its lease number.

def bake_raw(src: Path):
    lease = json.loads((src / "lease.geojson").read_text(encoding="utf-8"))
    polling = json.loads((src / "polling.geojson").read_text(encoding="utf-8"))
    bedding = json.loads((src / "bedding.geojson").read_text(encoding="utf-8"))

    lf = lease["features"][0]
    lp = lf["properties"]
    number = str(lp.get("lease_number"))
    boundary_geom = normalize(lf["geometry"])
    boundary = {
        "type": "Feature",
        "properties": {
            "lease_number": number,
            "location": (lp.get("location") or "").title(),
            "county": lp.get("county"),
            "state": lp.get("state"),
            "acres": lp.get("acres"),
            "lease": number,
        },
        "geometry": boundary_geom,
    }

    deploy_dates = sorted(
        d for f in bedding["features"] if (d := parse_ms(f["properties"].get("deployment_date")))
    )
    divider = deploy_dates[0]

    points = []
    windows = {"before": [], "after": []}
    classes = {"before": Counter(), "after": Counter()}
    for f in polling["features"]:
        d = parse_ms(f["properties"].get("polling_date"))
        code = SUBSTRATE_CODES.get(f["properties"].get("substrate"))
        if d is None or code is None:
            continue
        phase = "before" if d < divider else "after"
        windows[phase].append(d.date().isoformat())
        classes[phase][code] += 1
        points.append(
            {
                "type": "Feature",
                "properties": {"s": code, "phase": phase, "lease": number},
                "geometry": normalize(f["geometry"]),
            }
        )

    lines = []
    tons = 0.0
    excluded = 0
    materials = Counter()
    for f in sorted(bedding["features"], key=lambda f: f["properties"].get("deployment_date") or 0):
        p = f["properties"]
        d = parse_ms(p.get("deployment_date"))
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
                    "lease": number,
                },
                "geometry": normalize(f["geometry"]),
            }
        )
    bed_dates = sorted(d for f in lines if (d := f["properties"]["d"]))

    manifest = {
        "lease_number": number,
        "entity": lp.get("entity_name"),
        "acres": lp.get("acres"),
        "bounds": {"lease": [round(v, 5) for v in bbox_of([boundary_geom])]},
        "before": phase_stats(classes["before"], windows["before"]),
        "after": phase_stats(classes["after"], windows["after"]),
        "bedding": {
            "placements": len(lines),
            "window": [bed_dates[0], bed_dates[-1]],
            "materials": [m for m, _ in materials.most_common() if m],
            "short_tons": round(tons),
            "excluded_from_total": excluded,
        },
    }
    meta = {
        "location": (lp.get("location") or "").title(),
        "county": lp.get("county"),
        "state": lp.get("state"),
    }
    return {"lease": manifest, "meta": meta, "boundary": boundary, "polling": points, "bedding": lines}


def load_baked(prefix: str):
    """A pack bake_lease_case.py already wrote — lease 30260 today."""
    manifest = json.loads((OUT / f"{prefix}.json").read_text(encoding="utf-8"))
    boundary = json.loads((OUT / f"{prefix}_boundary.geojson").read_text(encoding="utf-8"))
    polling = json.loads((OUT / f"{prefix}_polling.geojson").read_text(encoding="utf-8"))
    bedding = json.loads((OUT / f"{prefix}_bedding.geojson").read_text(encoding="utf-8"))
    number = str(manifest["lease_number"])

    def stamp(f):
        return {**f, "properties": {**f["properties"], "lease": number}}

    lease = {
        "lease_number": number,
        "entity": None,
        "acres": manifest.get("acres"),
        "bounds": {"lease": manifest["bounds"]["lease"]},
        "before": manifest["before"],
        "after": manifest["after"],
        "bedding": manifest["bedding"],
    }
    meta = {k: manifest.get(k) for k in ("location", "county", "state")}
    return {
        "lease": lease,
        "meta": meta,
        "boundary": stamp(boundary["features"][0]),
        "polling": [stamp(f) for f in polling["features"]],
        "bedding": [stamp(f) for f in bedding["features"]],
        "media": manifest.get("media") or [],
        "video": manifest.get("video"),
    }


# ---- merge ----

def merge_phase(phases):
    classes = Counter()
    dates = []
    for ph in phases:
        classes.update(ph["classes"])
        if ph.get("window"):
            dates.extend(ph["window"])
    return phase_stats(classes, dates)


def main():
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "bay_Boudreau"
    packs = [load_baked("lease_30260"), bake_raw(src)]
    # Lease-number order, matching the flight-deck label in scenes.ts.
    packs.sort(key=lambda p: p["lease"]["lease_number"])
    leases = [p["lease"] for p in packs]

    boundary = fc([p["boundary"] for p in packs], "bay_boudreau_boundary")
    polling = fc([f for p in packs for f in p["polling"]], "bay_boudreau_polling")
    # Interleave both leases' placements by date so the replay shows the
    # crews working both bottoms in the same window.
    bedding = fc(
        sorted(
            (f for p in packs for f in p["bedding"]),
            key=lambda f: f["properties"].get("d") or "9999",
        ),
        "bay_boudreau_bedding",
    )

    lease_bbox = union_bbox([lease["bounds"]["lease"] for lease in leases])
    view_bbox = pad_bbox(
        bbox_of(
            [p["boundary"]["geometry"] for p in packs]
            + [f["geometry"] for f in polling["features"]]
        ),
        0.15,
    )

    materials = Counter()
    for lease in leases:
        for i, m in enumerate(lease["bedding"]["materials"]):
            # Weight by the lease's placements so the dominant material leads.
            materials[m] += lease["bedding"]["placements"] - i
    bed_windows = [w for lease in leases for w in lease["bedding"]["window"]]

    meta = packs[0]["meta"]
    manifest = {
        "location": meta["location"],
        "county": meta["county"],
        "state": meta["state"],
        "leases": leases,
        "acres": sum(lease["acres"] or 0 for lease in leases),
        "bounds": {"lease": [round(v, 5) for v in lease_bbox], "view": view_bbox},
        "before": merge_phase([lease["before"] for lease in leases]),
        "after": merge_phase([lease["after"] for lease in leases]),
        "bedding": {
            "placements": sum(lease["bedding"]["placements"] for lease in leases),
            "window": [min(bed_windows), max(bed_windows)],
            "materials": [m for m, _ in materials.most_common()],
            "short_tons": sum(lease["bedding"]["short_tons"] or 0 for lease in leases),
            "excluded_from_total": sum(
                lease["bedding"].get("excluded_from_total", 0) for lease in leases
            ),
        },
        # Editorial media rides with the 30260 pack (bake_lease_case.py MEDIA).
        "media": next((p["media"] for p in packs if p.get("media")), []),
        "video": next((p["video"] for p in packs if p.get("video")), None),
    }

    write(OUT / "bay_boudreau_boundary.geojson", boundary)
    write(OUT / "bay_boudreau_polling.geojson", polling)
    write(OUT / "bay_boudreau_bedding.geojson", bedding)
    write(OUT / "bay_boudreau.json", manifest)
    for lease in leases:
        print(
            f"lease {lease['lease_number']}: {lease['acres']} ac · "
            f"before {lease['before']['points']} pts, {lease['before']['pct_reef']}% reef · "
            f"after {lease['after']['points']} pts, {lease['after']['pct_reef']}% reef · "
            f"{lease['bedding']['placements']} loads, {lease['bedding']['short_tons']} t"
        )
    combined = {k: manifest[k] for k in ("acres", "before", "after", "bedding")}
    print("combined:", json.dumps(combined, indent=2))
    print(f"bounds.view = {view_bbox}")


if __name__ == "__main__":
    main()

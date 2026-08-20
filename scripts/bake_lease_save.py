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
# Written by match_placement_photos.py; absent until field photos land.
PHOTOS = Path(__file__).resolve().parent.parent / "32024" / "photo_matches.json"

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

# Adams Bay marsh-loss study (Sentinel-2 + NAIP, NOAA CO-OPS 8761724), 2019-2024.
# Lease 32024 sits inside that AOI, 63 km from Ida's landfall.
#
# NOTE ON MECHANISM. The source report reads these numbers as loss of *shelter*
# ("the marsh is their breakwater"). That is wrong and is corrected here: marsh
# does not shelter oysters. Eroding marsh is a sediment *source* — the material
# it sheds is what buries shell on the lease. The measurements stand; only the
# interpretation changes, and under the corrected one they bear directly on the
# buried-shell class rather than on wave exposure.
MARSH = {
    "source": "Adams Bay marsh loss, 2019-2024 (Sentinel-2 L2A + NAIP; NOAA CO-OPS 8761724)",
    "aoi_leases": 257,
    "acres_lost": 681,
    "hectares_lost": 275,
    "acres_per_year": 136,
    "study_area_pct_change": -6.1,
    "leases_losing_marsh": 247,
    "pct_marsh_within_500m": -16.1,
    "distance_to_marsh_increase_m": 62,
    "steepest_year": "2021",
    "steepest_cause": "Hurricane Ida, 29 Aug 2021, Cat 4 at Port Fourchon (63 km W)",
    # Four landfalls crossed this coast inside the study window. They punctuate
    # the loss; they do not cause all of it — every year in the series lost
    # ground, including the two with no landfall at all.
    "storms": [
        {"name": "Barry", "date": "2019-07-13", "cat": 1, "landfall": "Intracoastal City"},
        {"name": "Zeta", "date": "2020-10-28", "cat": 3, "landfall": "Cocodrie"},
        {"name": "Ida", "date": "2021-08-29", "cat": 4, "landfall": "Port Fourchon"},
        {"name": "Francine", "date": "2024-09-11", "cat": 2, "landfall": "Terrebonne Parish"},
    ],
    "chronic": "Every year in the record lost ground, including years with no landfall.",
    "mechanism": (
        "Marsh erodes; the sediment it sheds moves into the water column and "
        "settles on the lease, burying shell. Not a loss of shelter."
    ),
    "limit": "Optical imagery cannot see this bottom. The link is mechanistic, not a measured sediment flux.",
}


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
    photos = []
    if PHOTOS.exists():
        photos = [p for p in json.loads(PHOTOS.read_text(encoding="utf-8"))["photos"] if p.get("objectid")]
    photo_by_oid = {p["objectid"]: p for p in photos}
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
    sessions: dict[str, dict] = {}
    for f in polling["features"]:
        props = f["properties"]
        d = parse_ms(props.get("polling_date"))
        code = SUBSTRATE_CODES.get(props.get("substrate"))
        if d is None or code is None:
            continue
        phase = "before" if d < divider else "after"
        day = d.date().isoformat()
        windows[phase].append(d)
        classes[phase][code] += 1

        # Capture-to-record lag is the whole real-time argument: the 2023 poll
        # took 765 days to become a record, the 2025 polls took minutes. Both
        # stamps are already in the export; nothing here is derived.
        entry = sessions.setdefault(day, {"points": 0, "phase": phase, "lags": [], "stamps": []})
        entry["points"] += 1
        entry["stamps"].append(d)
        created = parse_ms(props.get("created_date"))
        if created:
            entry["lags"].append((created - d).total_seconds() / 3600)

        points.append(
            {
                "type": "Feature",
                "properties": {"s": code, "phase": phase, "epoch": day},
                "geometry": normalize(f["geometry"]),
            }
        )
    polling_out = fc(points, "lease_32024_polling")

    def session_rows():
        rows = []
        for day in sorted(sessions):
            e = sessions[day]
            lags = sorted(e["lags"])
            stamps = sorted(e["stamps"])
            gaps = [
                (stamps[i + 1] - stamps[i]).total_seconds()
                for i in range(len(stamps) - 1)
                if (stamps[i + 1] - stamps[i]).total_seconds() < 600
            ]
            rows.append(
                {
                    "date": day,
                    "phase": e["phase"],
                    "points": e["points"],
                    "lag_hours_median": round(lags[len(lags) // 2], 2) if lags else None,
                    "cadence_seconds_median": round(sorted(gaps)[len(gaps) // 2]) if gaps else None,
                }
            )
        return rows

    # ---- bedding, date-ordered so feature index replays chronologically ----
    lines = []
    tons = 0.0
    materials = Counter()
    campaigns: dict[str, dict] = {}
    err_load = None
    placed_photos = []
    for f in sorted(bedding["features"], key=lambda f: f["properties"].get("deployment_date") or 0):
        p = f["properties"]
        d = parse_ms(p.get("deployment_date"))
        amount = p.get("amount") if p.get("units") in ("Tons", None) else None
        if amount:
            tons += amount
        materials[p.get("bedding_cultch_placement")] += 1
        oid = p.get("OBJECTID")
        is_err = oid == ERR_OBJECTID

        # Two builds a year apart read as one continuous campaign unless the
        # season is carried through: 2025 laid 63 loads, 2026 another 25.
        season = str(d.year) if d else "unknown"
        c = campaigns.setdefault(season, {"placements": 0, "short_tons": 0.0, "dates": []})
        c["placements"] += 1
        c["short_tons"] += amount or 0
        if d:
            c["dates"].append(d.date().isoformat())

        props = {
            "d": d.date().isoformat() if d else None,
            "material": p.get("bedding_cultch_placement"),
            "tons": round(amount, 2) if amount else None,
            "season": season,
        }
        photo = photo_by_oid.get(oid)
        if photo:
            # Index into manifest["photos"] so the feature stays small.
            props["photo"] = len(placed_photos)
            placed_photos.append(
                {
                    "src": photo["src"],
                    "alt": photo.get("alt") or "",
                    "caption": photo.get("caption") or "",
                    "width": photo.get("width"),
                    "height": photo.get("height"),
                    "objectid": oid,
                    "placement_index": len(lines) + 1,
                    "confidence": photo.get("confidence"),
                    "dist_to_track_m": photo.get("dist_to_track_m"),
                    "taken_local": photo.get("taken_local"),
                }
            )
        if is_err:
            props["err"] = 1
            err_load = {
                "objectid": ERR_OBJECTID,
                "placement_index": len(lines) + 1,
                "short_tons": round(amount or 0),
                "material": p.get("bedding_cultch_placement"),
                "date": props["d"],
            }
        lines.append({"type": "Feature", "properties": props, "geometry": normalize(f["geometry"])})
    bedding_out = fc(lines, "lease_32024_bedding")
    bed_dates = sorted(d for f in lines if (d := f["properties"]["d"]))
    for c in campaigns.values():
        ds = sorted(c.pop("dates"))
        c["window"] = [ds[0], ds[-1]] if ds else None
        c["short_tons"] = round(c["short_tons"])

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

    # The 2023 survey had no "Firm/Hard Bottom" class at all; the 2025+ polls
    # logged 175 points to it. Any before/after class comparison is therefore
    # part reclassification, and the story must not present it as pure change.
    before_classes = set(classes["before"])
    after_classes = set(classes["after"])
    caveats = []
    added = sorted(after_classes - before_classes)
    if added:
        caveats.append(
            {
                "id": "class-vocabulary-drift",
                "detail": (
                    "Classes " + ", ".join(added) + " exist only in the later survey. "
                    "Before/after percentages mix real change with reclassification."
                ),
                "affects": ["pct_reef", "pct_unproductive"],
            }
        )

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
            "campaigns": campaigns,
        },
        "error_load": err_load,
        "provenance": session_rows(),
        "photos": placed_photos,
        "marsh": MARSH,
        "caveats": caveats,
    }

    write(OUT / "lease_32024_boundary.geojson", boundary)
    write(OUT / "lease_32024_polling.geojson", polling_out)
    write(OUT / "lease_32024_bedding.geojson", bedding_out)
    write(OUT / "lease_32024.json", manifest)
    print(json.dumps(manifest["before"], indent=2))
    print(json.dumps(manifest["after"], indent=2))
    print(json.dumps(manifest["bedding"], indent=2))
    print(json.dumps(manifest["error_load"], indent=2))
    print(json.dumps(manifest["bedding"]["campaigns"], indent=2))
    print("provenance:")
    for row in manifest["provenance"]:
        print(
            f"  {row['date']}  {row['phase']:<6} n={row['points']:<5}"
            f" lag={row['lag_hours_median']}h  cadence={row['cadence_seconds_median']}s"
        )
    for c in manifest["caveats"]:
        print(f"CAVEAT {c['id']}: {c['detail']}")
    print(f"bounds.view = {view_bbox}")


if __name__ == "__main__":
    main()

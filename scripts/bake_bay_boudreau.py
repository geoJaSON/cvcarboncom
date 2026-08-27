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

Dredge tows (optional). Drop a gis_dredge_samples export covering both
leases at bay_Boudreau/dredges.geojson (or pass --dredges). Rows are read
tolerantly - Supabase columns (id, sample_date ISO, oyster_count,
oyster_calc, attachments jsonb) or an AGOL export (OBJECTID, epoch-ms
sample_date). Tows sampled after the bedding began that carry at least one
image attachment are candidates; the --max-tows densest ones, spread across
both leases, become the "after" scene's photo cycle. Photos are pulled from
the public feature-attachments bucket into public/images/bay-boudreau/ and
web-sized; an already-downloaded file is never re-fetched. To work offline,
--dredge-photos DIR supplies files named exactly as the attachment `name`.
Hand-written alt/caption text lives in bay_Boudreau/dredge_captions.json,
keyed by attachment name, and survives every rebake.
"""

import argparse
import json
import math
import re
import sys
import urllib.request
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "data" / "story"

# Dredge-tow photos: the field app stores them as attachments in this public
# bucket; the story serves a stripped, web-sized copy from its own tree.
ATTACHMENT_BASE = "https://dsfiojtjwehyozrmnwcv.supabase.co/storage/v1/object/public/feature-attachments/"
TOW_WEB_DIR = ROOT / "public" / "images" / "bay-boudreau"
TOW_WEB_PREFIX = "/images/bay-boudreau"
TOW_MAX_WIDTH = 2000

# Editorial video for the material band that sits between the before and
# work scenes: barges being loaded with cultch. Transcoded from
# bay_Boudreau/VID_20260825_143309.mp4 (HEVC, with audio) to silent H.264:
#   ffmpeg -i VID.mp4 -an -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p \
#          -vf scale=1600:-2 -movflags +faststart public/video/bay-boudreau-loading.mp4
# Set to None to drop the band; it rides through every rebake otherwise.
VIDEO = {
    "src": "/video/bay-boudreau-loading.mp4",
    "poster": "/video/bay-boudreau-loading.jpg",
    "caption": (
        "Loading out for Bay Boudreau. Every barge that left this dock is one of the "
        "GPS-logged runs replayed on the chart below."
    ),
    "muteLoop": True,
}

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
    """A pack bake_lease_case.py already wrote - lease 30260 today."""
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


# ---- dredge tows with photos ----

def parse_when(value):
    """sample_date as epoch ms (AGOL) or ISO 8601 (Supabase)."""
    if value in (None, ""):
        return None
    if isinstance(value, (int, float)):
        return parse_ms(value)
    try:
        d = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None
    return d if d.tzinfo else d.replace(tzinfo=timezone.utc)


PHOTO_EXTS = (".jpg", ".jpeg", ".png", ".heic")


def attachments_of(props, photo_dirs: list[Path]):
    """Image attachments for one tow.

    Supabase rows carry them in the `attachments` jsonb. An AGOL export
    has no such column, so fall back to files dropped beside the export:
    named by OBJECTID / id, by oyster_count, or `tow-<OBJECTID>-*`."""
    raw = props.get("attachments")
    if isinstance(raw, str):
        try:
            raw = json.loads(raw)
        except ValueError:
            raw = None
    if isinstance(raw, list):
        found = [
            a
            for a in raw
            if isinstance(a, dict)
            and a.get("storage_path")
            and str(a.get("content_type", "image/")).startswith("image/")
        ]
        if found:
            return found

    stems = {
        str(v)
        for v in (props.get("OBJECTID"), props.get("id"), props.get("oyster_count"))
        if v not in (None, "")
    }
    oid = props.get("OBJECTID") or props.get("id")
    local = []
    for d in photo_dirs:
        if not d or not d.is_dir():
            continue
        for f in sorted(d.iterdir()):
            if f.suffix.lower() not in PHOTO_EXTS:
                continue
            if f.stem in stems or (oid is not None and f.stem.lower().startswith(f"tow-{oid}-")):
                local.append({"name": f.name, "local": f, "content_type": "image/"})
    return local


def tow_midpoint(geometry):
    """A marker point for a tow: the middle vertex of its longest part."""
    if geometry["type"] == "Point":
        return geometry["coordinates"]
    parts = geometry["coordinates"] if geometry["type"] == "MultiLineString" else [geometry["coordinates"]]
    part = max(parts, key=len)
    return part[len(part) // 2]


def slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-") or "photo"


def fetch_photo(att: dict, dest: Path, local_dir: Path | None) -> tuple[int, int] | None:
    """Web-size one attachment into dest. Returns (w, h), or None if unavailable."""
    from PIL import Image, ImageOps  # local import: the geometry-only bake needs no Pillow

    if dest.exists():
        with Image.open(dest) as im:
            return im.size
    source = None
    if att.get("local"):
        source = Path(att["local"])
    elif local_dir and (local_dir / att["name"]).exists():
        source = local_dir / att["name"]
    else:
        try:
            with urllib.request.urlopen(ATTACHMENT_BASE + att["storage_path"], timeout=30) as r:
                tmp = dest.with_suffix(".download")
                tmp.write_bytes(r.read())
                source = tmp
        except Exception as exc:  # noqa: BLE001 - report and carry on
            print(f"  SKIP {att.get('name')}: {exc}")
            return None
    image = ImageOps.exif_transpose(Image.open(source))
    if image.width > TOW_MAX_WIDTH:
        image = image.resize(
            (TOW_MAX_WIDTH, max(1, round(image.height * TOW_MAX_WIDTH / image.width))), Image.LANCZOS
        )
    # EXIF is deliberately dropped: crew GPS stays out of the public bundle.
    image.convert("RGB").save(dest, "JPEG", quality=84, optimize=True, progressive=True)
    if source.suffix == ".download":
        source.unlink()
    return image.size


def bake_dredges(path: Path, dividers: dict[str, datetime], max_tows: int, local_dir: Path | None):
    """Select photographed after-bedding tows and return (features, tows, photos)."""
    raw = json.loads(path.read_text(encoding="utf-8"))["features"]
    captions_path = path.parent / "dredge_captions.json"
    captions = json.loads(captions_path.read_text(encoding="utf-8")) if captions_path.exists() else {}

    candidates = []
    photo_dirs = [d for d in (local_dir, path.parent) if d]
    for f in raw:
        p = f["properties"]
        lease = str(p.get("lease_number") or "")
        when = parse_when(p.get("sample_date"))
        atts = attachments_of(p, photo_dirs)
        usable = str(p.get("usability") or "").lower()
        if lease not in dividers or when is None or not atts or usable.startswith(("unus", "no")):
            continue
        if when < dividers[lease]:
            continue
        candidates.append(
            {
                "id": str(p.get("id") or p.get("OBJECTID") or p.get("globalid") or len(candidates) + 1),
                "lease": lease,
                "when": when,
                "count": p.get("oyster_count"),
                # The app's own figure; its unit is not per m² (it is
                # count/area scaled by a fixed factor), so the page shows the
                # raw tow instead and carries this only for the record.
                "calc": p.get("oyster_calc"),
                # Width in inches, length in feet, area in square feet -
                # the export's convention (38 in × 52 ft = 164 sq ft).
                "width_in": p.get("dredge_width"),
                "length_ft": p.get("dredge_length"),
                "area_sqft": p.get("dredge_area"),
                "atts": atts,
                "geometry": normalize(f["geometry"]),
            }
        )
    print(f"dredge tows: {len(raw)} rows, {len(candidates)} photographed after bedding")

    # Fullest baskets first, alternating leases so one cannot take every slot.
    by_lease: dict[str, list] = {}
    for c in sorted(candidates, key=lambda c: -(c["count"] or 0)):
        by_lease.setdefault(c["lease"], []).append(c)
    picked = []
    while len(picked) < max_tows and any(by_lease.values()):
        for lease in sorted(by_lease):
            if by_lease[lease] and len(picked) < max_tows:
                picked.append(by_lease[lease].pop(0))
    picked.sort(key=lambda c: c["when"])

    TOW_WEB_DIR.mkdir(parents=True, exist_ok=True)
    features, tows, photos = [], [], []
    for n, c in enumerate(picked, start=1):
        date = c["when"].date().isoformat()
        tow = {
            "tow": n,
            "id": c["id"],
            "lease": c["lease"],
            "date": date,
            "oyster_count": c["count"],
            "oyster_calc": c["calc"],
            "width_in": c["width_in"],
            "length_ft": c["length_ft"],
            "area_sqft": c["area_sqft"],
            "photos": [],
        }
        for att in c["atts"]:
            dest = TOW_WEB_DIR / f"tow-{n:02d}-{slug(Path(att['name']).stem)}.jpg"
            size = fetch_photo(att, dest, local_dir)
            if size is None:
                continue
            hand = captions.get(att["name"], {})
            # The inset prints count and density on its own provenance
            # line, so the fallback caption stays prose and never repeats
            # them. Hand captions in dredge_captions.json replace it.
            when = c["when"].strftime("%-d %b %Y") if sys.platform != "win32" else c["when"].strftime("%#d %b %Y")
            auto_caption = (
                f"What came up in the basket on {when}: a density tow across the "
                f"resurveyed bottom of lease {c['lease']}."
            )
            photos.append(
                {
                    "src": f"{TOW_WEB_PREFIX}/{dest.name}",
                    "alt": hand.get("alt") or f"Dredge tow {n} on lease {c['lease']}, {date}",
                    "caption": hand.get("caption") or auto_caption,
                    "width": size[0],
                    "height": size[1],
                    "tow": n,
                    "lease": c["lease"],
                    "date": date,
                    "oyster_count": c["count"],
                    "width_in": c["width_in"],
                    "length_ft": c["length_ft"],
                    "area_sqft": c["area_sqft"],
                }
            )
            tow["photos"].append(len(photos) - 1)
        if not tow["photos"]:
            continue
        tows.append(tow)
        props = {"tow": n, "lease": c["lease"], "d": date, "photo": tow["photos"][0]}
        features.append(
            {"type": "Feature", "properties": {**props, "kind": "tow"},
             "geometry": {"type": "Point", "coordinates": tow_midpoint(c["geometry"])}}
        )
        if c["geometry"]["type"] != "Point":
            features.append({"type": "Feature", "properties": {**props, "kind": "track"}, "geometry": c["geometry"]})
    return features, tows, photos


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
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("source", nargs="?", default=str(ROOT / "bay_Boudreau"), help="lease 36166 export dir")
    ap.add_argument("--dredges", help="gis_dredge_samples geojson (default: <source>/dredges.geojson)")
    ap.add_argument("--dredge-photos", help="dir of attachment files named as in the export, for offline runs")
    ap.add_argument("--max-tows", type=int, default=6, help="photographed tows to light in the after scene")
    args = ap.parse_args()
    src = Path(args.source)
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
        "video": VIDEO,
    }

    # ---- dredge tows: present only when the export is ----
    dredges_path = Path(args.dredges) if args.dredges else next(
        (p for p in (src / "dredges.geojson", src / "dredge.geojson") if p.exists()),
        src / "dredges.geojson",
    )
    dredges_out = OUT / "bay_boudreau_dredges.geojson"
    if dredges_path.exists():
        # Each lease's bedding start is its own before/after line, as above.
        dividers = {
            lease["lease_number"]: datetime.fromisoformat(lease["bedding"]["window"][0]).replace(tzinfo=timezone.utc)
            for lease in leases
        }
        features, tows, tow_photos = bake_dredges(
            dredges_path, dividers, args.max_tows, Path(args.dredge_photos) if args.dredge_photos else None
        )
        manifest["dredges"] = tows
        manifest["photos"] = tow_photos
        write(dredges_out, fc(features, "bay_boudreau_dredges"))
        for t in tows:
            print(
                f"  tow {t['tow']:>2}  lease {t['lease']}  {t['date']}  {t['oyster_count']} oysters "
                f"over {t['area_sqft']} sq ft  {len(t['photos'])} photo(s)"
            )
    elif dredges_out.exists():
        dredges_out.unlink()
        print(f"removed stale {dredges_out.name} (no dredge export at {dredges_path})")

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

"""Tie lease 32024 field photos to the bedding placement each one shows.

Usage:
    python scripts/match_placement_photos.py [--dry-run] [source_dir]

Drop the ORIGINAL camera files (EXIF intact) into 32024/photos/ and run
this. For every image it:
  1. reads EXIF capture time + GPS *before* any re-encode;
  2. matches it to the bedding placement it was taken during/next to;
  3. web-sizes it into public/images/lease-32024/;
  4. writes 32024/photo_matches.json, which bake_lease_save.py folds into
     the story pack so the map can show an inset beside the highlighted
     placement.

Why the originals matter
------------------------
Re-encoding drops EXIF. add_gallery_photos.py saves without `exif=`, so
anything imported through it has already lost GPS and capture time — the
two fields this match depends on. Always point this script at the camera
originals, never at files already in public/images/.

How a photo is matched
----------------------
Priority order, first hit wins:

  1. FILENAME  — a name starting "load-<N>" or containing "objectid-<N>"
     pins the photo to that OBJECTID. Always wins; use it to correct a
     bad automatic match without editing JSON by hand.
  2. EXIF      — capture time and, when present, GPS.
  3. UNMATCHED — recorded in the manifest with objectid null so nothing
     is silently dropped. Fix by renaming the file per rule 1.

TIMEZONE, THE EASY THING TO GET WRONG. EXIF DateTimeOriginal is naive
local time; deployment_date is epoch ms UTC. Read the EXIF stamp as
America/Chicago (verified: it puts all 88 loads between 06:00 and 20:00
local, while UTC straddles midnight). Skipping this shifts every photo
~5 h, and since same-day loads sit a median 2.4 h apart, that lands on
the wrong load rather than failing loudly.

Scoring. Time is the primary signal, GPS the tiebreaker. A photo is
accepted against a placement when it is within TIME_TOL of that load's
deployment stamp; among candidates in range the smallest combined
(time, distance-to-track) score wins. Confidence is reported so the UI
can caption honestly:

  high   — inside the time window AND GPS within GPS_NEAR of the track
  medium — inside the time window, no usable GPS
  low    — GPS on-track but time outside the window (or vice versa)

Robustness contract:
  - The manifest is rewritten whole on each run, but hand-edited "alt"
    and "caption" fields are carried over by source filename.
  - A file that fails to decode is reported and skipped, not fatal.
  - --dry-run prints the match table and writes nothing.
  - Re-running is idempotent: same inputs produce the same manifest.

Requires: pillow, pillow-heif  (pip install pillow pillow-heif)
"""

import argparse
import json
import math
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

from PIL import Image, ImageOps

try:  # phone photos are frequently HEIC
    from pillow_heif import register_heif_opener

    register_heif_opener()
except ImportError:  # pragma: no cover - optional until a HEIC shows up
    pass

ROOT = Path(__file__).resolve().parent.parent
SRC_DEFAULT = ROOT / "32024" / "photos"
BEDDING = ROOT / "32024" / "bedding.geojson"
WEB_DIR = ROOT / "public" / "images" / "lease-32024"
WEB_PREFIX = "/images/lease-32024"
MANIFEST = ROOT / "32024" / "photo_matches.json"

FIELD_TZ = ZoneInfo("America/Chicago")
EXTENSIONS = {".jpg", ".jpeg", ".png", ".heic", ".heif"}
MAX_WIDTH = 2000

# Same-day loads sit a median 2.4 h apart (min 0.7 h), so a window wider
# than ~1.2 h starts matching two placements at once.
TIME_TOL_MIN = 75
# A load track is ~1.7 km long; a crewman photographing the work is on or
# beside the boat, so anything past this is a different load.
GPS_NEAR_M = 150
# Wider than the lease itself (~0.6 km), so this only rules out photos taken
# somewhere else entirely — it cannot pick between loads. Time does that.
GPS_MAX_M = 600

FILENAME_PIN = re.compile(r"^load[-_ ]?(\d+)|objectid[-_ ]?(\d+)", re.IGNORECASE)


# ---------------------------------------------------------------- geometry


def haversine_m(a: tuple[float, float], b: tuple[float, float]) -> float:
    lon1, lat1, lon2, lat2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    dlon, dlat = lon2 - lon1, lat2 - lat1
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 2 * 6371000 * math.asin(math.sqrt(h))


def segments(geometry) -> list[list[list[float]]]:
    if geometry["type"] == "MultiLineString":
        return geometry["coordinates"]
    return [geometry["coordinates"]]


def dist_to_track_m(point: tuple[float, float], geometry) -> float:
    """Nearest distance from point to any vertex of the track.

    Vertex distance rather than true point-to-segment: tracks carry a
    median 439 vertices over ~1.7 km, so vertices land ~4 m apart and the
    approximation is far below the GPS error we are thresholding on.
    """
    best = math.inf
    for seg in segments(geometry):
        for c in seg:
            d = haversine_m(point, (c[0], c[1]))
            if d < best:
                best = d
    return best


# -------------------------------------------------------------------- exif


def _dms(values, ref: str) -> float:
    deg = float(values[0]) + float(values[1]) / 60 + float(values[2]) / 3600
    return -deg if ref in ("S", "W") else deg


def read_exif(path: Path) -> dict:
    """Capture time (localized) and GPS, read before any re-encode."""
    out: dict = {"taken_local": None, "taken_utc": None, "gps": None}
    try:
        exif = Image.open(path).getexif()
    except Exception:
        return out
    if not exif:
        return out

    sub = exif.get_ifd(0x8769)
    raw = sub.get(0x9003) or sub.get(0x9004) or exif.get(0x0132)
    if raw:
        try:
            naive = datetime.strptime(str(raw), "%Y:%m:%d %H:%M:%S")
            local = naive.replace(tzinfo=FIELD_TZ)
            out["taken_local"] = local.isoformat()
            out["taken_utc"] = local.astimezone(timezone.utc)
        except ValueError:
            pass

    gps = exif.get_ifd(0x8825)
    if gps and 2 in gps and 4 in gps and 1 in gps and 3 in gps:
        try:
            out["gps"] = (round(_dms(gps[4], gps[3]), 6), round(_dms(gps[2], gps[1]), 6))
        except Exception:
            pass
    return out


# ------------------------------------------------------------------- match


def load_placements() -> list[dict]:
    raw = json.loads(BEDDING.read_text(encoding="utf-8"))["features"]
    raw.sort(key=lambda f: f["properties"].get("deployment_date") or 0)
    out = []
    for index, feature in enumerate(raw, start=1):
        props = feature["properties"]
        stamp = props.get("deployment_date")
        out.append(
            {
                "objectid": props.get("OBJECTID"),
                "placement_index": index,
                "when": datetime.fromtimestamp(stamp / 1000, timezone.utc) if stamp else None,
                "amount": props.get("amount"),
                "material": props.get("bedding_cultch_placement"),
                "geometry": feature["geometry"],
            }
        )
    return out


def pin_from_filename(name: str, by_objectid: dict) -> dict | None:
    m = FILENAME_PIN.search(name)
    if not m:
        return None
    return by_objectid.get(int(m.group(1) or m.group(2)))


def match(exif: dict, placements: list[dict]) -> tuple[dict | None, dict]:
    """Return (placement, detail). Time is primary, GPS is the tiebreaker."""
    taken = exif["taken_utc"]
    gps = exif["gps"]
    if taken is None and gps is None:
        return None, {"reason": "no EXIF time or GPS"}

    scored = []
    for p in placements:
        if p["when"] is None:
            continue
        minutes = abs((taken - p["when"]).total_seconds()) / 60 if taken else None
        metres = dist_to_track_m(gps, p["geometry"]) if gps else None
        in_time = minutes is not None and minutes <= TIME_TOL_MIN
        in_space = metres is not None and metres <= GPS_MAX_M
        if not (in_time or in_space):
            continue
        # Normalise both axes to ~0-1 so neither dominates by unit scale.
        score = (minutes / TIME_TOL_MIN if minutes is not None else 1.0) + (
            metres / GPS_MAX_M if metres is not None else 1.0
        )
        scored.append((score, minutes, metres, in_time, in_space, p))

    if not scored:
        return None, {"reason": "no placement within time or distance tolerance"}

    scored.sort(key=lambda s: s[0])
    _, minutes, metres, in_time, in_space, best = scored[0]
    # Only the time window discriminates: the lease is ~0.6 km across, so
    # GPS_MAX_M reaches nearly every track and would report 80+ "rivals".
    contenders = sum(1 for s in scored if s[3])
    if in_time and metres is not None and metres <= GPS_NEAR_M:
        confidence = "high"
    elif in_time and metres is None:
        confidence = "medium"
    else:
        confidence = "low"
    return best, {
        "confidence": confidence,
        "minutes_from_deployment": round(minutes) if minutes is not None else None,
        "dist_to_track_m": round(metres) if metres is not None else None,
        "other_candidates_in_time_window": max(0, contenders - 1),
    }


# ------------------------------------------------------------------ output


def slugify(stem: str) -> str:
    # Drop any "load-<N>"/"objectid-<N>" pin: the caller re-adds it, and
    # leaving it here yields "load-77-load-77-...".
    stem = FILENAME_PIN.sub("", stem)
    s = re.sub(r"[^a-z0-9]+", "-", stem.lower()).strip("-")
    return s or "photo"


def convert(path: Path, dest: Path) -> tuple[int, int]:
    image = ImageOps.exif_transpose(Image.open(path))
    if image.width < 1 or image.height < 1:
        raise ValueError(f"zero-size image ({image.width}x{image.height})")
    if image.width > MAX_WIDTH:
        image = image.resize(
            (MAX_WIDTH, max(1, round(image.height * MAX_WIDTH / image.width))), Image.LANCZOS
        )
    if "A" in image.getbands():
        bg = Image.new("RGB", image.size, (255, 255, 255))
        bg.paste(image, mask=image.getchannel("A"))
        image = bg
    # EXIF is deliberately not carried into the web copy: it is already
    # captured in the manifest, and stripping it keeps crew GPS traces
    # out of the public bundle.
    image.convert("RGB").save(dest, "JPEG", quality=84, optimize=True, progressive=True)
    return image.width, image.height


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("source", nargs="?", default=str(SRC_DEFAULT))
    ap.add_argument("--dry-run", action="store_true", help="print matches, write nothing")
    args = ap.parse_args()

    src = Path(args.source)
    if not src.is_dir():
        print(f"no photo directory at {src}")
        print(f"create it and drop the camera originals in:  mkdir -p {src}")
        return 1

    files = sorted(p for p in src.iterdir() if p.suffix.lower() in EXTENSIONS)
    if not files:
        print(f"{src} has no images ({', '.join(sorted(EXTENSIONS))})")
        return 1

    placements = load_placements()
    by_objectid = {p["objectid"]: p for p in placements}

    prior = {}
    if MANIFEST.exists():
        for entry in json.loads(MANIFEST.read_text(encoding="utf-8")).get("photos", []):
            prior[entry.get("file")] = entry

    if not args.dry_run:
        WEB_DIR.mkdir(parents=True, exist_ok=True)

    photos, unmatched, taken_slugs = [], 0, set()
    for path in files:
        exif = read_exif(path)
        placement = pin_from_filename(path.stem, by_objectid)
        if placement:
            detail = {"confidence": "high", "pinned_by": "filename"}
        else:
            placement, detail = match(exif, placements)
        if placement is None:
            unmatched += 1

        slug = slugify(path.stem)
        if placement:
            slug = f"load-{placement['objectid']:02d}-{slug}"
        if slug in taken_slugs:
            n = 2
            while f"{slug}-{n}" in taken_slugs:
                n += 1
            slug = f"{slug}-{n}"
        taken_slugs.add(slug)
        dest = WEB_DIR / f"{slug}.jpg"

        try:
            width, height = (0, 0) if args.dry_run else convert(path, dest)
        except Exception as exc:
            print(f"  SKIP {path.name}: {exc}")
            continue

        carried = prior.get(path.name, {})
        entry = {
            "file": path.name,
            "src": f"{WEB_PREFIX}/{dest.name}",
            "width": width or carried.get("width"),
            "height": height or carried.get("height"),
            "objectid": placement["objectid"] if placement else None,
            "placement_index": placement["placement_index"] if placement else None,
            "short_tons": round(placement["amount"]) if placement and placement["amount"] else None,
            "material": placement["material"] if placement else None,
            "deployed": placement["when"].isoformat() if placement and placement["when"] else None,
            "taken_local": exif["taken_local"],
            "gps": list(exif["gps"]) if exif["gps"] else None,
            "match": "filename" if detail.get("pinned_by") else ("exif" if placement else "none"),
            **{k: v for k, v in detail.items() if k != "pinned_by"},
            # Hand-edit these two in the manifest; re-runs preserve them.
            "alt": carried.get("alt", ""),
            "caption": carried.get("caption", ""),
        }
        photos.append(entry)

    photos.sort(key=lambda e: (e["placement_index"] is None, e["placement_index"] or 0))

    print(f"\n{len(photos)} photo(s) from {src}\n")
    header = f"  {'file':<28}{'load':>6}{'conf':>9}{'Δmin':>7}{'dist m':>8}  {'match':<9}"
    print(header)
    print("  " + "-" * (len(header) - 2))
    for e in photos:
        print(
            f"  {e['file'][:27]:<28}"
            f"{(e['objectid'] if e['objectid'] is not None else '--'):>6}"
            f"{e.get('confidence', '--'):>9}"
            f"{(e.get('minutes_from_deployment') if e.get('minutes_from_deployment') is not None else '--'):>7}"
            f"{(e.get('dist_to_track_m') if e.get('dist_to_track_m') is not None else '--'):>8}"
            f"  {e['match']:<9}"
        )
    if unmatched:
        print(
            f"\n  {unmatched} unmatched — rename each to 'load-<OBJECTID>-<description>.jpg'"
            "\n  to pin it by hand, then re-run."
        )

    if args.dry_run:
        print("\n--dry-run: nothing written")
        return 0

    payload = {
        "lease_number": "32024",
        "source": str(src.relative_to(ROOT)) if src.is_relative_to(ROOT) else str(src),
        "field_timezone": "America/Chicago",
        "photos": photos,
    }
    MANIFEST.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"\nwrote {MANIFEST.relative_to(ROOT)}  ({len(photos)} entries)")
    print(f"wrote {len(photos)} web copies into {WEB_DIR.relative_to(ROOT)}")
    print("\nnext: fill in alt/caption in the manifest, then re-run bake_lease_save.py")
    return 0


if __name__ == "__main__":
    sys.exit(main())

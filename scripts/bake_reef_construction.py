"""Bake the construction ledger: reef built new vs. reef restored, per year.

Usage:
    python scripts/bake_reef_construction.py [source_dir]
        [--buffer-ft N] [--no-css-prior] [--assume-crs EPSG:XXXX]

source_dir (default ~/Downloads/construction_data) holds one bedding layer
per program year, the year parsed from the file name - bedding_2023.geojson,
bedding-2024.shp, 2025_bedding.gpkg all work; anything geopandas reads, any
CRS. Each layer may be:

  - polygons  - bedding areas already buffered/dissolved in GIS, used as-is
  - lines or points - raw placement tracks; pass --buffer-ft (half-width in
    feet, e.g. --buffer-ft 25) and the buffering happens here, round caps

Method - Jason's GIS workflow, automated:
  1. Buffer (if needed) and dissolve each year's placements into a single
     multipart "bedded" polygon.
  2. "Reef already there" before a year = every earlier year's bedded
     polygon, plus every earlier vintage's surveyed result areas from
     public/data/story/css_tiers.geojson (drop the survey part with
     --no-css-prior).
  3. bedded − prior  →  constructed (brand-new reef area)
     bedded ∩ prior  →  restored   (existing reef re-shelled)
  4. Areas are measured in EPSG:5070 (equal-area over CONUS) and reported
     in acres.

Outputs, written together only after every year bakes clean:
  public/data/story/construction.json     - the numbers the /story ledger
      band reads (ConstructionBars); absent file, absent chart
  public/data/story/construction.geojson  - the constructed/restored
      polygons (WGS84, ~1 m simplified, 5-decimal coords) for a future map
      layer; nothing on the page consumes it yet

Robustness contract:
  - A file that fails to read reports its error and kills the bake before
    anything is written - never a half-written ledger.
  - Line/point layers without --buffer-ft are an error, not a guess.
  - A layer with no CRS is an error unless --assume-crs is given.
  - Geometry is validated (make_valid) before every overlay; a year that
    only restored writes constructed_acres: 0.0 rather than vanishing.

Requires: geopandas, shapely >= 2  (pip install geopandas)
"""

import argparse
import datetime as dt
import json
import os
import re
import sys
from pathlib import Path

import geopandas as gpd
from shapely import make_valid, set_precision, unary_union
from shapely.geometry import Polygon, mapping
from shapely.geometry.base import BaseGeometry

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "data" / "story"
CSS_TIERS = OUT_DIR / "css_tiers.geojson"

EQUAL_AREA = "EPSG:5070"  # CONUS Albers - good across TX, LA, and MD water
WGS84 = "EPSG:4326"
SQM_PER_ACRE = 4046.8564224
FT_TO_M = 0.3048
EXTENSIONS = {".geojson", ".json", ".shp", ".gpkg", ".parquet"}


def fail(msg: str) -> "sys.NoReturn":
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(1)


def acres(geom: BaseGeometry) -> float:
    return round(geom.area / SQM_PER_ACRE, 1)


def polygons_only(geom: BaseGeometry) -> BaseGeometry:
    """Overlays of touching polygons can emit collections with slivers of
    line - keep the parts that have area, drop the rest."""
    if geom.geom_type in ("Polygon", "MultiPolygon"):
        return geom
    if geom.geom_type == "GeometryCollection":
        parts = [g for g in geom.geoms if g.geom_type in ("Polygon", "MultiPolygon")]
        return unary_union(parts) if parts else Polygon()
    return Polygon()


def clean(geom: BaseGeometry) -> BaseGeometry:
    """Valid, polygonal, snapped to centimeter precision."""
    geom = polygons_only(make_valid(geom))
    geom = set_precision(geom, 0.01)
    return polygons_only(make_valid(geom))


def load_year_layer(path: Path, buffer_ft: float | None, assume_crs: str | None) -> BaseGeometry:
    if path.suffix.lower() == ".parquet":
        # pyogrio's bundled GDAL ships without the Parquet driver
        frame = gpd.read_parquet(path)
    else:
        frame = gpd.read_file(path)
    if frame.empty:
        fail(f"{path.name}: layer is empty")
    missing = frame.geometry.isna() | frame.geometry.is_empty
    if missing.all():
        fail(
            f"{path.name}: all {len(frame)} features have null geometry - the export "
            "kept the attributes but dropped the shapes. Re-export with geometry on "
            "(ArcGIS REST query: returnGeometry=true&f=geojson; AGOL item page: "
            "Export > GeoJSON; ArcGIS Pro: Data > Export Features)"
        )
    if missing.any():
        print(f"  note: {path.name}: dropping {int(missing.sum())} of {len(frame)} features with no geometry")
        frame = frame[~missing]
    if frame.crs is None:
        if assume_crs is None:
            fail(f"{path.name}: no CRS on file - pass --assume-crs EPSG:XXXX if you know it")
        frame = frame.set_crs(assume_crs)
    frame = frame.to_crs(EQUAL_AREA)

    # KML/GPS exports wrap tracks in GeometryCollections - split every
    # multi-part so line parts can't slip past the buffer gate below.
    frame = frame.explode(index_parts=False, ignore_index=True)

    kinds = set(frame.geometry.geom_type.unique())
    polygonal = kinds <= {"Polygon", "MultiPolygon"}
    frame["geometry"] = frame.geometry.make_valid()
    if polygonal:
        # make_valid collapses zero-area sliver rings to lines - keep the
        # parts with area so one sliver can't reclassify the layer as tracks
        frame["geometry"] = frame.geometry.apply(polygons_only)
    else:
        if buffer_ft is None:
            fail(
                f"{path.name}: contains {sorted(kinds)} - raw tracks need "
                "--buffer-ft (half-width in feet) to become bedded area"
            )
        # Buffer only the track rows; polygons in a mixed layer stay as-is
        tracks = ~frame.geometry.geom_type.isin(["Polygon", "MultiPolygon"])
        frame.loc[tracks, "geometry"] = frame.geometry[tracks].buffer(buffer_ft * FT_TO_M)

    dissolved = clean(unary_union(frame.geometry.values))
    if dissolved.is_empty:
        fail(f"{path.name}: dissolved to nothing")
    return dissolved


def css_prior_unions() -> dict[int, BaseGeometry]:
    """Surveyed result areas per vintage, from the committed story snapshot."""
    if not CSS_TIERS.exists():
        print(f"  note: {CSS_TIERS.relative_to(ROOT)} not found - prior reef is bedded area only")
        return {}
    frame = gpd.read_file(CSS_TIERS).to_crs(EQUAL_AREA)
    frame["geometry"] = frame.geometry.make_valid()
    out: dict[int, BaseGeometry] = {}
    for year, sub in frame.groupby(frame["year"].astype(int)):
        out[int(year)] = clean(unary_union(sub.geometry.values))
    return out


def to_feature(geom: BaseGeometry, year: int, kind: str) -> dict:
    """WGS84 feature, ~1 m simplified, 5-decimal coords like the other packs."""
    simplified = clean(geom.simplify(1.0))
    wgs = gpd.GeoSeries([simplified], crs=EQUAL_AREA).to_crs(WGS84).iloc[0]
    geo = mapping(wgs)

    def rnd(coords):
        if isinstance(coords[0], (int, float)):
            return [round(coords[0], 5), round(coords[1], 5)]
        return [rnd(c) for c in coords]

    geo = {"type": geo["type"], "coordinates": rnd(geo["coordinates"])}
    return {
        "type": "Feature",
        "properties": {"year": year, "kind": kind, "acres": acres(geom)},
        "geometry": geo,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "source_dir",
        nargs="?",
        default=Path.home() / "Downloads" / "construction_data",
        type=Path,
    )
    parser.add_argument(
        "--buffer-ft",
        type=float,
        default=None,
        help="half-width in feet applied to line/point placement tracks",
    )
    parser.add_argument(
        "--no-css-prior",
        action="store_true",
        help="count only earlier bedded area as prior reef, not surveyed result areas",
    )
    parser.add_argument(
        "--assume-crs",
        default=None,
        help="CRS to assume for layers that ship without one, e.g. EPSG:26915",
    )
    args = parser.parse_args()

    source: Path = args.source_dir.expanduser()
    if not source.is_dir():
        fail(f"source directory not found: {source}")

    by_year_files: dict[int, Path] = {}
    for path in sorted(source.iterdir()):
        if path.suffix.lower() not in EXTENSIONS:
            continue
        match = re.search(r"(20\d\d)", path.stem)
        if not match:
            print(f"  skipping {path.name}: no 4-digit year in the name")
            continue
        year = int(match.group(1))
        if year in by_year_files:
            fail(f"two files claim {year}: {by_year_files[year].name} and {path.name}")
        by_year_files[year] = path
    if not by_year_files:
        fail(f"no bedding layers named with a year found in {source}")

    css_by_year = {} if args.no_css_prior else css_prior_unions()

    print(f"Baking construction ledger from {source}")
    bedded: dict[int, BaseGeometry] = {}
    rows = []
    features = []
    for year in sorted(by_year_files):
        path = by_year_files[year]
        geom = load_year_layer(path, args.buffer_ft, args.assume_crs)
        bedded[year] = geom

        prior_parts = [g for y, g in bedded.items() if y < year]
        prior_parts += [g for y, g in css_by_year.items() if y < year]
        prior = clean(unary_union(prior_parts)) if prior_parts else None

        constructed = clean(geom.difference(prior)) if prior is not None else geom
        restored = clean(geom.intersection(prior)) if prior is not None else geom.difference(geom)

        bedded_ac = acres(geom)
        constructed_ac = acres(constructed)
        rows.append(
            {
                "year": year,
                "bedded_acres": bedded_ac,
                "constructed_acres": constructed_ac,
                # remainder of the rounded figures, so ledger rows always
                # sum; true restored area differs by < 0.1 ac
                "restored_acres": round(bedded_ac - constructed_ac, 1),
            }
        )
        if not constructed.is_empty:
            features.append(to_feature(constructed, year, "constructed"))
        if not restored.is_empty:
            features.append(to_feature(restored, year, "restored"))
        # ASCII only: Windows consoles often decode as cp1252
        print(
            f"  {year} ({path.name}): bedded {rows[-1]['bedded_acres']:,} ac -> "
            f"constructed {rows[-1]['constructed_acres']:,} ac, "
            f"restored {rows[-1]['restored_acres']:,} ac"
        )

    manifest = {
        "generated": dt.date.today().isoformat(),
        "method": (
            "per-year bedding placements buffered and dissolved, then clipped against "
            "prior years' bedded area"
            + ("" if args.no_css_prior else " plus prior vintages' surveyed result areas")
        ),
        "buffer_ft": args.buffer_ft,
        "by_year": rows,
    }

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    outputs = [
        (OUT_DIR / "construction.json", json.dumps(manifest, indent=2) + "\n"),
        (
            OUT_DIR / "construction.geojson",
            json.dumps({"type": "FeatureCollection", "features": features}, separators=(",", ":")),
        ),
    ]
    # Stage beside the targets, then swap both in - a failed bake never
    # leaves a half-written or mismatched pair.
    staged = []
    for path, text in outputs:
        tmp = path.with_suffix(path.suffix + ".tmp")
        tmp.write_text(text, encoding="utf-8")
        staged.append((tmp, path))
    for tmp, path in staged:
        os.replace(tmp, path)
        print(f"Wrote {path}")


if __name__ == "__main__":
    main()

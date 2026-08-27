"""Add a folder of photos to the /story field gallery in one command.

Usage:
    python scripts/add_gallery_photos.py <source_dir>

For every image in source_dir (jpg/jpeg/png/heic), this script:
  1. web-sizes it (EXIF-rotated, max 2000px wide, progressive JPEG)
     into public/images/gallery/<kebab-case-slug>.jpg
  2. appends an entry to public/data/story/gallery.json, using the
     source filename as the first-draft alt text and caption

Filenames ARE the captions, so name files descriptively before running
("crew culling oysters on the sorting table.jpg"). Hand-edits to
existing gallery.json entries are preserved - the script only appends.

Robustness contract:
  - Each entry records its source filename; re-running over the same
    folder skips exactly the files already imported, while a *different*
    photo whose name collides on slug gets a -2/-3 suffix instead of
    being silently dropped.
  - The manifest is written after every successful file, and a file
    that fails to convert (corrupt, truncated, zero-size) is reported
    and skipped without killing the batch - so an interrupted run never
    strands converted images outside the manifest.
  - Transparent PNGs are composited onto white before the JPEG save.

Requires: pillow, pillow-heif  (pip install pillow pillow-heif)
"""

import json
import re
import sys
from pathlib import Path

from PIL import Image, ImageOps
from pillow_heif import register_heif_opener

register_heif_opener()

ROOT = Path(__file__).resolve().parent.parent
GALLERY_DIR = ROOT / "public" / "images" / "gallery"
GALLERY_JSON = ROOT / "public" / "data" / "story" / "gallery.json"
EXTENSIONS = {".jpg", ".jpeg", ".png", ".heic"}
MAX_WIDTH = 2000


def slugify(stem: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", stem.lower()).strip("-")
    return slug or "photo"


def sentence(stem: str) -> str:
    text = re.sub(r"[_-]+", " ", stem).strip()
    text = re.sub(r"\s+", " ", text)
    return (text[:1].upper() + text[1:] + ".") if text else ""


def convert(path: Path, dest: Path) -> tuple[int, int]:
    image = ImageOps.exif_transpose(Image.open(path))
    if image.width < 1 or image.height < 1:
        raise ValueError(f"zero-size image ({image.width}x{image.height})")
    if image.width > MAX_WIDTH:
        image = image.resize(
            (MAX_WIDTH, max(1, round(image.height * MAX_WIDTH / image.width))), Image.LANCZOS
        )
    if "A" in image.getbands():
        # JPEG has no alpha; composite instead of letting convert() go black.
        background = Image.new("RGB", image.size, (255, 255, 255))
        background.paste(image, mask=image.getchannel("A"))
        image = background
    image.convert("RGB").save(dest, "JPEG", quality=84, optimize=True, progressive=True)
    return image.width, image.height


def write_manifest(manifest: dict) -> None:
    GALLERY_JSON.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )


def main() -> None:
    # Windows consoles are UTF-8, but redirected stdout falls back to the
    # ANSI code page and print() would die on a CJK/emoji filename.
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")

    if len(sys.argv) != 2:
        sys.exit(__doc__)
    source = Path(sys.argv[1])
    if not source.is_dir():
        sys.exit(f"not a directory: {source}")

    GALLERY_DIR.mkdir(parents=True, exist_ok=True)
    manifest = (
        json.loads(GALLERY_JSON.read_text(encoding="utf-8"))
        if GALLERY_JSON.exists()
        else {"photos": []}
    )
    photos = manifest.setdefault("photos", [])
    imported_sources = {p.get("source") for p in photos if p.get("source")}
    claimed_srcs = {p.get("src") for p in photos if p.get("src")}

    added = 0
    failed: list[str] = []
    for path in sorted(source.iterdir()):
        if path.suffix.lower() not in EXTENSIONS:
            continue
        if path.name in imported_sources:
            print(f"skip (already imported): {path.name}")
            continue

        # Claim a free slug: a different photo with a colliding name gets
        # a numeric suffix rather than being mistaken for a re-import.
        base = slugify(path.stem)
        slug, n = base, 2
        while f"/images/gallery/{slug}.jpg" in claimed_srcs:
            slug, n = f"{base}-{n}", n + 1
        dest = GALLERY_DIR / f"{slug}.jpg"
        src = f"/images/gallery/{slug}.jpg"

        try:
            width, height = convert(path, dest)
        except Exception as err:  # corrupt/truncated/unsupported - keep going
            failed.append(path.name)
            print(f"FAILED: {path.name}: {err}")
            continue

        caption = sentence(path.stem)
        photos.append(
            {
                "src": src,
                "alt": caption.rstrip("."),
                "caption": caption,
                "width": width,
                "height": height,
                "source": path.name,
            }
        )
        imported_sources.add(path.name)
        claimed_srcs.add(src)
        added += 1
        # Persist per file so a crash never orphans what's already done.
        write_manifest(manifest)
        print(f"added: {path.name}  ->  {dest.name}  ({width}x{height})")

    write_manifest(manifest)
    print(f"\n{added} photo(s) added; gallery now has {len(photos)}.")
    if failed:
        print(f"{len(failed)} file(s) FAILED and were skipped: {', '.join(failed)}")
    if added:
        print("Filename-derived captions are first drafts - polish them in gallery.json.")


if __name__ == "__main__":
    main()

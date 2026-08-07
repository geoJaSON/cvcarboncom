"""Add a folder of photos to the /story field gallery in one command.

Usage:
    python scripts/add_gallery_photos.py <source_dir>

For every image in source_dir (jpg/jpeg/png/heic), this script:
  1. web-sizes it (EXIF-rotated, max 2000px wide, progressive JPEG)
     into public/images/gallery/<kebab-case-slug>.jpg
  2. appends an entry to public/data/story/gallery.json, using the
     source filename as the first-draft alt text and caption

Filenames ARE the captions, so name files descriptively before running
("crew culling oysters on the sorting table.jpg"). Already-imported
photos (same slug) are skipped, and hand-edits to existing gallery.json
entries are preserved — the script only ever appends.

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


def main() -> None:
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
    existing = {photo["src"] for photo in manifest["photos"]}

    added = 0
    for path in sorted(source.iterdir()):
        if path.suffix.lower() not in EXTENSIONS:
            continue
        slug = slugify(path.stem)
        dest = GALLERY_DIR / f"{slug}.jpg"
        src = f"/images/gallery/{slug}.jpg"
        if src in existing or dest.exists():
            print(f"skip (already imported): {path.name}")
            continue

        image = ImageOps.exif_transpose(Image.open(path))
        if image.width > MAX_WIDTH:
            image = image.resize(
                (MAX_WIDTH, round(image.height * MAX_WIDTH / image.width)), Image.LANCZOS
            )
        image.convert("RGB").save(dest, "JPEG", quality=84, optimize=True, progressive=True)

        caption = sentence(path.stem)
        manifest["photos"].append({"src": src, "alt": caption.rstrip("."), "caption": caption})
        existing.add(src)
        added += 1
        print(f"added: {path.name}  ->  {dest.name}  ({image.width}x{image.height})")

    GALLERY_JSON.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(f"\n{added} photo(s) added; gallery now has {len(manifest['photos'])}.")
    if added:
        print("Filename-derived captions are first drafts - polish them in gallery.json.")


if __name__ == "__main__":
    main()

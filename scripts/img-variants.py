"""
Smaller copies of every photograph in public/img, for srcset, and the manifest the site reads them from.

    python scripts/img-variants.py

Run it after adding or replacing a file in public/img, and commit what it writes: public/img/<width>/
and src/content/imgVariants.json. scripts/check-image-variants.mjs fails the build when a photograph
has no entry, so a new one cannot ship at full size by being forgotten.

WHY: every photograph here is about 1024px and the site draws most of them far smaller. The hero
ribbon's standing nine are 180x260 cards, and on a phone the nine originals were 1.1MB of the 2.4MB
Home downloaded before anything else, all of it started ahead of first paint (2026-10-23).

Python and Pillow because this machine has them and the build does not need them: the outputs are
committed, so Vercel never runs this. Pillow's WebP encoder is deterministic for one version, so a
rerun on unchanged inputs rewrites the same bytes.
"""
import json
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "public", "img")
MANIFEST = os.path.join(ROOT, "src", "content", "imgVariants.json")

# 360 and 720 bracket a 180px-wide card at 1x to 4x; 540 is the step a 1.75x phone (Lighthouse's)
# and a 2.625x phone drawing a 260px-tall card land on. Wider than the original is never made.
WIDTHS = (360, 540, 720)
QUALITY = 80


def main():
    manifest = {}
    for name in sorted(os.listdir(SRC)):
        path = os.path.join(SRC, name)
        if not os.path.isfile(path) or not name.lower().endswith((".webp", ".jpg", ".jpeg", ".png")):
            continue
        with Image.open(path) as im:
            w, h = im.size
            made = []
            for target in WIDTHS:
                if target >= w:
                    continue
                out_dir = os.path.join(SRC, str(target))
                os.makedirs(out_dir, exist_ok=True)
                out = os.path.join(out_dir, os.path.splitext(name)[0] + ".webp")
                small = im.convert("RGBA" if im.mode in ("RGBA", "LA", "P") else "RGB").resize(
                    (target, round(h * target / w)), Image.LANCZOS
                )
                small.save(out, "WEBP", quality=QUALITY, method=6)
                made.append(target)
        manifest[name] = {"w": w, "h": h, "widths": made}
    with open(MANIFEST, "w", encoding="utf-8", newline="\n") as f:
        json.dump(manifest, f, indent=2, sort_keys=True)
        f.write("\n")
    print(f"{len(manifest)} photographs, {sum(len(v['widths']) for v in manifest.values())} copies")


if __name__ == "__main__":
    main()

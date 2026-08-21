"""
Placeholder image generation - ONLY used until real Museum photography is
provided (per the plan: real assets are pending from you). Every image this
module produces is visibly stamped "PLACEHOLDER" and logged loudly, so
there's no risk of one silently standing in for real museum photography.

Images have real geometric texture (not a flat color), so ORB actually has
something to find keypoints on - this makes the matching pipeline
meaningfully testable before real photos exist, not just structurally
present.
"""
from __future__ import annotations

import hashlib
import io
import random

from PIL import Image, ImageDraw, ImageFont


def _seed_for(slug: str, variant: int) -> int:
    digest = hashlib.sha256(f"{slug}:{variant}".encode()).hexdigest()
    return int(digest[:8], 16)


def _base_color(slug: str) -> tuple[int, int, int]:
    digest = hashlib.sha256(slug.encode()).hexdigest()
    return (int(digest[0:2], 16), int(digest[2:4], 16), int(digest[4:6], 16))


def generate_placeholder_image(title: str, slug: str, *, variant: int = 0, size=(900, 700)) -> bytes:
    """A deterministic-but-textured placeholder photo standing in for a
    real professional/visitor photo of `title`. `variant` picks a different
    (still deterministic) pattern - use this to generate more than one
    reference photo per piece."""
    rng = random.Random(_seed_for(slug, variant))
    base = _base_color(slug)

    img = Image.new("RGB", size, color=base)
    draw = ImageDraw.Draw(img)

    # Deterministic geometric texture so ORB has real corners/edges to find.
    for _ in range(120):
        shape = rng.choice(["rect", "ellipse", "line"])
        x0, y0 = rng.randint(0, size[0]), rng.randint(0, size[1])
        x1, y1 = rng.randint(0, size[0]), rng.randint(0, size[1])
        color = tuple(min(255, max(0, c + rng.randint(-80, 80))) for c in base)
        box = [min(x0, x1), min(y0, y1), max(x0, x1), max(y0, y1)]
        if box[0] == box[2]:
            box[2] += 1
        if box[1] == box[3]:
            box[3] += 1
        if shape == "rect":
            draw.rectangle(box, outline=color, width=rng.randint(1, 4))
        elif shape == "ellipse":
            draw.ellipse(box, outline=color, width=rng.randint(1, 4))
        else:
            draw.line([x0, y0, x1, y1], fill=color, width=rng.randint(1, 3))

    label = f"PLACEHOLDER\n{title}\n(no real photo yet)"
    try:
        font = ImageFont.load_default(size=28)
    except TypeError:  # Pillow < 10.1 doesn't support the size kwarg here
        font = ImageFont.load_default()
    draw.multiline_text((30, 30), label, fill=(255, 255, 255), font=font, stroke_width=2, stroke_fill=(0, 0, 0))

    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=92)
    return buf.getvalue()

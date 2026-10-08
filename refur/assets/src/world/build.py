#!/usr/bin/env python3
"""Rebuild every REFUR world sprite at native resolution, then 3x nearest.

    python3 refur/assets/src/world/build.py
    python3 refur/assets/src/world/build.py spire engine crops

Sprites land in refur/assets/img/. The contact sheet is refur/assets/preview_world.png.
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]  # refur/assets
IMG = ROOT / "img"
SCALE = 3

sys.path.insert(0, str(Path(__file__).resolve().parent))


def save_native(sprite, name):
    path = IMG / name
    path.parent.mkdir(parents=True, exist_ok=True)
    sprite.save(path, scale=SCALE)
    im = Image.open(path)
    print(f"{name:24} native {sprite.w:4}x{sprite.h:<4}  file {im.size[0]}x{im.size[1]}  {im.mode}")
    return path


def build_spire():
    from spire import native
    save_native(native(), "spire.png")


def build_engine():
    from engine import frames
    for i, spr in enumerate(frames()):
        save_native(spr, f"engine_{i}.png")


def build_crops():
    from crops import all_crops
    for name, spr in all_crops():
        save_native(spr, name)


def build_grazers():
    from grazers import all_grazers
    for name, spr in all_grazers():
        save_native(spr, name)


def build_keeper():
    from keeper import all_keepers
    for name, spr in all_keepers():
        save_native(spr, name)


def build_sky():
    from sky import native

    spr = native()
    path = IMG / "bg_sky.png"
    path.parent.mkdir(parents=True, exist_ok=True)
    im = spr.image(SCALE).convert("RGB")
    im.save(path)
    print(f"{'bg_sky.png':24} native {spr.w:4}x{spr.h:<4}  file {im.size[0]}x{im.size[1]}  {im.mode}")


def build_logo():
    from logo import native
    save_native(native(), "title_logo.png")


def build_preview():
    from preview import build
    path = ROOT / "preview_world.png"
    build(IMG, path)
    print(f"{'preview_world.png':24} {path}")


GROUPS = {
    "spire": build_spire,
    "engine": build_engine,
    "crops": build_crops,
    "grazers": build_grazers,
    "keeper": build_keeper,
    "sky": build_sky,
    "logo": build_logo,
    "preview": build_preview,
}


def main(argv):
    names = argv or ["spire", "engine", "crops", "grazers", "keeper", "sky", "logo", "preview"]
    for name in names:
        if name not in GROUPS:
            raise SystemExit(f"unknown group {name!r}; choose from {', '.join(GROUPS)}")
        GROUPS[name]()


if __name__ == "__main__":
    main(sys.argv[1:])

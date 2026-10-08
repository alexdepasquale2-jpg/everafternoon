"""Write REFUR card, Wag and UI sprites.

Run from anywhere:

    python3 refur/assets/src/ui/build.py

Joystick layout
---------------
ui_joystick.png is a horizontal two-cell sprite, not a single assembled
control.

    native 96×48, file 288×144, nearest-neighbour ×3
    left  48×48  base ring, transparent center
    right 48×48  knob, centered in the cell

Blit both cells at the same origin for the rest pose (the knob sits in
the hole). Shift only the right cell to deflect the stick.
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))

from card_frame import WELL_INNER, card_frame  # noqa: E402
from controls import ui_btn_a, ui_btn_b, ui_btn_c, ui_btn_d, ui_joystick  # noqa: E402
from icons import ui_chip, ui_gold, ui_leaf  # noqa: E402
from palette import CREAM, INK, WELL  # noqa: E402
from preview import build_sheet  # noqa: E402
from suits import SUITS  # noqa: E402
from wags import render_all  # noqa: E402

SCALE = 3
ASSETS = Path(__file__).resolve().parents[2]
IMG = ASSETS / "img"
PREVIEW = ASSETS / "preview_ui.png"


def _save(pix, path: Path) -> Image.Image:
    im = pix.image(SCALE)
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, "PNG", optimize=True)
    return im


def _assert_nearest(im: Image.Image, factor=SCALE):
    a = np.array(im)
    h, w = a.shape[:2]
    if h % factor or w % factor:
        raise SystemExit(f"size {w}x{h} is not a ×{factor} scale")
    # Spot-check blocks. Full scan is cheap at these sizes.
    for y in range(0, h, factor):
        for x in range(0, w, factor):
            block = a[y : y + factor, x : x + factor]
            if not np.all(block == block[0, 0]):
                raise SystemExit(f"pixel not constant in {factor}×{factor} block at {x},{y}")


def _assert_alpha(im: Image.Image, what: str):
    a = np.array(im)
    if a.shape[2] != 4:
        raise SystemExit(f"{what} is not RGBA")
    if not np.any(a[:, :, 3] == 0):
        raise SystemExit(f"{what} has no transparent pixels")
    if not np.any(a[:, :, 3] == 255):
        raise SystemExit(f"{what} has no opaque pixels")


def _ink_count(pix) -> int:
    ink = np.array(INK, dtype=np.uint8)
    return int(np.all(pix.a == ink, axis=2).sum())


def main():
    images = {}

    frame = card_frame()
    images["card_frame"] = _save(frame, IMG / "card_frame.png")

    # Corners of the rounded card stay transparent. Index pads are flat cream.
    if frame.a[0, 0, 3] != 0:
        raise SystemExit("card corner should be transparent")
    pad = frame.a[4:14, 4:14]
    cream = np.array(CREAM, dtype=np.uint8)
    if not np.all(pad == cream):
        raise SystemExit("top-left index pad is not flat cream")
    ix, iy, iw, ih = WELL_INNER
    well = frame.a[iy + 2 : iy + ih - 2, ix + 2 : ix + iw - 2]
    well_c = np.array(WELL, dtype=np.uint8)
    if well.size == 0 or not np.all(well == well_c):
        raise SystemExit("portrait well is not an empty flat field")

    for name, fn in SUITS.items():
        pix = fn()
        images[name] = _save(pix, IMG / f"{name}.png")
        if pix.w != 16 or pix.h != 16:
            raise SystemExit(f"{name} native {pix.w}x{pix.h}, expected 16x16")

    for name, _title, pix in render_all():
        images[name] = _save(pix, IMG / f"{name}.png")
        if (pix.w, pix.h) != (40, 56):
            raise SystemExit(f"{name} native size {pix.w}x{pix.h}")
        if _ink_count(pix) < 40:
            raise SystemExit(f"{name} is missing its ink outline")

    joy = ui_joystick()
    images["ui_joystick"] = _save(joy, IMG / "ui_joystick.png")
    if (joy.w, joy.h) != (96, 48):
        raise SystemExit(f"joystick native {joy.w}x{joy.h}")
    # Left hole is open. Right knob center is opaque.
    if joy.a[24, 24, 3] != 0:
        raise SystemExit("joystick ring center should be transparent")
    if joy.a[24, 24 + 48, 3] == 0:
        raise SystemExit("joystick knob center should be opaque")

    for name, fn in (
        ("ui_btn_a", ui_btn_a),
        ("ui_btn_b", ui_btn_b),
        ("ui_btn_c", ui_btn_c),
        ("ui_btn_d", ui_btn_d),
    ):
        pix = fn()
        images[name] = _save(pix, IMG / f"{name}.png")
        if (pix.w, pix.h) != (24, 24):
            raise SystemExit(f"{name} native {pix.w}x{pix.h}")

    for name, fn in (("ui_chip", ui_chip), ("ui_gold", ui_gold), ("ui_leaf", ui_leaf)):
        pix = fn()
        images[name] = _save(pix, IMG / f"{name}.png")
        if (pix.w, pix.h) != (16, 16):
            raise SystemExit(f"{name} native {pix.w}x{pix.h}")

    # Assembled joystick poses for the contact sheet (not saved as game art).
    cell = 48 * SCALE
    base = images["ui_joystick"].crop((0, 0, cell, cell))
    knob = images["ui_joystick"].crop((cell, 0, cell * 2, cell))

    def _pose(dx, dy):
        canvas = Image.new("RGBA", (cell + 48, cell + 48), (0, 0, 0, 0))
        canvas.alpha_composite(base, (24, 24))
        canvas.alpha_composite(knob, (24 + dx * SCALE, 24 + dy * SCALE))
        return canvas

    sheet = build_sheet(images, _pose(0, 0), _pose(6, 4))
    sheet.save(PREVIEW, "PNG", optimize=True)

    expected = {
        "card_frame": (120, 168),
        "suit_h": (48, 48),
        "suit_s": (48, 48),
        "suit_d": (48, 48),
        "suit_c": (48, 48),
        "ui_joystick": (288, 144),
        "ui_btn_a": (72, 72),
        "ui_btn_b": (72, 72),
        "ui_btn_c": (72, 72),
        "ui_btn_d": (72, 72),
        "ui_chip": (48, 48),
        "ui_gold": (48, 48),
        "ui_leaf": (48, 48),
    }
    for i in range(1, 13):
        expected[f"wag_{i}"] = (120, 168)

    print(f"{'file':<20} {'native':>10} {'file px':>12}")
    for name, (fw, fh) in expected.items():
        im = images[name]
        if im.size != (fw, fh):
            raise SystemExit(f"{name} file size {im.size}, expected {(fw, fh)}")
        _assert_nearest(im)
        _assert_alpha(im, name)
        nw, nh = fw // SCALE, fh // SCALE
        print(f"{name + '.png':<20} {nw:>4}x{nh:<4} {fw:>5}x{fh:<4}")

    print(f"preview {PREVIEW} {sheet.size[0]}x{sheet.size[1]}")


if __name__ == "__main__":
    main()

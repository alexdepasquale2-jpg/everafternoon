"""REFUR wordmark. Chunky pixel letters, a brass gear, motley, two bells.

Drawn at native resolution. build.py scales it 3x nearest-neighbour.
"""

from __future__ import annotations

import math

import numpy as np

from draw import Sprite
from palette import (
    BRA,
    BRA_DK,
    BRA_HI,
    BRA_LT,
    CRE_HI,
    MAG,
    MAG_DK,
    MAG_LT,
    OUT,
    TEA,
    TEA_DK,
    TEA_HI,
    TEA_LT,
)

# One cell of the bitmap becomes SCALE native pixels. Chunky on purpose.
SCALE = 3

_R = [
    "######.",
    "##...##",
    "##...##",
    "######.",
    "##.##..",
    "##..##.",
    "##...##",
    "##...##",
]
_E = [
    "######",
    "##....",
    "##....",
    "#####.",
    "##....",
    "##....",
    "##....",
    "######",
]
_F = [
    "######",
    "##....",
    "##....",
    "#####.",
    "##....",
    "##....",
    "##....",
    "##....",
]
_U = [
    "##..##",
    "##..##",
    "##..##",
    "##..##",
    "##..##",
    "##..##",
    "##..##",
    ".####.",
]
# The E and F bitmaps are 8 rows with a blank-ish last row on F so the
# baseline matches. U's last row is empty so the curve sits on the baseline.
WORD = [("R", _R), ("E", _E), ("F", _F), ("U", _U), ("R", _R)]


def _gear(s, cx, cy, r_tooth, r_root, teeth, phase=0.2):
    r_tooth = int(r_tooth)
    for y in range(cy - r_tooth - 1, cy + r_tooth + 2):
        for x in range(cx - r_tooth - 1, cx + r_tooth + 2):
            dx, dy = x - cx, y - cy
            d = math.hypot(dx, dy)
            if d > r_tooth:
                continue
            ang = math.atan2(dy, dx) + phase
            frac = (ang * teeth) / (2 * math.pi)
            frac -= math.floor(frac)
            limit = r_tooth if frac < 0.38 else r_root
            if d > limit or d < r_tooth * 0.28:
                continue
            light = -(dx * 0.8 + dy) / r_tooth
            if light > 0.5:
                c = BRA_HI
            elif light > 0.0:
                c = BRA_LT
            elif light > -0.45:
                c = BRA
            else:
                c = BRA_DK
            s.p(x, y, c)


def _bell(s, cx, cy):
    s.shaded_ellipse(cx, cy, 4, 5, BRA_HI, BRA_LT, BRA, BRA_DK)
    s.line(cx, cy - 1, cx, cy + 3, BRA_DK)
    s.p(cx, cy - 4, BRA_HI)
    s.disc(cx, cy - 6, 1, BRA_LT)


def _layout(ox, oy):
    cursor = ox
    boxes = []
    for _ch, rows in WORD:
        w = len(rows[0]) * SCALE
        h = len(rows) * SCALE
        boxes.append((cursor, oy, cursor + w, oy + h))
        cursor += w + SCALE
    return boxes


def _paint_word(s, ox, oy):
    """Letters with their own 1px outline so they read on top of the gear."""
    mask = np.zeros((s.h, s.w), dtype=bool)
    cursor = ox
    spans = []
    for _ch, rows in WORD:
        w = len(rows[0]) * SCALE
        h = len(rows) * SCALE
        spans.append((cursor, cursor + w))
        for j, row in enumerate(rows):
            for i, ch in enumerate(row):
                if ch != "#":
                    continue
                for dy in range(SCALE):
                    for dx in range(SCALE):
                        x = cursor + i * SCALE + dx
                        y = oy + j * SCALE + dy
                        if 0 <= x < s.w and 0 <= y < s.h:
                            mask[y, x] = True
        cursor += w + SCALE
    # color, then a 1px ink rim wherever a letter meets non-letter
    width = max(1, cursor - ox)
    for y, x in zip(*np.where(mask)):
        t = (x - ox) / width
        above = y > 0 and mask[y - 1, x]
        left = x > 0 and mask[y, x - 1]
        if not above and not left:
            c = CRE_HI
        elif t < 0.42:
            c = TEA_LT if not above else TEA
        elif t > 0.58:
            c = MAG_LT if not above else MAG
        else:
            c = TEA_LT if x % (SCALE * 2) < SCALE else MAG_LT
        s.p(x, y, c)
    inked = mask.copy()
    h, w = mask.shape
    for y, x in zip(*np.where(mask)):
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= nx < w and 0 <= ny < h and not mask[ny, nx]:
                s.p(nx, ny, OUT)
                inked[ny, nx] = True
    return ox, oy, cursor, oy + 8 * SCALE


def native() -> Sprite:
    s = Sprite(220, 120)
    boxes = _layout(28, 42)
    x0 = boxes[0][0]
    x1 = boxes[-1][2]
    mid = (x0 + x1) // 2
    top = boxes[0][1]
    _gear(s, mid, 60, 54, 42, 14, phase=0.35)
    # horns grow out of the two R's
    lx = (boxes[0][0] + boxes[0][2]) // 2
    rx = (boxes[-1][0] + boxes[-1][2]) // 2
    s.thick_line(lx, top + 4, lx - 18, top - 22, TEA_DK, r=3)
    s.thick_line(lx, top + 4, lx - 18, top - 22, TEA, r=2)
    s.line(lx - 1, top + 2, lx - 19, top - 22, TEA_HI)
    s.thick_line(rx, top + 4, rx + 18, top - 22, MAG_DK, r=3)
    s.thick_line(rx, top + 4, rx + 18, top - 22, MAG, r=2)
    s.line(rx + 1, top + 2, rx + 19, top - 22, MAG_LT)
    _bell(s, lx - 20, top - 24)
    _bell(s, rx + 20, top - 24)
    _paint_word(s, 28, 42)
    # motley collar under the word
    base = boxes[0][3] + 4
    for i, x in enumerate(range(x0, x1 - 8, 8)):
        c = TEA if i % 2 == 0 else MAG
        s.polygon([(x, base), (x + 4, base + 8), (x + 8, base)], c)
    s.outline()
    return s.crop(2)


if __name__ == "__main__":
    img = native()
    img.save("/tmp/logo_x3.png", scale=3)
    print(img.w, img.h)

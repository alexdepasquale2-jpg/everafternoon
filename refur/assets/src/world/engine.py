"""Tithe Engine: brass gear automaton, jester motley, coin-slot mouth.

engine_0 idle, engine_1 clack (jaw dropped, cheek gears turned).
"""

from __future__ import annotations

import math

from draw import Sprite
from palette import (
    BRA,
    BRA_DK,
    BRA_HI,
    BRA_LT,
    CRE,
    CRE_HI,
    MAG,
    MAG_DK,
    MAG_LT,
    OUT,
    PEACH,
    PEACH_PALE,
    TEA,
    TEA_DK,
    TEA_HI,
    TEA_LT,
    VOI,
    VOI_LT,
    WHE_HI,
)

W, H = 88, 108


def _gear(s, cx, cy, r_tooth, r_root, teeth, phase, hole=0):
    r_tooth = int(r_tooth)
    for y in range(cy - r_tooth - 1, cy + r_tooth + 2):
        for x in range(cx - r_tooth - 1, cx + r_tooth + 2):
            dx = x - cx
            dy = y - cy
            d = math.hypot(dx, dy)
            if d > r_tooth or d < hole:
                continue
            ang = math.atan2(dy, dx) + phase
            frac = (ang * teeth) / (2 * math.pi)
            frac -= math.floor(frac)
            limit = r_tooth if frac < 0.42 else r_root
            if not (hole <= d <= limit):
                continue
            light = -(dx * 0.9 + dy * 1.1) / r_tooth
            if light > 0.55:
                c = BRA_HI
            elif light > 0.05:
                c = BRA_LT
            elif light > -0.45:
                c = BRA
            else:
                c = BRA_DK
            s.p(x, y, c)


def _bell(s, cx, cy, r=4):
    s.shaded_ellipse(cx, cy + 1, r, r + 1, BRA_HI, BRA_LT, BRA, BRA_DK)
    s.p(cx, cy - r + 1, BRA_HI)
    s.line(cx, cy - 1, cx, cy + r - 1, BRA_DK)
    s.p(cx, cy + 1, VOI_LT)


def _horn(s, x0, y0, x1, y1, color, dark, lit):
    s.thick_line(x0, y0, x1, y1, dark, r=3)
    s.thick_line(x0, y0, x1, y1, color, r=2)
    # lit edge along the top-left of the horn
    s.line(x0 - 1, y0, x1 - 1, y1, lit)


def draw(clack=False) -> Sprite:
    s = Sprite(W, H)
    phase = 0.55 if clack else 0.0
    bell_nudge = 1 if clack else 0

    # cheek gears sit behind the face
    _gear(s, 26, 58, 16, 12, 8, phase)
    _gear(s, 62, 58, 16, 12, 8, phase + 0.15)

    # cabinet
    for y in range(70, 96):
        t = (y - 70) / 26
        half = int(22 + t * 6)
        for x in range(44 - half, 44 + half):
            light = (44 - x) / half
            if y > 92:
                c = BRA_DK
            elif light > 0.45:
                c = BRA_HI if y < 74 else BRA_LT
            elif light > -0.15:
                c = BRA_LT if y < 78 else BRA
            else:
                c = BRA_DK
            s.p(x, y, c)
    # recessed count-window
    s.rect(36, 78, 16, 8, BRA_DK)
    s.rect(37, 79, 14, 6, VOI)
    for i, x in enumerate((39, 42, 45, 48)):
        s.line(x, 80, x, 83, TEA_LT if i == 2 else TEA_DK)
    s.p(46, 81, TEA_HI)

    # coin tray
    s.ellipse(44, 98, 16, 5, BRA_DK)
    s.ellipse(44, 97, 14, 4, BRA)
    s.ellipse(42, 96, 8, 2, BRA_LT)

    # gear feet
    _gear(s, 28, 100, 7, 5, 6, phase)
    _gear(s, 60, 100, 7, 5, 6, -phase)

    # collar of motley diamonds
    for i, x in enumerate(range(24, 64, 6)):
        c = TEA if i % 2 == 0 else MAG
        d = TEA_DK if i % 2 == 0 else MAG_DK
        s.polygon([(x, 68), (x + 3, 74), (x + 6, 68)], c)
        s.p(x + 3, 73, d)

    # face plate
    s.shaded_ellipse(44, 52, 18, 16, CRE_HI, PEACH_PALE, PEACH, BRA_DK, bias=0.15)
    # motley cap pulled down over the brow, split teal / magenta
    for y in range(34, 48):
        for x in range(26, 63):
            dx = (x - 44) / 18
            dy = (y - 46) / 18
            if dx * dx + dy * dy > 1:
                continue
            if x < 44:
                s.p(x, y, TEA_LT if x < 32 or y < 38 else TEA)
            else:
                s.p(x, y, MAG_LT if x > 56 or y < 38 else MAG)
    # zigzag seam
    for i, y in enumerate(range(36, 48)):
        x = 43 + (1 if i % 2 == 0 else -1)
        s.p(x, y, CRE_HI)

    # horns and bells
    _horn(s, 34, 40, 22, 18 + bell_nudge, TEA, TEA_DK, TEA_HI)
    _horn(s, 54, 40, 66, 18 - bell_nudge, MAG, MAG_DK, MAG_LT)
    _bell(s, 20, 16 + bell_nudge)
    _bell(s, 68, 15 - bell_nudge)
    # bell caps
    s.disc(20, 12 + bell_nudge, 2, BRA_LT)
    s.disc(68, 11 - bell_nudge, 2, BRA_LT)

    # eyes, rivet-bright, a little pleased
    for ex in (36, 52):
        s.ellipse(ex, 52, 3.4, 4.2, OUT)
        s.ellipse(ex, 52, 2.2, 3.0, VOI_LT)
        s.p(ex - 1, 51, CRE_HI)
        s.p(ex, 53, TEA_LT if ex < 44 else MAG_LT)

    # coin-slot mouth
    if not clack:
        s.rect(33, 60, 22, 5, BRA_DK)
        s.rect(35, 61, 18, 3, BRA)
        s.rect(37, 62, 14, 1, VOI)
        s.p(40, 62, BRA_HI)  # a coin waiting in the slot
    else:
        s.rect(33, 59, 22, 3, BRA_LT)  # upper lip, still
        s.rect(35, 62, 18, 8, VOI)  # open throat
        s.rect(36, 63, 16, 6, VOI_LT)
        s.rect(41, 64, 5, 3, BRA_HI)  # coin caught mid-clack
        # dropped jaw
        s.ellipse(44, 73, 12, 5, BRA_DK)
        s.ellipse(44, 72, 11, 4, BRA)
        s.ellipse(42, 71, 6, 2, BRA_LT)
        s.line(34, 72, 54, 72, OUT)

    s.outline()
    return s


def frames():
    """Both frames share one crop so the clack doesn't jump."""
    raw = [draw(False), draw(True)]
    import numpy as np

    boxes = []
    for s in raw:
        ys, xs = np.where(s.px[:, :, 3] > 0)
        boxes.append((int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())))
    w, h = raw[0].w, raw[0].h
    x0 = max(0, min(b[0] for b in boxes) - 1)
    y0 = max(0, min(b[1] for b in boxes) - 1)
    x1 = min(w, max(b[2] for b in boxes) + 2)
    y1 = min(h, max(b[3] for b in boxes) + 2)
    out = []
    for s in raw:
        c = Sprite(x1 - x0, y1 - y0)
        c.px[:] = s.px[y0:y1, x0:x1]
        out.append(c)
    return out


if __name__ == "__main__":
    a, b = frames()
    sheet = Sprite(a.w * 2 + 8, a.h)
    sheet.blit(a, 0, 0)
    sheet.blit(b, a.w + 8, 0)
    sheet.save("/tmp/engine_x4.png", scale=4)
    print(a.w, a.h)

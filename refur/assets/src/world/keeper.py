"""The Keeper. Cloaked farmer-scholar with a lantern.

Four isometric facings (n, e, s, w), two walk frames each.
West is the east pose mirrored so the lantern stays in the forward hand.
"""

from __future__ import annotations

import numpy as np

from draw import Sprite
from grazers import _fit_pair
from palette import (
    BRA,
    BRA_DK,
    BRA_HI,
    BRA_LT,
    CRE,
    CRE_HI,
    OUT,
    PEACH,
    PEACH_PALE,
    PLU,
    PLU_DK,
    PLU_HI,
    PLU_LT,
    SOI,
    SOI_DK,
    SOI_LT,
    TER,
    TER_DK,
    VOI,
    VOI_LT,
    WHE,
    WHE_HI,
    WHE_LT,
)


def _lantern(s, x, y):
    s.line(x + 3, y, x + 3, y + 3, BRA_DK)
    s.rect(x + 1, y + 2, 5, 2, BRA_LT)
    s.rect(x, y + 4, 7, 8, BRA_DK)
    s.rect(x + 1, y + 5, 5, 6, BRA)
    s.rect(x + 2, y + 6, 3, 4, WHE_HI)
    s.p(x + 3, y + 7, CRE_HI)
    s.p(x + 2, y + 6, PEACH_PALE)
    # a little spill of light
    s.p(x - 1, y + 8, PEACH)
    s.p(x + 7, y + 9, PEACH)


def _boots(s, x, y, frame, facing_right=True):
    """Two boots. Frame swaps which one reaches."""
    if frame == 0:
        back, front = (-4, 0), (3, 1)
    else:
        back, front = (-2, 1), (5, 0)
    if not facing_right:
        back = (-back[0], back[1])
        front = (-front[0], front[1])
    s.ellipse(x + back[0], y - back[1], 3, 2, SOI_DK)
    s.ellipse(x + front[0], y - front[1], 3, 2, SOI)
    s.p(x + front[0] - 1, y - front[1] - 1, SOI_LT)


def south(frame) -> Sprite:
    s = Sprite(48, 56)
    bob = frame
    y = bob
    # cloak
    s.polygon(
        [(24, 16 + y), (12, 22 + y), (10, 42 + y), (16, 46 + y), (24, 42 + y), (32, 46 + y), (38, 42 + y), (36, 22 + y)],
        PLU,
    )
    s.polygon([(24, 18 + y), (16, 24 + y), (18, 40 + y), (24, 38 + y)], PLU_LT)
    # lining
    s.line(24, 22 + y, 24, 40 + y, TER)
    # hood
    s.shaded_ellipse(24, 16 + y, 8, 7, PLU_HI, PLU_LT, PLU, PLU_DK)
    # face in the hood's shadow, one lit cheek
    s.ellipse(24, 18 + y, 4, 3, VOI_LT)
    s.p(22, 17 + y, PEACH)
    s.p(21, 17 + y, WHE_HI)
    s.p(26, 17 + y, WHE_LT)
    # rope belt and a seed pouch
    s.line(16, 32 + y, 32, 32 + y, WHE)
    s.rect(28, 33 + y, 4, 4, SOI)
    s.p(29, 34 + y, WHE_LT)
    _boots(s, 24, 48, frame, facing_right=True)
    # lantern in the left hand (screen-left, the lit side), bobbing opposite the stride
    ly = 26 + (0 if frame else 1)
    _lantern(s, 6, ly)
    s.thick_line(14, 28 + y, 12, ly + 6, PLU_LT, r=1)
    s.outline()
    return s


def north(frame) -> Sprite:
    s = Sprite(48, 56)
    y = frame
    s.polygon(
        [(24, 14 + y), (12, 22 + y), (11, 44 + y), (18, 47 + y), (30, 47 + y), (37, 44 + y), (36, 22 + y)],
        PLU_DK,
    )
    s.polygon([(24, 16 + y), (16, 24 + y), (16, 42 + y), (32, 42 + y), (32, 24 + y)], PLU)
    s.line(24, 18 + y, 24, 42 + y, PLU_LT)  # back seam
    # hood from behind
    s.shaded_ellipse(24, 15 + y, 8, 6, PLU_HI, PLU_LT, PLU, PLU_DK)
    # satchel strap
    s.line(16, 20 + y, 30, 36 + y, SOI_DK)
    s.rect(28, 34 + y, 5, 5, SOI)
    s.p(30, 35 + y, CRE)
    _boots(s, 24, 49, frame, facing_right=True)
    ly = 28 + (1 if frame else 0)
    _lantern(s, 34, ly)
    s.thick_line(32, 30 + y, 36, ly + 6, PLU_LT, r=1)
    s.outline()
    return s


def east(frame) -> Sprite:
    s = Sprite(48, 56)
    y = frame
    # cloak tail behind (left), body, hood pointing right
    s.polygon(
        [(14, 20 + y), (18, 40 + y), (22, 46 + y), (28, 40 + y), (30, 22 + y), (24, 14 + y)],
        PLU,
    )
    s.line(16, 24 + y, 20, 42 + y, PLU_LT)
    s.shaded_ellipse(26, 16 + y, 7, 6, PLU_HI, PLU_LT, PLU, PLU_DK)
    # profile face
    s.p(30, 16 + y, PEACH)
    s.p(31, 16 + y, PEACH_PALE)
    s.p(29, 15 + y, WHE_HI)
    # belt, pouch behind
    s.line(18, 32 + y, 28, 32 + y, WHE)
    _boots(s, 24, 48, frame, facing_right=True)
    ly = 24 + (0 if frame else 1)
    _lantern(s, 32, ly)
    s.thick_line(28, 26 + y, 34, ly + 6, PEACH, r=1)  # the hand, lit
    s.outline()
    return s


def _flip(s: Sprite) -> Sprite:
    f = Sprite(s.w, s.h)
    f.px[:] = np.ascontiguousarray(s.px[:, ::-1])
    return f


def all_keepers():
    pairs = {
        "s": _fit_pair([south(0), south(1)]),
        "n": _fit_pair([north(0), north(1)]),
        "e": _fit_pair([east(0), east(1)]),
    }
    pairs["w"] = _fit_pair([_flip(east(0)), _flip(east(1))])
    out = []
    for facing in ("n", "e", "s", "w"):
        for frame, spr in enumerate(pairs[facing]):
            out.append((f"keeper_{facing}_{frame}.png", spr))
    return out


if __name__ == "__main__":
    items = all_keepers()
    h = max(s.h for _, s in items)
    w = sum(s.w for _, s in items) + 4 * len(items)
    sheet = Sprite(w, h + 4)
    x = 2
    for name, s in items:
        sheet.blit(s, x, 2)
        x += s.w + 4
        print(name, s.w, s.h)
    sheet.save("/tmp/keeper_x4.png", scale=4)

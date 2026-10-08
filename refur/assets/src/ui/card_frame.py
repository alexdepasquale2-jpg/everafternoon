"""Cream playing-card frame.

Native 40×56. The game draws rank, suit and the crop portrait on top, so:

- All four corners (15×15, inset 2px) are flat cream. No pattern, no rules.
- The portrait window is an empty recessed panel. Its center is a flat well
  color with no texture. Only the lip is shaded, so a crop sits in a frame.

Top-left lighting: highlight on the top and left outline, shadow on the
bottom and right.
"""

from palette import (
    BRASS,
    BRASS_D,
    BRASS_H,
    CREAM,
    CREAM_D,
    CREAM_H,
    INK,
    WELL,
)
from pix import Pix, erode4

W, H = 40, 56

# Flat index pads. Mirrored on all four corners so a rank+suit blit is safe
# even if the hand renderer indexes two corners or four.
PADS = (
    (2, 2, 15, 15),
    (23, 2, 15, 15),
    (2, 39, 15, 15),
    (23, 39, 15, 15),
)

# Portrait window (outer frame includes the brass lip).
WELL_OUTER = (5, 18, 30, 20)  # x, y, w, h  → y 18..37
WELL_INNER = (8, 21, 24, 14)  # flat empty field the crop covers


def _bevel(pix: Pix, interior):
    h, w = interior.shape
    for y in range(h):
        for x in range(w):
            if not interior[y, x]:
                continue
            up = y > 0 and not interior[y - 1, x]
            left = x > 0 and not interior[y, x - 1]
            down = y + 1 < h and not interior[y + 1, x]
            right = x + 1 < w and not interior[y, x + 1]
            if up or left:
                pix.set(x, y, CREAM_H)
            elif down or right:
                pix.set(x, y, CREAM_D)


def _brackets(pix: Pix, x, y, w, h):
    """Bright brass ticks on the lip corners. They never break the ink rule."""
    arm = 3
    for i in range(arm):
        pix.set(x + 1 + i, y + 1, BRASS_H)
        pix.set(x + 1, y + 1 + i, BRASS_H)
        pix.set(x + w - 2 - i, y + 1, BRASS_H)
        pix.set(x + w - 2, y + 1 + i, BRASS)
        pix.set(x + 1 + i, y + h - 2, BRASS_D)
        pix.set(x + 1, y + h - 2 - i, BRASS_D)
        pix.set(x + w - 2 - i, y + h - 2, BRASS_D)
        pix.set(x + w - 2, y + h - 2 - i, BRASS_D)


def card_frame() -> Pix:
    pix = Pix(W, H)
    mask = pix.mask_rounded(4.0)
    interior = erode4(mask)

    for y in range(H):
        for x in range(W):
            if mask[y, x] and not interior[y, x]:
                pix.set(x, y, INK)
            elif interior[y, x]:
                pix.set(x, y, CREAM)

    _bevel(pix, interior)

    # Portrait window. Thin ink rule, brass lip, empty flat well.
    # The lip is shaded like a recess: dark along the top and left.
    ox, oy, ow, oh = WELL_OUTER
    pix.fill_rect(ox, oy, ow, oh, INK)
    pix.fill_rect(ox + 1, oy + 1, ow - 2, oh - 2, BRASS_D)
    pix.fill_rect(ox + 1, oy + 1, ow - 2, 1, BRASS_H)
    pix.fill_rect(ox + 1, oy + 1, 1, oh - 2, BRASS_H)
    ix, iy, iw, ih = ox + 2, oy + 2, ow - 4, oh - 4
    pix.fill_rect(ix, iy, iw, ih, WELL)
    for i in range(iw):
        pix.set(ix + i, iy, CREAM_D)
    for i in range(ih):
        pix.set(ix, iy + i, CREAM_D)
    cx, cy, cw, ch = WELL_INNER
    pix.fill_rect(cx, cy, cw, ch, WELL)
    _brackets(pix, ox, oy, ow, oh)

    # Corner pads last, so nothing decorative survives under rank or suit.
    for x, y, w, h in PADS:
        pix.fill_rect(x, y, w, h, CREAM)

    return pix

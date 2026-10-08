"""Twelve Wag portraits. Native 40×56.

Every card shares a brass rim, teal/magenta motley inlay, a clasp-bell
and three cog teeth: they are the Tithe Engine's cogs. The picture inside
is a different joke for each name.

The game draws any caption itself. These files are the portraits only.
"""

from __future__ import annotations

from palette import (
    BLUE,
    BLUE_D,
    BLUE_H,
    BRASS,
    BRASS_D,
    BRASS_H,
    CREAM,
    CREAM_D,
    CREAM_H,
    GREEN,
    GREEN_D,
    INK,
    LAV,
    LAV_D,
    LAV_H,
    MAG,
    MAG_D,
    MAG_H,
    MOSS,
    MOSS_D,
    MOSS_H,
    PEACH,
    PEACH_D,
    PEACH_H,
    PLUM,
    PLUM_D,
    RED,
    RED_D,
    RED_H,
    RUST,
    RUST_D,
    RUST_H,
    TEAL,
    TEAL_D,
    TEAL_H,
    TERR,
    TERR_D,
    TERR_H,
    WHEAT,
    WHEAT_D,
    WHEAT_H,
    WHITE,
)
from pix import Pix, erode4

W, H = 40, 56


def _dist(interior):
    h, w = interior.shape
    dist = [[-1] * w for _ in range(h)]
    q = []
    for y in range(h):
        for x in range(w):
            if not interior[y, x]:
                dist[y][x] = 0
                q.append((x, y))
    head = 0
    while head < len(q):
        x, y = q[head]
        head += 1
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and dist[ny][nx] < 0:
                dist[ny][nx] = dist[y][x] + 1
                q.append((nx, ny))
    return dist


def _sky(y):
    if y < 33:
        return LAV
    if y < 44:
        return LAV_H
    return PEACH


def _backdrop(pix, interior):
    for y in range(H):
        for x in range(W):
            if interior[y, x]:
                pix.set(x, y, _sky(y))
    for x in range(W):
        if interior[36, x]:
            pix.set(x, 36, LAV_D)
    for y, col in (
        (46, MOSS_H),
        (47, MOSS),
        (48, MOSS_D),
        (49, TERR),
        (50, TERR_D),
        (51, TERR_D),
        (52, PLUM_D),
    ):
        for x in range(W):
            if interior[y, x]:
                pix.set(x, y, col)


def _frame(pix, mask, interior, dist):
    """Brass rim, motley inlay, clasp bell, cog teeth. Stamped last."""
    for y in range(H):
        for x in range(W):
            if mask[y, x] and not interior[y, x]:
                pix.set(x, y, INK)
                continue
            d = dist[y][x]
            if d == 1:
                lit = (y > 0 and not interior[y - 1, x]) or (x > 0 and not interior[y, x - 1])
                pix.set(x, y, BRASS_H if lit else BRASS_D)
            elif d == 2:
                pix.set(x, y, BRASS if (x + y) % 2 == 0 else BRASS_D)
            elif d == 3 and (x < 7 or x > 32):
                band = (y // 3) % 2 == 0
                pix.set(x, y, TEAL if band else MAG)

    # Top and bottom enamel diamonds, sitting on the inner rim.
    for i, cx in enumerate(range(10, 30, 5)):
        col = TEAL_H if i % 2 == 0 else MAG_H
        pix.set(cx, 4, col)
        pix.set(cx, 51, MAG if i % 2 else TEAL)

    # Clasp: a tiny jester bell on the top rim, same on every cog-card.
    _bell(pix, 19, 5, 2)
    # Cog teeth biting the bottom rim.
    for cx in (12, 19, 26):
        pix.fill_rect(cx, 49, 3, 3, INK)
        pix.fill_rect(cx, 49, 2, 2, BRASS_H)
        pix.set(cx + 1, 51, BRASS_D)


def _bell(pix, cx, cy, r):
    pix.disc(cx, cy - r, r, INK)
    pix.disc(cx, cy - r, r - 0.6, TEAL)
    pix.set(cx - 1, cy - r - 1, TEAL_H)
    pix.set(cx - 1, cy - r, WHITE)
    pix.fill_rect(cx - r, cy, r * 2 + 1, 2, INK)
    pix.fill_rect(cx - r + 1, cy, r * 2 - 1, 1, MAG)
    pix.set(cx, cy + 2, BRASS_H)
    pix.set(cx, cy + 3, BRASS_D)



from portraits import (
    wag_almanac,
    wag_backhair,
    wag_bladder,
    wag_fen,
    wag_gnaw,
    wag_habit,
    wag_lathe,
    wag_lean,
    wag_rust,
    wag_scales,
    wag_thumbs,
    wag_winter,
)


def _portrait(draw):
    pix = Pix(W, H)
    mask = pix.mask_rounded(4.0)
    interior = erode4(mask)
    dist = _dist(interior)
    _backdrop(pix, interior)
    draw(pix)
    _frame(pix, mask, interior, dist)
    return pix


BUILDERS = (
    ("wag_1", "Lathe-Tongue", wag_lathe),
    ("wag_2", "Rust Halo", wag_rust),
    ("wag_3", "The Overwinterer", wag_winter),
    ("wag_4", "Habit Coat", wag_habit),
    ("wag_5", "Bladder Gut", wag_bladder),
    ("wag_6", "Wrong Almanac", wag_almanac),
    ("wag_7", "Fen Clock", wag_fen),
    ("wag_8", "Twelve Thumbs", wag_thumbs),
    ("wag_9", "Lean Year", wag_lean),
    ("wag_10", "Scale Memory", wag_scales),
    ("wag_11", "Back-Hair", wag_backhair),
    ("wag_12", "Tithe-Gnaw", wag_gnaw),
)


def render_all():
    out = []
    for name, title, fn in BUILDERS:
        out.append((name, title, _portrait(fn)))
    return out

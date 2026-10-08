"""Suit pips as husk crops. Native 16×16.

Hearts → a heart-shaped sap drop (gloss, drip).
Spades → a quill tip (spade silhouette, feather barbs, pale shaft).
Diamonds → a faceted glintpod crystal.
Clubs → a burdock burr (club silhouette, hooked lobes).

Fills are drawn one pixel inset. A silhouette pass adds the 1px ink outline.
"""

from palette import (
    BLUE,
    BLUE_D,
    BLUE_H,
    BRASS_H,
    CREAM_H,
    INK,
    MOSS,
    MOSS_D,
    MOSS_H,
    PLUM,
    PLUM_D,
    PLUM_H,
    RED,
    RED_D,
    RED_H,
    WHEAT,
    WHEAT_D,
    WHITE,
)
from pix import Pix

N = 16

KEY = {
    "R": RED,
    "r": RED_D,
    "w": RED_H,
    "U": PLUM,
    "u": PLUM_D,
    "i": PLUM_H,
    "C": CREAM_H,
    "H": WHEAT,
    "h": WHEAT_D,
    "N": BLUE,
    "n": BLUE_D,
    "S": BLUE_H,
    "Y": BRASS_H,
    "M": MOSS,
    "m": MOSS_D,
    "G": MOSS_H,
    "O": WHITE,
}


def _rows(art):
    rows = [line for line in art.strip("\n").split("\n")]
    width = len(rows[0])
    for row in rows:
        if len(row) != width:
            raise ValueError(f"row width {len(row)} != {width}: {row!r}")
    return rows


def _silhouette(pix: Pix) -> Pix:
    """1px ink outline on the outside only. Interior gaps stay open."""
    h, w = pix.h, pix.w
    alpha = pix.a[:, :, 3] > 0
    outside = [[False] * w for _ in range(h)]
    stack = []
    for x in range(w):
        stack.append((x, 0))
        stack.append((x, h - 1))
    for y in range(h):
        stack.append((0, y))
        stack.append((w - 1, y))
    while stack:
        x, y = stack.pop()
        if not (0 <= x < w and 0 <= y < h) or outside[y][x] or alpha[y, x]:
            continue
        outside[y][x] = True
        stack.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
    for y in range(h):
        for x in range(w):
            if not outside[y][x]:
                continue
            for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < h and 0 <= nx < w and alpha[ny, nx]:
                    pix.set(x, y, INK)
                    break
    return pix


def _paint(art) -> Pix:
    rows = _rows(art)
    pix = Pix(N, N)
    pix.blit(0, 0, "\n".join(rows), KEY)
    return _silhouette(pix)


def suit_h() -> Pix:
    return _paint(
        """
................
..RRRR...RRRR...
.RRwRRR.RRRRRr..
.RRRRRRRRRRRRr..
.RRRRRRRRRRRRr..
.RRRRRRRRRRRr...
..RRRRRRRRRr....
...RRRRRRRr.....
....RRRRRr......
.....RRRr.......
......Rr........
......Rr........
.......R........
................
................
................
"""
    )


def suit_s() -> Pix:
    # Quill: spade-shaped vane, cream rachis, barb pairs, wheat shaft.
    return _paint(
        """
................
.......UU.......
......UiCU......
.....UiCCUi.....
....UiuCCuiU....
...UiuCCCCuiU...
..UiuCCCCCCuiU..
..UiCCCCCCCCui..
...uCCCCiCCCu...
....uCCCCiCu....
.....uuCCuu.....
......uCCu......
......hCCh......
......hHHh......
.......HH.......
................
"""
    )


def suit_d() -> Pix:
    return _paint(
        """
................
.......YY.......
......YSSY......
.....YSNSYY.....
....YSNNSNYY....
...YSNNONNNYY...
..YSNNNNNNNNYY..
...YNNNNNNNnY...
...YnnnnnnnnY...
....YnnnnnnY....
.....YnnnnY.....
......YnYY......
.......YY.......
................
................
................
"""
    )


def suit_c() -> Pix:
    # One connected burr so the silhouette reads as a club, hooks and all.
    return _paint(
        """
................
...mMM...MMm....
..mGMGM.MGMm....
..mMMMM.MMMMm...
...mMMMmMMM.....
.....MMMMM......
....mMMMMMm.....
....MMGMGMM.....
....mMMMMMm.....
.....mMMMm......
......mHm.......
......HHH.......
.......H........
................
................
................
"""
    )


SUITS = {
    "suit_h": suit_h,
    "suit_s": suit_s,
    "suit_d": suit_d,
    "suit_c": suit_c,
}

"""Top-bar icons. Native 16×16, hand-inked.

ui_chip  — poker-chip rim on a husk scale
ui_gold  — milled brass coin with the Engine's bell
ui_leaf  — serrated compost leaf
"""

from palette import (
    BRASS,
    BRASS_D,
    BRASS_H,
    CREAM,
    CREAM_D,
    INK,
    MOSS,
    MOSS_D,
    MOSS_H,
    PLUM,
    PLUM_D,
    TERR,
    TERR_D,
    TERR_H,
    WHEAT,
    WHEAT_D,
    WHITE,
)
from pix import Pix

N = 16

KEY = {
    "K": INK,
    "C": CREAM,
    "c": CREAM_D,
    "O": WHITE,
    "T": TERR,
    "t": TERR_D,
    "y": TERR_H,
    "U": PLUM,
    "u": PLUM_D,
    "B": BRASS,
    "b": BRASS_D,
    "Y": BRASS_H,
    "H": WHEAT,
    "h": WHEAT_D,
    "M": MOSS,
    "m": MOSS_D,
    "G": MOSS_H,
}


def _paint(art) -> Pix:
    rows = [line for line in art.strip("\n").split("\n")]
    width = len(rows[0])
    for row in rows:
        if len(row) != width:
            raise ValueError(f"row width {len(row)} != {width}: {row!r}")
    pix = Pix(N, N)
    pix.blit(0, 0, "\n".join(rows), KEY)
    return pix


def ui_chip() -> Pix:
    # Notches are part of the inked rim. Center is a scale: ridges and an eye.
    return _paint(
        """
................
.....KKKKKK.....
...KKCyTTyCKK...
..KCyyyyyyyCtK..
.KCyyUUUUUUytCK.
.KyUUUyUUyUUUtyK
.KyUUyyyyyyUUtyK
.KUUUyYOYyUUUtK.
.KUUUyyyyyyUUUtK
.KyUUtUUUUtUUtyK
.KtyUUUUUUUUytCK
.KCtttttttttyCK.
..KCtttttttyCK..
...KKtttttyKK...
.....KKKKKK.....
................
"""
    )


def ui_gold() -> Pix:
    return _paint(
        """
................
.....KKKKKK.....
...KKYBBBBBYKK..
..KYBBBBBBBBbK..
.KYBBBBBBBBBbbYK
.YBBBBYYYBBBbbbY
.YBBBYBKbYBBBbbY
.YBBBYBBBYbbBbbY
.YBBBYbKbYbbBbbY
.YBBBBBBBbbbbbbY
.KbBBBBBBBbbbbYK
.KYbbbbbbbbbbYK.
..KYbbbbbbbbYK..
...KKbbbbbbKK...
.....KKKKKK.....
................
"""
    )


def ui_leaf() -> Pix:
    return _paint(
        """
................
.......KGK......
......KGMGK.....
.....KGMMGmK....
....KGMMMGMm....
...KGMMGMMGmK...
...KGMMtMMGm....
..KGMMMMMGmK....
..KGMMMGMmK.....
..KGMMMGmK......
...KGMGmK.......
...KGmGK........
....KhK.........
...KhK..........
....K...........
................
"""
    )

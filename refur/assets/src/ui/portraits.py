"""Hand-inked Wag pictures. Stamped inside the shared brass frame."""

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
    GREEN_H,
    INK,
    LAV,
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
    PLUM_H,
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

KEY = {
    "K": INK,
    "P": PEACH,
    "p": PEACH_D,
    "q": PEACH_H,
    "E": TEAL,
    "e": TEAL_D,
    "Z": TEAL_H,
    "A": MAG,
    "a": MAG_D,
    "Q": MAG_H,
    "B": BRASS,
    "b": BRASS_D,
    "Y": BRASS_H,
    "R": RED,
    "r": RED_D,
    "w": RED_H,
    "N": BLUE,
    "n": BLUE_D,
    "S": BLUE_H,
    "V": GREEN,
    "g": GREEN_D,
    "f": GREEN_H,
    "M": MOSS,
    "m": MOSS_D,
    "G": MOSS_H,
    "H": WHEAT,
    "h": WHEAT_D,
    "j": WHEAT_H,
    "T": TERR,
    "t": TERR_D,
    "y": TERR_H,
    "C": CREAM,
    "c": CREAM_H,
    "d": CREAM_D,
    "O": WHITE,
    "W": WHITE,
    "X": RUST,
    "x": RUST_D,
    "z": RUST_H,
    "U": PLUM,
    "u": PLUM_D,
    "i": PLUM_H,
    "L": LAV,
    "v": LAV_H,
}


def S(art: str):
    rows = art.strip("\n").split("\n")
    width = len(rows[0])
    for row in rows:
        if len(row) != width:
            raise ValueError(f"stamp width {len(row)} != {width}: {row!r}")
    return "\n".join(rows)


def stamp(pix, x, y, art):
    pix.blit(x, y, S(art) if isinstance(art, str) else art, KEY)


HAT = S(
    """
..ZZ......QQ..
.eEZe....aAQa.
eEEZeE..aAAQaA
.eEEe....AAA..
..YYYYBBBBbb..
.KBBBBBBBBBBbK
"""
)

FACE = S(
    """
.KKKKKKKKKKK.
KqPPPPPPPPPpK
KPWWKPPPPWWPK
KPKWKPPPPKWPK
KPPPPPPPPPPPK
KPPPKKKKKPPPK
KPPCCcCCCPPPK
KPPPPPPPPPPPK
.KPPPPPPPPPK.
..KKKKKKKKK..
....KKKKK....
"""
)

FACE_SHUT = S(
    """
.KKKKKKKKKKK.
KqPPPPPPPPPpK
KPPPPPPPPPPPK
KPPKKKPPKKKPK
KPPPPPPPPPPPK
KPPPPPPPPPPPK
.KPPPKKKPPK..
..KPPPPPPPK..
...KKKKKKK...
....KKKKK....
.............
"""
)

FACE_WORRY = S(
    """
.KKKKKKKKKKK.
KqPPPPPPPPPpK
KKWWKPPPPWWKK
KPKWKPPPPKWPK
KPPPPPPPPPPPK
KPPPPPPPPPPPK
.KPPPPPPPPPK.
..KPKKKKKPK..
...KPPPPPK...
....KKKKK....
.............
"""
)

FACE_SMALL = S(
    """
.KKKKKKKKK.
KqPPPPPPPpK
KPWWKPPWWPK
KPKWKPPKWPK
KPPPPPPPPPK
KPPKKKKKPPK
.KPCCWCCPK.
..KKKKKKK..
...KKKKK...
"""
)

COG = S(
    """
.bYbYb.
bYBBBYb
.BBZBB.
bBBKBBb
.BBBBBb
bYBBBYb
.bYbYb.
"""
)

THUMB = S(
    """
.KKK.
KqPPp
KCCCp
KPPPp
KPPPp
KpPPp
.KKK.
"""
)

THUMB_FLIP = S(
    """
.KKK.
KqPPp
KPPPp
KPPPp
KCCCp
KpPPp
.KKK.
"""
)

CAP = S(
    """
...KKKKKKKKK...
..KZEEEEEEEQK..
.KZEEEEEEAAAQK.
.KEEEEEAAAAAAK.
.KEEEEAAAAAAAK.
..KEEAAAAAAAK..
...KKKKKKKKK...
.........KKKK..
........KQAQK..
.........KKKK..
"""
)

MANE = S(
    """
......KKKK......
.....KCCCCK.....
....KCCOqCCK....
...KCCqqqCCCK...
..KKCCCCCCCKKK..
.KhKCCCCCCKChK..
.KHHKCCCCKCHHK..
.KHHHKCCKCHHHK..
.KhHHHKCKHHHHhK.
..KHHHKKKHHHHhK.
...KHHKKKHHHhK..
..KKHHKKKHHHKK..
.KGhHHKKKHHHGK..
.KGGHHKKKHHGGK..
.KGGhHKKKHhGGK..
..KGGHKKKHGGK...
...KGGKKKGGK....
....KGKKKGK.....
.....KKKKK......
"""
)


def _ink(pix, x, y):
    if not (0 <= x < pix.w and 0 <= y < pix.h):
        return False
    p = pix.a[y, x]
    return int(p[3]) == 255 and int(p[0]) == INK[0] and int(p[1]) == INK[1] and int(p[2]) == INK[2]


def _lathe(pix, x, y, n=7):
    w = n * 2 + 2
    pix.fill_rect(x, y, w, 4, INK)
    pix.fill_rect(x + 1, y + 1, w - 2, 2, BRASS)
    for i in range(n):
        px = x + 2 + i * 2
        pix.set(px, y + 1, BRASS_H)
        pix.set(px, y + 2, BRASS_D)
        pix.set(px, y - 1, INK)
        pix.set(px, y - 2, PLUM)
        pix.set(px - 1, y - 2, PLUM_H)
        pix.set(px, y + 4, INK)
        pix.set(px, y + 5, PLUM)
        pix.set(px + 1, y + 5, PLUM_D)
    pix.disc(x + w - 1, y + 1, 2, INK)
    pix.disc(x + w - 1, y + 1, 1.2, BRASS_H)


def _tunic(pix, x, y, w=14, h=7):
    pix.fill_rect(x, y, w, h, INK)
    pix.fill_rect(x + 1, y + 1, w // 2 - 1, h - 2, TEAL)
    pix.fill_rect(x + w // 2, y + 1, w - w // 2 - 1, h - 2, MAG)
    pix.set(x + 1, y + 1, TEAL_H)
    pix.set(x + w - 2, y + h - 2, MAG_D)
    pix.set(x + w // 2, y + 2, BRASS_H)
    pix.set(x + w // 2, y + 4, BRASS_D)


def _egg(pix, cx, cy, rx, ry, mid, hi, lo):
    pix.ellipse(cx, cy, rx, ry, INK)
    for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
        for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
            vx = (x - cx) / (rx - 1.2)
            vy = (y - cy) / (ry - 1.2)
            if vx * vx + vy * vy <= 1:
                d = (x - cx) + (y - cy)
                if d < -5:
                    pix.set(x, y, hi)
                elif d > 6:
                    pix.set(x, y, lo)
                else:
                    pix.set(x, y, mid)


def wag_lathe(pix):
    stamp(pix, 8, 10, HAT)
    stamp(pix, 9, 16, FACE)
    stamp(pix, 20, 22, COG)
    # Tongue leaves the mouth and runs to the right edge as a lathe.
    _lathe(pix, 20, 25, 6)
    # A curl of swarf off the spindle.
    pix.set(31, 23, WHEAT_H)
    pix.set(32, 22, WHEAT)
    pix.set(32, 24, WHEAT_D)
    _tunic(pix, 8, 36)


def wag_rust(pix):
    cx, cy, r = 20, 16, 9
    pix.disc(cx, cy, r + 1, INK)
    pix.disc(cx, cy, r, RUST_D)
    pix.disc(cx, cy, r - 1, RUST)
    pix.disc(cx - 1, cy - 1, r - 2, RUST_H)
    for y in range(cy - r, cy + r + 1):
        for x in range(cx - r, cx + r + 1):
            if (x - cx) ** 2 + (y - cy) ** 2 <= (r - 4) ** 2:
                pix.set(x, y, _sky_at(y))
    # Gear nubs.
    for x, y in ((cx, cy - r - 1), (cx - r - 1, cy), (cx + r, cy), (cx, cy + r)):
        pix.fill_rect(x - 1, y - 1, 3, 3, INK)
        pix.set(x, y, RUST_H)
    # Crystals and drips.
    for x, y in ((cx, cy - r + 1), (cx - r + 2, cy), (cx + r - 2, cy)):
        pix.set(x, y, BLUE_H)
        pix.set(x, y + 1, BLUE)
        pix.set(x - 1, y, WHITE)
    for x, y in ((cx - 4, cy + r), (cx, cy + r + 1), (cx + 4, cy + r)):
        pix.set(x, y, RUST_H)
        pix.set(x, y + 1, RUST)
        pix.set(x, y + 2, RUST_D)
    # Three gold sparks: the harvest, not a numeral.
    for x, y in ((8, 40), (31, 34), (30, 42)):
        pix.set(x, y, BRASS_H)
        pix.set(x + 1, y, WHEAT)
        pix.set(x, y + 1, BRASS_D)
    stamp(pix, 13, 30, FACE_SHUT)
    stamp(pix, 24, 36, COG)


def wag_winter(pix):
    for x, y in (
        (9, 12), (14, 11), (28, 12), (32, 16), (10, 20),
        (30, 22), (8, 28), (33, 30), (12, 14), (26, 18),
    ):
        pix.set(x, y, WHITE)
        pix.set(x + 1, y, LAV_H)
    stamp(pix, 10, 9, CAP)
    # Eyes in the gap under the cap, above the scarf.
    pix.set(16, 20, WHITE)
    pix.set(17, 20, INK)
    pix.set(16, 21, INK)
    pix.set(22, 20, WHITE)
    pix.set(23, 20, INK)
    pix.set(23, 21, INK)
    pix.fill_rect(12, 22, 16, 4, INK)
    pix.fill_rect(13, 23, 14, 2, WHEAT)
    pix.set(13, 23, WHEAT_H)
    pix.set(26, 24, WHEAT_D)
    # Motley coat.
    pix.round_box(8, 26, 24, 18, 3, TEAL)
    pix.fill_rect(20, 28, 11, 14, MAG)
    pix.line(20, 28, 20, 41, INK)
    pix.set(10, 28, TEAL_H)
    pix.set(29, 40, MAG_D)
    # Mittens and the sprout that refused to die.
    pix.sphere(14, 38, 3, PEACH, PEACH_H, PEACH_D, specular=False)
    pix.sphere(25, 38, 3, PEACH, PEACH_H, PEACH_D, specular=False)
    pix.box(17, 36, 6, 4, TERR)
    pix.set(19, 35, MOSS_D)
    pix.set(20, 34, MOSS)
    pix.set(18, 33, MOSS_H)
    pix.set(21, 33, MOSS)
    pix.set(18, 32, WHITE)
    stamp(pix, 10, 32, COG)


def wag_habit(pix):
    for y in (22, 27, 32):
        pix.set(6, y, CREAM)
        pix.set(7, y, CREAM_H)
        pix.set(8, y, WHITE)
    # Sleeves, flung up.
    pix.round_box(5, 20, 8, 14, 2, TERR)
    pix.round_box(27, 18, 8, 14, 2, TERR)
    pix.fill_rect(6, 31, 5, 3, TERR_D)
    pix.fill_rect(7, 32, 3, 2, LAV)
    pix.fill_rect(29, 29, 5, 3, TERR_D)
    pix.fill_rect(30, 30, 3, 2, LAV_H)
    pix.round_box(10, 24, 20, 20, 3, TERR)
    pix.set(12, 26, TERR_H)
    pix.line(15, 26, 13, 40, CREAM_D)
    pix.line(24, 26, 26, 40, CREAM)
    for yy in (30, 34, 38):
        pix.set(14, yy, CREAM)
        pix.set(25, yy, CREAM_D)
    pix.fill_rect(12, 32, 4, 3, TEAL)
    pix.set(12, 32, TEAL_H)
    # Hollow neck. Nobody is in the suit.
    pix.ellipse(20, 23, 5, 3.2, INK)
    pix.ellipse(20, 23, 3.4, 2.0, LAV)
    pix.set(18, 22, LAV_H)
    _bell_local(pix, 20, 16)
    # Blank name-tag.
    pix.box(15, 33, 8, 6, CREAM)
    pix.line(16, 35, 21, 35, CREAM_D)
    pix.line(16, 37, 20, 37, CREAM_D)
    stamp(pix, 27, 36, COG)


def _bell_local(pix, cx, cy):
    pix.blit(
        cx - 3,
        cy - 3,
        S(
            """
..QK..
.ZEEK.
ZEEEeK
KAAAKa
.KYBK.
..Kb..
"""
        ),
        KEY,
    )


def wag_bladder(pix):
    cx, cy, r = 19, 33, 11
    pix.sphere(cx, cy, r, RED, RED_H, RED_D, specular=False)
    for y in range(cy - r, cy + r + 1):
        for x in range(cx - r, cx + r + 1):
            if (x - cx) ** 2 + (y - cy) ** 2 > (r - 1) ** 2:
                continue
            if _ink(pix, x, y):
                continue
            if x < cx - 3:
                col = BLUE_H if y < cy else BLUE
            elif x < cx + 4:
                col = GREEN if y < cy else GREEN_D
            else:
                col = RED_H if y < cy else RED_D
            pix.set(x, y, col)
    pix.line(cx - 3, cy - 7, cx - 3, cy + 7, INK)
    pix.line(cx + 4, cy - 7, cx + 4, cy + 7, INK)
    pix.line(cx - 8, cy, cx + 8, cy, INK)
    pix.set(cx - 6, cy - 5, WHITE)
    pix.set(cx - 5, cy - 5, BLUE_H)
    pix.set(cx - 6, cy - 4, BLUE_H)
    # Popped seam, and the free two.
    pix.box(27, 36, 8, 10, CREAM)
    for x, y in (
        (29, 38), (30, 38), (31, 38), (32, 38),
        (32, 39),
        (31, 40), (30, 40),
        (29, 41),
        (29, 42), (30, 42), (31, 42), (32, 42),
    ):
        pix.set(x, y, RED_D)
    pix.set(29, 38, RED)
    stamp(pix, 14, 12, FACE_SMALL)
    stamp(pix, 22, 16, COG)


def wag_almanac(pix):
    stamp(pix, 12, 9, HAT)
    stamp(pix, 13, 15, FACE_WORRY)
    # Mismatched glasses. One brow believes the book.
    stamp(
        pix,
        14,
        18,
        S(
            """
.EE.....AA.
E..E...A..A
.EE.....AA.
"""
        ),
    )
    pix.line(18, 19, 19, 19, INK)
    pix.line(15, 16, 18, 17, INK)
    pix.line(22, 15, 26, 17, INK)
    # The book, heart = spade, which is wrong.
    pix.round_box(6, 30, 28, 15, 2, CREAM_D)
    pix.fill_rect(8, 32, 10, 11, CREAM)
    pix.fill_rect(22, 32, 10, 11, CREAM_H)
    pix.fill_rect(18, 31, 2, 13, INK)
    pix.set(9, 33, WHITE)
    stamp(
        pix,
        10,
        34,
        S(
            """
.R.R.
RRRRw
RRRRr
.RrR.
..R..
"""
        ),
    )
    stamp(
        pix,
        24,
        34,
        S(
            """
..U..
.UiU.
UiUiU
.UUU.
..H..
..h..
"""
        ),
    )
    pix.fill_rect(16, 36, 3, 1, MAG)
    pix.fill_rect(16, 38, 3, 1, MAG_H)
    # Leaf bookmark, stuck in from the bottom.
    pix.set(19, 29, MOSS_H)
    pix.set(20, 28, MOSS)
    pix.set(20, 30, MOSS_D)


def wag_fen(pix):
    # Cog teeth, then the dial, then the fen in front.
    for x, y in ((18, 10), (29, 20), (18, 32), (8, 20)):
        pix.fill_rect(x, y, 3, 3, INK)
        pix.fill_rect(x, y, 2, 2, BRASS_H)
    pix.sphere(20, 22, 10, BRASS, BRASS_H, BRASS_D, specular=False)
    pix.disc(20, 22, 7, LAV)
    pix.disc(17, 20, 3, LAV_H)
    # Cattail hands.
    pix.line(20, 22, 20, 16, MOSS_D)
    pix.line(20, 22, 20, 17, MOSS)
    pix.ellipse(20, 15, 1.3, 2.0, MOSS)
    pix.set(19, 14, MOSS_H)
    pix.line(20, 22, 25, 24, WHEAT_D)
    pix.line(20, 22, 24, 24, WHEAT)
    pix.ellipse(26, 24, 2.0, 1.2, WHEAT)
    pix.set(25, 23, WHEAT_H)
    pix.set(20, 22, INK)
    pix.set(19, 21, BRASS_H)
    # The dial has a face. The clock is the jester.
    pix.set(16, 24, WHITE)
    pix.set(17, 24, INK)
    pix.set(22, 24, WHITE)
    pix.set(23, 24, INK)
    pix.line(17, 27, 23, 27, INK)
    pix.set(17, 26, INK)
    pix.set(23, 26, INK)
    # Reed water.
    pix.fill_rect(7, 42, 26, 6, BLUE_D)
    pix.fill_rect(7, 42, 26, 1, BLUE_H)
    for i, h in enumerate((9, 13, 7, 15, 10, 6, 12, 8)):
        x = 8 + i * 3
        pix.line(x, 47, x, 47 - h, MOSS_D)
        pix.set(x, 47 - h, MOSS_H)
        if i % 2 == 0:
            pix.set(x - 1, 46 - h, MOSS)
            pix.set(x, 45 - h, MOSS_H)
    pix.line(20, 32, 20, 38, BRASS_D)
    _bell_local(pix, 20, 40)


def wag_thumbs(pix):
    stamp(pix, 12, 8, HAT)
    stamp(pix, 13, 14, FACE)
    stamp(pix, 8, 20, COG)
    spots = (
        (7, 27, False),
        (13, 25, False),
        (19, 27, False),
        (25, 25, False),
        (10, 35, False),
        (16, 37, True),
        (22, 35, False),
        (28, 37, False),
    )
    for x, y, flip in spots:
        stamp(pix, x, y, THUMB_FLIP if flip else THUMB)


def wag_lean(pix):
    stamp(pix, 13, 8, HAT)
    stamp(pix, 15, 14, FACE_SMALL)
    # A spine of three cogs, with sky on either side. That is the whole year.
    for y in (26, 34, 42):
        stamp(pix, 17, y, COG)
    pix.line(15, 36, 23, 36, WHEAT_D)
    pix.line(22, 36, 24, 44, WHEAT)
    for y in (38, 40, 42):
        pix.set(23, y, INK)
    pix.line(23, 30, 31, 26, PEACH_D)
    pix.line(31, 26, 31, 16, MOSS_D)
    pix.set(30, 17, WHEAT_H)
    pix.set(32, 18, WHEAT)
    pix.set(31, 15, WHEAT_H)
    pix.set(30, 19, WHEAT_D)
    pix.set(32, 21, MOSS)


def _scale_face(pix, cx, cy):
    pix.set(cx - 2, cy - 1, WHITE)
    pix.set(cx - 1, cy - 1, INK)
    pix.line(cx - 2, cy + 2, cx + 2, cy + 2, INK)
    # The same scratch on every scale.
    pix.set(cx + 1, cy - 4, CREAM_H)
    pix.set(cx + 2, cy - 3, WHITE)
    pix.set(cx + 2, cy - 2, CREAM)
    pix.line(cx - 3, cy + 4, cx + 3, cy + 4, PLUM)
    pix.line(cx - 2, cy + 6, cx + 2, cy + 6, PLUM_D)


def wag_scales(pix):
    _egg(pix, 13, 24, 7, 12, TERR, TERR_H, TERR_D)
    _egg(pix, 27, 25, 7, 12, TERR, TERR_H, TERR_D)
    _scale_face(pix, 13, 24)
    _scale_face(pix, 27, 25)
    for x in range(17, 24, 2):
        pix.set(x, 20, TEAL_H)
        pix.set(x + 1, 28, MAG)
    _bell_local(pix, 20, 42)
    pix.fill_rect(8, 46, 10, 2, MOSS)
    pix.fill_rect(22, 46, 10, 2, MOSS_H)


def wag_backhair(pix):
    pix.sphere(20, 30, 6, PEACH, PEACH_H, PEACH_D, specular=False)
    pix.sphere(11, 28, 2.4, PEACH, PEACH_H, PEACH_D, specular=False)
    pix.sphere(29, 28, 2.4, PEACH, PEACH_H, PEACH_D, specular=False)
    pix.set(11, 28, PEACH_D)
    pix.set(29, 28, PEACH_D)
    pix.fill_rect(13, 34, 7, 4, TEAL)
    pix.fill_rect(20, 34, 7, 4, MAG)
    pix.set(14, 34, TEAL_H)
    stamp(pix, 8, 10, MANE)
    # Two husk-chips caught in the fur.
    for x, y in ((15, 22), (25, 20)):
        pix.disc(x, y, 2.2, INK)
        pix.disc(x, y, 1.4, RED)
        pix.set(x - 1, y - 1, RED_H)
        pix.set(x, y, CREAM)
    # A side lock that would not lie flat.
    pix.line(12, 18, 7, 14, INK)
    pix.line(12, 18, 8, 14, WHEAT_H)
    pix.line(28, 18, 33, 14, INK)
    pix.line(28, 18, 32, 14, MAG_H)


def wag_gnaw(pix):
    pix.sphere(27, 28, 8, BRASS, BRASS_H, BRASS_D, specular=True)
    for y in range(24, 34):
        for x in range(18, 25):
            if (x - 27) ** 2 + (y - 28) ** 2 <= 49 and x < 23:
                pix.set(x, y, _sky_at(y))
    for x, y, c in ((31, 18, BRASS_H), (33, 22, WHEAT), (32, 36, BRASS), (34, 31, BRASS_H)):
        pix.set(x, y, c)
    stamp(pix, 4, 14, HAT)
    stamp(
        pix,
        6,
        20,
        S(
            """
....KKKKKK....
..KKqPPPPPK...
.KqPPPPPPPPK..
.KPPPOKPPPPK..
.KPPPPPPPPPK..
.KPPPPPPPPPK..
.KPPPKKKKKKKK.
.KPPKKqqqqqqK.
..KPPKKKKKKK..
...KKKKKK.....
"""
        ),
    )
    # Incisors in the bite.
    pix.fill_rect(18, 27, 2, 4, CREAM)
    pix.fill_rect(21, 27, 2, 4, CREAM_H)
    pix.set(18, 27, WHITE)
    pix.set(21, 27, WHITE)
    pix.set(19, 30, CREAM_D)
    _tunic(pix, 8, 36, 12, 6)


def _sky_at(y):
    if y < 33:
        return LAV
    if y < 44:
        return LAV_H
    return PEACH

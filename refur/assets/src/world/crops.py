"""The six crop families. Distinct silhouettes at a small native size.

Hearts sap gourd, Spades quill stalk, Diamonds glint pod,
Clubs burr clutch, face-card Hand, Ace old root.
"""

from __future__ import annotations

from draw import Sprite
from palette import (
    BRA,
    BRA_DK,
    BRA_HI,
    BRA_LT,
    CRE,
    CRE_HI,
    MAG,
    MAG_LT,
    MOS,
    MOS_DK,
    MOS_HI,
    MOS_LT,
    OUT,
    PEACH,
    PEACH_PALE,
    PLU,
    PLU_DK,
    PLU_HI,
    PLU_LT,
    RED,
    RED_DK,
    RED_HI,
    RED_LT,
    SOI,
    SOI_DK,
    SOI_HI,
    SOI_LT,
    TEA_HI,
    TEA_LT,
    TER,
    TER_DK,
    TER_LT,
    VOI,
    WHE,
    WHE_DK,
    WHE_HI,
    WHE_LT,
)


def _mound(s, cx, by, rx=8):
    s.ellipse(cx, by, rx, 4, SOI_DK)
    s.ellipse(cx, by - 1, rx - 2, 3, SOI)
    s.ellipse(cx - 2, by - 2, rx // 2, 2, SOI_LT)
    s.p(cx - rx + 2, by, MOS)
    s.p(cx + rx - 3, by - 1, MOS_LT)


def sapgourd() -> Sprite:
    """Wide sticky gourd. Round silhouette, drips underneath."""
    s = Sprite(48, 44)
    cx, cy = 24, 18
    # lower bulb, upper bulb
    s.shaded_ellipse(cx, 22, 14, 10, RED_HI, RED_LT, RED, RED_DK)
    s.shaded_ellipse(cx - 1, 12, 9, 7, RED_HI, RED_LT, TER_LT, RED)
    # waist
    s.ellipse(cx, 16, 6, 3, RED)
    s.p(cx - 4, 10, RED_HI)
    s.p(cx - 5, 11, CRE_HI)
    # stem and one leaf
    s.thick_line(cx, 6, cx + 1, 2, MOS_DK, r=1)
    s.ellipse(cx + 6, 6, 4, 2, MOS)
    s.p(cx + 5, 5, MOS_HI)
    # sap drips — the sticky read
    for x, y, n in ((14, 30, 4), (24, 31, 6), (33, 30, 3)):
        s.line(x, 28, x, y + n, RED_LT)
        s.disc(x, y + n, 1, RED_HI)
        s.p(x, 28, RED)
    _mound(s, cx, 40, 10)
    s.outline()
    return s.crop(1)


def quillstalk() -> Sprite:
    """Tall narrow stalk with a fan of sharp quills."""
    s = Sprite(40, 52)
    cx = 20
    s.thick_line(cx, 40, cx, 16, PLU_DK, r=2)
    s.thick_line(cx - 1, 40, cx - 1, 18, PLU, r=1)
    s.p(cx - 2, 24, MOS)
    s.ellipse(cx - 6, 26, 3, 2, MOS_LT)
    # quill fan. Each quill is a long triangle.
    quills = [
        ((cx, 18), (cx - 2, 6), (cx - 8, 2)),
        ((cx, 16), (cx - 1, 4), (cx, 1)),
        ((cx, 16), (cx + 2, 3), (cx + 6, 1)),
        ((cx, 18), (cx + 6, 8), (cx + 14, 6)),
        ((cx + 1, 20), (cx + 10, 14), (cx + 16, 16)),
        ((cx - 1, 20), (cx - 10, 14), (cx - 14, 18)),
    ]
    for i, tri in enumerate(quills):
        s.polygon(tri, PLU_HI if i % 2 == 0 else CRE)
        # dark spine
        ax, ay = tri[0]
        bx, by = tri[1]
        s.line(ax, ay, bx, by, PLU_DK if i % 2 else OUT)
    _mound(s, cx, 46, 7)
    s.outline()
    return s.crop(1)


def glintpod() -> Sprite:
    """Angular crystal husk. Faceted, not a round fruit."""
    s = Sprite(40, 48)
    cx = 20
    # three crystals, back to front
    crystals = [
        ([(cx - 4, 28), (cx - 14, 16), (cx - 6, 8), (cx + 2, 20)], BRA_LT, BRA_HI),
        ([(cx + 2, 30), (cx + 8, 14), (cx + 16, 18), (cx + 6, 32)], PEACH, PEACH_PALE),
        ([(cx - 2, 34), (cx - 8, 18), (cx, 6), (cx + 8, 16), (cx + 4, 34)], CRE, BRA_HI),
    ]
    for pts, mid, hi in crystals:
        s.polygon(pts, mid)
        # lit facet: top-left half
        ax = sum(p[0] for p in pts) // len(pts)
        ay = sum(p[1] for p in pts) // len(pts)
        s.polygon([pts[0], pts[1], (ax, ay)], hi)
        s.line(pts[1][0], pts[1][1], pts[2][0], pts[2][1], BRA_DK)
    # spark
    s.p(cx - 1, 12, TEA_HI)
    s.p(cx, 12, CRE_HI)
    s.p(cx + 6, 18, TEA_LT)
    s.p(cx - 8, 16, WHE_HI)
    _mound(s, cx, 42, 8)
    s.outline()
    return s.crop(1)


def burrclutch() -> Sprite:
    """Low wide burr. Claw-bracts reach sideways."""
    s = Sprite(56, 40)
    cx, cy = 28, 22
    # claws first so the body sits on top of their roots
    claws = [
        (8, 20, 18, 16),
        (6, 26, 18, 24),
        (48, 18, 38, 16),
        (50, 26, 38, 24),
        (18, 10, 24, 16),
        (38, 9, 32, 16),
    ]
    for x0, y0, x1, y1 in claws:
        s.thick_line(x1, y1, x0, y0, MOS_DK, r=2)
        s.thick_line(x1, y1, x0, y0, MOS, r=1)
        # hooked tip
        s.disc(x0, y0, 2, MOS_HI)
        s.p(x0, y0 + 1, MOS_DK)
    s.shaded_ellipse(cx, cy, 10, 8, MOS_HI, MOS_LT, MOS, MOS_DK)
    # burr seams
    s.line(cx - 6, cy - 2, cx + 5, cy + 3, MOS_DK)
    s.line(cx - 4, cy + 3, cx + 6, cy - 3, MOS_DK)
    s.p(cx - 3, cy - 3, MOS_HI)
    _mound(s, cx, 35, 9)
    s.outline()
    return s.crop(1)


def hand() -> Sprite:
    """A face-card crop: a bloom with two little arms."""
    s = Sprite(44, 52)
    cx = 22
    # stalk
    s.thick_line(cx, 40, cx, 22, PLU_DK, r=2)
    s.line(cx - 1, 40, cx - 1, 24, PLU_LT)
    # leaf
    s.ellipse(cx + 7, 30, 4, 2, MOS)
    # arms
    s.thick_line(cx, 26, 8, 20, WHE_DK, r=1)
    s.thick_line(cx, 26, 36, 18, WHE_DK, r=1)
    s.thick_line(cx, 26, 9, 19, WHE, r=1)
    s.thick_line(cx, 26, 35, 17, WHE_LT, r=1)
    # little hands (three blobs, reads as a mitt at this size)
    for hx, hy in ((7, 18), (37, 16)):
        s.disc(hx, hy, 2, CRE)
        s.p(hx - 1, hy - 2, CRE_HI)
        s.p(hx + 2, hy, WHE_DK)
    # bloom head
    s.shaded_ellipse(cx, 16, 8, 7, CRE_HI, PEACH_PALE, PEACH, TER)
    for ang_x, ang_y, col in (
        (-6, 12, MAG_LT),
        (6, 12, TEA_LT),
        (0, 10, CRE_HI),
        (-5, 18, WHE_LT),
        (5, 18, WHE_LT),
    ):
        s.p(cx + ang_x, ang_y, col)
    # seed eyes and a small petal mouth — a plant face, not a portrait
    s.p(cx - 3, 15, OUT)
    s.p(cx + 2, 15, OUT)
    s.p(cx - 3, 14, CRE_HI)
    s.line(cx - 2, 19, cx + 2, 19, MAG)
    _mound(s, cx, 46, 7)
    s.outline()
    return s.crop(1)


def oldroot() -> Sprite:
    """Ancient long root. Low, wide, gnarled."""
    s = Sprite(68, 40)
    # lateral root running almost the full width
    pts = [(6, 22), (14, 18), (24, 20), (34, 16), (46, 18), (58, 14)]
    for i in range(len(pts) - 1):
        x0, y0 = pts[i]
        x1, y1 = pts[i + 1]
        rad = 4 if i < 3 else 3
        s.thick_line(x0, y0, x1, y1, SOI_DK, r=rad)
        s.thick_line(x0, y0 - 1, x1, y1 - 1, SOI_LT, r=max(1, rad - 2))
    # taproot down into the mound
    s.thick_line(24, 20, 26, 32, SOI, r=3)
    s.line(23, 20, 25, 32, SOI_LT)
    # knots
    s.shaded_ellipse(16, 20, 5, 4, SOI_HI, SOI_LT, SOI, SOI_DK)
    s.shaded_ellipse(40, 17, 4, 4, PLU_LT, PLU, PLU_DK, VOI)
    # moss in a crack, and one old teal sap-glint
    s.line(30, 16, 36, 19, MOS_DK)
    s.p(32, 16, MOS_HI)
    s.p(33, 17, MOS)
    s.p(48, 16, TEA_LT)
    s.p(49, 15, TEA_HI)
    # tapered tip
    s.polygon([(56, 16), (64, 12), (58, 18)], SOI_LT)
    _mound(s, 26, 35, 8)
    s.outline()
    return s.crop(1)


def all_crops():
    return [
        ("crop_sapgourd.png", sapgourd()),
        ("crop_quillstalk.png", quillstalk()),
        ("crop_glintpod.png", glintpod()),
        ("crop_burrclutch.png", burrclutch()),
        ("crop_hand.png", hand()),
        ("crop_oldroot.png", oldroot()),
    ]


if __name__ == "__main__":
    crops = all_crops()
    sheet = Sprite(sum(c.w for _, c in crops) + 8 * len(crops), max(c.h for _, c in crops) + 4)
    x = 4
    for _, c in crops:
        sheet.blit(c, x, 4)
        x += c.w + 8
    sheet.save("/tmp/crops_x4.png", scale=4)
    for name, c in crops:
        print(f"{name} {c.w}x{c.h}")

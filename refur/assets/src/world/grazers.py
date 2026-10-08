"""Grazers. Original creatures only.

Bladderkin: a translucent swim-bladder with a proboscis. No knot, no string.
Habit: an empty work-suit. No flesh.
Ropejack: a long-armed sky creature riding or swinging from a bladderkin.
Long Habit: the tattered giant of that empty suit.
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
    CRE,
    CRE_HI,
    LAV,
    LAV_DEEP,
    LAV_MID,
    LAV_PALE,
    LAV_SOFT,
    MOS,
    MOS_DK,
    OUT,
    PEACH,
    PEACH_PALE,
    RED,
    RED_DK,
    RED_HI,
    RED_LT,
    SOI,
    SOI_DK,
    SOI_LT,
    TEA,
    TEA_DK,
    TEA_HI,
    TEA_LT,
    TER,
    TER_DK,
    TER_LT,
    VOI,
    VOI_LT,
    WHE,
    WHE_DK,
    WHE_HI,
    WHE_LT,
)


def _fit_pair(raw):
    boxes = []
    for s in raw:
        ys, xs = np.where(s.px[:, :, 3] > 0)
        boxes.append((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))
    w, h = raw[0].w, raw[0].h
    x0 = max(0, min(b[0] for b in boxes) - 1)
    y0 = max(0, min(b[1] for b in boxes) - 1)
    x1 = min(w, max(b[2] for b in boxes) + 1)
    y1 = min(h, max(b[3] for b in boxes) + 1)
    out = []
    for s in raw:
        c = Sprite(x1 - x0, y1 - y0)
        c.px[:] = s.px[y0:y1, x0:x1]
        out.append(c)
    return out


def _organ(s, cx, cy, rx, ry, phase=0.0):
    """Lumpy membrane. Returns the set of filled pixels as (x, y, nx, ny)."""
    pts = []
    for y in range(int(cy - ry) - 3, int(cy + ry) + 4):
        for x in range(int(cx - rx) - 3, int(cx + rx) + 4):
            dx = x - cx
            dy = y - cy
            ang = math.atan2(dy, dx)
            wob = 1.0 + 0.07 * math.sin(3 * ang + phase) + 0.04 * math.sin(5 * ang + 1.7)
            nx = dx / (rx * wob)
            ny = dy / (ry * wob)
            if nx * nx + ny * ny > 1:
                continue
            edge = nx * nx + ny * ny
            light = -(nx * 0.75 + ny * 1.05)
            if edge > 0.82:
                c = RED_DK
            elif light > 0.55 and edge < 0.45:
                c = RED_HI
            elif light > 0.15:
                c = RED_LT
            elif light > -0.35:
                c = RED
            else:
                c = RED_DK
            # inner membrane reads lighter, like you can see into it
            if edge < 0.35 and light > -0.2:
                c = RED_LT if c == RED else RED_HI
            s.p(x, y, c)
            pts.append((x, y, nx, ny))
    return pts


def _veins(s, cx, cy, rx, ry):
    """Branching vessels inside the membrane. Not a highlight streak."""
    def branch(x, y, ang, length, width):
        for i in range(int(length)):
            x += math.cos(ang)
            y += math.sin(ang)
            ang += 0.08 * math.sin(i * 0.7)
            if width > 0 and i % 6 == 5:
                branch(x, y, ang - 0.6, length * 0.45, 0)
                branch(x, y, ang + 0.5, length * 0.4, 0)
            s.p(x, y, RED_DK)
            if width:
                s.p(x + 1, y, RED)

    branch(cx - 2, cy + 2, -2.4, rx * 0.9, 1)
    branch(cx, cy + 1, -0.4, ry * 0.8, 1)
    branch(cx + 1, cy, 0.8, rx * 0.7, 1)


def _proboscis(s, cx, cy, reach=9):
    """A side-set sucking tube. Offset, so it cannot read as a tied knot."""
    x0, y0 = cx + 4, cy + 6
    x1, y1 = x0 + reach, y0 + 5
    s.thick_line(x0, y0, x1, y1, RED_DK, r=2)
    s.thick_line(x0, y0, x1 - 1, y1 - 1, RED, r=1)
    s.p(x0 - 1, y0 - 1, RED_LT)
    # open tip and a sap bead
    s.disc(x1, y1, 2, RED_DK)
    s.p(x1, y1, VOI)
    s.p(x1 + 2, y1 + 2, RED_HI)
    s.p(x1 + 3, y1 + 3, RED_LT)


def _ridge(s, cx, cy, rx):
    """A low fleshy fin along the top, breaking the round silhouette."""
    s.polygon(
        [(cx - 2, cy - 4), (cx + 1, cy - int(rx * 0.55)), (cx + 6, cy - 3)],
        RED,
    )
    s.line(cx - 1, cy - 4, cx + 2, cy - int(rx * 0.5), RED_LT)


def bladderkin(bob=False) -> Sprite:
    s = Sprite(52, 52)
    # bob: the body rises and squashes; the canvas stays put
    cy = 22 if bob else 26
    rx = 16 if bob else 14
    ry = 12 if bob else 15
    phase = 1.2 if bob else 0.2
    _organ(s, 24, cy, rx, ry, phase)
    _veins(s, 24, cy, rx, ry)
    _ridge(s, 22, cy - ry + 6, rx)
    _proboscis(s, 24, cy, reach=8 if not bob else 7)
    # two tiny eye-spots so it reads as a creature
    s.p(18, cy - 3, VOI)
    s.p(23, cy - 4, VOI)
    s.p(18, cy - 4, RED_HI)
    # membrane seam
    s.line(14, cy + 2, 30, cy - 1, RED_DK)
    s.outline()
    return s


def _habit_body(s, frame):
    """Empty suit facing screen-right, mid stride. No flesh anywhere."""
    stride = frame  # 0 or 1
    bob = frame
    y = bob
    # legs and boots first
    if stride == 0:
        s.thick_line(16, 30 + y, 12, 40 + y, WHE_DK, r=2)  # back leg
        s.thick_line(20, 30 + y, 26, 40 + y, WHE, r=2)  # front leg
        s.ellipse(12, 42 + y, 4, 2, SOI_DK)
        s.ellipse(26, 42 + y, 4, 2, SOI)
        s.p(24, 41 + y, SOI_LT)
    else:
        s.thick_line(18, 30 + y, 14, 40 + y, WHE, r=2)
        s.thick_line(22, 30 + y, 28, 39 + y, WHE_DK, r=2)
        s.ellipse(14, 42 + y, 4, 2, SOI)
        s.ellipse(29, 41 + y, 4, 2, SOI_DK)
        s.p(13, 41 + y, SOI_LT)
    # torso, patched wheat shirt over a terracotta vest
    s.shaded_ellipse(18, 24 + y, 9, 10, WHE_HI, WHE_LT, WHE, WHE_DK, bias=0.1)
    s.ellipse(20, 26 + y, 4, 4, TER)
    s.p(19, 25 + y, TER_LT)
    # suspenders
    s.line(14, 18 + y, 15, 32 + y, SOI_DK)
    s.line(22, 18 + y, 23, 32 + y, SOI_DK)
    # empty sleeves, open cuffs (dark mouth of the cuff, no hand)
    s.thick_line(12, 22 + y, 6, 30 + y, WHE, r=2)
    s.thick_line(24, 22 + y, 30, 28 + y, WHE_LT, r=2)
    s.disc(6, 31 + y, 2, TER_DK)
    s.p(6, 31 + y, VOI)
    s.disc(31, 29 + y, 2, TER_DK)
    s.p(31, 29 + y, VOI)
    # collar ring around a void where a head would be
    s.ellipse(18, 14 + y, 6, 5, TER)
    s.ellipse(18, 14 + y, 4, 3, VOI)
    s.ellipse(17, 14 + y, 2, 2, VOI_LT)
    # hat brim resting on the back of the collar, front still empty
    s.ellipse(17, 9 + y, 8, 3, WHE_DK)
    s.ellipse(17, 8 + y, 7, 2, WHE)
    s.shaded_ellipse(16, 6 + y, 4, 3, WHE_HI, WHE_LT, WHE, WHE_DK)
    # a stitch, so the hat belongs to the suit
    s.p(20, 10 + y, SOI_DK)
    s.p(20, 11 + y, SOI_DK)


def habit(frame=0) -> Sprite:
    s = Sprite(44, 52)
    _habit_body(s, frame)
    s.outline()
    return s


def _mini_bladder(s, cx, cy, rx=10, ry=8):
    _organ(s, cx, cy, rx, ry, 0.4)
    # harness band, not a knot
    s.line(cx - rx + 2, cy + 1, cx + rx - 2, cy - 1, BRA_DK)
    s.line(cx - rx + 2, cy, cx + rx - 2, cy - 2, BRA_LT)
    s.disc(cx + rx - 1, cy - 1, 1, BRA_HI)


def _ropejack_body(s, cx, cy, tilt=0):
    """Pointed sky-thing. Long arms, no fur, no primate face."""
    # short legs
    s.thick_line(cx - 2, cy + 4, cx - 6, cy + 9, LAV_MID, r=1)
    s.thick_line(cx + 2, cy + 4, cx + 5, cy + 9, LAV, r=1)
    # torso
    s.shaded_ellipse(cx, cy, 5, 6, LAV_PALE, LAV_SOFT, LAV, LAV_DEEP)
    s.ellipse(cx + 1, cy + 1, 2, 3, CRE)
    # head: wedge snout pointing right, big eyes
    s.polygon(
        [(cx - 2, cy - 8), (cx + 8, cy - 4), (cx + 2, cy - 1), (cx - 4, cy - 2)],
        LAV_SOFT,
    )
    s.p(cx + 7, cy - 4, TEA_HI)  # nose tip
    s.disc(cx - 1, cy - 5, 2, CRE_HI)
    s.disc(cx + 3, cy - 5, 2, CRE_HI)
    s.p(cx - 1, cy - 5, LAV_DEEP)
    s.p(cx + 3, cy - 5, LAV_DEEP)
    s.p(cx - 1, cy - 6, CRE_HI)
    # crest, not ears-as-monkey
    s.polygon([(cx - 1, cy - 8), (cx + 1, cy - 12), (cx + 3, cy - 7)], TEA)
    s.p(cx + 1, cy - 11, TEA_HI)


def ropejack(swing=False) -> Sprite:
    s = Sprite(56, 72)
    if not swing:
        _mini_bladder(s, 30, 40, 12, 9)
        _ropejack_body(s, 30, 26)
        # one long arm down to the harness, one holding a coil
        s.thick_line(28, 28, 22, 40, LAV, r=1)
        s.thick_line(32, 28, 40, 36, LAV_SOFT, r=1)
        s.disc(22, 41, 2, TEA)
        s.disc(40, 36, 2, TEA_LT)
        # rope coil on the shoulder
        for i, (dx, dy) in enumerate(((0, 0), (3, 1), (1, 3), (4, 3))):
            s.disc(18 + dx, 22 + dy, 2, WHE if i % 2 == 0 else WHE_LT)
        s.p(20, 23, BRA_DK)
    else:
        _mini_bladder(s, 30, 16, 11, 8)
        # Rope leaves the SIDE of the harness, then falls to the hands.
        # It is a two-strand cord with a grip at the end, not a string from the belly.
        s.thick_line(40, 15, 46, 22, WHE_DK, r=1)
        s.line(40, 14, 46, 21, WHE_HI)
        s.thick_line(46, 22, 30, 40, WHE, r=1)
        s.line(47, 22, 31, 40, WHE_LT)
        _ropejack_body(s, 24, 48)
        # both arms up on the rope, body tipped
        s.thick_line(24, 46, 26, 38, LAV_SOFT, r=1)
        s.thick_line(22, 48, 20, 36, LAV, r=1)
        s.disc(26, 37, 2, TEA_HI)
        s.disc(20, 35, 2, TEA)
        # legs kicked
        s.thick_line(22, 54, 14, 58, LAV_MID, r=1)
        s.thick_line(26, 54, 34, 60, LAV, r=1)
        # coil still at the hip
        s.disc(16, 50, 2, WHE)
        s.disc(18, 52, 2, WHE_LT)
    s.outline()
    return s


def longhabit() -> Sprite:
    """The boss suit. Taller than a doorway, full of holes."""
    s = Sprite(64, 96)
    # dragging hem and a long torn sleeve
    s.polygon(
        [(16, 28), (44, 24), (52, 70), (46, 88), (38, 78), (30, 90), (22, 76), (12, 84), (8, 50)],
        WHE_DK,
    )
    s.polygon(
        [(20, 30), (40, 28), (44, 66), (36, 74), (28, 64), (22, 72), (16, 48)],
        WHE,
    )
    # light on the left fold
    s.line(18, 34, 14, 60, WHE_HI)
    s.line(22, 32, 20, 58, WHE_LT)
    # tears: windows of void, cloth around them
    for (x, y, rx, ry) in ((30, 48, 4, 5), (24, 62, 3, 3), (38, 58, 3, 4)):
        s.ellipse(x, y, rx + 1, ry + 1, TER_DK)
        s.ellipse(x, y, rx, ry, VOI)
    # enormous empty hood
    s.shaded_ellipse(30, 22, 16, 12, WHE_LT, WHE, WHE_DK, SOI_DK)
    s.ellipse(32, 24, 10, 8, TER)
    s.ellipse(33, 25, 7, 6, VOI)
    s.ellipse(32, 25, 4, 3, VOI_LT)
    # ragged hood points
    s.polygon([(16, 18), (10, 8), (22, 16)], WHE_DK)
    s.polygon([(44, 16), (54, 6), (42, 20)], TER)
    s.polygon([(14, 16), (12, 10), (20, 16)], WHE)
    # one huge dragging sleeve, open and empty at the end
    s.thick_line(14, 40, 6, 68, WHE, r=3)
    s.thick_line(16, 40, 8, 66, WHE_LT, r=1)
    s.disc(6, 70, 3, TER_DK)
    s.ellipse(6, 70, 2, 2, VOI)
    # the other sleeve is a stump of cloth
    s.thick_line(44, 36, 52, 52, WHE_DK, r=2)
    s.disc(53, 54, 2, VOI)
    # patches
    s.rect(26, 36, 5, 4, TER)
    s.p(27, 37, TER_LT)
    s.rect(34, 70, 4, 3, MOS)
    # boots under the hem, still walking
    s.ellipse(24, 88, 5, 3, SOI)
    s.ellipse(40, 86, 5, 3, SOI_DK)
    s.p(22, 87, SOI_LT)
    s.outline()
    return s.crop(1)


def all_grazers():
    b0, b1 = _fit_pair([bladderkin(False), bladderkin(True)])
    h0, h1 = _fit_pair([habit(0), habit(1)])
    r0, r1 = _fit_pair([ropejack(False), ropejack(True)])
    return [
        ("grazer_bladderkin_0.png", b0),
        ("grazer_bladderkin_1.png", b1),
        ("grazer_habit_0.png", h0),
        ("grazer_habit_1.png", h1),
        ("grazer_ropejack_0.png", r0),
        ("grazer_ropejack_1.png", r1),
        ("grazer_longhabit.png", longhabit()),
    ]


if __name__ == "__main__":
    items = all_grazers()
    for name, spr in items:
        print(f"{name} {spr.w}x{spr.h}")
    sheet = Sprite(sum(s.w for _, s in items) + 6 * len(items), max(s.h for _, s in items) + 4)
    x = 2
    for _, s in items:
        sheet.blit(s, x, 2)
        x += s.w + 6
    sheet.save("/tmp/grazers_x4.png", scale=4)

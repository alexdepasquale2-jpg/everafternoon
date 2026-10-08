"""Phone controls.

ui_joystick.png
    Horizontal two-cell sprite. Native 96×48, file is 288×144 (nearest ×3).
    Cell size is 48×48 native (144×144 in the file). There is no gutter.

    Left cell  [0:48,  0:48]: base ring. Transparent outside the ring and
                inside the center hole. A plum dish with a brass lip and
                four teal cardinal ticks (orientation marks, not a d-pad).
    Right cell [48:96, 0:48]: knob, centered on the cell, transparent
                elsewhere. Brass dome, teal cap, top-left specular.

    At rest, blit both cells at the same origin: the knob sits in the hole.
    Move the stick by blitting the right cell at origin + (dx, dy).
    dx/dy are in the same pixel space you blitted (native, or ×3 if you
    draw the file without scaling it back down).

ui_btn_a/b/c/d.png
    Round 24×24 buttons, each a different color, each with an icon and
    its letter.
        A  green   seedling   plant / confirm
        B  terracotta  open hand   shoo / back
        C  blue    water drop  water / compost
        D  magenta jester bell Wag / start Dusk
"""

from palette import (
    BRASS,
    BRASS_D,
    BRASS_H,
    CREAM,
    GREEN,
    GREEN_D,
    GREEN_H,
    INK,
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
    TEAL,
    TEAL_D,
    TEAL_H,
    TERR,
    TERR_D,
    TERR_H,
    BLUE,
    BLUE_D,
    BLUE_H,
    WHEAT,
    WHEAT_D,
    WHITE,
)
from pix import Pix

CELL = 48
BTN = 24


def _outline_canvas(pix: Pix) -> None:
    src = pix.a.copy()
    h, w = pix.h, pix.w
    for y in range(h):
        for x in range(w):
            if src[y, x, 3] != 0:
                continue
            for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < h and 0 <= nx < w and src[ny, nx, 3] != 0:
                    pix.set(x, y, INK)
                    break


def _punch_disc(pix: Pix, cx, cy, r):
    for y in range(pix.h):
        for x in range(pix.w):
            if (x - cx) ** 2 + (y - cy) ** 2 <= r * r:
                pix.clear(x, y)


def ui_joystick() -> Pix:
    pix = Pix(CELL * 2, CELL)
    cx, cy = 23.5, 23.5

    # --- left cell: base ring ---
    pix.disc(cx, cy, 20, PLUM_D)
    pix.disc(cx, cy, 18.5, PLUM)
    # Top-left light on the dish.
    pix.ring(cx - 0.5, cy - 0.5, 17.5, 15.5, PLUM_H)
    pix.ring(cx + 0.8, cy + 0.8, 18.2, 16.4, PLUM_D)
    # Brass lip.
    pix.ring(cx, cy, 15.2, 13.6, BRASS_D)
    pix.ring(cx - 0.4, cy - 0.4, 15.0, 14.0, BRASS_H)
    # Cardinal ticks, sitting on the brass lip.
    for x, y in ((23, 10), (24, 10), (23, 36), (24, 36), (10, 23), (10, 24), (36, 23), (36, 24)):
        pix.set(x, y, TEAL_H)
    # Open hole. Outline pass paints the inner lip.
    _punch_disc(pix, cx, cy, 11.2)

    # --- right cell: knob, centered so it stacks on the ring at rest ---
    kx, ky = cx + CELL, cy
    pix.sphere(kx, ky, 8, BRASS, BRASS_H, BRASS_D, specular=False)
    pix.disc(kx - 1, ky - 2, 3.2, TEAL)
    pix.disc(kx - 2, ky - 3, 1.6, TEAL_H)
    pix.set(int(kx) - 3, int(ky) - 4, WHITE)
    pix.set(int(kx) - 2, int(ky) - 4, TEAL_H)
    # Grip notch.
    pix.set(int(kx) - 1, int(ky) + 1, BRASS_D)
    pix.set(int(kx), int(ky) + 1, BRASS_D)
    pix.set(int(kx) + 1, int(ky) + 2, BRASS_D)

    _outline_canvas(pix)
    return pix


# 3×5 letters. They sit in the lower bowl, clear of the icon.
_LETTER = {
    "A": ("010", "101", "111", "101", "101"),
    "B": ("110", "101", "110", "101", "110"),
    "C": ("011", "100", "100", "100", "011"),
    "D": ("110", "101", "101", "101", "110"),
}


def _letter(p: Pix, ch: str):
    rows = _LETTER[ch]
    x0, y0 = 10, 15
    # Ink halo so the glyph reads on every button color.
    for ry, row in enumerate(rows):
        for rx, bit in enumerate(row):
            if bit != "1":
                continue
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    p.set(x0 + rx + dx, y0 + ry + dy, INK)
    for ry, row in enumerate(rows):
        for rx, bit in enumerate(row):
            if bit == "1":
                p.set(x0 + rx, y0 + ry, CREAM)


def _button(base, hi, lo, icon_fn, letter) -> Pix:
    p = Pix(BTN, BTN)
    p.sphere(11.5, 11.5, 10, base, hi, lo, specular=False)
    p.set(6, 5, WHITE)
    p.set(7, 5, hi)
    icon_fn(p)
    _letter(p, letter)
    _outline_canvas(p)
    return p


def _icon_seedling(p: Pix):
    # Two leaves, a stem, a seed. Kept in the upper half.
    art = (
        (12, 3, MOSS_H),
        (11, 4, MOSS),
        (13, 4, MOSS_H),
        (10, 5, MOSS_D),
        (11, 5, MOSS_H),
        (12, 5, WHITE),
        (13, 5, MOSS),
        (14, 5, MOSS_D),
        (12, 6, MOSS_D),
        (12, 7, MOSS),
        (12, 8, MOSS_D),
        (11, 9, WHEAT_D),
        (12, 9, WHEAT),
        (13, 9, WHEAT_D),
    )
    for x, y, c in art:
        p.set(x, y, c)


def _icon_hand(p: Pix):
    # Open palm, four fingers and a thumb: a shoo.
    p.blit(
        6,
        3,
        "\n".join(
            [
                ".K.K.K.K.",
                ".qPqPqPq.",
                ".PPPPPPPK",
                "qPPPPPPPp",
                "KPPPPPPPK",
                ".KPPPPPK.",
                "..KKKKK..",
            ]
        ),
        {"K": INK, "P": PEACH, "q": PEACH_H, "p": PEACH_D},
    )


def _icon_drop(p: Pix):
    p.blit(
        8,
        3,
        "\n".join(
            [
                "..SS..",
                ".SSNS.",
                "SSONSn",
                "SNNNNn",
                ".NnNNn",
                "..NnN.",
            ]
        ),
        {"S": BLUE_H, "N": BLUE, "n": BLUE_D, "O": WHITE},
    )


def _icon_bell(p: Pix):
    p.blit(
        8,
        3,
        "\n".join(
            [
                "..QK..",
                ".ZEEK.",
                "ZEEEeK",
                "ZEEEeK",
                "KAAAAa",
                ".KYBK.",
                "..Kb..",
            ]
        ),
        {
            "K": INK,
            "Q": MAG_H,
            "Z": TEAL_H,
            "E": TEAL,
            "e": TEAL_D,
            "A": MAG,
            "a": MAG_D,
            "Y": BRASS_H,
            "B": BRASS,
            "b": BRASS_D,
        },
    )


def ui_btn_a():
    return _button(GREEN, GREEN_H, GREEN_D, _icon_seedling, "A")


def ui_btn_b():
    return _button(TERR, TERR_H, TERR_D, _icon_hand, "B")


def ui_btn_c():
    return _button(BLUE, BLUE_H, BLUE_D, _icon_drop, "C")


def ui_btn_d():
    return _button(MAG, MAG_H, MAG_D, _icon_bell, "D")

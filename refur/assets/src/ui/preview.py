"""Labelled contact sheet for the card, Wag and UI set."""

from PIL import Image, ImageDraw

from font import text, text_width
from palette import CREAM, CREAM_D, INK, LAV, LAV_D, PEACH, WHEAT, WHEAT_H
from pix import Pix

SCALE = 3


def _label(msg, color, scale=2):
    w = max(1, text_width(msg, scale=scale))
    h = 7 * scale
    p = Pix(w, h)
    text(p, 0, 0, msg, color, scale=scale)
    return p.image(1)


def _checker(w, h, cell=12):
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    a = LAV_D[:3]
    b = (0x3A, 0x2A, 0x55)
    dr = ImageDraw.Draw(img)
    for y in range(0, h, cell):
        for x in range(0, w, cell):
            c = a if ((x // cell) + (y // cell)) % 2 == 0 else b
            dr.rectangle([x, y, x + cell - 1, y + cell - 1], fill=c + (255,))
    return img


def _paste(sheet, im, x, y):
    sheet.alpha_composite(im, (x, y))


def _cell(sheet, im, x, y, caption, sub=None):
    """Place a sprite on a checker pad with a caption underneath."""
    pad = 8
    pw, ph = im.size
    plate = _checker(pw + pad * 2, ph + pad * 2)
    plate.alpha_composite(im, (pad, pad))
    _paste(sheet, plate, x, y)
    cap = _label(caption, CREAM, 2)
    _paste(sheet, cap, x, y + plate.size[1] + 4)
    extra = 0
    if sub:
        s = _label(sub, WHEAT, 1)
        _paste(sheet, s, x, y + plate.size[1] + 4 + cap.size[1] + 2)
        extra = s.size[1] + 2
    return plate.size[0], plate.size[1] + 4 + cap.size[1] + extra


def build_sheet(images, joy_rest, joy_nudge):
    """images: name -> RGBA image at the file's real (×3) size."""
    Wd, Hd = 1680, 1960
    sheet = Image.new("RGBA", (Wd, Hd), (0x24, 0x18, 0x32, 255))

    title = _label("REFUR   CARDS, WAGS, CONTROLS", WHEAT_H, 3)
    _paste(sheet, title, 24, 18)
    sub = _label("NATIVE PIXEL ART  x3 NEAREST     INK #1B1424     TOP-LEFT LIGHT", PEACH, 2)
    _paste(sheet, sub, 24, 48)

    y = 84
    # Card.
    w, h = _cell(
        sheet,
        images["card_frame"],
        24,
        y,
        "CARD FRAME",
        "40x56 -> 120x168   corners flat   well empty",
    )
    x = 24 + w + 28
    # Suits in a row.
    suit_meta = (
        ("suit_h", "HEART", "SAP DROP"),
        ("suit_s", "SPADE", "QUILL TIP"),
        ("suit_d", "DIAMOND", "CRYSTAL"),
        ("suit_c", "CLUB", "BURR"),
    )
    sx = x
    suit_bottom = y
    for name, cap, subc in suit_meta:
        sw, sh = _cell(sheet, images[name], sx, y, cap, subc + "  16x16")
        sx += sw + 16
        suit_bottom = max(suit_bottom, y + sh)
    # Icons under the suits, to the right of the card.
    ix = x
    iy = suit_bottom + 16
    for name, cap in (
        ("ui_chip", "CHIP"),
        ("ui_gold", "GOLD"),
        ("ui_leaf", "LEAF"),
    ):
        iw, ih = _cell(sheet, images[name], ix, iy, cap, "16x16")
        ix += iw + 16
        icon_bottom = iy + ih

    # Buttons + joystick on the right of the top band.
    bx = sx + 12
    by = y
    for name, cap, subc in (
        ("ui_btn_a", "A", "PLANT"),
        ("ui_btn_b", "B", "SHOO"),
        ("ui_btn_c", "C", "WATER"),
        ("ui_btn_d", "D", "WAG"),
    ):
        bw, bh = _cell(sheet, images[name], bx, by, cap, subc)
        bx += bw + 12
    jx = sx + 12
    jy = by + bh + 18
    jw, jh = _cell(
        sheet,
        images["ui_joystick"],
        jx,
        jy,
        "JOYSTICK SPRITE",
        "96x48   LEFT RING 48   RIGHT KNOB 48",
    )
    cx = jx + jw + 20
    _cell(sheet, joy_rest, cx, jy, "AT REST", "CELLS STACKED")
    rw, rh = joy_rest.size
    _cell(sheet, joy_nudge, cx + rw + 36, jy, "NUDGED", "KNOB +6 +4")

    # Wags.
    names = [
        ("wag_1", "1 LATHE-TONGUE"),
        ("wag_2", "2 RUST HALO"),
        ("wag_3", "3 OVERWINTERER"),
        ("wag_4", "4 HABIT COAT"),
        ("wag_5", "5 BLADDER GUT"),
        ("wag_6", "6 WRONG ALMANAC"),
        ("wag_7", "7 FEN CLOCK"),
        ("wag_8", "8 TWELVE THUMBS"),
        ("wag_9", "9 LEAN YEAR"),
        ("wag_10", "10 SCALE MEMORY"),
        ("wag_11", "11 BACK-HAIR"),
        ("wag_12", "12 TITHE-GNAW"),
    ]
    header = _label("WAGS   BRASS RIM, TEAL AND MAGENTA MOTLEY", CREAM, 2)
    wy = 760
    _paste(sheet, header, 24, wy)
    wy += 28
    col_w = 200
    row_h = 250
    for i, (name, cap) in enumerate(names):
        c = i % 6
        r = i // 6
        _cell(sheet, images[name], 24 + c * col_w, wy + r * row_h, cap, "40x56")

    foot = _label(
        "JOYSTICK: BLIT LEFT CELL AND RIGHT CELL AT THE SAME ORIGIN. MOVE THE KNOB BY SHIFTING THE RIGHT CELL.",
        WHEAT,
        2,
    )
    _paste(sheet, foot, 24, Hd - 36)
    return sheet

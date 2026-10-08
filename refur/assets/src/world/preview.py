"""Labelled contact sheet of every world sprite."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from palette import LAV, OUT, PEACH_PALE

ROWS = [
    ["bg_sky.png"],
    ["spire.png", "engine_0.png", "engine_1.png"],
    [
        "crop_sapgourd.png",
        "crop_quillstalk.png",
        "crop_glintpod.png",
        "crop_burrclutch.png",
        "crop_hand.png",
        "crop_oldroot.png",
    ],
    [
        "grazer_bladderkin_0.png",
        "grazer_bladderkin_1.png",
        "grazer_habit_0.png",
        "grazer_habit_1.png",
        "grazer_ropejack_0.png",
        "grazer_ropejack_1.png",
        "grazer_longhabit.png",
    ],
    [
        "keeper_n_0.png",
        "keeper_n_1.png",
        "keeper_e_0.png",
        "keeper_e_1.png",
        "keeper_s_0.png",
        "keeper_s_1.png",
        "keeper_w_0.png",
        "keeper_w_1.png",
    ],
    ["title_logo.png"],
]


def _font(size):
    try:
        return ImageFont.load_default(size=size)
    except TypeError:
        return ImageFont.load_default()


def _load(img_dir: Path, name: str) -> Image.Image:
    im = Image.open(img_dir / name).convert("RGBA")
    if name == "bg_sky.png":
        im = im.resize((960, 540), Image.Resampling.NEAREST)
    return im


def build(img_dir: Path, out_path: Path) -> None:
    margin = 28
    gap = 18
    label_h = 22
    font = _font(16)
    title_font = _font(28)
    loaded = [[(name, _load(img_dir, name)) for name in row] for row in ROWS]

    width = 1100
    for row in loaded:
        need = margin * 2 + sum(im.width for _, im in row) + gap * (len(row) - 1)
        width = max(width, need)

    y = margin
    title = "REFUR world sprites"
    # measure title
    dummy = Image.new("RGB", (1, 1))
    d = ImageDraw.Draw(dummy)
    tw = d.textlength(title, font=title_font)
    y += 36 + margin

    row_tops = []
    for row in loaded:
        rh = max(im.height for _, im in row) + label_h + 8
        row_tops.append((y, rh))
        y += rh + margin
    height = y

    sheet = Image.new("RGBA", (width, height), LAV)
    draw = ImageDraw.Draw(sheet)
    draw.text(((width - tw) / 2, margin), title, fill=OUT, font=title_font)

    for (row_y, _rh), row in zip(row_tops, loaded):
        row_w = sum(im.width for _, im in row) + gap * (len(row) - 1)
        x = (width - row_w) // 2
        base = row_y
        max_h = max(im.height for _, im in row)
        for name, im in row:
            # sit sprites on a shared baseline inside the row
            top = base + (max_h - im.height)
            sheet.alpha_composite(im, (x, top))
            label = name.replace(".png", "")
            lw = draw.textlength(label, font=font)
            draw.text((x + (im.width - lw) / 2, base + max_h + 4), label, fill=OUT, font=font)
            x += im.width + gap

    # a peach rule under the title so the sheet has the dusk pair
    draw.rectangle((margin, margin + 34, width - margin, margin + 38), fill=PEACH_PALE)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.convert("RGB").save(out_path, "PNG")


if __name__ == "__main__":
    root = Path(__file__).resolve().parents[2]
    build(root / "img", root / "preview_world.png")

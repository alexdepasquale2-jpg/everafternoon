"""Dusk sky, 640x360 native (1920x1080 at 3x). Opaque.

Lavender falls into peach. Soft pixel clouds. Three to five distant
hollow molts, no creatures.
"""

from __future__ import annotations

import numpy as np

from draw import Sprite
from palette import (
    LAV,
    LAV_DEEP,
    LAV_MID,
    LAV_PALE,
    LAV_SOFT,
    MOS,
    MOS_LT,
    OUT,
    PEACH,
    PEACH_DEEP,
    PEACH_PALE,
    PLU,
    PLU_DK,
    PLU_LT,
    TER,
    TER_DK,
    TER_LT,
    VOI,
)

W, H = 640, 360

# 4x4 Bayer, 0..15
_BAYER = np.array(
    [
        [0, 8, 2, 10],
        [12, 4, 14, 6],
        [3, 11, 1, 9],
        [15, 7, 13, 5],
    ],
    dtype=np.int16,
)

# Top of the sky to the warm haze under the floating molts.
_STOPS = [
    (0.00, np.array(LAV_DEEP[:3])),
    (0.22, np.array(LAV_MID[:3])),
    (0.42, np.array(LAV[:3])),
    (0.62, np.array(LAV_SOFT[:3])),
    (0.78, np.array(PEACH[:3])),
    (0.90, np.array(PEACH_PALE[:3])),
    (1.00, np.array(PEACH_DEEP[:3])),
]


def _gradient() -> np.ndarray:
    img = np.zeros((H, W, 4), dtype=np.uint8)
    ys = np.linspace(0, 1, H)
    bayer = np.tile(_BAYER, (H // 4 + 1, W // 4 + 1))[:H, :W]
    thresh = bayer / 16.0
    rgb = np.zeros((H, W, 3), dtype=np.uint8)
    for i in range(len(_STOPS) - 1):
        t0, c0 = _STOPS[i]
        t1, c1 = _STOPS[i + 1]
        band = (ys >= t0) & (ys <= t1)
        if not band.any():
            continue
        span = max(1e-6, t1 - t0)
        local = (ys[band] - t0) / span
        # broadcast local over x, dither against the next stop
        local = local[:, None]
        pick = local >= thresh[band]
        row = np.where(pick[..., None], c1, c0).astype(np.uint8)
        rgb[band] = row
    img[:, :, :3] = rgb
    img[:, :, 3] = 255
    return img


def _diamond(s, cx, cy, hw, color):
    hh = max(1, hw // 2)
    for dy in range(-hh, hh + 1):
        span = hw - (abs(dy) * hw) // hh
        y = cy + dy
        for dx in range(-span, span + 1):
            s.p(cx + dx, y, color)


def _face(s, x0, y0, x1, y1, x2, y2, x3, y3, color):
    s.polygon([(x0, y0), (x1, y1), (x2, y2), (x3, y3)], color)


def _plate(s, cx, cy, hw, vh, top, left, right):
    hh = max(1, hw // 2)
    # right face, then left, then top
    _face(s, cx + hw, cy, cx, cy + hh, cx, cy + hh + vh, cx + hw, cy + vh, right)
    _face(s, cx - hw, cy, cx, cy + hh, cx, cy + hh + vh, cx - hw, cy + vh, left)
    _diamond(s, cx, cy, hw, top)
    # 1px lip on the near edges
    s.line(cx + hw, cy, cx, cy + hh, OUT)
    s.line(cx, cy + hh, cx - hw, cy, OUT)
    s.line(cx - hw, cy, cx - hw, cy + vh, OUT)
    s.line(cx + hw, cy, cx + hw, cy + vh, OUT)


def _molt(s, cx, cy, scale, fade=0):
    """A tiny hollow husk. fade 0 is near, 1 is far and paler."""

    def mix(c, k=fade):
        pale = np.array(LAV_PALE[:3])
        base = np.array(c[:3])
        out = (base * (1 - k) + pale * k).astype(np.uint8)
        return (int(out[0]), int(out[1]), int(out[2]), 255)

    hw = int(8 * scale)
    vh = max(3, int(4 * scale))
    # foot
    _plate(s, cx, cy, hw, vh, mix(TER_LT), mix(TER), mix(TER_DK))
    # throat
    _plate(s, cx, cy - vh - 1, max(4, hw - 2), vh, mix(PLU_LT), mix(PLU), mix(PLU_DK))
    # crown cap of old soil
    _plate(s, cx, cy - 2 * vh - 2, max(3, hw - 4), max(2, vh - 1), mix(MOS_LT), mix(MOS), mix(TER))
    # dark mouth, so the island reads hollow even at a distance
    mouth_w = max(2, hw // 3)
    s.ellipse(cx, cy + vh // 2, mouth_w, max(2, vh // 2), mix(VOI) if fade < 0.5 else mix(PLU_DK))
    s.ellipse(cx, cy + vh // 2, max(1, mouth_w - 1), max(1, vh // 3), (0x12, 0x0E, 0x16, 255))


def _cloud(s, cx, cy, scale):
    puffs = ((0, 0, 11, 5), (9, -2, 8, 4), (-8, 1, 7, 4), (3, 3, 10, 3), (-2, -3, 6, 3))
    for dx, dy, rx, ry in puffs:
        s.shaded_ellipse(
            cx + dx * scale,
            cy + dy * scale,
            max(2, rx * scale),
            max(2, ry * scale),
            LAV_PALE,
            LAV_SOFT,
            LAV,
            LAV_MID,
            bias=0.35,
        )


def native() -> Sprite:
    s = Sprite(W, H)
    s.px[:] = _gradient()
    # a soft sun buried in the peach band, no outline
    s.shaded_ellipse(470, 250, 36, 18, PEACH_PALE, PEACH, PEACH, PEACH_DEEP, bias=0.8)
    for spec in (
        (80, 78, 2),
        (150, 120, 3),
        (230, 54, 1),
        (300, 96, 2),
        (390, 48, 1),
        (520, 70, 2),
        (580, 130, 2),
        (40, 160, 2),
        (200, 180, 1),
    ):
        _cloud(s, *spec)
    # Five hollow molts. Far ones sit in the deep sky, clear of the cloud band.
    _molt(s, 170, 46, 1.4, fade=0.2)
    _molt(s, 430, 58, 1.6, fade=0.15)
    _molt(s, 300, 150, 1.8, fade=0.1)
    _molt(s, 96, 188, 2.2, fade=0.0)
    _molt(s, 520, 176, 2.5, fade=0.0)
    return s


if __name__ == "__main__":
    img = native()
    img.save("/tmp/sky_x2.png", scale=2)
    print(img.w, img.h, "alpha0", int((img.px[:, :, 3] == 0).sum()))

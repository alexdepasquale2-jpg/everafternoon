"""Tiny pixel canvas. Draw at native resolution; scale ×3 nearest-neighbour."""

from __future__ import annotations

import math

import numpy as np
from PIL import Image

from palette import INK


class Pix:
    def __init__(self, w: int, h: int):
        self.w = w
        self.h = h
        self.a = np.zeros((h, w, 4), dtype=np.uint8)
        self._clip = None  # x0, y0, x1, y1 exclusive

    def clip(self, x, y, w, h):
        self._clip = (x, y, x + w, y + h)

    def unclip(self):
        self._clip = None

    def set(self, x, y, c):
        if c is None:
            return
        x = int(round(x))
        y = int(round(y))
        if not (0 <= x < self.w and 0 <= y < self.h):
            return
        if self._clip is not None:
            x0, y0, x1, y1 = self._clip
            if not (x0 <= x < x1 and y0 <= y < y1):
                return
        self.a[y, x, 0] = c[0]
        self.a[y, x, 1] = c[1]
        self.a[y, x, 2] = c[2]
        self.a[y, x, 3] = c[3] if len(c) > 3 else 255

    def clear(self, x, y):
        x = int(round(x))
        y = int(round(y))
        if 0 <= x < self.w and 0 <= y < self.h:
            self.a[y, x] = (0, 0, 0, 0)

    def fill(self, c):
        self.a[:, :] = c

    def fill_rect(self, x, y, w, h, c):
        for yy in range(int(y), int(y + h)):
            for xx in range(int(x), int(x + w)):
                self.set(xx, yy, c)

    def _plot_line(self, x0, y0, x1, y1):
        x0, y0, x1, y1 = int(round(x0)), int(round(y0)), int(round(x1)), int(round(y1))
        dx = abs(x1 - x0)
        dy = -abs(y1 - y0)
        sx = 1 if x0 < x1 else -1
        sy = 1 if y0 < y1 else -1
        err = dx + dy
        while True:
            yield x0, y0
            if x0 == x1 and y0 == y1:
                break
            e2 = 2 * err
            if e2 >= dy:
                err += dy
                x0 += sx
            if e2 <= dx:
                err += dx
                y0 += sy

    def line(self, x0, y0, x1, y1, c):
        for x, y in self._plot_line(x0, y0, x1, y1):
            self.set(x, y, c)

    def stroke(self, x0, y0, x1, y1, c, width=1):
        r = max(0, width // 2)
        for x, y in self._plot_line(x0, y0, x1, y1):
            if r == 0:
                self.set(x, y, c)
            else:
                self.disc(x, y, r, c)

    def disc(self, cx, cy, r, c):
        if r < 0:
            return
        ri = int(math.ceil(r)) + 1
        cx_i, cy_i = int(round(cx)), int(round(cy))
        r2 = r * r
        for y in range(cy_i - ri, cy_i + ri + 1):
            for x in range(cx_i - ri, cx_i + ri + 1):
                if (x - cx) ** 2 + (y - cy) ** 2 <= r2:
                    self.set(x, y, c)

    def ellipse(self, cx, cy, rx, ry, c):
        if rx <= 0 or ry <= 0:
            return
        for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
            for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
                if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1:
                    self.set(x, y, c)

    def ring(self, cx, cy, r_out, r_in, c):
        ri = int(math.ceil(r_out)) + 1
        for y in range(int(cy) - ri, int(cy) + ri + 1):
            for x in range(int(cx) - ri, int(cx) + ri + 1):
                d = (x - cx) ** 2 + (y - cy) ** 2
                if r_in * r_in < d <= r_out * r_out:
                    self.set(x, y, c)

    def ellipse_ring(self, cx, cy, rx, ry, thickness, c):
        for y in range(int(cy - ry) - 2, int(cy + ry) + 3):
            for x in range(int(cx - rx) - 2, int(cx + rx) + 3):
                outer = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
                ix = max(rx - thickness, 0.5)
                iy = max(ry - thickness, 0.5)
                inner = ((x - cx) / ix) ** 2 + ((y - cy) / iy) ** 2
                if outer <= 1 and inner > 1:
                    self.set(x, y, c)

    def sphere(self, cx, cy, r, mid, hi, lo, ink=INK, specular=True):
        """Disc with top-left light and a 1px ink rim."""
        self.disc(cx, cy, r, ink)
        inner = r - 1
        if inner < 0:
            return
        for y in range(int(cy - r) - 1, int(cy + r) + 2):
            for x in range(int(cx - r) - 1, int(cx + r) + 2):
                if (x - cx) ** 2 + (y - cy) ** 2 <= inner * inner:
                    d = (x - cx) + (y - cy)
                    if d < -(r * 0.45):
                        self.set(x, y, hi)
                    elif d > r * 0.55:
                        self.set(x, y, lo)
                    else:
                        self.set(x, y, mid)
        if specular and r >= 3:
            self.set(cx - r // 2, cy - r // 2, hi)
            self.set(cx - r // 2 + 1, cy - r // 2, hi)

    def box(self, x, y, w, h, fill, ink=INK):
        self.fill_rect(x, y, w, h, ink)
        if w > 2 and h > 2:
            self.fill_rect(x + 1, y + 1, w - 2, h - 2, fill)

    def round_box(self, x, y, w, h, rad, fill, ink=INK):
        self.round_fill(x, y, w, h, rad, ink)
        if w > 2 and h > 2:
            self.round_fill(x + 1, y + 1, w - 2, h - 2, max(0, rad - 1), fill)

    def round_fill(self, x0, y0, w, h, rad, c):
        rad = float(rad)
        for y in range(h):
            for x in range(w):
                if _in_round(x + 0.5, y + 0.5, w, h, rad):
                    self.set(x0 + x, y0 + y, c)

    def blit(self, x, y, rows, key, transparent=" ."):
        lines = rows.strip("\n").split("\n")
        for yy, row in enumerate(lines):
            for xx, ch in enumerate(row):
                if ch in transparent:
                    continue
                col = key.get(ch)
                if col is None:
                    raise KeyError(f"no color for {ch!r}")
                self.set(x + xx, y + yy, col)

    def mask_rounded(self, rad):
        m = np.zeros((self.h, self.w), dtype=bool)
        for y in range(self.h):
            for x in range(self.w):
                m[y, x] = _in_round(x + 0.5, y + 0.5, self.w, self.h, rad)
        return m

    def image(self, scale=3) -> Image.Image:
        im = Image.fromarray(self.a, "RGBA")
        if scale != 1:
            im = im.resize((self.w * scale, self.h * scale), Image.Resampling.NEAREST)
        return im


def _in_round(px, py, w, h, r):
    if r <= 0:
        return 0 <= px < w and 0 <= py < h
    cx = min(max(px, r), w - r)
    cy = min(max(py, r), h - r)
    dx = px - cx
    dy = py - cy
    return dx * dx + dy * dy <= r * r


def erode4(mask: np.ndarray) -> np.ndarray:
    h, w = mask.shape
    out = np.zeros_like(mask)
    for y in range(h):
        for x in range(w):
            if not mask[y, x]:
                continue
            if y == 0 or x == 0 or y == h - 1 or x == w - 1:
                continue
            if mask[y - 1, x] and mask[y + 1, x] and mask[y, x - 1] and mask[y, x + 1]:
                out[y, x] = True
    return out

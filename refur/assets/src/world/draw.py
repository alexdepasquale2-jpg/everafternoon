"""Pixel-art drawing primitives. No antialiasing, ever."""

from __future__ import annotations

import math

import numpy as np
from PIL import Image

from palette import OUT


def _rgba(c):
    if len(c) == 3:
        return (c[0], c[1], c[2], 255)
    return tuple(c)


class Sprite:
    def __init__(self, w, h):
        self.w = int(w)
        self.h = int(h)
        self.px = np.zeros((self.h, self.w, 4), dtype=np.uint8)

    def p(self, x, y, c):
        if c is None:
            return
        x = int(x)
        y = int(y)
        if 0 <= x < self.w and 0 <= y < self.h:
            self.px[y, x] = _rgba(c)

    def inside(self, x, y):
        return 0 <= int(x) < self.w and 0 <= int(y) < self.h

    def line(self, x0, y0, x1, y1, c):
        x0, y0, x1, y1 = int(x0), int(y0), int(x1), int(y1)
        dx = abs(x1 - x0)
        dy = abs(y1 - y0)
        sx = 1 if x0 < x1 else -1
        sy = 1 if y0 < y1 else -1
        err = dx - dy
        while True:
            self.p(x0, y0, c)
            if x0 == x1 and y0 == y1:
                break
            e2 = 2 * err
            if e2 > -dy:
                err -= dy
                x0 += sx
            if e2 < dx:
                err += dx
                y0 += sy

    def thick_line(self, x0, y0, x1, y1, c, r=1):
        x0, y0, x1, y1 = int(round(x0)), int(round(y0)), int(round(x1)), int(round(y1))
        dx = abs(x1 - x0)
        dy = abs(y1 - y0)
        sx = 1 if x0 < x1 else -1
        sy = 1 if y0 < y1 else -1
        err = dx - dy
        while True:
            self.disc(x0, y0, r, c)
            if x0 == x1 and y0 == y1:
                break
            e2 = 2 * err
            if e2 > -dy:
                err -= dy
                x0 += sx
            if e2 < dx:
                err += dx
                y0 += sy

    def rect(self, x, y, w, h, c):
        x, y, w, h = int(x), int(y), int(w), int(h)
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                self.p(xx, yy, c)

    def disc(self, cx, cy, r, c):
        r = int(r)
        cx, cy = int(cx), int(cy)
        for y in range(cy - r, cy + r + 1):
            for x in range(cx - r, cx + r + 1):
                if (x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r:
                    self.p(x, y, c)

    def ellipse(self, cx, cy, rx, ry, c):
        rx = max(float(rx), 0.5)
        ry = max(float(ry), 0.5)
        x0 = int(math.floor(cx - rx)) - 1
        x1 = int(math.ceil(cx + rx)) + 1
        y0 = int(math.floor(cy - ry)) - 1
        y1 = int(math.ceil(cy + ry)) + 1
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                dx = (x - cx) / rx
                dy = (y - cy) / ry
                if dx * dx + dy * dy <= 1.0:
                    self.p(x, y, c)

    def ellipse_mask(self, cx, cy, rx, ry):
        """Return list of (x, y, nx, ny) inside the ellipse. nx, ny are -1..1."""
        rx = max(float(rx), 0.5)
        ry = max(float(ry), 0.5)
        x0 = int(math.floor(cx - rx)) - 1
        x1 = int(math.ceil(cx + rx)) + 1
        y0 = int(math.floor(cy - ry)) - 1
        y1 = int(math.ceil(cy + ry)) + 1
        pts = []
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                dx = (x - cx) / rx
                dy = (y - cy) / ry
                if dx * dx + dy * dy <= 1.0:
                    pts.append((x, y, dx, dy))
        return pts

    def shaded_ellipse(self, cx, cy, rx, ry, hi, lt, mid, dk, bias=0.0):
        """Top-left light. bias shifts the terminator (positive = brighter)."""
        for x, y, dx, dy in self.ellipse_mask(cx, cy, rx, ry):
            light = -(dx * 0.85 + dy * 1.05) + bias
            if light > 0.55:
                c = hi
            elif light > 0.12:
                c = lt
            elif light > -0.45:
                c = mid
            else:
                c = dk
            self.p(x, y, c)

    def polygon(self, pts, c):
        if len(pts) < 3:
            return
        ys = [p[1] for p in pts]
        y0 = int(math.floor(min(ys)))
        y1 = int(math.ceil(max(ys)))
        n = len(pts)
        for y in range(y0, y1 + 1):
            xs = []
            for i in range(n):
                x1, y1_ = pts[i]
                x2, y2_ = pts[(i + 1) % n]
                if y1_ == y2_:
                    continue
                if (y1_ <= y < y2_) or (y2_ <= y < y1_):
                    t = (y - y1_) / (y2_ - y1_)
                    xs.append(x1 + t * (x2 - x1))
            if len(xs) < 2:
                continue
            xs.sort()
            for i in range(0, len(xs) - 1, 2):
                xa = int(math.floor(xs[i]))
                xb = int(math.ceil(xs[i + 1]))
                for x in range(xa, xb + 1):
                    self.p(x, y, c)

    def stamp(self, rows, ox, oy, keymap):
        for j, row in enumerate(rows):
            for i, ch in enumerate(row):
                if ch in keymap and keymap[ch] is not None:
                    self.p(ox + i, oy + j, keymap[ch])

    def blit(self, other, ox, oy):
        for y in range(other.h):
            for x in range(other.w):
                if other.px[y, x, 3] > 0:
                    self.p(ox + x, oy + y, other.px[y, x])

    def shift_content(self, dx, dy):
        moved = np.zeros_like(self.px)
        h, w = self.h, self.w
        src_x0 = max(0, -dx)
        src_y0 = max(0, -dy)
        dst_x0 = max(0, dx)
        dst_y0 = max(0, dy)
        src_x1 = min(w, w - dx)
        src_y1 = min(h, h - dy)
        if src_x1 <= src_x0 or src_y1 <= src_y0:
            self.px = moved
            return
        moved[dst_y0:dst_y0 + (src_y1 - src_y0), dst_x0:dst_x0 + (src_x1 - src_x0)] = (
            self.px[src_y0:src_y1, src_x0:src_x1]
        )
        self.px = moved

    def outline(self, color=OUT):
        """1px silhouette outline grown into transparent pixels."""
        a = self.px[:, :, 3] > 0
        h, w = a.shape
        pad = np.zeros((h + 2, w + 2), dtype=bool)
        pad[1:-1, 1:-1] = a
        neigh = pad[:-2, 1:-1] | pad[2:, 1:-1] | pad[1:-1, :-2] | pad[1:-1, 2:]
        grow = neigh & ~a
        self.px[grow] = _rgba(color)

    def crop(self, pad=2):
        a = self.px[:, :, 3] > 0
        if not a.any():
            return self
        ys, xs = np.where(a)
        y0 = max(0, int(ys.min()) - pad)
        y1 = min(self.h, int(ys.max()) + 1 + pad)
        x0 = max(0, int(xs.min()) - pad)
        x1 = min(self.w, int(xs.max()) + 1 + pad)
        out = Sprite(x1 - x0, y1 - y0)
        out.px[:] = self.px[y0:y1, x0:x1]
        return out

    def image(self, scale=1):
        im = Image.fromarray(self.px, "RGBA")
        if scale != 1:
            im = im.resize((self.w * scale, self.h * scale), Image.Resampling.NEAREST)
        return im

    def save(self, path, scale=3):
        self.image(scale).save(path)


def upscale_image(im, scale=3):
    w, h = im.size
    return im.resize((w * scale, h * scale), Image.Resampling.NEAREST)

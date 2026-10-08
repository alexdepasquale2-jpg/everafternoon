"""Isometric 2:1 voxel plates. One native pixel, top-left light, 1px ink edges.

A plate is a flat diamond (TW x TH) with vertical faces VH tall.
VH == TH so stacked plates meet without gaps.
Screen: +i runs down-right, +j runs down-left.
"""

from __future__ import annotations

import numpy as np

from draw import Sprite
from palette import OUT, RAMPS

# Chunky scale-plates. VH == TH so stacked plates meet.
# TW % 4 == 0 keeps the 2:1 diamond on integer pixels.
TW = 28
TH = 14
VH = 14
HW = TW // 2
HH = TH // 2


def _ramp(mat, side):
    spec = RAMPS[mat]
    if isinstance(spec, dict):
        return spec["top"] if side == "top" else spec[side]
    return spec


def _speck(x, y, n=7):
    return (x * 13 + y * 7 + n * 3) & 7


class Scene:
    def __init__(self):
        # (i, j, z) -> material name
        self.cells = {}

    def set(self, i, j, z, mat):
        self.cells[(int(i), int(j), int(z))] = mat

    def fill(self, i0, i1, j0, j1, z0, z1, mat):
        for i in range(i0, i1):
            for j in range(j0, j1):
                for z in range(z0, z1):
                    self.cells[(i, j, z)] = mat

    def column(self, i, j, z0, z1, mat):
        for z in range(z0, z1):
            self.set(i, j, z, mat)


def _top_texture(mat, dx, dy, base, ramp):
    hi, lt, mid, dk = ramp
    n = _speck(dx, dy, 4)
    if mat == "glow":
        d = abs(dx) + abs(dy) * 2
        if d <= max(2, HW // 4):
            return hi
        if d <= HW // 2 + 2:
            return lt
        return mid
    if mat == "void":
        return dk if n > 5 else mid
    if mat in ("moss", "wheat", "soil", "path", "bed_moss", "bed_wheat"):
        if n == 0:
            return dk
        if n == 1:
            return hi
    return base


def _paint(img, x, y, c):
    """Recolor a pixel that is already part of a plate."""
    if 0 <= x < img.shape[1] and 0 <= y < img.shape[0] and img[y, x, 3] > 0:
        img[y, x] = c


def _decorate_top(img, cx, cy, mat, ramp):
    """Low groundcover inside the diamond so plots read as soil, not crops."""
    hi, lt, mid, dk = ramp
    kind = "moss" if mat in ("moss", "bed_moss") else "wheat" if mat in ("wheat", "bed_wheat") else mat
    if kind == "moss":
        sprouts = [(-6, 0), (3, -2), (-2, 3), (6, 1), (0, -3), (4, 2), (-4, 2)]
        for sx, sy in sprouts:
            _paint(img, cx + sx, cy + sy, hi)
            _paint(img, cx + sx, cy + sy + 1, lt)
    elif kind == "wheat":
        stalks = [(-6, 1), (-2, -2), (1, 2), (5, 0), (0, 3), (3, -2)]
        for sx, sy in stalks:
            _paint(img, cx + sx, cy + sy - 2, hi)
            _paint(img, cx + sx, cy + sy - 1, lt)
            _paint(img, cx + sx, cy + sy, mid)
    elif kind == "path":
        if _speck(cx, cy, 5) % 2 == 0:
            _paint(img, cx - 3, cy + 1, dk)
            _paint(img, cx - 2, cy + 1, dk)
            _paint(img, cx + 4, cy - 1, mid)
    elif kind == "glow":
        _paint(img, cx - 4, cy - 2, hi)
        _paint(img, cx - 3, cy - 3, hi)
        _paint(img, cx + 2, cy, lt)


def _face_tone(x, y, vy, height, ramp, side):
    """ramp = (hi, lt, mid, dk). side is 'top', 'left', or 'right'."""
    hi, lt, mid, dk = ramp
    if side == "top":
        # vy unused; x,y are local dx,dy
        lift = -(x + y)
        if lift > HW // 2:
            base = hi
        elif lift > -HW // 5:
            base = lt
        else:
            base = mid
        if _speck(x, y, 1) == 0:
            base = mid if base is not mid else lt
        return base
    # vertical faces: bright rim at the top, ink-dark lip at the bottom
    if vy <= 0:
        return hi if side == "left" else lt
    if vy >= height - 2:
        return dk
    if side == "left":
        base = lt if _speck(x, y, 2) > 1 else mid
    else:
        base = mid if _speck(x, y, 3) > 1 else dk
    return base


def _diamond_span(dy):
    if abs(dy) > HH:
        return -1
    return HW - (abs(dy) * HW) // HH


def _put(img, x, y, c):
    if 0 <= x < img.shape[1] and 0 <= y < img.shape[0] and c is not None:
        img[y, x] = c


def _stroke_diamond(img, cx, cy, color_for):
    # four edges. color_for(edge_name, x, y) -> color
    edges = [
        ((cx - HW, cy), (cx, cy - HH), "nw"),
        ((cx, cy - HH), (cx + HW, cy), "ne"),
        ((cx + HW, cy), (cx, cy + HH), "se"),
        ((cx, cy + HH), (cx - HW, cy), "sw"),
    ]
    for (x0, y0), (x1, y1), name in edges:
        _line(img, x0, y0, x1, y1, lambda x, y, n=name: color_for(n, x, y))


def _line(img, x0, y0, x1, y1, color_fn):
    x0, y0, x1, y1 = int(x0), int(y0), int(x1), int(y1)
    dx = abs(x1 - x0)
    dy = abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx - dy
    while True:
        _put(img, x0, y0, color_fn(x0, y0))
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 > -dy:
            err -= dy
            x0 += sx
        if e2 < dx:
            err += dx
            y0 += sy


def _fill_left(img, cx, cy, color_fn):
    """Screen-left face. color_fn(x, y, local_y)."""
    # Scan the parallelogram under the SW diamond edge.
    # Top edge from (cx-HW, cy) to (cx, cy+HH). Left side vertical.
    for vy in range(0, VH):
        for t in range(0, HH + 1):
            # along the top edge, then down vy
            # t=0 at left vertex, t=HH at bottom vertex
            x = cx - HW + (HW * t) // HH
            y = cy + t + vy
            # fill from the left vertical boundary to this edge? 
            # The face's left boundary is x = cx-HW, but only for rows that
            # the parallelogram covers. Easier: walk each row.
        # row-based
    top = cy
    bot = cy + HH + VH
    for y in range(top, bot + 1):
        # left x and right x
        if y < cy + HH:
            # upper triangle-ish: from vertical left to the diagonal
            # diagonal from (cx-HW, cy) to (cx, cy+HH): x = cx-HW + (y-cy)*HW/HH
            x_right = cx - HW + ((y - cy) * HW) // HH
            x_left = cx - HW
        elif y <= cy + VH:
            x_left = cx - HW
            x_right = cx
        else:
            # bottom diagonal from (cx-HW, cy+VH) to (cx, cy+HH+VH)
            yy = y - (cy + VH)
            x_left = cx - HW + (yy * HW) // HH
            x_right = cx
        if x_right < x_left:
            continue
        local_y = y - cy
        for x in range(x_left, x_right + 1):
            _put(img, x, y, color_fn(x, y, local_y))


def _fill_right(img, cx, cy, color_fn):
    top = cy
    bot = cy + HH + VH
    for y in range(top, bot + 1):
        if y < cy + HH:
            x_left = cx + ((y - cy) * HW) // HH
            x_right = cx + HW
        elif y <= cy + VH:
            x_left = cx
            x_right = cx + HW
        else:
            yy = y - (cy + VH)
            x_left = cx
            x_right = cx + HW - (yy * HW) // HH
        if x_right < x_left:
            continue
        local_y = y - cy
        for x in range(x_left, x_right + 1):
            _put(img, x, y, color_fn(x, y, local_y))


def _fill_top(img, cx, cy, color_fn):
    for dy in range(-HH, HH + 1):
        span = _diamond_span(dy)
        if span < 0:
            continue
        y = cy + dy
        for dx in range(-span, span + 1):
            _put(img, cx + dx, y, color_fn(dx, dy))


def render(scene: Scene, pad=4) -> Sprite:
    if not scene.cells:
        return Sprite(8, 8)
    cells = scene.cells
    keys = list(cells.keys())
    min_x = min((i - j) * HW - HW for i, j, z in keys)
    max_x = max((i - j) * HW + HW for i, j, z in keys)
    min_y = min((i + j) * HH - z * VH - HH for i, j, z in keys)
    max_y = max((i + j) * HH - z * VH + HH + VH for i, j, z in keys)
    ox = pad - min_x
    oy = pad - min_y
    w = int(max_x - min_x) + pad * 2 + 2
    h = int(max_y - min_y) + pad * 2 + 2
    img = np.zeros((h, w, 4), dtype=np.uint8)

    order = sorted(keys, key=lambda k: (k[0] + k[1], k[2], k[0], k[1]))
    for i, j, z in order:
        mat = cells[(i, j, z)]
        cx = int(ox + (i - j) * HW)
        cy = int(oy + (i + j) * HH - z * VH)
        above = (i, j, z + 1) in cells
        # +j neighbor covers the screen-left face; +i covers screen-right.
        hide_left = (i, j + 1, z) in cells
        hide_right = (i + 1, j, z) in cells

        if not hide_right:
            ramp_r = _ramp(mat, "right")

            def rc(x, y, ly, ramp=ramp_r):
                return _face_tone(x, y, ly, VH, ramp, "right")

            _fill_right(img, cx, cy, rc)
            # outline the outer vertical and the bottom diagonal; top diagonal is the diamond
            _line(img, cx + HW, cy, cx + HW, cy + VH, lambda x, y: OUT)
            _line(img, cx, cy + HH, cx, cy + HH + VH, lambda x, y: OUT)
            _line(img, cx + HW, cy + VH, cx, cy + HH + VH, lambda x, y: OUT)

        if not hide_left:
            ramp_l = _ramp(mat, "left")

            def lc(x, y, ly, ramp=ramp_l):
                return _face_tone(x, y, ly, VH, ramp, "left")

            _fill_left(img, cx, cy, lc)
            _line(img, cx - HW, cy, cx - HW, cy + VH, lambda x, y: OUT)
            _line(img, cx, cy + HH, cx, cy + HH + VH, lambda x, y: OUT)
            _line(img, cx - HW, cy + VH, cx, cy + HH + VH, lambda x, y: OUT)
            # lit top rim of the left face
            hi = ramp_l[0]
            _line(img, cx - HW, cy, cx, cy + HH, lambda x, y, hi=hi: hi)

        if not above:
            ramp_t = _ramp(mat, "top")

            def tc(dx, dy, ramp=ramp_t, mat=mat, cx=cx, cy=cy):
                base = _face_tone(dx, dy, 0, 1, ramp, "top")
                return _top_texture(mat, dx, dy, base, ramp)

            _fill_top(img, cx, cy, tc)
            hi = ramp_t[0]
            # top-left edges catch the dusk light; bottom-right edges are ink
            _line(img, cx - HW, cy, cx, cy - HH, lambda x, y, hi=hi: hi)
            _line(img, cx, cy - HH, cx + HW, cy, lambda x, y, hi=hi: hi)
            _line(img, cx + HW, cy, cx, cy + HH, lambda x, y: OUT)
            _line(img, cx, cy + HH, cx - HW, cy, lambda x, y: OUT)
            _decorate_top(img, cx, cy, mat, ramp_t)

    # Close 1px cracks between plates without thickening the silhouette.
    alpha = img[:, :, 3] > 0
    pad_a = np.zeros((h + 2, w + 2), dtype=bool)
    pad_a[1:-1, 1:-1] = alpha
    horiz = pad_a[1:-1, :-2] & pad_a[1:-1, 2:] & ~alpha
    vert = pad_a[:-2, 1:-1] & pad_a[2:, 1:-1] & ~alpha
    seal = horiz | vert
    if seal.any():
        ys, xs = np.where(seal)
        color = np.array(OUT, dtype=np.uint8)
        for y, x in zip(ys, xs):
            img[y, x] = color

    # Second pass: any transparent pixel whose four neighbors are opaque
    # is a missed crack (diagonal stairsteps the first pass can skip).
    alpha = img[:, :, 3] > 0
    up = np.zeros_like(alpha); up[1:] = alpha[:-1]
    down = np.zeros_like(alpha); down[:-1] = alpha[1:]
    left = np.zeros_like(alpha); left[:, 1:] = alpha[:, :-1]
    right = np.zeros_like(alpha); right[:, :-1] = alpha[:, 1:]
    missed = (~alpha) & up & down & left & right
    if missed.any():
        color = np.array(OUT, dtype=np.uint8)
        for y, x in zip(*np.where(missed)):
            img[y, x] = color

    spr = Sprite(w, h)
    spr.px[:] = img
    return spr.crop(pad=1)

"""The Spire: a hollow molt of scale-plates, eight plots, a rim path, a crown.

No units. Native isometric plates, exported at 3x by build.py.
"""

from __future__ import annotations

from iso import Scene, render


def course(i, j, z, inner=False):
    """Stacked scale courses: terracotta, then plum, like a shed coat."""
    weathered = (i * 5 + j * 3 + z * 7) % 11 == 0
    if inner:
        return "plum_dim" if z % 2 == 0 else "plum"
    if z % 2 == 0:
        return "terra_dim" if weathered else "terra"
    return "plum_dim" if weathered else "plum"


def col(sc, i, j, z0, z1, mat):
    for z in range(z0, z1):
        sc.set(i, j, z, mat(i, j, z) if callable(mat) else mat)


def box(sc, i0, i1, j0, j1, z0, z1, mat):
    for i in range(i0, i1):
        for j in range(j0, j1):
            col(sc, i, j, z0, z1, mat)


def carve(sc, i0, i1, j0, j1, z0, z1):
    for i in range(i0, i1):
        for j in range(j0, j1):
            for z in range(z0, z1):
                sc.cells.pop((i, j, z), None)


def build_scene() -> Scene:
    sc = Scene()
    outer = lambda i, j, z: course(i, j, z, False)
    inner = lambda i, j, z: course(i, j, z, True)

    # ---- back of the husk, tall, hollow throat in plum ----
    box(sc, 5, 13, 2, 4, 0, 15, inner)
    box(sc, 4, 14, 4, 6, 0, 13, outer)

    # ---- side walls ----
    box(sc, 4, 7, 6, 13, 0, 9, outer)
    box(sc, 11, 14, 6, 13, 0, 9, outer)

    # ---- front wall and arch (the molt's open mouth) ----
    box(sc, 7, 11, 11, 14, 0, 9, outer)
    # threshold, then a hole, then a lintel
    carve(sc, 8, 10, 12, 14, 2, 7)

    # ---- hollow shaft: dark floor, nothing above it until the crown slab ----
    carve(sc, 7, 11, 6, 12, 1, 11)
    for i in range(7, 11):
        for j in range(6, 12):
            sc.set(i, j, 0, "void")
    # a little dusk-light caught on the floor under the desk
    sc.set(8, 8, 0, "void")
    sc.set(9, 8, 0, "void")

    # inner side walls stay dim so the throat reads as hollow
    box(sc, 6, 7, 6, 11, 1, 9, inner)
    box(sc, 11, 12, 6, 11, 1, 9, inner)

    # ---- crown room: open-topped, slab floor, knee walls, ledger desk ----
    for i in range(6, 12):
        for j in range(4, 9):
            sc.set(i, j, 11, "path")
    # back and side walls of the crown
    box(sc, 5, 13, 3, 5, 12, 16, outer)
    box(sc, 5, 7, 5, 9, 12, 15, outer)
    box(sc, 11, 13, 5, 9, 12, 15, outer)
    # low lip at the front of the room so the floor reads as a rim
    box(sc, 7, 11, 9, 10, 12, 13, outer)

    # bulletin board of pale scale on the back inner wall
    for i in range(7, 10):
        for z in range(13, 15):
            sc.set(i, 4, z, "cream")

    # ledger desk: brass body, glowing scale-lens for a top
    for i in range(8, 10):
        sc.set(i, 6, 12, "brass")
        sc.set(i, 7, 12, "brass")
        sc.set(i, 6, 13, "brass")
        sc.set(i, 7, 13, "glow")

    # ---- rim path: a loop that climbs the left, crosses the crown lip, descends the right ----
    path = []
    # front sill
    for i in range(8, 13):
        path.append((i, 13, 3))
    # left climb (toward the back / screen-left)
    path += [
        (7, 12, 4),
        (6, 11, 5),
        (6, 10, 6),
        (5, 9, 7),
        (5, 8, 8),
        (5, 7, 9),
        (6, 6, 10),
        (7, 5, 10),
    ]
    # across the back rim in front of the crown
    for i in range(8, 12):
        path.append((i, 5, 10))
    # right descent
    path += [
        (12, 5, 10),
        (13, 6, 9),
        (13, 7, 8),
        (14, 8, 7),
        (14, 9, 6),
        (14, 10, 5),
        (14, 11, 4),
        (13, 12, 3),
    ]

    # supports under the path, then the pale walking surface
    for i, j, z in path:
        col(sc, i, j, 0, z, outer)
        sc.set(i, j, z, "path")

    # ---- eight raised beds, four along each side of the loop ----
    # (i, j, z, soil) sitting just outside a path tile
    plots = [
        (7, 14, 4, "bed_moss"),
        (6, 12, 6, "bed_wheat"),
        (5, 10, 8, "bed_moss"),
        (4, 8, 10, "bed_wheat"),
        (15, 12, 4, "bed_wheat"),
        (15, 10, 6, "bed_moss"),
        (15, 8, 8, "bed_wheat"),
        (14, 6, 10, "bed_moss"),
    ]
    for i, j, z, soil in plots:
        col(sc, i, j, 0, z, outer)
        # a one-plate lip so the bed has a rim of husk under the soil
        sc.set(i, j, z - 1, course(i, j, z - 1))
        sc.set(i, j, z, soil)

    # widen each bed by a sibling plate so it reads at a glance
    siblings = [
        (8, 14, 4, "bed_moss"),
        (6, 13, 6, "bed_wheat"),
        (4, 10, 8, "bed_moss"),
        (4, 7, 10, "bed_wheat"),
        (16, 12, 4, "bed_wheat"),
        (16, 10, 6, "bed_moss"),
        (16, 8, 8, "bed_wheat"),
        (15, 6, 10, "bed_moss"),
    ]
    for i, j, z, soil in siblings:
        col(sc, i, j, 0, z, outer)
        sc.set(i, j, z, soil)

    # ---- ragged hem and a few shed plates ----
    for i, j, z in list(sc.cells):
        if z <= 1 and (i + j * 3) % 11 == 0 and _is_fringe(sc, i, j):
            sc.cells.pop((i, j, z), None)
    # shed plates sticking off the silhouette
    for i, j, z in (
        (3, 9, 4),
        (3, 6, 8),
        (15, 4, 11),
        (16, 7, 3),
        (9, 15, 2),
        (12, 15, 2),
        (2, 11, 3),
    ):
        sc.set(i, j, z, course(i, j, z))
        if z > 0 and (i, j, z - 1) not in sc.cells:
            sc.set(i, j, z - 1, course(i, j, z - 1))

    # moss caught in crevices. Only on plates that still have stone above,
    # so it never reads as an extra plantable plot.
    for i, j, z in ((4, 12, 3), (14, 13, 2), (7, 15, 2), (3, 8, 5), (10, 3, 8)):
        if (i, j, z) in sc.cells and (i, j, z + 1) in sc.cells:
            sc.set(i, j, z, "moss")

    return sc


def _is_fringe(sc, i, j):
    n = 0
    for di, dj in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        if any((i + di, j + dj, z) in sc.cells for z in range(0, 3)):
            n += 1
    return n <= 2


def native():
    return render(build_scene())


if __name__ == "__main__":
    img = native()
    print(f"native {img.w}x{img.h}")
    img.save("/tmp/spire_native.png", scale=1)
    img.save("/tmp/spire_x3.png", scale=3)

#!/usr/bin/env python3
"""Genere les icones PNG de l'application, sans dependance externe.

Un motif simple de sommets enneiges sur fond bleu nuit, dessine a la main en
pixels puis encode en PNG avec zlib. Suffisant pour l'ajout a l'ecran d'accueil.
"""
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets"
OUT.mkdir(exist_ok=True)

SKY_TOP = (0x14, 0x2A, 0x40)
SKY_BOT = (0x2E, 0x55, 0x76)
ROCK = (0x3C, 0x5A, 0x73)
ROCK_DARK = (0x2A, 0x43, 0x59)
SNOW = (0xF2, 0xF5, 0xF8)
SNOW_SHADE = (0xC9, 0xD8, 0xE4)
VALLEY = (0x2F, 0x6B, 0x5C)


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def build(size):
    """Renvoie une liste de lignes RGB."""
    px = [[(0, 0, 0)] * size for _ in range(size)]

    # Ciel en degrade vertical.
    for y in range(size):
        col = lerp(SKY_TOP, SKY_BOT, y / max(1, size - 1))
        for x in range(size):
            px[y][x] = col

    def unit(v):
        return v * size

    # Trois sommets, definis par leur base gauche, leur pointe et leur base droite.
    peaks = [
        ((-0.05, 0.82), (0.26, 0.30), (0.56, 0.82), ROCK_DARK, 0.46),
        ((0.62, 0.82), (0.86, 0.40), (1.08, 0.82), ROCK_DARK, 0.55),
        ((0.22, 0.84), (0.55, 0.18), (0.92, 0.84), ROCK, 0.40),
    ]

    for (lx, ly), (tx, ty), (rx, ry), rock, snow_to in peaks:
        lx, ly, tx, ty, rx, ry = (unit(lx), unit(ly), unit(tx), unit(ty), unit(rx), unit(ry))
        snow_y = unit(snow_to)
        top = int(max(0, ty))
        bottom = int(min(size - 1, max(ly, ry)))
        for y in range(top, bottom + 1):
            # Bord gauche : segment pointe vers base gauche.
            if ly != ty:
                t = (y - ty) / (ly - ty)
                xa = tx + (lx - tx) * max(0.0, min(1.0, t))
            else:
                xa = lx
            if ry != ty:
                t = (y - ty) / (ry - ty)
                xb = tx + (rx - tx) * max(0.0, min(1.0, t))
            else:
                xb = rx
            x0 = int(max(0, min(xa, xb)))
            x1 = int(min(size - 1, max(xa, xb)))
            for x in range(x0, x1 + 1):
                if y <= snow_y:
                    # Calotte de neige, avec un versant droit legerement ombre.
                    mid = (xa + xb) / 2
                    px[y][x] = SNOW if x <= mid else SNOW_SHADE
                else:
                    px[y][x] = rock

    # Fond de vallee.
    floor = int(size * 0.82)
    for y in range(floor, size):
        t = (y - floor) / max(1, size - floor)
        col = lerp(VALLEY, (0x20, 0x4B, 0x40), t)
        for x in range(size):
            px[y][x] = col

    # Trait de torrent clair qui descend la vallee.
    for y in range(floor, size):
        t = (y - floor) / max(1, size - floor)
        cx = size * 0.5 + (y - floor) * 0.18
        w = max(1, int(size * (0.012 + 0.02 * t)))
        for x in range(int(cx - w), int(cx + w) + 1):
            if 0 <= x < size:
                px[y][x] = lerp((0x7F, 0xC4, 0xD8), (0x56, 0xA8, 0xC2), t)

    return px


def write_png(path, px):
    size = len(px)
    raw = bytearray()
    for row in px:
        raw.append(0)  # filtre None
        for r, g, b in row:
            raw += bytes((r, g, b))

    def chunk(tag, data):
        out = struct.pack(">I", len(data)) + tag + data
        out += struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        return out

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    png += chunk(b"IEND", b"")
    path.write_bytes(png)
    return len(png)


for s in (192, 512):
    p = OUT / f"icon-{s}.png"
    n = write_png(p, build(s))
    print(f"{p.name} : {s}x{s}, {n} octets")

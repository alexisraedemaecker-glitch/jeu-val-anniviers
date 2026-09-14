#!/usr/bin/env python3
"""Prepare les icones du fil a partir des illustrations du dossier Icones.

Les originales sont des JPEG de 1024 pixels sur fond blanc. Elles sont
reduites par sips, puis le blanc du fond est rendu transparent ici, en Python
pur, pour que l'icone se pose aussi bien sur un bouton blanc que sur un bouton
colore. Le PNG est decode, une couche alpha est calculee a partir de la
clarte, puis tout est reencode.

Usage : python3 tools/gen_icones_fil.py
"""
import struct
import subprocess
import sys
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "Icones"
SORTIE = ROOT / "assets" / "icones"

# Deux tailles : l'affichage tient en 24 pixels, on double pour les ecrans
# haute densite et on garde une version plus grande pour d'eventuels usages.
TAILLES = [48, 96]

FICHIERS = [
    ("Kudo-CornesDeBouquetin.jpeg", "corne"),
    ("Comment-Marmotte.jpeg", "marmotte"),
]

# Au dessus de cette clarte, le pixel est considere comme du fond. En dessous
# du seuil bas, il est parfaitement opaque. Entre les deux, l'opacite varie,
# ce qui adoucit les bords.
FOND = 246
PLEIN = 224


def lire_png(data):
    """Renvoie (largeur, hauteur, lignes RGB) d'un PNG 8 bits sans palette."""
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError("ce n'est pas un PNG")
    i = 8
    largeur = hauteur = 0
    couleur = 0
    brut = b""
    while i < len(data):
        taille = struct.unpack(">I", data[i : i + 4])[0]
        tag = data[i + 4 : i + 8]
        corps = data[i + 8 : i + 8 + taille]
        if tag == b"IHDR":
            largeur, hauteur, profondeur, couleur, comp, filtre, entrelace = struct.unpack(
                ">IIBBBBB", corps
            )
            if profondeur != 8 or entrelace != 0 or couleur not in (2, 6):
                raise ValueError(f"PNG non gere : profondeur {profondeur}, type {couleur}")
        elif tag == b"IDAT":
            brut += corps
        elif tag == b"IEND":
            break
        i += 12 + taille

    canaux = 3 if couleur == 2 else 4
    flux = zlib.decompress(brut)
    pas = largeur * canaux
    lignes = []
    precedente = bytearray(pas)
    pos = 0
    for _ in range(hauteur):
        filtre = flux[pos]
        pos += 1
        ligne = bytearray(flux[pos : pos + pas])
        pos += pas
        for x in range(pas):
            a = ligne[x - canaux] if x >= canaux else 0
            b = precedente[x]
            c = precedente[x - canaux] if x >= canaux else 0
            if filtre == 1:
                ligne[x] = (ligne[x] + a) & 0xFF
            elif filtre == 2:
                ligne[x] = (ligne[x] + b) & 0xFF
            elif filtre == 3:
                ligne[x] = (ligne[x] + (a + b) // 2) & 0xFF
            elif filtre == 4:
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                pred = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                ligne[x] = (ligne[x] + pred) & 0xFF
        precedente = ligne
        lignes.append(
            [tuple(ligne[x * canaux : x * canaux + 3]) for x in range(largeur)]
        )
    return largeur, hauteur, lignes


def ecrire_png_rgba(path, largeur, hauteur, pixels):
    brut = bytearray()
    for y in range(hauteur):
        brut.append(0)
        for px in pixels[y]:
            brut += bytes(px)

    def chunk(tag, data):
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", largeur, hauteur, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(bytes(brut), 9))
    png += chunk(b"IEND", b"")
    path.write_bytes(png)


def detourer(largeur, hauteur, lignes):
    """Ajoute une couche alpha : le blanc du fond disparait."""
    sortie = []
    for y in range(hauteur):
        ligne = []
        for r, v, b in lignes[y]:
            clarte = max(r, v, b)
            if clarte >= FOND:
                alpha = 0
            elif clarte <= PLEIN:
                alpha = 255
            else:
                alpha = round(255 * (FOND - clarte) / (FOND - PLEIN))
            ligne.append((r, v, b, alpha))
        sortie.append(ligne)
    return sortie


def recadrer(pixels, marge=0.04):
    """Resserre sur le dessin, puis recarre : a 24 pixels d'affichage, une
    illustration perdue au milieu de son fond ne se lirait pas."""
    hauteur = len(pixels)
    largeur = len(pixels[0])
    x0, y0, x1, y1 = largeur, hauteur, -1, -1
    for y in range(hauteur):
        for x in range(largeur):
            if pixels[y][x][3] > 16:
                if x < x0: x0 = x
                if x > x1: x1 = x
                if y < y0: y0 = y
                if y > y1: y1 = y
    if x1 < 0:
        return pixels
    cote = max(x1 - x0, y1 - y0) + 1
    cote = round(cote * (1 + 2 * marge))
    cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
    gx, gy = cx - cote // 2, cy - cote // 2
    vide = (255, 255, 255, 0)
    return [
        [
            pixels[gy + y][gx + x]
            if 0 <= gy + y < hauteur and 0 <= gx + x < largeur
            else vide
            for x in range(cote)
        ]
        for y in range(cote)
    ]


def reduire(pixels, cible):
    """Reduction par moyenne de blocs, en tenant compte de la transparence."""
    n = len(pixels)
    if n == cible:
        return pixels
    sortie = []
    for y in range(cible):
        ligne = []
        for x in range(cible):
            y0, y1 = y * n // cible, max(y * n // cible + 1, (y + 1) * n // cible)
            x0, x1 = x * n // cible, max(x * n // cible + 1, (x + 1) * n // cible)
            sr = sv = sb = sa = 0
            poids = 0
            for yy in range(y0, y1):
                for xx in range(x0, x1):
                    r, v, b, a = pixels[yy][xx]
                    sr += r * a; sv += v * a; sb += b * a
                    sa += a
                    poids += 1
            if sa:
                ligne.append((round(sr / sa), round(sv / sa), round(sb / sa), round(sa / poids)))
            else:
                ligne.append((255, 255, 255, 0))
        sortie.append(ligne)
    return sortie


def main():
    if not SOURCE.exists():
        sys.exit(f"Dossier introuvable : {SOURCE}")
    SORTIE.mkdir(parents=True, exist_ok=True)
    for nom, cle in FICHIERS:
        src = SOURCE / nom
        if not src.exists():
            sys.exit(f"Illustration introuvable : {src}")
        # On travaille sur une reduction intermediaire large, pour que le
        # detourage et le recadrage restent nets une fois reduits.
        tmp = SORTIE / f"{cle}.tmp.png"
        subprocess.run(
            ["sips", "-Z", "384", "--setProperty", "format", "png",
             str(src), "--out", str(tmp)],
            check=True, capture_output=True,
        )
        largeur, hauteur, lignes = lire_png(tmp.read_bytes())
        tmp.unlink()
        carre = recadrer(detourer(largeur, hauteur, lignes))
        for taille in TAILLES:
            px = reduire(carre, taille)
            ecrire_png_rgba(SORTIE / f"{cle}-{taille}.png", taille, taille, px)
            poids = (SORTIE / f"{cle}-{taille}.png").stat().st_size
            print(f"  {cle}-{taille}.png  {taille}x{taille}  {poids // 1024} ko")
    print("\nIcônes du fil prêtes dans assets/icones/")


if __name__ == "__main__":
    main()

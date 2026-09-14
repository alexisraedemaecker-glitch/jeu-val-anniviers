#!/usr/bin/env python3
"""Fabrique l'icone de l'application a partir d'une photo.

Prend la premiere image trouvee dans Icones/ dont le nom commence par logo,
et en derive tout ce que reclament les telephones :

  icon-180.png            iPhone, ajout a l'ecran d'accueil
  icon-192.png            Android et navigateurs
  icon-512.png            Android, ecran de lancement
  icon-maskable-192.png   Android, icone adaptative
  icon-maskable-512.png   idem en grand
  favicon-32.png          onglet du navigateur

Android recadre librement l'icone adaptative, en rond, en goutte ou en carre
arrondi selon le telephone. Seuls les 80 pourcent du centre sont garantis
visibles. Les deux versions maskable reculent donc l'image dans son cadre et
comblent le reste avec la couleur de fond, pour qu'aucun visage ne soit coupe.
Les versions normales, elles, restent pleine image : iPhone n'applique que ses
propres coins arrondis.

Usage : python3 tools/gen_icone_app.py
"""
import struct
import subprocess
import sys
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "Icones"
SORTIE = ROOT / "assets"

# Couleur de fond des icones adaptatives. Le collage est decoupe sur blanc :
# un fond blanc se raccorde sans couture, la photo remplit tout le rond que
# decoupe Android au lieu de ressembler a une vignette collee sur une pastille.
FOND = (0xFF, 0xFF, 0xFF)
# Part de l'image conservee dans la zone sure d'Android.
ZONE_SURE = 0.78

PLEINES = [("icon-180.png", 180), ("icon-192.png", 192), ("icon-512.png", 512),
           ("favicon-32.png", 32)]
MASQUABLES = [("icon-maskable-192.png", 192), ("icon-maskable-512.png", 512)]


def lire_png(data):
    """(largeur, hauteur, lignes RGB) d'un PNG 8 bits sans palette."""
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError("ce n'est pas un PNG")
    i, largeur, hauteur, couleur, brut = 8, 0, 0, 0, b""
    while i < len(data):
        taille = struct.unpack(">I", data[i : i + 4])[0]
        tag = data[i + 4 : i + 8]
        corps = data[i + 8 : i + 8 + taille]
        if tag == b"IHDR":
            largeur, hauteur, profondeur, couleur, _, _, entrelace = struct.unpack(
                ">IIBBBBB", corps
            )
            if profondeur != 8 or entrelace != 0 or couleur not in (2, 6):
                raise ValueError(f"PNG non géré : profondeur {profondeur}, type {couleur}")
        elif tag == b"IDAT":
            brut += corps
        elif tag == b"IEND":
            break
        i += 12 + taille

    canaux = 3 if couleur == 2 else 4
    flux = zlib.decompress(brut)
    pas = largeur * canaux
    lignes, precedente, pos = [], bytearray(pas), 0
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
        lignes.append([tuple(ligne[x * canaux : x * canaux + 3]) for x in range(largeur)])
    return largeur, hauteur, lignes


def ecrire_png(path, pixels):
    hauteur = len(pixels)
    largeur = len(pixels[0])
    brut = bytearray()
    for y in range(hauteur):
        brut.append(0)
        for px in pixels[y]:
            brut += bytes(px[:3])

    def chunk(tag, data):
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", largeur, hauteur, 8, 2, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(bytes(brut), 9))
    png += chunk(b"IEND", b"")
    path.write_bytes(png)


def carre(pixels):
    """Recadre au centre pour obtenir un carre, sans deformer."""
    h, l = len(pixels), len(pixels[0])
    if h == l:
        return pixels
    cote = min(h, l)
    x0, y0 = (l - cote) // 2, (h - cote) // 2
    return [ligne[x0 : x0 + cote] for ligne in pixels[y0 : y0 + cote]]


def reduire(pixels, cible):
    """Reduction par moyenne de blocs."""
    n = len(pixels)
    if n == cible:
        return [ligne[:] for ligne in pixels]
    sortie = []
    for y in range(cible):
        ligne = []
        y0, y1 = y * n // cible, max(y * n // cible + 1, (y + 1) * n // cible)
        for x in range(cible):
            x0, x1 = x * n // cible, max(x * n // cible + 1, (x + 1) * n // cible)
            sr = sv = sb = nb = 0
            for yy in range(y0, y1):
                for xx in range(x0, x1):
                    r, v, b = pixels[yy][xx][:3]
                    sr += r
                    sv += v
                    sb += b
                    nb += 1
            ligne.append((sr // nb, sv // nb, sb // nb))
        sortie.append(ligne)
    return sortie


def masquable(pixels, cible):
    """Pose l'image reduite au centre d'un fond uni, pour Android."""
    dedans = round(cible * ZONE_SURE)
    petit = reduire(pixels, dedans)
    marge = (cible - dedans) // 2
    fond = [[FOND] * cible for _ in range(cible)]
    for y in range(dedans):
        for x in range(dedans):
            fond[marge + y][marge + x] = petit[y][x]
    return fond


def main():
    if not SOURCE.exists():
        sys.exit(f"Dossier introuvable : {SOURCE}")
    sources = sorted(
        p for p in SOURCE.iterdir()
        if p.is_file() and p.stem.lower().startswith("logo")
        and p.suffix.lower() in (".jpg", ".jpeg", ".png", ".heic", ".webp")
    )
    if not sources:
        sys.exit(
            "Aucune image de logo trouvée.\n"
            "Enregistrez la photo dans le dossier Icones/ sous un nom commençant\n"
            "par logo, par exemple Icones/logo-famille.jpg, puis relancez."
        )
    src = sources[0]
    print(f"Source : {src.name}")

    SORTIE.mkdir(exist_ok=True)
    tmp = SORTIE / "logo.tmp.png"
    subprocess.run(
        ["sips", "-Z", "1024", "--setProperty", "format", "png", str(src), "--out", str(tmp)],
        check=True, capture_output=True,
    )
    largeur, hauteur, lignes = lire_png(tmp.read_bytes())
    tmp.unlink()
    base = carre(lignes)
    print(f"  image d'origine {largeur}x{hauteur}, recadrée en {len(base)}x{len(base)}")

    for nom, taille in PLEINES:
        ecrire_png(SORTIE / nom, reduire(base, taille))
        print(f"  {nom:24} {taille}x{taille}  {(SORTIE / nom).stat().st_size // 1024} ko")
    for nom, taille in MASQUABLES:
        ecrire_png(SORTIE / nom, masquable(base, taille))
        print(f"  {nom:24} {taille}x{taille}  {(SORTIE / nom).stat().st_size // 1024} ko")

    print("\nIcônes de l'application prêtes dans assets/")


if __name__ == "__main__":
    main()

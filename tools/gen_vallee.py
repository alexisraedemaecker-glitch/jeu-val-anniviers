#!/usr/bin/env python3
"""Prepare les six images de l'illustration evolutive de la vallee.

Les fichiers d'origine vivent dans EvolutionValAnniviers, nommes par leur
palier (0%.jpeg, 20%.jpeg, ...). Ils sont renommes explicitement, reduits et
recompresses vers assets/vallee/, puis declares dans js/data/vallee.js.

Une variante etroite est aussi produite pour les petits ecrans, ce qui evite
de faire descendre huit cents kilooctets sur un telephone avec une barre de
reseau en montagne.

Usage : python3 tools/gen_vallee.py
"""
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "EvolutionValAnniviers"
OUT = ROOT / "assets" / "vallee"

# Fichier d'origine, palier, et description de ce que l'image montre.
# La derniere image porte 95 dans son nom d'origine : c'est bien la version
# la plus idyllique, debloquee des 95 pourcent de progression reelle.
PALIERS = [
    ("0%.jpeg", 0, "vallee-00", "La vallée de 2056 si rien n'est fait"),
    ("20%.jpeg", 20, "vallee-20", "Les premiers signes de retour"),
    ("40%.jpeg", 40, "vallee-40", "La vie revient doucement"),
    ("60%.jpeg", 60, "vallee-60", "Les alpages se repeuplent"),
    ("80%.jpeg", 80, "vallee-80", "La vallée reprend ses couleurs"),
    ("95%.jpeg", 95, "vallee-100", "La vallée sauvée"),
]

LARGE = 1376
PETIT = 760
QUALITE = 72


def convertir(src, dst, largeur):
    r = subprocess.run(
        ["sips", "-Z", str(largeur), "-s", "format", "jpeg",
         "-s", "formatOptions", str(QUALITE), str(src), "--out", str(dst)],
        capture_output=True,
    )
    if r.returncode != 0 or not dst.exists():
        sys.exit(f"Échec de conversion pour {src.name} : {r.stderr.decode()[:200]}")
    return dst.stat().st_size


def main():
    if not SRC.is_dir():
        sys.exit(f"Dossier introuvable : {SRC}")
    OUT.mkdir(parents=True, exist_ok=True)

    sortie = []
    for fichier, seuil, nom, legende in PALIERS:
        p = SRC / fichier
        if not p.exists():
            sys.exit(f"Image manquante : {p}")
        grand = convertir(p, OUT / f"{nom}.jpg", LARGE)
        petit = convertir(p, OUT / f"{nom}-small.jpg", PETIT)
        sortie.append(
            {
                "seuil": seuil,
                "src": f"assets/vallee/{nom}.jpg",
                "src_small": f"assets/vallee/{nom}-small.jpg",
                "legende": legende,
            }
        )
        print(f"  {nom:12} seuil {seuil:>3}%   {grand // 1024:>4} Ko  ·  petit {petit // 1024:>3} Ko")

    js = (
        "// GENERE AUTOMATIQUEMENT par tools/gen_vallee.py, ne pas editer.\n"
        "//\n"
        "// Illustration evolutive de la vallee. Le palier affiche depend du\n"
        "// pourcentage de progression collective, calcule exactement comme la\n"
        "// condition de victoire : somme des cinq jauges divisee par leur\n"
        "// maximum cumule.\n"
        "export const PALIERS_VALLEE = "
        + json.dumps(sortie, ensure_ascii=False, indent=2)
        + ";\n\n"
        "/** Palier correspondant a un pourcentage de progression. */\n"
        "export function palierVallee(pourcent) {\n"
        "  const p = Math.max(0, Math.min(100, Number(pourcent) || 0));\n"
        "  let choisi = PALIERS_VALLEE[0];\n"
        "  for (const pal of PALIERS_VALLEE) {\n"
        "    if (p >= pal.seuil) choisi = pal;\n"
        "  }\n"
        "  return choisi;\n"
        "}\n"
    )
    (ROOT / "js" / "data" / "vallee.js").write_text(js, encoding="utf-8")

    total = sum(f.stat().st_size for f in OUT.iterdir()) / 1048576
    print(f"\n{len(sortie)} paliers écrits dans assets/vallee/, {total:.1f} Mo au total")
    print("Déclarés dans js/data/vallee.js")


if __name__ == "__main__":
    main()

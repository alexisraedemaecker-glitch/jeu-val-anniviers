#!/usr/bin/env python3
"""Detecte les espaces avales par htm entre un texte et une expression.

Dans htm, un saut de ligne entre du texte et une expression ne produit aucun
espace : `Il reste\\n  ${n} points` s'affiche `Il reste700 points`. Le meme
probleme existe dans l'autre sens. C'est invisible a la relecture du code et
tres visible a l'ecran.

La regle sure est d'ecrire l'espace explicitement avec ${" "}, ou de garder le
texte et l'expression sur la meme ligne.

Ce controle ne regarde que l'interieur des gabarits html`...`, et uniquement
les frontieres entre du vrai texte affiche et une expression.

Usage : python3 tools/check_espaces.py
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def gabarits(src):
    """Renvoie (decalage, contenu) pour chaque html`...` du fichier."""
    out = []
    i = 0
    while True:
        d = src.find("html`", i)
        if d < 0:
            return out
        j = d + 5
        profondeur = 0
        while j < len(src):
            c = src[j]
            if c == "\\":
                j += 2
                continue
            if c == "$" and src[j + 1 : j + 2] == "{":
                profondeur += 1
                j += 2
                continue
            if c == "{" and profondeur:
                profondeur += 1
            elif c == "}" and profondeur:
                profondeur -= 1
            elif c == "`" and not profondeur:
                break
            j += 1
        out.append((d + 5, src[d + 5 : j]))
        i = j + 1


def morceaux(gab):
    """Decoupe un gabarit en textes et expressions, avec leur position."""
    res = []
    i = 0
    debut = 0
    while i < len(gab):
        if gab[i] == "\\":
            i += 2
            continue
        if gab[i] == "$" and gab[i + 1 : i + 2] == "{":
            res.append(("texte", debut, gab[debut:i]))
            p = 1
            j = i + 2
            while j < len(gab) and p:
                if gab[j] == "\\":
                    j += 2
                    continue
                if gab[j] == "{":
                    p += 1
                elif gab[j] == "}":
                    p -= 1
                j += 1
            res.append(("expr", i, gab[i:j]))
            i = debut = j
            continue
        i += 1
    res.append(("texte", debut, gab[debut:]))
    return res


# Un texte qui se termine par un mot, puis un saut de ligne : l'espace sautera.
FIN_MOT = re.compile(r"[\wéèêëàâäîïôöûüçÉÈÀÇ'’,.:;!?%)\]]\s*\n\s*$")
# Un texte qui commence par un mot apres un saut de ligne.
DEBUT_MOT = re.compile(r"^\s*\n\s*[\wéèêëàâäîïôöûüçÉÈÀÇ'’]")
# Un nom d'attribut suivi d'un egal : ce n'est pas du texte affiche.
ATTRIBUT = re.compile(r"^\s*[a-zA-Z][\w:-]*\s*=")
# Le premier litteral de l'expression commence par un espace : le rendu
# portera donc deja sa propre separation.
DEBUTE_PAR_ESPACE = re.compile(r'^\$\{[^`"\']*[`"\'] ')
# Le dernier litteral de l'expression se termine par un espace.
FINIT_PAR_ESPACE = re.compile(r' [`"\']\s*\}$')


def main():
    hits = []
    for f in sorted((ROOT / "js").rglob("*.js")):
        if "vendor" in f.parts or "data" in f.parts:
            continue
        src = f.read_text(encoding="utf-8")
        for decalage, gab in gabarits(src):
            ms = morceaux(gab)
            for k, (genre, pos, contenu) in enumerate(ms):
                if genre != "expr":
                    continue
                avant = ms[k - 1][2] if k else ""
                apres = ms[k + 1][2] if k + 1 < len(ms) else ""
                ligne = src[: decalage + pos].count("\n") + 1
                # Une expression qui sert de valeur d'attribut, ou qui est
                # suivie d'un autre attribut, n'affiche aucun texte.
                valeur_attribut = avant.rstrip().endswith("=")
                suivi_attribut = bool(ATTRIBUT.match(apres))
                # Une expression dont le resultat commence ou finit deja par un
                # espace n'a pas besoin qu'on en ajoute un.
                debute_espace = bool(DEBUTE_PAR_ESPACE.search(contenu))
                finit_espace = bool(FINIT_PAR_ESPACE.search(contenu))

                if (
                    FIN_MOT.search(avant)
                    and not avant.rstrip().endswith(">")
                    and not valeur_attribut
                    and not debute_espace
                ):
                    hits.append((f, ligne, "avant", avant.strip()[-52:], contenu[:44]))
                if (
                    DEBUT_MOT.match(apres)
                    and not apres.lstrip().startswith("<")
                    and not suivi_attribut
                    and not finit_espace
                ):
                    hits.append((f, ligne, "après", contenu[:44], apres.strip()[:52]))

    if not hits:
        print("Aucun espace avalé détecté dans les gabarits html.")
        return

    print(f"{len(hits)} endroit(s) où htm avalera l'espace :\n")
    for f, ligne, sens, a, b in hits:
        print(f"  {str(f.relative_to(ROOT)) + ':' + str(ligne):30} {sens}  …{a}  ⏎  {b}…")
    print('\nCorriger avec ${" "} avant le saut, ou tout garder sur une ligne.')
    sys.exit(1)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Repartit la bonne reponse de chaque question sur les quatre positions.

En ecrivant le catalogue, la bonne reponse s'est retrouvee presque toujours en
premiere position, ce qui permettait de gagner tous les quiz en cliquant
toujours la meme lettre. Ce script redistribue les positions et melange l'ordre
des mauvaises reponses.

Trois garanties :
  - repartition globale parfaitement equilibree entre A, B, C et D ;
  - aucun defi n'a toutes ses bonnes reponses a la meme position, sinon le
    schema se reperait en une question ;
  - resultat deterministe et idempotent : relancer le script ne rebrasse rien,
    et le tirage ne depend que du contenu des reponses, jamais de leur ordre
    actuel dans le fichier.

Seules les lignes options et answer sont reecrites, le reste du fichier n'est
pas touche.

Usage : python3 tools/shuffle_quiz.py [--verifier]
"""
import hashlib
import json
import random
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import jsdata  # noqa: E402

CIBLE = ROOT / "js" / "data" / "challenges.js"
GRAINE = 20560919

MOTIF = re.compile(
    r'("options":\s*)(\[[^\n]*?\])(,\s*\n\s*"answer":\s*)(\d+)',
    re.MULTILINE,
)


def graine_de(texte):
    """Graine stable, independante du hachage aleatoire de Python."""
    return int(hashlib.md5(texte.encode("utf-8")).hexdigest()[:8], 16)


def groupes():
    """Nombre de questions par defi, dans l'ordre du fichier."""
    return [len(c.get("quiz") or []) for c in jsdata.challenges()]


def repartir(n, tailles):
    """Positions cibles equilibrees, sans defi uniforme."""
    cibles = [i % 4 for i in range(n)]
    rng = random.Random(GRAINE)
    rng.shuffle(cibles)

    # Bornes de chaque defi dans la liste plate des questions.
    bornes = []
    d = 0
    for t in tailles:
        if t:
            bornes.append((d, d + t))
        d += t

    def uniforme(a, b):
        return b - a >= 2 and len(set(cibles[a:b])) == 1

    # Reparation par echanges : un echange preserve exactement la repartition
    # globale, il ne fait que deplacer une position d'une question a une autre.
    for _ in range(200):
        casses = [(a, b) for a, b in bornes if uniforme(a, b)]
        if not casses:
            break
        for a, b in casses:
            for i in range(a, b):
                partenaire = None
                for j in range(n):
                    if a <= j < b or cibles[j] == cibles[i]:
                        continue
                    # L'echange ne doit pas rendre le defi du partenaire uniforme.
                    cibles[i], cibles[j] = cibles[j], cibles[i]
                    ok = not uniforme(a, b) and not any(
                        uniforme(x, y) for x, y in bornes if x <= j < y
                    )
                    if ok:
                        partenaire = j
                        break
                    cibles[i], cibles[j] = cibles[j], cibles[i]
                if partenaire is not None:
                    break
    return cibles


def main():
    src = CIBLE.read_text(encoding="utf-8")
    blocs = list(MOTIF.finditer(src))
    if not blocs:
        sys.exit("Aucune question trouvée, le format du fichier a changé")
    n = len(blocs)
    tailles = groupes()
    if sum(tailles) != n:
        sys.exit(f"Incohérence : {n} questions dans le texte, {sum(tailles)} au parsing")

    if "--verifier" in sys.argv:
        pos = Counter(int(m.group(4)) for m in blocs)
        print(f"{n} questions")
        for i, lettre in enumerate("ABCD"):
            print(f"  {lettre} : {pos[i]:3} ({round(100 * pos[i] / n)} pourcent)")
        return

    cibles = repartir(n, tailles)

    resultat = []
    fin = 0
    for i, m in enumerate(blocs):
        options = json.loads(m.group(2))
        bonne = int(m.group(4))
        if not 0 <= bonne < len(options):
            sys.exit(f"Bonne réponse hors limites à la question {i + 1}")

        texte_bon = options[bonne]
        # On trie avant de tirer, pour que le resultat ne depende que du contenu
        # et jamais de l'ordre actuel : le script devient ainsi idempotent.
        mauvaises = sorted(o for j, o in enumerate(options) if j != bonne)
        random.Random(graine_de(texte_bon + "\u241f".join(mauvaises))).shuffle(mauvaises)

        cible = min(cibles[i], len(options) - 1)
        nouvelles = mauvaises[:]
        nouvelles.insert(cible, texte_bon)

        assert nouvelles[cible] == texte_bon
        assert sorted(nouvelles) == sorted(options), "une réponse a été perdue"

        resultat.append(src[fin:m.start()])
        resultat.append(
            m.group(1) + json.dumps(nouvelles, ensure_ascii=False) + m.group(3) + str(cible)
        )
        fin = m.end()

    resultat.append(src[fin:])
    CIBLE.write_text("".join(resultat), encoding="utf-8")

    pos = Counter(cibles)
    print(f"{n} questions réparties")
    for i, lettre in enumerate("ABCD"):
        print(f"  {lettre} : {pos[i]:3} ({round(100 * pos[i] / n)} pourcent)")


if __name__ == "__main__":
    main()

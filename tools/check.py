#!/usr/bin/env python3
"""Controles de coherence du catalogue, executes aussi en integration continue.

Verifie le bareme, la forme des quiz, la validite des declencheurs de synergie,
la presence de chaque style dans chaque pilier, et la regle de redaction qui
interdit les tirets dans les textes affiches aux joueurs.
"""
import sys
from collections import Counter, defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import jsdata  # noqa: E402

TIER_POINTS = {"decouverte": 10, "experience": 20, "mission": 30}
STYLES = ("chill", "culturel", "culinaire", "sportif")
# Champs techniques, ou les tirets des identifiants sont normaux.
TECHNICAL = {
    "id", "pillar", "style", "tier", "proof", "location_kind", "branch",
    "pillar_a", "pillar_b", "triggers_a", "triggers_b", "color", "icon", "short",
}

errors = []
warnings = []


def err(msg):
    errors.append(msg)


def strings(obj, path=""):
    if isinstance(obj, str):
        yield path, obj
    elif isinstance(obj, dict):
        for k, v in obj.items():
            if k in TECHNICAL:
                continue
            yield from strings(v, f"{path}/{k}")
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            yield from strings(v, f"{path}[{i}]")


pillars = jsdata.pillars()
challenges = jsdata.challenges()
synergies = jsdata.synergies()

pillar_ids = {p["id"] for p in pillars}
challenge_ids = {c["id"] for c in challenges}

# --- identifiants uniques ---------------------------------------------------
for name, rows in (("pilier", pillars), ("défi", challenges), ("synergie", synergies)):
    dupes = [k for k, v in Counter(r["id"] for r in rows).items() if v > 1]
    if dupes:
        err(f"Identifiants de {name} en double : {dupes}")

# --- defis ------------------------------------------------------------------
for c in challenges:
    tag = c["id"]
    if c["pillar"] not in pillar_ids:
        err(f"{tag} : pilier inconnu {c['pillar']!r}")
    if c["style"] not in STYLES:
        err(f"{tag} : style inconnu {c['style']!r}")
    if c["tier"] not in TIER_POINTS:
        err(f"{tag} : ampleur inconnue {c['tier']!r}")
    elif TIER_POINTS[c["tier"]] != c["points"]:
        err(f"{tag} : {c['points']} points pour une ampleur {c['tier']}, attendu {TIER_POINTS[c['tier']]}")
    if c["location_kind"] not in ("libre", "typee", "precise"):
        err(f"{tag} : localisation inconnue {c['location_kind']!r}")
    if c["proof"] not in ("photo", "quiz", "photo_quiz"):
        err(f"{tag} : type de preuve inconnu {c['proof']!r}")
    if c["proof"] in ("photo", "photo_quiz") and not c.get("photo_hint"):
        err(f"{tag} : preuve par photo sans consigne de photo")
    quiz = c.get("quiz") or []
    if c["proof"] in ("quiz", "photo_quiz"):
        if not 3 <= len(quiz) <= 4:
            err(f"{tag} : {len(quiz)} questions, la règle est de 3 à 4")
        for i, q in enumerate(quiz):
            if len(q.get("options", [])) != 4:
                err(f"{tag} question {i + 1} : il faut exactement 4 propositions")
            if not isinstance(q.get("answer"), int) or not 0 <= q["answer"] < len(q.get("options", [])):
                err(f"{tag} question {i + 1} : bonne réponse hors limites")
            if len(set(q.get("options", []))) != len(q.get("options", [])):
                err(f"{tag} question {i + 1} : propositions en double")
            if not q.get("why"):
                warnings.append(f"{tag} question {i + 1} : pas d'explication après la bonne réponse")
    for field in ("name", "brief", "savoir", "duration", "location_detail"):
        if not c.get(field):
            err(f"{tag} : champ {field} vide")

# --- synergies --------------------------------------------------------------
for s in synergies:
    tag = s["id"]
    for side in ("triggers_a", "triggers_b"):
        if not s.get(side):
            err(f"{tag} : {side} vide")
        for t in s.get(side, []):
            if t not in challenge_ids:
                err(f"{tag} : déclencheur inconnu {t!r} dans {side}")
    for side in ("pillar_a", "pillar_b"):
        if s[side] not in pillar_ids:
            err(f"{tag} : pilier inconnu {s[side]!r}")
    if s["pillar_a"] == s["pillar_b"]:
        err(f"{tag} : les deux piliers concernés sont identiques")
    if set(s["triggers_a"]) & set(s["triggers_b"]):
        err(f"{tag} : un même défi déclenche les deux côtés, la synergie serait immédiate")
    if not s.get("story"):
        err(f"{tag} : récit de déblocage manquant")

# --- densite par pilier et par style ---------------------------------------
grid = defaultdict(Counter)
for c in challenges:
    grid[c["pillar"]][c["style"]] += 1
for p in pillars:
    for st in STYLES:
        if grid[p["id"]][st] == 0:
            err(f"Pilier {p['id']} : aucun défi de style {st}")

# --- regle de redaction : aucun tiret dans les textes joueurs ---------------
for row in challenges + synergies + pillars:
    for path, text in strings(row):
        for dash in ("-", "–", "—"):
            if dash in text:
                err(f"{row['id']}{path} : tiret interdit dans un texte joueur → {text[:70]!r}")
                break

# --- rapport ----------------------------------------------------------------
print(f"{len(pillars)} piliers, {len(challenges)} défis, {len(synergies)} synergies")
total = sum(c["points"] for c in challenges)
by_pillar = Counter()
for c in challenges:
    by_pillar[c["pillar"]] += c["points"]
print("Points par pilier en un passage : " + ", ".join(f"{p['short']} {by_pillar[p['id']]}" for p in pillars))
print(f"Total catalogue : {total} points")

for w in warnings:
    print(f"  avertissement : {w}")

if errors:
    print(f"\n{len(errors)} erreur(s) :")
    for e in errors:
        print(f"  - {e}")
    sys.exit(1)

print("\nTous les contrôles passent.")

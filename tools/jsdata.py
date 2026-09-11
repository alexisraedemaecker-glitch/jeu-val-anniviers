#!/usr/bin/env python3
"""Relit les blocs JSON contenus dans les modules js/data/*.js.

Les fichiers de donnees du front end sont volontairement du JSON strict
encadre par `export const NOM = [...];` afin qu'un seul fichier serve de
source de verite a la fois pour le navigateur et pour le seed SQL.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def load(module: str, name: str):
    src = (ROOT / "js" / "data" / module).read_text(encoding="utf-8")
    m = re.search(r"export\s+const\s+" + re.escape(name) + r"\s*=[^\[]*(\[)", src)
    if not m:
        raise SystemExit(f"{name} introuvable dans {module}")
    start = m.start(1)
    # On enleve les commentaires avant de compter les crochets.
    rest = src[start:]
    rest = re.sub(r"/\*.*?\*/", "", rest, flags=re.S)
    rest = re.sub(r"^[ \t]*//.*$", "", rest, flags=re.M)
    depth = 0
    end = None
    in_str = False
    esc = False
    for i, ch in enumerate(rest):
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                in_str = False
            continue
        if ch == '"':
            in_str = True
        elif ch == "[":
            depth += 1
        elif ch == "]":
            depth -= 1
            if depth == 0:
                end = i + 1
                break
    if end is None:
        raise SystemExit(f"Bloc JSON non ferme pour {name}")
    return json.loads(rest[:end])


def challenges():
    return load("challenges.js", "CHALLENGES")


def pillars():
    return load("pillars.js", "PILLARS")


def synergies():
    return load("synergies.js", "SYNERGIES")


def sql_str(v):
    if v is None:
        return "null"
    return "'" + str(v).replace("'", "''") + "'"


def sql_arr(vals):
    return "array[" + ", ".join(sql_str(v) for v in vals) + "]::text[]"

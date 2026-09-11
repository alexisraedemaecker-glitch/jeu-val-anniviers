#!/usr/bin/env python3
"""Remet le jeu a zero avant l'evenement.

Efface tous les profils, toutes les soumissions et toutes les photos, sans
toucher au catalogue des defis, aux synergies ni au code organisateur. A lancer
une fois les essais termines, la veille ou le matin meme.

Usage : python3 tools/reset_jour_j.py --confirmer
"""
import json
import ssl
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
import apply_sql  # noqa: E402


def cfg():
    values = {}
    for line in (ROOT.parent / ".env").read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            values[k.strip()] = v.strip()
    return values


def etat():
    ok, rows = apply_sql.run(
        "select (select count(*) from public.participants) as joueurs, "
        "(select count(*) from public.submissions) as soumissions, "
        "(select count(*) from storage.objects where bucket_id='preuves') as photos, "
        "(select coalesce(sum(points),0) from public.v_pillar_gauges) as jauges;"
    )
    return rows[0] if ok else None


avant = etat()
if not avant:
    sys.exit("Impossible de lire l'état de la base")

print("État actuel :")
print(f"  {avant['joueurs']} joueur(s), {avant['soumissions']} soumission(s), "
      f"{avant['photos']} photo(s), {avant['jauges']} point(s) de jauge")

if "--confirmer" not in sys.argv:
    print("\nRien n'a été touché.")
    print("Pour effacer réellement : python3 tools/reset_jour_j.py --confirmer")
    sys.exit(0)

C = cfg()
ctx = ssl.create_default_context()
try:
    import certifi

    ctx = ssl.create_default_context(cafile=certifi.where())
except Exception:
    pass

# Photos d'abord : Supabase interdit la suppression directe en SQL dans le
# stockage, il faut passer par son API.
ok, rows = apply_sql.run("select name from storage.objects where bucket_id='preuves';")
names = [r["name"] for r in rows] if ok else []
if names:
    req = urllib.request.Request(
        C["SUPABASE_URL"] + "/storage/v1/object/preuves",
        data=json.dumps({"prefixes": names}).encode(),
        method="DELETE",
        headers={
            "apikey": C["SUPABASE_SECRET_KEY"],
            "Authorization": "Bearer " + C["SUPABASE_SECRET_KEY"],
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=120, context=ctx) as r:
        print(f"  {len(names)} photo(s) supprimée(s) ({r.status})")

# Supprimer les participants efface en cascade soumissions, membres et synergies.
ok, res = apply_sql.run("delete from public.participants;")
if not ok:
    sys.exit(f"Échec de la suppression : {res}")

apres = etat()
print("\nAprès remise à zéro :")
print(f"  {apres['joueurs']} joueur(s), {apres['soumissions']} soumission(s), "
      f"{apres['photos']} photo(s), {apres['jauges']} point(s) de jauge")

ok, rows = apply_sql.run(
    "select (select count(*) from public.challenges) as defis, "
    "(select count(*) from public.synergies) as synergies, "
    "(select count(*) from public.app_settings) as reglages;"
)
if ok:
    r = rows[0]
    print(f"  Catalogue intact : {r['defis']} défis, {r['synergies']} synergies, "
          f"code organisateur conservé")
print("\nLe jeu est prêt pour une nouvelle journée.")

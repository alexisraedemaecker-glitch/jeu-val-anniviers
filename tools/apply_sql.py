#!/usr/bin/env python3
"""Applique les fichiers SQL du dossier supabase/ au projet Supabase.

Utilise l'API de gestion Supabase, qui demande un jeton d'acces personnel.
Le jeton est lu dans .env (SUPABASE_ACCESS_TOKEN), fichier exclu du depot.

Usage :
    python3 tools/apply_sql.py            # applique tous les fichiers dans l'ordre
    python3 tools/apply_sql.py 02 03      # applique seulement ceux dont le nom commence ainsi
    python3 tools/apply_sql.py --sql "select 1"   # execute une requete ponctuelle
"""
import json
import ssl
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def ssl_context():
    """Certains Python installes depuis python.org n'ont pas de magasin de
    certificats configure. On se rabat sur celui fourni par certifi."""
    try:
        import certifi

        return ssl.create_default_context(cafile=certifi.where())
    except Exception:
        return ssl.create_default_context()


CTX = ssl_context()


def env():
    values = {}
    path = ROOT / ".env"
    if path.exists():
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            values[k.strip()] = v.strip()
    return values


CFG = env()
TOKEN = CFG.get("SUPABASE_ACCESS_TOKEN", "")
REF = CFG.get("SUPABASE_PROJECT_REF", "")

if not REF:
    sys.exit("SUPABASE_PROJECT_REF manquant dans .env")
if not TOKEN:
    sys.exit(
        "SUPABASE_ACCESS_TOKEN manquant dans .env.\n"
        "Créez un jeton sur https://supabase.com/dashboard/account/tokens "
        "puis ajoutez la ligne SUPABASE_ACCESS_TOKEN=sbp_... dans .env"
    )

API = f"https://api.supabase.com/v1/projects/{REF}/database/query"


def run(sql):
    body = json.dumps({"query": sql}).encode("utf-8")
    req = urllib.request.Request(
        API,
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=180, context=CTX) as resp:
            raw = resp.read().decode("utf-8")
            return True, (json.loads(raw) if raw.strip() else [])
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "replace")
        try:
            detail = json.loads(detail).get("message", detail)
        except Exception:
            pass
        return False, f"HTTP {e.code} : {detail}"
    except Exception as e:  # reseau, delai
        return False, str(e)


def main():
    args = [a for a in sys.argv[1:]]
    if args and args[0] == "--sql":
        ok, res = run(" ".join(args[1:]))
        print(json.dumps(res, indent=2, ensure_ascii=False) if ok else res)
        sys.exit(0 if ok else 1)

    files = sorted(p for p in (ROOT / "supabase").glob("*.sql"))
    if args:
        files = [p for p in files if any(p.name.startswith(a) for a in args)]
    if not files:
        sys.exit("Aucun fichier SQL à appliquer")

    failed = 0
    for path in files:
        sql = path.read_text(encoding="utf-8")
        ok, res = run(sql)
        if ok:
            print(f"  ✓ {path.name}")
        else:
            failed += 1
            print(f"  ✗ {path.name}\n      {res}")
    print()
    if failed:
        print(f"{failed} fichier(s) en échec")
        sys.exit(1)
    print(f"{len(files)} fichier(s) appliqués avec succès")


if __name__ == "__main__":
    main()

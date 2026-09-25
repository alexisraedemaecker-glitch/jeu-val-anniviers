#!/usr/bin/env python3
"""Recupere tout l'etat final du jeu par l'API REST, dans des fichiers JSON."""
import json, os, ssl, urllib.request
from pathlib import Path

ROOT = Path("/Users/alexisraedemaecker/Documents/jeu-val-anniviers")
OUT = Path("/private/tmp/claude-502/-Users-alexisraedemaecker-Documents-jeu-val-anniviers/a81246fe-839c-4a6e-970e-035f3d0166ab/scratchpad/album")
OUT.mkdir(parents=True, exist_ok=True)

env = {}
for line in (ROOT / ".env").read_text().splitlines():
    if "=" in line and not line.strip().startswith("#"):
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip()

URL = env["SUPABASE_URL"]
KEY = env["SUPABASE_SECRET_KEY"]
try:
    import certifi
    CTX = ssl.create_default_context(cafile=certifi.where())
except Exception:
    CTX = ssl.create_default_context()

def get(path):
    req = urllib.request.Request(f"{URL}/rest/v1/{path}",
        headers={"apikey": KEY, "Authorization": f"Bearer {KEY}", "Accept": "application/json"})
    with urllib.request.urlopen(req, context=CTX, timeout=60) as r:
        return json.load(r)

tables = {
  "scores": "v_personal_scores?select=*&order=score.desc",
  "feed": "v_feed?select=*&order=created_at.asc",
  "posts": "v_posts?select=*&order=created_at.asc",
  "participants": "participants?select=*&order=created_at.asc",
  "lockouts": "quiz_lockouts?select=*&order=created_at.asc",
  "unlocks": "synergy_unlocks?select=*&order=created_at.asc",
  "gauges": "v_pillar_gauges?select=*",
  "collectif": "v_collective_status?select=*",
  "stats": "v_challenge_stats?select=*",
  "commentaires": "post_comments?select=*&order=created_at.asc",
  "cornes": "post_kudos?select=*",
  "reactions": "comment_reactions?select=*",
  "submissions": "submissions?select=*&order=created_at.asc",
  "membres": "submission_members?select=*",
}
for nom, q in tables.items():
    d = get(q)
    (OUT / f"{nom}.json").write_text(json.dumps(d, ensure_ascii=False, indent=1))
    print(f"{nom:14} {len(d) if isinstance(d, list) else 1}")

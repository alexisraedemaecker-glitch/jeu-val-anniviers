"""Associe chaque photo a son contexte : defi, auteur, heure, groupe present."""
import json
from pathlib import Path
SC = Path("/private/tmp/claude-502/-Users-alexisraedemaecker-Documents-jeu-val-anniviers/a81246fe-839c-4a6e-970e-035f3d0166ab/scratchpad")
A = SC/"album"
parts = {p['id']: f"{p['first_name']} {p['last_name']}" for p in json.load(open(A/"participants.json"))}
subs = json.load(open(A/"submissions.json"))
posts = json.load(open(A/"posts.json"))
membres = {}
for m in json.load(open(A/"membres.json")):
    membres.setdefault(m['submission_id'], []).append(parts.get(m['participant_id'],'?'))
import re
src = (Path("/Users/alexisraedemaecker/Documents/jeu-val-anniviers")/"js/data/challenges.js").read_text()
blocs = re.findall(r'\n  \{\n(.*?)\n  \}', src, re.S)
defis = {}
for b in blocs:
    m = re.search(r'"id": "([^"]+)"', b)
    if not m: continue
    g = lambda k: (re.search(r'"%s": "((?:[^"\\]|\\.)*)"' % k, b) or [None,None])[1]
    quiz = []
    for q in re.finditer(r'\{\s*"q": "((?:[^"\\]|\\.)*)",\s*"options": \[(.*?)\],\s*"answer": (\d+),\s*"why": "((?:[^"\\]|\\.)*)"', b, re.S):
        opts = re.findall(r'"((?:[^"\\]|\\.)*)"', q.group(2))
        quiz.append({"q": q.group(1), "options": opts, "answer": int(q.group(3)), "why": q.group(4)})
    defis[m.group(1)] = {"id": m.group(1), "name": g("name"), "pillar": g("pillar"), "style": g("style"),
                         "points": int(re.search(r'"points": (\d+)', b).group(1)),
                         "savoir": g("savoir"), "brief": g("brief"), "quiz": quiz,
                         "photo_hint": g("photo_hint")}
json.dump(defis, open(SC/"defis.json","w"), ensure_ascii=False, indent=1)

idx = {}
for s in subs:
    if not s.get('photo_path'): continue
    d = defis.get(s['challenge_id'], {})
    idx["src_app__"+Path(s['photo_path']).stem] = {
        "fichier": s['photo_path'], "genre": "defi", "defi": d.get('name', s['challenge_id']),
        "defi_id": s['challenge_id'], "pilier": d.get('pillar'), "points": d.get('points'),
        "qui": parts.get(s['submitter_id'],'?'), "groupe": membres.get(s['id'], []),
        "quand": s['created_at'], "note": s.get('note') or ""}
for p in posts:
    if not p.get('photo_path') or p.get('genre') != 'libre': continue
    idx["src_app__"+Path(p['photo_path']).stem] = {
        "fichier": p['photo_path'], "genre": "libre", "defi": None,
        "qui": p.get('author_name','?'), "groupe": [], "quand": p['created_at'],
        "note": p.get('texte') or "", "cornes": len(p.get('kudos_ids') or [])}
json.dump(idx, open(SC/"index_photos.json","w"), ensure_ascii=False, indent=1)
print(len(defis), "defis,", len(idx), "photos de l'app indexees")

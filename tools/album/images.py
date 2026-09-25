"""Fabrique les images finales de l'album, en taille web."""
import json, subprocess, sys
from pathlib import Path
sys.path.insert(0, "/private/tmp/claude-502/-Users-alexisraedemaecker-Documents-jeu-val-anniviers/a81246fe-839c-4a6e-970e-035f3d0166ab/scratchpad")
from selection import CHAPITRES, ECARTES

SC = Path("/private/tmp/claude-502/-Users-alexisraedemaecker-Documents-jeu-val-anniviers/a81246fe-839c-4a6e-970e-035f3d0166ab/scratchpad")
PROJ = Path("/Users/alexisraedemaecker/Documents/jeu-val-anniviers")
OUT = PROJ/"album"/"photos"
OUT.mkdir(parents=True, exist_ok=True)

ordre = json.load(open(SC/"ordre_vue.json"))
def source(n):
    v = ordre[n-1]
    if v.startswith("src_app__"):
        base = v[len("src_app__"):-4]
        for p in sorted((SC/"src_app").iterdir()):
            if p.stem == base and p.suffix.lower() in (".jpg",".jpeg",".png",".webp"): return p
    else:
        base = v[len("src_folder__"):-4]
        for p in (SC/"src_folder").iterdir():
            if p.stem == base: return p
    return None

retenus = []
for cle, _, _, nums in CHAPITRES:
    for n in nums:
        if n in ECARTES: continue
        if n in retenus: continue
        retenus.append(n)

faits = {}
for n in retenus:
    s = source(n)
    if not s: print("SOURCE MANQUANTE", n); continue
    dest = OUT/f"p{n:03d}.jpg"
    if not dest.exists():
        subprocess.run(["sips","-s","format","jpeg","-s","formatOptions","55","-Z","1280",
                        str(s),"--out",str(dest)], capture_output=True)
    info = subprocess.run(["sips","-g","pixelWidth","-g","pixelHeight",str(dest)],
                          capture_output=True, text=True).stdout
    w=h=0
    for l in info.splitlines():
        if "pixelWidth" in l: w=int(l.split(":")[1])
        if "pixelHeight" in l: h=int(l.split(":")[1])
    faits[n] = {"fichier": dest.name, "w": w, "h": h, "octets": dest.stat().st_size}
json.dump(faits, open(SC/"images_finales.json","w"), indent=1)
total = sum(v["octets"] for v in faits.values())
print(f"{len(faits)} images, {total/1024/1024:.1f} Mo, moyenne {total/len(faits)/1024:.0f} ko")

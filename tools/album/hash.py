"""Empreinte perceptive de chaque image, pour reperer les doublons.

Pas de bibliotheque d'images ici : sips fabrique une vignette PNG 32x32, et un
decodeur PNG en Python pur la relit. La comparaison se fait ensuite sur la
moyenne des lignes et des colonnes, ce qui reste juste meme quand deux appareils
ont cadre la meme scene avec une exposition differente.
"""
import json, struct, subprocess, sys, zlib
from pathlib import Path
import numpy as np

SC = Path("/private/tmp/claude-502/-Users-alexisraedemaecker-Documents-jeu-val-anniviers/a81246fe-839c-4a6e-970e-035f3d0166ab/scratchpad")
TMP = SC/"vignettes"; TMP.mkdir(exist_ok=True)

def png_lire(p):
    d = p.read_bytes(); i = 8; w=h=None; idat=b""; depth=None; ctype=None
    while i < len(d):
        ln = struct.unpack(">I", d[i:i+4])[0]; typ = d[i+4:i+8]; dat = d[i+8:i+8+ln]
        if typ == b"IHDR":
            w,h,depth,ctype = struct.unpack(">IIBB", dat[:10])
        elif typ == b"IDAT": idat += dat
        elif typ == b"IEND": break
        i += 12+ln
    raw = zlib.decompress(idat)
    canaux = {0:1, 2:3, 4:2, 6:4}[ctype]
    bpp = canaux*(depth//8)
    stride = w*bpp
    out = np.zeros((h, stride), dtype=np.uint8)
    pos = 0; prev = np.zeros(stride, dtype=np.uint8)
    for y in range(h):
        f = raw[pos]; pos += 1
        ligne = np.frombuffer(raw[pos:pos+stride], dtype=np.uint8).astype(np.int32).copy(); pos += stride
        if f == 1:
            for x in range(bpp, stride): ligne[x] = (ligne[x] + ligne[x-bpp]) & 255
        elif f == 2:
            ligne = (ligne + prev) & 255
        elif f == 3:
            for x in range(stride):
                a = ligne[x-bpp] if x >= bpp else 0
                ligne[x] = (ligne[x] + ((a + prev[x]) >> 1)) & 255
        elif f == 4:
            for x in range(stride):
                a = ligne[x-bpp] if x >= bpp else 0
                b = prev[x]; c = prev[x-bpp] if x >= bpp else 0
                pp = a+b-c; pa=abs(pp-a); pb=abs(pp-b); pc=abs(pp-c)
                pr = a if (pa<=pb and pa<=pc) else (b if pb<=pc else c)
                ligne[x] = (ligne[x] + pr) & 255
        prev = ligne.astype(np.uint8)
        out[y] = prev
    img = out.reshape(h, w, canaux)[:, :, :3].astype(np.float64)
    if canaux < 3: img = np.repeat(out.reshape(h,w,canaux)[:,:,:1].astype(np.float64), 3, axis=2)
    return img.mean(axis=2)

def empreinte(src):
    nom = src.stem + "-" + str(abs(hash(str(src))) % 10**8)
    v = TMP/(nom+".png")
    if not v.exists():
        subprocess.run(["sips","-s","format","png","-z","32","32",str(src),"--out",str(v)],
                       capture_output=True)
    if not v.exists(): return None
    try: g = png_lire(v)
    except Exception: return None
    # dHash horizontal et vertical : robuste aux differences d'exposition.
    dh = (g[:, 1:] > g[:, :-1]).flatten()
    dv = (g[1:, :] > g[:-1, :]).flatten()
    return np.concatenate([dh, dv])

if __name__ == "__main__":
    res = {}
    for dossier, etiquette in ((SC/"src_app", "app"), (SC/"src_folder", "dossier")):
        for f in sorted(dossier.iterdir()):
            if f.suffix.lower() in (".mov",".mp4",".webm"): continue
            e = empreinte(f)
            if e is None: print("illisible :", f.name); continue
            info = subprocess.run(["sips","-g","pixelWidth","-g","pixelHeight",str(f)],
                                  capture_output=True, text=True).stdout
            w = h = 0
            for l in info.splitlines():
                if "pixelWidth" in l: w = int(l.split(":")[1])
                if "pixelHeight" in l: h = int(l.split(":")[1])
            res[str(f)] = {"src": etiquette, "e": e.astype(np.uint8).tolist(),
                           "w": w, "h": h, "octets": f.stat().st_size}
            print(".", end="", flush=True)
    json.dump(res, open(SC/"empreintes.json","w"))
    print(f"\n{len(res)} empreintes")

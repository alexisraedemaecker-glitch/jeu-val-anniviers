#!/usr/bin/env python3
"""Lit les fichiers GPX du dossier Randos et en derive tout ce qui est affichable.

Distance, denivele, altitudes, duree estimee, profil altimetrique et trace,
les deux dessines en SVG a partir des seules donnees du fichier. Aucune image
exterieure n'est recopiee.

Usage :
    python3 tools/gpx.py            # resume a l'ecran
    python3 tools/gpx.py --build    # ecrit assets/randos/ et js/data/randos.js
"""
import hashlib
import json
import math
import re
import shutil
import sys
import unicodedata
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "Randos"
OUT_ASSETS = ROOT / "assets" / "randos"
OUT_PHOTOS = ROOT / "assets" / "photos" / "randos"
NS = {"g": "http://www.topografix.com/GPX/1/1"}

IMAGES = (".jpg", ".jpeg", ".png", ".webp", ".avif")
LARGEUR_MAX = 1100
QUALITE = 58

# Certains fichiers GPX portent un nom technique. On les renomme pour
# l'affichage et pour le nom du fichier telechargeable.
NOMS = {
    "from Zinal to Cabane d'Arpitettaz": "Zinal › Cabane d'Arpitettaz",
    "Cabane Illhorn - Pas de l’Illsee - Illsee - Lac Noir - Tsapé":
        "Cabane Illhorn › Pas de l'Illsee › Lac Noir › Tsapé",
}

# Legendes des photos, deduites du nom de fichier. Celles qui sortent mal
# sont corrigees ici.
LEGENDES = {
    "zinal-village-2-sierre-anniviers-marketing-s": "Le village de Zinal",
    "lac-de-chateaupre": "Le lac de Chateaupré",
    "cabane-petit-mountet": "La Cabane du Petit Mountet",
    "illhorn": "L'Illhorn",
    "illhorn2": "L'Illhorn",
    "illhorn-et": "L'Illhorn",
    "moiry-longit": "Le lac de Moiry",
    "chateaupre2": "Le lac de Chateaupré",
    "tracuit2": "La Cabane de Tracuit",
    "tracuit3": "Vers la Cabane de Tracuit",
    "tracuit4": "La Cabane de Tracuit",
    "arpitettaz1": "La Cabane d'Arpitettaz",
    "arpitettaz2": "Vers la Cabane d'Arpitettaz",
    "arpitettaz3": "La Cabane d'Arpitettaz",
    "grand-mountet": "La Cabane du Grand Mountet",
    "grand-mountet-2": "Vers le Grand Mountet",
    "grand-mountet-3": "Le cirque du Grand Mountet",
    "roc-de-la-vache-1": "Le Roc de la Vache",
    "roc-de-la-vache-2": "Depuis le Roc de la Vache",
    "roc-de-la-vache3": "Le Roc de la Vache",
    "becs-de-bosson": "Les Becs de Bosson",
    "cabane-des-becs-de-bosson": "La Cabane des Becs de Bosson",
    "lac-de-lona": "Le lac de Lona",
    "lac-de-touno": "Le lac du Touno",
    "le-touno": "Le Touno",
    "le-prilet": "Le Prillet",
    "le-tsape": "Le Tsapé",
    "pas-de-l-illsee": "Le Pas de l'Illsee",
    "lac-noir": "Le Lac Noir",
    "cabane-illhorn": "La Cabane Illhorn",
    "hotel-weisshorn": "L'Hôtel Weisshorn",
    "vue-hotel-weisshorn": "La vue depuis l'Hôtel Weisshorn",
    "espace-weisshorn-int": "L'Espace Weisshorn",
    "cabane-du-petit-mountet": "La Cabane du Petit Mountet",
    "cabane-de-moiry-interieur": "L'intérieur de la Cabane de Moiry",
    "cabane-de-moiry-vue": "La vue depuis la Cabane de Moiry",
    "cabane-de-tracuit": "La Cabane de Tracuit",
    "barrage-de-moiry": "Le barrage de Moiry",
    "lac-de-moiry": "Le lac de Moiry",
    "plat-de-la-lee": "Le Plat de la Lée",
    "corne-de-sorebois": "La Corne de Sorebois",
    "bendolla": "Bendolla",
    "tignousa": "Tignousa",
}


def slug(texte):
    t = unicodedata.normalize("NFKD", texte)
    t = "".join(c for c in t if not unicodedata.combining(c))
    t = t.lower().replace("’", " ").replace("'", " ")
    t = re.sub(r"[^a-z0-9]+", "-", t).strip("-")
    return re.sub(r"-{2,}", "-", t)


def haversine(a, b):
    """Distance en metres entre deux points (lat, lon)."""
    R = 6371008.8
    p1, p2 = math.radians(a[0]), math.radians(b[0])
    dp = p2 - p1
    dl = math.radians(b[1] - a[1])
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(h))


def lisser(valeurs, fenetre=5):
    """Moyenne glissante, pour que le bruit GPS ne gonfle pas le denivele."""
    if len(valeurs) < fenetre:
        return valeurs[:]
    out = []
    demi = fenetre // 2
    for i in range(len(valeurs)):
        a = max(0, i - demi)
        b = min(len(valeurs), i + demi + 1)
        out.append(sum(valeurs[a:b]) / (b - a))
    return out


def duree_din33466(distance_m, montee_m, descente_m):
    """Temps de marche selon la methode du Club Alpin, dite DIN 33466.

    On calcule separement le temps horizontal (4 km/h), le temps de montee
    (300 m/h) et le temps de descente (500 m/h), puis on additionne le plus
    grand des deux verticaux avec la moitie du plus petit, et on ajoute
    l'horizontal. C'est la regle utilisee sur les panneaux suisses.
    """
    h_horiz = (distance_m / 1000) / 4.0
    h_mont = (montee_m / 300.0) if montee_m else 0.0
    h_desc = (descente_m / 500.0) if descente_m else 0.0
    vertical = max(h_mont, h_desc) + min(h_mont, h_desc) / 2
    return h_horiz + vertical


def difficulte(distance_m, montee_m, alt_max):
    """Niveau indicatif, derive des chiffres du parcours."""
    km = distance_m / 1000
    if montee_m < 400 and km < 9:
        return ("facile", "Peu de dénivelé, à la portée de tout le monde avec de bonnes chaussures.")
    if montee_m < 900 and km < 16:
        return ("moyenne", "Une vraie sortie de montagne, il faut être un peu habitué à marcher.")
    return ("exigeante", "Grosse journée, dénivelé important. Partez tôt et prévoyez de l'eau.")


def lire(path):
    arbre = ET.parse(path)
    racine = arbre.getroot()

    nom = racine.findtext("g:metadata/g:name", default="", namespaces=NS)
    if not nom:
        nom = racine.findtext("g:trk/g:name", default=path.stem, namespaces=NS)
    nom = nom.replace(">", "›").strip()
    nom = NOMS.get(nom, nom)

    pts = []
    for trkpt in racine.iterfind(".//g:trkpt", NS):
        lat = float(trkpt.get("lat"))
        lon = float(trkpt.get("lon"))
        ele = trkpt.findtext("g:ele", namespaces=NS)
        pts.append((lat, lon, float(ele) if ele else 0.0))

    if len(pts) < 2:
        raise SystemExit(f"{path.name} : pas assez de points")

    waypoints = []
    for wpt in racine.iterfind("g:wpt", NS):
        waypoints.append(
            {
                "nom": wpt.findtext("g:name", default="", namespaces=NS),
                "lat": float(wpt.get("lat")),
                "lon": float(wpt.get("lon")),
            }
        )

    # Distance cumulee
    cumul = [0.0]
    for i in range(1, len(pts)):
        cumul.append(cumul[-1] + haversine(pts[i - 1][:2], pts[i][:2]))
    distance = cumul[-1]

    # Denivele, sur les altitudes lissees et avec un seuil, sinon le bruit
    # GPS ajoute des centaines de metres imaginaires.
    alts = lisser([p[2] for p in pts], 7)
    montee = descente = 0.0
    seuil = 1.5
    ref = alts[0]
    for a in alts[1:]:
        d = a - ref
        if d > seuil:
            montee += d
            ref = a
        elif d < -seuil:
            descente += -d
            ref = a

    boucle = haversine(pts[0][:2], pts[-1][:2]) < 250
    niveau, niveau_txt = difficulte(distance, montee, max(alts))

    return {
        "fichier": path.name,
        "dossier": path.parent,
        "nom": nom,
        "points": pts,
        "cumul": cumul,
        "alts": alts,
        "waypoints": waypoints,
        "distance_m": round(distance),
        "montee_m": round(montee),
        "descente_m": round(descente),
        "alt_min": round(min(alts)),
        "alt_max": round(max(alts)),
        "depart": {"lat": pts[0][0], "lon": pts[0][1], "alt": round(alts[0])},
        "arrivee": {"lat": pts[-1][0], "lon": pts[-1][1], "alt": round(alts[-1])},
        "boucle": boucle,
        "heures": round(duree_din33466(distance, montee, descente), 2),
        "niveau": niveau,
        "niveau_texte": niveau_txt,
    }


# ------------------------------------------------------------------- photos


def legende_de(nom_fichier):
    """Legende lisible, deduite du nom de fichier puis corrigee si besoin."""
    base = Path(nom_fichier).stem
    base = re.sub(r"\s*copie\s*$", "", base, flags=re.I)
    cle = slug(base)
    if cle in LEGENDES:
        return LEGENDES[cle]
    # Repli : on nettoie le nom de fichier
    txt = re.sub(r"[-_]+", " ", base).strip()
    txt = re.sub(r"\s+", " ", txt)
    return txt[:1].upper() + txt[1:] if txt else "Photo"


def redimensionner(src, dst):
    """Reduit et recompresse une image avec l'outil integre de macOS.

    sips ne sait pas lire l'AVIF, qui est de toute facon deja tres compact :
    ces fichiers la sont copies tels quels. Tous les navigateurs de telephone
    recents les affichent.
    """
    import subprocess

    if src.suffix.lower() == ".avif":
        shutil.copy(src, dst.with_suffix(".avif"))
        return dst.with_suffix(".avif")
    r = subprocess.run(
        ["sips", "-Z", str(LARGEUR_MAX), "-s", "format", "jpeg",
         "-s", "formatOptions", str(QUALITE), str(src), "--out", str(dst)],
        capture_output=True,
    )
    if r.returncode != 0 or not dst.exists():
        shutil.copy(src, dst)
    return dst


def photos_de(dossier, vues):
    """Photos d'un dossier de randonnee, dedupliquees par contenu.

    Une meme photo peut illustrer deux randonnees : elle n'est stockee qu'une
    fois sur le disque, mais reste listee dans les deux fiches.
    """
    sorties = []
    for f in sorted(dossier.iterdir()):
        if f.suffix.lower() not in IMAGES or f.name.startswith("."):
            continue
        digest = hashlib.md5(f.read_bytes()).hexdigest()[:10]
        if digest in vues:
            chemin = vues[digest]
        else:
            cible = OUT_PHOTOS / f"{digest}{'.avif' if f.suffix.lower() == '.avif' else '.jpg'}"
            ecrit = redimensionner(f, cible)
            chemin = f"assets/photos/randos/{ecrit.name}"
            vues[digest] = chemin
        sorties.append({"src": chemin, "legende": legende_de(f.name)})
    # Le meme fichier deux fois dans une fiche n'apporte rien
    uniques, dejavu = [], set()
    for p in sorties:
        if p["src"] in dejavu:
            continue
        dejavu.add(p["src"])
        uniques.append(p)
    # Plusieurs vues du meme sujet : on numerote pour ne pas repeter le
    # meme mot trois fois de suite sous trois photos differentes.
    compte = {}
    for p in uniques:
        compte[p["legende"]] = compte.get(p["legende"], 0) + 1
    vu = {}
    for p in uniques:
        if compte[p["legende"]] > 1:
            vu[p["legende"]] = vu.get(p["legende"], 0) + 1
            p["legende"] = f"{p['legende']} ({vu[p['legende']]})"
    return uniques


# ------------------------------------------------------------------ dessins


def svg_profil(r, largeur=680, hauteur=200):
    """Profil altimetrique, dessine a partir des seules donnees du GPX."""
    mg, mh, mb, md = 46, 14, 26, 10
    w = largeur - mg - md
    h = hauteur - mh - mb
    dmax = r["cumul"][-1] or 1
    amin, amax = min(r["alts"]), max(r["alts"])
    marge = max(40, (amax - amin) * 0.12)
    a0, a1 = amin - marge, amax + marge
    span = (a1 - a0) or 1

    def x(d):
        return mg + (d / dmax) * w

    def y(a):
        return mh + h - ((a - a0) / span) * h

    # On echantillonne pour garder un fichier leger
    pas = max(1, len(r["cumul"]) // 420)
    idx = list(range(0, len(r["cumul"]), pas))
    if idx[-1] != len(r["cumul"]) - 1:
        idx.append(len(r["cumul"]) - 1)

    ligne = " ".join(f"{x(r['cumul'][i]):.1f},{y(r['alts'][i]):.1f}" for i in idx)
    aire = f"{mg},{mh + h} {ligne} {mg + w},{mh + h}"

    # Graduations d'altitude, arrondies a la centaine
    pas_alt = 500 if span > 1600 else 200 if span > 700 else 100
    grads = []
    a = math.ceil(a0 / pas_alt) * pas_alt
    while a < a1:
        grads.append(a)
        a += pas_alt

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {largeur} {hauteur}" '
        f'role="img" aria-label="Profil altimétrique de {r["nom"]}">',
        '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">'
        '<stop offset="0" stop-color="#4a7fb5" stop-opacity=".55"/>'
        '<stop offset="1" stop-color="#4a7fb5" stop-opacity=".06"/></linearGradient></defs>',
    ]
    for a in grads:
        parts.append(
            f'<line x1="{mg}" y1="{y(a):.1f}" x2="{mg + w}" y2="{y(a):.1f}" '
            f'stroke="#d9d3c7" stroke-width="1"/>'
        )
        parts.append(
            f'<text x="{mg - 6}" y="{y(a) + 4:.1f}" text-anchor="end" '
            f'font-size="11" fill="#7c8a97">{int(a)}</text>'
        )
    parts.append(f'<polygon points="{aire}" fill="url(#g)"/>')
    parts.append(
        f'<polyline points="{ligne}" fill="none" stroke="#1d3b57" '
        f'stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>'
    )
    # Reperes de distance
    km_total = dmax / 1000
    pas_km = 1 if km_total <= 8 else 2 if km_total <= 18 else 5
    k = pas_km
    while k < km_total:
        parts.append(
            f'<text x="{x(k * 1000):.1f}" y="{hauteur - 8}" text-anchor="middle" '
            f'font-size="11" fill="#7c8a97">{k} km</text>'
        )
        k += pas_km
    parts.append(
        f'<circle cx="{x(0):.1f}" cy="{y(r["alts"][0]):.1f}" r="4" fill="#1f7a4d"/>'
    )
    parts.append(
        f'<circle cx="{x(dmax):.1f}" cy="{y(r["alts"][-1]):.1f}" r="4" fill="#a32b2b"/>'
    )
    parts.append("</svg>")
    return "".join(parts)


def svg_trace(r, cote=420):
    """Trace vu du dessus, colore par l'altitude. Pas de fond de carte."""
    m = 16
    lats = [p[0] for p in r["points"]]
    lons = [p[1] for p in r["points"]]
    lat0 = sum(lats) / len(lats)
    kx = math.cos(math.radians(lat0))
    xs = [lo * kx for lo in lons]
    ys = [la for la in lats]
    x0, x1 = min(xs), max(xs)
    y0, y1 = min(ys), max(ys)
    dx = (x1 - x0) or 1e-6
    dy = (y1 - y0) or 1e-6
    ech = min((cote - 2 * m) / dx, (cote - 2 * m) / dy)
    ox = (cote - dx * ech) / 2
    oy = (cote - dy * ech) / 2

    def px(i):
        return ox + (xs[i] - x0) * ech

    def py(i):
        return cote - (oy + (ys[i] - y0) * ech)

    amin, amax = min(r["alts"]), max(r["alts"])
    span = (amax - amin) or 1
    pas = max(1, len(r["points"]) // 700)
    idx = list(range(0, len(r["points"]), pas))
    if idx[-1] != len(r["points"]) - 1:
        idx.append(len(r["points"]) - 1)

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {cote} {cote}" '
        f'role="img" aria-label="Tracé de {r["nom"]}">',
        f'<rect width="{cote}" height="{cote}" fill="#f4f1ea"/>',
    ]
    # Segments colores du vert (bas) au brun (haut)
    for j in range(1, len(idx)):
        i0, i1 = idx[j - 1], idx[j]
        t = (r["alts"][i1] - amin) / span
        rr = int(90 + 120 * t)
        gg = int(150 - 60 * t)
        bb = int(90 - 40 * t)
        parts.append(
            f'<line x1="{px(i0):.1f}" y1="{py(i0):.1f}" x2="{px(i1):.1f}" y2="{py(i1):.1f}" '
            f'stroke="rgb({rr},{gg},{max(30, bb)})" stroke-width="3.4" stroke-linecap="round"/>'
        )
    parts.append(f'<circle cx="{px(0):.1f}" cy="{py(0):.1f}" r="7" fill="#1f7a4d" stroke="#fff" stroke-width="2.5"/>')
    dernier = len(r["points"]) - 1
    parts.append(
        f'<circle cx="{px(dernier):.1f}" cy="{py(dernier):.1f}" r="7" fill="#a32b2b" '
        f'stroke="#fff" stroke-width="2.5"/>'
    )
    parts.append("</svg>")
    return "".join(parts)


# -------------------------------------------------------------------- sortie


def fichiers():
    return sorted(SRC.rglob("*.gpx"))


def main():
    rows = [lire(p) for p in fichiers()]
    rows.sort(key=lambda r: r["montee_m"])

    print(f"{'Randonnée':46}{'km':>6}{'D+':>7}{'D-':>7}{'alt max':>9}{'durée':>8}  niveau")
    for r in rows:
        mn_total = round(r["heures"] * 60 / 5) * 5
        h, mn = divmod(mn_total, 60)
        print(
            f"{r['nom'][:45]:46}{r['distance_m'] / 1000:6.1f}{r['montee_m']:7}"
            f"{r['descente_m']:7}{r['alt_max']:9}{f'{h}h{mn:02d}':>8}  {r['niveau']}"
        )

    if "--build" not in sys.argv:
        return

    OUT_ASSETS.mkdir(parents=True, exist_ok=True)
    OUT_PHOTOS.mkdir(parents=True, exist_ok=True)
    vues = {}
    sortie = []
    for r in rows:
        s = slug(r["nom"])
        (OUT_ASSETS / f"{s}-profil.svg").write_text(svg_profil(r), encoding="utf-8")
        (OUT_ASSETS / f"{s}-trace.svg").write_text(svg_trace(r), encoding="utf-8")
        src = next(p for p in fichiers() if p.name == r["fichier"])
        (OUT_ASSETS / f"{s}.gpx").write_bytes(src.read_bytes())
        photos = photos_de(r["dossier"], vues)
        sortie.append(
            {
                "id": s,
                "nom": r["nom"],
                "photos": photos,
                "gpx": f"assets/randos/{s}.gpx",
                "profil": f"assets/randos/{s}-profil.svg",
                "trace": f"assets/randos/{s}-trace.svg",
                "distance_km": round(r["distance_m"] / 1000, 1),
                "montee_m": r["montee_m"],
                "descente_m": r["descente_m"],
                "alt_min": r["alt_min"],
                "alt_max": r["alt_max"],
                "heures": r["heures"],
                "niveau": r["niveau"],
                "niveau_texte": r["niveau_texte"],
                "boucle": r["boucle"],
                "depart": r["depart"],
                "arrivee": r["arrivee"],
                "waypoints": r["waypoints"],
            }
        )

    (ROOT / "tools" / "randos.brut.json").write_text(
        json.dumps(sortie, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    # Fichier lu par l'application. Genere, donc separe des textes rediges a
    # la main dans js/data/activites.js : regenerer les traces ne touche
    # jamais a la prose.
    leger = [
        {k: r[k] for k in ("id","nom","gpx","profil","trace","photos","distance_km",
                           "montee_m","descente_m","alt_min","alt_max","heures","niveau",
                           "niveau_texte","boucle","depart","arrivee")}
        for r in sortie
    ]
    js = (
        "// GENERE AUTOMATIQUEMENT par tools/gpx.py, ne pas editer.\n"
        "// Chiffres calcules depuis les fichiers GPX du dossier Randos.\n"
        "export const RANDO_STATS = "
        + json.dumps(leger, ensure_ascii=False, indent=2)
        + ";\n\nexport const STATS_BY_ID = Object.fromEntries("
        "RANDO_STATS.map((r) => [r.id, r]));\n"
    )
    (ROOT / "js" / "data" / "randos-stats.js").write_text(js, encoding="utf-8")

    total_photos = sum(len(r["photos"]) for r in sortie)
    poids = sum(f.stat().st_size for f in OUT_PHOTOS.iterdir()) / 1048576
    print(f"\n{len(sortie)} randonnées exportées vers assets/randos/")
    print(f"{total_photos} photos référencées, {len(vues)} fichiers distincts, {poids:.1f} Mo")
    print("Statistiques dans js/data/randos-stats.js")


if __name__ == "__main__":
    main()

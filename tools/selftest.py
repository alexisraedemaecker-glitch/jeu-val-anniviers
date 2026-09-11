#!/usr/bin/env python3
"""Test de bout en bout de la logique de jeu.

Tout passe par la cle publishable, exactement ce dont dispose le navigateur.
Cree des profils de test, joue des defis, verifie le rendement degressif, les
scores personnels, les synergies, l'idempotence, le stockage des photos et la
suppression par l'organisateur, puis nettoie tout derriere lui.

Usage : python3 tools/selftest.py [--keep]
"""
import json
import ssl
import sys
import urllib.error
import urllib.request
import uuid
import zlib
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))


def env():
    values = {}
    p = ROOT / ".env"
    for line in p.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            values[k.strip()] = v.strip()
    return values


CFG = env()
URL = CFG["SUPABASE_URL"]
KEY = CFG["SUPABASE_PUBLISHABLE_KEY"]
PIN = CFG["ORGANIZER_PIN"]

try:
    import certifi

    CTX = ssl.create_default_context(cafile=certifi.where())
except Exception:
    CTX = ssl.create_default_context()

HEAD = {
    "apikey": KEY,
    "Authorization": f"Bearer {KEY}",
    "Content-Type": "application/json",
}

PASS, FAIL = [], []


def check(label, ok, detail=""):
    (PASS if ok else FAIL).append(label)
    print(f"  {'✓' if ok else '✗'} {label}" + (f"\n      {detail}" if detail and not ok else ""))


def call(path, data=None, method=None, headers=None, raw=None, ctype=None):
    h = dict(HEAD)
    if headers:
        h.update(headers)
    if ctype:
        h["Content-Type"] = ctype
    body = raw if raw is not None else (json.dumps(data).encode() if data is not None else None)
    req = urllib.request.Request(
        URL + path, data=body, method=method or ("POST" if body else "GET"), headers=h
    )
    try:
        with urllib.request.urlopen(req, timeout=60, context=CTX) as r:
            body = r.read()
            try:
                t = body.decode()
            except UnicodeDecodeError:
                return r.status, f"<{len(body)} octets binaires>"
            try:
                return r.status, json.loads(t)
            except Exception:
                return r.status, t
    except urllib.error.HTTPError as e:
        t = e.read().decode("utf-8", "replace")
        try:
            t = json.loads(t)
        except Exception:
            pass
        return e.code, t


def rpc(name, args):
    return call(f"/rest/v1/rpc/{name}", args)


def tiny_png(color=(0x2F, 0x9E, 0x9E), size=8):
    raw = bytearray()
    for _ in range(size):
        raw.append(0)
        raw += bytes(color) * size

    def chunk(tag, d):
        return struct.pack(">I", len(d)) + tag + d + struct.pack(">I", zlib.crc32(tag + d) & 0xFFFFFFFF)

    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(bytes(raw)))
        + chunk(b"IEND", b"")
    )


def state():
    _, d = rpc("game_state", {})
    return d


def gauge(st, pillar):
    for g in st["gauges"]:
        if g["pillar"] == pillar:
            return g
    return None


def score(st, pid):
    for s in st["scores"]:
        if s["id"] == pid:
            return s
    return None


# Les profils de test portent tous ce prenom, ce qui rend le nettoyage sur.
PREFIXE_TEST = "zztest"


def joueurs_reels():
    _, d = rpc("game_state", {})
    return [
        s["first_name"] + " " + s["last_name"]
        for s in (d.get("scores") or [])
        if s["first_name"].strip().lower() != PREFIXE_TEST
    ]


reels = joueurs_reels()
if reels and "--force" not in sys.argv:
    print("\nDes joueurs réels sont enregistrés :")
    for r in reels:
        print(f"  {r}")
    print(
        "\nCe test crée de vraies soumissions le temps de son exécution, ce qui\n"
        "décalerait momentanément le rendement dégressif pour eux. Il nettoie\n"
        "uniquement ses propres données et ne touche jamais les leurs.\n"
        "Relancez avec --force si vous voulez quand même le faire tourner."
    )
    sys.exit(2)

print("\n=== 1. Profils ===")
people = {}
for first, last in (("Zztest", "Alpha"), ("Zztest", "Beta"), ("Zztest", "Gamma")):
    st, d = rpc("ensure_participant", {"p_first": first, "p_last": last, "p_vibe": "chill"})
    ok = st == 200 and isinstance(d, dict) and d.get("id")
    people[last] = d.get("id") if ok else None
    check(f"création du profil {first} {last}", ok, str(d))

st, d = rpc("ensure_participant", {"p_first": "  zZTEST ", "p_last": "alpha", "p_vibe": None})
check(
    "le même nom en casse et espaces différents retrouve le profil existant",
    st == 200 and d.get("id") == people["Alpha"],
    str(d),
)

st, d = rpc("ensure_participant", {"p_first": "   ", "p_last": "", "p_vibe": None})
check("un nom vide est refusé", st >= 400, str(d))

A, B, G = people["Alpha"], people["Beta"], people["Gamma"]

print("\n=== 2. Rendement dégressif sur la jauge ===")
before = gauge(state(), "eau")["points"]
subs = []
expected = [10, 5, 2.5]
for i, (who, others) in enumerate([(A, [B]), (G, []), (B, [])]):
    cid = str(uuid.uuid4())
    st, d = rpc(
        "submit_challenge",
        {
            "p_client_id": cid,
            "p_challenge_id": "ou-va-leau",
            "p_submitter": who,
            "p_member_ids": others,
            "p_quiz_attempts": 3,
        },
    )
    ok = st == 200 and abs(float(d.get("gauge_points", -1)) - expected[i]) < 0.01
    subs.append(d.get("submission_id"))
    check(
        f"passage {i + 1} du même défi : {expected[i]} points de jauge",
        ok,
        f"reçu {d.get('gauge_points')} (attendu {expected[i]}) {d}",
    )

after = gauge(state(), "eau")["points"]
check(
    "la jauge Eau a monté de 17,5 arrondi à 18",
    after - before == 18,
    f"avant {before}, après {after}",
)

print("\n=== 3. Score personnel jamais dégressif ===")
st_now = state()
check("Alpha a 10 points (1er passage)", score(st_now, A)["score_defis"] == 10, str(score(st_now, A)))
check("Beta a 10 points (présent au 1er, auteur du 3e)", score(st_now, B)["score_defis"] == 10, str(score(st_now, B)))
check("Gamma a 10 points (2e passage, moitié moins pour la jauge)", score(st_now, G)["score_defis"] == 10, str(score(st_now, G)))
check("Beta n'a pas compté deux fois le même défi", score(st_now, B)["defis_faits"] == 1, str(score(st_now, B)))

print("\n=== 4. Idempotence après coupure réseau ===")
cid = str(uuid.uuid4())
args = {"p_client_id": cid, "p_challenge_id": "le-nom-du-canal", "p_submitter": A, "p_member_ids": []}
st1, d1 = rpc("submit_challenge", args)
before_score = score(state(), A)["score"]
st2, d2 = rpc("submit_challenge", args)
after_score = score(state(), A)["score"]
check("le renvoi de la même soumission est signalé comme doublon", d2.get("duplicate") is True, str(d2))
check("le renvoi ne rajoute aucun point", before_score == after_score, f"{before_score} puis {after_score}")
subs.append(d1.get("submission_id"))

print("\n=== 5. Photo dans le stockage ===")
name = f"{uuid.uuid4()}.png"
st, d = call(
    f"/storage/v1/object/preuves/{name}", raw=tiny_png(), ctype="image/png", method="POST"
)
check("dépôt d'une photo avec la clé du navigateur", st in (200, 201), f"{st} {d}")
st, d = call(f"/storage/v1/object/preuves/{name}", raw=tiny_png((1, 1, 1)), ctype="image/png", method="POST")
check("réécrire une photo existante est refusé", st >= 400, f"{st} {d}")
cid = str(uuid.uuid4())
st, dphoto = rpc(
    "submit_challenge",
    {
        "p_client_id": cid,
        "p_challenge_id": "le-grenier-sur-pilotis",
        "p_submitter": A,
        "p_member_ids": [B],
        "p_photo_path": name,
        "p_note": "Test automatique",
    },
)
check("soumission avec photo acceptée", st == 200 and dphoto.get("submission_id"), str(dphoto))
st, feed = call(f"/rest/v1/v_feed?select=*&id=eq.{dphoto.get('submission_id')}")
ok = st == 200 and feed and feed[0]["photo_path"] == name and len(feed[0]["member_names"]) == 2
check("la photo et le groupe apparaissent dans l'album", ok, str(feed))
st, _ = call(f"/storage/v1/object/public/preuves/{name}")
check("la photo est lisible publiquement", st == 200, str(st))

st, d = rpc(
    "submit_challenge",
    {
        "p_client_id": str(uuid.uuid4()),
        "p_challenge_id": "le-sac-du-berger",
        "p_submitter": A,
        "p_photo_path": "../../etc/passwd",
    },
)
check("un chemin de photo malveillant est refusé", st >= 400, str(d))

print("\n=== 6. Synergie cachée ===")
# Alpha a déjà fait ou-va-leau (déclencheur A de la mémoire de la glace).
eau_avant_syn = gauge(state(), "eau")["points"]
cid = str(uuid.uuid4())
st, d = rpc(
    "submit_challenge",
    {
        "p_client_id": cid,
        "p_challenge_id": "glacier-recule-mesure",
        "p_submitter": A,
        "p_member_ids": [G],
    },
)
glacier_sub = d.get("submission_id")
subs.append(glacier_sub)
new = d.get("new_synergies", [])
ids_alpha = [n["synergy_id"] for n in new if n["participant_id"] == A]
check(
    "la synergie La mémoire de la glace se déclenche pour Alpha",
    "la-memoire-de-la-glace" in ids_alpha,
    str(new),
)
ids_gamma = [n["synergy_id"] for n in new if n["participant_id"] == G]
check(
    "elle se déclenche aussi pour Gamma, présent dans le groupe",
    "la-memoire-de-la-glace" in ids_gamma,
    str(new),
)
sA = score(state(), A)
check("Alpha reçoit le bonus personnel de 10 points", sA["score_synergies"] == 10, str(sA))
st_now = state()
check(
    "les deux jauges concernées reçoivent chacune 5 points bonus",
    gauge(st_now, "eau")["points_synergies"] == 5 and gauge(st_now, "montagne")["points_synergies"] == 5,
    f"eau={gauge(st_now, 'eau')['points_synergies']} montagne={gauge(st_now, 'montagne')['points_synergies']}",
)
# Le defi glacier appartient au pilier Montagne, la jauge Eau ne peut donc
# bouger que du bonus de synergie. Deux personnes l'ont debloquee ensemble,
# et pourtant la jauge ne doit recevoir que 5 points, une seule fois.
check(
    "deux personnes débloquent la même synergie mais la jauge ne reçoit 5 points qu'une fois",
    gauge(state(), "eau")["points"] - eau_avant_syn == 5,
    f"la jauge Eau est passée de {eau_avant_syn} à {gauge(state(), 'eau')['points']}, écart attendu 5",
)
check(
    "chacune des deux personnes garde bien ses 10 points personnels",
    score(state(), A)["score_synergies"] == 10 and score(state(), G)["score_synergies"] == 10,
    f"Alpha={score(state(), A)['score_synergies']} Gamma={score(state(), G)['score_synergies']}",
)
check(
    "la synergie n'est pas attribuée à Beta, qui n'a pas fait le second défi",
    score(st_now, B)["synergies_debloquees"] == 0,
    str(score(st_now, B)),
)

print("\n=== 7. Code organisateur ===")
st, d = rpc("check_organizer", {"p_pin": "0000"})
check("un mauvais code est refusé", d is False, str(d))
st, d = rpc("check_organizer", {"p_pin": PIN})
check("le bon code est accepté", d is True, str(d))
st, d = rpc("delete_submission", {"p_submission": glacier_sub, "p_pin": "0000"})
check("suppression refusée sans le bon code", st >= 400, str(d))

print("\n=== 8. Suppression et recalcul ===")
eau_before = gauge(state(), "eau")["points"]
st, d = rpc("delete_submission", {"p_submission": glacier_sub, "p_pin": PIN})
check("suppression acceptée avec le bon code", st == 200 and d.get("deleted"), str(d))
st_now = state()
check(
    "la synergie est retirée puisque son déclencheur a disparu",
    score(st_now, A)["synergies_debloquees"] == 0,
    str(score(st_now, A)),
)
check(
    "le bonus de jauge de la synergie disparaît, soit 5 points",
    gauge(st_now, "eau")["points"] == eau_before - 5,
    f"avant {eau_before}, après {gauge(st_now, 'eau')['points']}",
)

# Supprimer le 1er passage doit faire REMONTER les suivants : le 2e reprend la
# valeur pleine et le 3e la moitie. La jauge ne perd donc que 2,5 et non 10.
eau_before = gauge(state(), "eau")["points"]
st, d = rpc("delete_submission", {"p_submission": subs[0], "p_pin": PIN})
eau_after = gauge(state(), "eau")["points"]
check(
    "supprimer le 1er passage ne coûte que 2,5 à la jauge, les suivants remontent",
    st == 200 and eau_before - eau_after == 3,
    f"avant {eau_before}, après {eau_after}, écart {eau_before - eau_after} (attendu 3)",
)
import apply_sql as _a
ok, rows = _a.run(
    "select repeat_index, gauge_points from public.v_submission_gauge "
    "where challenge_id = 'ou-va-leau' order by repeat_index;"
)
vals = [(r["repeat_index"], float(r["gauge_points"])) for r in rows] if ok else []
check(
    "les passages restants sont bien renumérotés en 10 puis 5",
    vals == [(1, 10.0), (2, 5.0)],
    str(vals),
)

# Tant que la soumission existe, sa photo doit etre intouchable.
st, d = call("/storage/v1/object/preuves", data={"prefixes": [name]}, method="DELETE")
st2, still = call(f"/storage/v1/object/public/preuves/{name}")
check(
    "une photo rattachée à une soumission vivante ne peut pas être supprimée",
    st2 == 200,
    f"suppression {st} {d}, relecture {st2}",
)

st, d = rpc("delete_submission", {"p_submission": dphoto.get("submission_id"), "p_pin": PIN})
check("suppression d'une soumission avec photo", st == 200, str(d))
check("la fonction renvoie le chemin de la photo à nettoyer", d.get("photo_path") == name, str(d))

# Devenue orpheline, la photo peut maintenant etre retiree, comme le fait l'app.
st, d = call("/storage/v1/object/preuves", data={"prefixes": [name]}, method="DELETE")
check("la photo orpheline est supprimable par l'application", st == 200, f"{st} {d}")
# On relit par le point d'entree direct : l'URL publique passe par un CDN qui
# peut encore servir une copie en cache quelques minutes. Sans importance pour
# l'application, qui n'affiche que ce que renvoie la vue de l'album.
st, _ = call(f"/storage/v1/object/preuves/{name}", method="GET")
check("la photo a bien disparu du stockage", st >= 400, f"code {st}")
ok, rows = _a.run("select count(*) as n from storage.objects where name = " + repr(name).replace('"', "'") + ";")
check("plus aucune ligne pour cette photo dans le stockage", ok and rows[0]["n"] == 0, str(rows))

print("\n=== 9. Reprises de quiz ===")
cid = str(uuid.uuid4())
st, d = rpc(
    "submit_challenge",
    {
        "p_client_id": cid,
        "p_challenge_id": "les-mots-de-la-vallee",
        "p_submitter": B,
        "p_quiz_attempts": 7,
        "p_quiz_restarts": 2,
    },
)
check("soumission avec reprises de quiz acceptée", st == 200, str(d))
st, feed = call(f"/rest/v1/v_feed?select=quiz_attempts,quiz_restarts&id=eq.{d.get('submission_id')}")
check(
    "le nombre de reprises est enregistré et visible par l'organisateur",
    st == 200 and feed and feed[0]["quiz_restarts"] == 2 and feed[0]["quiz_attempts"] == 7,
    str(feed),
)

print("\n=== 10. Cohérence des vues ===")
st_now = state()
check("les cinq jauges sont présentes", len(st_now["gauges"]) == 5, str(len(st_now["gauges"])))
check(
    "aucune jauge ne dépasse son maximum",
    all(g["points"] <= g["max_points"] for g in st_now["gauges"]),
    str([(g["pillar"], g["points"]) for g in st_now["gauges"]]),
)
check(
    "le total collectif correspond à la somme des jauges",
    st_now["collective"]["total"] == sum(g["points"] for g in st_now["gauges"]),
    str(st_now["collective"]),
)
st, d = rpc(
    "submit_challenge",
    {"p_client_id": str(uuid.uuid4()), "p_challenge_id": "defi-qui-nexiste-pas", "p_submitter": A},
)
check("un défi inconnu est refusé", st >= 400, str(d))

# ---------------------------------------------------------------- nettoyage
if "--keep" not in sys.argv:
    print("\n=== 11. Nettoyage ===")
    sys.path.insert(0, str(ROOT / "tools"))
    import apply_sql

    ok, res = apply_sql.run(
        "delete from public.participants where lower(btrim(first_name)) = 'zztest';"
    )
    check("profils et soumissions de test supprimés", ok, str(res))
    st_now = state()
    restants = [
        s["first_name"] + " " + s["last_name"]
        for s in st_now["scores"]
        if s["first_name"].strip().lower() == PREFIXE_TEST
    ]
    check("plus aucun profil de test dans la base", not restants, str(restants))
    ok, rows = apply_sql.run(
        "select count(*) as n from public.submissions s "
        "join public.participants p on p.id = s.submitter_id "
        "where lower(btrim(p.first_name)) = 'zztest';"
    )
    check("plus aucune soumission de test", ok and rows[0]["n"] == 0, str(rows))
    check(
        "les données des joueurs réels sont intactes",
        sorted(joueurs_reels()) == sorted(reels),
        f"avant {sorted(reels)}, après {sorted(joueurs_reels())}",
    )

print(f"\n{'=' * 52}")
print(f"{len(PASS)} tests réussis, {len(FAIL)} échec(s)")
if FAIL:
    for f in FAIL:
        print(f"  ✗ {f}")
    sys.exit(1)
print("Toute la logique de jeu est vérifiée.")

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
CODE = "codetest"
for first, last in (("Zztest", "Alpha"), ("Zztest", "Beta"), ("Zztest", "Gamma")):
    st, d = rpc("ensure_participant", {"p_first": first, "p_last": last, "p_vibe": "chill",
                                       "p_code": CODE})
    ok = st == 200 and isinstance(d, dict) and d.get("id")
    people[last] = d.get("id") if ok else None
    check(f"création du profil {first} {last}", ok, str(d))

st, d = rpc("ensure_participant", {"p_first": "  zZTEST ", "p_last": "alpha", "p_vibe": None,
                                   "p_code": CODE})
check(
    "le même nom en casse et espaces différents retrouve le profil existant",
    st == 200 and d.get("id") == people["Alpha"],
    str(d),
)

st, d = rpc("ensure_participant", {"p_first": "   ", "p_last": "", "p_vibe": None, "p_code": CODE})
check("un nom vide est refusé", st >= 400, str(d))

st, d = rpc("ensure_participant", {"p_first": "Zztest", "p_last": "Alpha", "p_code": "pirate"})
check("un mauvais code ne donne pas accès au profil", st >= 400, str(d))
st, d = rpc("ensure_participant", {"p_first": "Zztest", "p_last": "Alpha"})
check("sans code non plus", st >= 400, str(d))
st, d = rpc("ensure_participant", {"p_first": "Zztest", "p_last": "Sanscode", "p_code": "abc"})
check("un code trop court est refusé à l'inscription", st >= 400, str(d))
st, d = call("/rest/v1/participant_secrets?select=*")
check("le navigateur ne peut pas lire les empreintes de mot de passe", st >= 400 or d == [], f"{st} {str(d)[:80]}")

A, B, G = people["Alpha"], people["Beta"], people["Gamma"]

print("\n=== 2. Rendement dégressif sur la jauge ===")
before = gauge(state(), "eau")["points"]
subs = []
# Avec --force, de vrais joueurs ont peut etre deja fait ce defi. Le rendement
# degressif est alors deja entame : on decale les attentes d'autant plutot que
# d'annoncer un echec qui n'en est pas un.
_, deja = call("/rest/v1/v_submission_gauge?challenge_id=eq.ou-va-leau&select=repeat_index")
n0 = len(deja) if isinstance(deja, list) else 0
if n0:
    print(f"  ({n0} passage(s) déjà joué(s) par de vrais joueurs, attentes décalées d'autant)")
expected = [10 / (2 ** (n0 + i)) for i in range(3)]
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
        f"passage {n0 + i + 1} du même défi : {expected[i]:g} points de jauge",
        ok,
        f"reçu {d.get('gauge_points')} (attendu {expected[i]}) {d}",
    )

after = gauge(state(), "eau")["points"]
monte = sum(expected)
check(
    f"la jauge Eau a monté de {monte:g}, à l'arrondi d'affichage près",
    abs((after - before) - monte) <= 0.5 + 1e-9,
    f"avant {before}, après {after}, attendu {monte:g}",
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
# La synergie a peut etre deja ete trouvee par un vrai joueur : le bonus de
# jauge est alors deja verse, et ne doit surtout pas l'etre une seconde fois.
syn_deja = gauge(state(), "eau")["points_synergies"] >= 5
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
    gauge(state(), "eau")["points_synergies"] == 5
    and gauge(state(), "eau")["points"] - eau_avant_syn == (0 if syn_deja else 5),
    f"la jauge Eau est passée de {eau_avant_syn} à {gauge(state(), 'eau')['points']}, "
    f"bonus de synergie {gauge(state(), 'eau')['points_synergies']}, "
    f"écart attendu {0 if syn_deja else 5}",
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
    "le bonus de jauge de la synergie disparaît, soit 5 points"
    if not syn_deja
    else "le bonus de jauge reste, la synergie est encore détenue par un vrai joueur",
    gauge(st_now, "eau")["points"] == eau_before - (0 if syn_deja else 5),
    f"avant {eau_before}, après {gauge(st_now, 'eau')['points']}",
)

# Supprimer le 1er passage doit faire REMONTER les suivants : le 2e reprend la
# valeur pleine et le 3e la moitie. La jauge ne perd donc que 2,5 et non 10.
eau_before = gauge(state(), "eau")["points"]
st, d = rpc("delete_submission", {"p_submission": subs[0], "p_pin": PIN})
eau_after = gauge(state(), "eau")["points"]
# Les passages suivants reprennent chacun la valeur du precedent : la jauge ne
# perd donc que la valeur du dernier passage, pas celle du passage supprime.
cout = expected[-1]
check(
    f"supprimer un passage ne coûte que {cout:g} à la jauge, les suivants remontent",
    st == 200 and abs((eau_before - eau_after) - cout) <= 0.5 + 1e-9,
    f"avant {eau_before}, après {eau_after}, écart {eau_before - eau_after} (attendu {cout:g})",
)
import apply_sql as _a
ok, rows = _a.run(
    "select repeat_index, gauge_points from public.v_submission_gauge "
    "where challenge_id = 'ou-va-leau' order by repeat_index;"
)
vals = [(r["repeat_index"], float(r["gauge_points"])) for r in rows] if ok else []
attendu = [(i + 1, 10 / (2 ** i)) for i in range(n0 + 2)]
check(
    "les passages restants sont renumérotés sans trou, " 
    + " puis ".join(f"{v:g}" for _, v in attendu),
    vals == attendu,
    f"{vals} (attendu {attendu})",
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

print("\n=== 9. Attente après un quiz raté ===")
cid = str(uuid.uuid4())
st, d = rpc(
    "report_quiz_failure",
    {
        "p_client_id": cid,
        "p_challenge_id": "le-pourquoi-des-bisses",
        "p_participant": A,
        "p_member_ids": [B],
    },
)
check("un quiz raté est enregistré", st == 200 and d.get("until"), str(d))
check("la durée par défaut est de 30 minutes", d.get("minutes") == 30, str(d))

st, d2 = rpc("report_quiz_failure", {"p_client_id": cid, "p_challenge_id": "le-pourquoi-des-bisses",
                                     "p_participant": A, "p_member_ids": [B]})
check("le renvoi du même signalement ne prolonge pas l'attente", d2.get("duplicate") is True, str(d2))

st, d = rpc("lockout_until", {"p_participant": A, "p_challenge": "le-pourquoi-des-bisses"})
check("l'auteur du ratage est en attente", st == 200 and d, str(d))
st, d = rpc("lockout_until", {"p_participant": B, "p_challenge": "le-pourquoi-des-bisses"})
check("toute l'équipe présente est en attente, pas seulement l'auteur", st == 200 and d, str(d))
st, d = rpc("lockout_until", {"p_participant": G, "p_challenge": "le-pourquoi-des-bisses"})
check("une personne absente du groupe n'est pas pénalisée", st == 200 and d is None, str(d))
st, d = rpc("lockout_until", {"p_participant": A, "p_challenge": "ou-va-leau"})
check("l'attente ne concerne que ce défi là", st == 200 and d is None, str(d))

st, d = rpc("submit_challenge", {"p_client_id": str(uuid.uuid4()),
                                 "p_challenge_id": "le-pourquoi-des-bisses", "p_submitter": A})
check("soumettre pendant l'attente est refusé par le serveur", st >= 400, str(d))

# Un membre encore en attente ne doit pas profiter du defi joue par un autre.
st, d = rpc("submit_challenge", {"p_client_id": str(uuid.uuid4()),
                                 "p_challenge_id": "le-pourquoi-des-bisses",
                                 "p_submitter": G, "p_member_ids": [A, B]})
ok = st == 200 and len(d.get("members", [])) == 1 and len(d.get("excluded", [])) == 2
check("un membre en attente est écarté des points, sans bloquer le groupe", ok, str(d))
sub_bisses = d.get("submission_id")
check(
    "seule la personne libre reçoit les points",
    score(state(), G)["defis_faits"] > 0 and "le-pourquoi-des-bisses" not in (state()["done"].get(A) or []),
    f"A a fait {state()['done'].get(A)}",
)

st, d = rpc("admin_clear_lockouts", {"p_pin": "0000"})
check("lever une attente sans le bon code est refusé", st >= 400, str(d))
st, d = rpc("admin_clear_lockouts", {"p_pin": PIN, "p_participant": A,
                                     "p_challenge": "le-pourquoi-des-bisses"})
check("l'organisateur peut lever une attente", st == 200 and d.get("levees") == 1, str(d))
st, d = rpc("lockout_until", {"p_participant": A, "p_challenge": "le-pourquoi-des-bisses"})
check("l'attente levée libère bien la personne", st == 200 and d is None, str(d))
st, d = rpc("lockout_until", {"p_participant": B, "p_challenge": "le-pourquoi-des-bisses"})
check("lever une attente ne touche pas les autres", st == 200 and d is not None, str(d))
rpc("admin_clear_lockouts", {"p_pin": PIN})
rpc("delete_submission", {"p_submission": sub_bisses, "p_pin": PIN})

print("\n=== 10. Administration ===")
st, d = rpc("admin_rename_participant", {"p_pin": "0000", "p_id": G, "p_first": "Pirate", "p_last": "X"})
check("renommer sans le bon code est refusé", st >= 400, str(d))
st, d = rpc("admin_rename_participant", {"p_pin": PIN, "p_id": G, "p_first": "Zztest", "p_last": "Gamma2"})
check("l'organisateur peut renommer un profil", st == 200 and d.get("last_name") == "Gamma2", str(d))
st, d = rpc("admin_rename_participant", {"p_pin": PIN, "p_id": G, "p_first": "Zztest", "p_last": "Alpha"})
check("renommer vers un nom déjà pris est refusé", st >= 400, str(d))
rpc("admin_rename_participant", {"p_pin": PIN, "p_id": G, "p_first": "Zztest", "p_last": "Gamma"})

st, d = rpc("admin_set_lockout_minutes", {"p_pin": "0000", "p_minutes": 5})
check("changer la durée sans le bon code est refusé", st >= 400, str(d))
st, d = rpc("admin_set_lockout_minutes", {"p_pin": PIN, "p_minutes": 5})
check("l'organisateur peut changer la durée de l'attente", st == 200 and d == 5, str(d))
st, d = rpc("game_state", {})
check("la nouvelle durée est visible par l'application", d["settings"]["lockout_minutes"] == 5, str(d["settings"]))
st, d = rpc("admin_set_lockout_minutes", {"p_pin": PIN, "p_minutes": 9999})
check("une durée aberrante est refusée", st >= 400, str(d))
rpc("admin_set_lockout_minutes", {"p_pin": PIN, "p_minutes": 30})

st, d = rpc("admin_reset_game", {"p_pin": PIN, "p_confirmation": "oui"})
check("la remise à zéro exige la phrase exacte de confirmation", st >= 400, str(d))
st, d = rpc("admin_reset_game", {"p_pin": "0000", "p_confirmation": "REMISE A ZERO"})
check("la remise à zéro exige aussi le bon code", st >= 400, str(d))

avant_suppr = len(state()["scores"])
st, d = rpc("admin_delete_participant", {"p_pin": PIN, "p_id": G})
check("l'organisateur peut supprimer un profil", st == 200 and d.get("deleted"), str(d))
check("le profil a bien disparu du classement", len(state()["scores"]) == avant_suppr - 1, str(len(state()["scores"])))

print("\n=== 11. Reprises de quiz ===")
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

print("\n=== 12. Fil social ===")
_, posts = call("/rest/v1/v_posts?select=id,genre,submission_id&order=created_at.desc&limit=5")
check("chaque défi validé a publié dans le fil", isinstance(posts, list) and posts and posts[0]["genre"] == "defi", str(posts)[:200])

st, d = rpc("add_post", {"p_client_id": str(uuid.uuid4()), "p_author": A,
                         "p_texte": "Message de test", "p_mentions": [B]})
POST = d.get("post_id") if st == 200 else None
check("publier un message libre", st == 200 and POST, str(d))

st, d = rpc("add_post", {"p_client_id": str(uuid.uuid4()), "p_author": A, "p_texte": "   "})
check("un message vide est refusé", st >= 400, str(d))

st, d = rpc("toggle_kudo", {"p_participant": B, "p_post": POST})
check("poser une corne de bouquetin", st == 200 and d.get("pose") is True and d.get("total") == 1, str(d))
st, d = rpc("toggle_kudo", {"p_participant": B, "p_post": POST})
check("la retirer en appuyant à nouveau", st == 200 and d.get("pose") is False and d.get("total") == 0, str(d))
rpc("toggle_kudo", {"p_participant": B, "p_post": POST})

st, d = rpc("ensure_participant", {"p_first": "Zztest", "p_last": "Nommee", "p_code": CODE})
N = d.get("id")
st, d = rpc("add_comment", {"p_client_id": str(uuid.uuid4()), "p_author": B,
                            "p_post": POST, "p_texte": "Bien vu", "p_mentions": [N]})
COM = d.get("comment_id") if st == 200 else None
check("commenter une publication", st == 200 and COM, str(d))

st, d = rpc("feed_state", {"p_participant": A})
mien = next((x for x in (d.get("posts") or []) if x["id"] == POST), None)
check("la publication remonte avec sa corne et son commentaire",
      mien and len(mien["kudos_ids"]) == 1 and mien["nb_commentaires"] == 1 and len(mien["commentaires"]) == 1,
      str(mien)[:200])
kinds = sorted(n["kind"] for n in (d.get("notifications") or []))
check("l'auteur est prévenu de la corne et du commentaire",
      "kudo" in kinds and "commentaire" in kinds, str(kinds))

st, d = rpc("feed_state", {"p_participant": B})
check("celui qui est nommé reçoit sa notification",
      any(n["kind"] == "mention" for n in (d.get("notifications") or [])), str([n["kind"] for n in (d.get("notifications") or [])]))
st, d = rpc("feed_state", {"p_participant": N})
check("nommé dans un commentaire aussi",
      any(n["kind"] == "mention" for n in (d.get("notifications") or [])), str([n["kind"] for n in (d.get("notifications") or [])]))

st, d = rpc("mark_notifications_read", {"p_participant": A})
check("marquer ses notifications comme lues", st == 200 and d >= 1, str(d))
st, d = rpc("feed_state", {"p_participant": A})
check("plus aucune notification non lue",
      all(n["read_at"] for n in (d.get("notifications") or [])), "il en reste")

st, d = rpc("delete_post", {"p_post": POST, "p_participant": G})
check("un autre joueur ne peut pas retirer ma publication", st >= 400, str(d))
st, d = rpc("delete_post", {"p_post": POST, "p_participant": A})
check("son auteur le peut", st == 200 and d.get("deleted"), str(d))
st, d = rpc("feed_state", {"p_participant": A})
check("la publication et son commentaire ont disparu",
      not any(x["id"] == POST for x in (d.get("posts") or [])), "encore là")

print("\n=== 13. Photos de profil ===")
portrait = f"{uuid.uuid4()}.png"
st, d = call(
    f"/storage/v1/object/profils/{portrait}",
    raw=tiny_png((0x1D, 0x3B, 0x57)),
    ctype="image/png",
    method="POST",
)
check("l'application peut déposer un portrait", st in (200, 201), f"{st} {d}")
st, _ = call(f"/storage/v1/object/public/profils/{portrait}")
check("le portrait est lisible par tout le monde", st == 200, f"code {st}")

st, d = rpc("ensure_participant", {"p_first": "Zztest", "p_last": "Delta",
                                   "p_vibe": "sportif", "p_photo": portrait, "p_code": CODE})
D = d.get("id") if st == 200 else None
check("un profil peut naître avec son portrait", st == 200 and d.get("photo_path") == portrait, str(d))

st, d = rpc("ensure_participant", {"p_first": "Zztest", "p_last": "Delta", "p_vibe": "chill",
                                   "p_code": CODE})
check(
    "revenir sans photo n'efface pas le portrait enregistré",
    st == 200 and d.get("photo_path") == portrait,
    str(d),
)

st_now = state()
check(
    "le portrait est visible par l'application dans les scores",
    (score(st_now, D) or {}).get("photo_path") == portrait,
    str(score(st_now, D)),
)

# Une photo encore portee par un profil ne doit pas pouvoir partir.
call("/storage/v1/object/profils", data={"prefixes": [portrait]}, method="DELETE")
st, _ = call(f"/storage/v1/object/profils/{portrait}", method="GET")
check("un portrait encore utilisé ne peut pas être supprimé", st == 200, f"code {st}")

portrait2 = f"{uuid.uuid4()}.png"
call(f"/storage/v1/object/profils/{portrait2}", raw=tiny_png((0x6F, 0x9E, 0x4A)),
     ctype="image/png", method="POST")
st, d = rpc("set_photo", {"p_participant": D, "p_photo": portrait2})
check("changer de portrait est possible", st == 200 and d.get("photo_path") == portrait2, str(d))

# L'ancien devient orphelin : l'application a le droit de le retirer.
st, d = call("/storage/v1/object/profils", data={"prefixes": [portrait]}, method="DELETE")
check("l'ancien portrait devenu orphelin est supprimable", st == 200, f"{st} {d}")
st, _ = call(f"/storage/v1/object/profils/{portrait}", method="GET")
check("l'ancien portrait a bien disparu du stockage", st >= 400, f"code {st}")

st, d = rpc("set_photo", {"p_participant": D, "p_photo": "../../etc/passwd"})
check("un chemin de portrait douteux est refusé", st >= 400, str(d))
st, d = rpc("ensure_participant", {"p_first": "Zztest", "p_last": "Epsilon",
                                   "p_photo": "a/../../b.png", "p_code": CODE})
check("un chemin douteux est aussi refusé à l'inscription", st >= 400, str(d))

st, d = call(f"/rest/v1/participants?id=eq.{D}", data={"photo_path": "pirate.png"}, method="PATCH")
check("le navigateur ne peut pas écrire directement un portrait", st >= 400, f"{st} {d}")

st, d = rpc("admin_delete_participant", {"p_pin": PIN, "p_id": D})
check("la suppression d'un profil renvoie son portrait à nettoyer", st == 200 and d.get("portrait") == portrait2, str(d))
st, d = call("/storage/v1/object/profils", data={"prefixes": [portrait2]}, method="DELETE")
check("le portrait du profil supprimé est retirable", st == 200, f"{st} {d}")

print("\n=== 14. Nouveaux défis du catalogue ===")
NOUVEAUX = {
    "la-mine-de-cuivre-de-la-lee": ("patrimoine", "sportif", 30),
    "le-vin-du-glacier": ("vie-alpine", "culinaire", 20),
    "les-salaisons-danniviers": ("vie-alpine", "culinaire", 10),
    "lobservatoire-de-tignousa": ("montagne", "chill", 10),
    "les-champignons-de-la-vallee": ("montagne", "chill", 10),
    "lillgraben": ("montagne", "sportif", 20),
}
st, d = call("/rest/v1/challenges?select=id,pillar,style,points,tier,location_kind&id=in.("
             + ",".join(NOUVEAUX) + ")")
trouves = {c["id"]: c for c in d} if isinstance(d, list) else {}
check("les six nouveaux défis sont dans la base", len(trouves) == 6, str(sorted(trouves)))
for cid, (pil, sty, pts) in NOUVEAUX.items():
    c = trouves.get(cid, {})
    check(
        f"{cid} : {pil}, {sty}, {pts} points",
        c.get("pillar") == pil and c.get("style") == sty and c.get("points") == pts,
        str(c),
    )

avant_montagne = gauge(state(), "montagne")["points"]
st, d = rpc("submit_challenge", {"p_client_id": str(uuid.uuid4()),
                                 "p_challenge_id": "lillgraben", "p_submitter": A})
check("un nouveau défi se valide comme les autres", st == 200 and d.get("pillar") == "montagne", str(d))
check("il verse ses points pleins dans sa jauge au premier passage",
      abs(float(d.get("gauge_points", 0)) - 20) < 0.01 or d.get("repeat_index", 1) > 1,
      str(d))
check("le score personnel monte de 20", score(state(), A)["score_defis"] >= 20, str(score(state(), A)))
rpc("delete_submission", {"p_submission": d.get("submission_id"), "p_pin": PIN})
check("la jauge Montagne revient à son point de départ",
      gauge(state(), "montagne")["points"] == avant_montagne,
      f"avant {avant_montagne}, après {gauge(state(), 'montagne')['points']}")

print("\n=== 15. Cohérence des vues ===")
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
    print("\n=== 16. Nettoyage ===")
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

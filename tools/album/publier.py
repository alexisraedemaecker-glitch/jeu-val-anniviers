# -*- coding: utf-8 -*-
"""Prepare la version publiee de l'album, protegee par un mot de passe.

Le depot est public et GitHub Pages sert les fichiers tels quels : une simple
fenetre de mot de passe en JavaScript ne protegerait rien, les photos seraient
visibles de quiconque connait leur adresse, et lisibles par tout le monde sur
github.com. Les photos sont donc chiffrees sur le disque, et la page aussi. La
cle se derive du mot de passe dans le navigateur : sans lui, il n'y a rien a
voir, ni en ligne ni dans le depot.

    python3 tools/album/publier.py

Lit album/index.html, qui reste la source de verite des legendes.
"""
import base64, hashlib, json, re, secrets, sys
from pathlib import Path

PROJ = Path(__file__).resolve().parent.parent.parent
SRC = PROJ / "album"
OUT = PROJ / "souvenir"
MDP = "Anniviers-2026/2026-cimer"

ITERATIONS = 250_000

NOMS_ZIP = {
    "e2ffeba7-91fc-4695-b50e-649e820cafa8": "video-desalpe-dayer",
    "160ea92d-7b3d-4b35-b641-5c24dd4080fc": "video-sommet-et-souffle",
}


# --------------------------------------------------------------- chiffrement
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def aes_gcm(cle, iv, clair):
    """Chiffre et renvoie le texte chiffre suivi du sceau de seize octets,
    exactement la forme qu'attend WebCrypto dans le navigateur."""
    return AESGCM(cle).encrypt(iv, clair, None)


def verifier_implementation():
    """Deux vecteurs du NIST : si le chiffrement derivait, les photos
    deviendraient illisibles sans que personne ne s'en apercoive avant la
    mise en ligne."""
    cas = [
        (bytes(32), bytes(12), b"", "530f8afbc74536b9a963b4f1c4cb738b"),
        (bytes(32), bytes(12), bytes(16),
         "cea7403d4d606b6e074ec5d3baf39d18d0d1c8a799996bf0265b98b5d48ab919"),
    ]
    for cle, iv, clair, attendu in cas:
        if aes_gcm(cle, iv, clair).hex() != attendu:
            raise SystemExit("Le chiffrement ne suit pas les vecteurs du NIST, on s'arrete.")


def chiffrer(cle, clair):
    iv = secrets.token_bytes(12)
    return iv + aes_gcm(cle, iv, clair)


# ------------------------------------------------------------------- montage
def main():
    verifier_implementation()
    sel = Path(sys.argv[1]) if len(sys.argv) > 1 else SRC / "index.html"
    page = sel.read_text(encoding="utf-8")

    # Le sel ne change pas d'une publication a l'autre : il n'est pas secret,
    # il vit deja dans la page publique, et le garder stable evite de casser
    # les onglets ouverts a chaque remise en ligne.
    ancien = OUT / "index.html"
    repris = re.search(r'var SEL = "([0-9a-f]{32})"', ancien.read_text(encoding="utf-8")) if ancien.exists() else None
    sel_bin = bytes.fromhex(repris.group(1)) if repris else secrets.token_bytes(16)
    cle = hashlib.pbkdf2_hmac("sha256", MDP.encode(), sel_bin, ITERATIONS, 32)

    (OUT / "d").mkdir(parents=True, exist_ok=True)
    for vieux in (OUT / "d").iterdir():
        vieux.unlink()

    # 1. le style reste en clair : il habille aussi l'ecran du mot de passe
    m = re.search(r"<style>(.*?)</style>", page, re.S)
    style = m.group(1)
    corps = page[m.end():]

    # 2. l'ancien script de la page part : le chargeur refait ce travail, car
    #    les photos n'arrivent plus par leur adresse mais apres dechiffrement
    corps = re.sub(r"<script>.*?</script>", "", corps, flags=re.S)
    corps = corps.replace('<div class="loupe" id="loupe"', '<div class="loupe" id="loupe"')

    # 3. les deux icones du fil sont minuscules et sans interet : on les colle
    #    directement dans la page, cela fait deux requetes de moins
    for ic in ("corne-96.png", "marmotte-96.png"):
        b64 = base64.b64encode((SRC / "assets" / ic).read_bytes()).decode()
        corps = corps.replace(f'src="assets/{ic}"', f'src="data:image/png;base64,{b64}"')

    # 4. chaque photo devient un fichier chiffre, et la page ne garde qu'un nom
    manifeste = {}
    medias = sorted(set(re.findall(r'src="(photos/[^"]+|videos/[^"]+)"', corps)))
    for n, rel in enumerate(medias, 1):
        src = SRC / rel
        nom = Path(rel).stem
        dest = OUT / "d" / f"{nom}.bin"
        dest.write_bytes(chiffrer(cle, src.read_bytes()))
        type_ = "video/mp4" if rel.startswith("videos/") else "image/jpeg"
        ext = ".mp4" if type_.startswith("video") else ".jpg"
        # Dans le zip, les deux videos portent un nom lisible plutot que leur
        # identifiant de stockage.
        manifeste[nom] = {"t": type_, "z": "anniviers-" + NOMS_ZIP.get(nom, nom) + ext}
        corps = corps.replace(f'src="{rel}"', f'data-bin="{nom}"')
        print(f"\r  {n}/{len(medias)} chiffrés", end="", flush=True)
    print()

    # 5. la page elle meme est chiffree : sans le mot de passe, aucun texte,
    #    aucune legende, aucun nom ne sort du depot
    (OUT / "d" / "page.bin").write_bytes(chiffrer(cle, corps.encode("utf-8")))
    (OUT / "d" / "verif.bin").write_bytes(chiffrer(cle, b"anniviers-2056"))

    chargeur = (Path(__file__).parent / "chargeur.html").read_text(encoding="utf-8")
    chargeur = chargeur.replace("__STYLE__", style)
    chargeur = chargeur.replace("__SEL__", sel_bin.hex())
    chargeur = chargeur.replace("__VERSION__", secrets.token_hex(4))
    chargeur = chargeur.replace("__ITER__", str(ITERATIONS))
    chargeur = chargeur.replace("__MANIFESTE__", json.dumps(manifeste, separators=(",", ":")))
    (OUT / "index.html").write_text(chargeur, encoding="utf-8")

    poids = sum(f.stat().st_size for f in (OUT / "d").iterdir()) + (OUT / "index.html").stat().st_size
    print(f"{len(medias)} médias + la page, {poids/1024/1024:.1f} Mo dans {OUT.relative_to(PROJ)}/")


if __name__ == "__main__":
    main()

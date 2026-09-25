# -*- coding: utf-8 -*-
"""Fabrique l'album du week end, dans l'esprit des affiches de la maison.

Papier crème, photos posées de travers et retenues par un bout de ruban,
titres à la plume dorée. Tout le contenu vient de la base du jeu et des deux
dossiers de photos, rien n'est saisi deux fois.
"""
import html as H
import json, sys
from pathlib import Path

SC = Path("/private/tmp/claude-502/-Users-alexisraedemaecker-Documents-jeu-val-anniviers/a81246fe-839c-4a6e-970e-035f3d0166ab/scratchpad")
sys.path.insert(0, str(SC))
from selection import CHAPITRES, ECARTES, LEGENDES

PROJ = Path("/Users/alexisraedemaecker/Documents/jeu-val-anniviers")
A = SC/"album"
e = lambda s: H.escape(str(s or ""))

images = json.load(open(SC/"images_finales.json"))
idxphotos = json.load(open(SC/"index_photos.json"))
ordre = json.load(open(SC/"ordre_vue.json"))
defis = json.load(open(SC/"defis.json"))
videos = json.load(open(SC/"videos.json"))
scores = json.load(open(A/"scores.json"))
parts = {p['id']: f"{p['first_name']} {p['last_name']}" for p in json.load(open(A/"participants.json"))}
subs = json.load(open(A/"submissions.json"))
posts = json.load(open(A/"posts.json"))
coms = json.load(open(A/"commentaires.json"))
reacts = json.load(open(A/"reactions.json"))
lock = json.load(open(A/"lockouts.json"))
gauges = json.load(open(A/"gauges.json"))
collectif = json.load(open(A/"collectif.json"))[0]
stats = {s['challenge_id']: s['passages'] for s in json.load(open(A/"stats.json"))}
unlocks = json.load(open(A/"unlocks.json"))

def cle(n):
    return ordre[n-1][:-4]

def meta(n):
    return idxphotos.get(cle(n))

# Rotation et ruban stables d'une generation a l'autre.
def biais(n, amp=2.6):
    x = (n * 2654435761) % 1000 / 1000
    return round((x - 0.5) * 2 * amp, 2)

def ruban(n):
    return (n * 40503) % 4

def legende(n):
    m = meta(n)
    if m:
        if m['genre'] == 'defi':
            t = f"<b>{e(m['defi'])}</b>"
            g = [x for x in m['groupe'] if x != m['qui']]
            sous = e(m['qui'])
            if g: sous += " et " + str(len(g)) + (" autre" if len(g)==1 else " autres")
            note = (m.get('note') or '').strip().replace("\n", " ")
            if note: t += f" <i>{e(note[:120])}</i>"
            return t, sous
        note = (m.get('note') or '').strip().replace("\n", " ")
        return e(note[:150]), e(m['qui'])
    return e(LEGENDES.get(n, "")), ""

def carte(n, taille=""):
    im = images.get(str(n))
    if not im: return ""
    t, sous = legende(n)
    cls = f"photo {taille}".strip()
    r = biais(n)
    ratio = f"{im['w']}/{im['h']}" if im['w'] and im['h'] else "4/3"
    leg = ""
    if t or sous:
        leg = f'<figcaption>{t}{f"<span>{sous}</span>" if sous else ""}</figcaption>'
    return (f'<figure class="{cls} ru{ruban(n)}" style="--r:{r}deg">'
            f'<div class="cadre"><img src="photos/{im["fichier"]}" alt="{e(t)[:90]}" '
            f'loading="lazy" style="aspect-ratio:{ratio}"></div>{leg}</figure>')

# ---------------------------------------------------------------- le podium
PODIUM = [
    ("1", "Ensemble, en tête", ["Nathou 😎🍀", "Di Dou", "Francoise Guerinon"],
     "310 points chacun, 18 défis. Impossible de les départager, alors ils gagnent à trois."),
    ("2", "Deuxième", ["Bébé Côme"],
     "270 points et 18 défis validés, le meilleur compte de défis de tout le jeu."),
    ("3", "Troisièmes", ["Oli Bassin", "Val So"],
     "270 points aussi. Encore une égalité, encore un podium partagé."),
]

# ------------------------------------------------------------------- le fil
def commentaires_de(pid):
    out = []
    for c in coms:
        if c['post_id'] != pid: continue
        rs = "".join(x['emoji'] for x in reacts if x['comment_id'] == c['id'])
        out.append((parts.get(c['author_id'], '?'), c['texte'], rs))
    return out

CHOIX_FIL = [
    "Top départ pour la team vélo !",
    "Le walklette, nouveau concept belgosuisse",
    "On fait une pré dans notre chambre samedi 20h30",
    "À tous ceux qui ne sont pas en vacances",
    "Gros dodo pour être en forme ce soir",
    "Enfait c’est ça la surprise au bout du compte à rebours",
    "Papa, t'es où ?",
    "Qui pour un petit brunch ou petite balade bordu",
    "Nous sommes très excités",
    "Hâte d’y être et d’y survivre !",
    "Prête pour vous fêter",
    "Sauver la vallée, ça creuse",
    "Survivant de la teuf",
    "Je sais pas vous mais cette première journée",
    "On a trouvé 2 américains perdus en Valais",
    "Y a tellement de gens qui viennent sauver le valais",
    "Hâte de manger du fromage",
    "La team matinale est fin prête",
]
def choisis_posts():
    out = []
    for motif in CHOIX_FIL:
        for p in posts:
            txt = (p.get('texte') or '')
            if motif[:34].lower() in txt.lower():
                if p not in out: out.append(p)
                break
    return out

def emoji_img(nom):
    return f'<img class="ic" src="assets/{nom}" alt="">'

def bloc_post(p):
    k = len(p.get('kudos_ids') or [])
    cs = commentaires_de(p['id'])
    ph = ""
    for n, m in idxphotos.items():
        if m.get('fichier') == p.get('photo_path'):
            num = ordre.index(n + ".jpg") + 1
            if str(num) in images:
                ph = f'<img class="post-photo" src="photos/{images[str(num)]["fichier"]}" loading="lazy" alt="">'
            break
    cornes = f'<span class="compteur">{emoji_img("corne-96.png")} {k}</span>' if k else ""
    fils = ""
    for qui, txt, rs in cs:
        rr = f'<span class="reacs">{e(rs.replace("corne", "🐐"))}</span>' if rs else ""
        fils += (f'<div class="com">{emoji_img("marmotte-96.png")}<div><b>{e(qui)}</b> '
                 f'{e(txt)}{rr}</div></div>')
    return (f'<article class="post" style="--r:{biais(abs(hash(p["id"]))%997, 1.4)}deg">'
            f'<header><b>{e(p.get("author_name"))}</b>{cornes}</header>'
            f'<p>{e(p.get("texte"))}</p>{ph}{fils}</article>')

# ------------------------------------------------------------------ le quiz
joues = [cid for cid, n in stats.items() if n]
ordre_defis = sorted(joues, key=lambda c: (-stats[c], defis.get(c, {}).get('name') or ''))

def bloc_quiz(cid):
    d = defis.get(cid)
    if not d or not d.get('quiz'): return ""
    qs = ""
    for q in d['quiz']:
        bonne = q['options'][q['answer']]
        qs += (f'<li><p class="q">{e(q["q"])}</p>'
               f'<p class="r">{e(bonne)}</p>'
               f'<p class="w">{e(q["why"])}</p></li>')
    return (f'<div class="fiche"><h4>{e(d["name"])}'
            f'<span>{stats[cid]} passage{"s" if stats[cid]>1 else ""}</span></h4>'
            f'<ol class="quiz">{qs}</ol></div>')

# ratages
evts = {}
for l in lock:
    evts.setdefault(l['client_id'], []).append(l)
from collections import Counter
rat = Counter(r[0]['challenge_id'] for r in evts.values())
declencheurs = Counter(parts.get(r[0]['triggered_by'], '?') for r in evts.values())

SYN = {
 "le-pari-du-berger": ("Le pari du berger", "Montagne et Vie Alpine"),
 "la-memoire-de-la-glace": ("La mémoire de la glace", "Montagne et Mémoire"),
 "la-vie-dautrefois": ("La vie d'autrefois", "Patrimoine et Mémoire"),
}
syn_par = {}
for u in unlocks:
    syn_par.setdefault(u['synergy_id'], []).append(parts.get(u['participant_id'], '?'))

# ------------------------------------------------------------------- pages
def chapitre(cle_, titre, sous, nums, grand=None):
    ph = "".join(carte(n, "large" if grand and n in grand else "") for n in nums if n not in ECARTES)
    return (f'<section class="chap" id="{cle_}">'
            f'<div class="titre"><h2 class="plume">{e(titre)}</h2>'
            f'<p class="anton">{e(sous)}</p></div>'
            f'<div class="grille">{ph}</div></section>')

GRANDS = {154, 157, 193, 165, 150, 56, 171, 185, 179, 151, 121, 173, 149, 137, 176}


SOMMAIRE = [("couv","Couverture"),("verdict","Le verdict"),("podium","Podium"),
            ("avant","Avant"),("matin","Samedi 10h"),("defis","Les défis"),
            ("desalpe","La désalpe"),("quiz","Les questions"),("ratages","Les ratages"),
            ("synergies","Découvertes"),("apres","Le soir"),("ceremonie","La cérémonie"),
            ("nuit","La nuit"),("fil","Le fil"),("chiffres","Les chiffres")]
nav = "".join(f'<li><a href="#{i}">{e(t)}</a></li>' for i, t in SOMMAIRE)
SOMMAIRE_HTML = f'<nav class="sommaire"><ul>{nav}</ul></nav>'

LOUPE_HTML = """
<div class="loupe" id="loupe" role="dialog" aria-modal="true" aria-label="Photo en grand">
  <button class="fermer" aria-label="Fermer">✕</button>
  <button class="prec" aria-label="Précédente">‹</button>
  <button class="suiv" aria-label="Suivante">›</button>
  <img alt="">
  <div class="leg"></div>
</div>
<script>
(function(){
  // Toutes les photos de l'album, dans l'ordre de la page.
  var figures = Array.prototype.slice.call(document.querySelectorAll('.photo'))
        .filter(function(f){ return f.querySelector('img'); });
  var boite = document.getElementById('loupe');
  var img = boite.querySelector('img');
  var leg = boite.querySelector('.leg');
  var i = 0;
  function montre(n){
    if (!figures.length) return;
    i = (n + figures.length) % figures.length;
    var f = figures[i];
    var src = f.querySelector('img').getAttribute('src');
    img.src = src;
    var c = f.querySelector('figcaption');
    leg.innerHTML = c ? c.innerHTML : '';
    boite.classList.add('on');
    document.body.style.overflow = 'hidden';
  }
  function ferme(){
    boite.classList.remove('on');
    document.body.style.overflow = '';
    img.removeAttribute('src');
  }
  figures.forEach(function(f, n){
    var z = f.querySelector('.cadre');
    if (!z) return;
    z.addEventListener('click', function(ev){
      if (ev.target.tagName === 'VIDEO') return;   // une vidéo se joue sur place
      montre(n);
    });
  });
  boite.querySelector('.fermer').addEventListener('click', ferme);
  boite.querySelector('.prec').addEventListener('click', function(ev){ ev.stopPropagation(); montre(i-1); });
  boite.querySelector('.suiv').addEventListener('click', function(ev){ ev.stopPropagation(); montre(i+1); });
  boite.addEventListener('click', function(ev){ if (ev.target === boite || ev.target === leg) ferme(); });
  document.addEventListener('keydown', function(ev){
    if (!boite.classList.contains('on')) return;
    if (ev.key === 'Escape') ferme();
    if (ev.key === 'ArrowLeft') montre(i-1);
    if (ev.key === 'ArrowRight') montre(i+1);
  });

  // Le chapitre en cours s'allume dans le sommaire.
  var liens = Array.prototype.slice.call(document.querySelectorAll('.sommaire a'));
  var cibles = liens.map(function(a){ return document.querySelector(a.getAttribute('href')); });
  function suit(){
    var y = window.scrollY + 120, actif = 0;
    cibles.forEach(function(c, n){ if (c && c.offsetTop <= y) actif = n; });
    liens.forEach(function(a, n){ a.classList.toggle('ici', n === actif); });
  }
  window.addEventListener('scroll', function(){ window.requestAnimationFrame(suit); }, {passive:true});
  suit();
})();
</script>
"""

parties = []

# --- couverture
parties.append(f'''
<section class="couv" id="couv">
  <div class="couv-fond">
    <img src="photos/p165.jpg" alt="">
  </div>
  <div class="couv-collage">
    <img class="c1" src="photos/p154.jpg" alt="">
    <img class="c2" src="photos/p056.jpg" alt="">
    <img class="c3" src="photos/p179.jpg" alt="">
    <img class="c4" src="photos/p193.jpg" alt="">
  </div>
  <div class="couv-texte">
    <p class="sur anton">Le Val d'Anniviers en</p>
    <h1 class="plume">2056</h1>
    <p class="anton gros">La vallée sauvée</p>
    <p class="main">Chapitre 30.</p>
    <p class="date">Chandolin · 19 septembre 2026</p>
  </div>
</section>''')

# --- verdict
jauges = "".join(
  f'<div class="jauge"><span class="nom">{e(g["short"])}</span>'
  f'<span class="barre"><i style="width:{min(100, round(100*g["points"]/g["max_points"]))}%"></i></span>'
  f'<span class="val">{g["points"]}<small>/{g["max_points"]}</small></span></div>'
  for g in sorted(gauges, key=lambda x: x['sort_order']))
parties.append(f'''
<section class="chap verdict" id="verdict">
  <div class="titre"><h2 class="plume">Le verdict</h2><p class="anton">Ce qu'il fallait : 700 points, et aucun pilier sous 40</p></div>
  <div class="carton">
    <p class="score">{collectif['total']}<small> / 1000</small></p>
    <p class="main gagne">La vallée est sauvée.</p>
    <div class="jauges">{jauges}</div>
    <p class="note">Le pilier le plus faible termine à {collectif['pilier_le_plus_bas']} points, soit près de trois fois le plancher exigé.
    Montagne et Vie Alpine ont rempli leur jauge jusqu'au bord.</p>
  </div>
</section>''')

# --- podium
cartes_podium = ""
for rang, titre, gens, txt in PODIUM:
    noms = "".join(f'<li>{e(g)}</li>' for g in gens)
    cartes_podium += (f'<div class="marche m{rang}"><span class="rang plume">{rang}</span>'
                      f'<h3 class="anton">{e(titre)}</h3><ul>{noms}</ul><p>{e(txt)}</p></div>')
parties.append(f'''
<section class="chap" id="podium">
  <div class="titre"><h2 class="plume">Le podium</h2><p class="anton">Deux égalités, trois marches, six vainqueurs</p></div>
  <div class="podium">{cartes_podium}</div>
  <p class="apres-podium">Et derrière, dans l'ordre : Clara Dechamps et Leandro Sanz à 250, Clara Defourt et Le maitre à 230,
  Alice Pap à 210, Louis van weddingen à 190. Trente personnes ont validé au moins un défi.</p>
</section>''')

# --- chapitres photo
for cle_, titre, sous, nums in CHAPITRES:
    if cle_ == "desalpe":
        v = [x for x in videos if x.get('defi') == "La désalpe d'Ayer"]
        extra = ""
        if v:
            extra = (f'<figure class="photo large ru1" style="--r:-1.2deg"><div class="cadre">'
                     f'<video src="videos/{v[0]["f"].replace(".mov",".mp4")}" controls playsinline preload="metadata"></video></div>'
                     f'<figcaption><b>Le son des cloches</b><span>{e(v[0]["qui"])}</span></figcaption></figure>')
        ph = "".join(carte(n, "large") for n in nums) + extra
        parties.append(f'<section class="chap" id="{cle_}"><div class="titre">'
                       f'<h2 class="plume">{e(titre)}</h2><p class="anton">{e(sous)}</p></div>'
                       f'<div class="grille">{ph}</div></section>')
        cle_ = "desalpe_apres"
    if cle_ != "desalpe_apres":
        parties.append(chapitre(cle_, titre, sous, nums, GRANDS))
    if cle_ == "desalpe_apres":
        # le quiz vient juste apres la desalpe
        v = [x for x in videos if x.get('defi') == "Sommet et souffle"]
        vid = ""
        if v:
            vid = (f'<figure class="photo large ru2" style="--r:1deg"><div class="cadre">'
                   f'<video src="videos/{v[0]["f"].replace(".mov",".mp4")}" controls playsinline preload="metadata"></video></div>'
                   f'<figcaption><b>Sommet et souffle</b><span>{e(v[0]["qui"])}</span></figcaption></figure>')
        fiches = "".join(bloc_quiz(c) for c in ordre_defis)
        parties.append(f'''
<section class="chap" id="quiz">
  <div class="titre"><h2 class="plume">Les questions</h2><p class="anton">Tout ce qu'il a fallu savoir, et les bonnes réponses</p></div>
  <p class="intro">Trois cent dix neuf réponses données dans la journée, sur les trente neuf défis qui ont été joués.
  Une seule erreur et le défi était perdu pour tout le groupe présent, avec trente minutes d'attente.
  Voici les questions, dans l'ordre des défis les plus joués.</p>
  {vid}
  <div class="fiches">{fiches}</div>
</section>''')
        # les ratages
        lignes = ""
        for cid, n in rat.most_common():
            d = defis.get(cid, {})
            lignes += (f'<tr><td>{e(d.get("name", cid))}</td><td class="num">{n}</td>'
                       f'<td class="num">{stats.get(cid, 0)}</td></tr>')
        decl = "".join(f'<li>{e(nom)} <span>{n}</span></li>' for nom, n in declencheurs.most_common())
        parties.append(f'''
<section class="chap" id="ratages">
  <div class="titre"><h2 class="plume">Là où ça a coincé</h2><p class="anton">Vingt quiz ratés, et trente minutes à attendre à chaque fois</p></div>
  <div class="deux">
    <div class="carton petit">
      <h3 class="anton">Les défis qui ont fait mal</h3>
      <table><thead><tr><th>Défi</th><th>Ratages</th><th>Réussites</th></tr></thead><tbody>{lignes}</tbody></table>
      <p class="note">Panorama nommé aura été le juge de paix de la journée : sept groupes l'ont validé,
      quatre s'y sont cassé les dents. Reconnaître le Weisshorn du Zinalrothorn n'était pas donné.</p>
    </div>
    <div class="carton petit">
      <h3 class="anton">Qui a appuyé sur le mauvais bouton</h3>
      <ul class="palmares">{decl}</ul>
      <p class="note">Sans rancune : la pénalité tombait sur tout le groupe présent, jamais sur une seule personne.
      Quatre vingt quinze soumissions sur quatre vingt dix sept sont passées du premier coup.</p>
    </div>
  </div>
</section>''')
        # synergies
        cartes_syn = ""
        for sid, gens in syn_par.items():
            nom, piliers = SYN.get(sid, (sid, ""))
            cartes_syn += (f'<div class="syn"><h3 class="plume">{e(nom)}</h3>'
                           f'<p class="anton">{e(piliers)}</p>'
                           f'<p>{e(", ".join(gens))}</p></div>')
        parties.append(f'''
<section class="chap" id="synergies">
  <div class="titre"><h2 class="plume">Les découvertes</h2><p class="anton">Trois des cinq secrets ont été trouvés</p></div>
  <p class="intro">Personne ne les avait annoncées. Elles se déclenchaient toutes seules quand deux choses
  faites dans la journée se répondaient : un témoignage qui confirmait une mesure, un savoir faire
  qui expliquait un paysage. Onze personnes en ont vu passer une.</p>
  <div class="syns">{cartes_syn}</div>
</section>''')

# --- le fil
blocs = "".join(bloc_post(p) for p in choisis_posts())
parties.append(f'''
<section class="chap" id="fil">
  <div class="titre"><h2 class="plume">Le fil</h2><p class="anton">Cent trente huit publications, cent vingt quatre cornes de bouquetin</p></div>
  <p class="intro">Il a commencé quatre jours avant, quand personne ne savait encore ce qui l'attendait,
  et il ne s'est plus arrêté. Voici ce qu'on y a écrit.</p>
  <div class="mur">{blocs}</div>
</section>''')

# --- chiffres
CHIFFRES = [
    ("41", "inscrits"), ("30", "ont validé au moins un défi"), ("97", "défis validés"),
    ("39", "défis sur 52 joués"), ("319", "réponses de quiz"), ("20", "quiz ratés"),
    ("11", "découvertes cachées"), ("138", "publications"), ("124", "cornes de bouquetin"),
    ("48", "cris de marmotte"), ("113", "photos dans l'application"), ("807", "points sur 1000"),
]
gc = "".join(f'<div><b class="anton">{n}</b><span>{e(l)}</span></div>' for n, l in CHIFFRES)
parties.append(f'''
<section class="chap" id="chiffres">
  <div class="titre"><h2 class="plume">Les chiffres</h2><p class="anton">Une journée, du 19 septembre 10h09 au 19 septembre 18h02</p></div>
  <div class="chiffres">{gc}</div>
  <p class="fin main">Merci d'être venus sauver une vallée.</p>
</section>''')

CSS = """
@import url('https://fonts.googleapis.com/css2?family=Anton&family=Caveat:wght@500;700&family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=Pinyon+Script&display=swap');
:root{
  --papier:#EDE4D4; --papier2:#E5DAC6; --encre:#2A2320; --doux:#7A6E60;
  --bordeaux:#8C3B2E; --or:#C29A2E; --beurre:#F1E3A5; --bleu:#6C86A9;
  --ombre:rgba(60,45,30,.22);
}
*{box-sizing:border-box}
body{margin:0;background:var(--papier);color:var(--encre);
  font-family:'EB Garamond',Georgia,serif;font-size:18px;line-height:1.55;
  background-image:
    radial-gradient(circle at 20% 30%, rgba(160,140,110,.05) 0 2px, transparent 2px),
    radial-gradient(circle at 70% 60%, rgba(140,120,95,.045) 0 1.5px, transparent 2px),
    radial-gradient(circle at 45% 85%, rgba(170,150,120,.05) 0 2px, transparent 2px);
  background-size:180px 180px, 130px 130px, 220px 220px;}
img,video{max-width:100%;display:block}
.plume{font-family:'Pinyon Script',cursive;font-weight:400;color:var(--or);
  text-shadow:0 1px 0 rgba(255,250,235,.7), 0 3px 10px rgba(120,95,40,.18);}
.anton{font-family:'Anton',Impact,sans-serif;text-transform:uppercase;letter-spacing:.06em;font-weight:400}
.main{font-family:'Caveat',cursive;color:var(--bordeaux)}

/* ----------------------------------------------------------- couverture */
.couv{position:relative;min-height:100svh;display:grid;place-items:center;overflow:hidden;
  padding:4rem 1rem;isolation:isolate}
.couv-fond{position:absolute;inset:0;z-index:-2}
.couv-fond img{width:100%;height:100%;object-fit:cover;filter:saturate(.75) contrast(1.05)}
.couv-fond::after{content:"";position:absolute;inset:0;
  background:linear-gradient(180deg, rgba(237,228,212,.72) 0%, rgba(237,228,212,.35) 35%, rgba(42,35,32,.55) 100%)}
.couv-collage{position:absolute;inset:0;z-index:-1}
.couv-collage img{position:absolute;border:7px solid #fffdf6;box-shadow:0 10px 30px var(--ombre);object-fit:cover}
.couv-collage .c1{width:36vmin;height:24vmin;left:3%;top:8%;transform:rotate(-5deg)}
.couv-collage .c2{width:26vmin;height:26vmin;right:4%;top:12%;transform:rotate(4deg)}
.couv-collage .c3{width:24vmin;height:30vmin;left:8%;bottom:6%;transform:rotate(3deg)}
.couv-collage .c4{width:34vmin;height:20vmin;right:5%;bottom:8%;transform:rotate(-3deg)}
.couv-texte{text-align:center;position:relative;z-index:2;max-width:min(92vw,760px)}
.couv-texte .sur{font-size:clamp(.9rem,2.4vw,1.5rem);color:#fffaf0;margin:0;
  text-shadow:0 2px 12px rgba(30,25,20,.5)}
.couv-texte h1{font-size:clamp(5rem,20vw,14rem);margin:-.06em 0 0;line-height:.9;color:var(--beurre);
  text-shadow:0 2px 0 rgba(120,95,40,.35), 0 12px 40px rgba(20,16,12,.55)}
.couv-texte .gros{font-size:clamp(1.6rem,6vw,4rem);margin:.1em 0 0;color:#fffaf0;
  text-shadow:0 3px 18px rgba(20,16,12,.6)}
.couv-texte .main{font-size:clamp(1.6rem,4.5vw,2.8rem);margin:.5rem 0 0;color:var(--beurre)}
.couv-texte .date{font-variant:small-caps;letter-spacing:.14em;color:#fffaf0;opacity:.9;margin:.4rem 0 0}

/* --------------------------------------------------------------- pages */
.chap{max-width:1180px;margin:0 auto;padding:4.5rem 1.2rem 2rem}
.titre{text-align:center;margin-bottom:2.2rem;position:relative}
.titre h2{font-size:clamp(3rem,9vw,6rem);margin:0;line-height:.95}
.titre p{margin:.2rem 0 0;font-size:clamp(.72rem,1.7vw,1rem);color:var(--bordeaux)}
.titre::after{content:"";display:block;width:120px;height:2px;margin:1.1rem auto 0;
  background:linear-gradient(90deg,transparent,var(--or),transparent)}
.intro{max-width:62ch;margin:0 auto 2rem;text-align:center;color:var(--doux);font-size:1.05rem}

/* --------------------------------------------------------------- photos */
.grille{columns:3 300px;column-gap:1.4rem}
.photo{break-inside:avoid;margin:0 0 1.8rem;background:#fffdf6;padding:.7rem .7rem .2rem;
  box-shadow:0 6px 18px var(--ombre);transform:rotate(var(--r,0deg));position:relative;
  transition:transform .25s ease, box-shadow .25s ease}
.photo:hover{transform:rotate(0deg) scale(1.02);box-shadow:0 14px 34px rgba(60,45,30,.3);z-index:3}
.photo .cadre{overflow:hidden;background:#e8e0d0}
.photo img,.photo video{width:100%;height:auto;object-fit:cover}
.photo figcaption{font-family:'Caveat',cursive;font-size:1.12rem;line-height:1.3;
  padding:.45rem .2rem .6rem;color:var(--encre)}
.photo figcaption b{font-weight:700}
.photo figcaption i{color:var(--doux);font-style:italic}
.photo figcaption span{display:block;font-size:.92rem;color:var(--bordeaux);opacity:.85}
.photo.large{columns:unset}
.photo::before{content:"";position:absolute;width:74px;height:22px;
  background:linear-gradient(180deg, rgba(241,227,165,.75), rgba(226,208,140,.6));
  box-shadow:0 1px 3px rgba(80,65,40,.18);opacity:.9}
.photo.ru0::before{top:-11px;left:12%;transform:rotate(-4deg)}
.photo.ru1::before{top:-11px;right:14%;transform:rotate(5deg)}
.photo.ru2::before{top:-11px;left:44%;transform:rotate(-2deg)}
.photo.ru3::before{top:-11px;right:8%;transform:rotate(7deg)}

/* --------------------------------------------------------------- verdict */
.carton{background:#fffdf6;border:1px solid rgba(140,120,90,.25);box-shadow:0 8px 26px var(--ombre);
  padding:2rem 1.6rem;max-width:760px;margin:0 auto;text-align:center;position:relative}
.carton::after{content:"";position:absolute;inset:6px;border:1px solid rgba(194,154,46,.35);pointer-events:none}
.score{font-family:'Anton',sans-serif;font-size:clamp(4rem,14vw,9rem);line-height:.9;margin:0;color:var(--bordeaux)}
.score small{font-size:.28em;color:var(--doux);letter-spacing:.05em}
.gagne{font-size:clamp(1.8rem,5vw,3rem);margin:.2rem 0 1.4rem}
.jauges{display:grid;gap:.55rem;max-width:520px;margin:0 auto 1.2rem;text-align:left}
.jauge{display:grid;grid-template-columns:7.5rem 1fr 4.5rem;align-items:center;gap:.6rem;font-size:.95rem}
.jauge .nom{font-variant:small-caps;letter-spacing:.06em;color:var(--doux)}
.jauge .barre{height:12px;background:#e6dcc8;position:relative;overflow:hidden}
.jauge .barre i{position:absolute;inset:0 auto 0 0;background:linear-gradient(90deg,var(--or),#d8b755)}
.jauge .val{text-align:right;font-weight:600}
.jauge .val small{color:var(--doux)}
.note{font-size:.92rem;color:var(--doux);max-width:56ch;margin:1rem auto 0}

/* --------------------------------------------------------------- podium */
.podium{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1.6rem;align-items:start}
.marche{background:#fffdf6;padding:1.6rem 1.2rem;box-shadow:0 8px 24px var(--ombre);text-align:center;
  border-top:5px solid var(--or);position:relative}
.marche .rang{font-size:4.5rem;line-height:.8;display:block}
.marche h3{margin:.2rem 0 .7rem;font-size:1rem;color:var(--bordeaux)}
.marche ul{list-style:none;padding:0;margin:0 0 .8rem;font-size:1.3rem;font-weight:600}
.marche p{font-size:.92rem;color:var(--doux);margin:0}
.marche.m1{border-top-color:var(--or);transform:rotate(-1deg)}
.marche.m2{border-top-color:#b9b2a4;transform:rotate(.8deg)}
.marche.m3{border-top-color:#b08a5e;transform:rotate(-.6deg)}
.apres-podium{text-align:center;max-width:62ch;margin:1.8rem auto 0;color:var(--doux);font-size:.98rem}

/* ----------------------------------------------------------------- quiz */
.fiches{columns:2 340px;column-gap:1.4rem}
.fiche{break-inside:avoid;background:#fffdf6;border:1px solid rgba(140,120,90,.22);
  box-shadow:0 5px 16px rgba(60,45,30,.14);padding:1rem 1.1rem;margin:0 0 1.4rem}
.fiche h4{margin:0 0 .6rem;font-family:'Anton',sans-serif;text-transform:uppercase;letter-spacing:.05em;
  font-size:.95rem;color:var(--bordeaux);display:flex;justify-content:space-between;gap:.6rem;align-items:baseline}
.fiche h4 span{font-family:'EB Garamond',serif;text-transform:none;letter-spacing:0;
  font-size:.8rem;color:var(--doux);white-space:nowrap}
.quiz{list-style:none;padding:0;margin:0;counter-reset:q}
.quiz li{margin:0 0 .9rem;padding-left:1.6rem;position:relative}
.quiz li::before{counter-increment:q;content:counter(q);position:absolute;left:0;top:.1rem;
  font-family:'Anton',sans-serif;font-size:.8rem;color:var(--or)}
.quiz .q{margin:0;font-weight:600;font-size:.98rem}
.quiz .r{margin:.15rem 0 0;color:var(--bordeaux);font-size:.98rem}
.quiz .r::before{content:"→ "}
.quiz .w{margin:.1rem 0 0;font-size:.86rem;color:var(--doux);font-style:italic}

/* -------------------------------------------------------------- ratages */
.deux{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1.6rem;align-items:start}
.carton.petit{max-width:none;text-align:left;padding:1.4rem 1.3rem}
.carton.petit h3{margin:0 0 .8rem;font-size:.95rem;color:var(--bordeaux)}
table{width:100%;border-collapse:collapse;font-size:.95rem}
th{text-align:left;font-variant:small-caps;letter-spacing:.06em;color:var(--doux);font-weight:400;
  border-bottom:1px solid rgba(140,120,90,.3);padding:.2rem 0}
td{padding:.28rem 0;border-bottom:1px dotted rgba(140,120,90,.25)}
td.num,th:not(:first-child){text-align:right}
.palmares{list-style:none;padding:0;margin:0;font-size:.98rem}
.palmares li{display:flex;justify-content:space-between;padding:.22rem 0;
  border-bottom:1px dotted rgba(140,120,90,.25)}
.palmares span{font-family:'Anton',sans-serif;color:var(--bordeaux)}

/* ------------------------------------------------------------ synergies */
.syns{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1.4rem}
.syn{background:#fffdf6;padding:1.4rem 1.2rem;text-align:center;box-shadow:0 6px 18px var(--ombre);
  border:1px solid rgba(194,154,46,.35)}
.syn h3{font-size:2.1rem;margin:0}
.syn .anton{font-size:.7rem;color:var(--bleu);margin:.1rem 0 .7rem}
.syn p:last-child{margin:0;font-size:.95rem;color:var(--doux)}

/* ------------------------------------------------------------------ fil */
.mur{columns:3 320px;column-gap:1.4rem}
.post{break-inside:avoid;background:#fffdf6;box-shadow:0 6px 18px var(--ombre);
  padding:1rem 1.1rem;margin:0 0 1.5rem;transform:rotate(var(--r,0deg))}
.post header{display:flex;justify-content:space-between;align-items:center;gap:.6rem;
  border-bottom:1px dotted rgba(140,120,90,.35);padding-bottom:.35rem;margin-bottom:.5rem}
.post header b{font-variant:small-caps;letter-spacing:.05em;font-size:1.05rem}
.compteur{display:inline-flex;align-items:center;gap:.25rem;font-family:'Anton',sans-serif;
  font-size:.9rem;color:var(--bordeaux)}
.ic{width:19px;height:19px;display:inline-block}
.post p{margin:0 0 .6rem;font-size:1.02rem}
.post-photo{width:100%;margin:.2rem 0 .6rem;border:5px solid #fff;box-shadow:0 3px 10px rgba(60,45,30,.2)}
.com{display:flex;gap:.45rem;align-items:flex-start;font-size:.92rem;color:var(--doux);
  border-top:1px dotted rgba(140,120,90,.3);padding-top:.4rem;margin-top:.4rem}
.com b{color:var(--encre)}
.reacs{margin-left:.3rem}

/* ------------------------------------------------------------- chiffres */
.chiffres{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1.2rem;text-align:center}
.chiffres div{background:#fffdf6;padding:1.1rem .6rem;box-shadow:0 5px 14px var(--ombre)}
.chiffres b{display:block;font-size:2.4rem;color:var(--bordeaux);line-height:1}
.chiffres span{font-size:.82rem;color:var(--doux);font-variant:small-caps;letter-spacing:.04em}
.fin{text-align:center;font-size:clamp(1.8rem,5vw,3rem);margin:3rem 0 1rem}

/* ------------------------------------------------------------ sommaire */
.sommaire{position:sticky;top:0;z-index:40;background:rgba(237,228,212,.93);
  backdrop-filter:blur(6px);border-bottom:1px solid rgba(140,120,90,.3)}
.sommaire ul{list-style:none;display:flex;gap:.1rem;margin:0;padding:.45rem .6rem;
  overflow-x:auto;justify-content:center;scrollbar-width:none}
.sommaire ul::-webkit-scrollbar{display:none}
.sommaire a{font-family:'Anton',sans-serif;text-transform:uppercase;letter-spacing:.07em;
  font-size:.62rem;color:var(--doux);text-decoration:none;white-space:nowrap;
  padding:.35rem .55rem;border-radius:2px}
.sommaire a:hover,.sommaire a.ici{color:var(--bordeaux);background:rgba(194,154,46,.16)}

/* ------------------------------------------------------------- loupe */
.loupe{position:fixed;inset:0;z-index:100;background:rgba(28,23,19,.94);
  display:none;place-items:center;padding:1.2rem}
.loupe.on{display:grid}
.loupe img{max-width:96vw;max-height:84vh;object-fit:contain;
  border:9px solid #fffdf6;box-shadow:0 20px 60px rgba(0,0,0,.6)}
.loupe .leg{position:absolute;left:0;right:0;bottom:0;padding:1.4rem 1rem .9rem;
  text-align:center;color:#fdf6e6;font-family:'Caveat',cursive;font-size:1.3rem;
  background:linear-gradient(to top,rgba(20,16,12,.9),transparent)}
.loupe .leg span{display:block;font-size:.95rem;color:var(--beurre);opacity:.9}
.loupe button{position:absolute;background:rgba(255,253,246,.14);color:#fdf6e6;
  border:0;font-size:1.6rem;width:46px;height:46px;border-radius:50%;cursor:pointer}
.loupe .fermer{top:1rem;right:1rem;font-size:1.2rem}
.loupe .prec{left:1rem;top:50%;transform:translateY(-50%)}
.loupe .suiv{right:1rem;top:50%;transform:translateY(-50%)}
.photo .cadre{cursor:zoom-in}
@media (max-width:640px){ .sommaire ul{justify-content:flex-start} }

@media (max-width:640px){
  body{font-size:17px}
  .grille,.mur,.fiches{columns:1}
  .chap{padding:3rem .9rem 1.5rem}
}
@media print{ .photo:hover{transform:rotate(var(--r,0deg))} }
"""

doc = f"""<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Anniviers 2056</title>
<style>{CSS}</style>
{parties[0]}
{SOMMAIRE_HTML}
{''.join(parties[1:])}
{LOUPE_HTML}
"""
(PROJ/"album"/"index.html").write_text(doc, encoding="utf-8")
print("album ecrit :", len(doc)//1024, "ko de html")

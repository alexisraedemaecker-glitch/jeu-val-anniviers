# Le Val d'Anniviers en 2056

Application web du jeu d'anniversaire d'une journée dans le Val d'Anniviers.
Trente neuf défis, cinq piliers à faire remonter, cinq découvertes cachées.

Le contenu du jeu (trame, défis, quiz, synergies, règles de score) est décrit
dans `val-anniviers-2056-document-reference.md`.

## En deux mots

- Site statique, sans étape de compilation. Ce qui est dans le dépôt est
  exactement ce qui tourne dans le navigateur.
- Hébergé sur GitHub Pages, publié automatiquement à chaque envoi sur `main`.
- Base de données, stockage des photos et temps réel sur Supabase.
- Aucune carte bancaire nécessaire, à aucune étape.

## Organisation des fichiers

```
index.html               page unique
app.css                  styles
sw.js                    mise en cache pour fonctionner sans réseau
manifest.webmanifest     ajout à l'écran d'accueil
js/
  config.js              URL et clé publique Supabase
  store.js               état, temps réel, file d'attente, synergies
  queue.js               file d'attente locale dans IndexedDB
  image.js               compression des photos
  data/                  catalogue des défis, piliers, synergies
  ui/                    les écrans
  vendor/                Preact et le client Supabase, copiés localement
supabase/
  01_schema.sql          tables et vues
  02_functions.sql       fonctions serveur
  03_security.sql        RLS, droits, stockage, temps réel
  04_seed.sql            catalogue, généré depuis js/data
assets/
  randos/                profils, tracés et GPX, générés depuis Randos/
  photos/                photos fournies
Randos/                  vos fichiers GPX d'origine, non publiés
tools/
  check.py               contrôles de cohérence du catalogue
  gpx.py                 lit les GPX, dessine profils et tracés
  gen_seed.py            régénère 04_seed.sql depuis js/data
  gen_icons.py           régénère les icônes
  shuffle_quiz.py        répartit la position des bonnes réponses
  apply_sql.py           applique les fichiers SQL à Supabase
  selftest.py            tests de bout en bout contre la vraie base
  reset_jour_j.py        remise à zéro avant l'événement
```

## Illustration évolutive de la vallée

Six images, une par palier de restauration, affichées au dessus des jauges sur
l'écran des piliers. Le palier suit le pourcentage de progression collective,
calculé exactement comme la condition de victoire.

Les sources vivent dans `EvolutionValAnniviers`, nommées par leur palier.
`tools/gen_vallee.py` les renomme, les réduit et les recompresse vers
`assets/vallee/`, en version large et en version étroite pour les petits
écrans, puis écrit `js/data/vallee.js`.

```bash
python3 tools/gen_vallee.py
```

Le changement de palier est un fondu d'une seconde. La nouvelle image est
préchargée avant que le fondu commence, et l'ancienne n'est retirée qu'à la
fin, ce qui évite tout clignotement. Les six images sont préchargées par le
service worker, donc l'illustration reste visible sans réseau.

## Un piège de htm à connaître

htm supprime complètement l'espace quand un saut de ligne sépare du texte d'une
expression. `Il reste\n  ${n} points` affiche `Il reste700 points`. Écrire
`${" "}` avant le saut, ou garder le texte et l'expression sur la même ligne.

`tools/check_espaces.py` détecte ce motif dans tous les gabarits et fait échouer
la publication le cas échéant.

## L'onglet Activités

Accessible sans s'identifier, puisqu'il ne dépend d'aucune donnée de jeu.
Quatre catégories, les mêmes que celles des défis.

La partie sportive est entièrement dérivée des fichiers GPX du dossier
`Randos`. `tools/gpx.py` calcule distance, dénivelé et durée, puis dessine le
profil altimétrique et le tracé en SVG à partir des seules données du fichier.
Le dénivelé est calculé sur des altitudes lissées avec un seuil, sinon le bruit
GPS ajoute des centaines de mètres imaginaires. La durée suit la méthode des
panneaux suisses : 4 km/h à plat, 300 m/h en montée, 500 m/h en descente, le
plus grand des deux verticaux plus la moitié du plus petit.

Chaque randonnée vit dans son sous dossier de `Randos`, avec son fichier GPX et
ses photos. Les images sont redimensionnées à 1100 pixels, recompressées, puis
dédupliquées par contenu : une photo qui illustre deux randonnées n'est stockée
qu'une fois mais reste listée dans les deux fiches. Les légendes sont déduites du
nom de fichier, puis corrigées par la table `LEGENDES` de `tools/gpx.py`.

L'AVIF est copié tel quel : `sips` ne sait pas le lire, et ce format est de toute
façon déjà très compact.

Après toute modification du dossier `Randos` :

```bash
python3 tools/gpx.py --build
```

Cela réécrit `assets/randos/` et `js/data/randos-stats.js`. Les textes rédigés à
la main vivent séparément dans `js/data/activites.js` et ne sont jamais touchés.

Les horaires de bus sont lus en direct dans l'horaire officiel suisse, via
transport.opendata.ch, avec repli sur un lien vers les CFF si le réseau manque.

## Administration

L'écran d'administration, protégé par le code organisateur, se trouve dans
l'onglet Moi puis Administration. Cinq onglets :

- **Tableau de bord** : avancement des jauges, couverture du catalogue, défis
  jamais joués, découvertes trouvées, inscrits sans aucun défi.
- **Soumissions** : toutes les soumissions avec leurs photos, et la suppression.
- **Joueurs** : renommer ou supprimer un profil, repérage des doublons.
- **Attentes** : les pénalités en cours, levables une par une ou toutes.
- **Réglages** : durée de l'attente, et remise à zéro du jeu.

Toutes ces fonctions vérifient le code organisateur côté serveur. Le droit de
les appeler ne suffit pas à en faire quoi que ce soit.

## Règles du jeu implémentées

**Rendement dégressif sur les jauges.** Pour un même défi, la première
validation de la journée verse 100 pourcent de ses points à la jauge de son
pilier, la deuxième 50 pourcent, la troisième 25, et ainsi de suite. Le calcul
se fait à la lecture, avec une fonction de fenêtrage SQL, ce qui veut dire que
supprimer une soumission retasse automatiquement toutes les suivantes.

**Score personnel.** Chaque personne présente dans le groupe du moment reçoit
les points pleins du défi, sans jamais subir la dégressivité. Un même défi ne
compte qu'une seule fois par personne, même si elle le refait avec un autre
groupe.

**Synergies.** Recalculées entièrement à chaque soumission et à chaque
suppression, donc toujours cohérentes avec l'état réel des soumissions. Le
bonus de 10 points est personnel et va à chaque personne qui débloque la
synergie. Le bonus de 5 points sur chacune des deux jauges n'est versé qu'une
seule fois, à la première découverte.

**Quiz sans droit à l'erreur.** Une mauvaise réponse fait rater le défi pour
toute l'équipe présente, qui doit attendre avant de pouvoir le reprendre. La
durée vit dans `app_settings` et se règle depuis l'écran d'administration, sans
redéploiement. Le blocage est vérifié côté serveur au moment de la soumission,
recharger l'application ne le contourne donc pas. Un verrou local prend effet
immédiatement, même sans réseau, et le signalement du ratage passe par la même
file d'attente que les soumissions.

Conséquence sur l'écran de défi : le groupe du moment se choisit avant le quiz
et se fige pendant, sinon on ne saurait pas qui pénaliser.

**Objectif collectif.** Seuil global de 700 points sur 1000, et plancher
minimal de 40 points par pilier.

## Sécurité

- La clé publishable Supabase est dans `js/config.js`. C'est normal, elle est
  faite pour vivre dans un navigateur.
- La clé secrète n'est nulle part dans le dépôt. Elle vit uniquement dans
  `.env`, exclu par `.gitignore`.
- Le code organisateur n'est pas non plus dans le dépôt. Il est appliqué par
  `supabase/05_pin.local.sql`, généré localement et exclu du dépôt.
- Le navigateur ne peut rien écrire directement dans la base. Les tables
  n'accordent aucun droit d'écriture au rôle public, toute écriture passe par
  les fonctions `security definer`.
- Les photos sont dans un bucket public, avec des noms de fichier aléatoires.
  L'album est consultable par tous les participants, ce qui est l'intention.

## Résilience réseau

La couverture est faible par endroits dans la vallée, l'application en tient
compte à trois niveaux.

1. Toute soumission est écrite dans IndexedDB avant la moindre tentative
   réseau. Fermer l'application ne perd rien.
2. La file repart automatiquement au retour du réseau, au retour sur
   l'application, et toutes les 20 secondes.
3. Chaque soumission porte un identifiant unique généré sur l'appareil, et la
   fonction serveur est idempotente. Un envoi rejoué ne compte jamais deux fois.

L'enveloppe de l'application est mise en cache par un service worker, donc elle
s'ouvre même sans réseau une fois qu'elle a été chargée une première fois.

## Tests

`tools/selftest.py` rejoue toute la logique de jeu contre la vraie base, en
utilisant uniquement la clé dont dispose le navigateur. Il crée des profils de
test, joue des défis, puis nettoie tout derrière lui.

```bash
python3 tools/selftest.py
```

Les 77 contrôles couvrent la création de profil et la déduplication des noms, le
rendement dégressif sur trois passages, le score personnel non dégressif, le non
cumul d'un même défi par une même personne, l'idempotence après coupure réseau,
le dépôt et la lecture des photos, le refus d'un chemin de photo malveillant, le
déclenchement d'une synergie pour tout le groupe du moment, le code
organisateur, la suppression avec recalcul complet, le retassage des passages
suivants, la pénalité après un quiz raté et sa portée sur toute l'équipe, et
toutes les fonctions d'administration.

Le test refuse de tourner quand de vrais joueurs sont enregistrés, pour ne pas
décaler leur rendement dégressif. Ajouter `--force` pour passer outre. Il ne
nettoie jamais que ses propres données.

## Une décision à connaître

Supabase interdit la suppression directe en SQL dans `storage.objects`, via un
déclencheur `protect_delete`. La suppression d'une photo passe donc par l'API de
stockage, depuis le navigateur. Pour que ce ne soit pas une porte ouverte, la
règle de sécurité n'autorise à supprimer qu'une photo devenue orpheline, c'est à
dire dont la soumission a déjà été retirée par un organisateur muni du code. Une
photo rattachée à une soumission vivante reste intouchable.

## Remise à zéro avant l'événement

Après les essais, pour repartir d'une page blanche sans toucher au catalogue
ni au code organisateur :

```bash
python3 tools/reset_jour_j.py
```

Sans argument, il se contente d'afficher ce qui serait effacé. Ajouter
`--confirmer` pour effacer réellement.

## Travailler sur le projet

Aucune dépendance à installer. Pour un aperçu local :

```bash
python3 -m http.server 8765
```

Après toute modification du catalogue dans `js/data/` :

```bash
python3 tools/check.py && python3 tools/gen_seed.py && python3 tools/apply_sql.py 04 05
```

Publier une modification :

```bash
git add -A && git commit -m "Description" && git push
```

La GitHub Action vérifie le catalogue puis republie le site. Comptez une à deux
minutes.

## Règle de rédaction

Aucun tiret dans les textes affichés aux joueurs. `tools/check.py` le vérifie et
fait échouer la publication en cas d'oubli.

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
tools/
  check.py               contrôles de cohérence du catalogue
  gen_seed.py            régénère 04_seed.sql depuis js/data
  gen_icons.py           régénère les icônes
  apply_sql.py           applique les fichiers SQL à Supabase
```

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
suppression, donc toujours cohérentes avec l'état réel des soumissions.

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

Les 47 contrôles couvrent la création de profil et la déduplication des noms, le
rendement dégressif sur trois passages, le score personnel non dégressif, le non
cumul d'un même défi par une même personne, l'idempotence après coupure réseau,
le dépôt et la lecture des photos, le refus d'un chemin de photo malveillant, le
déclenchement d'une synergie pour tout le groupe du moment, le code
organisateur, la suppression avec recalcul complet, et le retassage des passages
suivants.

## Une décision à connaître

Supabase interdit la suppression directe en SQL dans `storage.objects`, via un
déclencheur `protect_delete`. La suppression d'une photo passe donc par l'API de
stockage, depuis le navigateur. Pour que ce ne soit pas une porte ouverte, la
règle de sécurité n'autorise à supprimer qu'une photo devenue orpheline, c'est à
dire dont la soumission a déjà été retirée par un organisateur muni du code. Une
photo rattachée à une soumission vivante reste intouchable.

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

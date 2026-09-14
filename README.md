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

## La photo de profil

S'inscrire demande une photo de profil, en plus du prénom et du nom. Elle est
recadrée au carré, réduite à 480 pixels et recompressée dans le navigateur,
donc elle pèse quelques kilooctets. Elle part dans le bucket `profils` sous un
nom aléatoire, et son chemin est transmis à `ensure_participant`.

Cette pastille apparaît ensuite partout où une personne est nommée : la liste
d'identification, le choix du groupe du moment, le classement, l'écran du profil
et la vue organisateur. Quand une personne n'a pas encore de portrait, un profil
créé avant cette version par exemple, ses initiales prennent la place et la
photo lui est demandée la première fois qu'elle se reconnecte.

Changer de photo passe par `set_photo`. L'ancienne devient orpheline et
`portrait_est_orphelin` autorise alors sa suppression depuis le navigateur,
exactement comme pour les photos de défi.

## L'ouverture du jeu

Le jeu s'ouvre à une heure précise, gardée en base par `ouverture_du_jeu` et
réglable par l'organisateur. Avant cette heure, les joueurs n'ont que le fil et
leur profil : les autres onglets sont grisés et affichent un compte à rebours.

Deux choix à connaître. L'organisateur voit tout dès qu'il a saisi son code sur
son appareil, c'est ainsi qu'il prépare la journée. Et le décompte se fonde sur
l'heure du serveur, pas sur celle du téléphone : `game_state` renvoie son
horloge, l'application en déduit un décalage, et un téléphone mal réglé
n'ouvre donc pas le jeu en avance.

L'onglet Activités a son propre interrupteur, indépendant de l'heure du jeu :
il permet d'ouvrir les randonnées et les tables un jour ou deux avant, pour
faire patienter, puis d'annoncer la chose dans le fil avec un `@tous`.

Le verrou est côté écran, pas côté base : il range l'application avant le jour
J, il n'empêche pas quelqu'un de très déterminé d'appeler l'API à la main. Ce
choix est volontaire, un verrou serveur aurait aussi bloqué les essais de
l'organisateur et les tests de bout en bout.

## Les notifications poussées

Être prévenu sur l'écran verrouillé demande une vraie chaîne, montée ici de
bout en bout sans aucune dépendance :

1. Le navigateur s'abonne avec la clé publique VAPID de `js/config.js` et
   dépose son abonnement par `save_push_subscription`. La table
   `push_subscriptions` a RLS sans policy : ces clés d'appareil ne se lisent
   jamais depuis le navigateur.
2. Chaque insertion dans `notifications` déclenche `declenche_push`, qui
   appelle la fonction Edge par `pg_net`, en arrière plan : la transaction qui
   a créé la notification n'attend pas le réseau.
3. `supabase/functions/envoyer-push` relit la notification, rédige le message
   et le pousse à chaque appareil de la personne.

Le protocole est écrit à la main avec la cryptographie du navigateur : RFC 8291
pour le chiffrement, RFC 8188 pour l'enveloppe `aes128gcm`, RFC 8292 pour la
signature VAPID. La fonction expose une route d'essai qui rejoue le vecteur de
test publié dans la RFC 8291, avec ses clés et son sel fixes : le résultat doit
être identique octet pour octet, ce qui vérifie le chiffrement sans dépendre
d'un vrai téléphone.

La clé privée VAPID ne vit que dans les secrets Supabase et dans
`supabase/vapid.local.json`, exclu du dépôt. La clé publique, elle, est faite
pour être dans le code.

Deux limites à connaître. Sur iPhone, les notifications web ne fonctionnent que
depuis l'application ajoutée à l'écran d'accueil, jamais depuis un onglet
Safari. Et la demande d'autorisation doit partir d'un geste : c'est pour cela
qu'elle passe par un bouton, jamais au chargement.

### Un piège de droits PostgreSQL

Une fonction est exécutable par PUBLIC dès sa création. Retirer le droit à
`anon` et `authenticated` ne suffit donc pas, ils le gardent par héritage. Le
test de bout en bout l'a montré : `push_a_envoyer`, qui renvoie les clés de
chiffrement d'un appareil, restait appelable. Toutes les fonctions internes
sont maintenant révoquées à PUBLIC, et seules `push_a_envoyer` et `push_echec`
sont rendues à `service_role`, pour la fonction Edge.

## Le récit complet

Le texte du jeu vit dans `js/data/histoire.js`, repris mot pour mot, et
s'ouvre dans sa propre fenêtre depuis l'écran d'identification, par le bouton
`Découvrir l'histoire complète`. Le texte court de la carte d'accueil reste
tel quel : c'est lui qu'on lit en trois secondes avant de s'inscrire.

Le découpage en paragraphes est celui de l'original et fait partie du rythme.
À l'intérieur d'un paragraphe, en revanche, le texte se replie selon la
largeur de l'écran : une coupure fixe en plein milieu d'une phrase tomberait
n'importe où sur un téléphone.

## L'icône de l'application

La photo posée dans `Icones/` sous un nom commençant par `logo` devient l'icône
de l'écran d'accueil. `tools/gen_icone_app.py` en dérive six fichiers dans
`assets/` : 180 pixels pour iPhone, 192 et 512 pour Android et les navigateurs,
deux versions `maskable` et une favicon.

Android recadre l'icône adaptative en rond, en goutte ou en carré arrondi selon
le téléphone, et seul le centre est garanti visible. Les versions `maskable`
reculent donc l'image à 78 pourcent dans son cadre, sur du blanc, qui se
raccorde sans couture au fond du collage. iPhone, lui, n'applique que ses coins
arrondis : les versions normales restent pleine image.

Les deux fichiers de 512 pixels ne sont pas préchargés par le service worker.
Ils ne servent qu'au moment de l'ajout à l'écran d'accueil et pèsent à eux
seuls près d'un mégaoctet.

## Le code personnel

S'inscrire demande un code d'au moins quatre caractères, en plus du prénom, du
nom et de la photo. Il n'est demandé qu'une fois par appareil : l'application se
souvient ensuite du profil, comme avant. Il sert uniquement à empêcher que
quelqu'un reprenne le profil d'un autre depuis son propre téléphone.

L'empreinte est calculée par `pgcrypto` en bcrypt, dans une table
`participant_secrets` à part, avec RLS et aucune policy. Le navigateur a le
droit de lire `participants`, il ne doit jamais pouvoir lire une empreinte, même
chiffrée. La vérification se fait à l'intérieur de `ensure_participant`, qui ne
renvoie le profil qu'au bon code ; `verifie_code` et `set_code` ne sont pas
exposées au navigateur.

pgcrypto vit dans le schéma `extensions` chez Supabase, les appels sont donc
qualifiés plutôt que d'élargir le `search_path` des fonctions security definer.

Un profil créé avant cette règle se voit demander de choisir son code la
première fois qu'il revient. En cas d'oubli, la vue organisateur a un bouton
`Code oublié` qui en pose un nouveau.

## Le fil

Chaque défi validé publie automatiquement sa carte dans le fil, avec sa photo :
`submit_challenge` insère la publication dans la même transaction, et la
suppression d'une soumission par un organisateur l'emporte en cascade. Chacun
peut aussi publier un message, une photo, et nommer d'autres joueurs.

Deux réactions : la corne de bouquetin, qui s'ajoute et se retire, et le
commentaire, sous une marmotte qui crie. Les deux illustrations viennent du
dossier `Icones`. `tools/gen_icones_fil.py` les réduit avec `sips`, puis rend
leur fond blanc transparent et les recadre sur le dessin, en Python pur : le
PNG est décodé, une couche alpha est calculée à partir de la clarté, le tout
est réencodé. Les originales restent dans le dépôt mais ne sont pas publiées.

On nomme quelqu'un en tapant une arobase suivie de son prénom, et la liste des
prénoms se propose dès la première lettre. Le motif ne prend qu'un mot, plus
éventuellement le suivant, et ce deuxième mot n'est retenu que s'il forme un
vrai prénom plus nom : sans cette règle, dans `@Alexis et Ambeurre`, le `et`
serait avalé dans la mention. Deux personnes qui partagent un prénom obligent à
préciser le nom, sinon la mention n'est attribuée à personne.

Piège rencontré : une expression régulière globale porte son propre curseur.
Partagée entre l'analyse et l'affichage, dont l'un appelait l'autre, ce curseur
était remis à zéro au milieu d'une boucle, qui repartait indéfiniment sur la
même occurrence et figeait l'écran. Chaque lecture fabrique donc la sienne.

Autre piège, dans l'ajout d'une photo à l'album : une balise `label` est en
ligne par défaut, donc son rembourrage ne pousse pas ce qui suit, et le champ
suivant venait se superposer. `.photo-zone` est désormais `display: block`.

Une notification part vers l'auteur d'une publication quand on l'applaudit ou
qu'on la commente, vers toute personne nommée, et vers ceux qui ont déjà
commenté quand une réponse arrive. `notifier()` ne prévient jamais quelqu'un de
sa propre action et n'en pose qu'une seule par personne et par évènement : être
nommé passe avant le fait d'être l'auteur, qui passe avant le fait d'avoir déjà
commenté.

`feed_state(participant)` renvoie tout en un appel, publications et
notifications comprises. Il n'est pas rappelé à chaque sondage des jauges, ce
serait lourd pour rien : une fois au démarrage pour la pastille, puis sur
évènement temps réel, puis à l'ouverture du fil ou de l'album.

## L'album

L'album lit les mêmes publications. Les photos de défis sont classées par
pilier, les photos libres dans une catégorie `Autre`. Ajouter une photo depuis
l'album ou depuis le fil revient au même : c'est la même publication, et elle
apparaît aux deux endroits.

## Le diaporama de l'écran d'identification

Les six états de la vallée défilent en grand derrière le formulaire, environ
quatre secondes chacun avec un fondu d'une seconde, donc un tour complet en une
trentaine de secondes : le temps d'une inscription. Le but du jeu se lit ainsi
sans une ligne d'explication.

Sur un téléphone, les cartes occupent toute la largeur et masqueraient
complètement le fond. La photo garde donc tout le premier écran, moins de quoi
laisser dépasser le haut de la première carte : on voit qu'il y a du contenu
dessous, il vient glisser par dessus l'image au défilement. Le récit long est
replié derrière `Lire l'histoire en entier`, pour la même raison.

Les images sont en 16 sur 9 et un téléphone est en portrait : un cadrage plein
écran perdrait la moitié de la largeur. En dessous d'un rapport de 5 sur 4, la
photo est donc affichée entière et nette sur toute la largeur, et c'est la même
image, floutée et agrandie derrière, qui remplit le reste de l'écran. Rien n'est
coupé, l'écran reste plein, et une photo en 16 sur 9 sur toute la largeur est
aussi grande qu'elle peut l'être sans perdre ses bords. Sur un écran en paysage, ordinateur compris, la bande disparaît entièrement et
on retrouve l'affichage d'origine : la photo en plein écran derrière les cartes,
sans rien couper puisque le format de l'écran est celui de l'image.

Six pastilles sous la photo montrent où l'on en est dans les six états, et un
appui saute directement à l'un d'eux.

Pour voir le détail, le plein écran garde son zoom par appui et son invitation à
coucher le téléphone.

La légende est rendue par le composant qui possède l'image, à partir de la
couche du dessous. Une légende calculée à côté, sur la valeur visée par le
diaporama, annoncerait la photo suivante pendant toute la seconde du fondu.

Un appui sur la bande, ou sur le fond partout où il se voit, ouvre la photo en
plein écran. Le défilement s'arrête alors, et il reprend à la fermeture sur la
photo que la personne vient de regarder.

Attention au contexte d'empilement : la couche de fond est fixe et se place
derrière le contenu, mais donner un `z-index` au conteneur `ident` enfermerait
la vue plein écran sous la barre du haut.

## Un avertissement porté par un défi

Un défi peut porter un champ `alerte`, affiché en encadré orange sous la
consigne et signalé par une pastille dans la liste. Il sert aux défis où une
consigne de sécurité prime sur le jeu : ne rien cueillir pour les champignons,
ne pas entrer dans la galerie de la mine de cuivre, dont les visites sont
suspendues pour risque de chutes de pierres.

## Un piège de htm à connaître

htm supprime complètement l'espace quand un saut de ligne sépare du texte d'une
expression. `Il reste\n  ${n} points` affiche `Il reste700 points`. Écrire
`${" "}` avant le saut, ou garder le texte et l'expression sur la même ligne.

`tools/check_espaces.py` détecte ce motif dans tous les gabarits et fait échouer
la publication le cas échéant.

Deuxième piège de la même famille : une balise laissée ouverte, par exemple un
`<${Frag}>` sans son `<//>`. Le premier rendu passe, puis toute mise à jour
échoue et l'écran se fige, sans la moindre erreur en console. `tools/check.py`
compte maintenant les ouvertures et les fermetures de chaque gabarit.

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

Les 147 contrôles couvrent la création de profil et la déduplication des noms, le
rendement dégressif sur trois passages, le score personnel non dégressif, le non
cumul d'un même défi par une même personne, l'idempotence après coupure réseau,
le dépôt et la lecture des photos, le refus d'un chemin de photo malveillant, le
déclenchement d'une synergie pour tout le groupe du moment, le code
organisateur, la suppression avec recalcul complet, le retassage des passages
suivants, la pénalité après un quiz raté et sa portée sur toute l'équipe,
le dépôt d'un portrait et son remplacement, le refus d'un chemin de portrait
douteux, l'impossibilité de supprimer un portrait encore utilisé, le code
personnel et son refus quand il est faux ou trop court, le fait qu'aucune
empreinte ne sorte de la base, la publication automatique à chaque défi validé,
les cornes, les commentaires, les mentions, les notifications et leur lecture,
et toutes les fonctions d'administration.

Le test refuse de tourner quand de vrais joueurs sont enregistrés, pour ne pas
décaler leur rendement dégressif. Ajouter `--force` pour passer outre : les
attentes s'ajustent alors à ce que les vrais joueurs ont déjà fait, par exemple
un défi déjà joué une fois fait démarrer le rendement dégressif à cinq points.
Il ne nettoie jamais que ses propres données.

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

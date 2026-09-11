# Le Val d'Anniviers en 2056
## Document de référence complet du jeu

---

## 1. Concept et trame narrative

Nous sommes en 2056. Le Val d'Anniviers s'est progressivement dégradé. Les glaciers ont reculé, le patrimoine a perdu son caractère, les alpages et pratiques agricoles traditionnelles ont disparu, une partie des savoir faire et de la mémoire locale s'est effacée.

Les joueurs interviennent depuis 2026. Leur mission est de redécouvrir ce qui rend la vallée riche, comprendre son fonctionnement, et contribuer à la préserver pour éviter ce futur.

Le jeu se joue sur une journée, de 10h à 17h, avec une pause déjeuner au milieu (sandwiches fournis par le refuge).

---

## 2. Les cinq piliers (structure fixe)

1. **Montagne et Glaciers** : relief, sommets, glaciers, faune et flore alpine
2. **Eau** : torrents, bisses, irrigation, barrages, gestion de l'eau
3. **Vie Alpine** : alpages, élevage, fromage, transhumance
4. **Patrimoine** : villages, architecture, bâtiments, savoir faire
5. **Mémoire et Transmission** : histoires, traditions, langue, personnes

---

## 3. Objectifs et conditions de victoire

**Jeu individuel avec groupement fluide.** Il n'y a pas d'équipes fixes assignées à l'avance. Chaque participant joue en son nom propre, et les gens se regroupent naturellement selon leurs envies du moment pour faire les défis ensemble. Un défi peut être fait seul ou avec un groupe d'amis qui change au fil de la journée. Le groupe présent au moment d'un défi est appelé le groupe du moment.

**Double objectif.** Chaque participant contribue à un objectif collectif (les cinq jauges de piliers) et poursuit en parallèle son propre score individuel pour le classement entre joueurs.

**Jauges collectives.** Chaque pilier a une jauge allant de 0 à 200 points. Un même défi peut être complété plusieurs fois dans la journée par des groupes du moment différents. La première fois qu'un défi est complété dans la journée, il rapporte ses points pleins à la jauge du pilier concerné. Chaque répétition suivante du même défi par un nouveau groupe rapporte moitié moins que la précédente à la jauge. Cette règle est invisible pour les joueurs, elle sert juste à garder les jauges dans une progression saine tout au long de la journée plutôt que de les voir se remplir d'un coup en début d'après midi. Le score personnel, lui, n'est jamais affecté par cette dégressivité : chaque personne reçoit toujours les points pleins du défi sur son propre score, peu importe combien de fois ce défi a déjà été fait par d'autres.

**Condition de victoire collective (hybride).**
- Seuil global : la somme des cinq jauges doit atteindre environ 700 points sur 1000 (soit 70 pourcent).
- Plancher minimal par pilier : chaque jauge doit atteindre au moins 40 points (20 pourcent), pour éviter qu'un pilier reste à l'abandon pendant que les autres progressent.

**Score individuel.** Chaque personne présente dans le groupe du moment au moment d'une soumission reçoit les points du défi sur son propre score personnel. Un classement individuel live remplace le classement par équipe. Une personne très active peut faire beaucoup de défis. Une personne plus tranquille peut en faire moins tout en participant pleinement à l'objectif collectif.

**Enregistrement du groupe du moment.** Chaque soumission de défi doit mentionner qui était présent (le groupe du moment), pour que les points personnels soient attribués correctement à chacun.

---

## 4. Barème et calibrage

- Défi découverte : 10 points
- Défi expérience : 20 points
- Défi mission majeure : 30 points

**Calibrage.** Avec environ 35 joueurs qui se regroupent naturellement en clusters d'amis, le nombre de groupes actifs en même temps dans la vallée est difficile à prévoir précisément, contrairement au modèle avec équipes fixes d'avant. Une simulation a montré que sans limite, ce nombre de groupes pouvait faire varier le remplissage d'un pilier entre 115 pourcent et 288 pourcent du maximum selon le scénario, un écart bien trop large. La règle de rendement dégressif décrite ci dessus resserre cet écart à une fourchette de 60 pourcent à 112 pourcent selon les mêmes scénarios, ce qui reste une vraie marge de jeu sans jamais exploser ni rester vide. C'est cette règle qui rend le calibrage robuste face à un regroupement organique et imprévisible, plutôt que le nombre de défis disponibles, qui n'a par contre aucun effet sur ce calibrage.

**Implémentation technique du rendement dégressif.** Pour chaque défi, l'application doit compter combien de fois il a déjà été validé dans la journée, toutes personnes confondues, et appliquer ce multiplicateur à la contribution envoyée à la jauge du pilier : 1ère validation = 100 pourcent des points, 2e = 50 pourcent, 3e = 25 pourcent, et ainsi de suite en divisant par deux à chaque fois. Le score personnel de chaque participant n'est jamais affecté par ce multiplicateur, il reçoit toujours les points pleins du défi.

Aucun nombre de défis n'est imposé aux joueurs. Chaque personne en fait autant qu'elle veut, le catalogue est simplement assez riche pour que personne ne manque de contenu.

---

## 5. Format des défis

**Trois niveaux de contrainte géographique.**
- Libre : faisable n'importe où dans la vallée
- Typé : n'importe quel lieu correspondant à un type (n'importe quel alpage, n'importe quel bisse)
- Précis : un lieu unique et spécifique

**Durée.** 10 à 45 minutes selon le niveau d'ampleur. Les défis à localisation précise restent disponibles toute la journée sans limite de temps.

**Quatre styles.** Chill, culturel, culinaire, sportif. Le style sportif ne signifie pas que le contenu du défi est physique. C'est surtout la localisation, loin ou en altitude, qui donne une bonne raison aux groupes qui veulent marcher de s'y rendre. Chaque pilier doit avoir des défis dans chacun des quatre styles, pour qu'une personne ayant choisi un style puisse jouer sur les cinq piliers sans en être empêchée.

**Répartition géographique.** La vallée se sépare en deux branches depuis Vissoie, le Val de Moiry à l'ouest et la vallée de Zinal à l'est. Le catalogue doit offrir des défis équivalents des deux côtés pour que le choix de direction n'avantage ou ne pénalise personne.

**Validation.** Principalement par photo du groupe du moment sur le lieu du défi, avec double intérêt de preuve et de création d'un album souvenir collectif de la journée. Chaque soumission mentionne les personnes présentes dans le groupe du moment, pour l'attribution des points personnels. Pour les défis où une photo ne suffit pas, validation alternative par quiz ou réponse précise à entrer dans l'application. Validation automatique dès soumission, sans vérification anti triche stricte. Relecture rapide en fin de journée pour repérer d'éventuels abus, sans excès de prévention vu le contexte d'anniversaire entre proches.

---

## 6. Profils individuels et regroupement fluide

Pas d'équipes assignées à l'avance. Chaque participant crée son propre profil dans l'application, avec son prénom et nom.

Dans son profil, chaque personne peut indiquer son envie dominante du moment (sportif, culturel, culinaire, chill). Ce tag est informatif et peut changer en cours de journée, il ne détermine ni un groupe fixe ni un accès restreint à certains défis. Il sert surtout de repère personnel et, si on le souhaite plus tard, de signal pour retrouver des gens avec des envies similaires.

Le message WhatsApp envoyé en amont sert à présenter le concept et éventuellement à sonder les envies pour donner une idée d'ambiance générale, mais ne sert plus à assigner des équipes. La présentation du vendredi soir explique les règles et la trame narrative, sans annonce de composition d'équipes puisqu'il n'y en a pas.

Personne n'est obligé de rester avec les mêmes personnes toute la journée. Les groupes se forment et se déforment naturellement selon les envies de chacun.

Environ 35 joueurs attendus, ce qui donne naturellement plusieurs groupes du moment en parallèle dans la vallée tout au long de la journée.

---

## 7. Ton et contenu éducatif

Les défis doivent être challengeants intellectuellement et subtilement éducatifs, avec un vrai fond sur la culture locale et une dimension forte sur le changement climatique et ses impacts sur les écosystèmes, les habitants et les éleveurs. Le ton reste éducatif en creux, jamais moralisateur.

**Règle de rédaction.** Aucun tiret dans les textes affichés aux joueurs (défis, quiz, récits de synergies). Formulation la plus naturelle possible.

## 7bis. Architecture technique

**Type d'application.** Une application web responsive, pas une application native. Les délais de publication sur l'App Store ou le Play Store sont incompatibles avec une semaine de préparation. L'app s'ouvre depuis un lien envoyé sur WhatsApp et peut être ajoutée à l'écran d'accueil du téléphone.

**Hébergement.** GitHub Pages, en utilisant le compte GitHub déjà existant. L'application communique directement avec Supabase depuis le navigateur, elle peut donc être un site statique, exactement ce que GitHub Pages héberge gratuitement. Une GitHub Action automatise la publication à chaque mise à jour du code, sans compte supplémentaire à créer sur un autre service.

**Base de données et backend.** Supabase, choisi plutôt que Firebase pour une raison précise et pas seulement une préférence technique. Le plan gratuit de Firebase (Spark) n'inclut pas les fonctions serveur, il faut passer au plan payant Blaze et y lier une carte bancaire pour les activer, même si l'usage reste ensuite gratuit. Le plan gratuit de Supabase inclut les fonctions serveur équivalentes (Edge Functions) sans carte bancaire, ce qui est nécessaire pour calculer correctement la règle de rendement dégressif des jauges. Supabase est en plus du Postgres classique, ce qui rend ce genre de calcul cumulatif simple à écrire en SQL. Aucune carte bancaire ne doit être nécessaire pour l'ensemble du projet.

**Identification individuelle.** Pas de mot de passe ni d'email. Au premier lancement, la personne choisit son prénom et nom dans une liste de participants déjà enregistrés, ou en ajoute un nouveau si besoin. L'application s'en souvient ensuite sur son téléphone. Suffisant pour un événement privé entre proches, pas besoin d'une authentification sécurisée complexe.

**Vue de suivi pour l'organisateur.** Une page réservée à l'organisateur, listant toutes les soumissions de la journée avec leurs photos et permettant d'en supprimer une si besoin, pour la relecture rapide de fin de journée déjà prévue dans les règles de validation.

**Stockage des photos.** Les photos soumises pour valider un défi sont stockées dans le bucket de stockage Supabase, liées à la soumission correspondante, et affichées dans une galerie ou un album partagé consultable dans l'application. Compression automatique des photos à l'upload recommandée, pour rester rapide même avec une connexion moyenne en montagne. Vérifié : même avec une centaine de soumissions dans la journée, le poids total reste largement sous le gigaoctet gratuit disponible.

**Illustration évolutive de la vallée.** Non incluse dans le MVP, sera ajoutée plus tard par Alex directement dans le code une fois le temps disponible.

**Résilience réseau.** La couverture réseau dans le Val d'Anniviers peut être faible par endroits. L'application doit garder en file d'attente locale toute soumission qui échoue par manque de réseau, et la synchroniser automatiquement dès que la connexion revient, pour éviter qu'une soumission se perde.

---

## 8. Catalogue complet des défis

### Pilier 1. Montagne et Glaciers (12 défis)

| Nom | Style | Ampleur | Localisation | Points |
|---|---|---|---|---|
| Panorama nommé | Chill | Découverte | Typée (point de vue) | 10 |
| Le nom d'avant | Culturel | Découverte | Libre | 10 |
| Qui vit là haut | Chill | Découverte | Libre | 10 |
| Fleurs d'altitude | Chill | Découverte | Libre | 10 |
| Le sac du berger | Culinaire | Découverte | Libre | 10 |
| Le génépi de la vallée | Culinaire | Expérience | Typée (village ou refuge) | 20 |
| Glace en recul | Culturel | Expérience | Typée (accessible sans marche, parking de Moiry) | 20 |
| Lecture du relief | Culturel | Expérience | Typée (col ou crête) | 20 |
| La Couronne depuis Zinal | Chill | Découverte | Typée (point de vue côté Zinal) | 10 |
| Le glacier qui recule, mesuré | Sportif | Mission majeure | Précise (glacier de Moiry, avec marche) | 30 |
| Le glacier de l'autre côté | Sportif | Mission majeure | Précise (glacier de Zinal ou point de vue) | 30 |
| Sommet et souffle | Sportif | Mission majeure | Précise (lieu en altitude) | 30 |

**Panorama nommé.** Depuis un point de vue accessible, identifier trois sommets visibles via l'application. Le Val d'Anniviers est encerclé de sommets de plus de quatre mille mètres formant la Couronne Impériale, une des plus fortes concentrations de la Suisse.

**Le nom d'avant.** Retrouver le nom en patois d'un sommet, col ou alpage visible et son sens. Le patois valaisan nomme souvent les lieux d'après leur usage, ce qui raconte l'histoire agricole de la vallée.

**Qui vit là haut** (style chill). Repérer un animal emblématique (marmotte, bouquetin, chamois) ou ses traces. Le gypaète barbu, le plus grand rapace des Alpes, avait totalement disparu au début du vingtième siècle, accusé à tort d'enlever des enfants. Il a été réintroduit à partir de 1986 grâce à un projet international lancé en 1978, et vole aujourd'hui à nouveau au dessus du Valais.

**Fleurs d'altitude.** Trouver et identifier deux ou trois plantes alpines (edelweiss, gentiane, génépi). L'edelweiss n'est plus une espèce menacée depuis le début des années 1990, elle est même cultivée en Valais pour l'industrie cosmétique. Son duvet blanc agit comme une protection solaire et un manteau thermique contre les UV et le froid.

**Le sac du berger.** Comprendre ce que bergers et alpinistes emportaient traditionnellement comme provisions pour tenir en altitude, avec une dégustation si possible. Pain de seigle qui se conservait des mois, viande séchée, fromage d'alpage, tout ce qui se gardait longtemps sans réfrigération, exactement ce qu'on retrouvait stocké dans les greniers sur pilotis.

**Le génépi de la vallée.** Comprendre la récolte et la transformation traditionnelle d'une plante alpine, avec dégustation si possible. Les liqueurs de plantes alpines sont un savoir faire directement lié à l'agriculture de montagne.

**Glace en recul.** Comparer une photo actuelle du glacier de Moiry avec une ancienne, repérer trois différences. Les glaciers suisses ont perdu un quart de leur volume rien qu'entre 2015 et 2025, contre 17 pourcent la décennie précédente. Leur volume a été divisé par deux depuis 1931.

**Lecture du relief.** Comprendre comment s'est formé le relief environnant depuis un col ou une crête. Toute la vallée a été sculptée par des glaciers bien plus étendus qu'aujourd'hui, et les moraines qu'on croise sont les traces laissées par cette glace disparue.

**La Couronne depuis Zinal.** Identifier plusieurs sommets de la Couronne Impériale visibles depuis ce côté de la vallée (Zinalrothorn, Obergabelhorn, Dent Blanche) et apprendre un fait sur chacun.

**Le glacier qui recule, mesuré.** Repérer des signes visibles du recul (moraines, roche polie) et estimer combien de mètres le glacier a perdu à partir de repères sur place. Le volume des glaciers suisses est passé de 74,9 kilomètres cubes en l'an 2000 à 46,5 kilomètres cubes en 2024, soit une perte de 38 pourcent. À politique climatique inchangée, ils pourraient avoir disparu d'ici la fin du siècle.

**Le glacier de l'autre côté.** Même principe que le défi précédent, mais côté vallée de Zinal, pour équilibrer le choix de direction entre les groupes.

**Sommet et souffle.** Atteindre un sommet ou un col exigeant en dénivelé et documenter ce qu'on y observe.

### Pilier 2. Eau (8 défis)

| Nom | Style | Ampleur | Localisation | Points |
|---|---|---|---|---|
| Où va l'eau | Chill | Découverte | Libre | 10 |
| Le nom du canal | Culturel | Découverte | Libre | 10 |
| Le pourquoi des bisses | Culturel | Expérience | Typée (le long d'un bisse) | 20 |
| L'eau des glaciers, source d'énergie | Culturel | Expérience | Typée (point de vue barrage ou torrent) | 20 |
| L'eau qui fait le vin | Culinaire | Expérience | Typée (vignoble en aval de la vallée) | 20 |
| Mission sécheresse | Culturel | Expérience | Libre | 20 |
| Le géant de béton | Sportif | Mission majeure | Précise (barrage de Moiry) | 30 |
| La rivière qui vient de Zinal | Culturel | Expérience | Typée (torrent côté Zinal) | 20 |

**Où va l'eau.** Comprendre le trajet de l'eau depuis les glaciers jusqu'au Rhône. La rivière de la vallée, la Navizence, se jette dans le Rhône à Chippis.

**Le nom du canal.** Retrouver le nom local d'un bisse ou canal traditionnel visible. Au début du vingtième siècle, le Valais comptait environ 1800 kilomètres de bisses, gérés par des consortages qui élisaient un répartiteur chargé de distribuer l'eau selon des règles très strictes.

**Le pourquoi des bisses.** Comprendre l'origine et le fonctionnement d'un bisse. Les bisses sont nés au quatorzième siècle pour irriguer des prairies dans un canton naturellement sec. Certains, comme le Grand Bisse de Lens, font 14 kilomètres et ont été construits en deux ans, à flanc de falaise.

**L'eau des glaciers, source d'énergie.** Comprendre comment l'eau de fonte produit aussi de l'électricité. Le barrage de Moiry, construit entre 1954 et 1958, culmine à 148 mètres à 2250 mètres d'altitude. Ses centrales couvrent les besoins annuels de plus de 120 000 ménages.

**L'eau qui fait le vin.** Comprendre comment l'eau du bisse irrigue encore aujourd'hui les vignes, avec dégustation si possible. Le bisse du Ricard, creusé il y a près de 500 ans, prend sa source dans la Navizence et irrigue encore aujourd'hui des centaines d'hectares de vignes sur les coteaux de Chippis, Chalais et Réchy, juste à la sortie de la vallée.

**Mission sécheresse.** Le groupe du moment dispose d'un volume d'eau limité à répartir entre plusieurs usages et doit justifier ses choix. Avec moins de neige en hiver, ce dilemme redevient aujourd'hui d'actualité, le même qu'il y a sept siècles, amplifié par le réchauffement.

**Le géant de béton.** Se rendre au barrage de Moiry, comprendre son histoire et son rôle. Un rehaussement de 9 mètres est actuellement à l'étude pour stocker davantage d'énergie hivernale.

**La rivière qui vient de Zinal.** Comprendre d'où vient l'eau qui alimente la Navizence côté Zinal et comment elle rejoint celle du côté Moiry plus bas dans la vallée.

### Pilier 3. Vie Alpine (7 défis)

| Nom | Style | Ampleur | Localisation | Points |
|---|---|---|---|---|
| Les cornes qui s'affrontent | Chill | Découverte | Libre | 10 |
| De l'herbe au fromage | Culinaire | Découverte | Libre | 10 |
| Qui décide de l'eau et de l'herbe | Culturel | Expérience | Typée (alpage ou bisse) | 20 |
| Le rythme de la transhumance | Culturel | Expérience | Typée (alpage) | 20 |
| Dégustation d'alpage | Culinaire | Expérience | Typée (alpage ou fromagerie) | 20 |
| L'alpage oublié | Sportif | Mission majeure | Précise (alpage abandonné) | 30 |
| L'alpage vivant | Sportif | Mission majeure | Précise (alpage actif en altitude) | 30 |

**Les cornes qui s'affrontent.** Quiz sur la race d'Hérens et les combats de reines. La vache d'Hérens établit sa hiérarchie de troupeau par des combats front contre front, sans quasiment jamais se blesser. Cette tradition, inscrite au patrimoine culturel immatériel du Valais, attire des dizaines de milliers de spectateurs chaque année.

**De l'herbe au fromage.** Quiz de cinq questions sur le cycle de l'alpage jusqu'au fromage.

**Qui décide de l'eau et de l'herbe.** Comprendre le fonctionnement d'un consortage. Les paysans valaisans s'organisaient en associations qui construisaient les bisses ensemble et se répartissaient l'eau selon la taille de chaque troupeau. Un des plus anciens règlements connus, celui du bisse de Bitailla, menaçait dès 1306 de couper la main de quiconque volait de l'eau.

**Le rythme de la transhumance.** Quiz sur l'inalpe et la désalpe, et pourquoi ce rythme évolue avec le climat. Des étés plus chauds et plus secs modifient aujourd'hui les dates de montée des troupeaux et la disponibilité de l'herbe en altitude.

**Dégustation d'alpage.** Identifier un fromage d'alpage local et deviner de quel type de pâturage il vient.

**L'alpage oublié.** Atteindre un alpage qui n'est plus exploité et comprendre pourquoi. L'exode rural du vingtième siècle et la baisse de rentabilité de l'agriculture de montagne ont fait disparaître de nombreux alpages, un miroir direct de la trame narrative du jeu.

**L'alpage vivant.** Rejoindre à pied un alpage encore en activité, observer le troupeau et les infrastructures depuis une distance respectueuse, puis répondre à un quiz sur ce qui s'y passe aujourd'hui. Défi entièrement autonome, sans dépendre de la présence d'un éleveur.

### Pilier 4. Patrimoine (6 défis)

| Nom | Style | Ampleur | Localisation | Points |
|---|---|---|---|---|
| Le grenier sur pilotis | Chill | Découverte | Libre | 10 |
| Les traces du passé | Culturel | Expérience | Précise | 20 |
| Le village qui a changé de vie | Culturel | Expérience | Typée (n'importe quel village) | 20 |
| Du four à la table | Culinaire | Expérience | Typée (four à pain ou bâtiment) | 20 |
| Le chemin muletier | Sportif | Mission majeure | Précise (chemin entre deux villages) | 30 |
| Le hameau qui s'est vidé | Sportif | Mission majeure | Précise (hameau ou mayen abandonné) | 30 |

**Le grenier sur pilotis.** Quiz sur l'architecture des raccards et greniers valaisans. Ils reposent sur des pilotis en bois coiffés de dalles de pierre rondes, un système ingénieux pour empêcher les rongeurs de grimper jusqu'aux réserves de grain, de pain de seigle et de viande séchée.

**Les traces du passé.** Comparer une ancienne photo d'un lieu avec aujourd'hui, identifier trois éléments qui ont changé.

**Le village qui a changé de vie.** Quiz sur l'évolution d'un village anniviard, de l'agriculture de subsistance au tourisme. Jusque dans les années 1950, la vie de villages comme Mission reposait presque entièrement sur l'élevage et l'agriculture. En 1910, 92 pourcent de la population active de la vallée travaillait dans l'agriculture, contre à peine 2 pourcent en 1990.

**Du four à la table.** Retrouver un ancien four à pain ou un lieu de production alimentaire du village.

**Le chemin muletier.** Relier deux villages par un ancien chemin muletier et comprendre son rôle avant les routes modernes. Le nom Anniviers viendrait du latin evoquant les chemins de l'année, une allusion aux migrations saisonnières des habitants entre mayens d'altitude et coteaux de plaine.

**Le hameau qui s'est vidé.** Rejoindre un hameau ou mayen délaissé et documenter pourquoi il a été abandonné.

### Pilier 5. Mémoire et Transmission (6 défis)

| Nom | Style | Ampleur | Localisation | Points |
|---|---|---|---|---|
| Les mots de la vallée | Chill | Découverte | Libre | 10 |
| Qui se souvient | Culturel | Découverte | Libre | 10 |
| La neige d'avant | Culturel | Expérience | Libre | 20 |
| Le repas de fête | Culinaire | Expérience | Libre | 20 |
| L'objet qui raconte | Sportif | Mission majeure | Précise (musée local ou famille) | 30 |
| Le village qui a attendu la route | Sportif | Mission majeure | Précise (village reculé) | 30 |

**Les mots de la vallée.** Découvrir plusieurs mots ou expressions en patois valaisan et leur signification.

**Qui se souvient.** Reconstituer des fragments d'une histoire locale, événement, lieu, tradition ou anecdote.

**La neige d'avant.** Interroger un habitant plus âgé sur la neige et les glaciers d'autrefois comparés à aujourd'hui, puis répondre à un quiz basé sur ce qu'il a raconté. Défi pivot de la synergie avec le pilier Montagne.

**Le repas de fête.** Demander à un habitant son souvenir ou sa recette préférée d'un repas de fête traditionnel.

**L'objet qui raconte.** Retrouver un objet ancien et faire raconter son histoire complète.

**Le village qui a attendu la route.** Se rendre dans un village longtemps resté isolé et comprendre comment cet isolement a façonné sa vie. Vissoie n'a été relié à la vallée du Rhône par une route carrossable qu'en 1863. La route vers Zinal, au fond de la vallée, n'a été ouverte qu'en 1951.

**Total du catalogue : 39 défis.**

---

## 9. Synergies cachées

Non annoncées aux joueurs à l'avance. On peut évoquer vaguement dans le briefing qu'il existe des surprises, sans plus de détail. Une synergie se déclenche pour une personne dès qu'elle a personnellement complété les deux défis qui la composent, peu importe avec quels groupes du moment différents elle les a faits. Chaque synergie donne un bonus de 10 points au score personnel de cette personne, et 5 points bonus sur chacune des deux jauges concernées, en plus des points déjà comptés pour les défis individuels.

### Synergie 1. Le témoin du glacier
Déclencheurs : Glace en recul ou Le glacier qui recule mesuré, plus La neige d'avant.

Message de déblocage : Vous avez découvert quelque chose. Ce que l'habitant interrogé vous a raconté correspond exactement à ce que vous avez vu sur le terrain. La neige qui recouvrait tout jusqu'en juin dans son enfance, la langue du glacier qui descendait bien plus bas. Ce ne sont pas des souvenirs vagues, ce sont des données. Les scientifiques appellent ça une validation croisée. Le témoignage humain confirme la mesure physique.

Contenu éducatif débloqué : le glacier loss day, ce jour où un glacier suisse a déjà perdu toute la neige accumulée l'hiver précédent, arrive chaque année un peu plus tôt.

### Synergie 2. La vie d'autrefois
Déclencheurs : De l'herbe au fromage ou Dégustation d'alpage, plus Le grenier sur pilotis.

Message de déblocage : Vous avez découvert quelque chose. Le fromage que vous avez goûté et le grenier que vous avez observé ne sont pas deux choses séparées. Le lait montait à l'alpage, le fromage redescendait au village, séchait et se conservait dans ces greniers surélevés justement pour échapper aux rongeurs. Toute une chaîne. La bête, l'herbe, le lait, la pierre, le bois, la famille. Un seul système de vie où rien n'était isolé.

Contenu éducatif débloqué : le rythme nomade qui a donné son nom à la vallée, les Anniviards montaient et descendaient sans cesse entre mayens et plaine.

### Synergie 3. Le fragment retrouvé
Déclencheurs : L'objet qui raconte ou Qui se souvient, plus Les traces du passé.

Message de déblocage : Vous avez découvert quelque chose. L'objet retrouvé et le lieu comparé racontent en fait la même histoire, vue sous deux angles différents. L'application assemble les deux fragments et révèle un court récit complet, un vrai moment du passé de la vallée reconstitué grâce à vous.

Synergie prioritaire pour l'album souvenir final, elle génère une page dédiée avec la photo de l'objet, le lieu comparé et le récit assemblé.

### Synergie 4. Le pari du berger
Déclencheurs : Mission sécheresse, plus Le rythme de la transhumance.

Message de déblocage : Vous avez découvert quelque chose. Vous avez dû arbitrer entre plusieurs usages de l'eau. Les bergers font ce même arbitrage chaque année, en vrai. Monter les bêtes trop tôt, et il n'y a pas assez d'herbe ni d'eau en altitude. Monter trop tard, et la belle saison est gâchée. Un pari qui devient chaque année plus difficile avec un enneigement plus faible et plus tardif.

### Synergie 5. La mémoire de la glace
Déclencheurs : Source glaciaire ou L'eau des glaciers, plus Le glacier qui recule mesuré ou Le glacier de l'autre côté.

Message de déblocage : Vous avez découvert quelque chose. L'eau qui coule dans les bisses, qui turbine dans le barrage de Moiry, qui irrigue les prairies depuis sept siècles, c'est la même eau que vous avez vue naître, ou presque, là haut près du glacier. Le glacier n'est pas juste un décor spectaculaire. C'est le château d'eau de toute la vallée. Et il se vide.

---

## 10. Vérification finale de densité par style et par pilier

| Pilier | Chill | Culturel | Culinaire | Sportif |
|---|---|---|---|---|
| Montagne et Glaciers | 4 | 3 | 2 | 3 |
| Eau | 1 | 5 | 1 | 1 |
| Vie Alpine | 1 | 2 | 2 | 2 |
| Patrimoine | 1 | 2 | 1 | 2 |
| Mémoire et Transmission | 1 | 2 | 1 | 2 |

Chaque pilier a désormais au moins un défi par style, et chaque défi n'appartient qu'à un seul style (les deux défis qui portaient un double style ont été tranchés). Le pilier Eau reste nettement penché vers le style culturel avec 5 défis sur 8, ce n'est pas bloquant puisque chaque style y a au moins un défi, mais c'est un point à rééquilibrer en priorité pour une V2.

---

## 11. Points ouverts, à traiter avant ou pendant la préparation finale

- Repérer et noter les coordonnées précises de tous les lieux à localisation précise ou typée
- Concevoir un plan B en cas de mauvais temps (brouillard, pluie), non discuté à ce stade
- Définir le format exact des quiz : nombre de questions par défi, comportement en cas de mauvaise réponse (proposition à trancher : 3 à 4 questions par défi, réessai immédiat autorisé sans pénalité)
- Rédiger le message WhatsApp de présentation du concept individuel
- Rédiger le contenu de la présentation du vendredi soir
- Concevoir l'écran de soumission d'un défi dans l'application : doit permettre de sélectionner ou taguer les personnes présentes dans le groupe du moment, pour l'attribution correcte des points personnels

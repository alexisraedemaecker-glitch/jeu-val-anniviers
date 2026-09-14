// Catalogue complet des 45 defis. Source de verite partagee avec le seed SQL.
// Le bloc ci dessous est du JSON strict pour pouvoir etre relu par le script de seed.
// Regle de redaction : aucun tiret dans les textes affiches aux joueurs.
export const CHALLENGES = /* json */ [

  /* ============ PILIER 1. MONTAGNE ET GLACIERS (15) ============ */

  {
    "id": "panorama-nomme",
    "pillar": "montagne",
    "name": "Panorama nommé",
    "style": "chill",
    "tier": "decouverte",
    "points": 10,
    "location_kind": "typee",
    "location_detail": "Depuis n'importe quel point de vue dégagé de la vallée",
    "branch": "les deux branches",
    "duration": "15 minutes",
    "brief": "Installez vous à un endroit où la vue s'ouvre, et nommez trois sommets que vous voyez. Prenez le temps de vraiment les chercher du regard avant de répondre.",
    "savoir": "Le Val d'Anniviers est encerclé de sommets de plus de quatre mille mètres qui forment la Couronne Impériale, une des plus fortes concentrations de Suisse.",
    "proof": "photo_quiz",
    "photo_hint": "Une photo du groupe du moment au point de vue, avec les sommets derrière vous.",
    "note_label": "Les trois sommets que vous avez identifiés",
    "quiz": [
      {
        "q": "Combien de sommets forment la Couronne Impériale qui ferme le fond de la vallée ?",
        "options": ["Dix", "Trois", "Dix huit", "Cinq"],
        "answer": 3,
        "why": "Cinq géants se suivent au fond de la vallée de Zinal, du Bishorn à la Dent Blanche."
      },
      {
        "q": "Quel sommet de la Couronne est le plus haut, avec 4506 mètres ?",
        "options": ["Le Bishorn", "Le Weisshorn", "Le Zinalrothorn", "La Dent Blanche"],
        "answer": 1,
        "why": "Le Weisshorn culmine à 4506 mètres, c'est le point le plus élevé visible depuis la vallée."
      },
      {
        "q": "À quelle altitude culmine la Dent Blanche ?",
        "options": ["4506 mètres", "4634 mètres", "4357 mètres", "3890 mètres"],
        "answer": 2,
        "why": "4357 mètres. Sa silhouette en pyramide est reconnaissable de très loin."
      }
    ]
  },

  {
    "id": "le-nom-davant",
    "pillar": "montagne",
    "name": "Le nom d'avant",
    "style": "culturel",
    "tier": "decouverte",
    "points": 10,
    "location_kind": "libre",
    "location_detail": "N'importe où dans la vallée",
    "branch": "les deux branches",
    "duration": "15 minutes",
    "brief": "Repérez un sommet, un col ou un alpage visible, puis cherchez son nom ancien ou son nom en patois et ce qu'il voulait dire. Un panneau, une carte, un habitant, tout est bon.",
    "savoir": "Le patois valaisan nomme souvent les lieux d'après leur usage plutôt que d'après une personne. Un nom de lieu raconte donc presque toujours un bout d'histoire agricole.",
    "proof": "photo_quiz",
    "photo_hint": "Une photo du groupe devant le lieu, ou du panneau qui porte le nom.",
    "note_label": "Le nom trouvé et son sens",
    "quiz": [
      {
        "q": "En Valais, que désigne un mayen ?",
        "options": ["Un sommet rocheux sans végétation", "Une cave à fromage", "Un pâturage intermédiaire occupé au printemps et en automne", "Un canal d'irrigation"],
        "answer": 2,
        "why": "Le mayen est l'étage du milieu, entre le village et l'alpage. On y montait avant l'été et on y repassait en descendant."
      },
      {
        "q": "Que désigne le mot bisse ?",
        "options": ["Un col de montagne", "Un canal d'irrigation à ciel ouvert", "Un grenier sur pilotis", "Une vache de race d'Hérens"],
        "answer": 1,
        "why": "Les bisses conduisent l'eau des torrents vers les prés et les vignes, parfois sur des kilomètres."
      },
      {
        "q": "Et un raccard ?",
        "options": ["Une étable en pierre", "Un grenier à céréales en bois monté sur pilotis", "Une chapelle de hameau", "Un four à pain communal"],
        "answer": 1,
        "why": "Le raccard abritait le grain et le pain. Ses pilotis sont coiffés de dalles plates pour arrêter les rongeurs."
      }
    ]
  },

  {
    "id": "qui-vit-la-haut",
    "pillar": "montagne",
    "name": "Qui vit là haut",
    "style": "chill",
    "tier": "decouverte",
    "points": 10,
    "location_kind": "libre",
    "location_detail": "N'importe où dans la vallée",
    "branch": "les deux branches",
    "duration": "20 minutes",
    "brief": "Repérez un animal de montagne ou ses traces. Une marmotte qui siffle, un chamois sur une vire, des empreintes, des crottes, une plume. Les traces comptent autant que l'animal.",
    "savoir": "Le gypaète barbu, le plus grand rapace des Alpes, avait totalement disparu au début du vingtième siècle, accusé à tort d'enlever des enfants. Il a été réintroduit à partir de 1986 grâce à un projet international lancé en 1978, et il vole aujourd'hui à nouveau au dessus du Valais.",
    "proof": "photo_quiz",
    "photo_hint": "Une photo de l'animal, de ses traces, ou du groupe en train de les observer.",
    "note_label": "Ce que vous avez vu et où",
    "quiz": [
      {
        "q": "À partir de quelle année le gypaète barbu a t il été réintroduit dans les Alpes ?",
        "options": ["2001", "1978", "1952", "1986"],
        "answer": 3,
        "why": "Les premiers lâchers ont eu lieu en 1986, huit ans après le lancement du projet international."
      },
      {
        "q": "De quoi se nourrit principalement le gypaète barbu ?",
        "options": ["De jeunes marmottes vivantes", "De baies et de graines", "D'os et de carcasses", "De poissons de torrent"],
        "answer": 2,
        "why": "C'est le seul oiseau au monde spécialisé dans les os. Il les laisse tomber sur les rochers pour les briser."
      },
      {
        "q": "Comment le bouquetin a t il réapparu en Suisse au début du vingtième siècle ?",
        "options": ["Par élevage en parc zoologique allemand", "Par migration naturelle depuis l'Autriche", "Il n'avait jamais disparu de Suisse", "Par réintroduction d'animaux venus du Grand Paradis en Italie"],
        "answer": 3,
        "why": "Quelques animaux venus du massif du Grand Paradis ont servi de souche à toutes les colonies suisses actuelles."
      }
    ]
  },

  {
    "id": "fleurs-daltitude",
    "pillar": "montagne",
    "name": "Fleurs d'altitude",
    "style": "chill",
    "tier": "decouverte",
    "points": 10,
    "location_kind": "libre",
    "location_detail": "N'importe où dans la vallée",
    "branch": "les deux branches",
    "duration": "15 minutes",
    "brief": "Trouvez et identifiez deux ou trois plantes de montagne. Edelweiss, gentiane, génépi, arnica, chardon bleu. Regardez de près la forme des feuilles, elle en dit souvent plus que la fleur.",
    "savoir": "L'edelweiss n'est plus une espèce menacée depuis le début des années 1990. Elle est même cultivée en Valais pour l'industrie cosmétique. Son duvet blanc agit à la fois comme une protection solaire et comme un manteau thermique contre les UV et le froid.",
    "proof": "photo_quiz",
    "photo_hint": "Une photo des plantes trouvées, de près. Ne les cueillez pas.",
    "note_label": "Les plantes identifiées",
    "quiz": [
      {
        "q": "À quoi sert le duvet blanc qui recouvre l'edelweiss ?",
        "options": ["Stocker l'eau de pluie", "Attirer les abeilles de nuit", "La protéger des UV et du froid", "Repousser les bouquetins"],
        "answer": 2,
        "why": "Ce feutrage fait office de crème solaire et de manteau. À 2500 mètres, les UV sont bien plus agressifs qu'en plaine."
      },
      {
        "q": "Pour quel usage principal l'edelweiss est il cultivé en Valais aujourd'hui ?",
        "options": ["La fabrication de fromage", "L'alimentation du bétail", "L'industrie cosmétique", "La teinture des tissus"],
        "answer": 2,
        "why": "Ses molécules antioxydantes intéressent les fabricants de crèmes. La culture évite aussi la cueillette sauvage."
      },
      {
        "q": "Le génépi est traditionnellement utilisé pour préparer quoi ?",
        "options": ["Un fumage pour la viande séchée", "Un mortier pour les murs d'alpage", "Une teinture pour la laine", "Une liqueur de plantes alpines"],
        "answer": 3,
        "why": "On le fait macérer dans l'alcool. C'est un savoir faire directement lié à l'agriculture de montagne."
      }
    ]
  },

  {
    "id": "le-sac-du-berger",
    "pillar": "montagne",
    "name": "Le sac du berger",
    "style": "culinaire",
    "tier": "decouverte",
    "points": 10,
    "location_kind": "libre",
    "location_detail": "N'importe où dans la vallée",
    "branch": "les deux branches",
    "duration": "20 minutes",
    "brief": "Comprenez ce que bergers et alpinistes emportaient pour tenir plusieurs jours en altitude, et goûtez ce que vous avez sous la main. Comparez avec le contenu de vos propres sacs.",
    "savoir": "Pain de seigle qui se conservait des mois, viande séchée, fromage d'alpage. Tout ce qui se gardait longtemps sans réfrigération, exactement ce qu'on retrouvait stocké dans les greniers sur pilotis.",
    "proof": "photo_quiz",
    "photo_hint": "Une photo du groupe avec ses provisions, version 2026.",
    "note_label": null,
    "quiz": [
      {
        "q": "Quel pain se conservait plusieurs mois et accompagnait les bergers en altitude ?",
        "options": ["Le pain au lait", "Le pain de seigle", "La baguette blanche", "La brioche de fête"],
        "answer": 1,
        "why": "Dense et peu hydraté, le pain de seigle valaisan durcit mais ne moisit pas. On le coupait à la lame fixe."
      },
      {
        "q": "Pourquoi séchait on la viande à l'air en Valais ?",
        "options": ["Parce que le sel était interdit", "Pour la vendre plus cher aux voyageurs", "Pour la rendre plus tendre en une nuit", "Parce qu'il n'existait aucun moyen de réfrigération"],
        "answer": 3,
        "why": "L'air sec et froid de la vallée faisait le travail d'un réfrigérateur, des mois durant."
      },
      {
        "q": "Où les familles stockaient elles ces réserves au village ?",
        "options": ["Dans le clocher de l'église", "Dans une cave creusée sous le torrent", "Dans l'étable avec les bêtes", "Dans un grenier sur pilotis coiffé de dalles de pierre"],
        "answer": 3,
        "why": "Les dalles rondes au sommet des pilotis empêchaient les rongeurs d'atteindre les provisions."
      }
    ]
  },

  {
    "id": "le-genepi-de-la-vallee",
    "pillar": "montagne",
    "name": "Le génépi de la vallée",
    "style": "culinaire",
    "tier": "experience",
    "points": 20,
    "location_kind": "typee",
    "location_detail": "Dans n'importe quel village ou refuge de la vallée",
    "branch": "les deux branches",
    "duration": "30 minutes",
    "brief": "Dans un village ou un refuge, cherchez comment on récolte et transforme une plante alpine en liqueur. Demandez, lisez une étiquette, goûtez si l'occasion se présente.",
    "savoir": "Les liqueurs de plantes alpines sont un savoir faire directement lié à l'agriculture de montagne. Ce sont les mêmes familles qui montaient aux alpages qui ramassaient les plantes en chemin.",
    "proof": "photo_quiz",
    "photo_hint": "Une photo du groupe avec la bouteille, l'étiquette ou la plante.",
    "note_label": "Ce que vous avez appris sur la fabrication",
    "quiz": [
      {
        "q": "Où pousse principalement le génépi ?",
        "options": ["Dans les vignes du coteau", "Au bord des torrents en plaine", "Dans les éboulis et les rocailles d'altitude", "Dans les forêts de feuillus"],
        "answer": 2,
        "why": "Il faut monter haut, souvent au dessus de 2000 mètres, dans les pierriers. C'est ce qui rend la cueillette longue."
      },
      {
        "q": "Comment fabrique t on traditionnellement la liqueur de génépi ?",
        "options": ["En faisant fermenter les feuilles dans du petit lait", "En faisant bouillir les racines dans du lait", "En pressant les fleurs comme du raisin", "En laissant macérer les tiges fleuries dans de l'alcool avec du sucre"],
        "answer": 3,
        "why": "Quelques tiges, de l'alcool, du sucre, plusieurs semaines de patience. Chaque famille avait son dosage."
      },
      {
        "q": "Pourquoi la cueillette de cette plante est elle réglementée ?",
        "options": ["Parce qu'elle attire les bouquetins", "Parce qu'elle est toxique avant la floraison", "Parce qu'elle appartient aux consortages", "Parce qu'elle pousse lentement et se régénère mal"],
        "answer": 3,
        "why": "Une touffe met des années à s'installer dans un pierrier. Une cueillette trop franche ne repousse pas."
      }
    ]
  },

  {
    "id": "glace-en-recul",
    "pillar": "montagne",
    "name": "Glace en recul",
    "style": "culturel",
    "tier": "experience",
    "points": 20,
    "location_kind": "typee",
    "location_detail": "Accessible sans marche, depuis le parking du barrage de Moiry ou le belvédère",
    "branch": "Val de Moiry",
    "duration": "30 minutes",
    "brief": "Regardez le glacier de Moiry tel qu'il est aujourd'hui, et comparez avec une vue ancienne du même endroit. Cherchez trois différences concrètes. Où s'arrêtait la glace, jusqu'où monte la roche nue, quelle végétation a pris la place.",
    "savoir": "Les glaciers suisses ont perdu un quart de leur volume rien qu'entre 2015 et 2025, contre 17 pourcent la décennie précédente. Leur volume a été divisé par deux depuis 1931.",
    "proof": "photo_quiz",
    "photo_hint": "Une photo du glacier aujourd'hui, cadrée aussi large que possible.",
    "note_label": "Les trois différences que vous avez repérées",
    "quiz": [
      {
        "q": "Quelle part de leur volume les glaciers suisses ont ils perdu entre 2015 et 2025 ?",
        "options": ["Environ un quart", "Presque rien", "Environ la moitié", "Environ 5 pourcent"],
        "answer": 0,
        "why": "Un quart en dix ans, contre 17 pourcent sur la décennie précédente. La perte s'accélère."
      },
      {
        "q": "Depuis 1931, le volume des glaciers suisses a été...",
        "options": ["Stable", "Multiplié par deux", "Réduit de 10 pourcent", "Divisé par deux"],
        "answer": 3,
        "why": "La moitié de la glace suisse a disparu en moins d'un siècle."
      },
      {
        "q": "Qu'est ce qu'une moraine ?",
        "options": ["Un canal d'irrigation en bois", "Un pâturage de haute altitude", "Un amas de roches et de débris déposé par un glacier", "Un lac de barrage artificiel"],
        "answer": 2,
        "why": "Les moraines marquent la position d'un glacier disparu. Elles donnent sa taille d'avant, en vrai, sur le terrain."
      }
    ]
  },

  {
    "id": "lecture-du-relief",
    "pillar": "montagne",
    "name": "Lecture du relief",
    "style": "culturel",
    "tier": "experience",
    "points": 20,
    "location_kind": "typee",
    "location_detail": "Depuis n'importe quel col ou crête de la vallée",
    "branch": "les deux branches",
    "duration": "30 minutes",
    "brief": "Depuis un col ou une crête, essayez de lire comment ce paysage s'est formé. La forme de la vallée, les replats, les amas de cailloux alignés, les dalles lisses. Tout cela a une cause.",
    "savoir": "Toute la vallée a été sculptée par des glaciers bien plus étendus qu'aujourd'hui. Les moraines qu'on croise sont les traces laissées par cette glace disparue.",
    "proof": "photo_quiz",
    "photo_hint": "Une photo du groupe au col ou sur la crête, avec la vallée en contrebas.",
    "note_label": "Ce que la forme du relief vous raconte",
    "quiz": [
      {
        "q": "Quelle forme de vallée est typique d'un creusement par un glacier ?",
        "options": ["Une vallée en V étroite et profonde", "Une plaine parfaitement plate", "Une vallée en U aux flancs larges", "Un canyon à parois verticales"],
        "answer": 2,
        "why": "Un glacier rabote le fond et les flancs. Une rivière seule creuse un V étroit."
      },
      {
        "q": "Que sont les roches moutonnées qu'on observe près des anciens glaciers ?",
        "options": ["Des concrétions formées par l'eau du bisse", "Des blocs taillés par les bergers", "Des roches polies et arrondies par le passage de la glace", "Des restes de murs d'alpage"],
        "answer": 2,
        "why": "La glace chargée de cailloux agit comme du papier de verre. Elle laisse des dalles lisses et striées."
      },
      {
        "q": "Un bloc erratique, c'est quoi ?",
        "options": ["Un éboulement récent de falaise", "Un rocher transporté loin de son lieu d'origine par un glacier", "Une pierre dressée par les Romains", "Une borne de consortage"],
        "answer": 1,
        "why": "On en trouve posés seuls au milieu d'un pré, d'une roche qui n'existe nulle part autour. Le glacier les a déposés là."
      }
    ]
  },

  {
    "id": "la-couronne-depuis-zinal",
    "pillar": "montagne",
    "name": "La Couronne depuis Zinal",
    "style": "chill",
    "tier": "decouverte",
    "points": 10,
    "location_kind": "typee",
    "location_detail": "Depuis n'importe quel point de vue côté vallée de Zinal",
    "branch": "vallée de Zinal",
    "duration": "20 minutes",
    "brief": "Depuis ce côté de la vallée, identifiez plusieurs sommets de la Couronne Impériale. Zinalrothorn, Obergabelhorn, Dent Blanche. Trouvez un fait marquant sur chacun.",
    "savoir": "Vu de Zinal, la Couronne se déploie en demi cercle au fond de la vallée. C'est le seul endroit d'où on la voit d'un seul regard.",
    "proof": "photo_quiz",
    "photo_hint": "Une photo du groupe avec la Couronne derrière vous.",
    "note_label": "Les sommets identifiés et un fait sur chacun",
    "quiz": [
      {
        "q": "À quelle altitude culmine le Zinalrothorn ?",
        "options": ["4221 mètres", "3796 mètres", "4634 mètres", "4506 mètres"],
        "answer": 0,
        "why": "4221 mètres. Son nom mélange le patois local et l'allemand, rothorn voulant dire corne rouge."
      },
      {
        "q": "Quel glacier descend au fond de la vallée de Zinal, au pied de la Couronne ?",
        "options": ["Le glacier d'Aletsch", "Le glacier de Zinal", "Le glacier de Moiry", "Le glacier du Rhône"],
        "answer": 1,
        "why": "Le glacier de Zinal ferme la vallée. C'est lui qui donne naissance à la Navizence de ce côté."
      },
      {
        "q": "À quelle altitude se trouve à peu près le village de Zinal ?",
        "options": ["2250 mètres", "1250 mètres", "900 mètres", "1670 mètres"],
        "answer": 3,
        "why": "Environ 1670 mètres. Il reste le village habité le plus haut de la vallée."
      }
    ]
  },

  {
    "id": "glacier-recule-mesure",
    "pillar": "montagne",
    "name": "Le glacier qui recule, mesuré",
    "style": "sportif",
    "tier": "mission",
    "points": 30,
    "location_kind": "precise",
    "location_detail": "Glacier de Moiry, depuis le sentier du pied du glacier, avec de la marche",
    "branch": "Val de Moiry",
    "duration": "2 à 3 heures avec la marche",
    "brief": "Montez vers le pied du glacier de Moiry. Sur le terrain, cherchez les repères du recul. Les moraines latérales qui dessinent un ancien niveau, la roche polie encore nue, la limite où la végétation reprend. Puis estimez de combien de mètres la glace a reculé, à vue, en utilisant ces repères.",
    "savoir": "Le volume des glaciers suisses est passé de 74,9 kilomètres cubes en l'an 2000 à 46,5 kilomètres cubes en 2024, soit une perte de 38 pourcent. À politique climatique inchangée, ils pourraient avoir disparu d'ici la fin du siècle.",
    "proof": "photo_quiz",
    "photo_hint": "Une photo du groupe au plus près du glacier, avec les moraines visibles si possible.",
    "note_label": "Votre estimation du recul, en mètres, et sur quels repères vous vous basez",
    "quiz": [
      {
        "q": "De combien le volume des glaciers suisses a t il diminué entre l'an 2000 et 2024 ?",
        "options": ["Environ 38 pourcent", "Il a augmenté", "Environ 5 pourcent", "Environ 60 pourcent"],
        "answer": 0,
        "why": "De 74,9 à 46,5 kilomètres cubes. Presque quatre dixièmes du volume partis en vingt quatre ans."
      },
      {
        "q": "Que risque t il d'arriver aux glaciers suisses d'ici la fin du siècle si rien ne change côté climat ?",
        "options": ["Ils devraient regagner du volume", "Ils devraient se stabiliser", "Ils pourraient avoir presque entièrement disparu", "Ils seront recouverts de forêt"],
        "answer": 2,
        "why": "C'est le scénario central des projections actuelles à politique inchangée."
      },
      {
        "q": "Comment reconnaît on sur le terrain jusqu'où montait le glacier autrefois ?",
        "options": ["À la couleur de l'eau du torrent", "Aux bornes posées par les consortages", "Aux moraines et à la roche polie encore sans végétation", "À la présence d'edelweiss"],
        "answer": 2,
        "why": "La zone libérée depuis peu reste grise et nue. La végétation met des décennies à s'y installer."
      }
    ]
  },

  {
    "id": "le-glacier-de-lautre-cote",
    "pillar": "montagne",
    "name": "Le glacier de l'autre côté",
    "style": "sportif",
    "tier": "mission",
    "points": 30,
    "location_kind": "precise",
    "location_detail": "Glacier de Zinal, ou un point de vue dégagé sur ce glacier au fond de la vallée",
    "branch": "vallée de Zinal",
    "duration": "2 à 3 heures avec la marche",
    "brief": "Même principe que du côté Moiry, mais ici, au fond de la vallée de Zinal. Montez jusqu'à voir le glacier, cherchez les traces de son ancienne extension, et mesurez du regard ce qu'il a perdu.",
    "savoir": "Les deux branches de la vallée ont chacune leur glacier, et chacune leur recul. Comparer les deux donne une idée de ce qui se joue à l'échelle de tout le massif.",
    "proof": "photo_quiz",
    "photo_hint": "Une photo du groupe face au glacier de Zinal.",
    "note_label": "Ce que vous observez du recul de ce glacier",
    "quiz": [
      {
        "q": "D'où vient l'eau du torrent qui traverse Zinal ?",
        "options": ["Du lac de Moiry par un tunnel", "De la fonte du glacier de Zinal et des glaciers voisins", "De la nappe du Rhône remontée par pompage", "D'une source thermale sous le village"],
        "answer": 1,
        "why": "Ce torrent est la Navizence, née directement de la glace qui fond au fond de la vallée."
      },
      {
        "q": "Pourquoi l'eau des torrents glaciaires est elle souvent grise et laiteuse ?",
        "options": ["Parce qu'elle contient du calcaire dissous", "Parce qu'elle est mélangée à de la neige fondue", "Parce qu'elle reflète le ciel", "Parce qu'elle transporte une fine farine de roche broyée par la glace"],
        "answer": 3,
        "why": "On appelle ça la farine glaciaire. Le glacier broie la roche sous lui en une poudre très fine."
      },
      {
        "q": "Quand le débit d'un torrent glaciaire est il généralement le plus fort ?",
        "options": ["Juste après une chute de neige", "À l'aube en hiver", "De façon constante toute l'année", "En fin de journée d'été, après plusieurs heures de fonte"],
        "answer": 3,
        "why": "Le soleil fait fondre toute la journée, et l'eau met des heures à traverser le glacier. Le pic arrive en fin d'après midi."
      }
    ]
  },

  {
    "id": "sommet-et-souffle",
    "pillar": "montagne",
    "name": "Sommet et souffle",
    "style": "sportif",
    "tier": "mission",
    "points": 30,
    "location_kind": "precise",
    "location_detail": "Un sommet ou un col exigeant en dénivelé, au choix du groupe",
    "branch": "les deux branches",
    "duration": "3 heures ou plus",
    "brief": "Choisissez un sommet ou un col qui demande du dénivelé, allez y, et documentez ce que vous y voyez. Ce qui change avec l'altitude, la végétation qui s'arrête, la roche qui apparaît, le vent.",
    "savoir": "En montant, tout change en même temps. La température baisse d'environ six degrés tous les mille mètres, l'air se raréfie, et la végétation s'arrête là où la saison de croissance devient trop courte.",
    "proof": "photo_quiz",
    "photo_hint": "Une photo du groupe au point le plus haut atteint.",
    "note_label": "Le lieu atteint, l'altitude, et ce que vous y avez observé",
    "quiz": [
      {
        "q": "À 2500 mètres, la pression atmosphérique représente environ quelle part de celle du niveau de la mer ?",
        "options": ["La même", "Trois quarts", "Un quart", "La moitié"],
        "answer": 1,
        "why": "Environ trois quarts. C'est déjà assez pour qu'on sente le souffle plus court à l'effort."
      },
      {
        "q": "Pourquoi la limite des arbres se situe elle vers 2200 à 2400 mètres dans les Alpes valaisannes ?",
        "options": ["Parce que les bergers les ont tous coupés", "Parce que la saison de croissance devient trop courte et trop froide", "Parce que le sol y est toujours rocheux", "Parce que le vent y souffle en permanence"],
        "answer": 1,
        "why": "Un arbre a besoin de plusieurs mois au dessus d'un certain seuil de chaleur pour former du bois. Plus haut, il n'y arrive plus."
      },
      {
        "q": "Que désigne un col, en montagne ?",
        "options": ["Le sommet le plus élevé d'une chaîne", "Une paroi verticale", "Un replat où l'on fait paître les bêtes", "Un point de passage bas entre deux sommets"],
        "answer": 3,
        "why": "C'est par les cols que passaient les chemins. Ils ont façonné toute la géographie des échanges alpins."
      }
    ]
  },

  {
    "id": "lobservatoire-de-tignousa",
    "pillar": "montagne",
    "name": "L'observatoire de Tignousa",
    "style": "chill",
    "tier": "decouverte",
    "points": 10,
    "location_kind": "precise",
    "location_detail": "Tignousa, au sommet du funiculaire de Saint Luc, à 2200 mètres",
    "branch": "les deux branches",
    "duration": "30 minutes sur place",
    "brief": "Montez à Tignousa et trouvez la coupole de l'observatoire. Repérez aussi le départ du Chemin des Planètes, juste à côté, et la première borne du système solaire. Regardez dans quelle direction s'ouvre le ciel depuis ce balcon.",
    "savoir": "L'Observatoire François Xavier Bagnoud a ouvert en 1995 à 2200 mètres. Son télescope principal de 60 centimètres est l'un des plus grands accessibles au public en Suisse. Il abrite aussi un télescope de 15 centimètres, un héliostat pour observer le Soleil et un planétarium. Depuis ce petit observatoire de vallée, une exoplanète déjà connue, HD 189733 b, a été détectée et mesurée par la méthode des transits, c'est à dire en guettant la baisse de lumière quand la planète passe devant son étoile.",
    "proof": "photo_quiz",
    "photo_hint": "Une photo du groupe du moment devant la coupole, ou devant une borne du Chemin des Planètes.",
    "note_label": "Ce que vous voyez d'ici, et dans quelle direction le ciel s'ouvre le mieux",
    "quiz": [
      {
        "q": "Quel diamètre fait le télescope principal de l'observatoire ?",
        "options": ["60 centimètres", "15 centimètres", "5 centimètres", "2 mètres"],
        "answer": 0,
        "why": "Soixante centimètres, l'un des plus grands télescopes ouverts au public en Suisse."
      },
      {
        "q": "Qu'a réussi à détecter cet observatoire de vallée ?",
        "options": ["Une comète encore inconnue", "Un nouveau satellite de Jupiter", "Une exoplanète, par la baisse de lumière de son étoile", "Une étoile en train de naître"],
        "answer": 2,
        "why": "HD 189733 b, repérée par la méthode des transits, la planète passant devant son étoile."
      },
      {
        "q": "En quelle année l'observatoire a t il ouvert à Tignousa ?",
        "options": ["1969", "2015", "1995", "1888"],
        "answer": 2,
        "why": "1995. Le Chemin des Planètes, lui, date de 1989."
      }
    ]
  },

  {
    "id": "les-champignons-de-la-vallee",
    "pillar": "montagne",
    "name": "Les champignons de la vallée",
    "style": "chill",
    "tier": "decouverte",
    "points": 10,
    "location_kind": "libre",
    "location_detail": "Dans les forêts de mélèzes et d'épicéas, n'importe où dans la vallée",
    "branch": "les deux branches",
    "duration": "30 minutes",
    "brief": "Trouvez et photographiez trois champignons différents, sans y toucher. Regardez le pied, le dessous du chapeau, l'arbre au pied duquel il pousse, et essayez de les nommer, même approximativement.",
    "alerte": "Ce défi se joue à l'œil et à l'appareil photo. On ne cueille pas, on ne goûte pas, on ne rapporte rien. Plusieurs espèces mortelles ressemblent beaucoup à des espèces comestibles, et seul un contrôleur officiel des champignons peut dire si une récolte est sûre.",
    "savoir": "Ce qui dépasse du sol n'est que le fruit du champignon. L'essentiel vit dessous, en un réseau de filaments qui peut couvrir plusieurs hectares. La plupart des espèces de montagne vivent en échange avec les arbres : le champignon apporte de l'eau et des minéraux aux racines du mélèze ou de l'épicéa, l'arbre lui donne en retour les sucres qu'il fabrique. Le Valais reste l'un des rares cantons romands sans limite de quantité ni jour d'interdiction, mais les règles communales et les zones protégées s'appliquent partout.",
    "proof": "photo_quiz",
    "photo_hint": "Une photo de chacun de vos champignons, ou une photo du groupe à côté du plus beau, sans y toucher.",
    "note_label": "Les trois champignons repérés, et l'arbre au pied duquel poussait chacun",
    "quiz": [
      {
        "q": "Ce qui dépasse du sol, dans un champignon, c'est quoi ?",
        "options": ["Un animal endormi", "Toute la plante", "Le fruit, l'essentiel vivant sous terre", "Une racine d'arbre malade"],
        "answer": 2,
        "why": "Le réseau de filaments sous le sol peut couvrir plusieurs hectares et vivre des décennies."
      },
      {
        "q": "Qu'échangent un champignon de montagne et le mélèze à son pied ?",
        "options": ["Le champignon apporte eau et minéraux, l'arbre donne ses sucres", "Le champignon protège l'arbre du gel", "Rien du tout, ils se gênent", "L'arbre lui donne de l'ombre contre un loyer"],
        "answer": 0,
        "why": "C'est une association à bénéfice partagé, entre les racines de l'arbre et les filaments du champignon."
      },
      {
        "q": "Qui peut dire si une récolte de champignons est propre à la consommation ?",
        "options": ["Une application de reconnaissance photo", "Un contrôleur officiel des champignons", "Le restaurateur du village", "N'importe quel guide de montagne"],
        "answer": 1,
        "why": "Les contrôleurs agréés sont là pour ça, et eux seuls. Dans le doute, on ne mange pas."
      }
    ]
  },

  {
    "id": "lillgraben",
    "pillar": "montagne",
    "name": "L'Illgraben",
    "style": "sportif",
    "tier": "experience",
    "points": 20,
    "location_kind": "precise",
    "location_detail": "Le point de vue sur l'Illgraben, à 15 minutes de marche de la Cabane Illhorn",
    "branch": "aval, vers la plaine",
    "duration": "1 à 2 heures depuis Chandolin",
    "brief": "Depuis la Cabane Illhorn, marchez un quart d'heure jusqu'au point de vue qui plonge sur l'Illgraben. Regardez l'entaille, la couleur des roches, le lit du torrent tout en bas, et cherchez les traces des dernières coulées.",
    "savoir": "L'Illgraben est l'un des torrents les plus actifs des Alpes. Son bassin descend du sommet de l'Illhorn, à 2717 mètres, jusqu'au Rhône, vers 605 mètres. Depuis l'an 2000, l'institut fédéral WSL y mesure les laves torrentielles avec des géophones posés sur deux kilomètres de lit. Il en dévale trois à cinq par an entre mai et octobre, d'un volume moyen de 25 000 mètres cubes, et jusqu'à 100 000 pour la plus grosse mesurée. Tout ce matériel a construit en bas le plus grand cône de déjection de Suisse, qui porte aujourd'hui la pinède du Bois de Finges.",
    "proof": "photo_quiz",
    "photo_hint": "Une photo du groupe du moment au point de vue, avec l'entaille de l'Illgraben derrière vous.",
    "note_label": "Ce que vous voyez des dernières coulées, et la couleur des roches",
    "quiz": [
      {
        "q": "Combien de laves torrentielles dévalent l'Illgraben en moyenne chaque année ?",
        "options": ["Une tous les dix ans", "Aucune depuis 1950", "Plus de cent", "Trois à cinq, entre mai et octobre"],
        "answer": 3,
        "why": "C'est ce qui en fait un laboratoire à ciel ouvert, suivi par le WSL depuis l'an 2000."
      },
      {
        "q": "Jusqu'où descend le bassin de l'Illgraben depuis le sommet de l'Illhorn ?",
        "options": ["Il s'arrête à 2000 mètres", "Jusqu'au lac de Moiry", "Jusqu'au Rhône, vers 605 mètres", "Jusqu'à Vissoie"],
        "answer": 2,
        "why": "Du sommet à 2717 mètres jusqu'à la plaine du Rhône, plus de deux mille mètres de dénivelé."
      },
      {
        "q": "Qu'a construit l'Illgraben au bas de sa course ?",
        "options": ["Un barrage naturel qui a formé un lac", "Rien, tout part dans le Rhône", "Une moraine glaciaire", "Le plus grand cône de déjection de Suisse, qui porte le Bois de Finges"],
        "answer": 3,
        "why": "La pinède du Bois de Finges pousse sur ce cône, et le Rhône a été repoussé contre l'autre versant."
      }
    ]
  },

  /* ============ PILIER 2. EAU (8) ============ */

  {
    "id": "ou-va-leau",
    "pillar": "eau",
    "name": "Où va l'eau",
    "style": "chill",
    "tier": "decouverte",
    "points": 10,
    "location_kind": "libre",
    "location_detail": "Au bord de n'importe quel cours d'eau de la vallée",
    "branch": "les deux branches",
    "duration": "15 minutes",
    "brief": "Trouvez de l'eau qui coule, et remontez son trajet par la pensée. D'où vient elle exactement, et où va t elle finir. Suivez le fil jusqu'au bout.",
    "savoir": "La rivière de la vallée, la Navizence, naît des glaciers et se jette dans le Rhône à Chippis, tout en bas.",
    "proof": "photo_quiz",
    "photo_hint": "Une photo du groupe au bord de l'eau.",
    "note_label": null,
    "quiz": [
      {
        "q": "Comment s'appelle la rivière qui descend le Val d'Anniviers ?",
        "options": ["La Dranse", "La Borgne", "La Vispa", "La Navizence"],
        "answer": 3,
        "why": "La Navizence rassemble l'eau des deux branches de la vallée avant de descendre vers la plaine."
      },
      {
        "q": "Dans quelle localité la Navizence rejoint elle le Rhône ?",
        "options": ["Chippis", "Martigny", "Sion", "Sierre"],
        "answer": 0,
        "why": "À Chippis, juste à la sortie de la vallée. Sa force a d'ailleurs attiré l'industrie dès le début du vingtième siècle."
      },
      {
        "q": "Où finit l'eau du Rhône après avoir quitté la Suisse ?",
        "options": ["En mer du Nord", "En mer Méditerranée", "En mer Noire", "Dans le Danube"],
        "answer": 1,
        "why": "De la glace du fond de la vallée à la Méditerranée. Le même litre d'eau fait tout le chemin."
      }
    ]
  },

  {
    "id": "le-nom-du-canal",
    "pillar": "eau",
    "name": "Le nom du canal",
    "style": "culturel",
    "tier": "decouverte",
    "points": 10,
    "location_kind": "libre",
    "location_detail": "N'importe où dans la vallée, le long d'un canal ou d'un bisse",
    "branch": "les deux branches",
    "duration": "20 minutes",
    "brief": "Trouvez un bisse ou un canal traditionnel, et retrouvez son nom local. Panneau, borne, carte, habitant. Puis regardez dans quel sens il coule et où il part.",
    "savoir": "Au début du vingtième siècle, le Valais comptait environ 1800 kilomètres de bisses, gérés par des consortages qui élisaient un répartiteur chargé de distribuer l'eau selon des règles très strictes.",
    "proof": "photo_quiz",
    "photo_hint": "Une photo du bisse ou du canal, avec le panneau de nom si vous en trouvez un.",
    "note_label": "Le nom du bisse ou du canal trouvé",
    "quiz": [
      {
        "q": "Combien de kilomètres de bisses le Valais comptait il au début du vingtième siècle ?",
        "options": ["Environ 180", "Environ 300", "Environ 1800", "Environ 18 000"],
        "answer": 2,
        "why": "1800 kilomètres, creusés à la main sur des siècles, dans un canton de la taille d'un département."
      },
      {
        "q": "Comment appelle t on l'association de paysans qui gérait un bisse ?",
        "options": ["Une confrérie", "Un syndicat", "Un consortage", "Une commanderie"],
        "answer": 2,
        "why": "Le consortage construisait, entretenait et répartissait. C'est une des plus vieilles formes de gestion collective d'Europe."
      },
      {
        "q": "Quel était le rôle du répartiteur élu par le consortage ?",
        "options": ["Surveiller les troupeaux à l'alpage", "Entretenir le four à pain", "Percevoir l'impôt communal", "Distribuer l'eau entre les ayants droit selon des règles strictes"],
        "answer": 3,
        "why": "Il tenait les tours d'eau. Chacun savait quel jour et combien d'heures l'eau était à lui."
      }
    ]
  },

  {
    "id": "le-pourquoi-des-bisses",
    "pillar": "eau",
    "name": "Le pourquoi des bisses",
    "style": "culturel",
    "tier": "experience",
    "points": 20,
    "location_kind": "typee",
    "location_detail": "Le long de n'importe quel bisse de la vallée",
    "branch": "les deux branches",
    "duration": "45 minutes",
    "brief": "Marchez un moment le long d'un bisse et comprenez comment il fonctionne. Cherchez la pente, les ouvrages de prise, les passages taillés dans le rocher. Demandez vous ce que ça a coûté de creuser ça à la main.",
    "savoir": "Les bisses sont nés au quatorzième siècle pour irriguer des prairies dans un canton naturellement sec. Certains, comme le Grand Bisse de Lens, font 14 kilomètres et ont été construits en deux ans, à flanc de falaise.",
    "proof": "photo_quiz",
    "photo_hint": "Une photo du groupe le long du bisse, idéalement sur un passage spectaculaire.",
    "note_label": null,
    "quiz": [
      {
        "q": "À quel siècle les bisses valaisans sont ils principalement apparus ?",
        "options": ["Au vingtième siècle", "Au quatorzième siècle", "À l'époque romaine", "Au dix neuvième siècle"],
        "answer": 1,
        "why": "Le quatorzième siècle est le grand siècle des bisses. La pression sur les terres agricoles augmentait."
      },
      {
        "q": "Pourquoi le Valais a t il eu besoin de ces canaux ?",
        "options": ["Parce que les pluies y étaient trop violentes", "Parce que les rivières gelaient toute l'année", "Parce que c'est l'une des régions les plus sèches de Suisse", "Pour faire tourner des moulins à vent"],
        "answer": 2,
        "why": "Les montagnes arrêtent les pluies. Certaines vallées valaisannes reçoivent moins de 600 millimètres par an."
      },
      {
        "q": "Quelle est la longueur du Grand Bisse de Lens ?",
        "options": ["14 kilomètres", "120 kilomètres", "45 kilomètres", "2 kilomètres"],
        "answer": 0,
        "why": "14 kilomètres à flanc de falaise, creusés en deux ans, sans machine."
      },
      {
        "q": "Comment un bisse maintient il un débit régulier sur des kilomètres ?",
        "options": ["Grâce à une pente très faible et constante", "Grâce à des écluses ouvertes chaque matin", "Grâce à des pompes placées tous les cent mètres", "Grâce à la pression du glacier en amont"],
        "answer": 0,
        "why": "Quelques millimètres de dénivelé par mètre. Trop peu, l'eau stagne. Trop, elle creuse et emporte tout."
      }
    ]
  },

  {
    "id": "leau-des-glaciers-energie",
    "pillar": "eau",
    "name": "L'eau des glaciers, source d'énergie",
    "style": "culturel",
    "tier": "experience",
    "points": 20,
    "location_kind": "typee",
    "location_detail": "Depuis un point de vue sur le barrage de Moiry, ou sur un torrent capté",
    "branch": "les deux branches",
    "duration": "30 minutes",
    "brief": "Comprenez comment l'eau de fonte finit par produire de l'électricité. Cherchez les indices de captage autour de vous. Conduites, prises d'eau, galeries, lignes à haute tension.",
    "savoir": "Le barrage de Moiry, construit entre 1954 et 1958, culmine à 148 mètres à 2250 mètres d'altitude. Ses centrales couvrent les besoins annuels de plus de 120 000 ménages.",
    "proof": "photo_quiz",
    "photo_hint": "Une photo du groupe avec le barrage, une conduite ou une prise d'eau visible.",
    "note_label": null,
    "quiz": [
      {
        "q": "Entre quelles années le barrage de Moiry a t il été construit ?",
        "options": ["Entre 1995 et 2000", "Entre 1920 et 1925", "Entre 1954 et 1958", "Entre 1975 et 1980"],
        "answer": 2,
        "why": "Quatre ans de chantier à 2250 mètres, à une époque où tout montait par des routes provisoires."
      },
      {
        "q": "Quelle est la hauteur du barrage de Moiry ?",
        "options": ["40 mètres", "90 mètres", "285 mètres", "148 mètres"],
        "answer": 3,
        "why": "148 mètres, soit la hauteur d'un immeuble de quarante étages."
      },
      {
        "q": "Combien de ménages les centrales liées à Moiry alimentent elles chaque année ?",
        "options": ["Environ 12 000", "Environ 1200", "Plus de 120 000", "Plus d'un million"],
        "answer": 2,
        "why": "Plus de 120 000 ménages, bien plus que toute la population du Valais."
      },
      {
        "q": "Pourquoi un barrage d'altitude est il précieux pour le réseau électrique suisse ?",
        "options": ["Parce qu'il stocke de l'énergie et peut la produire au moment où on en a besoin", "Parce qu'il fonctionne sans eau en hiver", "Parce qu'il produit la nuit sans turbiner", "Parce qu'il remplace entièrement le solaire"],
        "answer": 0,
        "why": "Un lac d'altitude est une batterie. On garde l'eau de l'été pour turbiner en hiver, quand la demande grimpe."
      }
    ]
  },

  {
    "id": "leau-qui-fait-le-vin",
    "pillar": "eau",
    "name": "L'eau qui fait le vin",
    "style": "culinaire",
    "tier": "experience",
    "points": 20,
    "location_kind": "typee",
    "location_detail": "Dans un vignoble en aval de la vallée, côté Chippis, Chalais ou Réchy",
    "branch": "aval, vers la plaine",
    "duration": "45 minutes",
    "brief": "Descendez vers les vignes à la sortie de la vallée, et comprenez comment l'eau du bisse les irrigue encore aujourd'hui. Cherchez le canal, regardez comment il longe le coteau. Dégustation si l'occasion se présente.",
    "savoir": "Le bisse du Ricard, creusé il y a près de 500 ans, prend sa source dans la Navizence et irrigue encore aujourd'hui des centaines d'hectares de vignes sur les coteaux de Chippis, Chalais et Réchy, juste à la sortie de la vallée.",
    "proof": "photo_quiz",
    "photo_hint": "Une photo du groupe dans les vignes, avec le coteau derrière.",
    "note_label": null,
    "quiz": [
      {
        "q": "Dans quelle rivière le bisse du Ricard prend il sa source ?",
        "options": ["Le Rhône", "La Lienne", "La Navizence", "La Borgne"],
        "answer": 2,
        "why": "L'eau du Val d'Anniviers irrigue donc des vignes situées en dehors de la vallée."
      },
      {
        "q": "Depuis combien de temps environ ce bisse existe t il ?",
        "options": ["Près de 500 ans", "Environ 50 ans", "Environ 150 ans", "Près de 2000 ans"],
        "answer": 0,
        "why": "Près de cinq siècles de service continu, et il fonctionne toujours."
      },
      {
        "q": "Quels coteaux ce bisse irrigue t il encore aujourd'hui ?",
        "options": ["Chippis, Chalais et Réchy", "Sion et Conthey", "Zinal et Grimentz", "Martigny et Fully"],
        "answer": 0,
        "why": "Des centaines d'hectares de vigne, juste à la sortie de la vallée."
      }
    ]
  },

  {
    "id": "mission-secheresse",
    "pillar": "eau",
    "name": "Mission sécheresse",
    "style": "culturel",
    "tier": "experience",
    "points": 20,
    "location_kind": "libre",
    "location_detail": "N'importe où, ce défi se joue en discutant",
    "branch": "les deux branches",
    "duration": "30 minutes",
    "brief": "Voici votre scénario. Nous sommes en juillet, l'hiver a été pauvre en neige et le torrent est à la moitié de son débit habituel. Vous disposez de 100 unités d'eau pour la semaine, et quatre usages les demandent toutes les quatre. Les prairies d'alpage qui nourrissent les troupeaux en altitude. Les vignes du coteau, en pleine formation des grappes. L'eau potable du village, en pleine saison touristique. Le lac du barrage, qui doit se remplir pour produire l'électricité de l'hiver prochain. Répartissez vos 100 unités entre ces quatre usages, et mettez vous d'accord sur pourquoi. Il n'y a pas de bonne réponse, seulement des choix à assumer.",
    "savoir": "Avec moins de neige en hiver, ce dilemme redevient aujourd'hui d'actualité. C'est le même qu'il y a sept siècles, amplifié par le réchauffement.",
    "proof": "photo_quiz",
    "photo_hint": "Une photo du groupe pendant la négociation, ou de votre répartition écrite sur un papier.",
    "note_label": "Votre répartition des 100 unités entre les quatre usages, et votre justification",
    "quiz": [
      {
        "q": "En Valais, à quelle période l'irrigation est elle historiquement la plus nécessaire ?",
        "options": ["Au printemps et en été, quand l'herbe pousse et qu'il pleut peu", "Juste après les vendanges", "Au cœur de l'hiver", "En novembre, avant les gels"],
        "answer": 0,
        "why": "C'est exactement la période où les bisses étaient ouverts, et où les tours d'eau se négociaient le plus durement."
      },
      {
        "q": "Pourquoi un hiver peu enneigé pose t il problème à l'irrigation de l'été suivant ?",
        "options": ["Parce que la neige fertilise les prairies", "Parce que la neige protège les canaux du gel", "Parce qu'elle empêche les bêtes de sortir trop tôt", "Parce que la neige d'altitude est la réserve qui alimente les torrents au printemps et en été"],
        "answer": 3,
        "why": "La neige est un réservoir à libération lente. Sans elle, l'eau arrive trop tôt, toute d'un coup, puis manque."
      },
      {
        "q": "En cas de manque d'eau, quel usage la loi suisse rend elle prioritaire ?",
        "options": ["La production d'électricité", "L'eau potable pour la population", "L'irrigation des vignes", "L'enneigement artificiel"],
        "answer": 1,
        "why": "L'alimentation en eau potable passe avant tout le reste. Les autres usages se partagent ce qui reste."
      }
    ]
  },

  {
    "id": "le-geant-de-beton",
    "pillar": "eau",
    "name": "Le géant de béton",
    "style": "sportif",
    "tier": "mission",
    "points": 30,
    "location_kind": "precise",
    "location_detail": "Barrage de Moiry, sur le couronnement",
    "branch": "Val de Moiry",
    "duration": "1 à 2 heures avec l'accès",
    "brief": "Rendez vous au barrage de Moiry, marchez sur son couronnement, et comprenez pourquoi il est là. Regardez sa forme, la courbure du mur, et imaginez le chantier des années cinquante à cette altitude.",
    "savoir": "Un rehaussement de 9 mètres est actuellement à l'étude pour stocker davantage d'énergie hivernale.",
    "proof": "photo_quiz",
    "photo_hint": "Une photo du groupe sur ou devant le barrage.",
    "note_label": null,
    "quiz": [
      {
        "q": "De combien de mètres un rehaussement du barrage de Moiry est il à l'étude ?",
        "options": ["50 mètres", "25 mètres", "2 mètres", "9 mètres"],
        "answer": 3,
        "why": "Neuf mètres de plus, ce qui augmenterait nettement le volume stocké sans reconstruire le mur."
      },
      {
        "q": "Pourquoi veut on rehausser ce barrage ?",
        "options": ["Pour stocker davantage d'énergie disponible en hiver", "Pour élargir la route d'accès", "Pour créer une plage au bord du lac", "Pour protéger Zinal des avalanches"],
        "answer": 0,
        "why": "L'hiver, la Suisse manque d'électricité. Plus d'eau stockée en altitude, c'est plus de production quand il fait froid."
      },
      {
        "q": "À quelle altitude se trouve le barrage de Moiry ?",
        "options": ["Environ 1000 mètres", "Environ 2250 mètres", "Environ 3000 mètres", "Environ 1400 mètres"],
        "answer": 1,
        "why": "2250 mètres, bien au dessus de la limite des arbres."
      },
      {
        "q": "Quel type de barrage est celui de Moiry ?",
        "options": ["Un barrage voûte en béton, arqué vers l'amont", "Un barrage gonflable", "Une digue de rochers empilés", "Un barrage en terre compactée"],
        "answer": 0,
        "why": "La voûte reporte la poussée de l'eau sur les flancs rocheux. C'est ce qui permet un mur aussi fin pour 148 mètres de haut."
      }
    ]
  },

  {
    "id": "la-riviere-qui-vient-de-zinal",
    "pillar": "eau",
    "name": "La rivière qui vient de Zinal",
    "style": "culturel",
    "tier": "experience",
    "points": 20,
    "location_kind": "typee",
    "location_detail": "Au bord du torrent, côté vallée de Zinal",
    "branch": "vallée de Zinal",
    "duration": "30 minutes",
    "brief": "Au bord du torrent côté Zinal, comprenez d'où vient cette eau et où elle rejoint celle de l'autre branche. Regardez sa couleur, son débit, sa température si vous osez y mettre la main.",
    "savoir": "Les deux branches de la vallée portent chacune son torrent. Ils se rejoignent plus bas, là où la vallée se resserre en une seule.",
    "proof": "photo_quiz",
    "photo_hint": "Une photo du groupe au bord du torrent.",
    "note_label": null,
    "quiz": [
      {
        "q": "Où les eaux venues de Zinal et celles venues du Val de Moiry se rejoignent elles ?",
        "options": ["Elles ne se rejoignent jamais", "En aval, vers Vissoie, là où la vallée se resserre en une seule branche", "Au sommet du barrage de Moiry", "Directement à Chippis"],
        "answer": 1,
        "why": "Vissoie est le nœud de la vallée. C'est là que les deux branches et les deux eaux se rejoignent."
      },
      {
        "q": "Comment s'appelle le torrent qui descend du Val de Moiry ?",
        "options": ["La Gougra", "La Sionne", "La Borgne", "La Vispa"],
        "answer": 0,
        "why": "La Gougra rejoint la Navizence vers Vissoie. Deux noms pour la même eau, finalement."
      },
      {
        "q": "Pourquoi le niveau de la Navizence monte il fortement en juillet ?",
        "options": ["Parce que le barrage est vidé chaque été", "Parce que la fonte des neiges et des glaces est à son maximum", "Parce que les bisses sont fermés", "Parce que c'est la saison des pluies en Valais"],
        "answer": 1,
        "why": "Le régime de cette rivière est glaciaire. Elle est pleine en été et basse en hiver, l'inverse d'une rivière de plaine."
      }
    ]
  },

  /* ============ PILIER 3. VIE ALPINE (9) ============ */

  {
    "id": "les-cornes-qui-saffrontent",
    "pillar": "vie-alpine",
    "name": "Les cornes qui s'affrontent",
    "style": "chill",
    "tier": "decouverte",
    "points": 10,
    "location_kind": "libre",
    "location_detail": "N'importe où, ce défi est un quiz",
    "branch": "les deux branches",
    "duration": "10 minutes",
    "brief": "Un quiz sur la race d'Hérens et les combats de reines. Si vous croisez un troupeau dans la journée, observez qui mène et qui suit, la hiérarchie se voit à l'œil nu.",
    "savoir": "La vache d'Hérens établit sa hiérarchie de troupeau par des combats front contre front, sans quasiment jamais se blesser. Cette tradition, inscrite au patrimoine culturel immatériel du Valais, attire des dizaines de milliers de spectateurs chaque année.",
    "proof": "quiz",
    "photo_hint": null,
    "note_label": null,
    "quiz": [
      {
        "q": "Comment les vaches de race d'Hérens établissent elles leur hiérarchie ?",
        "options": ["Par des combats front contre front", "En se poursuivant dans la pente", "Selon l'ordre d'arrivée à l'alpage", "Par la taille de leurs cornes uniquement"],
        "answer": 0,
        "why": "Elles se poussent front contre front jusqu'à ce que l'une cède. C'est un rapport de force, pas un combat à blessures."
      },
      {
        "q": "Ces combats laissent ils habituellement des blessures ?",
        "options": ["Non, les bêtes se blessent très rarement", "Oui, presque toujours", "Les bêtes sont séparées avant tout contact", "Oui, les cornes sont cassées à chaque fois"],
        "answer": 0,
        "why": "C'est un comportement naturel et codifié. Les bêtes savent exactement quand s'arrêter."
      },
      {
        "q": "Quelle est la particularité physique de la vache d'Hérens ?",
        "options": ["Elle n'a pas de cornes", "Elle ne supporte pas l'altitude", "La plus grande race laitière d'Europe", "Une race petite, trapue et très musclée, adaptée aux fortes pentes"],
        "answer": 3,
        "why": "Petite et basse sur pattes, elle tient debout là où une race de plaine glisserait. Elle produit moins de lait, mais elle monte."
      },
      {
        "q": "Comment appelle t on la vache qui domine un troupeau d'alpage ?",
        "options": ["La première", "La reine", "La meneuse", "La doyenne"],
        "answer": 1,
        "why": "La reine mène le troupeau à l'alpage et décide où il va paître. Son rang est un vrai statut, pour elle et pour son propriétaire."
      }
    ]
  },

  {
    "id": "de-lherbe-au-fromage",
    "pillar": "vie-alpine",
    "name": "De l'herbe au fromage",
    "style": "culinaire",
    "tier": "decouverte",
    "points": 10,
    "location_kind": "libre",
    "location_detail": "N'importe où, ce défi est un quiz",
    "branch": "les deux branches",
    "duration": "10 minutes",
    "brief": "Un quiz sur la chaîne complète qui va de l'herbe d'altitude jusqu'au fromage dans votre assiette.",
    "savoir": "Tout part de la flore que broutent les bêtes. C'est elle qui donne au fromage d'alpage un goût qu'aucune fromagerie de plaine ne peut reproduire.",
    "proof": "quiz",
    "photo_hint": null,
    "note_label": null,
    "quiz": [
      {
        "q": "Combien de litres de lait faut il environ pour produire un kilo de fromage à pâte mi dure ?",
        "options": ["Environ 10 litres", "Environ 50 litres", "Environ 2 litres", "Environ 100 litres"],
        "answer": 0,
        "why": "Environ dix litres. Une meule d'alpage de dix kilos représente donc la traite de tout un troupeau."
      },
      {
        "q": "Qu'est ce que la présure, utilisée dans la fabrication du fromage ?",
        "options": ["Un ferment qui fait cailler le lait", "Un outil en bois pour brasser", "Un sel de conservation", "Une herbe d'alpage aromatique"],
        "answer": 0,
        "why": "Elle sépare le lait en caillé et en petit lait. Sans elle, pas de fromage possible."
      },
      {
        "q": "Que devenait traditionnellement le petit lait qui reste après le caillage ?",
        "options": ["Il servait à nourrir les cochons de l'alpage", "Il était jeté dans le torrent", "Il servait à blanchir le linge", "Il était réservé aux bêtes malades"],
        "answer": 0,
        "why": "Chaque alpage avait ses cochons, nourris du petit lait. Rien ne se perdait dans ce système."
      },
      {
        "q": "Pourquoi le goût d'un fromage d'alpage change t il au fil de l'été ?",
        "options": ["Parce que la température des caves baisse", "Parce qu'on ajoute plus de sel en fin de saison", "Parce que la flore que broutent les bêtes change avec l'altitude et la saison", "Parce qu'on change de race de vache en août"],
        "answer": 2,
        "why": "Les bêtes montent progressivement pendant l'été et ne broutent jamais deux fois la même prairie. Le fromage suit."
      }
    ]
  },

  {
    "id": "qui-decide-de-leau-et-de-lherbe",
    "pillar": "vie-alpine",
    "name": "Qui décide de l'eau et de l'herbe",
    "style": "culturel",
    "tier": "experience",
    "points": 20,
    "location_kind": "typee",
    "location_detail": "Sur n'importe quel alpage, ou le long d'un bisse",
    "branch": "les deux branches",
    "duration": "30 minutes",
    "brief": "Comprenez comment fonctionnait, et fonctionne encore, un consortage. Qui décide, selon quelles règles, et ce qui arrive quand quelqu'un ne respecte pas sa part.",
    "savoir": "Les paysans valaisans s'organisaient en associations qui construisaient les bisses ensemble et se répartissaient l'eau selon la taille de chaque troupeau. Un des plus anciens règlements connus, celui du bisse de Bitailla, menaçait dès 1306 de couper la main de quiconque volait de l'eau.",
    "proof": "photo_quiz",
    "photo_hint": "Une photo du groupe sur l'alpage ou au bord du bisse.",
    "note_label": null,
    "quiz": [
      {
        "q": "Selon quel critère l'eau était elle répartie entre les membres d'un consortage ?",
        "options": ["Selon la taille de leur troupeau", "Selon leur ancienneté dans le village", "Au tirage au sort chaque printemps", "De façon strictement égale"],
        "answer": 0,
        "why": "Plus de bêtes, plus de prés à irriguer, donc plus de droits d'eau. Et aussi plus d'heures de travail à fournir pour l'entretien."
      },
      {
        "q": "Quelle peine le règlement du bisse de Bitailla prévoyait il en 1306 pour le vol d'eau ?",
        "options": ["Une amende de trois fromages", "L'exclusion du consortage", "Couper la main du voleur", "La confiscation du troupeau"],
        "answer": 2,
        "why": "La sévérité dit tout de la valeur de l'eau. Détourner le tour d'eau d'un voisin, c'était menacer sa récolte."
      },
      {
        "q": "Que gère encore aujourd'hui un consortage dans certains villages valaisans ?",
        "options": ["Un bien commun comme un bisse, un alpage ou une forêt", "Les remontées mécaniques", "L'école du village", "Le bureau de poste"],
        "answer": 0,
        "why": "Ces structures ont survécu des siècles. Elles gèrent toujours des biens que personne ne possède seul."
      }
    ]
  },

  {
    "id": "le-rythme-de-la-transhumance",
    "pillar": "vie-alpine",
    "name": "Le rythme de la transhumance",
    "style": "culturel",
    "tier": "experience",
    "points": 20,
    "location_kind": "typee",
    "location_detail": "Sur n'importe quel alpage de la vallée",
    "branch": "les deux branches",
    "duration": "30 minutes",
    "brief": "Sur un alpage, comprenez le calendrier de la montée et de la descente des troupeaux, et pourquoi ce calendrier bouge aujourd'hui.",
    "savoir": "Des étés plus chauds et plus secs modifient aujourd'hui les dates de montée des troupeaux et la disponibilité de l'herbe en altitude.",
    "proof": "photo_quiz",
    "photo_hint": "Une photo du groupe sur l'alpage.",
    "note_label": null,
    "quiz": [
      {
        "q": "Que désigne l'inalpe ?",
        "options": ["La tonte des moutons", "La descente des troupeaux en automne", "La montée des troupeaux à l'alpage au début de l'été", "La fête de fin des vendanges"],
        "answer": 2,
        "why": "C'est la grande fête du début de l'été. Le troupeau monte, et les combats désignent la reine de l'alpage."
      },
      {
        "q": "Et la désalpe ?",
        "options": ["La descente des troupeaux vers le village à la fin de l'été", "La première traite de la saison", "L'ouverture des bisses au printemps", "Le partage du fromage entre familles"],
        "answer": 0,
        "why": "On redescend avant les premières neiges, bêtes décorées, et on partage les fromages de la saison."
      },
      {
        "q": "Comment le réchauffement modifie t il ce rythme ?",
        "options": ["La désalpe a été supprimée", "La neige fond plus tôt, mais l'herbe d'altitude peut manquer d'eau plus tôt aussi", "Les troupeaux montent désormais en hiver", "L'herbe pousse toute l'année en altitude"],
        "answer": 1,
        "why": "Monter plus tôt semble possible, mais la sécheresse d'août peut griller l'herbe avant la fin de la saison. Le calcul devient difficile."
      },
      {
        "q": "Pourquoi montait on traditionnellement les bêtes en altitude l'été ?",
        "options": ["Parce que les étables du village étaient trop petites", "Pour produire un lait moins gras", "Pour utiliser l'herbe d'altitude et garder celle du village pour le foin d'hiver", "Pour les éloigner des loups uniquement"],
        "answer": 2,
        "why": "Pendant que les bêtes sont en haut, les prés du bas poussent tranquillement et deviennent le foin qui tiendra tout l'hiver."
      }
    ]
  },

  {
    "id": "degustation-dalpage",
    "pillar": "vie-alpine",
    "name": "Dégustation d'alpage",
    "style": "culinaire",
    "tier": "experience",
    "points": 20,
    "location_kind": "typee",
    "location_detail": "Sur un alpage, dans une fromagerie ou un commerce de village",
    "branch": "les deux branches",
    "duration": "30 minutes",
    "brief": "Trouvez un fromage d'alpage local, goûtez le, et essayez de deviner de quel type de pâturage il vient. Haut et sec, ou plus bas et gras. Cherchez les indices sur l'étiquette et dans le goût.",
    "savoir": "Un fromage d'alpage porte la signature de sa prairie. L'altitude, la flore et même l'exposition du pâturage se retrouvent dans le goût.",
    "proof": "photo_quiz",
    "photo_hint": "Une photo du groupe avec le fromage.",
    "note_label": "Le fromage goûté et ce que vous devinez de son pâturage",
    "quiz": [
      {
        "q": "Quel plat valaisan se prépare en faisant fondre un demi fromage devant la braise ?",
        "options": ["La fondue moitié moitié", "La brisolée", "La raclette", "Le gratin de cardons"],
        "answer": 2,
        "why": "La raclette est née exactement comme ça, un demi fromage tourné vers le feu, raclé au couteau."
      },
      {
        "q": "Qu'indique la mention d'alpage sur un fromage valaisan ?",
        "options": ["Qu'il vient d'un troupeau de race d'Hérens uniquement", "Qu'il a été fabriqué en altitude pendant la saison d'estivage", "Qu'il a été fabriqué au lait pasteurisé", "Qu'il a été affiné plus de trois ans"],
        "answer": 1,
        "why": "Fabriqué là haut, pendant les quelques mois où le troupeau est à l'alpage. Une production courte et datée."
      },
      {
        "q": "Pourquoi les fromages d'alpage étaient ils si importants pour les familles ?",
        "options": ["Parce qu'ils remplaçaient la monnaie à l'église", "Parce qu'ils transformaient un lait périssable en réserve qui se gardait des mois", "Parce qu'ils se vendaient très cher à l'étranger", "Parce qu'ils étaient le seul aliment salé disponible"],
        "answer": 1,
        "why": "Le lait ne descend pas de l'alpage, mais le fromage si. C'était la seule façon de conserver une récolte de lait."
      }
    ]
  },

  {
    "id": "lalpage-oublie",
    "pillar": "vie-alpine",
    "name": "L'alpage oublié",
    "style": "sportif",
    "tier": "mission",
    "points": 30,
    "location_kind": "precise",
    "location_detail": "Un alpage qui n'est plus exploité, repéré sur la carte ou indiqué sur place",
    "branch": "les deux branches",
    "duration": "2 à 3 heures avec la marche",
    "brief": "Montez jusqu'à un alpage qui n'est plus exploité. Regardez ce qui reste. Les murs, les abreuvoirs, les sentiers encore lisibles, la végétation qui reprend. Puis cherchez pourquoi il a été laissé.",
    "savoir": "L'exode rural du vingtième siècle et la baisse de rentabilité de l'agriculture de montagne ont fait disparaître de nombreux alpages, un miroir direct de la trame narrative du jeu.",
    "proof": "photo_quiz",
    "photo_hint": "Une photo du groupe dans les ruines ou devant les bâtiments abandonnés.",
    "note_label": "Ce que vous avez trouvé sur place, et pourquoi cet alpage a été abandonné selon vous",
    "quiz": [
      {
        "q": "Quelle est la principale raison de l'abandon de nombreux alpages au vingtième siècle ?",
        "options": ["La disparition des bisses", "L'interdiction légale de l'estivage", "L'exode rural et la baisse de rentabilité de l'agriculture de montagne", "Une épidémie touchant les vaches d'Hérens"],
        "answer": 2,
        "why": "Les bras sont partis vers l'industrie et le tourisme. Un alpage demande des gens, et il n'y en avait plus assez."
      },
      {
        "q": "Que devient un pâturage d'altitude qui n'est plus pâturé ?",
        "options": ["Il se transforme en tourbière", "Il reste identique pendant des siècles", "Il devient un désert de pierre en quelques années", "Il se referme peu à peu, envahi par les buissons et la forêt"],
        "answer": 3,
        "why": "Ces prairies sont un paysage fabriqué par les bêtes. Sans elles, l'aulne et le rhododendron reprennent tout."
      },
      {
        "q": "Pourquoi l'entretien des alpages compte t il aussi pour la sécurité en montagne ?",
        "options": ["Parce que les troupeaux tassent les chemins", "Parce que les bergers surveillent les avalanches", "Parce que les chalets servent de refuges officiels", "Parce qu'une prairie pâturée et entretenue retient mieux la neige et limite les glissements"],
        "answer": 3,
        "why": "Une herbe rase et un sol travaillé tiennent mieux le manteau neigeux. Un versant laissé en friche glisse plus facilement."
      }
    ]
  },

  {
    "id": "lalpage-vivant",
    "pillar": "vie-alpine",
    "name": "L'alpage vivant",
    "style": "sportif",
    "tier": "mission",
    "points": 30,
    "location_kind": "precise",
    "location_detail": "Un alpage encore en activité, en altitude, à rejoindre à pied",
    "branch": "les deux branches",
    "duration": "2 à 3 heures avec la marche",
    "brief": "Rejoignez à pied un alpage encore en activité. Observez le troupeau et les installations depuis une distance respectueuse, sans vous approcher des bêtes. Regardez comment l'eau arrive, où se fait la traite, où vit le berger. Puis répondez au quiz sur ce qui s'y passe aujourd'hui.",
    "savoir": "Un alpage en activité est une petite usine autonome. Eau captée, lait transformé sur place, fromage descendu à dos d'homme ou par piste. Tout cela tourne encore aujourd'hui, chaque été.",
    "proof": "photo_quiz",
    "photo_hint": "Une photo du groupe avec l'alpage en arrière plan. Gardez vos distances avec le troupeau.",
    "note_label": null,
    "quiz": [
      {
        "q": "Combien de fois par jour un troupeau laitier est il traditionnellement trait à l'alpage ?",
        "options": ["Deux fois, matin et soir", "Trois fois", "Seulement le matin", "Une seule fois à midi"],
        "answer": 0,
        "why": "Matin et soir, tous les jours de la saison, sans exception. C'est ce qui rend le métier si exigeant."
      },
      {
        "q": "À quoi servent les grands bacs en bois ou en béton qu'on trouve sur un alpage ?",
        "options": ["Ils amènent l'eau au troupeau, souvent par une conduite depuis une source", "Ils stockent le petit lait", "Ils servent à saler les fromages", "Ils servent à laver le linge des bergers"],
        "answer": 0,
        "why": "Une vache boit jusqu'à cent litres par jour en été. Sans eau amenée sur place, pas d'alpage possible."
      },
      {
        "q": "Pourquoi faut il garder ses distances avec un troupeau, surtout s'il y a des veaux ?",
        "options": ["Parce que les vaches transmettent des maladies aux humains", "Parce que le bruit fait tourner le lait", "Parce que le règlement du consortage l'interdit", "Parce que les mères protègent leurs veaux et peuvent charger"],
        "answer": 3,
        "why": "Une mère qui juge son veau menacé charge sans prévenir. Contourner largement, c'est la règle."
      },
      {
        "q": "Que fait un berger d'alpage de la majeure partie du lait produit l'été ?",
        "options": ["Il le transforme sur place en fromage et en beurre", "Il le vend directement aux promeneurs", "Il le redescend chaque jour au village en camion", "Il le donne aux veaux"],
        "answer": 0,
        "why": "Transformer sur place, c'est la seule façon de faire descendre la production sans la perdre."
      }
    ]
  },

  {
    "id": "le-vin-du-glacier",
    "pillar": "vie-alpine",
    "name": "Le vin du Glacier",
    "style": "culinaire",
    "tier": "experience",
    "points": 20,
    "location_kind": "typee",
    "location_detail": "Là où l'on sert ou raconte le vin du Glacier, à Grimentz en particulier",
    "branch": "les deux branches",
    "duration": "45 minutes",
    "brief": "Trouvez un endroit qui sert le vin du Glacier ou qui sait en parler, et faites vous raconter comment il se garde. Goûtez si vous pouvez. Notez ce que vous comprenez du système des tonneaux, qui ne se vident jamais.",
    "savoir": "Le vin du Glacier vient de la Rèze, un cépage très ancien du Valais. Les Anniviards cultivaient la vigne en plaine et montaient le vin au village avec eux : de là son nom. Les tonneaux, en mélèze, ne sont jamais vidés. Chaque printemps on complète le plus vieux avec celui qui le suit en âge, et ainsi de suite en cascade, comme la méthode solera. La Bourgeoisie de Grimentz entretient ainsi quatre tonneaux datés de 1886, 1888, 1934 et 1969, si bien qu'un verre servi aujourd'hui contient encore une trace de tous les millésimes précédents.",
    "proof": "photo_quiz",
    "photo_hint": "Une photo du groupe du moment avec le verre, la bouteille ou la cave qui raconte le vin du Glacier.",
    "note_label": "Ce qu'on vous a raconté, et le goût si vous avez pu goûter",
    "quiz": [
      {
        "q": "De quel cépage vient le vin du Glacier ?",
        "options": ["Le chasselas", "La Rèze", "La syrah", "Le pinot noir"],
        "answer": 1,
        "why": "La Rèze est un très vieux cépage valaisan, presque uniquement gardé pour ce vin là."
      },
      {
        "q": "Comment entretient on les tonneaux du vin du Glacier ?",
        "options": ["On ne les vide jamais, on complète le plus vieux avec le suivant", "On les descend en plaine chaque hiver", "On les vide et on les nettoie chaque automne", "On change de tonneau tous les cinq ans"],
        "answer": 0,
        "why": "C'est le principe du transvasage en cascade, proche de la méthode solera."
      },
      {
        "q": "En quel bois sont faits ces tonneaux ?",
        "options": ["En mélèze", "En chêne", "En châtaignier", "En acier"],
        "answer": 0,
        "why": "Le mélèze, très répandu en Valais, donne au vin son goût résineux si particulier."
      },
      {
        "q": "De quand date le plus ancien tonneau entretenu par la Bourgeoisie de Grimentz ?",
        "options": ["1886", "1789", "1969", "1934"],
        "answer": 0,
        "why": "Quatre tonneaux se suivent : 1886, 1888, 1934 et 1969."
      }
    ]
  },

  {
    "id": "les-salaisons-danniviers",
    "pillar": "vie-alpine",
    "name": "Les salaisons d'Anniviers",
    "style": "culinaire",
    "tier": "decouverte",
    "points": 10,
    "location_kind": "libre",
    "location_detail": "N'importe où dans la vallée, sur une assiette ou dans un commerce",
    "branch": "les deux branches",
    "duration": "20 minutes",
    "brief": "Mettez la main sur de la viande séchée, du lard ou du jambon cru de la vallée. Regardez de près la couleur, le grain, la façon dont la tranche se tient. Goûtez, et essayez de dire ce qui distingue une pièce séchée longtemps d'une pièce pressée.",
    "savoir": "La viande séchée du Valais IGP se fait uniquement avec du bœuf suisse. Les pièces sont frottées de sel, d'herbes et d'épices, puis suspendues et séchées à l'air de 5 à 16 semaines selon leur taille. Elles y perdent 40 à 50 pourcent de leur poids, ce qui concentre tout le goût. Le jambon cru du Valais IGP, lui, demande 6 à 10 semaines, jusqu'à ce qu'une fleur blanche apparaisse en surface. Cette tradition de séchage à l'air sec des vallées remonte au seizième siècle et figure au patrimoine culinaire suisse. À Vissoie, l'atelier des Salaisons d'Anniviers en produit plus de soixante dix tonnes par an.",
    "proof": "photo_quiz",
    "photo_hint": "Une photo de l'assiette ou de l'étal, avec le groupe du moment autour.",
    "note_label": "Ce que vous avez goûté, et ce que vous en pensez",
    "quiz": [
      {
        "q": "Avec quelle viande se fait la viande séchée du Valais IGP ?",
        "options": ["De la viande de chamois", "Du bœuf suisse uniquement", "Du porc et du bœuf mélangés", "Du cheval"],
        "answer": 1,
        "why": "Le cahier des charges IGP l'impose : du bœuf, et d'origine suisse."
      },
      {
        "q": "Combien de temps une pièce sèche t elle, selon sa taille ?",
        "options": ["Deux à trois jours", "Quelques heures au four", "Une année entière", "De 5 à 16 semaines"],
        "answer": 3,
        "why": "Le séchage se fait à l'air, lentement, et c'est ce temps long qui fait le goût."
      },
      {
        "q": "Que perd la viande pendant ce séchage ?",
        "options": ["Sa couleur, mais pas son poids", "Presque rien", "Un dixième de son poids", "Entre 40 et 50 pourcent de son poids"],
        "answer": 3,
        "why": "Près de la moitié du poids part en eau. Tout le reste se concentre."
      }
    ]
  },

  /* ============ PILIER 4. PATRIMOINE (7) ============ */

  {
    "id": "le-grenier-sur-pilotis",
    "pillar": "patrimoine",
    "name": "Le grenier sur pilotis",
    "style": "chill",
    "tier": "decouverte",
    "points": 10,
    "location_kind": "libre",
    "location_detail": "Dans n'importe quel village ou hameau de la vallée",
    "branch": "les deux branches",
    "duration": "15 minutes",
    "brief": "Trouvez un raccard ou un grenier monté sur pilotis, et regardez le de près. Les pilotis, les grosses dalles plates posées dessus, l'espace libre sous le plancher. Chaque détail répond à un problème précis.",
    "savoir": "Ils reposent sur des pilotis en bois coiffés de dalles de pierre rondes, un système ingénieux pour empêcher les rongeurs de grimper jusqu'aux réserves de grain, de pain de seigle et de viande séchée.",
    "proof": "photo_quiz",
    "photo_hint": "Une photo du groupe devant le grenier, avec les pilotis et les dalles bien visibles.",
    "note_label": null,
    "quiz": [
      {
        "q": "À quoi servent les dalles de pierre rondes posées au sommet des pilotis ?",
        "options": ["Marquer la propriété de la famille", "Empêcher les rongeurs de grimper jusqu'aux réserves", "Soutenir le poids de la toiture", "Évacuer l'eau de pluie"],
        "answer": 1,
        "why": "Une souris grimpe le long d'un pilotis, mais elle ne passe pas le rebord d'une dalle qui dépasse."
      },
      {
        "q": "Que stockait on dans ces greniers ?",
        "options": ["Les outils et les charrues", "Du grain, du pain de seigle et de la viande séchée", "Le vin de la famille", "Le foin pour l'hiver"],
        "answer": 1,
        "why": "Tout ce qui devait rester sec et à l'abri des bêtes. Le foin, lui, allait dans la grange."
      },
      {
        "q": "Pourquoi le bâtiment est il posé sur des pierres plutôt que directement au sol ?",
        "options": ["Pour laisser l'air circuler et éviter l'humidité et la pourriture", "Pour résister aux tremblements de terre", "Parce que le bois coûtait moins cher que la pierre", "Pour pouvoir le déplacer facilement"],
        "answer": 0,
        "why": "L'air qui passe sous le plancher garde le bois sec. Certains raccards tiennent debout depuis plus de trois siècles."
      },
      {
        "q": "Comment appelle t on en Valais ce grenier à céréales en bois sur pilotis ?",
        "options": ["Un bisse", "Un raccard", "Un mayen", "Un consortage"],
        "answer": 1,
        "why": "Le raccard est l'un des bâtiments les plus reconnaissables du Valais, et l'un des plus malins."
      }
    ]
  },

  {
    "id": "les-traces-du-passe",
    "pillar": "patrimoine",
    "name": "Les traces du passé",
    "style": "culturel",
    "tier": "experience",
    "points": 20,
    "location_kind": "precise",
    "location_detail": "Un lieu du village dont il existe une vue ancienne, place, église, pont ou rue principale",
    "branch": "les deux branches",
    "duration": "30 minutes",
    "brief": "Trouvez un endroit dont il existe une vue ancienne, sur un panneau d'information, une carte postale ou une photo ancienne affichée quelque part. Placez vous au même endroit que le photographe d'origine, et repérez trois éléments qui ont changé.",
    "savoir": "En 1910, 92 pourcent de la population active de la vallée travaillait dans l'agriculture, contre à peine 2 pourcent en 1990. Ce basculement se lit directement dans le paysage.",
    "proof": "photo_quiz",
    "photo_hint": "Votre photo prise depuis le même point de vue que la vue ancienne, si possible avec le groupe dedans.",
    "note_label": "Les trois éléments qui ont changé",
    "quiz": [
      {
        "q": "En 1910, quelle part de la population active du Val d'Anniviers travaillait dans l'agriculture ?",
        "options": ["45 pourcent", "8 pourcent", "92 pourcent", "20 pourcent"],
        "answer": 2,
        "why": "Presque tout le monde. Le village entier vivait du même calendrier agricole."
      },
      {
        "q": "Et en 1990 ?",
        "options": ["Encore 80 pourcent", "À peine 2 pourcent", "Environ 60 pourcent", "Environ 30 pourcent"],
        "answer": 1,
        "why": "De 92 à 2 pourcent en quatre vingts ans. Peu de sociétés ont changé aussi vite."
      },
      {
        "q": "Quel élément du paysage a le plus progressé dans les villages anniviards depuis les années 1950 ?",
        "options": ["Les surfaces de vigne en altitude", "Les champs de seigle", "La forêt et les constructions de villégiature, au détriment des prés cultivés", "Les pâturages de très haute altitude"],
        "answer": 2,
        "why": "Sur les vieilles photos, les versants sont pelés et cultivés jusqu'en haut. Aujourd'hui la forêt est remontée."
      }
    ]
  },

  {
    "id": "le-village-qui-a-change-de-vie",
    "pillar": "patrimoine",
    "name": "Le village qui a changé de vie",
    "style": "culturel",
    "tier": "experience",
    "points": 20,
    "location_kind": "typee",
    "location_detail": "Dans n'importe quel village de la vallée",
    "branch": "les deux branches",
    "duration": "30 minutes",
    "brief": "Dans un village, cherchez les traces des deux époques qui se superposent. Les bâtiments agricoles d'avant et les constructions touristiques d'après. Puis répondez au quiz.",
    "savoir": "Jusque dans les années 1950, la vie de villages comme Mission reposait presque entièrement sur l'élevage et l'agriculture. En 1910, 92 pourcent de la population active de la vallée travaillait dans l'agriculture, contre à peine 2 pourcent en 1990.",
    "proof": "photo_quiz",
    "photo_hint": "Une photo du groupe dans le village, si possible là où les deux époques se touchent.",
    "note_label": null,
    "quiz": [
      {
        "q": "Sur quoi reposait la vie d'un village comme Mission jusque dans les années 1950 ?",
        "options": ["Sur l'artisanat du bois vendu à l'étranger", "Presque entièrement sur l'élevage et l'agriculture", "Sur l'exploitation minière", "Sur le tourisme d'hiver"],
        "answer": 1,
        "why": "Chaque famille avait ses bêtes, ses prés et ses parcelles. Le village était une unité de production."
      },
      {
        "q": "Quelle activité a remplacé l'agriculture comme principale ressource de la vallée ?",
        "options": ["La pêche", "La sylviculture", "L'industrie chimique", "Le tourisme"],
        "answer": 3,
        "why": "Le tourisme a sauvé la vallée du dépeuplement total, tout en changeant profondément son visage."
      },
      {
        "q": "Comment appelle t on les habitations intermédiaires entre le village et l'alpage ?",
        "options": ["Les mayens", "Les bisses", "Les consortages", "Les raccards"],
        "answer": 0,
        "why": "On y passait au printemps en montant et en automne en descendant. Une étape, pas une résidence."
      },
      {
        "q": "Pourquoi les familles anniviardes déménageaient elles plusieurs fois par an ?",
        "options": ["Pour fuir les avalanches chaque hiver", "Parce que les maisons étaient louées à tour de rôle", "Pour éviter les impôts communaux", "Pour suivre l'herbe et les cultures selon l'altitude et la saison"],
        "answer": 3,
        "why": "Vigne en plaine, prés au village, alpage en haut. Il fallait être là où le travail était, et il se déplaçait avec la saison."
      }
    ]
  },

  {
    "id": "du-four-a-la-table",
    "pillar": "patrimoine",
    "name": "Du four à la table",
    "style": "culinaire",
    "tier": "experience",
    "points": 20,
    "location_kind": "typee",
    "location_detail": "Un ancien four à pain ou un lieu de production alimentaire de village",
    "branch": "les deux branches",
    "duration": "30 minutes",
    "brief": "Trouvez un ancien four à pain communal, un moulin ou un autre lieu où on produisait de la nourriture au village. Cherchez comment il fonctionnait et qui s'en servait.",
    "savoir": "Le four communal n'était allumé que quelques fois par an. Tout le village cuisait le même jour, et le pain de seigle devait ensuite tenir des mois.",
    "proof": "photo_quiz",
    "photo_hint": "Une photo du groupe devant le four ou le bâtiment trouvé.",
    "note_label": "Le lieu trouvé et à quoi il servait",
    "quiz": [
      {
        "q": "À quelle fréquence le four à pain communal était il traditionnellement allumé ?",
        "options": ["Une fois par semaine sans exception", "Uniquement pour les mariages", "Chaque matin", "Quelques fois par an seulement, et tout le village cuisait ensemble"],
        "answer": 3,
        "why": "Chauffer un four de pierre coûtait énormément de bois. On mutualisait, et on cuisait pour des mois."
      },
      {
        "q": "Pourquoi le pain de seigle valaisan est il dense et se conserve t il longtemps ?",
        "options": ["Parce qu'il est séché au soleil après cuisson", "Parce qu'il contient du miel", "Parce qu'on en cuisait de grandes quantités d'un coup, pour des mois", "Parce qu'il est cuit deux fois"],
        "answer": 2,
        "why": "Un pain peu hydraté et dense durcit au lieu de moisir. C'était une conserve, pas un pain du jour."
      },
      {
        "q": "Comment mangeait on un pain de seigle devenu très dur ?",
        "options": ["On le faisait bouillir", "On le râpait pour en faire de la farine", "On le coupait avec un coupe pain à lame fixe, ou on le trempait dans la soupe ou le lait", "On le jetait aux bêtes"],
        "answer": 2,
        "why": "Le coupe pain à lame fixe est un objet qu'on trouve dans presque toutes les vieilles cuisines valaisannes."
      }
    ]
  },

  {
    "id": "le-chemin-muletier",
    "pillar": "patrimoine",
    "name": "Le chemin muletier",
    "style": "sportif",
    "tier": "mission",
    "points": 30,
    "location_kind": "precise",
    "location_detail": "Un ancien chemin muletier reliant deux villages de la vallée",
    "branch": "les deux branches",
    "duration": "2 heures ou plus",
    "brief": "Reliez deux villages à pied par un ancien chemin muletier, pas par la route. Observez la largeur du chemin, les murs de soutènement, le dallage s'il en reste. Imaginez ce passage chargé de mulets.",
    "savoir": "Le nom Anniviers viendrait du latin évoquant les chemins de l'année, une allusion aux migrations saisonnières des habitants entre mayens d'altitude et coteaux de plaine.",
    "proof": "photo_quiz",
    "photo_hint": "Une photo du groupe sur le chemin, avec les ouvrages anciens si vous en voyez.",
    "note_label": "Les deux villages reliés",
    "quiz": [
      {
        "q": "D'où viendrait le nom Anniviers ?",
        "options": ["Du nom d'un glacier disparu", "D'un mot germanique signifiant vallée froide", "D'une expression latine évoquant les chemins de l'année", "Du nom d'un seigneur savoyard"],
        "answer": 2,
        "why": "Le nom même de la vallée parle de déplacement. C'est dire à quel point le mouvement la définissait."
      },
      {
        "q": "À quoi cette expression fait elle allusion ?",
        "options": ["Au pèlerinage annuel vers Sion", "À la foire du bétail de printemps", "Au passage des marchands italiens", "Aux migrations saisonnières des habitants entre mayens d'altitude et coteaux de plaine"],
        "answer": 3,
        "why": "Les Anniviards étaient des semi nomades. Une famille pouvait occuper quatre logements différents dans l'année."
      },
      {
        "q": "Avant les routes carrossables, comment transportait on marchandises et récoltes ?",
        "options": ["Par téléphérique", "Par flottage sur la Navizence", "À dos de mulet et à dos d'homme, sur des chemins étroits", "En chariot à quatre roues"],
        "answer": 2,
        "why": "Un mulet porte environ cent kilos. Tout ce qui entrait et sortait de la vallée passait par là."
      }
    ]
  },

  {
    "id": "le-hameau-qui-sest-vide",
    "pillar": "patrimoine",
    "name": "Le hameau qui s'est vidé",
    "style": "sportif",
    "tier": "mission",
    "points": 30,
    "location_kind": "precise",
    "location_detail": "Un hameau ou un mayen délaissé, repéré sur la carte ou indiqué sur place",
    "branch": "les deux branches",
    "duration": "2 à 3 heures avec la marche",
    "brief": "Rejoignez un hameau ou un mayen délaissé. Documentez ce qui reste debout et ce qui est tombé, puis cherchez pourquoi les gens sont partis. Regardez s'il y a encore de l'eau, un chemin, une trace d'entretien récent.",
    "savoir": "Ces lieux sont le futur que le jeu cherche à éviter. Ils sont déjà là, et ils datent d'il y a soixante ans.",
    "proof": "photo_quiz",
    "photo_hint": "Une photo du groupe dans le hameau abandonné.",
    "note_label": "Le lieu atteint, et pourquoi il a été abandonné selon vous",
    "quiz": [
      {
        "q": "Qu'est ce qu'un mayen ?",
        "options": ["Un abri de chasse", "Une grange au bord du Rhône", "Un alpage de très haute altitude", "Un groupe de bâtiments à mi hauteur, occupé au printemps et en automne"],
        "answer": 3,
        "why": "C'est l'étage intermédiaire, celui qui a le plus disparu. Trop haut pour la vie moderne, trop bas pour l'alpage."
      },
      {
        "q": "Pourquoi beaucoup de mayens ont ils été abandonnés ?",
        "options": ["Parce qu'ils ont été rachetés par l'État", "Parce qu'ils ont été détruits par des avalanches", "Parce que le travail agricole s'est concentré en plaine et que la main d'œuvre a quitté la vallée", "Parce que l'eau y a été coupée par les barrages"],
        "answer": 2,
        "why": "Avec la route et la voiture, il devenait absurde de déménager quatre fois par an. L'étage du milieu a perdu sa raison d'être."
      },
      {
        "q": "À quoi reconnaît on un bâtiment agricole abandonné depuis longtemps ?",
        "options": ["Murs fraîchement rejointoyés", "Présence d'un compteur électrique", "Volets peints en rouge", "Toiture effondrée, végétation installée à l'intérieur, murs encore debout"],
        "answer": 3,
        "why": "Le toit part toujours en premier. Une fois l'eau entrée, le reste suit en quelques décennies."
      }
    ]
  },

  {
    "id": "la-mine-de-cuivre-de-la-lee",
    "pillar": "patrimoine",
    "name": "La mine de cuivre de la Lée",
    "style": "sportif",
    "tier": "mission",
    "points": 30,
    "location_kind": "precise",
    "location_detail": "Secteur de la Lée, au dessus de Zinal, environ 1h30 de marche depuis le village",
    "branch": "vallée de Zinal",
    "duration": "3 heures ou plus depuis Zinal",
    "brief": "Montez au secteur de la Lée, au dessus de Zinal, et retrouvez les traces de la mine de cuivre : l'entrée de galerie, les déblais rejetés devant, les roches qui verdissent là où le cuivre affleure. Observez tout cela depuis l'extérieur, puis racontez ce que vous avez trouvé.",
    "alerte": "Les visites de la galerie sont suspendues à cause d'un risque de chutes de pierres. Ce défi se joue entièrement à l'extérieur. N'entrez jamais dans une galerie, même de quelques pas.",
    "savoir": "Le filon de la Lée a été découvert en 1832 au dessus de Zinal, puis exploré entre 1857 et 1859. La vraie exploitation n'a duré que de 1900 à 1902, sous la Société des Mines du Val d'Anniviers : la teneur en cuivre s'est révélée trop faible et tout s'est arrêté. Il reste 500 mètres de galeries creusées à la main dans la montagne, à 1937 mètres d'altitude. Sur la vingtaine de mines recensées en Anniviers, c'est la seule qui ait été remise en état, à partir de 1998, et la seule mine de cuivre de Suisse ouverte au public en temps normal.",
    "proof": "photo_quiz",
    "photo_hint": "Une photo du groupe du moment devant les traces de la mine, prise depuis l'extérieur.",
    "note_label": "Ce que vous avez trouvé sur place, et l'état des lieux aujourd'hui",
    "quiz": [
      {
        "q": "En quelle année le filon de cuivre de la Lée a t il été découvert ?",
        "options": ["1957", "1900", "1832", "1998"],
        "answer": 2,
        "why": "Découvert en 1832, il a pourtant attendu la fin du siècle pour être vraiment exploité."
      },
      {
        "q": "Pourquoi l'exploitation s'est elle arrêtée au bout de deux ans ?",
        "options": ["La guerre a vidé la vallée", "Le filon avait été entièrement extrait", "La teneur en cuivre était trop faible", "Un éboulement a tout enseveli"],
        "answer": 2,
        "why": "Le minerai était bien là, mais trop pauvre pour payer le travail. Tout a cessé en 1902."
      },
      {
        "q": "Quelle longueur de galeries a été creusée à la main dans la montagne ?",
        "options": ["500 mètres", "50 mètres", "20 kilomètres", "5 kilomètres"],
        "answer": 0,
        "why": "Cinq cents mètres, à 1937 mètres d'altitude, pour deux ans d'exploitation seulement."
      }
    ]
  },

  /* ============ PILIER 5. MEMOIRE ET TRANSMISSION (6) ============ */

  {
    "id": "les-mots-de-la-vallee",
    "pillar": "memoire",
    "name": "Les mots de la vallée",
    "style": "chill",
    "tier": "decouverte",
    "points": 10,
    "location_kind": "libre",
    "location_detail": "N'importe où dans la vallée",
    "branch": "les deux branches",
    "duration": "15 minutes",
    "brief": "Collectez plusieurs mots ou expressions en patois valaisan et leur signification. Demandez à quelqu'un, lisez un panneau, une carte, un menu. Essayez de les prononcer.",
    "savoir": "Le patois valaisan appartient au franco provençal, une langue romane distincte du français. Il a presque disparu de l'usage quotidien en deux générations.",
    "proof": "photo_quiz",
    "photo_hint": "Une photo du groupe, ou de l'endroit où vous avez trouvé ces mots.",
    "note_label": "Les mots collectés et leur sens",
    "quiz": [
      {
        "q": "À quelle famille de langues le patois valaisan appartient il ?",
        "options": ["Au rhéto roman des Grisons", "Au franco provençal, une langue romane distincte du français", "Au lombard italien", "Au germanique alémanique"],
        "answer": 1,
        "why": "Ce n'est pas du français déformé, c'est une autre langue romane, avec sa grammaire et son histoire."
      },
      {
        "q": "Que désigne le mot fendant en Valais ?",
        "options": ["Un outil pour fendre le bois", "Un vin blanc issu du chasselas", "Un fromage jeune", "Un raccourci de montagne"],
        "answer": 1,
        "why": "C'est le nom valaisan du chasselas. Le mot vient de ce que le grain se fend sous le doigt quand il est mûr."
      },
      {
        "q": "Pourquoi le patois a t il presque disparu de l'usage quotidien ?",
        "options": ["Parce qu'il n'a jamais été parlé que par les bergers", "Parce qu'il a été interdit par le Vatican", "Parce que les habitants sont partis en Italie", "Parce que l'école et l'administration ont imposé le français au vingtième siècle"],
        "answer": 3,
        "why": "Une génération l'a parlé à la maison, la suivante l'a comprise sans le parler, la troisième ne l'a plus entendu."
      }
    ]
  },

  {
    "id": "qui-se-souvient",
    "pillar": "memoire",
    "name": "Qui se souvient",
    "style": "culturel",
    "tier": "decouverte",
    "points": 10,
    "location_kind": "libre",
    "location_detail": "N'importe où dans la vallée, là où il y a des gens",
    "branch": "les deux branches",
    "duration": "20 minutes",
    "brief": "Reconstituez une histoire locale à partir de fragments. Un événement, un lieu, une tradition, une anecdote. Interrogez quelqu'un, lisez un panneau, croisez deux sources si vous pouvez.",
    "savoir": "L'essentiel de la vie quotidienne des villages de montagne ne se trouve dans aucune archive. Il se transmettait de bouche à oreille, et il se perd avec ceux qui le portent.",
    "proof": "photo_quiz",
    "photo_hint": "Une photo du groupe, avec la personne rencontrée si elle est d'accord, ou du lieu de l'histoire.",
    "note_label": "L'histoire que vous avez recueillie",
    "quiz": [
      {
        "q": "Qu'est ce qu'une source orale, en histoire locale ?",
        "options": ["Un document notarié ancien", "Une inscription gravée dans la pierre", "Une carte topographique annotée", "Un témoignage raconté par une personne, recueilli et conservé"],
        "answer": 3,
        "why": "C'est une vraie source historique, avec ses forces et ses limites. Elle dit ce qu'aucun document n'a noté."
      },
      {
        "q": "Pourquoi les archives écrites manquent elles souvent pour la vie quotidienne des villages de montagne ?",
        "options": ["Parce que le patois n'a pas d'alphabet", "Parce que l'essentiel se transmettait oralement et que peu de gens écrivaient", "Parce que tous les registres ont brûlé", "Parce que l'écriture était réservée au clergé dans toute l'Europe"],
        "answer": 1,
        "why": "On notait les actes, les ventes, les naissances. Pas la façon de faire le pain ni les histoires du soir."
      },
      {
        "q": "Que risque t on quand la dernière personne qui connaît une histoire disparaît sans l'avoir racontée ?",
        "options": ["L'histoire est perdue, même si le lieu existe toujours", "L'histoire se retrouve dans les archives cantonales", "Rien, car les bâtiments suffisent à la reconstituer", "Elle se transmet par les chansons"],
        "answer": 0,
        "why": "Le lieu reste, le sens part. C'est exactement ce que le jeu d'aujourd'hui essaie d'empêcher."
      }
    ]
  },

  {
    "id": "la-neige-davant",
    "pillar": "memoire",
    "name": "La neige d'avant",
    "style": "culturel",
    "tier": "experience",
    "points": 20,
    "location_kind": "libre",
    "location_detail": "Partout où vous croiserez des habitants, village, terrasse, commerce",
    "branch": "les deux branches",
    "duration": "30 minutes",
    "brief": "Trouvez un habitant plus âgé et demandez lui comment étaient la neige et les glaciers de son enfance, comparés à aujourd'hui. Jusqu'à quelle date la neige tenait, où descendait la langue du glacier, ce qui a changé. Écoutez vraiment, puis répondez au quiz.",
    "savoir": "Un témoignage qui couvre soixante ans vécus au même endroit est une donnée. Les scientifiques s'en servent pour recouper leurs mesures.",
    "proof": "photo_quiz",
    "photo_hint": "Une photo du groupe, avec la personne interrogée si elle accepte.",
    "note_label": "Ce que la personne vous a raconté",
    "quiz": [
      {
        "q": "En Suisse, comment l'enneigement moyen en dessous de 1500 mètres a t il évolué depuis les années 1970 ?",
        "options": ["Il a augmenté", "Il a nettement diminué, en durée comme en épaisseur", "Il a doublé puis diminué", "Il est resté stable"],
        "answer": 1,
        "why": "Moins de jours de neige au sol, et des couches plus minces. C'est l'un des signaux les plus nets du réchauffement en Suisse."
      },
      {
        "q": "Qu'appelle t on l'isotherme zéro degré ?",
        "options": ["La température moyenne annuelle d'un village", "L'altitude à laquelle la température atteint zéro degré dans l'atmosphère", "La profondeur du sol gelé", "La limite des arbres"],
        "answer": 1,
        "why": "C'est la frontière invisible entre la pluie et la neige. Sa hauteur décide de tout, en montagne."
      },
      {
        "q": "Cet isotherme est monté en altitude depuis un siècle. Quelle conséquence directe pour la montagne ?",
        "options": ["Les glaciers avancent plus vite", "La neige tient plus longtemps au printemps", "Il pleut désormais là où il neigeait, ce qui accélère la fonte", "Les torrents gèlent plus souvent"],
        "answer": 2,
        "why": "La pluie sur la neige la fait fondre bien plus vite que le soleil. Chaque épisode de pluie en altitude coûte cher au glacier."
      },
      {
        "q": "Pourquoi le témoignage d'un habitant âgé a t il une valeur pour comprendre le climat ?",
        "options": ["Parce qu'il remplace les relevés de température", "Parce qu'il couvre plusieurs décennies vécues au même endroit", "Parce qu'il est toujours plus précis qu'une mesure", "Parce qu'il porte sur toute la Suisse"],
        "answer": 1,
        "why": "Une personne qui a vu le même versant pendant soixante ans a une série d'observations que personne n'a notée ailleurs."
      }
    ]
  },

  {
    "id": "le-repas-de-fete",
    "pillar": "memoire",
    "name": "Le repas de fête",
    "style": "culinaire",
    "tier": "experience",
    "points": 20,
    "location_kind": "libre",
    "location_detail": "Partout où vous croiserez des habitants",
    "branch": "les deux branches",
    "duration": "30 minutes",
    "brief": "Demandez à un habitant son souvenir ou sa recette préférée d'un repas de fête traditionnel. Notez les détails, qui cuisinait, à quelle occasion, ce qui était rare et donc précieux.",
    "savoir": "Dans une économie de subsistance, un repas de fête se reconnaît à ce qui est rare. La viande, le sucre, le blanc de farine. Le reste, on en mangeait tous les jours.",
    "proof": "photo_quiz",
    "photo_hint": "Une photo du groupe, avec la personne ou le plat si possible.",
    "note_label": "La recette ou le souvenir recueilli",
    "quiz": [
      {
        "q": "Quel plat valaisan se compose de pommes de terre, de fromage fondu, de cornichons et d'oignons au vinaigre ?",
        "options": ["La raclette", "La brisolée", "La fondue moitié moitié", "Le papet vaudois"],
        "answer": 0,
        "why": "L'acidité des condiments équilibre le gras du fromage. Rien n'est là par hasard dans ce plat."
      },
      {
        "q": "Qu'est ce que la brisolée, fête d'automne valaisanne ?",
        "options": ["Un repas de châtaignes grillées accompagné de fromage et de vin nouveau", "Un ragoût de viande séchée", "Une soupe de seigle de Noël", "Un gâteau de mariage à étages"],
        "answer": 0,
        "why": "Châtaignes grillées, fromage, raisin, vin nouveau. Une fête qui célèbre la fin des récoltes."
      },
      {
        "q": "Que servait on traditionnellement lors des grandes fêtes de village ?",
        "options": ["Du riz au safran uniquement", "De la viande, rare et réservée aux occasions, avec du pain de seigle et du vin", "Du poisson du lac chaque dimanche", "Des pâtisseries à la crème"],
        "answer": 1,
        "why": "On tuait une bête pour une occasion. Le reste de l'année, c'était le fromage et le pain qui nourrissaient."
      }
    ]
  },

  {
    "id": "lobjet-qui-raconte",
    "pillar": "memoire",
    "name": "L'objet qui raconte",
    "style": "sportif",
    "tier": "mission",
    "points": 30,
    "location_kind": "precise",
    "location_detail": "Un musée local, une collection de village, ou chez une famille",
    "branch": "les deux branches",
    "duration": "1 à 2 heures",
    "brief": "Trouvez un objet ancien et faites raconter son histoire complète. À quoi il servait, qui l'utilisait, pourquoi il a cette forme, et pourquoi on ne s'en sert plus. Allez jusqu'au bout de l'histoire, pas seulement le nom de l'objet.",
    "savoir": "Un objet usé porte la trace des gestes de celui qui l'a utilisé. C'est souvent la seule chose qui reste d'un métier disparu.",
    "proof": "photo_quiz",
    "photo_hint": "Une photo de l'objet, et une du groupe avec lui si c'est possible.",
    "note_label": "L'objet trouvé et son histoire complète",
    "quiz": [
      {
        "q": "À quoi servait une channe en étain, objet valaisan emblématique ?",
        "options": ["À mesurer le lait à l'alpage", "À servir le vin", "À conserver le sel", "À fondre le plomb des toitures"],
        "answer": 1,
        "why": "La channe est devenue un symbole du Valais. On l'offre encore aujourd'hui comme trophée ou cadeau d'honneur."
      },
      {
        "q": "À quoi servait un coupe pain à lame fixe dans une maison valaisanne ?",
        "options": ["À tailler la vigne", "À découper la viande séchée en fines lamelles", "À fendre le bois d'allumage", "À trancher le pain de seigle devenu très dur"],
        "answer": 3,
        "why": "Un pain de seigle de trois mois ne se coupe pas au couteau de cuisine. Il fallait un levier et une lame fixe."
      },
      {
        "q": "Pourquoi les outils agricoles anciens portent ils souvent des initiales ou une date gravée ?",
        "options": ["Parce que la loi l'imposait", "Pour indiquer la taille de l'objet", "Pour porter chance", "Pour identifier la famille propriétaire, car beaucoup d'objets étaient partagés ou prêtés"],
        "answer": 3,
        "why": "Dans un village où tout se prête, marquer son outil évite bien des discussions."
      }
    ]
  },

  {
    "id": "le-village-qui-a-attendu-la-route",
    "pillar": "memoire",
    "name": "Le village qui a attendu la route",
    "style": "sportif",
    "tier": "mission",
    "points": 30,
    "location_kind": "precise",
    "location_detail": "Un village longtemps resté isolé, au fond de la vallée ou sur un versant",
    "branch": "les deux branches",
    "duration": "2 heures ou plus",
    "brief": "Rendez vous dans un village longtemps resté isolé, et cherchez comment cet isolement a façonné sa vie. Regardez la densité du bâti, la présence ou l'absence de bâtiments publics, la façon dont le village s'est organisé pour être autonome.",
    "savoir": "Vissoie n'a été relié à la vallée du Rhône par une route carrossable qu'en 1863. La route vers Zinal, au fond de la vallée, n'a été ouverte qu'en 1951.",
    "proof": "photo_quiz",
    "photo_hint": "Une photo du groupe dans le village.",
    "note_label": "Le village visité et ce que vous avez compris de son isolement",
    "quiz": [
      {
        "q": "En quelle année Vissoie a t il été relié à la vallée du Rhône par une route carrossable ?",
        "options": ["1863", "1789", "1951", "1905"],
        "answer": 0,
        "why": "Avant 1863, tout montait et descendait à pied ou à dos de mulet. La vallée était un monde à part."
      },
      {
        "q": "En quelle année la route vers Zinal, au fond de la vallée, a t elle été ouverte ?",
        "options": ["1951", "1975", "1863", "1920"],
        "answer": 0,
        "why": "1951. Des gens vivants aujourd'hui se souviennent de Zinal sans route."
      },
      {
        "q": "Quelle conséquence cet isolement a t il eue sur la vie de la vallée ?",
        "options": ["Le commerce du vin y était interdit", "Les villages devaient produire eux mêmes presque tout ce dont ils avaient besoin", "La vallée s'est dépeuplée dès le Moyen Âge", "Le patois a disparu très tôt"],
        "answer": 1,
        "why": "Pain, fromage, viande, bois, laine, outils. Tout se faisait sur place, parce que rien n'arrivait facilement."
      },
      {
        "q": "Comment les habitants rejoignaient ils la plaine avant la route ?",
        "options": ["Par un tunnel creusé au dix huitième siècle", "À pied ou à dos de mulet, par des chemins muletiers", "En barque sur la Navizence", "Par un train à crémaillère"],
        "answer": 1,
        "why": "Plusieurs heures de marche pour descendre, bien plus pour remonter chargé. Chaque voyage se méritait."
      }
    ]
  }

];

export const CHALLENGE_BY_ID = Object.fromEntries(CHALLENGES.map((c) => [c.id, c]));

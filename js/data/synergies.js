// Les cinq synergies cachees. Jamais annoncees aux joueurs a l'avance.
// Une synergie se declenche pour une personne des qu'elle a personnellement
// complete un defi du groupe A et un defi du groupe B.
// Bonus : 10 points personnels, 5 points sur chacune des deux jauges concernees.
export const SYNERGIES = /* json */ [
  {
    "id": "temoin-du-glacier",
    "name": "Le témoin du glacier",
    "pillar_a": "montagne",
    "pillar_b": "memoire",
    "triggers_a": ["glace-en-recul", "glacier-recule-mesure"],
    "triggers_b": ["la-neige-davant"],
    "personal_bonus": 10,
    "gauge_bonus": 5,
    "sort_order": 1,
    "story": "Vous avez découvert quelque chose. Ce que l'habitant interrogé vous a raconté correspond exactement à ce que vous avez vu sur le terrain. La neige qui recouvrait tout jusqu'en juin dans son enfance, la langue du glacier qui descendait bien plus bas. Ce ne sont pas des souvenirs vagues, ce sont des données. Les scientifiques appellent ça une validation croisée. Le témoignage humain confirme la mesure physique.",
    "bonus_learning": "Le glacier loss day, ce jour où un glacier suisse a déjà perdu toute la neige accumulée l'hiver précédent, arrive chaque année un peu plus tôt."
  },
  {
    "id": "la-vie-dautrefois",
    "name": "La vie d'autrefois",
    "pillar_a": "vie-alpine",
    "pillar_b": "patrimoine",
    "triggers_a": ["de-lherbe-au-fromage", "degustation-dalpage"],
    "triggers_b": ["le-grenier-sur-pilotis"],
    "personal_bonus": 10,
    "gauge_bonus": 5,
    "sort_order": 2,
    "story": "Vous avez découvert quelque chose. Le fromage que vous avez goûté et le grenier que vous avez observé ne sont pas deux choses séparées. Le lait montait à l'alpage, le fromage redescendait au village, séchait et se conservait dans ces greniers surélevés justement pour échapper aux rongeurs. Toute une chaîne. La bête, l'herbe, le lait, la pierre, le bois, la famille. Un seul système de vie où rien n'était isolé.",
    "bonus_learning": "Le rythme nomade qui a donné son nom à la vallée, les Anniviards montaient et descendaient sans cesse entre mayens et plaine."
  },
  {
    "id": "le-fragment-retrouve",
    "name": "Le fragment retrouvé",
    "pillar_a": "memoire",
    "pillar_b": "patrimoine",
    "triggers_a": ["lobjet-qui-raconte", "qui-se-souvient"],
    "triggers_b": ["les-traces-du-passe"],
    "personal_bonus": 10,
    "gauge_bonus": 5,
    "sort_order": 3,
    "story": "Vous avez découvert quelque chose. L'objet retrouvé et le lieu comparé racontent en fait la même histoire, vue sous deux angles différents. L'application assemble les deux fragments et révèle un court récit complet, un vrai moment du passé de la vallée reconstitué grâce à vous.",
    "bonus_learning": "Cette synergie est prioritaire pour l'album souvenir final. Elle génère une page dédiée avec la photo de l'objet, le lieu comparé et le récit assemblé."
  },
  {
    "id": "le-pari-du-berger",
    "name": "Le pari du berger",
    "pillar_a": "eau",
    "pillar_b": "vie-alpine",
    "triggers_a": ["mission-secheresse"],
    "triggers_b": ["le-rythme-de-la-transhumance"],
    "personal_bonus": 10,
    "gauge_bonus": 5,
    "sort_order": 4,
    "story": "Vous avez découvert quelque chose. Vous avez dû arbitrer entre plusieurs usages de l'eau. Les bergers font ce même arbitrage chaque année, en vrai. Monter les bêtes trop tôt, et il n'y a pas assez d'herbe ni d'eau en altitude. Monter trop tard, et la belle saison est gâchée. Un pari qui devient chaque année plus difficile avec un enneigement plus faible et plus tardif.",
    "bonus_learning": null
  },
  {
    "id": "la-memoire-de-la-glace",
    "name": "La mémoire de la glace",
    "pillar_a": "eau",
    "pillar_b": "montagne",
    "triggers_a": ["ou-va-leau", "leau-des-glaciers-energie"],
    "triggers_b": ["glacier-recule-mesure", "le-glacier-de-lautre-cote"],
    "personal_bonus": 10,
    "gauge_bonus": 5,
    "sort_order": 5,
    "story": "Vous avez découvert quelque chose. L'eau qui coule dans les bisses, qui turbine dans le barrage de Moiry, qui irrigue les prairies depuis sept siècles, c'est la même eau que vous avez vue naître, ou presque, là haut près du glacier. Le glacier n'est pas juste un décor spectaculaire. C'est le château d'eau de toute la vallée. Et il se vide.",
    "bonus_learning": null
  }
];

export const SYNERGY_BY_ID = Object.fromEntries(SYNERGIES.map((s) => [s.id, s]));

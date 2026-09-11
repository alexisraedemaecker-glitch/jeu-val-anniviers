// Les cinq piliers. Source de verite partagee avec le seed SQL.
export const PILLARS = /* json */ [
  {
    "id": "montagne",
    "name": "Montagne et Glaciers",
    "short": "Montagne",
    "max_points": 200,
    "sort_order": 1,
    "color": "#4a7fb5",
    "icon": "⛰",
    "blurb": "Relief, sommets, glaciers, faune et flore alpine."
  },
  {
    "id": "eau",
    "name": "Eau",
    "short": "Eau",
    "max_points": 200,
    "sort_order": 2,
    "color": "#2f9e9e",
    "icon": "💧",
    "blurb": "Torrents, bisses, irrigation, barrages, gestion de l'eau."
  },
  {
    "id": "vie-alpine",
    "name": "Vie Alpine",
    "short": "Vie Alpine",
    "max_points": 200,
    "sort_order": 3,
    "color": "#6f9e4a",
    "icon": "🐄",
    "blurb": "Alpages, elevage, fromage, transhumance."
  },
  {
    "id": "patrimoine",
    "name": "Patrimoine",
    "short": "Patrimoine",
    "max_points": 200,
    "sort_order": 4,
    "color": "#b5804a",
    "icon": "🏚",
    "blurb": "Villages, architecture, batiments, savoir faire."
  },
  {
    "id": "memoire",
    "name": "Mémoire et Transmission",
    "short": "Mémoire",
    "max_points": 200,
    "sort_order": 5,
    "color": "#9b6fb0",
    "icon": "🕯",
    "blurb": "Histoires, traditions, langue, personnes."
  }
];

export const STYLES = [
  { id: "chill", label: "Chill", icon: "🍃" },
  { id: "culturel", label: "Culturel", icon: "📚" },
  { id: "culinaire", label: "Culinaire", icon: "🧀" },
  { id: "sportif", label: "Sportif", icon: "🥾" }
];

export const TIERS = {
  "decouverte": { label: "Découverte", points: 10 },
  "experience": { label: "Expérience", points: 20 },
  "mission": { label: "Mission majeure", points: 30 }
};

export const PILLAR_BY_ID = Object.fromEntries(PILLARS.map((p) => [p.id, p]));
export const STYLE_BY_ID = Object.fromEntries(STYLES.map((s) => [s.id, s]));

// Conditions de victoire collective
export const VICTORY = { global_target: 700, global_max: 1000, pillar_floor: 40 };

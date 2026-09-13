// GENERE AUTOMATIQUEMENT par tools/gen_vallee.py, ne pas editer.
//
// Illustration evolutive de la vallee. Le palier affiche depend du
// pourcentage de progression collective, calcule exactement comme la
// condition de victoire : somme des cinq jauges divisee par leur
// maximum cumule.
export const PALIERS_VALLEE = [
  {
    "seuil": 0,
    "src": "assets/vallee/vallee-00.jpg",
    "src_small": "assets/vallee/vallee-00-small.jpg",
    "legende": "La vallée de 2056 si rien n'est fait"
  },
  {
    "seuil": 20,
    "src": "assets/vallee/vallee-20.jpg",
    "src_small": "assets/vallee/vallee-20-small.jpg",
    "legende": "Les premiers signes de retour"
  },
  {
    "seuil": 40,
    "src": "assets/vallee/vallee-40.jpg",
    "src_small": "assets/vallee/vallee-40-small.jpg",
    "legende": "La vie revient doucement"
  },
  {
    "seuil": 60,
    "src": "assets/vallee/vallee-60.jpg",
    "src_small": "assets/vallee/vallee-60-small.jpg",
    "legende": "Les alpages se repeuplent"
  },
  {
    "seuil": 80,
    "src": "assets/vallee/vallee-80.jpg",
    "src_small": "assets/vallee/vallee-80-small.jpg",
    "legende": "La vallée reprend ses couleurs"
  },
  {
    "seuil": 95,
    "src": "assets/vallee/vallee-100.jpg",
    "src_small": "assets/vallee/vallee-100-small.jpg",
    "legende": "La vallée sauvée"
  }
];

/** Palier correspondant a un pourcentage de progression. */
export function palierVallee(pourcent) {
  const p = Math.max(0, Math.min(100, Number(pourcent) || 0));
  let choisi = PALIERS_VALLEE[0];
  for (const pal of PALIERS_VALLEE) {
    if (p >= pal.seuil) choisi = pal;
  }
  return choisi;
}

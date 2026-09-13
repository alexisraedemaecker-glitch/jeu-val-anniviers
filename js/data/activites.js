// Contenu de l'onglet Activités.
//
// Tout ce qui est chiffré ici vient d'une source vérifiable :
//   - randonnées : calculées depuis vos fichiers GPX (tools/gpx.py)
//   - temps de route : calculés sur le réseau routier réel depuis Chandolin
//   - temps en transports : horaire officiel suisse, samedi matin
//   - horaires de remontées : site officiel du Val d'Anniviers
//   - restaurants : annuaire suisse search.ch
// Chaque fiche porte un lien vers sa source, pour vérifier avant de partir.

export const CHANDOLIN = {
  nom: "Chandolin",
  altitude: 1936,
  lat: 46.25213,
  lon: 7.59699,
  station: "8501755",
  station_nom: "Chandolin, poste"
};

export const CATEGORIES = [
  { id: "sportif", label: "Sportif", icon: "🥾", titre: "Les randonnées" },
  { id: "culinaire", label: "Culinaire", icon: "🧀", titre: "Où manger" },
  { id: "culturel", label: "Culturel", icon: "📚", titre: "À voir dans la vallée" },
  { id: "chill", label: "Chill", icon: "🍃", titre: "Se poser" }
];

// ---------------------------------------------------------- remontées

export const REMONTEES = {
  "funiculaire-st-luc": {
    nom: "Funiculaire Saint-Luc — Tignousa",
    saison: "Du 23 mai au 1er novembre 2026",
    horaire: "Tous les jours, 8h à 17h, une course toutes les 30 minutes",
    ouvert_samedi: true,
    lien: "https://www.valdanniviers.ch/fr/Z15374/horaires-st-luc-chandolin"
  },
  "telesiege-tsape": {
    nom: "Télésiège du Tsapé, à Chandolin",
    saison: "Du 24 août au 21 septembre 2026",
    horaire: "Du jeudi au lundi seulement, 9h à 17h. Fermé mardi et mercredi",
    ouvert_samedi: true,
    alerte:
      "Ce télésiège ferme pour la saison le 21 septembre. Le week end du jeu est l'un des derniers.",
    lien: "https://www.valdanniviers.ch/fr/Z15374/horaires-st-luc-chandolin"
  },
  "telecabine-zinal": {
    nom: "Télécabine Zinal — Sorebois — Espace Weisshorn",
    saison: "Du 27 juin au 25 octobre 2026",
    horaire: "Tous les jours, 8h30 à 16h00. Dernière descente à 16h30",
    ouvert_samedi: true,
    lien: "https://www.valdanniviers.ch/fr/Z15372/horaires-rmgz"
  },
  "telepherique-grimentz": {
    nom: "Téléphérique Grimentz — Espace Weisshorn",
    saison: "Du 27 juin au 25 octobre 2026",
    horaire: "Tous les jours, 8h30 à 16h00, départ toutes les 15 minutes. Dernière descente à 16h30",
    ouvert_samedi: true,
    lien: "https://www.valdanniviers.ch/fr/Z15372/horaires-rmgz"
  },
  "telecabine-bendolla": {
    nom: "Télécabine Grimentz — Bendolla",
    saison: "Du 27 juin au 25 octobre 2026",
    horaire: "8h30 à 16h00. Fermée le lundi et le mardi depuis le 31 août",
    ouvert_samedi: true,
    lien: "https://www.valdanniviers.ch/fr/Z15372/horaires-rmgz"
  }
};

// ---------------------------------------------------- accès aux départs

// minutes : temps de trajet réel depuis Chandolin, calculé sur le réseau
// routier. station : arrêt de l'horaire suisse, pour afficher les
// correspondances en direct dans l'application.
export const ACCES = {
  "tsape": {
    lieu: "Sommet du télésiège du Tsapé",
    voiture: { minutes: 1, km: 0.8, note: "Le départ du télésiège est à Chandolin même" },
    tp: { station: "8530146", minutes: 5, note: "À pied depuis le centre du village" },
    remontee: "telesiege-tsape"
  },
  "cabane-illhorn": {
    lieu: "Cabane Illhorn, au dessus de Chandolin",
    voiture: { minutes: 1, km: 0.8, note: "Puis environ 45 minutes de montée à pied depuis le village" },
    tp: { station: "8501755", minutes: 0, note: "Vous y êtes déjà, il ne reste qu'à monter" },
    remontee: "telesiege-tsape",
    remontee_note: "Le télésiège du Tsapé évite la montée et vous dépose plus haut."
  },
  "st-luc-funiculaire": {
    lieu: "Départ du funiculaire, à Saint-Luc",
    voiture: { minutes: 7, km: 4.9 },
    tp: { station: "8501779", minutes: 15, note: "Bus 454 direct, sans changement" },
    remontee: "funiculaire-st-luc"
  },
  "le-prillet": {
    lieu: "Le Prillet, sur la route du funiculaire à Saint-Luc",
    voiture: { minutes: 13, km: 7.2 },
    tp: { station: "8501779", minutes: 15, note: "Bus 454 jusqu'à Saint-Luc, puis un peu de marche" }
  },
  "grimentz-bendolla": {
    lieu: "Départ de la télécabine, à Grimentz",
    voiture: { minutes: 25, km: 17.6 },
    tp: { station: "8570949", minutes: 51, note: "Bus 454 puis 452, un changement à Vissoie" },
    remontee: "telecabine-bendolla"
  },
  "grimentz-telepherique": {
    lieu: "Départ du téléphérique, à Grimentz",
    voiture: { minutes: 25, km: 17.6 },
    tp: { station: "8570949", minutes: 51, note: "Bus 454 puis 452, un changement à Vissoie" },
    remontee: "telepherique-grimentz"
  },
  "zinal": {
    lieu: "Zinal, au fond de la vallée",
    voiture: { minutes: 26, km: 18.3 },
    tp: { station: "8501791", minutes: 52, note: "Bus 454 puis 453, un changement à Vissoie" }
  },
  "zinal-telecabine": {
    lieu: "Départ de la télécabine, à Zinal",
    voiture: { minutes: 26, km: 18.3 },
    tp: { station: "8501791", minutes: 52, note: "Bus 454 puis 453, un changement à Vissoie" },
    remontee: "telecabine-zinal"
  },
  "barrage-moiry": {
    lieu: "Barrage de Moiry, au bout de la route",
    voiture: { minutes: 32, km: 25.2, note: "Parking au pied du barrage" },
    tp: { station: "8501738", minutes: 75, note: "Bus 454 puis 452. Attention, peu de courses par jour" }
  },
  "moiry-glacier": {
    lieu: "Parking du glacier de Moiry, terminus de la route",
    voiture: { minutes: 38, km: 29.1, note: "La route se termine là, au dessus du lac" },
    tp: { station: "8581942", minutes: 87, note: "Bus 454, 452 puis 455. Vérifiez bien le dernier retour" }
  }
};

// ------------------------------------------------- retours des traversées

// Une traversée ne ramène pas là où on s'est garé. Pour chacune, voici le
// trajet de retour réel, avec le dernier bus relevé dans l'horaire officiel.
export const RETOURS = {
  "espace-weisshorn-cabane-du-petit-mountet-zinal": {
    depuis: "Zinal",
    vers: "Grimentz, où vous avez laissé la voiture",
    minutes: 50,
    station_de: "8501791",
    station_a: "8570949",
    dernier: "Dernier bus de Zinal vers 19h20",
    texte:
      "Vous partez de Grimentz par le téléphérique et vous arrivez à Zinal, dans l'autre branche de la vallée. Comptez environ 50 minutes de bus pour revenir à Grimentz, avec un changement à Vissoie."
  },
  "espace-weisshorn-corne-de-sorebois-lac-de-chateaupre": {
    depuis: "Parking du glacier de Moiry",
    vers: "Grimentz, où vous avez laissé la voiture",
    minutes: 25,
    station_de: "8581942",
    station_a: "8570949",
    dernier: "Dernier bus du parking du glacier à 17h12",
    alerte:
      "C'est la traversée la plus exposée. Le dernier bus du parking du glacier part à 17h12, et le suivant est le lendemain matin. Ratez le et vous êtes à 29 kilomètres de Chandolin sans transport.",
    texte:
      "Vous partez de Grimentz par le téléphérique et vous arrivez au bout de la route du Val de Moiry, à cinq kilomètres à vol d'oiseau du départ. Le plus sûr est de laisser une voiture au parking du glacier avant de monter."
  },
  "tignousa-hotel-weisshorn-zinal": {
    depuis: "Zinal",
    vers: "Saint-Luc, au pied du funiculaire",
    minutes: 40,
    station_de: "8501791",
    station_a: "8501779",
    dernier: "Dernier bus de Zinal vers 19h20",
    texte:
      "La plus longue traversée de la sélection, dix kilomètres à vol d'oiseau entre le départ et l'arrivée. Comptez 40 à 60 minutes de bus pour revenir à Saint-Luc, avec un changement à Vissoie."
  },
  "chandolin-hotel-weisshorn-saint-luc": {
    depuis: "Saint-Luc",
    vers: "Chandolin",
    minutes: 15,
    station_de: "8501779",
    station_a: "8501755",
    dernier: "Bus jusqu'en début de soirée",
    texte:
      "La traversée la plus simple à gérer. Le bus 454 relie Saint-Luc à Chandolin en un quart d'heure, sans changement, et il y en a régulièrement jusqu'en début de soirée."
  },
  "tsape-sommet-de-l-illhorn-cabane-illhorn": {
    depuis: "Cabane Illhorn",
    vers: "Chandolin",
    minutes: null,
    texte:
      "Vous montez par le télésiège et vous redescendez à pied sur la Cabane Illhorn, puis sur le village. Aucun transport à prévoir, environ 45 minutes de descente entre la cabane et Chandolin."
  }
};

// ------------------------------------------------------------ randonnées

// Les chiffres viennent tous du fichier GPX, calculés par tools/gpx.py.
// Les durées suivent la méthode des panneaux suisses, marche seule, sans
// les pauses. Comptez large.
export const RANDOS = [
  {
    id: "tsape-sommet-de-l-illhorn-cabane-illhorn",
    nom: "Le Tsapé, sommet de l'Illhorn, Cabane Illhorn",
    acces: "tsape",
    arrivee: "Cabane Illhorn, puis Chandolin à pied",
    resume:
      "La plus courte de la sélection, et celle qui demande le moins d'organisation. Le télésiège fait le gros du travail, vous montez au sommet de l'Illhorn, et vous redescendez sur la Cabane Illhorn pour y manger. Vue sur toute la vallée du Rhône d'un côté, sur la Couronne de l'autre.",
    conseil:
      "Le sommet de l'Illhorn est le point de vue qui domine Chandolin. Parfait pour le défi Panorama nommé."
  },
  {
    id: "espace-weisshorn-corne-de-sorebois-lac-de-chateaupre",
    nom: "Espace Weisshorn, Corne de Sorebois, Lac de Chateaupré",
    acces: "grimentz-telepherique",
    arrivee: "Parking du glacier de Moiry",
    resume:
      "Une traversée haute, presque tout en descente, entre le sommet du téléphérique et le lac au pied du glacier de Moiry. On passe la Corne de Sorebois et on bascule sur le Val de Moiry.",
    conseil:
      "Attention, vous n'arrivez pas là où vous êtes partis. Prévoyez une voiture au parking du glacier, ou vérifiez les derniers bus, ils sont rares."
  },
  {
    id: "cabane-illhorn-pas-de-l-illsee-lac-noir-tsape",
    nom: "Cabane Illhorn, Pas de l'Illsee, Lac Noir, Le Tsapé",
    acces: "cabane-illhorn",
    arrivee: "Retour à la Cabane Illhorn",
    resume:
      "Une boucle au dessus de Chandolin, par le Pas de l'Illsee et les petits lacs de l'autre versant. On passe de la vue sur la Couronne à la vue sur la vallée du Rhône, et on redescend par le Tsapé.",
    conseil:
      "Tout se fait depuis Chandolin, sans voiture ni transport. C'est la boucle la plus pratique du week end."
  },
  {
    id: "lac-de-chateaupre-cabane-de-moiry-a-r",
    coup_de_coeur: true,
    nom: "Lac de Chateaupré, Cabane de Moiry, aller et retour",
    acces: "moiry-glacier",
    arrivee: "Retour au point de départ",
    resume:
      "Le grand classique du Val de Moiry, et le plus court chemin pour aller voir le glacier de près. On longe la moraine et on monte à la cabane, posée face à la langue de glace.",
    conseil:
      "C'est la sortie idéale pour le défi Le glacier qui recule, mesuré. Les moraines y sont spectaculaires et lisibles."
  },
  {
    id: "espace-weisshorn-cabane-du-petit-mountet-zinal",
    nom: "Espace Weisshorn, Cabane du Petit Mountet, Zinal",
    acces: "grimentz-telepherique",
    arrivee: "Zinal",
    resume:
      "Une très longue descente depuis 2650 mètres jusqu'au fond de la vallée de Zinal, avec un arrêt possible à la Cabane du Petit Mountet. Peu de montée, mais les genoux travaillent.",
    conseil:
      "On peut aussi partir depuis Zinal par la télécabine, ce qui évite d'avoir à revenir chercher une voiture à Grimentz."
  },
  {
    id: "chandolin-hotel-weisshorn-saint-luc",
    nom: "Chandolin, Hôtel Weisshorn, Saint-Luc",
    acces: "cabane-illhorn",
    arrivee: "Saint-Luc",
    resume:
      "Le grand balcon d'Anniviers, de Chandolin à Saint-Luc en passant devant l'Hôtel Weisshorn. Un sentier de traversée presque toujours à la même altitude, avec la Couronne Impériale en face pendant des heures.",
    conseil:
      "Retour de Saint-Luc à Chandolin en bus 454, un quart d'heure. L'Hôtel Weisshorn, bâti en 1882, est un arrêt en soi."
  },
  {
    id: "tignousa-hotel-weisshorn-zinal",
    nom: "Tignousa, Hôtel Weisshorn, Zinal",
    acces: "st-luc-funiculaire",
    arrivee: "Zinal",
    resume:
      "La grande traversée du balcon, de Tignousa jusqu'au fond de la vallée. C'est la partie la plus connue du tour, celle qui longe la Couronne Impériale du début à la fin.",
    conseil:
      "Le funiculaire part toutes les 30 minutes dès 8h. Partez tôt, la descente finale sur Zinal est longue."
  },
  {
    id: "bendolla-cabane-des-becs-de-bosson",
    nom: "Bendolla, Cabane des Becs de Bosson",
    acces: "grimentz-bendolla",
    arrivee: "Retour à Bendolla",
    resume:
      "Une boucle depuis le haut de la télécabine de Grimentz vers la cabane des Becs de Bosson, le point le plus haut de cette sélection accessible sans être alpiniste.",
    conseil: "La télécabine de Bendolla est fermée le lundi et le mardi depuis fin août."
  },
  {
    id: "barrage-de-moiry-cabane-de-moiry-ar",
    nom: "Barrage de Moiry, Cabane de Moiry, aller et retour",
    acces: "barrage-moiry",
    arrivee: "Retour au barrage",
    resume:
      "La version longue de la montée à la cabane, au départ du barrage. On longe tout le lac avant d'attaquer la moraine. Deux défis d'un coup, le barrage et le glacier.",
    conseil:
      "Si la journée vous semble trop longue, montez en voiture jusqu'au parking du glacier et faites la version courte."
  },
  {
    id: "zinal-roc-de-la-vache-cabane-du-petit-mountet",
    nom: "Zinal, Roc de la Vache, Cabane du Petit Mountet",
    acces: "zinal",
    arrivee: "Retour à Zinal",
    resume:
      "Une belle boucle au dessus de Zinal, par le Roc de la Vache, avec retour par la Cabane du Petit Mountet. Du dénivelé, mais rien de technique.",
    conseil: "Le Petit Mountet sert à manger, c'est un bon objectif de mi parcours."
  },
  {
    id: "le-prillet-le-touno-hotel-weisshorn",
    nom: "Le Prillet, Le Touno, Hôtel Weisshorn",
    acces: "le-prillet",
    arrivee: "Retour au Prillet",
    resume:
      "La montée au Touno, un sommet à près de 3000 mètres qu'on atteint sans matériel, avec un retour par l'Hôtel Weisshorn. Le panorama le plus large de la sélection.",
    conseil: "Grosse journée. Partez tôt et emportez de quoi boire, il n'y a pas d'eau en chemin."
  },
  {
    id: "zinal-plat-de-la-le-cabane-du-mountet-ar",
    nom: "Zinal, Plat de la Lé, Cabane du Mountet, aller et retour",
    acces: "zinal",
    arrivee: "Retour à Zinal",
    resume:
      "La montée au cœur du cirque glaciaire, au pied des quatre mille. Longue et soutenue, mais le décor au bout est parmi les plus impressionnants des Alpes.",
    conseil: "Vingt kilomètres et plus de mille mètres de montée. À réserver aux marcheurs entraînés."
  },
  {
    id: "zinal-cabane-d-arpitettaz",
    nom: "Zinal, Cabane d'Arpitettaz",
    acces: "zinal",
    arrivee: "Retour à Zinal",
    resume:
      "La montée au vallon d'Arpitettaz, entre le Besso et le Weisshorn, à l'écart des itinéraires les plus fréquentés. Une longue journée dans un cirque sauvage, face aux séracs.",
    conseil:
      "Dix huit kilomètres et plus de mille mètres de montée. Partez tôt, il n'y a pas de raccourci pour rentrer."
  },
  {
    id: "zinal-cabane-de-tracuit-ar",
    nom: "Zinal, Cabane de Tracuit, aller et retour",
    acces: "zinal",
    arrivee: "Retour à Zinal",
    resume:
      "La plus dure de la sélection, et de loin. Plus de 1500 mètres de montée jusqu'à une cabane perchée à plus de 3200 mètres, au bord du glacier.",
    conseil:
      "Une vraie course de montagne. Départ à l'aube, ou nuit à la cabane. Ne partez pas là dessus sur un coup de tête."
  }
];

// ------------------------------------------------------------- culinaire

export const TABLES = [
  {
    id: "cabane-illhorn",
    nom: "Cabane Illhorn",
    lieu: "Au dessus de Chandolin, 2145 mètres",
    acces: "cabane-illhorn",
    horaire: "Du jeudi au lundi, 10h à 21h30. Fermé le mardi et le mercredi. Réservation obligatoire après 18h",
    tel: "027 475 11 11",
    lien: "https://www.cabaneillhorn.ch/",
    resume:
      "La cabane du Club Alpin de Sierre, juste au dessus du village. Cuisine entièrement maison, produits locaux, et une terrasse face à la vallée. Le plus simple de tous les bons repas du coin.",
    carte: [
      {
        section: "Soupes et salades",
        plats: [
          ["Soupe du jour, sans gluten et sans lactose", "10 petite, 16 grande"],
          ["Salade verte", "8 ou 14"],
          ["Salade mêlée", "10 ou 16"],
          ["Salade composée du Lac, truite de Vionnaz, noix et graines", "26"],
          ["Burrata d'été, fruits de saison", "20"],
          ["Tartine des Alpages, sérac fouetté aux herbes, tomates anciennes, jambon cru", "24"]
        ]
      },
      {
        section: "Planchettes",
        plats: [
          ["Assiette valaisanne, petite 130 g", "20"],
          ["Assiette valaisanne, grande 210 g", "30"],
          ["Assiette valaisanne XXL 600 g", "80"],
          ["Petite assiette de viande séchée de bœuf", "24"]
        ]
      },
      {
        section: "Croûtes et fondues",
        plats: [
          ["Croûte au fromage", "22"],
          ["Croûte avec jambon, ou avec un œuf", "24"],
          ["Croûte complète, œuf et jambon", "26"],
          ["Croûte biquette, figue, miel et bûche de chèvre", "26"],
          ["Fondue nature, mi vacherin mi gruyère", "26"],
          ["Fondue des montagnes, aux herbes et génépi", "28"],
          ["Les croûtes sont disponibles sans gluten", "supplément 2"]
        ]
      },
      {
        section: "Les plats",
        plats: [
          ["Kopâye dè dz'or, fines tranches de viande, sauce maison", "30"],
          ["Tartare de bœuf suisse coupé au couteau", "30"],
          ["Sérac rôti au miel, fruits de saison", "20"],
          ["Grillade sur la terrasse, les samedis de juillet et août", "28"]
        ]
      },
      {
        section: "Sur réservation",
        plats: [
          ["Fondue Anniviarde, 24 heures à l'avance, minimum 4 personnes à midi", "45 par personne"],
          ["Raclette de nos alpages, tous les vendredis soirs, à volonté", "35 par personne"]
        ]
      },
      {
        section: "Desserts",
        plats: [
          ["Dessert de Gaëlle, selon l'inspiration", "9"],
          ["Tarte au fruit du jour", "8"],
          ["Mont Blanc façon Illhorn, glace châtaigne et meringue", "12"],
          ["Coupe Valaisanne, abricot et eau de vie", "12"],
          ["La boule de glace", "4.5"]
        ]
      }
    ],
    carte_note:
      "Carte été 2026 relevée sur le site de la cabane. Les prix sont en francs suisses et peuvent avoir changé."
  },
  {
    id: "hotel-weisshorn",
    nom: "Hôtel Weisshorn",
    lieu: "Sur les hauteurs de Saint-Luc, 2337 mètres",
    acces: "st-luc-funiculaire",
    horaire: "Du 13 juin au 11 octobre 2026",
    tel: "027 475 11 06",
    lien: "https://www.valdanniviers.ch/fr/P111708/hotel-weisshorn",
    photo: "assets/photos/hotel-weisshorn.jpg",
    photo_legende: "L'Hôtel Weisshorn, seul à 2337 mètres.",
    resume:
      "Le grand bâtiment blanc posé seul sur le balcon, visible de toute la vallée. Bâti en 1882, il ne se rejoint qu'à pied, et c'est justement ce qui en fait le lieu le plus mémorable du coin. Cuisine du terroir, et une terrasse face à la Couronne Impériale.",
    note:
      "Aucune route n'y mène. Depuis Tignousa, comptez environ une heure et demie de marche presque plate, ou montez depuis Saint-Luc. Trois des randonnées de la sélection passent devant."
  },
  {
    id: "cabane-bella-tola",
    nom: "Cabane Bella Tola",
    lieu: "Au cœur du domaine de Saint-Luc, environ 2346 mètres",
    acces: "st-luc-funiculaire",
    horaire: "Saison d'été jusqu'au 21 septembre 2026. Cuisine servie de 11h30 à 15h",
    tel: "027 476 15 67",
    lien: "https://cabanebellatola.ch/",
    resume:
      "Une cabane lodge en plein domaine, à une demi heure de marche de l'arrivée du funiculaire. Cuisine traditionnelle, terrasse au soleil, et la Bella Tola juste au dessus.",
    note:
      "La saison d'été se termine le 21 septembre, votre week end est dans les tout derniers jours. La cuisine ferme à 15h, ne montez pas trop tard."
  },
  {
    id: "espace-weisshorn",
    nom: "Espace Weisshorn",
    lieu: "Au sommet du téléphérique entre Grimentz et Zinal, 2700 mètres",
    acces: "grimentz-telepherique",
    horaire: "Aux heures des remontées, 8h30 à 16h00",
    lien: "https://espaceweisshorn.ch/",
    resume:
      "Le restaurant d'altitude le plus haut et le plus récent de la vallée, supervisé par Didier de Courten. Cuisine de saison, produits locaux, et une vue à 360 degrés sur la Couronne. La table à ne pas manquer si vous montez de toute façon.",
    note: "On y accède uniquement par les remontées, donc pensez à la dernière descente à 16h30."
  },
  {
    id: "petit-mountet",
    nom: "Cabane du Petit Mountet",
    lieu: "Au dessus de Zinal, au pied du cirque glaciaire",
    acces: "zinal",
    tel: "027 475 13 80",
    lien: "https://search.ch/tel/zinal/cabane-le-petit-mountet.fr.html",
    resume:
      "Une cabane accessible à pied depuis Zinal en un peu plus d'une heure, face aux glaciers. Étape de plusieurs des randonnées de cette sélection.",
    note: "Vérifiez les horaires de fin de saison avant de compter dessus pour manger."
  },
  {
    id: "bendolla",
    nom: "Restaurant d'altitude de Bendolla",
    lieu: "Au sommet de la télécabine de Grimentz",
    acces: "grimentz-bendolla",
    tel: "027 476 20 15",
    lien: "https://search.ch/tel/grimentz/route-des-amis-de-la-nature-3/restaurant-daltitude-de-bendolla.fr.html",
    resume: "Le refuge pratique du secteur de Grimentz, au pied des randonnées vers les Becs de Bosson."
  },
  {
    id: "sorebois",
    nom: "Restaurant d'altitude de Sorebois",
    lieu: "Au sommet de la télécabine de Zinal, 2440 mètres",
    acces: "zinal-telecabine",
    tel: "027 476 20 65",
    lien: "https://restaurant-sorebois.ch/",
    resume: "Terrasse plein sud face à la Couronne Impériale, à la sortie de la télécabine."
  },
  {
    id: "grand-chalet-favre",
    nom: "Hôtel Le Grand Chalet Favre",
    lieu: "Place de l'Église, Saint-Luc",
    acces: "st-luc-funiculaire",
    tel: "027 475 11 28",
    lien: "https://search.ch/tel/st-luc/place-de-leglise-8/hotel-le-grand-chalet-favre.fr.html",
    resume:
      "Une des tables les plus réputées de la vallée, dans un chalet ancien au cœur de Saint-Luc. La sortie du soir la plus facile depuis Chandolin, un quart d'heure de bus."
  },
  {
    id: "becs-de-bosson",
    nom: "Hôtel Restaurant Becs de Bosson",
    lieu: "Rue du Village, Grimentz",
    acces: "grimentz-bendolla",
    tel: "027 475 19 79",
    lien: "https://search.ch/tel/grimentz/rue-du-village-2/hotel-restaurant-becs-de-bosson.fr.html",
    resume: "Au milieu du vieux Grimentz, à deux pas des raccards brûlés par le soleil."
  },
  {
    id: "hotel-de-moiry",
    nom: "Hôtel et Restaurant de Moiry",
    lieu: "Grimentz",
    acces: "grimentz-bendolla",
    tel: "027 475 11 44",
    lien: "https://search.ch/tel/grimentz/hotel-et-restaurant-de-moiry.fr.html",
    resume: "Une valeur sûre du village, cuisine valaisanne classique."
  },
  {
    id: "la-ferme-zinal",
    nom: "Restaurant La Ferme",
    lieu: "Rue des Cinq 4000, Zinal",
    acces: "zinal",
    tel: "027 475 13 63",
    lien: "https://search.ch/tel/zinal/rue-des-cinq-4000-22/restaurant-la-ferme-zinal.fr.html",
    resume: "Au centre de Zinal, dans la rue qui porte le nom des cinq sommets de quatre mille mètres."
  },
  {
    id: "le-besso",
    nom: "Restaurant Le Besso",
    lieu: "Rue des Cinq 4000, Zinal",
    acces: "zinal",
    tel: "027 475 31 65",
    lien: "https://search.ch/tel/zinal/rue-des-cinq-4000-27/restaurant-le-besso.fr.html",
    resume: "L'autre adresse du centre de Zinal, du nom du sommet qui ferme la vallée."
  },
  {
    id: "relais-des-melezes",
    nom: "Restaurant Relais des Mélèzes",
    lieu: "Rue du Château, Vissoie",
    acces: "st-luc-funiculaire",
    tel: "027 475 13 15",
    lien: "https://search.ch/tel/vissoie/rue-du-chateau-1/restaurant-relais-des-melezes.fr.html",
    resume:
      "À Vissoie, au carrefour des deux branches de la vallée, juste sous la tour médiévale. Pratique quand on remonte de Sierre."
  },
  {
    id: "chateau-de-villa",
    nom: "Château de Villa",
    lieu: "Rue Sainte-Catherine, Sierre",
    acces: null,
    voiture_min: 34,
    tel: "027 455 18 96",
    lien: "https://search.ch/tel/sierre/rue-sainte-catherine-4/chateau-de-villa.fr.html",
    resume:
      "L'institution valaisanne de la raclette, dans une maison du seizième siècle à Sierre. On y sert plusieurs fromages d'alpage à la suite, et la cave compte des centaines de vins valaisans. Trente cinq minutes de descente depuis Chandolin.",
    note: "Réservation très conseillée."
  }
];

// -------------------------------------------------------------- culturel

export const CULTURE = [
  {
    id: "grimentz",
    nom: "Grimentz",
    lieu: "1572 mètres, branche ouest de la vallée",
    acces: "grimentz-bendolla",
    lien: "https://www.valdanniviers.ch/fr/grimentz",
    resume:
      "Le village de carte postale de la vallée, entré en 2016 dans l'association des plus beaux villages de Suisse. Les façades de mélèze noircies par le soleil, les géraniums rouges, les ruelles étroites entre les raccards.",
    histoire: [
      "Première mention écrite en 1052 sous le nom de Grimiens, puis Grimesi en 1243 et Grimenchy en 1250.",
      "Grimentz devient en 1243 la première commune du Val d'Anniviers, bien avant les autres.",
      "Au centre du village, la Maison Bourgeoise date de 1550. Dans ses caves vieillit le vin du Glacier, un vin de solera anniviard qu'on ne servait autrefois qu'à l'évêque.",
      "En 1999, un débordement de torrent a causé de gros dégâts au village.",
      "Comme les cinq autres communes, Grimentz a fusionné dans la commune d'Anniviers le 1er janvier 2009."
    ]
  },
  {
    id: "zinal",
    nom: "Zinal",
    lieu: "1670 mètres, au fond de la branche est",
    acces: "zinal",
    lien: "https://www.valdanniviers.ch/fr/zinal",
    resume:
      "Le bout de la route, au pied de la Couronne Impériale. Cinq sommets de plus de quatre mille mètres ferment la vallée, une des plus fortes concentrations de Suisse.",
    histoire: [
      "Zinal n'était à l'origine qu'un village de mayens, occupé quelques semaines par an seulement.",
      "La première auberge ouvre en 1856, et le village devient un haut lieu de l'alpinisme dans les années 1860.",
      "Edward Whymper, premier vainqueur du Cervin, y a dormi en 1864.",
      "Jusqu'au début des années 1950, on ne montait à Zinal qu'à pied depuis Ayer. Le premier accès en véhicule date de 1951, et la vraie route à bus de 1957.",
      "Le téléphérique de Sorebois, construit en 1966, lance la station. Le village passe de 6 habitants en 1960 à 110 en 1970.",
      "Depuis 1974, Zinal accueille l'arrivée de la course Sierre Zinal, le deuxième dimanche d'août."
    ]
  },
  {
    id: "saint-luc",
    nom: "Saint-Luc",
    lieu: "1655 mètres, sur le balcon ensoleillé",
    acces: "st-luc-funiculaire",
    lien: "https://www.valdanniviers.ch/fr/saint-luc",
    resume:
      "Le village des étoiles. Son funiculaire mène à Tignousa, d'où partent le Chemin des Planètes et l'observatoire.",
    histoire: [
      "Le village s'appelait simplement Luc, attesté en 1304, 1312 et 1327. Le nom vient du latin lucus, le bois sacré.",
      "Le Saint n'est apparu qu'au milieu du dix neuvième siècle, par une réinterprétation religieuse du nom.",
      "Deux incendies, en 1845 et 1858, ont détruit les bâtiments de bois. L'Hôtel Bella Tola a été reconstruit en pierre en 1882 et 1883.",
      "Le Chemin des Planètes, créé en 1989, représente le système solaire à l'échelle du milliardième sur 6,5 kilomètres, entre 2000 et 2300 mètres.",
      "L'Observatoire François-Xavier Bagnoud, installé près de Tignousa en 1995, a détecté l'exoplanète HD 189733 b en 2006."
    ]
  },
  {
    id: "chandolin",
    nom: "Chandolin",
    lieu: "1936 mètres, votre camp de base",
    acces: null,
    lien: "https://www.valdanniviers.ch/fr/chandolin",
    resume:
      "L'un des villages habités à l'année les plus hauts d'Europe. Le vieux village, au dessus de la route, a gardé ses ruelles et ses mazots serrés contre la pente.",
    histoire: [
      "Première mention en 1250 sous le nom d'Escandulyns, puis Essandulin en 1685 et Zandolin en 1822.",
      "Chandolin dépendait du quartier de Luc jusqu'en 1600, et devient une commune indépendante en 1821.",
      "Le village obtient sa propre paroisse en 1884.",
      "La voyageuse Ella Maillart y a vécu quarante ans. Une exposition permanente lui est consacrée dans l'ancienne chapelle Sainte-Barbe, au cœur du vieux village.",
      "Comme les autres, Chandolin a rejoint la commune d'Anniviers le 1er janvier 2009."
    ]
  },
  {
    id: "vissoie",
    nom: "Vissoie",
    lieu: "1204 mètres, au carrefour des deux branches",
    acces: "st-luc-funiculaire",
    lien: "https://www.valdanniviers.ch/fr/vissoie",
    resume:
      "Le nœud de la vallée, là où les eaux de Moiry et de Zinal se rejoignent, et où tous les bus changent. Sa tour médiévale domine le village.",
    histoire: [
      "Vissoie est le chef lieu historique de la vallée et le siège de l'administration de la commune d'Anniviers.",
      "La tour de Vissoie est le témoin du vidomnat d'Anniviers, juridiction créée en 1193 et rendue permanente en 1311.",
      "Vissoie n'a été relié à la vallée du Rhône par une route carrossable qu'en 1863.",
      "C'est ici que se rejoignent la Gougra, venue du Val de Moiry, et la Navizence, venue de Zinal."
    ]
  },
  {
    id: "anniviers",
    nom: "La vallée elle même",
    lieu: "Commune d'Anniviers",
    acces: null,
    lien: "https://www.valdanniviers.ch/",
    resume:
      "Six communes réunies en une seule le 1er janvier 2009, après des siècles de vie séparée. Une vallée dont le nom parle de déplacement.",
    histoire: [
      "L'origine du nom reste incertaine. Le sociologue Bernard Crettaz y lit une expression latine signifiant l'année sur les chemins, en référence aux migrations saisonnières des habitants.",
      "D'autres lectures proposent ad nives, vers les neiges, ou anni visio, la visite annuelle de l'évêque.",
      "Avant 1052, la vallée est appelée Annivesium. Entre 1116 et 1138, l'évêque de Sion l'achète et la donne au chapitre.",
      "Gouvernée par la famille de Rarogne de 1381 à 1467, puis rendue à l'évêché jusqu'en 1798.",
      "Le secteur primaire occupait 88,6 pourcent des actifs en 1910, contre 10 pourcent en 1980. C'est ce basculement qui a fini par réunir la vallée.",
      "La fusion a été approuvée par référendum le 26 novembre 2006, et Saint-Luc l'a votée à 86,6 pourcent."
    ]
  },
  {
    id: "barrage-moiry",
    nom: "Le barrage de Moiry",
    lieu: "2250 mètres, au bout de la route du Val de Moiry",
    acces: "barrage-moiry",
    lien: "https://www.valdanniviers.ch/fr/barrage-de-moiry",
    resume:
      "Un mur de béton de 148 mètres posé à 2250 mètres, construit entre 1954 et 1958. On marche sur son couronnement, et le lac turquoise change de couleur avec la lumière.",
    histoire: [
      "Barrage voûte, arqué vers l'amont, ce qui permet un mur fin malgré sa hauteur.",
      "Ses centrales couvrent les besoins annuels de plus de 120 000 ménages.",
      "Un rehaussement de 9 mètres est à l'étude, pour stocker davantage d'énergie disponible en hiver.",
      "La route continue au delà du barrage jusqu'au parking du glacier, d'où partent les sentiers vers la Cabane de Moiry."
    ]
  },
  {
    id: "observatoire",
    nom: "Observatoire et Chemin des Planètes",
    lieu: "Tignousa, au sommet du funiculaire de Saint-Luc",
    acces: "st-luc-funiculaire",
    lien: "https://www.valdanniviers.ch/fr/observatoire-francois-xavier-bagnoud",
    resume:
      "Un sentier qui parcourt le système solaire à l'échelle du milliardième, et un observatoire qui a réellement détecté des planètes autour d'autres étoiles.",
    histoire: [
      "Le Chemin des Planètes a été créé en 1989. Il fait 6,5 kilomètres, entre 2000 et 2300 mètres d'altitude.",
      "Un pas correspond à peu près à un million de kilomètres. Le Soleil est à Tignousa, et Pluton à l'Hôtel Weisshorn.",
      "L'Observatoire François-Xavier Bagnoud, ouvert en 1995, a détecté l'exoplanète HD 189733 b en 2006 et caractérisé Gliese 436 b en 2007.",
      "Depuis 2022, il permet de piloter un télescope à distance."
    ]
  }
];

// ------------------------------------------------- lieux culturels

// Les douze lieux culturels de la vallee, tels que listes par l'office du
// tourisme. Chaque fiche renvoie vers sa page de detail, avec les horaires et
// les conditions de visite a jour.
export const LIEUX_CULTURELS = [
  {
    nom: "Espace Ella Maillart",
    village: "Chandolin",
    resume:
      "L'exposition permanente consacrée à la voyageuse qui a vécu quarante ans au village, dans l'ancienne chapelle Sainte-Barbe.",
    lien: "https://www.valdanniviers.ch/fr/P110856/destination/culture-et-patrimoine/espace-ella-maillart"
  },
  {
    nom: "Musée de la Faune",
    village: "Chandolin",
    resume: "Les animaux de la vallée expliqués de près, à deux pas de votre camp de base.",
    lien: "https://www.valdanniviers.ch/fr/P111019/destination/culture-et-patrimoine/musee-de-la-faune"
  },
  {
    nom: "Le Petit Musée Lucquérand",
    village: "Saint-Luc",
    resume: "Outils et ustensiles d'autrefois, rassemblés dans une cave traditionnelle.",
    lien: "https://www.valdanniviers.ch/fr/P111745/destination/culture-et-patrimoine/le-petit-musee-lucquerand"
  },
  {
    nom: "Maison de Grand-Maman",
    village: "Grimentz",
    resume: "Un logement d'époque conservé tel quel, au cœur du vieux village.",
    lien: "https://www.valdanniviers.ch/fr/P108624/destination/culture-et-patrimoine/maison-de-grand-maman"
  },
  {
    nom: "Maison du Remuage",
    village: "Zinal",
    resume:
      "Le quotidien des paysans au temps du remuage, quand on suivait ses bêtes d'un étage à l'autre de la vallée.",
    lien: "https://www.valdanniviers.ch/fr/P114260/destination/culture-et-patrimoine/maison-du-remuage"
  },
  {
    nom: "Chalet Madeleine",
    village: "Ayer",
    resume: "Une habitation typique visitable, qui montre la vie de tous les jours d'autrefois.",
    lien: "https://www.valdanniviers.ch/fr/P114253/destination/culture-et-patrimoine/chalet-madeleine"
  },
  {
    nom: "Maison des nourritures paysannes",
    village: "Ayer",
    resume: "L'ancienne laiterie et la boucherie du village, avec leur fonctionnement d'époque.",
    lien: "https://www.valdanniviers.ch/fr/P114256/destination/culture-et-patrimoine/maison-des-nourritures-paysannes"
  },
  {
    nom: "Cordonnerie Daniel",
    village: "Ayer",
    resume: "L'atelier d'un cordonnier d'autrefois, et toutes les étapes de fabrication d'une chaussure.",
    lien: "https://www.valdanniviers.ch/fr/P114257/destination/culture-et-patrimoine/cordonnerie-daniel"
  },
  {
    nom: "Musée des Outils Anciens de Pinsec",
    village: "Pinsec",
    resume:
      "Cinq cents outils et objets anciens dans un raccard de 1733. Le village lui même vaut le détour.",
    lien: "https://www.valdanniviers.ch/fr/P114454/destination/culture-et-patrimoine/musee-des-outils-anciens-de-pinsec-moap"
  },
  {
    nom: "Tour d'Anniviers",
    village: "Vissoie",
    resume: "Expositions, théâtre et spectacles dans la tour médiévale qui domine le carrefour de la vallée.",
    lien: "https://www.valdanniviers.ch/fr/P114519/destination/culture-et-patrimoine/tour-d-anniviers"
  },
  {
    nom: "Chapelle du Château",
    village: "Vissoie",
    resume: "Une exposition différente chaque été, dans la chapelle du château.",
    lien: "https://www.valdanniviers.ch/fr/P113149/destination/culture-et-patrimoine/chapelle-du-chateau"
  },
  {
    nom: "Chemin d'images",
    village: "Vissoie",
    resume:
      "Une exposition en plein air, gratuite et ouverte tout le temps, qui raconte la vallée en anecdotes.",
    lien: "https://www.valdanniviers.ch/fr/P114518/destination/culture-et-patrimoine/chemin-d-images"
  }
];

// ------------------------------------------- le reste de la destination

// Les grandes portes d'entrée du site officiel, pour ceux qui veulent creuser
// un sujet pendant le week end. Rien ici n'est inventé : ce sont les rubriques
// telles qu'elles existent, avec leur lien.
export const THEMES_DESTINATION = [
  {
    nom: "Les villages de la vallée",
    resume: "Les six villages, leurs caractères et leurs accès, un par un.",
    lien: "https://www.valdanniviers.ch/fr/Z15109/villages"
  },
  {
    nom: "Produits du terroir",
    resume:
      "Le vin du Glacier, les fromages d'alpage, la viande séchée et où les trouver sur place.",
    lien: "https://www.valdanniviers.ch/fr/Z15347/produits-du-terroir"
  },
  {
    nom: "Patrimoine bâti",
    resume: "Raccards, greniers, chapelles et bisses : comment lire un village anniviard.",
    lien: "https://www.valdanniviers.ch/fr/Z15285/patrimoine-bati"
  },
  {
    nom: "Astronomie à Saint-Luc",
    resume: "L'observatoire, le Chemin des Planètes et les soirées d'observation.",
    lien: "https://www.valdanniviers.ch/fr/Z15254/astronomie"
  },
  {
    nom: "Traditions vivantes",
    resume: "Combats de reines, processions, fêtes de village et vin du Glacier.",
    lien: "https://www.valdanniviers.ch/fr/Z15370/traditions"
  },
  {
    nom: "Sites naturels",
    resume: "Les points de vue et les curiosités naturelles de la vallée, repérés et situés.",
    lien: "https://www.valdanniviers.ch/fr/Z15368/sites-naturels"
  },
  {
    nom: "Visites guidées des villages",
    resume: "Des visites commentées de l'histoire des villages, sur inscription.",
    lien: "https://www.valdanniviers.ch/fr/G3710/visites-guidees-des-villages"
  },
  {
    nom: "En tête à tête avec",
    resume: "Des portraits d'habitants qui racontent leur lien avec la vallée.",
    lien: "https://www.valdanniviers.ch/fr/Z15455/en-tete-tete-avec"
  },
  {
    nom: "Agenda du moment",
    resume: "Ce qui se passe pendant votre week end, mis à jour par l'office du tourisme.",
    lien: "https://www.valdanniviers.ch/fr/Z15382/agenda"
  },
  {
    nom: "Info live et webcams",
    resume: "L'état des remontées, la météo des sommets et les images en direct.",
    lien: "https://www.valdanniviers.ch/fr/Z15114/infolive"
  }
];

// ------------------------------------------------------------------ chill

export const CHILL = [
  {
    id: "illhorn-terrasse",
    nom: "La terrasse de la Cabane Illhorn",
    lieu: "Au dessus de Chandolin, 2145 mètres",
    acces: "cabane-illhorn",
    lien: "https://www.cabaneillhorn.ch/",
    resume:
      "Le plus simple et sans doute le meilleur. Quarante cinq minutes de montée depuis le village, ou le télésiège du Tsapé, et une terrasse face à toute la vallée. Ouverte du jeudi au lundi, de 10h à 21h30.",
    conseil: "La carte complète est dans l'onglet Culinaire. Raclette à volonté tous les vendredis soirs."
  },
  {
    id: "altitude-wellness",
    nom: "Altitude Wellness SPA",
    lieu: "Chandolin Boutique Hotel, à Chandolin",
    acces: null,
    tel: "027 564 44 44",
    lien: "https://chandolinboutiquehotel.ch/fr/produit/altitude-wellness-spa",
    resume:
      "Le spa le plus proche, à Chandolin même. Sauna, hammam, salle de repos et bains nordiques en plein air. Soins et massages sur réservation, dès 16 ans. Les bains nordiques sont accessibles dès 6 ans.",
    conseil: "Réservez à l'avance, c'est un petit établissement."
  },
  {
    id: "flocons-deau",
    nom: "Les Flocons d'Eau",
    lieu: "Grimentz",
    acces: "grimentz-bendolla",
    lien: "https://spaflocons.ch/",
    resume:
      "Le plus complet de la vallée. Hammam, sauna, jacuzzi, piscine chauffée, bain froid, salle de fitness, massages et yoga. Vingt cinq minutes de voiture depuis Chandolin.",
    conseil: "Idéal en fin de journée après une grosse randonnée."
  },
  {
    id: "piscine-zinal",
    nom: "Piscine couverte et spa de Zinal",
    lieu: "Zinal",
    acces: "zinal",
    lien: "https://www.valdanniviers.ch/fr/piscine-couverte-et-spa-zinal",
    resume:
      "Bassin semi olympique, pataugeoire pour les enfants, plus un espace bien être avec hammam, sauna et jacuzzi. La bonne option si le temps tourne.",
    conseil: "Vérifiez les horaires d'ouverture de basse saison avant de descendre."
  },
  {
    id: "loeche",
    nom: "Bains de Loèche-les-Bains",
    lieu: "Loèche-les-Bains, de l'autre côté du Rhône",
    acces: null,
    voiture_min: 58,
    lien: "https://www.leukerbad.ch/fr/",
    resume:
      "Les vrais bains thermaux les plus proches, à une heure de route. L'eau sort à 51 degrés et alimente des dizaines de bassins intérieurs et extérieurs, au pied de la Gemmi.",
    conseil: "Une heure de route depuis Chandolin, à faire en journée complète plutôt qu'en fin d'après midi."
  },
  {
    id: "espace-weisshorn-chill",
    nom: "Un verre à 2700 mètres",
    lieu: "Espace Weisshorn, entre Grimentz et Zinal",
    acces: "grimentz-telepherique",
    lien: "https://espaceweisshorn.ch/",
    resume:
      "Monter en téléphérique, s'asseoir sur la terrasse la plus haute de la vallée et ne rien faire d'autre que regarder la Couronne Impériale. Zéro effort, maximum d'effet.",
    conseil: "Dernière descente à 16h30. Ne la ratez pas, il n'y a pas de chemin rapide pour redescendre."
  },
  {
    id: "vieux-chandolin",
    nom: "Flâner dans le vieux Chandolin",
    lieu: "À deux pas, au dessus de la route",
    acces: null,
    lien: "https://www.valdanniviers.ch/fr/chandolin",
    resume:
      "Le noyau ancien du village, ses ruelles étroites, ses mazots serrés et l'exposition consacrée à Ella Maillart dans l'ancienne chapelle Sainte-Barbe. Une demi heure de promenade, sans effort.",
    conseil: "Parfait pour le défi Le grenier sur pilotis, les raccards y sont nombreux."
  },
  {
    id: "lac-moiry-bord",
    nom: "Le tour du lac de Moiry",
    lieu: "Val de Moiry, 2250 mètres",
    acces: "barrage-moiry",
    lien: "https://www.valdanniviers.ch/fr/lac-de-moiry",
    resume:
      "Marcher le long de l'eau turquoise sans monter nulle part, jusqu'à la buvette ou simplement jusqu'au prochain rocher plat. Le lac change de couleur selon l'heure.",
    conseil: "Le plus beau moment est en fin d'après midi, quand la lumière passe derrière la Dent Blanche."
  }
];

export const SOURCES = [
  { nom: "Horaires des remontées, site officiel", url: "https://www.valdanniviers.ch/fr/Z15410/remontees-mecaniques" },
  { nom: "Horaires des transports publics suisses", url: "https://www.cff.ch/" },
  { nom: "Office du tourisme du Val d'Anniviers", url: "https://www.valdanniviers.ch/" }
];

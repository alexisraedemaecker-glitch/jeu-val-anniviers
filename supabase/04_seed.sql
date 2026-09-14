-- =====================================================================
-- Seed des donnees de reference. GENERE AUTOMATIQUEMENT, ne pas editer.
-- Source : js/data/pillars.js, js/data/challenges.js, js/data/synergies.js
-- Regenerer avec : python3 tools/gen_seed.py
-- Idempotent, peut etre rejoue sans danger.
-- =====================================================================

insert into public.pillars (id, name, short, max_points, sort_order, color, icon, blurb) values
  ('montagne', 'Montagne et Glaciers', 'Montagne', 200, 1, '#4a7fb5', '⛰', 'Relief, sommets, glaciers, faune et flore alpine.'),
  ('eau', 'Eau', 'Eau', 200, 2, '#2f9e9e', '💧', 'Torrents, bisses, irrigation, barrages, gestion de l''eau.'),
  ('vie-alpine', 'Vie Alpine', 'Vie Alpine', 200, 3, '#6f9e4a', '🐄', 'Alpages, elevage, fromage, transhumance.'),
  ('patrimoine', 'Patrimoine', 'Patrimoine', 200, 4, '#b5804a', '🏚', 'Villages, architecture, batiments, savoir faire.'),
  ('memoire', 'Mémoire et Transmission', 'Mémoire', 200, 5, '#9b6fb0', '🕯', 'Histoires, traditions, langue, personnes.')
on conflict (id) do update set
  name = excluded.name, short = excluded.short, max_points = excluded.max_points,
  sort_order = excluded.sort_order, color = excluded.color, icon = excluded.icon,
  blurb = excluded.blurb;

insert into public.challenges (id, pillar, name, style, tier, points, location_kind, location_detail, proof, sort_order) values
  ('panorama-nomme', 'montagne', 'Panorama nommé', 'chill', 'decouverte', 10, 'typee', 'Depuis n''importe quel point de vue dégagé de la vallée', 'photo_quiz', 1),
  ('le-nom-davant', 'montagne', 'Le nom d''avant', 'culturel', 'decouverte', 10, 'libre', 'N''importe où dans la vallée', 'photo_quiz', 2),
  ('qui-vit-la-haut', 'montagne', 'Qui vit là haut', 'chill', 'decouverte', 10, 'libre', 'N''importe où dans la vallée', 'photo_quiz', 3),
  ('fleurs-daltitude', 'montagne', 'Fleurs d''altitude', 'chill', 'decouverte', 10, 'libre', 'N''importe où dans la vallée', 'photo_quiz', 4),
  ('le-sac-du-berger', 'montagne', 'Le sac du berger', 'culinaire', 'decouverte', 10, 'libre', 'N''importe où dans la vallée', 'photo_quiz', 5),
  ('le-genepi-de-la-vallee', 'montagne', 'Le génépi de la vallée', 'culinaire', 'experience', 20, 'typee', 'Dans n''importe quel village ou refuge de la vallée', 'photo_quiz', 6),
  ('glace-en-recul', 'montagne', 'Glace en recul', 'culturel', 'experience', 20, 'typee', 'Accessible sans marche, depuis le parking du barrage de Moiry ou le belvédère', 'photo_quiz', 7),
  ('lecture-du-relief', 'montagne', 'Lecture du relief', 'culturel', 'experience', 20, 'typee', 'Depuis n''importe quel col ou crête de la vallée', 'photo_quiz', 8),
  ('la-couronne-depuis-zinal', 'montagne', 'La Couronne depuis Zinal', 'chill', 'decouverte', 10, 'typee', 'Depuis n''importe quel point de vue côté vallée de Zinal', 'photo_quiz', 9),
  ('glacier-recule-mesure', 'montagne', 'Le glacier qui recule, mesuré', 'sportif', 'mission', 30, 'precise', 'Glacier de Moiry, depuis le sentier du pied du glacier, avec de la marche', 'photo_quiz', 10),
  ('le-glacier-de-lautre-cote', 'montagne', 'Le glacier de l''autre côté', 'sportif', 'mission', 30, 'precise', 'Glacier de Zinal, ou un point de vue dégagé sur ce glacier au fond de la vallée', 'photo_quiz', 11),
  ('sommet-et-souffle', 'montagne', 'Sommet et souffle', 'sportif', 'mission', 30, 'precise', 'Un sommet ou un col exigeant en dénivelé, au choix du groupe', 'photo_quiz', 12),
  ('lobservatoire-de-tignousa', 'montagne', 'L''observatoire de Tignousa', 'chill', 'decouverte', 10, 'precise', 'Tignousa, au sommet du funiculaire de Saint Luc, à 2200 mètres', 'photo_quiz', 13),
  ('les-champignons-de-la-vallee', 'montagne', 'Les champignons de la vallée', 'chill', 'decouverte', 10, 'libre', 'Dans les forêts de mélèzes et d''épicéas, n''importe où dans la vallée', 'photo_quiz', 14),
  ('lillgraben', 'montagne', 'L''Illgraben', 'sportif', 'experience', 20, 'precise', 'Le point de vue sur l''Illgraben, à 15 minutes de marche de la Cabane Illhorn', 'photo_quiz', 15),
  ('ou-va-leau', 'eau', 'Où va l''eau', 'chill', 'decouverte', 10, 'libre', 'Au bord de n''importe quel cours d''eau de la vallée', 'photo_quiz', 16),
  ('le-nom-du-canal', 'eau', 'Le nom du canal', 'culturel', 'decouverte', 10, 'libre', 'N''importe où dans la vallée, le long d''un canal ou d''un bisse', 'photo_quiz', 17),
  ('le-pourquoi-des-bisses', 'eau', 'Le pourquoi des bisses', 'culturel', 'experience', 20, 'typee', 'Le long de n''importe quel bisse de la vallée', 'photo_quiz', 18),
  ('leau-des-glaciers-energie', 'eau', 'L''eau des glaciers, source d''énergie', 'culturel', 'experience', 20, 'typee', 'Depuis un point de vue sur le barrage de Moiry, ou sur un torrent capté', 'photo_quiz', 19),
  ('leau-qui-fait-le-vin', 'eau', 'L''eau qui fait le vin', 'culinaire', 'experience', 20, 'typee', 'Dans un vignoble en aval de la vallée, côté Chippis, Chalais ou Réchy', 'photo_quiz', 20),
  ('mission-secheresse', 'eau', 'Mission sécheresse', 'culturel', 'experience', 20, 'libre', 'N''importe où, ce défi se joue en discutant', 'photo_quiz', 21),
  ('le-geant-de-beton', 'eau', 'Le géant de béton', 'sportif', 'mission', 30, 'precise', 'Barrage de Moiry, sur le couronnement', 'photo_quiz', 22),
  ('la-riviere-qui-vient-de-zinal', 'eau', 'La rivière qui vient de Zinal', 'culturel', 'experience', 20, 'typee', 'Au bord du torrent, côté vallée de Zinal', 'photo_quiz', 23),
  ('les-cornes-qui-saffrontent', 'vie-alpine', 'Les cornes qui s''affrontent', 'chill', 'decouverte', 10, 'libre', 'N''importe où, ce défi est un quiz', 'quiz', 24),
  ('de-lherbe-au-fromage', 'vie-alpine', 'De l''herbe au fromage', 'culinaire', 'decouverte', 10, 'libre', 'N''importe où, ce défi est un quiz', 'quiz', 25),
  ('qui-decide-de-leau-et-de-lherbe', 'vie-alpine', 'Qui décide de l''eau et de l''herbe', 'culturel', 'experience', 20, 'typee', 'Sur n''importe quel alpage, ou le long d''un bisse', 'photo_quiz', 26),
  ('le-rythme-de-la-transhumance', 'vie-alpine', 'Le rythme de la transhumance', 'culturel', 'experience', 20, 'typee', 'Sur n''importe quel alpage de la vallée', 'photo_quiz', 27),
  ('degustation-dalpage', 'vie-alpine', 'Dégustation d''alpage', 'culinaire', 'experience', 20, 'typee', 'Sur un alpage, dans une fromagerie ou un commerce de village', 'photo_quiz', 28),
  ('lalpage-oublie', 'vie-alpine', 'L''alpage oublié', 'sportif', 'mission', 30, 'precise', 'Un alpage qui n''est plus exploité, repéré sur la carte ou indiqué sur place', 'photo_quiz', 29),
  ('lalpage-vivant', 'vie-alpine', 'L''alpage vivant', 'sportif', 'mission', 30, 'precise', 'Un alpage encore en activité, en altitude, à rejoindre à pied', 'photo_quiz', 30),
  ('le-vin-du-glacier', 'vie-alpine', 'Le vin du Glacier', 'culinaire', 'experience', 20, 'typee', 'Là où l''on sert ou raconte le vin du Glacier, à Grimentz en particulier', 'photo_quiz', 31),
  ('les-salaisons-danniviers', 'vie-alpine', 'Les salaisons d''Anniviers', 'culinaire', 'decouverte', 10, 'libre', 'N''importe où dans la vallée, sur une assiette ou dans un commerce', 'photo_quiz', 32),
  ('le-grenier-sur-pilotis', 'patrimoine', 'Le grenier sur pilotis', 'chill', 'decouverte', 10, 'libre', 'Dans n''importe quel village ou hameau de la vallée', 'photo_quiz', 33),
  ('les-traces-du-passe', 'patrimoine', 'Les traces du passé', 'culturel', 'experience', 20, 'precise', 'Un lieu du village dont il existe une vue ancienne, place, église, pont ou rue principale', 'photo_quiz', 34),
  ('le-village-qui-a-change-de-vie', 'patrimoine', 'Le village qui a changé de vie', 'culturel', 'experience', 20, 'typee', 'Dans n''importe quel village de la vallée', 'photo_quiz', 35),
  ('du-four-a-la-table', 'patrimoine', 'Du four à la table', 'culinaire', 'experience', 20, 'typee', 'Un ancien four à pain ou un lieu de production alimentaire de village', 'photo_quiz', 36),
  ('le-chemin-muletier', 'patrimoine', 'Le chemin muletier', 'sportif', 'mission', 30, 'precise', 'Un ancien chemin muletier reliant deux villages de la vallée', 'photo_quiz', 37),
  ('le-hameau-qui-sest-vide', 'patrimoine', 'Le hameau qui s''est vidé', 'sportif', 'mission', 30, 'precise', 'Un hameau ou un mayen délaissé, repéré sur la carte ou indiqué sur place', 'photo_quiz', 38),
  ('la-mine-de-cuivre-de-la-lee', 'patrimoine', 'La mine de cuivre de la Lée', 'sportif', 'mission', 30, 'precise', 'Secteur de la Lée, au dessus de Zinal, environ 1h30 de marche depuis le village', 'photo_quiz', 39),
  ('les-mots-de-la-vallee', 'memoire', 'Les mots de la vallée', 'chill', 'decouverte', 10, 'libre', 'N''importe où dans la vallée', 'photo_quiz', 40),
  ('qui-se-souvient', 'memoire', 'Qui se souvient', 'culturel', 'decouverte', 10, 'libre', 'N''importe où dans la vallée, là où il y a des gens', 'photo_quiz', 41),
  ('la-neige-davant', 'memoire', 'La neige d''avant', 'culturel', 'experience', 20, 'libre', 'Partout où vous croiserez des habitants, village, terrasse, commerce', 'photo_quiz', 42),
  ('le-repas-de-fete', 'memoire', 'Le repas de fête', 'culinaire', 'experience', 20, 'libre', 'Partout où vous croiserez des habitants', 'photo_quiz', 43),
  ('lobjet-qui-raconte', 'memoire', 'L''objet qui raconte', 'sportif', 'mission', 30, 'precise', 'Un musée local, une collection de village, ou chez une famille', 'photo_quiz', 44),
  ('le-village-qui-a-attendu-la-route', 'memoire', 'Le village qui a attendu la route', 'sportif', 'mission', 30, 'precise', 'Un village longtemps resté isolé, au fond de la vallée ou sur un versant', 'photo_quiz', 45)
on conflict (id) do update set
  pillar = excluded.pillar, name = excluded.name, style = excluded.style,
  tier = excluded.tier, points = excluded.points,
  location_kind = excluded.location_kind, location_detail = excluded.location_detail,
  proof = excluded.proof, sort_order = excluded.sort_order;

insert into public.synergies (id, name, pillar_a, pillar_b, triggers_a, triggers_b, personal_bonus, gauge_bonus, sort_order) values
  ('temoin-du-glacier', 'Le témoin du glacier', 'montagne', 'memoire', array['glace-en-recul', 'glacier-recule-mesure']::text[], array['la-neige-davant']::text[], 10, 5, 1),
  ('la-vie-dautrefois', 'La vie d''autrefois', 'vie-alpine', 'patrimoine', array['de-lherbe-au-fromage', 'degustation-dalpage']::text[], array['le-grenier-sur-pilotis']::text[], 10, 5, 2),
  ('le-fragment-retrouve', 'Le fragment retrouvé', 'memoire', 'patrimoine', array['lobjet-qui-raconte', 'qui-se-souvient']::text[], array['les-traces-du-passe']::text[], 10, 5, 3),
  ('le-pari-du-berger', 'Le pari du berger', 'eau', 'vie-alpine', array['mission-secheresse']::text[], array['le-rythme-de-la-transhumance']::text[], 10, 5, 4),
  ('la-memoire-de-la-glace', 'La mémoire de la glace', 'eau', 'montagne', array['ou-va-leau', 'leau-des-glaciers-energie']::text[], array['glacier-recule-mesure', 'le-glacier-de-lautre-cote']::text[], 10, 5, 5)
on conflict (id) do update set
  name = excluded.name, pillar_a = excluded.pillar_a, pillar_b = excluded.pillar_b,
  triggers_a = excluded.triggers_a, triggers_b = excluded.triggers_b,
  personal_bonus = excluded.personal_bonus, gauge_bonus = excluded.gauge_bonus,
  sort_order = excluded.sort_order;

-- Retire du catalogue les defis qui ne sont plus dans le fichier source.
delete from public.challenges where id <> all (array['panorama-nomme', 'le-nom-davant', 'qui-vit-la-haut', 'fleurs-daltitude', 'le-sac-du-berger', 'le-genepi-de-la-vallee', 'glace-en-recul', 'lecture-du-relief', 'la-couronne-depuis-zinal', 'glacier-recule-mesure', 'le-glacier-de-lautre-cote', 'sommet-et-souffle', 'lobservatoire-de-tignousa', 'les-champignons-de-la-vallee', 'lillgraben', 'ou-va-leau', 'le-nom-du-canal', 'le-pourquoi-des-bisses', 'leau-des-glaciers-energie', 'leau-qui-fait-le-vin', 'mission-secheresse', 'le-geant-de-beton', 'la-riviere-qui-vient-de-zinal', 'les-cornes-qui-saffrontent', 'de-lherbe-au-fromage', 'qui-decide-de-leau-et-de-lherbe', 'le-rythme-de-la-transhumance', 'degustation-dalpage', 'lalpage-oublie', 'lalpage-vivant', 'le-vin-du-glacier', 'les-salaisons-danniviers', 'le-grenier-sur-pilotis', 'les-traces-du-passe', 'le-village-qui-a-change-de-vie', 'du-four-a-la-table', 'le-chemin-muletier', 'le-hameau-qui-sest-vide', 'la-mine-de-cuivre-de-la-lee', 'les-mots-de-la-vallee', 'qui-se-souvient', 'la-neige-davant', 'le-repas-de-fete', 'lobjet-qui-raconte', 'le-village-qui-a-attendu-la-route']::text[]);
delete from public.synergies  where id <> all (array['temoin-du-glacier', 'la-vie-dautrefois', 'le-fragment-retrouve', 'le-pari-du-berger', 'la-memoire-de-la-glace']::text[]);

-- Remet les synergies d'aplomb apres tout changement de catalogue.
select public.recompute_synergies();

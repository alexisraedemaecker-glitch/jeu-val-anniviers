# L'album du week end

Fabrique la page souvenir à partir de trois sources :

- la base du jeu, pour les scores, les défis, le fil et les quiz ;
- le bucket `preuves` de Supabase, pour les photos prises dans l'application ;
- le dossier `Photos/` du projet, pour les photos prises en dehors.

Les deux dossiers de photos et l'album produit sont hors dépôt : ce sont des
photos privées, et le dépôt est public.

## Dans l'ordre

    python3 tools/album/dump.py          # l'etat final du jeu, en JSON
    python3 tools/album/index_photos.py  # relie chaque photo a son defi
    python3 tools/album/hash.py          # empreintes, pour reperer les doublons
    python3 tools/album/images.py        # les images en taille web, dans album/photos
    python3 tools/album/gen_album.py     # album/index.html

`selection.py` porte le choix des photos, leur ordre, les chapitres et les
légendes écrites à la main. C'est le seul fichier à toucher pour changer le
contenu de l'album.

Les chemins de travail pointent vers le dossier temporaire de la session qui a
servi à le construire. Les réajuster en haut de chaque script avant de rejouer
la chaîne.

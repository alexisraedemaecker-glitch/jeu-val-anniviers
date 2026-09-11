// Configuration publique de l'application.
//
// La cle ci dessous est la cle publishable de Supabase. Elle est concue pour
// vivre dans un navigateur : elle n'ouvre que ce que les regles de securite de
// la base autorisent, c'est a dire la lecture des donnees du jeu et l'appel des
// fonctions de soumission. La cle secrete, elle, n'apparait nulle part dans ce
// depot ni dans le code envoye au navigateur.
export const SUPABASE_URL = "https://bdqbrdoorqcxutfojgze.supabase.co";
export const SUPABASE_KEY = "sb_publishable_4LtKdowLhCiBJIbBfpuhqg_fgFU-2nQ";

export const PHOTO_BUCKET = "preuves";

// Compression des photos avant envoi, pour rester rapide avec un reseau faible.
export const PHOTO_MAX_SIDE = 1600;
export const PHOTO_QUALITY = 0.72;
export const PHOTO_TARGET_BYTES = 420 * 1024;

// Resynchronisation de la file d'attente locale.
export const SYNC_INTERVAL_MS = 20000;
// Filet de securite si le temps reel decroche.
export const POLL_INTERVAL_MS = 30000;

export const APP_TITLE = "Le Val d'Anniviers en 2056";

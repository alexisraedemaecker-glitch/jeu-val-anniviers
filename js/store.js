// Etat global de l'application, connexion Supabase, temps reel et
// synchronisation de la file d'attente locale.

import {
  SUPABASE_URL,
  SUPABASE_KEY,
  PHOTO_BUCKET,
  PORTRAIT_BUCKET,
  SYNC_INTERVAL_MS,
  POLL_INTERVAL_MS
} from "./config.js";
import * as queue from "./queue.js";
import { compress, compressPortrait } from "./image.js";
import { CHALLENGE_BY_ID } from "./data/challenges.js";
import { SYNERGY_BY_ID } from "./data/synergies.js";

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { params: { eventsPerSecond: 4 } }
});

export const client = sb;

const ME_KEY = "anniviers2056.me";
const PIN_KEY = "anniviers2056.pin";

export const state = {
  booted: false,
  loading: true,
  loadError: null,
  me: readMe(),
  gauges: [],
  collective: null,
  scores: [],
  stats: {},
  unlocks: [],
  done: {},
  feed: [],
  feedLoaded: false,
  posts: [],
  postsLoaded: false,
  notifications: [],
  lockouts: [],
  localLockouts: readLocalLockouts(),
  lockoutMinutes: 30,
  pending: [],
  syncing: false,
  online: typeof navigator === "undefined" ? true : navigator.onLine !== false,
  lastSync: null,
  realtime: "hors ligne",
  toast: null,
  synergyQueue: [],
  organizerPin: sessionStorage.getItem(PIN_KEY) || localStorage.getItem(PIN_KEY) || ""
};

// ------------------------------------------------------------- abonnements

const listeners = new Set();
let frame = null;

export function subscribe(fn) {
  listeners.add(fn);
  // Une notification emise avant cet abonnement serait perdue, et l'ecran
  // resterait sur ses valeurs de depart jusqu'au prochain evenement. Preact
  // execute les effets apres le premier rendu, donc la course est reelle :
  // les donnees arrivent souvent avant que l'interface ne se soit abonnee.
  // On redessine donc systematiquement juste apres un abonnement.
  notify();
  return () => listeners.delete(fn);
}

export function notify() {
  if (frame) return;
  // On groupe les redessins, mais surtout pas avec requestAnimationFrame :
  // celui ci ne s'execute jamais quand la page est masquee. Un telephone
  // verrouille ou bascule sur une autre application gelerait alors l'affichage.
  // setTimeout, lui, se declenche toujours.
  frame = setTimeout(() => {
    frame = null;
    listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error("Redessin en échec", err);
      }
    });
  }, 0);
}

export function setState(patch) {
  Object.assign(state, patch);
  notify();
}

// ------------------------------------------------------------------ profil

function readMe() {
  try {
    const raw = localStorage.getItem(ME_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

function writeMe(me) {
  try {
    if (me) localStorage.setItem(ME_KEY, JSON.stringify(me));
    else localStorage.removeItem(ME_KEY);
  } catch (err) {
    /* stockage indisponible, on continue en memoire */
  }
}

/** Envoie un portrait dans le bucket des profils et renvoie son chemin. */
export async function uploadPortrait(file) {
  const out = await compressPortrait(file);
  const blob = out.blob;
  const ext = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
  const name = `${uuid()}.${ext}`;
  const { error } = await sb.storage.from(PORTRAIT_BUCKET).upload(name, blob, {
    contentType: blob.type || "image/jpeg",
    cacheControl: "31536000",
    upsert: false
  });
  if (error) throw new Error(friendly(error));
  return name;
}

export function portraitUrl(path) {
  if (!path) return null;
  const { data } = sb.storage.from(PORTRAIT_BUCKET).getPublicUrl(path);
  return data ? data.publicUrl : null;
}

export async function setPortrait(file) {
  if (!state.me) throw new Error("Aucun profil actif");
  const chemin = await uploadPortrait(file);
  const { data, error } = await sb.rpc("set_photo", {
    p_participant: state.me.id,
    p_photo: chemin
  });
  if (error) throw new Error(friendly(error));
  const me = Array.isArray(data) ? data[0] : data;
  writeMe(me);
  setState({ me, toast: { kind: "success", text: "Photo enregistrée" } });
  refresh();
  return me;
}

export async function signIn(firstName, lastName, vibe, photoPath, code) {
  const { data, error } = await sb.rpc("ensure_participant", {
    p_first: firstName,
    p_last: lastName,
    p_vibe: vibe || null,
    p_photo: photoPath || null,
    p_code: code || null
  });
  if (error) throw new Error(friendly(error));
  const me = Array.isArray(data) ? data[0] : data;
  if (!me || !me.id) throw new Error("Profil non créé, réessayez");
  writeMe(me);
  setState({ me });
  await refresh();
  return me;
}

export function signOut() {
  writeMe(null);
  setState({ me: null });
}

export async function chooseExisting(participant) {
  writeMe(participant);
  setState({ me: participant });
  await refresh();
  return participant;
}

export async function updateVibe(vibe) {
  if (!state.me) return;
  const { data, error } = await sb.rpc("set_vibe", {
    p_participant: state.me.id,
    p_vibe: vibe || null
  });
  if (error) throw new Error(friendly(error));
  const me = Array.isArray(data) ? data[0] : data;
  writeMe(me);
  setState({ me });
  refresh();
}

// ----------------------------------------------------------- lecture du jeu

export async function refresh({ feed = false } = {}) {
  try {
    const { data, error } = await sb.rpc("game_state");
    if (error) throw error;
    setState({
      gauges: data.gauges || [],
      collective: data.collective || null,
      scores: data.scores || [],
      stats: data.stats || {},
      unlocks: data.unlocks || [],
      done: data.done || {},
      lockouts: data.lockouts || [],
      lockoutMinutes: (data.settings && data.settings.lockout_minutes) || 30,
      loading: false,
      loadError: null,
      lastSync: new Date(),
      online: true
    });
    // Garde le profil local a jour si le prenom ou l'envie a change ailleurs.
    if (state.me) {
      const fresh = (data.scores || []).find((s) => s.id === state.me.id);
      if (
        fresh &&
        (fresh.vibe !== state.me.vibe ||
          fresh.first_name !== state.me.first_name ||
          fresh.photo_path !== state.me.photo_path)
      ) {
        const me = {
          id: fresh.id,
          first_name: fresh.first_name,
          last_name: fresh.last_name,
          vibe: fresh.vibe,
          photo_path: fresh.photo_path
        };
        writeMe(me);
        setState({ me });
      }
    }
  } catch (err) {
    setState({
      loading: false,
      loadError: friendly(err),
      online: false
    });
  }
  if (feed || state.feedLoaded) await refreshFeed();
}

/** Le fil social : publications, cornes, commentaires et notifications. */
export async function refreshPosts() {
  try {
    const { data, error } = await sb.rpc("feed_state", {
      p_participant: state.me ? state.me.id : null
    });
    if (error) throw error;
    setState({
      posts: (data && data.posts) || [],
      notifications: (data && data.notifications) || [],
      postsLoaded: true
    });
  } catch (err) {
    console.warn("Fil indisponible", err);
  }
}

export function unreadCount() {
  return state.notifications.filter((n) => !n.read_at).length;
}

/** Envoie une photo libre dans le bucket des preuves et renvoie son chemin. */
export async function uploadPhotoLibre(file) {
  const out = await compress(file);
  const blob = out.blob;
  const ext = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
  const name = `${uuid()}.${ext}`;
  const { error } = await sb.storage.from(PHOTO_BUCKET).upload(name, blob, {
    contentType: blob.type || "image/jpeg",
    cacheControl: "31536000",
    upsert: false
  });
  if (error) throw new Error(friendly(error));
  return name;
}

export async function addPost({ texte, file, mentions }) {
  if (!state.me) throw new Error("Identifiez vous d'abord");
  const chemin = file ? await uploadPhotoLibre(file) : null;
  const { error } = await sb.rpc("add_post", {
    p_client_id: uuid(),
    p_author: state.me.id,
    p_texte: texte || null,
    p_photo: chemin,
    p_mentions: mentions || []
  });
  if (error) throw new Error(friendly(error));
  await refreshPosts();
  setState({ toast: { kind: "success", text: chemin ? "Photo publiée" : "Message publié" } });
}

export async function addComment(postId, texte, mentions) {
  if (!state.me) throw new Error("Identifiez vous d'abord");
  const { error } = await sb.rpc("add_comment", {
    p_client_id: uuid(),
    p_author: state.me.id,
    p_post: postId,
    p_texte: texte,
    p_mentions: mentions || []
  });
  if (error) throw new Error(friendly(error));
  await refreshPosts();
}

export async function toggleKudo(postId) {
  if (!state.me) throw new Error("Identifiez vous d'abord");
  // Retour immediat : la corne s'allume avant l'aller retour reseau.
  const posts = state.posts.map((p) => {
    if (p.id !== postId) return p;
    const ids = (p.kudos_ids || []).slice();
    const i = ids.indexOf(state.me.id);
    if (i >= 0) ids.splice(i, 1);
    else ids.push(state.me.id);
    return { ...p, kudos_ids: ids };
  });
  setState({ posts });
  const { error } = await sb.rpc("toggle_kudo", { p_participant: state.me.id, p_post: postId });
  if (error) {
    await refreshPosts();
    throw new Error(friendly(error));
  }
  await refreshPosts();
}

export async function markNotificationsRead() {
  if (!state.me || !unreadCount()) return;
  setState({ notifications: state.notifications.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })) });
  const { error } = await sb.rpc("mark_notifications_read", { p_participant: state.me.id });
  if (error) console.warn("Notifications non marquées", error);
}

export async function deletePost(postId) {
  if (!state.me) throw new Error("Identifiez vous d'abord");
  const { data, error } = await sb.rpc("delete_post", {
    p_post: postId,
    p_participant: state.me.id,
    p_pin: state.organizerPin || null
  });
  if (error) throw new Error(friendly(error));
  if (data && data.photo_path) {
    try {
      await sb.storage.from(PHOTO_BUCKET).remove([data.photo_path]);
    } catch (err) {
      console.warn("Photo non retirée", err);
    }
  }
  await refreshPosts();
  setState({ toast: { kind: "success", text: "Publication retirée" } });
}

export async function refreshFeed() {
  try {
    const { data, error } = await sb
      .from("v_feed")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    setState({ feed: data || [], feedLoaded: true });
  } catch (err) {
    // L'album n'est pas critique, on garde ce qu'on avait.
    console.warn("Album indisponible", err);
  }
}

export function photoUrl(path) {
  if (!path) return null;
  const { data } = sb.storage.from(PHOTO_BUCKET).getPublicUrl(path);
  return data ? data.publicUrl : null;
}

// --------------------------------------------------------------- penalites

// Une penalite est d'abord posee sur l'appareil, immediatement, puis confirmee
// par le serveur. Le verrou local evite de pouvoir reprendre le quiz en
// rechargeant la page, et le verrou serveur est celui qui compte vraiment au
// moment de la soumission.
const LOCK_KEY = "anniviers2056.lockouts";

function readLocalLockouts() {
  try {
    const v = JSON.parse(localStorage.getItem(LOCK_KEY) || "[]");
    return Array.isArray(v) ? v.filter((l) => new Date(l.until) > new Date()) : [];
  } catch (err) {
    return [];
  }
}

function writeLocalLockouts(list) {
  const clean = list.filter((l) => new Date(l.until) > new Date());
  try {
    localStorage.setItem(LOCK_KEY, JSON.stringify(clean));
  } catch (err) {
    /* sans importance */
  }
  setState({ localLockouts: clean });
}

/** Fin de penalite pour une personne sur un defi, ou null si elle est libre. */
export function lockedUntil(participantId, challengeId) {
  if (!participantId) return null;
  const now = Date.now();
  let max = null;
  for (const l of state.lockouts) {
    if (l.participant_id === participantId && l.challenge_id === challengeId) {
      const t = new Date(l.until).getTime();
      if (t > now && (max === null || t > max)) max = t;
    }
  }
  for (const l of state.localLockouts) {
    if (l.participant_id === participantId && l.challenge_id === challengeId) {
      const t = new Date(l.until).getTime();
      if (t > now && (max === null || t > max)) max = t;
    }
  }
  return max ? new Date(max) : null;
}

export function myLockUntil(challengeId) {
  return state.me ? lockedUntil(state.me.id, challengeId) : null;
}

/**
 * Signale un quiz rate. La penalite frappe tout le groupe du moment. Elle est
 * posee localement tout de suite, puis envoyee au serveur, avec mise en file
 * d'attente si le reseau manque.
 */
export async function reportQuizFailure({ challengeId, memberIds }) {
  if (!state.me) return null;
  const clientId = uuid();
  const ids = Array.from(new Set([...(memberIds || []), state.me.id]));
  const until = new Date(Date.now() + state.lockoutMinutes * 60000).toISOString();

  // Verrou local immediat, pour tout de suite et meme sans reseau.
  writeLocalLockouts([
    ...state.localLockouts,
    ...ids.map((id) => ({ participant_id: id, challenge_id: challengeId, until }))
  ]);

  const item = {
    client_id: clientId,
    kind: "failure",
    challenge_id: challengeId,
    submitter_id: state.me.id,
    member_ids: ids,
    created_at: new Date().toISOString(),
    attempts: 0,
    last_error: null
  };
  await queue.put(item);
  await refreshPending();
  const res = await flushOne(item);
  await refreshPending();
  if (res.ok && res.data && res.data.until) {
    // On aligne le verrou local sur l'heure du serveur, qui fait foi.
    writeLocalLockouts([
      ...state.localLockouts.filter(
        (l) => !(l.challenge_id === challengeId && ids.includes(l.participant_id))
      ),
      ...ids.map((id) => ({
        participant_id: id,
        challenge_id: challengeId,
        until: res.data.until
      }))
    ]);
    refresh();
    return new Date(res.data.until);
  }
  return new Date(until);
}

// ------------------------------------------------------------- soumissions

function uuid() {
  if (crypto && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Enregistre une soumission. Elle est d'abord ecrite dans la file locale, puis
 * envoyee. Si l'envoi echoue faute de reseau, elle reste en attente et repart
 * automatiquement plus tard. Le retour indique si c'est parti tout de suite.
 */
export async function submit({ challengeId, memberIds, file, note, quizAttempts, quizRestarts }) {
  if (!state.me) throw new Error("Choisissez d'abord votre profil");
  const challenge = CHALLENGE_BY_ID[challengeId];
  if (!challenge) throw new Error("Défi inconnu");

  const clientId = uuid();
  let photo = null;
  let photoName = null;
  if (file) {
    const out = await compress(file);
    photo = out.blob;
    const ext = photo.type === "image/png" ? "png" : photo.type === "image/webp" ? "webp" : "jpg";
    photoName = `${clientId}.${ext}`;
  }

  const item = {
    client_id: clientId,
    challenge_id: challengeId,
    submitter_id: state.me.id,
    member_ids: Array.from(new Set([...(memberIds || []), state.me.id])),
    note: (note || "").trim() || null,
    quiz_attempts: quizAttempts || 0,
    quiz_restarts: quizRestarts || 0,
    photo,
    photo_name: photoName,
    photo_type: photo ? photo.type : null,
    created_at: new Date().toISOString(),
    attempts: 0,
    last_error: null
  };

  await queue.put(item);
  await refreshPending();

  const result = await flushOne(item);
  await refreshPending();
  if (result.ok) {
    await refresh({ feed: true });
    return { sent: true, result: result.data };
  }
  return { sent: false, error: result.error };
}

function probablyOffline() {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

async function flushOne(item) {
  // On tente meme si le dernier appel avait echoue : state.online n'est qu'une
  // indication, seul le navigateur sait vraiment si la radio est coupee.
  if (probablyOffline()) return { ok: false, error: "Pas de réseau" };
  try {
    if (item.kind === "failure") {
      const { data, error } = await sb.rpc("report_quiz_failure", {
        p_client_id: item.client_id,
        p_challenge_id: item.challenge_id,
        p_participant: item.submitter_id,
        p_member_ids: item.member_ids
      });
      if (error) throw error;
      await queue.remove(item.client_id);
      return { ok: true, data };
    }

    let path = null;
    if (item.photo && item.photo_name) {
      path = item.photo_name;
      const { error: upErr } = await sb.storage
        .from(PHOTO_BUCKET)
        .upload(path, item.photo, {
          contentType: item.photo_type || "image/jpeg",
          cacheControl: "31536000",
          upsert: false
        });
      if (upErr) {
        // Une photo deja presente signifie qu'un essai precedent avait abouti
        // pour l'envoi du fichier. On continue avec le meme chemin.
        const msg = String(upErr.message || upErr).toLowerCase();
        const already =
          msg.includes("already exists") ||
          msg.includes("duplicate") ||
          upErr.statusCode === "409" ||
          upErr.status === 409;
        if (!already) throw upErr;
      }
    }

    const { data, error } = await sb.rpc("submit_challenge", {
      p_client_id: item.client_id,
      p_challenge_id: item.challenge_id,
      p_submitter: item.submitter_id,
      p_member_ids: item.member_ids,
      p_photo_path: path,
      p_note: item.note,
      p_quiz_attempts: item.quiz_attempts,
      p_quiz_restarts: item.quiz_restarts || 0
    });
    if (error) throw error;

    await queue.remove(item.client_id);
    announceSynergies(data);
    return { ok: true, data };
  } catch (err) {
    const message = friendly(err);
    // Une erreur de donnees ne se resoudra pas en reessayant : on la signale et
    // on sort la soumission de la file pour ne pas boucler indefiniment.
    if (isPermanent(err)) {
      await queue.remove(item.client_id);
      setState({ toast: { kind: "error", text: `Soumission refusée : ${message}` } });
      return { ok: false, error: message, permanent: true };
    }
    const next = { ...item, attempts: (item.attempts || 0) + 1, last_error: message };
    await queue.put(next);
    return { ok: false, error: message };
  }
}

function isPermanent(err) {
  const msg = String((err && err.message) || err || "").toLowerCase();
  if (msg.includes("failed to fetch") || msg.includes("networkerror") || msg.includes("load failed")) {
    return false;
  }
  const code = err && (err.code || err.status);
  if (code === "PGRST301" || code === 401 || code === 403) return false;
  return (
    msg.includes("défi en attente") ||
    msg.includes("défi inconnu") ||
    msg.includes("profil introuvable") ||
    msg.includes("chemin de photo invalide") ||
    msg.includes("identifiant de soumission manquant")
  );
}

export async function flushQueue({ silent = true } = {}) {
  if (state.syncing) return;
  const items = await queue.all();
  if (!items.length) {
    if (!silent) setState({ toast: { kind: "info", text: "Rien en attente" } });
    return;
  }
  if (probablyOffline()) {
    if (!silent) setState({ toast: { kind: "info", text: "Toujours sans réseau" } });
    return;
  }
  setState({ syncing: true });
  let sent = 0;
  for (const item of items) {
    const res = await flushOne(item);
    if (res.ok) sent += 1;
    else if (!res.permanent) break; // reseau toujours absent, inutile d'insister
  }
  setState({ syncing: false });
  await refreshPending();
  if (sent > 0) {
    setState({
      toast: {
        kind: "success",
        text: sent === 1 ? "1 soumission envoyée" : `${sent} soumissions envoyées`
      }
    });
    await refresh({ feed: true });
  } else if (!silent) {
    setState({ toast: { kind: "info", text: "Envoi impossible pour le moment" } });
  }
}

export async function refreshPending() {
  const items = await queue.all();
  setState({
    pending: items.map((i) => ({
      client_id: i.client_id,
      kind: i.kind || "submission",
      challenge_id: i.challenge_id,
      created_at: i.created_at,
      attempts: i.attempts || 0,
      last_error: i.last_error || null,
      has_photo: Boolean(i.photo)
    }))
  });
}

export async function dropPending(clientId) {
  await queue.remove(clientId);
  await refreshPending();
  setState({ toast: { kind: "info", text: "Soumission en attente supprimée" } });
}

// --------------------------------------------------------------- synergies

const seenKey = "anniviers2056.seenSynergies";

function readSeen() {
  try {
    const v = JSON.parse(localStorage.getItem(seenKey) || "[]");
    return Array.isArray(v) ? v : [];
  } catch (err) {
    return [];
  }
}

function writeSeen(ids) {
  try {
    localStorage.setItem(seenKey, JSON.stringify(Array.from(new Set(ids))));
  } catch (err) {
    /* sans importance */
  }
}

function announceSynergies(result) {
  if (!result || !state.me) return;
  const seen = readSeen();
  const mine = (result.new_synergies || [])
    .filter((s) => s.participant_id === state.me.id)
    .filter((s) => !seen.includes(s.synergy_id));
  if (!mine.length) return;
  const items = mine.map((s) => SYNERGY_BY_ID[s.synergy_id]).filter(Boolean);
  if (!items.length) return;
  // Marque comme vue tout de suite, pour que la verification periodique ne
  // repropose pas la meme fenetre.
  writeSeen([...seen, ...mine.map((s) => s.synergy_id)]);
  setState({ synergyQueue: [...state.synergyQueue, ...items] });
}

export function dismissSynergy() {
  setState({ synergyQueue: state.synergyQueue.slice(1) });
}

// Verifie si des synergies ont ete debloquees pour moi sans que je l'aie vu,
// par exemple quand quelqu'un d'autre a soumis un defi avec moi dans le groupe.
export function checkSilentSynergies() {
  if (!state.me) return;
  const seen = readSeen();
  const mine = state.unlocks.filter((u) => u.participant_id === state.me.id).map((u) => u.synergy_id);
  const fresh = mine.filter((id) => !seen.includes(id));
  writeSeen([...seen, ...mine]);
  if (!fresh.length) return;
  const items = fresh.map((id) => SYNERGY_BY_ID[id]).filter(Boolean);
  if (items.length) setState({ synergyQueue: [...state.synergyQueue, ...items] });
}

// ------------------------------------------------------------ organisateur

export async function checkOrganizer(pin) {
  const { data, error } = await sb.rpc("check_organizer", { p_pin: pin });
  if (error) throw new Error(friendly(error));
  if (data === true) {
    try {
      sessionStorage.setItem(PIN_KEY, pin);
    } catch (err) {
      /* sans importance */
    }
    setState({ organizerPin: pin });
    return true;
  }
  return false;
}

export function forgetOrganizer() {
  try {
    sessionStorage.removeItem(PIN_KEY);
    localStorage.removeItem(PIN_KEY);
  } catch (err) {
    /* sans importance */
  }
  setState({ organizerPin: "" });
}

/** Photos devenues orphelines, retirees par l'API de stockage. */
async function purgePhotos(paths) {
  const liste = (paths || []).filter(Boolean);
  if (!liste.length) return;
  try {
    await sb.storage.from(PHOTO_BUCKET).remove(liste);
  } catch (err) {
    console.warn("Photos non retirées du stockage", err);
  }
}

export async function adminClearLockouts({ participantId, challengeId } = {}) {
  const { data, error } = await sb.rpc("admin_clear_lockouts", {
    p_pin: state.organizerPin,
    p_participant: participantId || null,
    p_challenge: challengeId || null
  });
  if (error) throw new Error(friendly(error));
  await refresh();
  const n = (data && data.levees) || 0;
  setState({
    toast: {
      kind: "success",
      text: n === 0 ? "Aucune attente à lever" : n === 1 ? "1 attente levée" : `${n} attentes levées`
    }
  });
  return n;
}

export async function adminRenameParticipant(id, first, last) {
  const { error } = await sb.rpc("admin_rename_participant", {
    p_pin: state.organizerPin,
    p_id: id,
    p_first: first,
    p_last: last
  });
  if (error) throw new Error(friendly(error));
  await refresh({ feed: true });
  setState({ toast: { kind: "success", text: "Profil renommé" } });
}

export async function adminDeleteParticipant(id) {
  const { data, error } = await sb.rpc("admin_delete_participant", {
    p_pin: state.organizerPin,
    p_id: id
  });
  if (error) throw new Error(friendly(error));
  await purgePhotos(data && data.photos);
  if (data && data.portrait) {
    try {
      await sb.storage.from(PORTRAIT_BUCKET).remove([data.portrait]);
    } catch (err) {
      console.warn("Portrait non retiré", err);
    }
  }
  await refresh({ feed: true });
  setState({ toast: { kind: "success", text: "Profil supprimé" } });
}

/** Remet le code d'un joueur qui l'a oublie. */
export async function adminResetCode(id, code) {
  const { error } = await sb.rpc("admin_reset_code", {
    p_pin: state.organizerPin,
    p_id: id,
    p_code: code
  });
  if (error) throw new Error(friendly(error));
  await refresh();
  setState({ toast: { kind: "success", text: "Code remplacé" } });
}

export async function adminResetGame(confirmation) {
  const { data, error } = await sb.rpc("admin_reset_game", {
    p_pin: state.organizerPin,
    p_confirmation: confirmation
  });
  if (error) throw new Error(friendly(error));
  await purgePhotos(data && data.photos);
  const portraits = (data && data.portraits) || [];
  if (portraits.length) {
    try {
      await sb.storage.from(PORTRAIT_BUCKET).remove(portraits);
    } catch (err) {
      console.warn("Portraits non retirés", err);
    }
  }
  try {
    localStorage.removeItem("anniviers2056.seenSynergies");
    localStorage.removeItem("anniviers2056.lockouts");
  } catch (err) {
    /* sans importance */
  }
  setState({ localLockouts: [] });
  await refresh({ feed: true });
  setState({ toast: { kind: "success", text: "Jeu remis à zéro" } });
  return data;
}

export async function adminSetLockoutMinutes(minutes) {
  const { data, error } = await sb.rpc("admin_set_lockout_minutes", {
    p_pin: state.organizerPin,
    p_minutes: minutes
  });
  if (error) throw new Error(friendly(error));
  await refresh();
  setState({ toast: { kind: "success", text: `Attente réglée sur ${data} minutes` } });
  return data;
}

export async function loadLockouts() {
  const { data, error } = await sb
    .from("v_lockouts")
    .select("*")
    .order("until", { ascending: true });
  if (error) throw new Error(friendly(error));
  return data || [];
}

export async function deleteSubmission(id) {
  const { data, error } = await sb.rpc("delete_submission", {
    p_submission: id,
    p_pin: state.organizerPin
  });
  if (error) throw new Error(friendly(error));

  // La soumission est partie, la photo est donc orpheline. Supabase interdit de
  // la supprimer en SQL, on passe par son API de stockage. Si cela echoue, la
  // photo reste dans le bucket sans plus apparaitre nulle part : sans gravite.
  await purgePhotos([data && data.photo_path]);
  await refresh({ feed: true });
  setState({ toast: { kind: "success", text: "Soumission supprimée" } });
}

// --------------------------------------------------------------- messages

export function friendly(err) {
  const raw = String((err && (err.message || err.error_description)) || err || "");
  if (/failed to fetch|networkerror|load failed|network request failed/i.test(raw)) {
    return "Pas de réseau pour le moment";
  }
  if (/duplicate key value .*participants_name_uniq/i.test(raw)) {
    return "Ce prénom et ce nom existent déjà dans la liste";
  }
  if (/jwt|apikey|invalid api key/i.test(raw)) {
    return "Problème de connexion au serveur";
  }
  if (/PGRST20[25]|schema cache|could not find the (table|function)/i.test(raw)) {
    return "Le serveur du jeu n'est pas encore prêt";
  }
  if (/row-level security|permission denied/i.test(raw)) {
    return "Action non autorisée";
  }
  const attente = raw.match(/Défi en attente jusqu'à (\d{2}:\d{2})/);
  if (attente) {
    return `Ce défi est encore en attente jusqu'à ${attente[1]}`;
  }
  return raw || "Une erreur est survenue";
}

export function clearToast() {
  if (state.toast) setState({ toast: null });
}

// --------------------------------------------------------- temps reel, boot

let channel = null;
let refreshTimer = null;

function scheduleRefresh() {
  if (refreshTimer) return;
  refreshTimer = setTimeout(() => {
    refreshTimer = null;
    refresh();
  }, 900);
}

let postsTimer = null;

function schedulePosts() {
  if (postsTimer) return;
  postsTimer = setTimeout(() => {
    postsTimer = null;
    refreshPosts();
  }, 700);
}

function connectRealtime() {
  if (channel) return;
  channel = sb
    .channel("jeu-anniviers")
    .on("postgres_changes", { event: "*", schema: "public", table: "submissions" }, scheduleRefresh)
    .on("postgres_changes", { event: "*", schema: "public", table: "submission_members" }, scheduleRefresh)
    .on("postgres_changes", { event: "*", schema: "public", table: "synergy_unlocks" }, () => {
      scheduleRefresh();
      setTimeout(checkSilentSynergies, 1500);
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "participants" }, scheduleRefresh)
    .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, schedulePosts)
    .on("postgres_changes", { event: "*", schema: "public", table: "post_kudos" }, schedulePosts)
    .on("postgres_changes", { event: "*", schema: "public", table: "post_comments" }, schedulePosts)
    .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, schedulePosts)
    .subscribe((status) => {
      setState({ realtime: status === "SUBSCRIBED" ? "en direct" : "reconnexion" });
    });
}

export async function boot() {
  window.addEventListener("online", () => {
    setState({ online: true });
    flushQueue();
    refresh();
  });
  window.addEventListener("offline", () => setState({ online: false, realtime: "hors ligne" }));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      flushQueue();
      refresh();
    }
  });

  await refreshPending();
  await refresh({ feed: true });
  // Une fois au demarrage, pour que la pastille de notifications soit juste
  // des la premiere seconde. Ensuite le temps reel s'en charge.
  refreshPosts();
  connectRealtime();
  checkSilentSynergies();
  setState({ booted: true });
  // Filet de securite : si toutes les donnees sont arrivees avant que
  // l'interface ne se soit abonnee, ce rappel tardif la remet a jour.
  setTimeout(notify, 300);

  // Quelqu'un qui rouvre l'application en retrouvant du reseau ne doit pas
  // attendre le prochain cycle : on vide la file tout de suite, en tache de fond.
  flushQueue();

  setInterval(() => {
    if (state.online) flushQueue();
  }, SYNC_INTERVAL_MS);
  setInterval(() => {
    if (state.online && document.visibilityState === "visible") refresh();
  }, POLL_INTERVAL_MS);
}

// ------------------------------------------------------------------ helpers

export function myDoneChallenges() {
  if (!state.me) return [];
  return state.done[state.me.id] || [];
}

export function myUnlocks() {
  if (!state.me) return [];
  return state.unlocks.filter((u) => u.participant_id === state.me.id).map((u) => u.synergy_id);
}

export function myScore() {
  if (!state.me) return null;
  return state.scores.find((s) => s.id === state.me.id) || null;
}

export function participantName(p) {
  if (!p) return "";
  return `${p.first_name} ${p.last_name}`.trim();
}

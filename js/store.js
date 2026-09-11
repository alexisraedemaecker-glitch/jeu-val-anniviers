// Etat global de l'application, connexion Supabase, temps reel et
// synchronisation de la file d'attente locale.

import {
  SUPABASE_URL,
  SUPABASE_KEY,
  PHOTO_BUCKET,
  SYNC_INTERVAL_MS,
  POLL_INTERVAL_MS
} from "./config.js";
import * as queue from "./queue.js";
import { compress } from "./image.js";
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
  return () => listeners.delete(fn);
}

export function notify() {
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = null;
    listeners.forEach((fn) => fn());
  });
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

export async function signIn(firstName, lastName, vibe) {
  const { data, error } = await sb.rpc("ensure_participant", {
    p_first: firstName,
    p_last: lastName,
    p_vibe: vibe || null
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
      loading: false,
      loadError: null,
      lastSync: new Date(),
      online: true
    });
    // Garde le profil local a jour si le prenom ou l'envie a change ailleurs.
    if (state.me) {
      const fresh = (data.scores || []).find((s) => s.id === state.me.id);
      if (fresh && (fresh.vibe !== state.me.vibe || fresh.first_name !== state.me.first_name)) {
        const me = {
          id: fresh.id,
          first_name: fresh.first_name,
          last_name: fresh.last_name,
          vibe: fresh.vibe
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
export async function submit({ challengeId, memberIds, file, note, quizAttempts }) {
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
      p_quiz_attempts: item.quiz_attempts
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

export async function deleteSubmission(id) {
  const { data, error } = await sb.rpc("delete_submission", {
    p_submission: id,
    p_pin: state.organizerPin
  });
  if (error) throw new Error(friendly(error));

  // La soumission est partie, la photo est donc orpheline. Supabase interdit de
  // la supprimer en SQL, on passe par son API de stockage. Si cela echoue, la
  // photo reste dans le bucket sans plus apparaitre nulle part : sans gravite.
  const path = data && data.photo_path;
  if (path) {
    try {
      await sb.storage.from(PHOTO_BUCKET).remove([path]);
    } catch (err) {
      console.warn("Photo non retirée du stockage", err);
    }
  }

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
  connectRealtime();
  checkSilentSynergies();
  setState({ booted: true });

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

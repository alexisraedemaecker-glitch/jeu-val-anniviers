// Mon profil, mes soumissions en attente, et l'entree vers la vue organisateur.
const { html, useState, useEffect, useMemo } = window.htmPreact;

import {
  state,
  myScore,
  myDoneChallenges,
  myUnlocks,
  updateVibe,
  setPortrait,
  setBio,
  activerPush,
  desactiverPush,
  rafraichirEtatPush,
  pushDisponible,
  signOut,
  flushQueue,
  dropPending,
  friendly
} from "../store.js";
import { STYLES } from "../data/pillars.js";
import { CHALLENGE_BY_ID, CHALLENGES } from "../data/challenges.js";
import { SYNERGIES } from "../data/synergies.js";
import { Banner, Spinner, Avatar, Empty, dateTimeShort } from "./bits.js";

/**
 * Notifications sur l'ecran verrouille. La demande doit partir d'un geste, et
 * sur iPhone elle n'est possible que depuis l'application ajoutee a l'ecran
 * d'accueil : on le dit plutot que de laisser un bouton qui ne fait rien.
 */
function Notifications() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    rafraichirEtatPush();
  }, []);

  if (!pushDisponible()) {
    return html`<div class="card">
      <h2>Notifications</h2>
      <p class="small muted">
        Ce navigateur ne sait pas afficher de notifications. Sur iPhone, ajoutez d'abord
        l'application à l'écran d'accueil avec le bouton Partager, puis rouvrez la depuis
        cette icône.
      </p>
    </div>`;
  }

  const etat = state.pushEtat;

  async function basculer() {
    setBusy(true);
    setError(null);
    try {
      if (etat === "actif") await desactiverPush();
      else await activerPush();
    } catch (err) {
      setError(friendly(err));
    } finally {
      setBusy(false);
    }
  }

  return html`<div class="card">
    <div class="card-head">
      <h2>Notifications</h2>
      ${etat === "actif" ? html`<span class="chip ok">Activées</span>` : null}
    </div>
    <p class="small muted">
      Pour être prévenu quand quelqu'un vous nomme dans le fil, valide un défi avec vous,
      applaudit ou commente votre publication. Elles s'affichent sur l'écran verrouillé, même
      application fermée.
    </p>
    ${error ? html`<${Banner} kind="bad">${error}<//>` : null}
    ${etat === "refusé"
      ? html`<${Banner} kind="warn">
          Les notifications ont été refusées sur cet appareil. Pour les rétablir, passez par les
          réglages du téléphone, à la ligne de ce site ou de cette application.
        <//>`
      : html`<button class=${"btn block" + (etat === "actif" ? " quiet" : "")}
               disabled=${busy} onClick=${basculer}>
          ${busy ? html`<${Spinner} dark=${etat === "actif"} />` : null}
          ${etat === "actif" ? "Couper les notifications" : "Activer les notifications"}
        </button>`}
    <p class="tiny faint" style="margin-top:.6rem">
      Sur iPhone, elles ne fonctionnent que depuis l'application ajoutée à l'écran d'accueil.
      Sur Android, depuis le navigateur comme depuis l'application.
    </p>
  </div>`;
}

/**
 * Qui joue. Une ligne par personne, triee par prenom, avec sa description en
 * deux mots. Un appui ouvre son profil.
 */
function LesJoueurs({ go }) {
  const [cherche, setCherche] = useState("");

  const gens = useMemo(() => {
    const q = cherche.trim().toLowerCase();
    const liste = (state.scores || [])
      .slice()
      .sort((a, b) =>
        `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`, "fr")
      );
    if (!q) return liste;
    return liste.filter((p) =>
      `${p.first_name} ${p.last_name} ${p.bio || ""}`.toLowerCase().includes(q)
    );
  }, [state.scores, cherche]);

  return html`<div class="card">
    <div class="card-head">
      <h2>Qui joue</h2>
      <span class="chip plain">${(state.scores || []).length}</span>
    </div>
    ${(state.scores || []).length > 8
      ? html`<input type="search" placeholder="Chercher quelqu'un" value=${cherche}
               onInput=${(e) => setCherche(e.target.value)} style="margin-bottom:.5rem" />`
      : null}
    ${gens.length === 0
      ? html`<p class="small muted">Personne d'autre pour le moment.</p>`
      : html`<div class="rank">
          ${gens.map(
            (p) => html`<button key=${p.id}
              class=${"rank-row" + (state.me && p.id === state.me.id ? " me" : "")}
              onClick=${() => go("#/profil/" + p.id)}>
              <${Avatar} p=${p} taille="sm" />
              <span class="rank-name">
                ${p.first_name} ${p.last_name}
                ${p.bio ? html`<small>${p.bio}</small>` : null}
              </span>
              <span class="faint" style="font-size:1.1rem">›</span>
            </button>`
          )}
        </div>`}
  </div>`;
}

export function Me({ go }) {
  const me = state.me;
  const score = myScore();
  const done = myDoneChallenges();
  const unlocked = myUnlocks();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [bio, setBioTexte] = useState((score && score.bio) || me.bio || "");
  const [bioBusy, setBioBusy] = useState(false);
  const bioEnregistree = (score && score.bio) || me.bio || "";
  // Le portrait peut avoir ete ajoute depuis un autre appareil : la ligne de
  // score est toujours la source la plus fraiche.
  const portrait = { ...me, photo_path: (score && score.photo_path) || me.photo_path };

  async function changerPhoto(f) {
    if (!f) return;
    setPhotoBusy(true);
    setError(null);
    try {
      await setPortrait(f);
    } catch (err) {
      setError(friendly(err));
    } finally {
      setPhotoBusy(false);
    }
  }

  async function enregistrerBio(e) {
    e.preventDefault();
    setBioBusy(true);
    setError(null);
    try {
      await setBio(bio);
    } catch (err) {
      setError(friendly(err));
    } finally {
      setBioBusy(false);
    }
  }

  async function pickVibe(v) {
    setBusy(true);
    setError(null);
    try {
      await updateVibe(v === me.vibe ? "" : v);
    } catch (err) {
      setError(friendly(err));
    } finally {
      setBusy(false);
    }
  }

  return html`<div class="stack">
    <div class="card">
      <div class="row" style="gap:.8rem;align-items:center;margin-bottom:.6rem">
        <${Avatar} p=${portrait} taille="lg" />
        <div class="grow">
          <div class="tiny faint">Votre profil</div>
          <h1 style="margin:.1rem 0 .2rem">${me.first_name} ${me.last_name}</h1>
          <label class="btn sm quiet" style="display:inline-flex">
            ${photoBusy ? html`<${Spinner} dark=${true} />` : null}
            ${portrait.photo_path ? "Changer ma photo" : "Ajouter ma photo"}
            <input type="file" accept="image/*" style="display:none" disabled=${photoBusy}
                   onChange=${(e) => changerPhoto(e.target.files && e.target.files[0])} />
          </label>
        </div>
      </div>
      <div class="spread">
        <div class="center grow">
          <div class="tiny faint">Score</div>
          <div style="font-size:1.5rem;font-weight:800">${score ? score.score : 0}</div>
        </div>
        <div class="center grow">
          <div class="tiny faint">Défis validés</div>
          <div style="font-size:1.5rem;font-weight:800">${done.length}<span class="tiny faint"> / ${CHALLENGES.length}</span></div>
        </div>
        <div class="center grow">
          <div class="tiny faint">Découvertes</div>
          <div style="font-size:1.5rem;font-weight:800">${unlocked.length}<span class="tiny faint"> / ${SYNERGIES.length}</span></div>
        </div>
      </div>
    </div>

    ${error ? html`<${Banner} kind="bad">${error}<//>` : null}

    <div class="card">
      <h2>Votre envie du moment</h2>
      <p class="small muted">
        Purement informatif, modifiable autant de fois que vous voulez. Cela ne limite aucun défi.
      </p>
      <div class="filters">
        ${STYLES.map(
          (s) => html`<button key=${s.id} disabled=${busy}
            class=${"fbtn" + (me.vibe === s.id ? " on" : "")} onClick=${() => pickVibe(s.id)}>
            ${s.icon} ${s.label}
          </button>`
        )}
      </div>
    </div>

    <${Pending} />

    <div class="card">
      <h2>Vos défis validés</h2>
      ${done.length === 0
        ? html`<p class="small muted">Aucun pour l'instant. Choisissez un défi et lancez vous.</p>`
        : html`<div class="stack">
            ${done
              .map((id) => CHALLENGE_BY_ID[id])
              .filter(Boolean)
              .sort((a, b) => a.name.localeCompare(b.name, "fr"))
              .map(
                (c) => html`<button key=${c.id} class="row" style="width:100%;text-align:left;background:none;border:0;padding:.3rem 0"
                    onClick=${() => go(`#/defi/${c.id}`)}>
                  <span class="chip ok">✓</span>
                  <span class="grow">${c.name}</span>
                  <span class="tiny faint nowrap">${c.points} pts</span>
                </button>`
              )}
          </div>`}
    </div>

    <form class="card" onSubmit=${enregistrerBio}>
      <h2>Votre description</h2>
      <p class="small muted">
        Deux lignes sur vous, visibles par les autres joueurs quand ils ouvrent votre profil.
        Ce que vous voulez : votre lien avec la vallée, ce que vous cherchez ce week end, une
        bêtise.
      </p>
      <textarea rows="3" maxlength="280" value=${bio}
                placeholder="Par exemple : je viens pour les fromages et les histoires de mineurs"
                onInput=${(e) => setBioTexte(e.target.value)}></textarea>
      <div class="row" style="gap:.5rem;margin-top:.5rem;align-items:center">
        <button class="btn sm" type="submit" disabled=${bioBusy || bio === bioEnregistree}>
          ${bioBusy ? html`<${Spinner} />` : null} Enregistrer
        </button>
        <span class="tiny faint">${280 - bio.length} caractères restants</span>
        <span class="grow"></span>
        <button class="btn sm quiet" type="button" onClick=${() => go("#/profil/" + me.id)}>
          Voir mon profil
        </button>
      </div>
    </form>

    <${LesJoueurs} go=${go} />

    <${Notifications} />

    <div class="card">
      <h2>Réglages</h2>
      <button class="btn ghost block" onClick=${() => go("#/organisateur")}>
        Administration
      </button>
      <div style="height:.5rem"></div>
      <button class="btn quiet block" onClick=${() => {
        if (confirm("Changer de profil ? Vos points restent enregistrés, vous devrez simplement vous réidentifier.")) {
          signOut();
          go("#/");
        }
      }}>Changer de profil</button>
      <p class="tiny faint" style="margin-top:.6rem">
        ${state.lastSync ? `Dernière mise à jour à ${dateTimeShort(state.lastSync.toISOString())}.` : ""}${" "}
        Temps réel ${state.realtime}.
      </p>
    </div>
  </div>`;
}

export function Pending() {
  const items = state.pending;
  if (!items.length) return null;
  return html`<div class="card" style="border-color:#e3c98f;background:var(--warn-soft)">
    <div class="card-head">
      <h2 class="grow">En attente d'envoi</h2>
      <span class="chip warn">${items.length}</span>
    </div>
    <p class="small" style="color:#6c4511">
      Ces soumissions sont enregistrées sur votre téléphone et partiront automatiquement dès que le
      réseau revient. Vous pouvez fermer l'application sans rien perdre.
    </p>
    <div class="stack">
      ${items.map((i) => {
        const c = CHALLENGE_BY_ID[i.challenge_id];
        return html`<div key=${i.client_id} class="row" style="gap:.5rem">
          <span class="grow">
            <strong>${c ? c.name : i.challenge_id}</strong>
            <div class="tiny" style="color:#6c4511">
              ${dateTimeShort(i.created_at)}
              ${i.has_photo ? " · avec photo" : ""}
              ${i.attempts > 0 ? ` · ${i.attempts} ${i.attempts === 1 ? "essai" : "essais"}` : ""}
            </div>
          </span>
          <button class="btn sm danger ghost" onClick=${() => {
            if (confirm("Abandonner définitivement cette soumission en attente ?")) dropPending(i.client_id);
          }}>Retirer</button>
        </div>`;
      })}
    </div>
    <hr class="sep" />
    <button class="btn block" disabled=${state.syncing || !state.online}
            onClick=${() => flushQueue({ silent: false })}>
      ${state.syncing ? html`<${Spinner} />` : null}
      ${state.online ? "Essayer d'envoyer maintenant" : "Pas de réseau"}
    </button>
  </div>`;
}

// Mon profil, mes soumissions en attente, et l'entree vers la vue organisateur.
const { html, useState } = window.htmPreact;

import {
  state,
  myScore,
  myDoneChallenges,
  myUnlocks,
  updateVibe,
  signOut,
  flushQueue,
  dropPending,
  friendly
} from "../store.js";
import { STYLES } from "../data/pillars.js";
import { CHALLENGE_BY_ID, CHALLENGES } from "../data/challenges.js";
import { SYNERGIES } from "../data/synergies.js";
import { Banner, Spinner, dateTimeShort } from "./bits.js";

export function Me({ go }) {
  const me = state.me;
  const score = myScore();
  const done = myDoneChallenges();
  const unlocked = myUnlocks();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

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
      <div class="tiny faint">Votre profil</div>
      <h1 style="margin:.1rem 0 .5rem">${me.first_name} ${me.last_name}</h1>
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
        ${state.lastSync ? `Dernière mise à jour à ${dateTimeShort(state.lastSync.toISOString())}.` : ""}
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

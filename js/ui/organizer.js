// Vue organisateur : toutes les soumissions de la journee avec leurs photos,
// et la possibilite d'en supprimer une lors de la relecture de fin de journee.
const { html, useState, useEffect, useMemo } = window.htmPreact;

import {
  state,
  photoUrl,
  refreshFeed,
  checkOrganizer,
  forgetOrganizer,
  deleteSubmission,
  friendly
} from "../store.js";
import { PILLARS, PILLAR_BY_ID } from "../data/pillars.js";
import { CHALLENGES } from "../data/challenges.js";
import { Banner, Spinner, Empty, dateTimeShort, pillarColor } from "./bits.js";

export function Organizer({ go }) {
  if (!state.organizerPin) return html`<${Gate} />`;
  return html`<${Panel} go=${go} />`;
}

function Gate() {
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function check(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const ok = await checkOrganizer(pin);
      if (!ok) setError("Code incorrect");
    } catch (err) {
      setError(friendly(err));
    } finally {
      setBusy(false);
    }
  }

  return html`<form class="card" onSubmit=${check}>
    <h1>Vue organisateur</h1>
    <p class="small muted">
      Cette page liste toutes les soumissions de la journée avec leurs photos, pour la relecture de
      fin de journée. Elle demande le code organisateur.
    </p>
    ${error ? html`<${Banner} kind="bad">${error}<//>` : null}
    <label class="field">
      <span>Code organisateur</span>
      <input type="tel" inputmode="numeric" autocomplete="off" value=${pin}
             onInput=${(e) => setPin(e.target.value)} />
    </label>
    <button class="btn block" type="submit" disabled=${busy || !pin}>
      ${busy ? html`<${Spinner} />` : null} Ouvrir
    </button>
  </form>`;
}

function Panel({ go }) {
  const [pillar, setPillar] = useState("");
  const [challenge, setChallenge] = useState("");
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    refreshFeed();
  }, []);

  const rows = useMemo(() => {
    return state.feed.filter((f) => {
      if (pillar && f.pillar !== pillar) return false;
      if (challenge && f.challenge_id !== challenge) return false;
      return true;
    });
  }, [state.feed, pillar, challenge]);

  const totals = useMemo(() => {
    const withPhoto = state.feed.filter((f) => f.photo_path).length;
    const people = new Set();
    state.feed.forEach((f) => (f.member_ids || []).forEach((id) => people.add(id)));
    return { all: state.feed.length, withPhoto, people: people.size };
  }, [state.feed]);

  async function remove(f) {
    const who = (f.member_names || []).join(", ") || f.submitter_name;
    if (!confirm(`Supprimer la soumission de « ${f.challenge_name} » par ${who} ?\n\nLes points et la photo seront retirés, et les jauges se recalculeront.`)) {
      return;
    }
    setBusy(f.id);
    setError(null);
    try {
      await deleteSubmission(f.id);
    } catch (err) {
      setError(friendly(err));
    } finally {
      setBusy(null);
    }
  }

  return html`<div class="stack">
    <div class="card">
      <div class="card-head">
        <h1 class="grow" style="margin:0">Vue organisateur</h1>
        <button class="btn sm quiet" onClick=${() => { forgetOrganizer(); go("#/moi"); }}>Fermer</button>
      </div>
      <div class="spread" style="margin-top:.5rem">
        <div class="center grow">
          <div class="tiny faint">Soumissions</div>
          <div style="font-size:1.4rem;font-weight:800">${totals.all}</div>
        </div>
        <div class="center grow">
          <div class="tiny faint">Avec photo</div>
          <div style="font-size:1.4rem;font-weight:800">${totals.withPhoto}</div>
        </div>
        <div class="center grow">
          <div class="tiny faint">Joueurs actifs</div>
          <div style="font-size:1.4rem;font-weight:800">${totals.people}</div>
        </div>
      </div>
    </div>

    ${error ? html`<${Banner} kind="bad">${error}<//>` : null}

    <div class="filters">
      <button class=${"fbtn" + (pillar === "" ? " on" : "")} onClick=${() => { setPillar(""); setChallenge(""); }}>
        Tous
      </button>
      ${PILLARS.map(
        (p) => html`<button key=${p.id} class=${"fbtn" + (pillar === p.id ? " on" : "")}
          onClick=${() => { setPillar(p.id); setChallenge(""); }}>${p.icon} ${p.short}</button>`
      )}
    </div>

    <label class="field">
      <span>Filtrer par défi</span>
      <select value=${challenge} onChange=${(e) => setChallenge(e.target.value)}>
        <option value="">Tous les défis</option>
        ${CHALLENGES.filter((c) => !pillar || c.pillar === pillar).map(
          (c) => html`<option key=${c.id} value=${c.id}>${c.name}</option>`
        )}
      </select>
    </label>

    <div class="row" style="margin-bottom:.3rem">
      <span class="tiny faint grow">
        ${rows.length} ${rows.length === 1 ? "soumission" : "soumissions"} affichées,
        de la plus récente à la plus ancienne
      </span>
      <button class="btn sm quiet" onClick=${() => refreshFeed()}>Rafraîchir</button>
    </div>

    ${rows.length === 0
      ? html`<${Empty} icon="📋">Aucune soumission ne correspond.<//>`
      : rows.map((f) => {
          const p = PILLAR_BY_ID[f.pillar];
          const url = photoUrl(f.photo_path);
          return html`<div key=${f.id} class="card" style=${{ borderLeft: "5px solid " + pillarColor(f.pillar) }}>
            <div class="spread" style="align-items:flex-start">
              <div class="grow">
                <h3 style="margin:0">${f.challenge_name}</h3>
                <div class="tiny faint">${dateTimeShort(f.created_at)} · envoyé par ${f.submitter_name}</div>
              </div>
              <span class="chip plain nowrap">${f.points} pts</span>
            </div>
            <div class="row wrap" style="margin:.45rem 0">
              <span class="chip plain"><i class="pill-dot" style=${{ background: pillarColor(f.pillar) }}></i>${p ? p.short : f.pillar}</span>
              <span class="chip plain">passage ${f.repeat_index}</span>
              <span class="chip plain">jauge +${Number(f.gauge_points || 0)}</span>
              ${f.quiz_attempts > 0 ? html`<span class="chip plain">${f.quiz_attempts} réponses données</span>` : null}
              ${f.quiz_restarts > 0
                ? html`<span class="chip warn">${f.quiz_restarts} ${f.quiz_restarts === 1 ? "reprise" : "reprises"} du quiz</span>`
                : f.quiz_attempts > 0
                  ? html`<span class="chip ok">sans faute</span>`
                  : null}
              ${!f.photo_path ? html`<span class="chip warn">sans photo</span>` : null}
            </div>
            <div class="small">
              <strong>Groupe du moment (${(f.member_names || []).length})</strong>
              <div class="muted">${(f.member_names || []).join(", ") || "non renseigné"}</div>
            </div>
            ${f.note ? html`<div class="note-block" style="margin-top:.5rem">${f.note}</div>` : null}
            ${url
              ? html`<div class="photo-prev" style="margin-top:.6rem">
                  <a href=${url} target="_blank" rel="noopener noreferrer">
                    <img src=${url} alt=${f.challenge_name} loading="lazy" />
                  </a>
                </div>`
              : null}
            <hr class="sep" />
            <button class="btn sm danger ghost block" disabled=${busy === f.id}
                    onClick=${() => remove(f)}>
              ${busy === f.id ? html`<${Spinner} dark=${true} />` : null} Supprimer cette soumission
            </button>
          </div>`;
        })}
  </div>`;
}

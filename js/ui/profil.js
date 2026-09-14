// Le profil d'un autre joueur.
//
// On y arrive en touchant un nom ou un portrait, dans le fil comme dans le
// classement. On y trouve qui c'est, ce qu'il a fait de sa journee, et ses
// publications.
const { html, useEffect, useMemo } = window.htmPreact;

import { state, refreshPosts, photoUrl } from "../store.js";
import { CHALLENGE_BY_ID, CHALLENGES } from "../data/challenges.js";
import { SYNERGIES } from "../data/synergies.js";
import { STYLE_BY_ID } from "../data/pillars.js";
import { Avatar, Empty, Spinner, dateTimeShort, pillarColor } from "./bits.js";

export function Profil({ id, go }) {
  useEffect(() => {
    if (!state.postsLoaded) refreshPosts();
  }, []);

  const p = state.scores.find((s) => s.id === id);

  const publications = useMemo(
    () => (state.posts || []).filter((x) => x.author_id === id).slice(0, 12),
    [state.posts, id]
  );

  if (!p) {
    return html`<div class="stack">
      <${Empty} icon="🙋">
        Ce profil n'est pas encore chargé, ou il a été retiré par l'organisateur.
      <//>
      <button class="btn quiet block" onClick=${() => go("#/classement")}>Retour au classement</button>
    </div>`;
  }

  const faits = state.done[p.id] || [];
  const decouvertes = (state.unlocks || []).filter((u) => u.participant_id === p.id);
  const style = p.vibe ? STYLE_BY_ID[p.vibe] : null;
  const cestMoi = state.me && state.me.id === p.id;

  return html`<div class="stack">
    <div class="card">
      <div class="row" style="gap:.9rem;align-items:center">
        <${Avatar} p=${p} taille="xl" />
        <div class="grow">
          <h1 style="margin:0 0 .2rem">${p.first_name} ${p.last_name}</h1>
          ${style ? html`<span class="chip plain">${style.icon} ${style.label}</span>` : null}
          ${cestMoi ? html`<span class="chip ok">C'est vous</span>` : null}
        </div>
      </div>
      ${p.bio
        ? html`<p class="small" style="margin:.8rem 0 0;white-space:pre-wrap">${p.bio}</p>`
        : cestMoi
          ? html`<p class="tiny faint" style="margin:.8rem 0 0">
              Vous n'avez pas encore écrit de description. Elle se règle dans l'onglet Moi.
            </p>`
          : null}
    </div>

    <div class="card">
      <div class="spread">
        <div class="center grow">
          <div class="tiny faint">Score</div>
          <div style="font-size:1.5rem;font-weight:800">${p.score}</div>
        </div>
        <div class="center grow">
          <div class="tiny faint">Défis validés</div>
          <div style="font-size:1.5rem;font-weight:800">
            ${p.defis_faits}<span class="tiny faint"> / ${CHALLENGES.length}</span>
          </div>
        </div>
        <div class="center grow">
          <div class="tiny faint">Découvertes</div>
          <div style="font-size:1.5rem;font-weight:800">
            ${p.synergies_debloquees}<span class="tiny faint"> / ${SYNERGIES.length}</span>
          </div>
        </div>
      </div>
    </div>

    ${faits.length
      ? html`<div class="card">
          <h2>Ses défis</h2>
          <div class="rank" style="margin-top:.4rem">
            ${faits
              .map((cid) => CHALLENGE_BY_ID[cid])
              .filter(Boolean)
              .map(
                (c) => html`<button key=${c.id} class="rank-row" style="text-align:left"
                  onClick=${() => go("#/defi/" + c.id)}>
                  <i class="pill-dot" style=${{ background: pillarColor(c.pillar) }}></i>
                  <span class="rank-name">${c.name}</span>
                  <span class="rank-pts">${c.points}</span>
                </button>`
              )}
          </div>
        </div>`
      : null}

    <div class="card">
      <h2>Ses publications</h2>
      ${!state.postsLoaded && !publications.length
        ? html`<p class="muted small row"><${Spinner} dark=${true} /> Chargement<//>`
        : publications.length === 0
          ? html`<p class="small muted">Rien publié pour le moment.</p>`
          : html`<div class="mini-posts">
              ${publications.map(
                (x) => html`<div key=${x.id} class="mini-post">
                  ${x.photo_path
                    ? html`<img src=${photoUrl(x.photo_path)} alt="" loading="lazy" />`
                    : null}
                  <div class="grow">
                    <div class="tiny faint">${dateTimeShort(x.created_at)}</div>
                    <div class="small">
                      ${x.genre === "defi" ? x.challenge_name : x.texte || "Photo du week end"}
                    </div>
                  </div>
                </div>`
              )}
            </div>`}
      <button class="btn sm quiet block" style="margin-top:.6rem" onClick=${() => go("#/fil")}>
        Voir tout le fil
      </button>
    </div>
  </div>`;
}

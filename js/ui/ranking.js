// Classement individuel en direct, et les synergies debloquees.
const { html, useState } = window.htmPreact;

import { state, myUnlocks, myDoneChallenges } from "../store.js";
import { SYNERGIES } from "../data/synergies.js";
import { CHALLENGE_BY_ID } from "../data/challenges.js";
import { PILLAR_BY_ID } from "../data/pillars.js";
import { Empty, Spinner, pillarColor } from "./bits.js";

export function Ranking() {
  const [tab, setTab] = useState("classement");
  return html`<div>
    <div class="filters">
      <button class=${"fbtn" + (tab === "classement" ? " on" : "")} onClick=${() => setTab("classement")}>
        Classement
      </button>
      <button class=${"fbtn" + (tab === "synergies" ? " on" : "")} onClick=${() => setTab("synergies")}>
        Mes découvertes
      </button>
    </div>
    ${tab === "classement" ? html`<${Board} />` : html`<${Synergies} />`}
  </div>`;
}

function Board() {
  const rows = state.scores.slice().sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.defis_faits !== a.defis_faits) return b.defis_faits - a.defis_faits;
    return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`, "fr");
  });

  if (state.loading && !rows.length) {
    return html`<div class="card"><p class="muted small row"><${Spinner} dark=${true} /> Chargement<//></p></div>`;
  }
  if (!rows.length) {
    return html`<${Empty} icon="🏅">Personne n'est encore enregistré.<//>`;
  }

  // Les ex aequo partagent la meme place.
  let place = 0;
  let prev = null;
  const ranked = rows.map((r, i) => {
    if (prev === null || r.score !== prev) {
      place = i + 1;
      prev = r.score;
    }
    return { ...r, place };
  });

  const mine = state.me ? ranked.find((r) => r.id === state.me.id) : null;

  return html`<div>
    ${mine
      ? html`<div class="card">
          <div class="spread">
            <div>
              <div class="tiny faint">Votre position</div>
              <div style="font-size:1.3rem;font-weight:800">
                ${mine.place}${mine.place === 1 ? "er" : "e"} sur ${ranked.length}
              </div>
            </div>
            <div class="center">
              <div class="tiny faint">Score</div>
              <div style="font-size:1.3rem;font-weight:800">${mine.score}</div>
            </div>
            <div class="center">
              <div class="tiny faint">Défis</div>
              <div style="font-size:1.3rem;font-weight:800">${mine.defis_faits}</div>
            </div>
            <div class="center">
              <div class="tiny faint">Découvertes</div>
              <div style="font-size:1.3rem;font-weight:800">${mine.synergies_debloquees}</div>
            </div>
          </div>
        </div>`
      : null}

    <div class="rank">
      ${ranked.map(
        (r) => html`<div key=${r.id} class=${"rank-row" + (state.me && r.id === state.me.id ? " me" : "")}>
          <span class="rank-pos">${r.place}</span>
          <span class="rank-name">${r.first_name} ${r.last_name}</span>
          ${r.synergies_debloquees > 0
            ? html`<span class="chip ok tiny">✦ ${r.synergies_debloquees}</span>`
            : null}
          <span class="tiny faint nowrap">${r.defis_faits} ${r.defis_faits === 1 ? "défi" : "défis"}</span>
          <span class="rank-pts">${r.score}</span>
        </div>`
      )}
    </div>
    <p class="tiny faint center" style="margin-top:.7rem">
      Chaque personne présente dans un groupe du moment reçoit les points pleins du défi. Un même
      défi ne compte qu'une fois par personne.
    </p>
  </div>`;
}

function Synergies() {
  const unlocked = myUnlocks();
  const done = myDoneChallenges();

  if (!state.me) {
    return html`<${Empty} icon="🔒">Identifiez vous pour voir vos découvertes.<//>`;
  }

  const any = unlocked.length > 0;

  return html`<div class="stack">
    <div class="card">
      <div class="card-head">
        <h2>Vos découvertes</h2>
        <span class=${"chip" + (any ? " ok" : "")}>${unlocked.length} sur ${SYNERGIES.length}</span>
      </div>
      <p class="small muted">
        Certaines paires de défis, mises bout à bout, révèlent quelque chose de plus. Elles se
        déclenchent toutes seules quand vous avez personnellement fait les deux. Chacune vaut
        10 points pour vous et 5 points sur chacune des deux jauges concernées.
      </p>
    </div>

    ${SYNERGIES.map((s) => {
      const got = unlocked.includes(s.id);
      const hasA = s.triggers_a.some((t) => done.includes(t));
      const hasB = s.triggers_b.some((t) => done.includes(t));
      const pa = PILLAR_BY_ID[s.pillar_a];
      const pb = PILLAR_BY_ID[s.pillar_b];
      return html`<div key=${s.id} class=${"card syn-card" + (got ? "" : " locked")}
          style=${{ borderLeftColor: pillarColor(s.pillar_a) }}>
        <div class="card-head">
          <h3 class="grow">${got ? s.name : "Découverte non révélée"}</h3>
          ${got ? html`<span class="chip ok">✦ Débloquée</span>` : html`<span class="chip plain">${(hasA ? 1 : 0) + (hasB ? 1 : 0)} sur 2</span>`}
        </div>
        <div class="syn-steps">
          <div class=${"syn-step" + (hasA ? " done" : "")}>
            <span class="mk">${hasA ? "✓" : ""}</span>
            <span class="grow">${names(s.triggers_a)}</span>
          </div>
          <div class=${"syn-step" + (hasB ? " done" : "")}>
            <span class="mk">${hasB ? "✓" : ""}</span>
            <span class="grow">${names(s.triggers_b)}</span>
          </div>
        </div>
        ${got
          ? html`<div>
              <hr class="sep" />
              <p class="small">${s.story}</p>
              ${s.bonus_learning
                ? html`<div class="modal learn" style="box-shadow:none;padding:.6rem;border-radius:9px">
                    ${s.bonus_learning}
                  </div>`
                : null}
              <div class="row wrap" style="margin-top:.6rem">
                <span class="chip ok">+10 pour vous</span>
                <span class="chip plain">+5 ${pa ? pa.short : s.pillar_a}</span>
                <span class="chip plain">+5 ${pb ? pb.short : s.pillar_b}</span>
              </div>
            </div>`
          : html`<p class="tiny faint" style="margin-top:.5rem">
              Faites l'un de chaque ligne et le récit se révélera.
            </p>`}
      </div>`;
    })}
  </div>`;
}

function names(ids) {
  return ids
    .map((id) => (CHALLENGE_BY_ID[id] ? CHALLENGE_BY_ID[id].name : id))
    .join(" ou ");
}

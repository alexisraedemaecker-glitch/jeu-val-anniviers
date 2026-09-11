// Liste des defis, filtrable par pilier et par style.
const { html, useState, useMemo } = window.htmPreact;

import { CHALLENGES } from "../data/challenges.js";
import { PILLARS, STYLES, PILLAR_BY_ID } from "../data/pillars.js";
import { state, myDoneChallenges } from "../store.js";
import { Empty, pillarColor } from "./bits.js";

export function ChallengeList({ go }) {
  const [pillar, setPillar] = useState("");
  const [style, setStyle] = useState("");
  const [search, setSearch] = useState("");
  const [hideDone, setHideDone] = useState(false);

  const done = myDoneChallenges();

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return CHALLENGES.filter((c) => {
      if (pillar && c.pillar !== pillar) return false;
      if (style && c.style !== style) return false;
      if (hideDone && done.includes(c.id)) return false;
      if (q) {
        const hay = `${c.name} ${c.brief} ${c.location_detail || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [pillar, style, search, hideDone, done.join(",")]);

  return html`<div>
    <div class="filters">
      <button class=${"fbtn" + (pillar === "" ? " on" : "")} onClick=${() => setPillar("")}>
        Tous les piliers
      </button>
      ${PILLARS.map(
        (p) => html`<button key=${p.id} class=${"fbtn" + (pillar === p.id ? " on" : "")}
          onClick=${() => setPillar(p.id)}>${p.icon} ${p.short}</button>`
      )}
    </div>
    <div class="filters">
      <button class=${"fbtn" + (style === "" ? " on" : "")} onClick=${() => setStyle("")}>
        Tous les styles
      </button>
      ${STYLES.map(
        (s) => html`<button key=${s.id} class=${"fbtn" + (style === s.id ? " on" : "")}
          onClick=${() => setStyle(s.id)}>${s.icon} ${s.label}</button>`
      )}
    </div>

    <div class="row" style="margin-bottom:.7rem; gap:.45rem">
      <input class="grow" type="search" placeholder="Chercher un défi" value=${search}
             onInput=${(e) => setSearch(e.target.value)} />
      <button class=${"fbtn" + (hideDone ? " on" : "")} onClick=${() => setHideDone(!hideDone)}
              title="Masquer les défis que j'ai déjà validés">
        ${hideDone ? "Restants" : "Tous"}
      </button>
    </div>

    <p class="tiny faint" style="margin-bottom:.6rem">
      ${list.length} ${list.length === 1 ? "défi" : "défis"} sur ${CHALLENGES.length}.
      Vous en avez validé ${done.length}.
    </p>

    ${list.length === 0
      ? html`<${Empty} icon="🔍">Aucun défi avec ces filtres. Élargissez votre recherche.<//>`
      : html`<div class="challenge-list">
          ${list.map((c) => html`<${Row} key=${c.id} c=${c} done=${done.includes(c.id)} go=${go} />`)}
        </div>`}
  </div>`;
}

function Row({ c, done, go }) {
  const passages = state.stats[c.id] || 0;
  const p = PILLAR_BY_ID[c.pillar];
  return html`<button class=${"ch" + (done ? " done" : "")}
      style=${{ borderLeftColor: pillarColor(c.pillar) }}
      onClick=${() => go(`#/defi/${c.id}`)}>
    <div class="spread" style="align-items:flex-start">
      <h3 class="grow">${c.name}</h3>
      <span class="pts nowrap">${c.points} pts</span>
    </div>
    <div class="meta">
      <span class="chip plain"><i class="pill-dot" style=${{ background: pillarColor(c.pillar) }}></i>${p ? p.short : c.pillar}</span>
      <span class="chip plain">${styleIcon(c.style)} ${styleLabel(c.style)}</span>
      ${done ? html`<span class="chip ok">✓ Validé</span>` : null}
      ${c.proof === "quiz" ? html`<span class="chip">Quiz</span>` : null}
      ${passages > 0 && !done ? html`<span class="chip plain">${passages} ${passages === 1 ? "passage" : "passages"}</span>` : null}
    </div>
    <div class="loc">${locIcon(c.location_kind)} ${c.location_detail || ""} · ${c.duration}</div>
  </button>`;
}

function styleIcon(id) {
  const s = STYLES.find((x) => x.id === id);
  return s ? s.icon : "";
}
function styleLabel(id) {
  const s = STYLES.find((x) => x.id === id);
  return s ? s.label : id;
}
export function locIcon(kind) {
  if (kind === "precise") return "📍";
  if (kind === "typee") return "🧭";
  return "🌍";
}
export function locLabel(kind) {
  if (kind === "precise") return "Lieu précis";
  if (kind === "typee") return "Lieu d'un certain type";
  return "N'importe où";
}

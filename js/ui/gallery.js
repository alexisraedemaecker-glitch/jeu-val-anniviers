// Album collectif de la journee : toutes les photos soumises.
const { html, useState, useEffect, useMemo } = window.htmPreact;

import { state, photoUrl, refreshFeed } from "../store.js";
import { PILLARS, PILLAR_BY_ID } from "../data/pillars.js";
import { Empty, Spinner, dateTimeShort, pillarColor } from "./bits.js";

export function Gallery() {
  const [open, setOpen] = useState(null);
  const [pillar, setPillar] = useState("");
  const [mineOnly, setMineOnly] = useState(false);

  useEffect(() => {
    if (!state.feedLoaded) refreshFeed();
  }, []);

  const photos = useMemo(() => {
    return state.feed.filter((f) => {
      if (!f.photo_path) return false;
      if (pillar && f.pillar !== pillar) return false;
      if (mineOnly && state.me) {
        const ids = f.member_ids || [];
        if (!ids.includes(state.me.id)) return false;
      }
      return true;
    });
  }, [state.feed, pillar, mineOnly, state.me && state.me.id]);

  const withoutPhoto = state.feed.filter((f) => !f.photo_path).length;

  return html`<div>
    <div class="filters">
      <button class=${"fbtn" + (pillar === "" ? " on" : "")} onClick=${() => setPillar("")}>Tout</button>
      ${PILLARS.map(
        (p) => html`<button key=${p.id} class=${"fbtn" + (pillar === p.id ? " on" : "")}
          onClick=${() => setPillar(p.id)}>${p.icon} ${p.short}</button>`
      )}
      ${state.me
        ? html`<button class=${"fbtn" + (mineOnly ? " on" : "")} onClick=${() => setMineOnly(!mineOnly)}>
            Où je suis
          </button>`
        : null}
    </div>

    <p class="tiny faint" style="margin-bottom:.6rem">
      ${photos.length} ${photos.length === 1 ? "photo" : "photos"} dans l'album.
      ${withoutPhoto > 0 ? ` ${withoutPhoto} ${withoutPhoto === 1 ? "défi validé" : "défis validés"} sans photo, par quiz.` : ""}
    </p>

    ${!state.feedLoaded && !state.feed.length
      ? html`<div class="card"><p class="muted small row"><${Spinner} dark=${true} /> Chargement de l'album<//></p></div>`
      : photos.length === 0
        ? html`<${Empty} icon="📷">
            Aucune photo pour le moment. Les premières arriveront dès les premiers défis validés.
          <//>`
        : html`<div class="album">
            ${photos.map(
              (f) => html`<button key=${f.id} onClick=${() => setOpen(f)}
                  title=${f.challenge_name}>
                <img src=${photoUrl(f.photo_path)} alt=${f.challenge_name} loading="lazy" />
              </button>`
            )}
          </div>`}

    ${open ? html`<${Lightbox} f=${open} onClose=${() => setOpen(null)} />` : null}
  </div>`;
}

function Lightbox({ f, onClose }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, []);

  const p = PILLAR_BY_ID[f.pillar];
  return html`<div class="lightbox" onClick=${(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <button class="close" onClick=${onClose}>Fermer</button>
    <div class="frame">
      <img src=${photoUrl(f.photo_path)} alt=${f.challenge_name} />
    </div>
    <div class="info">
      <strong>${f.challenge_name}</strong>
      <div style="margin:.25rem 0">
        <span class="chip plain"><i class="pill-dot" style=${{ background: pillarColor(f.pillar) }}></i>${p ? p.short : f.pillar}</span>
        <span class="chip plain">${f.points} pts</span>
        <span class="chip plain">${dateTimeShort(f.created_at)}</span>
      </div>
      <div style="opacity:.85">
        ${(f.member_names || []).length
          ? (f.member_names || []).join(", ")
          : f.submitter_name}
      </div>
      ${f.note ? html`<p style="margin-top:.5rem;opacity:.88;font-style:italic">« ${f.note} »</p>` : null}
    </div>
  </div>`;
}

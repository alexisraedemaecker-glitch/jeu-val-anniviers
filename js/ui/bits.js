// Petits composants partages.
const { html, useState, useEffect, useRef } = window.htmPreact;

import { PILLAR_BY_ID, STYLE_BY_ID, TIERS, VICTORY } from "../data/pillars.js";
import { portraitUrl } from "../store.js";

export { html };
export const Frag = (props) => props.children;

export function pillarColor(id) {
  const p = PILLAR_BY_ID[id];
  return (p && p.color) || "#8a8a8a";
}

export function Chip({ kind, children }) {
  return html`<span class=${"chip " + (kind || "")}>${children}</span>`;
}

export function Spinner({ dark }) {
  return html`<span class=${"spinner" + (dark ? " dark" : "")} aria-hidden="true"></span>`;
}

export function Banner({ kind, children }) {
  return html`<div class=${"banner " + (kind || "info")}>${children}</div>`;
}

export function Empty({ icon, children }) {
  return html`<div class="empty"><span class="big">${icon || "🏔"}</span>${children}</div>`;
}

export function initiales(p) {
  if (!p) return "";
  const a = (p.first_name || "").trim().charAt(0);
  const b = (p.last_name || "").trim().charAt(0);
  return (a + b).toUpperCase();
}

/**
 * Pastille de portrait. Quand la personne n'a pas encore de photo, par exemple
 * un profil cree avant cette version, on affiche ses initiales plutot qu'un
 * trou dans la mise en page.
 */
export function Avatar({ p, taille, onClick }) {
  if (!p) return null;
  const url = portraitUrl(p.photo_path);
  const nom = `${p.first_name || ""} ${p.last_name || ""}`.trim();
  const cls = `avatar${taille ? " " + taille : ""}${url ? "" : " vide"}`;
  const dedans = url
    ? html`<img src=${url} alt=${nom ? "Portrait de " + nom : "Portrait"} loading="lazy" />`
    : html`<span aria-hidden="true">${initiales(p) || "·"}</span>`;
  if (onClick) {
    return html`<button type="button" class=${cls} onClick=${onClick}
      aria-label=${nom ? "Voir le portrait de " + nom : "Voir le portrait"}>${dedans}</button>`;
  }
  return html`<span class=${cls}>${dedans}</span>`;
}

/**
 * Choix de personnes a l'arobase. On tape @ puis les premieres lettres d'un
 * prenom, on touche la proposition, et la personne rejoint la liste sous forme
 * de pastille. Pense pour une vallee pleine de monde : rien ne s'affiche tant
 * qu'on n'a pas commence a taper, contrairement a une liste complete qui
 * deviendrait interminable a trente personnes.
 */
export function ChoixPersonnes({
  choisis,
  setChoisis,
  gens,
  placeholder,
  note,
  exclure
}) {
  const [texte, setTexte] = useState("");
  const champ = useRef(null);
  const liste = (gens || []).filter((g) => !(exclure || []).includes(g.id));

  const recherche = texte.replace(/^@/, "").trim().toLowerCase();
  const propositions = recherche
    ? liste
        .filter((g) => !choisis.includes(g.id))
        .filter((g) => `${g.first_name} ${g.last_name}`.toLowerCase().includes(recherche))
        .slice(0, 6)
    : [];

  const ajouter = (p) => {
    setChoisis(choisis.concat(p.id));
    setTexte("");
    if (champ.current) champ.current.focus();
  };
  const retirer = (id) => setChoisis(choisis.filter((x) => x !== id));

  return html`<div class="choix-personnes">
    ${choisis.length
      ? html`<div class="pastilles">
          ${choisis.map((id) => {
            const p = liste.find((g) => g.id === id) || (gens || []).find((g) => g.id === id);
            if (!p) return null;
            return html`<span key=${id} class="pastille">
              <${Avatar} p=${p} taille="sm" />
              <span>${p.first_name} ${p.last_name}</span>
              <button type="button" class="ret" aria-label=${"Retirer " + p.first_name}
                      onClick=${() => retirer(id)}>×</button>
            </span>`;
          })}
        </div>`
      : null}
    <div class="saisie">
      <input ref=${champ} type="text" value=${texte} class="grow"
             placeholder=${placeholder || "Tapez @ puis un prénom"}
             autocomplete="off" autocorrect="off" autocapitalize="off"
             onInput=${(e) => setTexte(e.target.value)} />
      ${propositions.length
        ? html`<div class="suggestions">
            ${propositions.map(
              (p) => html`<button type="button" key=${p.id} class="suggestion"
                onMouseDown=${(e) => e.preventDefault()} onClick=${() => ajouter(p)}>
                <${Avatar} p=${p} taille="sm" />
                <span class="grow">${p.first_name} ${p.last_name}</span>
              </button>`
            )}
          </div>`
        : null}
    </div>
    ${recherche && !propositions.length
      ? html`<p class="tiny faint" style="margin:.35rem 0 0">Personne ne correspond à « ${recherche} ».</p>`
      : note
        ? html`<p class="tiny faint" style="margin:.35rem 0 0">${note}</p>`
        : null}
  </div>`;
}

export function StyleChip({ style }) {
  const s = STYLE_BY_ID[style];
  if (!s) return null;
  return html`<span class="chip plain">${s.icon} ${s.label}</span>`;
}

export function PillarChip({ pillar }) {
  const p = PILLAR_BY_ID[pillar];
  if (!p) return null;
  return html`<span class="chip plain">
    <i class="pill-dot" style=${{ background: p.color }}></i>${p.short}
  </span>`;
}

export function TierLabel({ tier }) {
  const t = TIERS[tier];
  return html`<span class="tiny faint">${t ? t.label : tier}</span>`;
}

export function Gauge({ g }) {
  const pct = Math.max(0, Math.min(100, (g.points / g.max_points) * 100));
  const floorPct = (VICTORY.pillar_floor / g.max_points) * 100;
  const underFloor = g.points < VICTORY.pillar_floor;
  return html`<div class="gauge">
    <div class="gauge-top">
      <i class="pill-dot" style=${{ background: pillarColor(g.pillar) }}></i>
      <span class="nm">${g.name}</span>
      <span class="vl">${g.points}<span class="faint tiny"> / ${g.max_points}</span></span>
    </div>
    <div class="gauge-bar" role="progressbar" aria-valuenow=${g.points} aria-valuemin="0"
         aria-valuemax=${g.max_points} aria-label=${g.name}>
      <div class="gauge-fill" style=${{ width: pct + "%", background: pillarColor(g.pillar) }}></div>
      <div class="gauge-floor" style=${{ left: floorPct + "%" }}
           title=${"Plancher minimal " + VICTORY.pillar_floor}></div>
    </div>
    ${underFloor
      ? html`<div class="gauge-note">
          Encore ${VICTORY.pillar_floor - g.points} points pour atteindre le plancher minimal
        </div>`
      : null}
  </div>`;
}

export function pointsLabel(n) {
  return n === 1 ? "1 point" : `${n} points`;
}

export function timeShort(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("fr-CH", { hour: "2-digit", minute: "2-digit" });
}

export function dateTimeShort(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("fr-CH", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}


/**
 * Photo en plein ecran, partagee par les fiches de randonnee, l'album et
 * l'illustration de la vallee. Un appui sur l'image l'agrandit encore pour en
 * examiner le detail, un second la remet a sa taille.
 */
export function PhotoZoom({ photos, i, setI }) {
  const p = photos[i];
  const [zoom, setZoom] = useState(false);
  const suivante = () => { setZoom(false); setI((i + 1) % photos.length); };
  const precedente = () => { setZoom(false); setI((i - 1 + photos.length) % photos.length); };

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setI(null);
      if (e.key === "ArrowRight") suivante();
      if (e.key === "ArrowLeft") precedente();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [i]);

  return html`<div class="lightbox" onClick=${(e) => { if (e.target === e.currentTarget) setI(null); }}>
    <button class="close" onClick=${() => setI(null)}>Fermer</button>
    <div class=${"frame" + (zoom ? " zoom" : "")}
         onClick=${(e) => { if (e.target === e.currentTarget) setI(null); }}>
      <img src=${p.src} alt=${p.legende} onClick=${() => setZoom(!zoom)} />
    </div>
    <div class="info">
      <strong>${p.legende}</strong>
      <div class="tiny" style="opacity:.7;margin-top:.15rem">
        ${zoom ? "Appuyez sur la photo pour revenir" : "Appuyez sur la photo pour zoomer, ou couchez le téléphone"}
      </div>
      ${photos.length > 1
        ? html`<div class="row" style="margin-top:.5rem;gap:.5rem">
            <button class="btn sm quiet grow" onClick=${precedente}>Précédente</button>
            <span class="tiny nowrap" style="opacity:.75">${i + 1} sur ${photos.length}</span>
            <button class="btn sm quiet grow" onClick=${suivante}>Suivante</button>
          </div>`
        : null}
    </div>
  </div>`;
}

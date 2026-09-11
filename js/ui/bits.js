// Petits composants partages.
const { html } = window.htmPreact;

import { PILLAR_BY_ID, STYLE_BY_ID, TIERS, VICTORY } from "../data/pillars.js";

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

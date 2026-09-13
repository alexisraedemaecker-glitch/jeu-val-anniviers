// Les cinq jauges collectives en direct, et l'avancement vers l'objectif.
const { html, useState, useEffect, useRef } = window.htmPreact;

import { state } from "../store.js";
import { VICTORY } from "../data/pillars.js";
import { palierVallee } from "../data/vallee.js";
import { Gauge, Spinner, Banner, PhotoZoom } from "./bits.js";

/** Progression collective en pourcentage, calculée comme la condition de
    victoire : somme des cinq jauges divisée par leur maximum cumulé. */
export function pourcentageCollectif() {
  const c = state.collective;
  if (!c || !c.total_max) return 0;
  return Math.max(0, Math.min(100, (c.total / c.total_max) * 100));
}

/**
 * Illustration évolutive de la vallée.
 *
 * Le palier suit la progression collective. Quand il change, la nouvelle
 * image est d'abord préchargée, puis apparaît en fondu par dessus l'ancienne
 * en une seconde. L'ancienne n'est retirée qu'à la fin, donc rien ne
 * clignote. Si le fondu ne peut pas jouer, par exemple sur un écran
 * verrouillé, l'image est simplement remplacée.
 */
function Vallee() {
  const pct = pourcentageCollectif();
  const palier = palierVallee(pct);

  const [dessous, setDessous] = useState(palier);
  const [entrante, setEntrante] = useState(null);
  const [visible, setVisible] = useState(false);
  const [plein, setPlein] = useState(null);
  const minuteries = useRef([]);

  useEffect(() => {
    if (palier.src === dessous.src) return undefined;
    let annule = false;
    const nettoyer = () => minuteries.current.forEach(clearTimeout);
    nettoyer();

    const poser = () => {
      if (annule) return;
      setEntrante(palier);
      setVisible(false);
      minuteries.current = [
        setTimeout(() => !annule && setVisible(true), 60),
        setTimeout(() => {
          if (annule) return;
          setDessous(palier);
          setEntrante(null);
          setVisible(false);
        }, 1200)
      ];
    };

    // On ne lance le fondu qu'une fois la nouvelle image en cache.
    const img = new Image();
    img.onload = poser;
    img.onerror = () => !annule && setDessous(palier);
    img.src = palier.src;
    if (img.complete) poser();

    return () => {
      annule = true;
      nettoyer();
    };
  }, [palier.src]);

  const tailles = "100vw";
  const jeu = (p) => `${p.src_small} 760w, ${p.src} 1376w`;
  const courant = entrante || dessous;

  return html`<figure style="margin:0 -.9rem .8rem">
    <button type="button" class="vallee" onClick=${() => setPlein(0)}
            aria-label=${"Agrandir l'illustration : " + courant.legende}>
      <img src=${dessous.src} srcset=${jeu(dessous)} sizes=${tailles}
           alt=${"Le Val d'Anniviers en 2056 : " + dessous.legende} />
      ${entrante
        ? html`<img class=${"entrante" + (visible ? " visible" : "")}
                 src=${entrante.src} srcset=${jeu(entrante)} sizes=${tailles}
                 alt=${"Le Val d'Anniviers en 2056 : " + entrante.legende} />`
        : null}
      <span class="loupe" aria-hidden="true">⤢</span>
      <span class="vallee-legende">
        <span class="txt">
          ${courant.legende}
          <span class="aide">Appuyez pour voir en grand</span>
        </span>
        <span class="pct">${Math.round(pct)}<span style="font-size:.62em"> %</span><small>restauré</small></span>
      </span>
    </button>
    ${plein !== null
      ? html`<${PhotoZoom}
          photos=${[{ src: courant.src, legende: `${courant.legende} · ${Math.round(pct)} pour cent restauré` }]}
          i=${0} setI=${setPlein} />`
      : null}
  </figure>`;
}

export function Progress() {
  const col = state.collective;
  const total = col ? col.total : 0;
  const max = col ? col.total_max : VICTORY.global_max;
  const pct = Math.max(0, Math.min(100, (total / max) * 100));
  const targetPct = (VICTORY.global_target / max) * 100;
  const reached = col ? col.objectif_atteint : false;
  const underFloor = col ? col.piliers_sous_plancher : 0;

  return html`<div class="stack">
    <${Vallee} />

    <div class="card">
      <div class="card-head">
        <h2>Objectif collectif</h2>
        ${state.realtime === "en direct"
          ? html`<span class="chip ok">En direct</span>`
          : html`<span class="chip warn">${state.realtime}</span>`}
      </div>
      <div class="spread" style="margin-bottom:.4rem">
        <span style="font-size:1.8rem;font-weight:800;font-variant-numeric:tabular-nums">${total}</span>
        <span class="muted small">sur ${VICTORY.global_target} visés, ${max} au total</span>
      </div>
      <div class="total-bar">
        <div class="total-fill" style=${{ width: pct + "%" }}></div>
        <div class="total-target" style=${{ left: targetPct + "%" }} title="Seuil de victoire"></div>
      </div>
      <p class="tiny faint" style="margin-top:.4rem">
        Le repère sombre marque le seuil de ${VICTORY.global_target} points. Chaque pilier doit en
        plus atteindre au moins ${VICTORY.pillar_floor} points.
      </p>
      ${reached
        ? html`<${Banner} kind="ok">
            Objectif atteint. Le seuil collectif est franchi et aucun pilier n'est laissé de côté.
            La vallée de 2056 a changé de trajectoire.
          <//>`
        : underFloor > 0
          ? html`<${Banner} kind="warn">
              ${underFloor === 1
                ? "Un pilier est encore sous le plancher minimal."
                : `${underFloor} piliers sont encore sous le plancher minimal.`}${" "}
              Même en atteignant le seuil global, l'objectif ne sera pas validé tant qu'un pilier
              reste à l'abandon.
            <//>`
          : html`<p class="small muted" style="margin-top:.5rem">
              Tous les piliers ont dépassé leur plancher minimal.
              Il reste ${Math.max(0, VICTORY.global_target - total)} points pour atteindre le seuil
              collectif.
            </p>`}
    </div>

    <div class="card">
      <h2>Les cinq piliers</h2>
      ${state.loading && !state.gauges.length
        ? html`<p class="muted small row"><${Spinner} dark=${true} /> Chargement<//>`
        : state.gauges.map((g) => html`<${Gauge} key=${g.pillar} g=${g} />`)}
    </div>

    <div class="card">
      <h3>Comment les jauges montent</h3>
      <p class="small muted">
        Chaque défi validé verse ses points dans la jauge de son pilier. Un même défi peut être
        refait par d'autres groupes dans la journée, et il continue d'apporter des points, un peu
        moins à chaque fois, pour que les jauges montent régulièrement du matin au soir plutôt que
        d'un seul coup.
      </p>
      <p class="small muted">
        Votre score personnel, lui, n'est jamais concerné par cette règle. Vous recevez toujours les
        points pleins du défi.
      </p>
    </div>
  </div>`;
}

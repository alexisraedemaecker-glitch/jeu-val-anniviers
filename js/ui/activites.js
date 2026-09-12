// Onglet Activités. Accessible avant même de s'identifier, puisqu'il ne
// dépend d'aucune donnée de jeu.
//
// Quatre catégories, les mêmes que celles des défis. La partie sportive
// s'appuie sur les fichiers GPX : chiffres calculés, profil altimétrique et
// tracé dessinés depuis les données, fichier téléchargeable pour Komoot.
// Les horaires de transport sont interrogés en direct auprès de l'horaire
// officiel suisse, avec repli sur un lien si le réseau manque.
const { html, useState, useEffect, useMemo } = window.htmPreact;

import {
  CATEGORIES,
  CHANDOLIN,
  ACCES,
  REMONTEES,
  RANDOS,
  TABLES,
  CULTURE,
  CHILL,
  SOURCES
} from "../data/activites.js";
import { STATS_BY_ID } from "../data/randos-stats.js";
import { Banner, Spinner, Empty } from "./bits.js";

const COULEUR_NIVEAU = { facile: "ok", moyenne: "warn", exigeante: "bad" };

function duree(heures) {
  const total = Math.round((heures * 60) / 5) * 5;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

function tempsCourt(minutes) {
  if (minutes == null) return null;
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

export function Activites({ go, identifie }) {
  const [cat, setCat] = useState("sportif");
  const [ouvert, setOuvert] = useState(null);

  return html`<div class="stack">
    <div class="card">
      <h1 style="margin:0 0 .3rem">Le week end dans la vallée</h1>
      <p class="small muted" style="margin:0">
        Des idées pour le reste du séjour, rangées par envie. Les randonnées viennent des traces
        GPX, avec leurs chiffres réels et le temps qu'il faut pour rejoindre le départ depuis
        Chandolin.
      </p>
      ${!identifie
        ? html`<div style="margin-top:.7rem">
            <button class="btn block" onClick=${() => go("#/")}>
              Rejoindre le jeu et créer mon profil
            </button>
          </div>`
        : null}
    </div>

    <div class="filters">
      ${CATEGORIES.map(
        (c) => html`<button key=${c.id} class=${"fbtn" + (cat === c.id ? " on" : "")}
          onClick=${() => { setCat(c.id); setOuvert(null); }}>${c.icon} ${c.label}</button>`
      )}
    </div>

    ${cat === "sportif" ? html`<${Randos} ouvert=${ouvert} setOuvert=${setOuvert} />` : null}
    ${cat === "culinaire" ? html`<${Fiches} items=${TABLES} ouvert=${ouvert} setOuvert=${setOuvert} icone="🧀" />` : null}
    ${cat === "culturel" ? html`<${Fiches} items=${CULTURE} ouvert=${ouvert} setOuvert=${setOuvert} icone="📚" />` : null}
    ${cat === "chill" ? html`<${Fiches} items=${CHILL} ouvert=${ouvert} setOuvert=${setOuvert} icone="🍃" />` : null}

    <div class="card flat">
      <h3 style="font-size:.92rem">D'où viennent ces informations</h3>
      <p class="tiny faint">
        Les chiffres des randonnées sont calculés depuis vos fichiers GPX. Les temps de route sont
        calculés sur le réseau routier réel. Les horaires de transport viennent de l'horaire officiel
        suisse et sont interrogés en direct. Le reste vient des sites officiels, dont les liens sont
        sur chaque fiche. Vérifiez toujours avant de partir, les horaires de fin de saison bougent.
      </p>
      <div class="row wrap" style="gap:.3rem;margin-top:.4rem">
        ${SOURCES.map(
          (s) => html`<a key=${s.url} class="chip plain" href=${s.url} target="_blank"
            rel="noopener noreferrer">${s.nom}</a>`
        )}
      </div>
    </div>
  </div>`;
}

// ------------------------------------------------------------ randonnées

function Randos({ ouvert, setOuvert }) {
  const [tri, setTri] = useState("montee");

  const liste = useMemo(() => {
    const avec = RANDOS.map((r) => ({ ...r, stats: STATS_BY_ID[r.id] })).filter((r) => r.stats);
    const cle = {
      montee: (r) => r.stats.montee_m,
      duree: (r) => r.stats.heures,
      distance: (r) => r.stats.distance_km,
      proche: (r) => (ACCES[r.acces] ? ACCES[r.acces].voiture.minutes : 999)
    }[tri];
    return avec.sort((a, b) => cle(a) - cle(b));
  }, [tri]);

  return html`<div class="stack">
    <div class="card flat">
      <p class="small muted" style="margin:0 0 .5rem">
        Douze parcours, du plus tranquille au plus sérieux. Les durées sont celles des panneaux
        suisses, marche seule, sans les pauses. Comptez large.
      </p>
      <div class="filters" style="margin:0">
        ${[
          ["montee", "Par dénivelé"],
          ["duree", "Par durée"],
          ["distance", "Par distance"],
          ["proche", "Les plus proches"]
        ].map(
          ([id, lab]) => html`<button key=${id} class=${"fbtn" + (tri === id ? " on" : "")}
            onClick=${() => setTri(id)}>${lab}</button>`
        )}
      </div>
    </div>

    ${liste.map((r) => html`<${Rando} key=${r.id} r=${r}
        ouvert=${ouvert === r.id} onToggle=${() => setOuvert(ouvert === r.id ? null : r.id)} />`)}
  </div>`;
}

function Rando({ r, ouvert, onToggle }) {
  const s = r.stats;
  const a = ACCES[r.acces];
  const rm = a && a.remontee ? REMONTEES[a.remontee] : null;

  return html`<div class="card" style=${{ borderLeft: "5px solid var(--p-montagne)" }}>
    <button class="row" style="width:100%;text-align:left;background:none;border:0;padding:0;gap:.6rem"
            onClick=${onToggle}>
      <span class="grow">
        <h3 style="margin:0">${r.nom}</h3>
        <div class="row wrap" style="gap:.3rem;margin-top:.4rem">
          <span class=${"chip " + (COULEUR_NIVEAU[s.niveau] || "")}>${s.niveau}</span>
          <span class="chip plain">${duree(s.heures)}</span>
          <span class="chip plain">${s.distance_km} km</span>
          <span class="chip plain">${s.montee_m} m de montée</span>
          ${a ? html`<span class="chip plain">🚗 ${tempsCourt(a.voiture.minutes)} de Chandolin</span>` : null}
        </div>
      </span>
      <span class="faint" style="font-size:1.3rem">${ouvert ? "▴" : "▾"}</span>
    </button>

    ${ouvert
      ? html`<div style="margin-top:.8rem">
          <p class="small">${r.resume}</p>

          ${r.photo
            ? html`<figure style="margin:0 0 .8rem">
                <div class="photo-prev"><img src=${r.photo} alt=${r.photo_legende} loading="lazy" /></div>
                <figcaption class="tiny faint" style="margin-top:.25rem">${r.photo_legende}</figcaption>
              </figure>`
            : null}

          <div class="stack">
            <div>
              <h4 style="font-size:.88rem;margin:0 0 .25rem">Profil altimétrique</h4>
              <img src=${s.profil} alt=${"Profil de " + r.nom} loading="lazy"
                   style="width:100%;height:auto;display:block;background:#fff;border:1px solid var(--line);border-radius:10px" />
            </div>
            <div class="row" style="align-items:flex-start;gap:.7rem">
              <img src=${s.trace} alt=${"Tracé de " + r.nom} loading="lazy"
                   style="width:46%;max-width:190px;height:auto;border:1px solid var(--line);border-radius:10px" />
              <dl class="kv grow" style="margin:0">
                <dt>Distance</dt><dd>${s.distance_km} km</dd>
                <dt>Montée</dt><dd>${s.montee_m} m</dd>
                <dt>Descente</dt><dd>${s.descente_m} m</dd>
                <dt>Altitude</dt><dd>${s.alt_min} à ${s.alt_max} m</dd>
                <dt>Durée</dt><dd>${duree(s.heures)} de marche</dd>
                <dt>Forme</dt><dd>${s.boucle ? "Boucle" : "Traversée"}</dd>
              </dl>
            </div>
          </div>

          <p class="tiny faint" style="margin:.5rem 0 .8rem">
            ${s.niveau_texte} Départ en vert, arrivée en rouge.
          </p>

          <hr class="sep" />
          <h4 style="font-size:.92rem;margin:0 0 .4rem">Rejoindre le départ depuis Chandolin</h4>
          ${a
            ? html`<div>
                <p class="small muted" style="margin:0 0 .5rem">${a.lieu}</p>
                <dl class="kv">
                  <dt>En voiture</dt>
                  <dd>${tempsCourt(a.voiture.minutes)}${a.voiture.km ? `, ${a.voiture.km} km` : ""}</dd>
                  ${a.voiture.note ? html`<dt></dt><dd class="tiny faint">${a.voiture.note}</dd>` : null}
                  <dt>En transports</dt>
                  <dd>${a.tp.minutes ? "environ " + tempsCourt(a.tp.minutes) : "sur place"}</dd>
                  ${a.tp.note ? html`<dt></dt><dd class="tiny faint">${a.tp.note}</dd>` : null}
                </dl>
                ${a.tp.station ? html`<${Horaires} station=${a.tp.station} />` : null}
              </div>`
            : null}

          ${rm ? html`<${Remontee} rm=${rm} note=${a.remontee_note} />` : null}

          ${r.arrivee
            ? html`<p class="small muted" style="margin-top:.6rem">
                <strong>Arrivée</strong> ${r.arrivee}
              </p>`
            : null}
          ${r.conseil ? html`<${Banner} kind="info">${r.conseil}<//>` : null}

          <hr class="sep" />
          <h4 style="font-size:.92rem;margin:0 0 .4rem">Emporter le parcours</h4>
          <p class="tiny faint" style="margin:0 0 .5rem">
            Téléchargez le fichier puis ouvrez le dans Komoot, dans SwissTopo ou dans votre
            application de randonnée. Vous y verrez le tracé sur la carte, les photos des points de
            vue et la navigation pas à pas.
          </p>
          <div class="row wrap" style="gap:.4rem">
            <a class="btn sm ghost" href=${s.gpx} download>Télécharger le GPX</a>
            <a class="btn sm quiet" href="https://www.komoot.com/fr-fr/upload" target="_blank"
               rel="noopener noreferrer">Ouvrir Komoot</a>
            <a class="btn sm quiet"
               href=${`https://www.google.com/maps/dir/?api=1&destination=${s.depart.lat},${s.depart.lon}&travelmode=driving`}
               target="_blank" rel="noopener noreferrer">Itinéraire vers le départ</a>
          </div>
        </div>`
      : null}
  </div>`;
}

function Remontee({ rm, note }) {
  return html`<div class="card flat" style="background:var(--accent-soft);border-color:#b4cbdd;margin:.6rem 0 0">
    <h4 style="font-size:.9rem;margin:0 0 .3rem">🚡 ${rm.nom}</h4>
    <p class="tiny" style="margin:0 0 .2rem"><strong>${rm.saison}</strong></p>
    <p class="tiny" style="margin:0">${rm.horaire}</p>
    ${note ? html`<p class="tiny faint" style="margin:.3rem 0 0">${note}</p>` : null}
    ${rm.alerte ? html`<p class="tiny" style="margin:.35rem 0 0;color:var(--bad);font-weight:600">${rm.alerte}</p>` : null}
    <a class="btn sm quiet" style="margin-top:.5rem" href=${rm.lien} target="_blank" rel="noopener noreferrer">
      Horaires officiels
    </a>
  </div>`;
}

// ------------------------------------------------ horaires en direct

/**
 * Prochaines liaisons depuis Chandolin, tirées de l'horaire officiel suisse.
 * Si le réseau manque, on retombe simplement sur un lien vers les CFF.
 */
function Horaires({ station }) {
  const [etat, setEtat] = useState("repos");
  const [cx, setCx] = useState([]);

  async function charger() {
    setEtat("chargement");
    try {
      const u =
        "https://transport.opendata.ch/v1/connections?from=" +
        encodeURIComponent(CHANDOLIN.station) +
        "&to=" + encodeURIComponent(station) + "&limit=4";
      const r = await fetch(u);
      if (!r.ok) throw new Error("horaire indisponible");
      const d = await r.json();
      setCx(d.connections || []);
      setEtat("ok");
    } catch (err) {
      setEtat("echec");
    }
  }

  const lienCff =
    "https://www.cff.ch/acheter-vos-billets.html?nach=" + encodeURIComponent(station) +
    "&von=" + encodeURIComponent(CHANDOLIN.station);

  return html`<div style="margin-top:.5rem">
    ${etat === "repos"
      ? html`<button class="btn sm quiet block" onClick=${charger}>
          Voir les prochains départs depuis Chandolin
        </button>`
      : null}
    ${etat === "chargement"
      ? html`<p class="small muted row"><${Spinner} dark=${true} /> Lecture de l'horaire</p>`
      : null}
    ${etat === "echec"
      ? html`<div>
          <p class="tiny faint" style="margin:0 0 .4rem">
            Horaire injoignable pour le moment, sans doute le réseau.
          </p>
          <a class="btn sm quiet block" href=${lienCff} target="_blank" rel="noopener noreferrer">
            Ouvrir l'horaire des CFF
          </a>
        </div>`
      : null}
    ${etat === "ok"
      ? html`<div>
          ${cx.length === 0
            ? html`<p class="tiny faint">Aucune liaison trouvée pour le moment.</p>`
            : html`<div class="stack">
                ${cx.map((c, i) => {
                  const troncons = (c.sections || []).filter((x) => x.journey);
                  const dep = (c.from.departure || "").slice(11, 16);
                  const arr = (c.to.arrival || "").slice(11, 16);
                  const min = (c.duration || "").match(/(\d+):(\d+):/);
                  const mn = min ? Number(min[1]) * 60 + Number(min[2]) : null;
                  return html`<div key=${i} class="row" style="gap:.5rem;align-items:baseline">
                    <span style="font-weight:700;font-variant-numeric:tabular-nums">${dep}</span>
                    <span class="faint">→</span>
                    <span style="font-weight:700;font-variant-numeric:tabular-nums">${arr}</span>
                    <span class="grow tiny faint">
                      ${troncons.map((t) => (t.journey.category || "") + (t.journey.number || "")).join(" puis ")}
                      ${troncons.length > 1 ? ` · ${troncons.length - 1} changement` : " · direct"}
                    </span>
                    ${mn ? html`<span class="chip plain">${tempsCourt(mn)}</span>` : null}
                  </div>`;
                })}
              </div>`}
          <div class="row" style="margin-top:.5rem;gap:.4rem">
            <button class="btn sm quiet grow" onClick=${charger}>Rafraîchir</button>
            <a class="btn sm quiet grow" href=${lienCff} target="_blank" rel="noopener noreferrer">
              Horaire complet
            </a>
          </div>
        </div>`
      : null}
  </div>`;
}

// ------------------------------------------------- fiches des trois autres

function Fiches({ items, ouvert, setOuvert, icone }) {
  if (!items.length) {
    return html`<${Empty} icon=${icone}>Rien pour le moment.<//>`;
  }
  return html`<div class="stack">
    ${items.map((it) => {
      const a = it.acces ? ACCES[it.acces] : null;
      const minutes = a ? a.voiture.minutes : it.voiture_min;
      const estOuvert = ouvert === it.id;
      return html`<div key=${it.id} class="card">
        <button class="row" style="width:100%;text-align:left;background:none;border:0;padding:0;gap:.6rem"
                onClick=${() => setOuvert(estOuvert ? null : it.id)}>
          <span class="grow">
            <h3 style="margin:0">${it.nom}</h3>
            <div class="tiny faint" style="margin-top:.2rem">${it.lieu}</div>
            <div class="row wrap" style="gap:.3rem;margin-top:.4rem">
              ${minutes != null
                ? html`<span class="chip plain">🚗 ${minutes === 0 ? "sur place" : tempsCourt(minutes)}</span>`
                : html`<span class="chip plain">🚶 à Chandolin même</span>`}
              ${a && a.tp && a.tp.minutes
                ? html`<span class="chip plain">🚌 ${tempsCourt(a.tp.minutes)}</span>`
                : null}
              ${it.horaire ? html`<span class="chip plain">🕘 horaires</span>` : null}
              ${it.carte ? html`<span class="chip ok">carte complète</span>` : null}
            </div>
          </span>
          <span class="faint" style="font-size:1.3rem">${estOuvert ? "▴" : "▾"}</span>
        </button>

        ${estOuvert
          ? html`<div style="margin-top:.7rem">
              <p class="small">${it.resume}</p>
              ${it.histoire
                ? html`<div>
                    <hr class="sep" />
                    <h4 style="font-size:.92rem;margin:0 0 .4rem">Ce qu'il faut savoir</h4>
                    <ul class="small muted" style="margin:0;padding-left:1.1rem">
                      ${it.histoire.map((h, i) => html`<li key=${i} style="margin-bottom:.3rem">${h}</li>`)}
                    </ul>
                  </div>`
                : null}
              ${it.horaire
                ? html`<p class="small" style="margin-top:.6rem"><strong>Horaires</strong> ${it.horaire}</p>`
                : null}
              ${it.tel
                ? html`<p class="small" style="margin:.2rem 0 0">
                    <strong>Téléphone</strong> <a href=${"tel:" + it.tel.replace(/\s/g, "")}>${it.tel}</a>
                  </p>`
                : null}
              ${it.carte ? html`<${Carte} sections=${it.carte} note=${it.carte_note} />` : null}
              ${a
                ? html`<div style="margin-top:.6rem">
                    <p class="small muted" style="margin:0 0 .3rem">
                      Depuis Chandolin : ${tempsCourt(a.voiture.minutes)} en voiture${
                        a.tp && a.tp.minutes ? `, environ ${tempsCourt(a.tp.minutes)} en transports` : ""
                      }.
                    </p>
                    ${a.tp && a.tp.station ? html`<${Horaires} station=${a.tp.station} />` : null}
                  </div>`
                : null}
              ${it.note ? html`<${Banner} kind="warn">${it.note}<//>` : null}
              ${it.conseil ? html`<${Banner} kind="info">${it.conseil}<//>` : null}
              ${it.lien
                ? html`<a class="btn sm ghost block" href=${it.lien} target="_blank" rel="noopener noreferrer"
                     style="margin-top:.5rem">Site officiel</a>`
                : null}
            </div>`
          : null}
      </div>`;
    })}
  </div>`;
}

function Carte({ sections, note }) {
  const [ouvert, setOuvert] = useState(false);
  return html`<div style="margin-top:.7rem">
    <button class="btn sm ghost block" onClick=${() => setOuvert(!ouvert)}>
      ${ouvert ? "Masquer la carte" : "Voir la carte complète"}
    </button>
    ${ouvert
      ? html`<div style="margin-top:.6rem">
          ${sections.map(
            (sec) => html`<div key=${sec.section} style="margin-bottom:.8rem">
              <h4 style="font-size:.88rem;margin:0 0 .3rem">${sec.section}</h4>
              ${sec.plats.map(
                ([nom, prix], i) => html`<div key=${i} class="row"
                    style="gap:.5rem;align-items:baseline;padding:.15rem 0;border-bottom:1px dotted var(--line)">
                  <span class="small grow">${nom}</span>
                  <span class="small nowrap" style="font-weight:650">${prix}</span>
                </div>`
              )}
            </div>`
          )}
          ${note ? html`<p class="tiny faint" style="margin:0">${note}</p>` : null}
        </div>`
      : null}
  </div>`;
}

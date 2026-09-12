// Espace d'administration, protege par le code organisateur.
//
// Cinq onglets : un tableau de bord de la journee, la relecture des soumissions
// avec leurs photos, la gestion des joueurs, la levee des attentes apres un
// quiz rate, et les reglages dont la remise a zero.
const { html, useState, useEffect, useMemo } = window.htmPreact;

import {
  state,
  photoUrl,
  refreshFeed,
  refresh,
  checkOrganizer,
  forgetOrganizer,
  deleteSubmission,
  loadLockouts,
  adminClearLockouts,
  adminRenameParticipant,
  adminDeleteParticipant,
  adminResetGame,
  adminSetLockoutMinutes,
  friendly
} from "../store.js";
import { PILLARS, PILLAR_BY_ID, VICTORY } from "../data/pillars.js";
import { CHALLENGES, CHALLENGE_BY_ID } from "../data/challenges.js";
import { SYNERGIES } from "../data/synergies.js";
import { Banner, Spinner, Empty, Gauge, dateTimeShort, pillarColor } from "./bits.js";

const ONGLETS = [
  { id: "bord", label: "Tableau de bord" },
  { id: "soumissions", label: "Soumissions" },
  { id: "joueurs", label: "Joueurs" },
  { id: "attentes", label: "Attentes" },
  { id: "reglages", label: "Réglages" }
];

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
    <h1>Administration</h1>
    <p class="small muted">
      Tableau de bord de la journée, relecture des soumissions, gestion des joueurs et des
      attentes. Cet espace demande le code organisateur.
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
  const [onglet, setOnglet] = useState("bord");
  const [error, setError] = useState(null);

  useEffect(() => {
    refreshFeed();
  }, []);

  return html`<div class="stack">
    <div class="card">
      <div class="card-head">
        <h1 class="grow" style="margin:0">Administration</h1>
        <button class="btn sm quiet" onClick=${() => { forgetOrganizer(); go("#/moi"); }}>Fermer</button>
      </div>
      <p class="tiny faint" style="margin:.3rem 0 0">
        ${state.lastSync ? `Données à jour à ${dateTimeShort(state.lastSync.toISOString())}` : ""}
        · temps réel ${state.realtime}
      </p>
    </div>

    <div class="filters">
      ${ONGLETS.map(
        (o) => html`<button key=${o.id} class=${"fbtn" + (onglet === o.id ? " on" : "")}
          onClick=${() => { setOnglet(o.id); setError(null); }}>${o.label}</button>`
      )}
    </div>

    ${error ? html`<${Banner} kind="bad">${error}<//>` : null}

    ${onglet === "bord" ? html`<${Bord} />` : null}
    ${onglet === "soumissions" ? html`<${Soumissions} onError=${setError} />` : null}
    ${onglet === "joueurs" ? html`<${Joueurs} onError=${setError} />` : null}
    ${onglet === "attentes" ? html`<${Attentes} onError=${setError} />` : null}
    ${onglet === "reglages" ? html`<${Reglages} onError=${setError} />` : null}
  </div>`;
}

// ---------------------------------------------------------- tableau de bord

function Bord() {
  const col = state.collective;
  const stats = state.stats || {};

  const jamaisFaits = CHALLENGES.filter((c) => !stats[c.id]);
  const parPilier = useMemo(() => {
    const m = {};
    PILLARS.forEach((p) => {
      m[p.id] = { total: 0, faits: 0 };
    });
    CHALLENGES.forEach((c) => {
      m[c.pillar].total += 1;
      if (stats[c.id]) m[c.pillar].faits += 1;
    });
    return m;
  }, [stats]);

  const actifs = state.scores.filter((s) => s.defis_faits > 0);
  const inactifs = state.scores.filter((s) => s.defis_faits === 0);
  const synergiesTrouvees = new Set(state.unlocks.map((u) => u.synergy_id));

  return html`<div class="stack">
    <div class="card">
      <h2>La journée en un coup d'œil</h2>
      <div class="spread" style="margin-top:.5rem">
        ${[
          ["Joueurs", state.scores.length],
          ["Actifs", actifs.length],
          ["Soumissions", state.feed.length],
          ["Photos", state.feed.filter((f) => f.photo_path).length]
        ].map(
          ([l, v]) => html`<div class="center grow">
            <div class="tiny faint">${l}</div>
            <div style="font-size:1.4rem;font-weight:800">${v}</div>
          </div>`
        )}
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <h2 class="grow">Objectif collectif</h2>
        ${col && col.objectif_atteint
          ? html`<span class="chip ok">atteint</span>`
          : html`<span class="chip">${col ? col.total : 0} sur ${VICTORY.global_target}</span>`}
      </div>
      ${state.gauges.map((g) => html`<${Gauge} key=${g.pillar} g=${g} />`)}
      ${col && col.piliers_sous_plancher > 0
        ? html`<${Banner} kind="warn">
            ${col.piliers_sous_plancher === 1
              ? "Un pilier est encore sous le plancher de 40 points."
              : `${col.piliers_sous_plancher} piliers sont encore sous le plancher de 40 points.`}
            Sans eux l'objectif ne peut pas être validé, même en atteignant le seuil global.
          <//>`
        : null}
    </div>

    <div class="card">
      <h2>Couverture du catalogue</h2>
      <p class="small muted">
        ${CHALLENGES.length - jamaisFaits.length} défis sur ${CHALLENGES.length} ont été joués au
        moins une fois.
      </p>
      <div class="stack">
        ${PILLARS.map((p) => {
          const d = parPilier[p.id];
          return html`<div key=${p.id} class="row">
            <i class="pill-dot" style=${{ background: p.color }}></i>
            <span class="grow">${p.short}</span>
            <span class="tiny faint">${d.faits} sur ${d.total} défis joués</span>
          </div>`;
        })}
      </div>
      ${jamaisFaits.length
        ? html`<div>
            <hr class="sep" />
            <h3 style="font-size:.92rem">Jamais joués, à souffler aux joueurs</h3>
            <div class="row wrap" style="gap:.3rem">
              ${jamaisFaits.map(
                (c) => html`<span key=${c.id} class="chip plain">
                  <i class="pill-dot" style=${{ background: pillarColor(c.pillar) }}></i>${c.name}
                </span>`
              )}
            </div>
          </div>`
        : null}
    </div>

    <div class="card">
      <div class="card-head">
        <h2 class="grow">Découvertes cachées</h2>
        <span class="chip">${synergiesTrouvees.size} sur ${SYNERGIES.length}</span>
      </div>
      <div class="stack">
        ${SYNERGIES.map((s) => {
          const n = state.unlocks.filter((u) => u.synergy_id === s.id).length;
          return html`<div key=${s.id} class="row">
            <span class=${"chip " + (n ? "ok" : "plain")}>${n ? "✦" : "·"}</span>
            <span class="grow">${s.name}</span>
            <span class="tiny faint">
              ${n === 0 ? "non trouvée" : `${n} ${n === 1 ? "personne" : "personnes"}`}
            </span>
          </div>`;
        })}
      </div>
    </div>

    ${inactifs.length
      ? html`<div class="card">
          <h2>Inscrits sans aucun défi</h2>
          <p class="small muted">
            ${inactifs.length} ${inactifs.length === 1 ? "personne" : "personnes"}. Peut être un
            souci de réseau, ou simplement quelqu'un qui n'a pas encore commencé.
          </p>
          <div class="row wrap" style="gap:.3rem">
            ${inactifs.map(
              (p) => html`<span key=${p.id} class="chip plain">${p.first_name} ${p.last_name}</span>`
            )}
          </div>
        </div>`
      : null}
  </div>`;
}

// ------------------------------------------------------------- soumissions

function Soumissions({ onError }) {
  const [pillar, setPillar] = useState("");
  const [challenge, setChallenge] = useState("");
  const [busy, setBusy] = useState(null);

  const rows = useMemo(
    () =>
      state.feed.filter((f) => {
        if (pillar && f.pillar !== pillar) return false;
        if (challenge && f.challenge_id !== challenge) return false;
        return true;
      }),
    [state.feed, pillar, challenge]
  );

  async function remove(f) {
    const who = (f.member_names || []).join(", ") || f.submitter_name;
    if (!confirm(`Supprimer la soumission de « ${f.challenge_name} » par ${who} ?\n\nLes points et la photo seront retirés, et les jauges se recalculeront.`)) {
      return;
    }
    setBusy(f.id);
    onError(null);
    try {
      await deleteSubmission(f.id);
    } catch (err) {
      onError(friendly(err));
    } finally {
      setBusy(null);
    }
  }

  return html`<div class="stack">
    <div class="filters">
      <button class=${"fbtn" + (pillar === "" ? " on" : "")}
        onClick=${() => { setPillar(""); setChallenge(""); }}>Tous</button>
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

    <div class="row">
      <span class="tiny faint grow">
        ${rows.length} ${rows.length === 1 ? "soumission" : "soumissions"}, de la plus récente à la
        plus ancienne
      </span>
      <button class="btn sm quiet" onClick=${() => refreshFeed()}>Rafraîchir</button>
    </div>

    ${rows.length === 0
      ? html`<${Empty} icon="📋">Aucune soumission ne correspond.<//>`
      : rows.map((f) => {
          const p = PILLAR_BY_ID[f.pillar];
          const url = photoUrl(f.photo_path);
          const def = CHALLENGE_BY_ID[f.challenge_id];
          const nbQuestions = ((def && def.quiz) || []).length;
          const sansFaute =
            nbQuestions > 0 && f.quiz_attempts === nbQuestions && (f.quiz_restarts || 0) === 0;
          const erreurs = Math.max(0, (f.quiz_attempts || 0) - nbQuestions);
          return html`<div key=${f.id} class="card"
              style=${{ borderLeft: "5px solid " + pillarColor(f.pillar) }}>
            <div class="spread" style="align-items:flex-start">
              <div class="grow">
                <h3 style="margin:0">${f.challenge_name}</h3>
                <div class="tiny faint">
                  ${dateTimeShort(f.created_at)} · envoyé par ${f.submitter_name}
                </div>
              </div>
              <span class="chip plain nowrap">${f.points} pts</span>
            </div>
            <div class="row wrap" style="margin:.45rem 0">
              <span class="chip plain">
                <i class="pill-dot" style=${{ background: pillarColor(f.pillar) }}></i>${p ? p.short : f.pillar}
              </span>
              <span class="chip plain">passage ${f.repeat_index}</span>
              <span class="chip plain">jauge +${Number(f.gauge_points || 0)}</span>
              ${f.quiz_attempts > 0
                ? html`<span class="chip plain">${f.quiz_attempts} réponses</span>`
                : null}
              ${f.quiz_restarts > 0
                ? html`<span class="chip bad">
                    ${f.quiz_restarts} ${f.quiz_restarts === 1 ? "ratage" : "ratages"}
                  </span>`
                : sansFaute
                  ? html`<span class="chip ok">sans faute</span>`
                  : erreurs > 0
                    ? html`<span class="chip warn">${erreurs} ${erreurs === 1 ? "erreur" : "erreurs"}</span>`
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

// ----------------------------------------------------------------- joueurs

function Joueurs({ onError }) {
  const [edit, setEdit] = useState(null);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [busy, setBusy] = useState(null);
  const [recherche, setRecherche] = useState("");

  const rows = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    const l = state.scores
      .slice()
      .sort((a, b) =>
        `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`, "fr")
      );
    return q ? l.filter((p) => `${p.first_name} ${p.last_name}`.toLowerCase().includes(q)) : l;
  }, [state.scores, recherche]);

  // Doublons probables : deux profils avec le meme prenom.
  const doublons = useMemo(() => {
    const m = {};
    state.scores.forEach((p) => {
      const k = p.first_name.trim().toLowerCase();
      (m[k] = m[k] || []).push(p);
    });
    return Object.values(m).filter((g) => g.length > 1);
  }, [state.scores]);

  async function renommer(p) {
    setBusy(p.id);
    onError(null);
    try {
      await adminRenameParticipant(p.id, first, last);
      setEdit(null);
    } catch (err) {
      onError(friendly(err));
    } finally {
      setBusy(null);
    }
  }

  async function supprimer(p) {
    if (!confirm(`Supprimer définitivement ${p.first_name} ${p.last_name} ?\n\nSes ${p.defis_faits} défi(s), ses photos et ses points disparaissent. Les jauges se recalculent.`)) {
      return;
    }
    setBusy(p.id);
    onError(null);
    try {
      await adminDeleteParticipant(p.id);
    } catch (err) {
      onError(friendly(err));
    } finally {
      setBusy(null);
    }
  }

  return html`<div class="stack">
    ${doublons.length
      ? html`<${Banner} kind="warn">
          Prénoms en double, peut être quelqu'un qui s'est inscrit deux fois :
          ${doublons.map((g) => g.map((p) => `${p.first_name} ${p.last_name}`).join(" et ")).join(", ")}.
        <//>`
      : null}

    <input type="search" placeholder="Chercher un joueur" value=${recherche}
           onInput=${(e) => setRecherche(e.target.value)} />

    <p class="tiny faint">${rows.length} ${rows.length === 1 ? "joueur" : "joueurs"}</p>

    ${rows.length === 0
      ? html`<${Empty} icon="🙋">Personne ne correspond.<//>`
      : rows.map((p) =>
          edit === p.id
            ? html`<div key=${p.id} class="card">
                <label class="field">
                  <span>Prénom</span>
                  <input type="text" value=${first} onInput=${(e) => setFirst(e.target.value)} />
                </label>
                <label class="field">
                  <span>Nom</span>
                  <input type="text" value=${last} onInput=${(e) => setLast(e.target.value)} />
                </label>
                <div class="row">
                  <button class="btn sm grow" disabled=${busy === p.id}
                          onClick=${() => renommer(p)}>Enregistrer</button>
                  <button class="btn sm quiet grow" onClick=${() => setEdit(null)}>Annuler</button>
                </div>
              </div>`
            : html`<div key=${p.id} class="card">
                <h3 style="margin:0">${p.first_name} ${p.last_name}</h3>
                <div class="tiny faint">
                  ${p.score} points · ${p.defis_faits} ${p.defis_faits === 1 ? "défi" : "défis"}
                  ${p.synergies_debloquees ? ` · ${p.synergies_debloquees} découverte(s)` : ""}
                  ${p.vibe ? ` · envie ${p.vibe}` : ""}
                </div>
                <div class="row" style="margin-top:.5rem">
                  <button class="btn sm quiet grow" onClick=${() => {
                    setEdit(p.id);
                    setFirst(p.first_name);
                    setLast(p.last_name);
                  }}>Renommer</button>
                  <button class="btn sm danger ghost grow" disabled=${busy === p.id}
                          onClick=${() => supprimer(p)}>Supprimer</button>
                </div>
              </div>`
        )}
  </div>`;
}

// ---------------------------------------------------------------- attentes

function Attentes({ onError }) {
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState(null);

  async function charger() {
    try {
      setRows(await loadLockouts());
    } catch (err) {
      onError(friendly(err));
      setRows([]);
    }
  }

  useEffect(() => {
    charger();
    const t = setInterval(charger, 20000);
    return () => clearInterval(t);
  }, []);

  async function lever(args, label, cle) {
    if (!confirm(`Lever ${label} ?`)) return;
    setBusy(cle);
    onError(null);
    try {
      await adminClearLockouts(args);
      await charger();
    } catch (err) {
      onError(friendly(err));
    } finally {
      setBusy(null);
    }
  }

  if (rows === null) {
    return html`<div class="card">
      <p class="muted small row"><${Spinner} dark=${true} /> Chargement<//></p>
    </div>`;
  }

  return html`<div class="stack">
    <div class="card">
      <h2>Attentes en cours</h2>
      <p class="small muted">
        Après un quiz raté, tout le groupe présent attend ${state.lockoutMinutes} minutes avant de
        pouvoir reprendre ce défi. Vous pouvez lever une attente si la situation le justifie, par
        exemple un téléphone qui a lâché ou une fausse manipulation évidente.
      </p>
      <div class="row">
        <button class="btn sm quiet grow" onClick=${charger}>Rafraîchir</button>
        ${rows.length
          ? html`<button class="btn sm danger ghost grow" disabled=${busy === "tout"}
                   onClick=${() => lever({}, "toutes les attentes en cours", "tout")}>
              Tout lever
            </button>`
          : null}
      </div>
    </div>

    ${rows.length === 0
      ? html`<${Empty} icon="⏳">Aucune attente en cours. Personne n'est bloqué.<//>`
      : rows.map(
          (l) => html`<div key=${l.id} class="card"
              style=${{ borderLeft: "5px solid " + pillarColor(l.pillar) }}>
            <div class="spread" style="align-items:flex-start">
              <div class="grow">
                <h3 style="margin:0">${l.participant_name}</h3>
                <div class="tiny faint">
                  ${l.challenge_name}
                  ${l.triggered_by_name && l.triggered_by !== l.participant_id
                    ? ` · raté par ${l.triggered_by_name}`
                    : ""}
                </div>
              </div>
              <span class="chip bad nowrap">${l.minutes_restantes} min</span>
            </div>
            <p class="tiny faint" style="margin:.4rem 0 0">
              Rouvert à ${new Date(l.until).toLocaleTimeString("fr-CH", { hour: "2-digit", minute: "2-digit" })}
            </p>
            <hr class="sep" />
            <button class="btn sm quiet block" disabled=${busy === l.id}
                    onClick=${() => lever(
                      { participantId: l.participant_id, challengeId: l.challenge_id },
                      `l'attente de ${l.participant_name} sur ${l.challenge_name}`,
                      l.id
                    )}>
              Lever cette attente
            </button>
          </div>`
        )}
  </div>`;
}

// ---------------------------------------------------------------- reglages

function Reglages({ onError }) {
  const [minutes, setMinutes] = useState(String(state.lockoutMinutes));
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(null);
  const [fait, setFait] = useState(null);

  async function enregistrerDuree(e) {
    e.preventDefault();
    setBusy("duree");
    onError(null);
    try {
      await adminSetLockoutMinutes(parseInt(minutes, 10));
    } catch (err) {
      onError(friendly(err));
    } finally {
      setBusy(null);
    }
  }

  async function remiseAZero(e) {
    e.preventDefault();
    if (!confirm("Effacer tous les joueurs, toutes les soumissions et toutes les photos ?\n\nLe catalogue des défis et votre code organisateur ne sont pas touchés. Cette action est définitive.")) {
      return;
    }
    setBusy("reset");
    onError(null);
    try {
      const d = await adminResetGame(confirmation);
      setFait(d);
      setConfirmation("");
    } catch (err) {
      onError(friendly(err));
    } finally {
      setBusy(null);
    }
  }

  return html`<div class="stack">
    <form class="card" onSubmit=${enregistrerDuree}>
      <h2>Durée de l'attente après un quiz raté</h2>
      <p class="small muted">
        S'applique à toutes les personnes présentes au moment du ratage. Mettre zéro supprime
        l'attente et rend le quiz immédiatement reprenable.
      </p>
      <label class="field">
        <span>Minutes</span>
        <input type="tel" inputmode="numeric" value=${minutes}
               onInput=${(e) => setMinutes(e.target.value)} />
      </label>
      <button class="btn block" type="submit" disabled=${busy === "duree"}>
        ${busy === "duree" ? html`<${Spinner} />` : null} Enregistrer
      </button>
      <p class="tiny faint" style="margin-top:.5rem">
        Réglage actuel sur le serveur : ${state.lockoutMinutes} minutes.
      </p>
    </form>

    <div class="card">
      <h2>État du jeu</h2>
      <dl class="kv">
        <dt>Joueurs</dt><dd>${state.scores.length}</dd>
        <dt>Soumissions</dt><dd>${state.feed.length}</dd>
        <dt>Photos</dt><dd>${state.feed.filter((f) => f.photo_path).length}</dd>
        <dt>Total des jauges</dt><dd>${state.collective ? state.collective.total : 0}</dd>
      </dl>
      <div style="height:.6rem"></div>
      <button class="btn quiet block" onClick=${() => refresh({ feed: true })}>
        Recharger les données
      </button>
    </div>

    ${fait
      ? html`<${Banner} kind="ok">
          Remise à zéro faite. ${fait.joueurs_supprimes} joueur(s) et
          ${fait.soumissions_supprimees} soumission(s) effacés.
        <//>`
      : null}

    <form class="card" style="border-color:#e5abab" onSubmit=${remiseAZero}>
      <h2 style="color:var(--bad)">Remise à zéro</h2>
      <p class="small" style="color:#7d1f1f">
        Efface tous les profils, toutes les soumissions et toutes les photos. À faire une fois les
        essais terminés, avant le jour de l'événement. Les 39 défis, les 5 découvertes et votre
        code organisateur ne sont pas touchés.
      </p>
      <label class="field">
        <span>Pour confirmer, tapez REMISE A ZERO en majuscules</span>
        <input type="text" value=${confirmation} autocomplete="off"
               onInput=${(e) => setConfirmation(e.target.value)} />
      </label>
      <button class="btn danger block" type="submit"
              disabled=${busy === "reset" || confirmation.trim().toUpperCase() !== "REMISE A ZERO"}>
        ${busy === "reset" ? html`<${Spinner} />` : null} Tout effacer
      </button>
    </form>
  </div>`;
}

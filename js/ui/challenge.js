// Un defi en detail, et son ecran de soumission.
//
// Le quiz ne pardonne pas : une mauvaise reponse et le defi est rate, pour
// toute l'equipe presente. Il faut alors attendre la fin de la penalite avant
// de pouvoir le reprendre. Le groupe est donc verrouille avant le depart du
// quiz, sinon on ne saurait pas qui penaliser.
const { html, useState, useMemo, useRef, useEffect } = window.htmPreact;

import { CHALLENGE_BY_ID, CHALLENGES } from "../data/challenges.js";
import { PILLAR_BY_ID, STYLE_BY_ID, TIERS } from "../data/pillars.js";
import {
  state,
  submit,
  reportQuizFailure,
  myLockUntil,
  lockedUntil,
  myDoneChallenges,
  friendly
} from "../store.js";
import {
  Banner,
  Spinner,
  Empty,
  pillarColor,
  Avatar
} from "./bits.js";
import { locIcon, locLabel } from "./challenges.js";

export function ChallengeDetail({ id, go }) {
  const c = CHALLENGE_BY_ID[id];
  if (!c) {
    return html`<${Empty} icon="🤔">
      Ce défi n'existe pas.
      <p><button class="btn ghost" onClick=${() => go("#/defis")}>Retour à la liste</button></p>
    <//>`;
  }
  return html`<${Form} key=${id} c=${c} go=${go} />`;
}

function heure(d) {
  return d.toLocaleTimeString("fr-CH", { hour: "2-digit", minute: "2-digit" });
}

/** Décompte vivant jusqu'à la fin d'une pénalité. Renvoie null une fois passée. */
function useCountdown(target) {
  const [, tick] = useState(0);
  useEffect(() => {
    if (!target) return undefined;
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [target ? target.getTime() : 0]);
  if (!target) return null;
  const ms = target.getTime() - Date.now();
  if (ms <= 0) return null;
  const total = Math.ceil(ms / 1000);
  return {
    texte: `${Math.floor(total / 60)} min ${String(total % 60).padStart(2, "0")} s`,
    heure: heure(target)
  };
}

function Form({ c, go }) {
  const needsPhoto = c.proof === "photo" || c.proof === "photo_quiz";
  const needsQuiz = c.proof === "quiz" || c.proof === "photo_quiz";
  const quiz = c.quiz || [];

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [members, setMembers] = useState([]);
  const [peopleSearch, setPeopleSearch] = useState("");
  const [note, setNote] = useState("");
  const [answers, setAnswers] = useState(() => quiz.map(() => ({ solved: false, wrong: [] })));
  const [attempts, setAttempts] = useState(0);
  const [restarts, setRestarts] = useState(0);
  const [started, setStarted] = useState(!needsQuiz);
  const [lockedGroup, setLockedGroup] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const fileInput = useRef(null);

  const compte = useCountdown(myLockUntil(c.id));
  const alreadyDone = myDoneChallenges().includes(c.id);
  const pillar = PILLAR_BY_ID[c.pillar];
  const style = STYLE_BY_ID[c.style];
  const tier = TIERS[c.tier];

  const quizDone = quiz.length > 0 && answers.every((a) => a.solved);
  const quizIndex = answers.findIndex((a) => !a.solved);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // La fin de l'attente remet le défi à disposition, avec un quiz tout neuf.
  useEffect(() => {
    if (!compte && lockedGroup) {
      setAnswers(quiz.map(() => ({ solved: false, wrong: [] })));
      setStarted(false);
      setLockedGroup(null);
    }
  }, [compte === null]);

  const people = useMemo(() => {
    const q = peopleSearch.trim().toLowerCase();
    const list = state.scores
      .filter((p) => !state.me || p.id !== state.me.id)
      .slice()
      .sort((a, b) =>
        `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`, "fr")
      );
    if (!q) return list;
    return list.filter((p) => `${p.first_name} ${p.last_name}`.toLowerCase().includes(q));
  }, [peopleSearch, state.scores]);

  async function answer(qi, oi) {
    if (compte || answers[qi].solved) return;
    setAttempts((n) => n + 1);
    if (oi === quiz[qi].answer) {
      setAnswers((prev) => {
        const next = prev.slice();
        next[qi] = { solved: true, wrong: prev[qi].wrong };
        return next;
      });
      return;
    }
    // Raté. L'attente tombe tout de suite, pour tout le groupe verrouillé.
    setAnswers((prev) => {
      const next = prev.slice();
      next[qi] = { solved: false, wrong: [...prev[qi].wrong, oi] };
      return next;
    });
    setRestarts((n) => n + 1);
    try {
      await reportQuizFailure({ challengeId: c.id, memberIds: lockedGroup || members });
    } catch (err) {
      console.warn("Pénalité non transmise", err);
    }
  }

  function startQuiz() {
    setLockedGroup(members.slice());
    setStarted(true);
    setAnswers(quiz.map(() => ({ solved: false, wrong: [] })));
  }

  function toggleMember(pid) {
    if (started && needsQuiz) return;
    setMembers((prev) => (prev.includes(pid) ? prev.filter((x) => x !== pid) : [...prev, pid]));
  }

  // Membres encore en attente sur ce défi : ils ne seront pas crédités.
  const bloques = (lockedGroup || members)
    .map((id) => ({ id, until: lockedUntil(id, c.id) }))
    .filter((m) => m.until)
    .map((m) => {
      const p = state.scores.find((s) => s.id === m.id);
      return { nom: p ? `${p.first_name} ${p.last_name}` : "quelqu'un", heure: heure(m.until) };
    });

  const blocking = [];
  if (needsPhoto && !file) blocking.push("ajoutez la photo");
  if (needsQuiz && !started) blocking.push("faites le quiz");
  else if (needsQuiz && !quizDone) blocking.push("terminez le quiz");

  async function send(e) {
    e.preventDefault();
    if (compte) return;
    if (blocking.length) {
      setError("Avant d'envoyer, " + blocking.join(" et "));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const out = await submit({
        challengeId: c.id,
        memberIds: lockedGroup || members,
        file,
        note,
        quizAttempts: attempts,
        quizRestarts: restarts
      });
      setResult(out);
    } catch (err) {
      setError(friendly(err));
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return html`<${Done} c=${c} result=${result} go=${go}
             memberCount=${(lockedGroup || members).length + 1} restarts=${restarts} />`;
  }

  const groupeFige = started && needsQuiz;
  const groupeAffiche = lockedGroup || members;

  return html`<form class="stack" onSubmit=${send}>
    <div class="card" style=${{ borderLeft: "5px solid " + pillarColor(c.pillar) }}>
      <div class="spread" style="align-items:flex-start">
        <h1 class="grow" style="margin:0">${c.name}</h1>
        <span class="pts nowrap" style="font-size:1.2rem;font-weight:800">${c.points} pts</span>
      </div>
      <div class="meta row wrap" style="margin:.5rem 0">
        <span class="chip plain"><i class="pill-dot" style=${{ background: pillarColor(c.pillar) }}></i>${pillar ? pillar.name : c.pillar}</span>
        <span class="chip plain">${style ? style.icon + " " + style.label : c.style}</span>
        <span class="chip plain">${tier ? tier.label : c.tier}</span>
        ${alreadyDone ? html`<span class="chip ok">✓ Déjà validé par vous</span>` : null}
      </div>
      <div class="small muted">
        ${locIcon(c.location_kind)} <strong>${locLabel(c.location_kind)}</strong> · ${c.location_detail}
        <br />⏱ ${c.duration} · 🧭 ${c.branch}
      </div>
    </div>

    ${compte
      ? html`<div class="card" style="border-color:#e5abab;background:var(--bad-soft)">
          <h2 style="color:var(--bad);margin-bottom:.3rem">Défi en attente</h2>
          <p class="small" style="color:#7d1f1f">
            Le quiz a été raté. Ce défi se rouvre à ${compte.heure}, pour vous comme pour toutes les
            personnes qui étaient présentes à ce moment là.
          </p>
          <div class="center" style="margin:.7rem 0">
            <div style="font-size:2.2rem;font-weight:800;color:var(--bad);font-variant-numeric:tabular-nums">
              ${compte.texte}
            </div>
            <div class="tiny" style="color:#7d1f1f">avant de pouvoir réessayer</div>
          </div>
          <p class="tiny" style="color:#7d1f1f;margin:0">
            Il reste ${CHALLENGES.length - 1} autres défis en attendant.
          </p>
        </div>`
      : null}

    <div class="card">
      <h2>Ce qu'il faut faire</h2>
      <p>${c.brief}</p>
      ${c.alerte
        ? html`<div class="alerte-defi">
            <span class="ic" aria-hidden="true">⚠️</span>
            <span>${c.alerte}</span>
          </div>`
        : null}
    </div>

    ${alreadyDone
      ? html`<${Banner} kind="info">
          Vous avez déjà validé ce défi. Vous pouvez le refaire avec un autre groupe du moment, la
          photo rejoindra l'album et le pilier y gagnera encore des points, mais votre score
          personnel ne compte ce défi qu'une seule fois.
        <//>`
      : null}

    <div class="card">
      <h2>Ce qu'il faut envoyer</h2>
      <ul class="small muted" style="margin:0;padding-left:1.2rem">
        ${needsPhoto ? html`<li>${c.photo_hint}</li>` : null}
        ${needsQuiz
          ? html`<li>
              Les ${quiz.length} réponses du quiz, sans aucune erreur. Une mauvaise réponse et le
              défi est raté pour tout le groupe, qui devra attendre ${state.lockoutMinutes} minutes
              avant de pouvoir le reprendre.
            </li>`
          : null}
        <li>Qui était présent dans le groupe du moment, pour que chacun reçoive ses points.</li>
        ${c.note_label ? html`<li>${c.note_label}.</li>` : null}
      </ul>
    </div>

    <div class="card">
      <div class="card-head">
        <h2 class="grow">Le groupe du moment</h2>
        ${groupeFige ? html`<span class="chip">figé</span>` : null}
      </div>
      <p class="small muted">
        ${groupeFige
          ? "Ce groupe joue ce défi. Il ne change plus jusqu'au bout."
          : `Cochez les personnes présentes avec vous, avant de commencer. Chacune reçoit les ${c.points} points du défi, et chacune subit l'attente si le quiz est raté.`}
      </p>
      <div class="people" style="margin-bottom:.5rem">
        <span class="person me">
          <span class="bx">✓</span>
          <${Avatar} p=${state.me} taille="sm" />
          <span class="grow">${state.me ? state.me.first_name + " " + state.me.last_name : "Vous"} (vous)</span>
        </span>
      </div>
      ${groupeFige
        ? html`<p class="small">
            ${groupeAffiche.length === 0
              ? "Vous jouez seul."
              : groupeAffiche
                  .map((id) => {
                    const p = state.scores.find((s) => s.id === id);
                    return p ? `${p.first_name} ${p.last_name}` : null;
                  })
                  .filter(Boolean)
                  .join(", ")}
          </p>`
        : html`<div>
            ${state.scores.length > 8
              ? html`<input type="search" placeholder="Chercher quelqu'un" value=${peopleSearch}
                       onInput=${(e) => setPeopleSearch(e.target.value)} style="margin-bottom:.5rem" />`
              : null}
            ${people.length === 0
              ? html`<p class="tiny faint">Personne d'autre n'est enregistré pour le moment.</p>`
              : html`<div class="people">
                  ${people.map((p) => {
                    const lock = lockedUntil(p.id, c.id);
                    return html`<button type="button" key=${p.id}
                      class=${"person" + (members.includes(p.id) ? " on" : "")}
                      onClick=${() => toggleMember(p.id)}>
                      <span class="bx">${members.includes(p.id) ? "✓" : ""}</span>
                      <${Avatar} p=${p} taille="sm" />
                      <span class="grow">
                        ${p.first_name} ${p.last_name}
                        ${lock
                          ? html`<span class="tiny" style="display:block;color:var(--bad)">
                              en attente jusqu'à ${heure(lock)}
                            </span>`
                          : null}
                      </span>
                    </button>`;
                  })}
                </div>`}
            <p class="tiny faint" style="margin-top:.5rem">
              ${members.length + 1} ${members.length + 1 === 1 ? "personne" : "personnes"} dans le
              groupe. Vous êtes seul ? Laissez simplement tout décoché.
            </p>
          </div>`}
      ${bloques.length
        ? html`<${Banner} kind="warn">
            ${bloques.map((b) => `${b.nom} est en attente sur ce défi jusqu'à ${b.heure}`).join(". ")}.${" "}
            ${bloques.length === 1 ? "Cette personne ne recevra pas" : "Ces personnes ne recevront pas"}${" "}
            les points de ce défi.
          <//>`
        : null}
    </div>

    ${needsPhoto
      ? html`<div class="card">
          <h2>La photo</h2>
          <p class="small muted">${c.photo_hint}</p>
          <input ref=${fileInput} type="file" accept="image/*" capture="environment"
                 onChange=${(e) => setFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)} />
          ${preview
            ? html`<div class="photo-prev">
                <img src=${preview} alt="Votre photo" />
                <button type="button" class="rm" onClick=${() => {
                  setFile(null);
                  if (fileInput.current) fileInput.current.value = "";
                }}>Changer</button>
              </div>`
            : html`<button type="button" class="photo-zone" style="width:100%"
                     onClick=${() => fileInput.current && fileInput.current.click()}>
                <span class="big">📷</span>
                <strong>Prendre ou choisir une photo</strong>
                <div class="tiny" style="margin-top:.2rem">
                  Elle est compressée automatiquement avant l'envoi
                </div>
              </button>`}
        </div>`
      : null}

    ${c.note_label
      ? html`<div class="card">
          <h2>Votre réponse</h2>
          <label class="field">
            <span>${c.note_label}</span>
            <textarea value=${note} maxlength="2000"
                      placeholder="Quelques mots suffisent"
                      onInput=${(e) => setNote(e.target.value)}></textarea>
          </label>
        </div>`
      : null}

    ${needsQuiz && !compte
      ? html`<div class="card" id="bloc-quiz">
          <div class="card-head">
            <h2 class="grow">Quiz</h2>
            ${started
              ? html`<span class=${"chip " + (quizDone ? "ok" : "")}>
                  ${answers.filter((a) => a.solved).length} sur ${quiz.length}
                </span>`
              : null}
          </div>
          ${!started
            ? html`<div>
                <p class="small muted">
                  ${quiz.length} questions, aucune erreur permise. Une seule mauvaise réponse et le
                  défi est raté pour tout le groupe, qui devra patienter ${state.lockoutMinutes}
                  minutes avant de pouvoir le reprendre.
                </p>
                <p class="small muted">
                  Vérifiez d'abord que le groupe ci dessus est le bon, il sera figé pendant le quiz.
                </p>
                <button type="button" class="btn block" onClick=${startQuiz}>
                  Commencer le quiz${members.length ? ` à ${members.length + 1}` : " seul"}
                </button>
              </div>`
            : html`<div>
                <p class="tiny faint" style="margin-top:-.3rem">
                  Aucune erreur permise. Prenez le temps de réfléchir avant de répondre.
                </p>
                ${quiz.map((q, i) =>
                  i <= (quizIndex === -1 ? quiz.length - 1 : quizIndex)
                    ? html`<${Question} key=${i} q=${q} i=${i} total=${quiz.length}
                             st=${answers[i]} onPick=${(oi) => answer(i, oi)} />`
                    : null
                )}
                ${quizDone
                  ? html`<div class="q good">
                      <div class="q-num">Quiz réussi du premier coup</div>
                      <p style="margin:.3rem 0 0">${c.savoir}</p>
                    </div>`
                  : null}
              </div>`}
        </div>`
      : null}

    ${error ? html`<${Banner} kind="bad">${error}<//>` : null}
    ${!state.online && !compte
      ? html`<${Banner} kind="warn">
          Pas de réseau. Vous pouvez quand même envoyer, la soumission part automatiquement dès que
          la connexion revient.
        <//>`
      : null}

    ${compte
      ? html`<button class="btn block" type="button" onClick=${() => go("#/defis")}>
          Choisir un autre défi
        </button>`
      : html`<div class="stack">
          <button class="btn block" type="submit" disabled=${busy}>
            ${busy ? html`<${Spinner} />` : null}
            ${busy ? "Envoi" : "Valider le défi"}
          </button>
          ${blocking.length
            ? html`<p class="tiny faint center" style="margin-top:-.3rem">
                Il reste à ${blocking.join(" et ")}.
              </p>`
            : null}
          <button class="btn quiet block" type="button" onClick=${() => go("#/defis")}>
            Revenir à la liste
          </button>
        </div>`}
  </form>`;
}

function Question({ q, i, total, st, onPick }) {
  const letters = ["A", "B", "C", "D", "E"];
  return html`<div class=${"q" + (st.solved ? " good" : "")}>
    <div class="q-num">Question ${i + 1} sur ${total}</div>
    <div class="q-text">${q.q}</div>
    <div class="opts">
      ${q.options.map((opt, oi) => {
        const isGood = st.solved && oi === q.answer;
        const isBad = st.wrong.includes(oi);
        const cls = "opt" + (isGood ? " picked-good" : isBad ? " picked-bad" : "");
        return html`<button type="button" key=${oi} class=${cls}
          disabled=${st.solved || isBad} onClick=${() => onPick(oi)}>
          <span class="mk">${isGood ? "✓" : isBad ? "✕" : letters[oi]}</span>
          <span class="grow">${opt}</span>
        </button>`;
      })}
    </div>
    ${st.solved ? html`<div class="q-why">${q.why}</div>` : null}
  </div>`;
}

function Done({ c, result, go, memberCount, restarts }) {
  const sent = result.sent;
  const data = result.result || {};
  const gauge = Number(data.gauge_points || 0);
  const repeat = Number(data.repeat_index || 1);
  const exclus = data.excluded || [];
  const pillar = PILLAR_BY_ID[c.pillar];
  const credites = Array.isArray(data.members) ? data.members.length : memberCount;

  return html`<div class="stack">
    <div class="card center" style="padding:1.4rem 1rem">
      <div style="font-size:3rem;line-height:1">${sent ? "✅" : "⏳"}</div>
      <h1 style="margin-top:.4rem">${sent ? "Défi validé" : "Enregistré sur votre téléphone"}</h1>
      ${sent
        ? html`<p class="muted">
            ${c.points} points pour
            ${credites === 1 ? "vous" : `chacune des ${credites} personnes créditées`}.
            ${restarts === 0 ? " Quiz réussi sans la moindre erreur." : ""}
          </p>`
        : html`<p class="muted">
            Pas de réseau pour le moment. Votre soumission est en file d'attente et partira toute
            seule dès que la connexion revient. Vous pouvez fermer l'application sans rien perdre.
          </p>`}
    </div>

    ${exclus.length
      ? html`<${Banner} kind="warn">
          ${exclus.length === 1
            ? "Une personne du groupe était"
            : `${exclus.length} personnes du groupe étaient`}
          encore en attente sur ce défi après un ratage.
          ${exclus.length === 1 ? "Elle n'a pas reçu" : "Elles n'ont pas reçu"} les points.
        <//>`
      : null}

    ${sent
      ? html`<div class="card">
          <h2>Ce que ça rapporte</h2>
          <dl class="kv">
            <dt>Votre score personnel</dt>
            <dd>+${c.points} points</dd>
            <dt>Jauge ${pillar ? pillar.name : c.pillar}</dt>
            <dd>+${gauge % 1 === 0 ? gauge : gauge.toFixed(2)} points</dd>
            <dt>Personnes créditées</dt>
            <dd>${credites}</dd>
          </dl>
          ${repeat > 1
            ? html`<p class="tiny faint" style="margin-top:.6rem">
                Ce défi avait déjà été fait ${repeat - 1} fois aujourd'hui, donc il apporte un peu
                moins à la jauge collective. Votre score personnel, lui, reçoit toujours les points
                pleins.
              </p>`
            : null}
        </div>`
      : null}

    <button class="btn block" onClick=${() => go("#/defis")}>Choisir un autre défi</button>
    <button class="btn ghost block" onClick=${() => go("#/progression")}>Voir les jauges</button>
  </div>`;
}

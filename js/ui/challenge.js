// Un defi en detail, et son ecran de soumission.
// Photo, groupe du moment, quiz avec reessai immediat sans penalite.
const { html, useState, useMemo, useRef, useEffect } = window.htmPreact;

import { CHALLENGE_BY_ID } from "../data/challenges.js";
import { PILLAR_BY_ID, STYLE_BY_ID, TIERS } from "../data/pillars.js";
import { SYNERGIES } from "../data/synergies.js";
import { state, submit, myDoneChallenges, friendly } from "../store.js";
import { Banner, Spinner, Empty, pillarColor } from "./bits.js";
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const fileInput = useRef(null);

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

  function answer(qi, oi) {
    const q = quiz[qi];
    if (answers[qi].solved) return;
    setAttempts((n) => n + 1);
    setAnswers((prev) => {
      const next = prev.slice();
      if (oi === q.answer) {
        next[qi] = { solved: true, wrong: prev[qi].wrong };
      } else {
        const wrong = prev[qi].wrong.includes(oi) ? prev[qi].wrong : [...prev[qi].wrong, oi];
        next[qi] = { solved: false, wrong };
      }
      return next;
    });
  }

  function toggleMember(pid) {
    setMembers((prev) => (prev.includes(pid) ? prev.filter((x) => x !== pid) : [...prev, pid]));
  }

  const blocking = [];
  if (needsPhoto && !file) blocking.push("ajoutez la photo");
  if (needsQuiz && !quizDone) blocking.push("terminez le quiz");

  async function send(e) {
    e.preventDefault();
    if (blocking.length) {
      setError("Avant d'envoyer, " + blocking.join(" et "));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const out = await submit({
        challengeId: c.id,
        memberIds: members,
        file,
        note,
        quizAttempts: attempts
      });
      setResult(out);
    } catch (err) {
      setError(friendly(err));
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return html`<${Done} c=${c} result=${result} go=${go} memberCount=${members.length + 1} />`;
  }

  const related = SYNERGIES.filter(
    (s) => s.triggers_a.includes(c.id) || s.triggers_b.includes(c.id)
  );

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

    <div class="card">
      <h2>Ce qu'il faut faire</h2>
      <p>${c.brief}</p>
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
        ${needsQuiz ? html`<li>Les ${quiz.length} réponses du quiz ci dessous. Mauvaise réponse, vous réessayez tout de suite, sans aucune pénalité.</li>` : null}
        <li>Qui était présent dans le groupe du moment, pour que chacun reçoive ses points.</li>
        ${c.note_label ? html`<li>${c.note_label}.</li>` : null}
      </ul>
    </div>

    ${needsQuiz
      ? html`<div class="card">
          <div class="card-head">
            <h2>Quiz</h2>
            <span class="chip ${quizDone ? "ok" : ""}">
              ${answers.filter((a) => a.solved).length} sur ${quiz.length}
            </span>
          </div>
          ${quiz.map((q, i) =>
            i <= (quizIndex === -1 ? quiz.length - 1 : quizIndex)
              ? html`<${Question} key=${i} q=${q} i=${i} total=${quiz.length}
                       st=${answers[i]} onPick=${(oi) => answer(i, oi)} />`
              : null
          )}
          ${quizDone
            ? html`<div class="q good">
                <div class="q-num">Quiz terminé</div>
                <p style="margin:.3rem 0 0">${c.savoir}</p>
              </div>`
            : null}
        </div>`
      : html`<div class="card">
          <h2>Le fond</h2>
          <p class="muted">${c.savoir}</p>
        </div>`}

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

    <div class="card">
      <h2>Le groupe du moment</h2>
      <p class="small muted">
        Cochez les personnes présentes avec vous. Chacune reçoit les ${c.points} points du défi sur
        son score personnel.
      </p>
      <div class="people" style="margin-bottom:.5rem">
        <span class="person me">
          <span class="bx">✓</span>
          <span class="grow">${state.me ? state.me.first_name + " " + state.me.last_name : "Vous"} (vous)</span>
        </span>
      </div>
      ${state.scores.length > 8
        ? html`<input type="search" placeholder="Chercher quelqu'un" value=${peopleSearch}
                 onInput=${(e) => setPeopleSearch(e.target.value)} style="margin-bottom:.5rem" />`
        : null}
      ${people.length === 0
        ? html`<p class="tiny faint">Personne d'autre n'est enregistré pour le moment.</p>`
        : html`<div class="people">
            ${people.map(
              (p) => html`<button type="button" key=${p.id}
                class=${"person" + (members.includes(p.id) ? " on" : "")}
                onClick=${() => toggleMember(p.id)}>
                <span class="bx">${members.includes(p.id) ? "✓" : ""}</span>
                <span class="grow">${p.first_name} ${p.last_name}</span>
              </button>`
            )}
          </div>`}
      <p class="tiny faint" style="margin-top:.5rem">
        ${members.length + 1} ${members.length + 1 === 1 ? "personne" : "personnes"} dans le groupe.
        Vous êtes seul ? Laissez simplement tout décoché.
      </p>
    </div>

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

    ${related.length
      ? html`<p class="tiny faint center">
          Des surprises peuvent se déclencher quand certains défis se rencontrent. Continuez.
        </p>`
      : null}

    ${error ? html`<${Banner} kind="bad">${error}<//>` : null}
    ${!state.online
      ? html`<${Banner} kind="warn">
          Pas de réseau. Vous pouvez quand même envoyer, la soumission part automatiquement dès que
          la connexion revient.
        <//>`
      : null}

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
    ${!st.solved && st.wrong.length
      ? html`<div class="q-retry">
          Pas tout à fait. Réessayez, cela ne vous coûte aucun point.
        </div>`
      : null}
  </div>`;
}

function Done({ c, result, go, memberCount }) {
  const sent = result.sent;
  const data = result.result || {};
  const gauge = Number(data.gauge_points || 0);
  const repeat = Number(data.repeat_index || 1);
  const pillar = PILLAR_BY_ID[c.pillar];

  return html`<div class="stack">
    <div class="card center" style="padding:1.4rem 1rem">
      <div style="font-size:3rem;line-height:1">${sent ? "✅" : "⏳"}</div>
      <h1 style="margin-top:.4rem">${sent ? "Défi validé" : "Enregistré sur votre téléphone"}</h1>
      ${sent
        ? html`<p class="muted">
            ${c.points} points pour ${memberCount === 1 ? "vous" : `chacune des ${memberCount} personnes du groupe`}.
          </p>`
        : html`<p class="muted">
            Pas de réseau pour le moment. Votre soumission est en file d'attente et partira toute
            seule dès que la connexion revient. Vous pouvez fermer l'application sans rien perdre.
          </p>`}
    </div>

    ${sent
      ? html`<div class="card">
          <h2>Ce que ça rapporte</h2>
          <dl class="kv">
            <dt>Votre score personnel</dt>
            <dd>+${c.points} points</dd>
            <dt>Jauge ${pillar ? pillar.name : c.pillar}</dt>
            <dd>+${gauge % 1 === 0 ? gauge : gauge.toFixed(2)} points</dd>
            <dt>Groupe du moment</dt>
            <dd>${memberCount} ${memberCount === 1 ? "personne" : "personnes"}</dd>
          </dl>
          ${repeat > 1
            ? html`<p class="tiny faint" style="margin-top:.6rem">
                Ce défi avait déjà été fait ${repeat - 1} ${repeat - 1 === 1 ? "fois" : "fois"} aujourd'hui, donc
                il apporte un peu moins à la jauge collective. Votre score personnel, lui, reçoit
                toujours les points pleins.
              </p>`
            : null}
        </div>`
      : null}

    <button class="btn block" onClick=${() => go("#/defis")}>Choisir un autre défi</button>
    <button class="btn ghost block" onClick=${() => go("#/progression")}>Voir les jauges</button>
  </div>`;
}

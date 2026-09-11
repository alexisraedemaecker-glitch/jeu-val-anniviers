// Premier lancement : on choisit son profil dans la liste, ou on en cree un.
// Pas de mot de passe, pas d'email. L'application s'en souvient ensuite.
const { html, useState, useMemo } = window.htmPreact;

import { state, signIn, chooseExisting, friendly } from "../store.js";
import { STYLES } from "../data/pillars.js";
import { Banner, Spinner } from "./bits.js";

export function Onboarding() {
  const [mode, setMode] = useState("liste");
  const [search, setSearch] = useState("");
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [vibe, setVibe] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const people = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = state.scores.slice().sort((a, b) => {
      const an = `${a.first_name} ${a.last_name}`.toLowerCase();
      const bn = `${b.first_name} ${b.last_name}`.toLowerCase();
      return an.localeCompare(bn, "fr");
    });
    if (!q) return list;
    return list.filter((p) => `${p.first_name} ${p.last_name}`.toLowerCase().includes(q));
  }, [search, state.scores]);

  async function pick(p) {
    setBusy(true);
    setError(null);
    try {
      await chooseExisting({
        id: p.id,
        first_name: p.first_name,
        last_name: p.last_name,
        vibe: p.vibe
      });
    } catch (err) {
      setError(friendly(err));
    } finally {
      setBusy(false);
    }
  }

  async function create(e) {
    e.preventDefault();
    if (!first.trim() || !last.trim()) {
      setError("Indiquez votre prénom et votre nom");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await signIn(first, last, vibe);
    } catch (err) {
      setError(friendly(err));
    } finally {
      setBusy(false);
    }
  }

  return html`<div class="stack">
    <div class="card">
      <h1>Le Val d'Anniviers en 2056</h1>
      <p class="muted small">
        Nous sommes en 2056 et la vallée s'est dégradée. Les glaciers ont reculé, les alpages se
        sont vidés, une partie de la mémoire locale s'est effacée. Vous intervenez depuis 2026.
        Votre mission est de redécouvrir ce qui rend cette vallée riche, et de la faire remonter.
      </p>
      <p class="muted small">
        Chacun joue en son nom. Les groupes se forment et se déforment librement au fil de la
        journée. Commencez par vous identifier.
      </p>
    </div>

    ${error ? html`<${Banner} kind="bad">${error}<//>` : null}
    ${state.loadError
      ? html`<${Banner} kind="warn">
          La liste des participants n'a pas pu être chargée. ${state.loadError}. Vous pouvez quand
          même créer votre profil dès que le réseau revient.
        <//>`
      : null}

    <div class="filters">
      <button class=${"fbtn" + (mode === "liste" ? " on" : "")} onClick=${() => setMode("liste")}>
        Je suis dans la liste
      </button>
      <button class=${"fbtn" + (mode === "nouveau" ? " on" : "")} onClick=${() => setMode("nouveau")}>
        Ajouter mon profil
      </button>
    </div>

    ${mode === "liste"
      ? html`<div class="card">
          <label class="field">
            <span>Cherchez votre nom</span>
            <input type="search" value=${search} placeholder="Prénom ou nom"
                   onInput=${(e) => setSearch(e.target.value)} />
          </label>
          ${state.loading
            ? html`<p class="muted small row"><${Spinner} dark=${true} /> Chargement<//>`
            : people.length === 0
              ? html`<p class="muted small">
                  Personne ne correspond. Utilisez ${" "}
                  <button class="btn sm ghost" onClick=${() => setMode("nouveau")}>Ajouter mon profil</button>
                </p>`
              : html`<div class="people">
                  ${people.map(
                    (p) => html`<button key=${p.id} class="person" disabled=${busy} onClick=${() => pick(p)}>
                      <span class="bx"></span>
                      <span class="grow">${p.first_name} ${p.last_name}</span>
                    </button>`
                  )}
                </div>`}
          <p class="tiny faint" style="margin-top:.7rem">
            ${people.length} ${people.length === 1 ? "personne enregistrée" : "personnes enregistrées"}
          </p>
        </div>`
      : html`<form class="card" onSubmit=${create}>
          <label class="field">
            <span>Prénom</span>
            <input type="text" value=${first} autocomplete="given-name" required
                   onInput=${(e) => setFirst(e.target.value)} />
          </label>
          <label class="field">
            <span>Nom</span>
            <input type="text" value=${last} autocomplete="family-name" required
                   onInput=${(e) => setLast(e.target.value)} />
          </label>
          <label class="field">
            <span>Votre envie du moment, si vous en avez une</span>
          </label>
          <div class="filters" style="margin-top:-.4rem">
            <button type="button" class=${"fbtn" + (vibe === "" ? " on" : "")} onClick=${() => setVibe("")}>
              Sans avis
            </button>
            ${STYLES.map(
              (s) => html`<button type="button" key=${s.id}
                class=${"fbtn" + (vibe === s.id ? " on" : "")} onClick=${() => setVibe(s.id)}>
                ${s.icon} ${s.label}
              </button>`
            )}
          </div>
          <p class="tiny faint">
            Cette envie est purement informative et peut changer en cours de journée. Elle ne limite
            aucun défi.
          </p>
          <button class="btn block" type="submit" disabled=${busy}>
            ${busy ? html`<${Spinner} />` : null} C'est parti
          </button>
        </form>`}
  </div>`;
}

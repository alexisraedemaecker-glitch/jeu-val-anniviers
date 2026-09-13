// Album collectif du week end.
//
// Toutes les photos de defis valides, plus les photos libres que chacun ajoute
// quand il veut, classees dans la categorie Autre. Une photo ajoutee ici
// apparait aussi dans le fil.
const { html, useState, useEffect, useMemo } = window.htmPreact;

import { state, photoUrl, refreshPosts, addPost, friendly } from "../store.js";
import { PILLARS, PILLAR_BY_ID } from "../data/pillars.js";
import { Avatar, Banner, Empty, Spinner, dateTimeShort, pillarColor } from "./bits.js";

/** Ajout d'une photo libre, avec une description facultative. */
function AjoutPhoto({ onFini }) {
  const [file, setFile] = useState(null);
  const [apercu, setApercu] = useState(null);
  const [texte, setTexte] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => () => apercu && URL.revokeObjectURL(apercu), [apercu]);

  function choisir(f) {
    if (!f) return;
    setError(null);
    setFile(f);
    setApercu(URL.createObjectURL(f));
  }

  async function envoyer(e) {
    e.preventDefault();
    if (!file) {
      setError("Choisissez une photo");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await addPost({ texte, file, mentions: [] });
      setFile(null);
      setApercu(null);
      setTexte("");
      onFini();
    } catch (err) {
      setError(friendly(err));
    } finally {
      setBusy(false);
    }
  }

  return html`<form class="card" onSubmit=${envoyer}>
    <h3>Ajouter une photo du week end</h3>
    <p class="small muted">
      N'importe quelle photo, même sans rapport avec un défi. Elle rejoint l'album dans la
      catégorie Autre, et le fil du groupe.
    </p>
    ${error ? html`<${Banner} kind="bad">${error}<//>` : null}
    <label class=${"photo-zone" + (apercu ? " rempli" : "")}>
      ${apercu
        ? html`<img src=${apercu} alt="Photo à ajouter" class="apercu" />`
        : html`<span><span class="big">📷</span>Choisir une photo</span>`}
      <input type="file" accept="image/*" style="display:none"
             onChange=${(e) => choisir(e.target.files && e.target.files[0])} />
    </label>
    <label class="field" style="margin-top:.6rem">
      <span>Une description, si vous voulez</span>
      <input type="text" value=${texte} placeholder="Où, quand, avec qui"
             onInput=${(e) => setTexte(e.target.value)} />
    </label>
    <div class="row" style="gap:.5rem">
      <button class="btn grow" type="submit" disabled=${busy || !file}>
        ${busy ? html`<${Spinner} />` : null} Ajouter à l'album
      </button>
      <button class="btn quiet" type="button" onClick=${onFini}>Annuler</button>
    </div>
  </form>`;
}

export function Gallery() {
  const [open, setOpen] = useState(null);
  const [pillar, setPillar] = useState("");
  const [mineOnly, setMineOnly] = useState(false);
  const [ajout, setAjout] = useState(false);

  useEffect(() => {
    refreshPosts();
  }, []);

  const photos = useMemo(() => {
    return (state.posts || []).filter((f) => {
      if (!f.photo_path) return false;
      if (pillar === "autre" && f.genre !== "libre") return false;
      if (pillar && pillar !== "autre" && f.pillar !== pillar) return false;
      if (mineOnly && state.me) {
        const ids = (f.member_ids || []).concat(f.author_id);
        if (!ids.includes(state.me.id)) return false;
      }
      return true;
    });
  }, [state.posts, pillar, mineOnly, state.me && state.me.id]);

  const sansPhoto = (state.posts || []).filter((f) => f.genre === "defi" && !f.photo_path).length;
  const libres = (state.posts || []).filter((f) => f.genre === "libre" && f.photo_path).length;

  return html`<div>
    ${state.me && !ajout
      ? html`<button class="btn block" style="margin-bottom:.7rem" onClick=${() => setAjout(true)}>
          📷 Ajouter une photo du week end
        </button>`
      : null}
    ${ajout ? html`<${AjoutPhoto} onFini=${() => setAjout(false)} />` : null}

    <div class="filters">
      <button class=${"fbtn" + (pillar === "" ? " on" : "")} onClick=${() => setPillar("")}>Tout</button>
      ${PILLARS.map(
        (p) => html`<button key=${p.id} class=${"fbtn" + (pillar === p.id ? " on" : "")}
          onClick=${() => setPillar(p.id)}>${p.icon} ${p.short}</button>`
      )}
      <button class=${"fbtn" + (pillar === "autre" ? " on" : "")} onClick=${() => setPillar("autre")}>
        🌄 Autre${libres ? ` ${libres}` : ""}
      </button>
      ${state.me
        ? html`<button class=${"fbtn" + (mineOnly ? " on" : "")} onClick=${() => setMineOnly(!mineOnly)}>
            Où je suis
          </button>`
        : null}
    </div>

    <p class="tiny faint" style="margin-bottom:.6rem">
      ${photos.length} ${photos.length === 1 ? "photo" : "photos"} dans l'album.
      ${sansPhoto > 0 ? ` ${sansPhoto} ${sansPhoto === 1 ? "défi validé" : "défis validés"} sans photo, par quiz.` : ""}
    </p>

    ${!state.postsLoaded && !photos.length
      ? html`<div class="card"><p class="muted small row"><${Spinner} dark=${true} /> Chargement de l'album</p></div>`
      : photos.length === 0
        ? html`<${Empty} icon="📷">
            Aucune photo ici pour le moment. Les premières arriveront dès les premiers défis validés.
          <//>`
        : html`<div class="album">
            ${photos.map(
              (f) => html`<button key=${f.id} onClick=${() => setOpen(f)}
                  title=${f.challenge_name || f.texte || "Photo du week end"}>
                <img src=${photoUrl(f.photo_path)} alt=${f.challenge_name || "Photo du week end"} loading="lazy" />
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

  const p = f.pillar ? PILLAR_BY_ID[f.pillar] : null;
  const auteur = {
    first_name: (f.author_name || "").split(" ")[0],
    last_name: (f.author_name || "").split(" ").slice(1).join(" "),
    photo_path: f.author_photo
  };
  return html`<div class="lightbox" onClick=${(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <button class="close" onClick=${onClose}>Fermer</button>
    <div class="frame">
      <img src=${photoUrl(f.photo_path)} alt=${f.challenge_name || "Photo du week end"} />
    </div>
    <div class="info">
      <strong>${f.challenge_name || "Photo du week end"}</strong>
      <div style="margin:.25rem 0">
        ${p
          ? html`<span class="chip plain"><i class="pill-dot" style=${{ background: pillarColor(f.pillar) }}></i>${p.short}</span>`
          : html`<span class="chip plain">🌄 Autre</span>`}
        ${f.points ? html`<span class="chip plain">${f.points} pts</span>` : null}
        <span class="chip plain">${dateTimeShort(f.created_at)}</span>
      </div>
      <div class="row" style="gap:.5rem;opacity:.9">
        <${Avatar} p=${auteur} taille="sm" />
        <span>${(f.member_names || []).length ? (f.member_names || []).join(", ") : f.author_name}</span>
      </div>
      ${f.texte ? html`<p style="margin-top:.5rem;opacity:.88;font-style:italic">« ${f.texte} »</p>` : null}
    </div>
  </div>`;
}

// Le fil de la journee.
//
// Chaque defi valide y publie sa propre carte, avec sa photo. On peut y
// ajouter ses propres messages et ses propres photos, applaudir d'une corne de
// bouquetin, commenter, et nommer quelqu'un dans un message. Tout ce qui vous
// concerne remonte dans les notifications.
const { html, useState, useEffect, useMemo } = window.htmPreact;

import {
  state,
  photoUrl,
  refreshPosts,
  addPost,
  addComment,
  toggleKudo,
  deletePost,
  markNotificationsRead,
  unreadCount,
  friendly
} from "../store.js";
import { PILLAR_BY_ID } from "../data/pillars.js";
import { Avatar, Banner, Empty, Spinner, PhotoZoom, dateTimeShort, pillarColor } from "./bits.js";

/** Corne de bouquetin, l'applaudissement de la vallée. */
export function Corne({ pleine }) {
  return html`<svg class="ic-corne" viewBox="0 0 24 24" aria-hidden="true"
    fill=${pleine ? "currentColor" : "none"} stroke="currentColor" stroke-width="1.7"
    stroke-linecap="round" stroke-linejoin="round">
    <path d="M19.5 3.2c-3.6.6 -6.6 2.6 -8.6 5.6 -1.9 2.9 -2.7 6.3 -2.4 9.7
             .1 1.2 -.5 2 -1.7 2.3 -1 .2 -1.9 -.2 -2.3 -1" />
    <path d="M18.8 7c-2.3.7 -4.2 2.1 -5.5 4.1" />
    <path d="M17.9 10.9c-1.6.6 -2.9 1.6 -3.8 3" />
  </svg>`;
}

/** Marmotte qui crie, l'icône des commentaires. */
export function Marmotte() {
  return html`<svg class="ic-marmotte" viewBox="0 0 24 24" aria-hidden="true"
    fill="none" stroke="currentColor" stroke-width="1.7"
    stroke-linecap="round" stroke-linejoin="round">
    <path d="M7.5 6.2c-.6 -1.5 .1 -2.6 1.3 -2.6 1 0 1.7.7 1.9 1.7" />
    <path d="M16.5 6.2c.6 -1.5 -.1 -2.6 -1.3 -2.6 -1 0 -1.7.7 -1.9 1.7" />
    <path d="M12 4.8c-3.6 0 -6.2 2.6 -6.2 6 0 2 .8 3.4 2 4.6 1 1 1.4 1.9 1.4 3.2h5.6
             c0 -1.3 .4 -2.2 1.4 -3.2 1.2 -1.2 2 -2.6 2 -4.6 0 -3.4 -2.6 -6 -6.2 -6z" />
    <path d="M10 10.4h.01M14 10.4h.01" />
    <ellipse cx="12" cy="15.4" rx="1.7" ry="2.1" />
  </svg>`;
}

function heure(iso) {
  return dateTimeShort(iso);
}

/** Sélecteur de personnes à nommer dans un message. */
function ChoixMentions({ choisis, setChoisis }) {
  const [ouvert, setOuvert] = useState(false);
  const autres = state.scores.filter((p) => !state.me || p.id !== state.me.id);
  if (!autres.length) return null;
  const bascule = (id) =>
    setChoisis(choisis.includes(id) ? choisis.filter((x) => x !== id) : choisis.concat(id));

  return html`<div>
    <button type="button" class="btn sm quiet" onClick=${() => setOuvert(!ouvert)}>
      ${choisis.length ? `Avec ${choisis.length} personne${choisis.length > 1 ? "s" : ""}` : "Nommer quelqu'un"}
    </button>
    ${ouvert
      ? html`<div class="people" style="margin-top:.4rem">
          ${autres.map(
            (p) => html`<button type="button" key=${p.id}
              class=${"person" + (choisis.includes(p.id) ? " on" : "")}
              onClick=${() => bascule(p.id)}>
              <span class="bx">${choisis.includes(p.id) ? "✓" : ""}</span>
              <${Avatar} p=${p} taille="sm" />
              <span class="grow">${p.first_name} ${p.last_name}</span>
            </button>`
          )}
        </div>`
      : null}
  </div>`;
}

function nomDe(id) {
  const p = state.scores.find((s) => s.id === id);
  return p ? `${p.first_name} ${p.last_name}` : "quelqu'un";
}

function Mentions({ ids }) {
  if (!ids || !ids.length) return null;
  return html`<div class="tiny" style="margin-top:.2rem;color:var(--accent);font-weight:600">
    avec ${ids.map(nomDe).join(", ")}
  </div>`;
}

function Commentaires({ post }) {
  const [texte, setTexte] = useState("");
  const [mentions, setMentions] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const liste = post.commentaires || [];

  async function envoyer(e) {
    e.preventDefault();
    if (!texte.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await addComment(post.id, texte, mentions);
      setTexte("");
      setMentions([]);
    } catch (err) {
      setError(friendly(err));
    } finally {
      setBusy(false);
    }
  }

  return html`<div class="commentaires">
    ${liste.map(
      (c) => html`<div key=${c.id} class="commentaire">
        <${Avatar} p=${{ first_name: c.author_name.split(" ")[0], last_name: c.author_name.split(" ").slice(1).join(" "), photo_path: c.author_photo }} taille="sm" />
        <div class="grow">
          <div class="tiny faint">${c.author_name} · ${heure(c.created_at)}</div>
          <div class="small">${c.texte}</div>
          <${Mentions} ids=${c.mentions} />
        </div>
      </div>`
    )}
    ${state.me
      ? html`<form onSubmit=${envoyer} style="margin-top:.4rem">
          ${error ? html`<${Banner} kind="bad">${error}<//>` : null}
          <div class="row" style="gap:.4rem">
            <input class="grow" type="text" value=${texte} placeholder="Écrire un commentaire"
                   onInput=${(e) => setTexte(e.target.value)} />
            <button class="btn sm" type="submit" disabled=${busy || !texte.trim()}>
              ${busy ? html`<${Spinner} />` : "Envoyer"}
            </button>
          </div>
          <div style="margin-top:.35rem">
            <${ChoixMentions} choisis=${mentions} setChoisis=${setMentions} />
          </div>
        </form>`
      : null}
  </div>`;
}

function Publication({ post, ouvrirPhoto }) {
  const [ouvert, setOuvert] = useState(false);
  const [busy, setBusy] = useState(false);
  const pil = post.pillar ? PILLAR_BY_ID[post.pillar] : null;
  const aCorne = state.me && (post.kudos_ids || []).includes(state.me.id);
  const nbCornes = (post.kudos_ids || []).length;
  const auteur = {
    first_name: (post.author_name || "").split(" ")[0],
    last_name: (post.author_name || "").split(" ").slice(1).join(" "),
    photo_path: post.author_photo
  };

  async function corner() {
    setBusy(true);
    try {
      await toggleKudo(post.id);
    } catch (err) {
      console.warn(err);
    } finally {
      setBusy(false);
    }
  }

  async function retirer() {
    if (!confirm("Retirer cette publication ?")) return;
    try {
      await deletePost(post.id);
    } catch (err) {
      alert(friendly(err));
    }
  }

  return html`<article class="post">
    <header class="post-tete">
      <${Avatar} p=${auteur} />
      <div class="grow">
        <div class="post-nom">${post.author_name}</div>
        <div class="tiny faint">${heure(post.created_at)}</div>
      </div>
      ${pil
        ? html`<span class="chip plain">
            <i class="pill-dot" style=${{ background: pillarColor(post.pillar) }}></i>${pil.short}
          </span>`
        : null}
    </header>

    ${post.genre === "defi"
      ? html`<p class="post-defi">
          <strong>${post.challenge_name}</strong>
          <span class="tiny faint"> ${post.points} points</span>
          ${post.member_names && post.member_names.length > 1
            ? html`<span class="tiny faint" style="display:block">
                avec ${post.member_names.filter((n) => n !== post.author_name).join(", ")}
              </span>`
            : null}
        </p>`
      : null}

    ${post.texte ? html`<p class="post-texte">${post.texte}</p>` : null}
    <${Mentions} ids=${post.mentions} />

    ${post.photo_path
      ? html`<button class="post-photo" onClick=${() => ouvrirPhoto(post)}>
          <img src=${photoUrl(post.photo_path)} alt=${post.challenge_name || "Photo du week end"} loading="lazy" />
        </button>`
      : null}

    <footer class="post-actions">
      <button class=${"post-btn" + (aCorne ? " on" : "")} disabled=${busy || !state.me}
              onClick=${corner} aria-label="Donner une corne">
        <${Corne} pleine=${aCorne} />
        <span>${nbCornes || ""}</span>
      </button>
      <button class="post-btn" onClick=${() => setOuvert(!ouvert)} aria-label="Commenter">
        <${Marmotte} />
        <span>${post.nb_commentaires || ""}</span>
      </button>
      <span class="grow"></span>
      ${state.me && post.genre === "libre" && post.author_id === state.me.id
        ? html`<button class="post-btn faible" onClick=${retirer}>Retirer</button>`
        : null}
    </footer>

    ${ouvert || (post.commentaires || []).length ? html`<${Commentaires} post=${post} />` : null}
  </article>`;
}

function Composer() {
  const [texte, setTexte] = useState("");
  const [file, setFile] = useState(null);
  const [apercu, setApercu] = useState(null);
  const [mentions, setMentions] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => () => apercu && URL.revokeObjectURL(apercu), [apercu]);

  function choisir(f) {
    if (!f) return;
    setFile(f);
    setApercu(URL.createObjectURL(f));
  }

  async function publier(e) {
    e.preventDefault();
    if (!texte.trim() && !file) {
      setError("Écrivez un mot ou ajoutez une photo");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await addPost({ texte, file, mentions });
      setTexte("");
      setFile(null);
      setApercu(null);
      setMentions([]);
    } catch (err) {
      setError(friendly(err));
    } finally {
      setBusy(false);
    }
  }

  return html`<form class="card" onSubmit=${publier}>
    ${error ? html`<${Banner} kind="bad">${error}<//>` : null}
    <div class="row" style="gap:.6rem;align-items:flex-start">
      <${Avatar} p=${state.me} />
      <textarea class="grow" rows="2" value=${texte} placeholder="Raconter quelque chose au groupe"
                onInput=${(e) => setTexte(e.target.value)}></textarea>
    </div>
    ${apercu
      ? html`<div class="post-apercu">
          <img src=${apercu} alt="Photo à publier" />
          <button type="button" class="btn sm quiet" onClick=${() => { setFile(null); setApercu(null); }}>
            Retirer la photo
          </button>
        </div>`
      : null}
    <div class="row wrap" style="gap:.4rem;margin-top:.5rem">
      <label class="btn sm quiet">
        📷 ${apercu ? "Changer la photo" : "Ajouter une photo"}
        <input type="file" accept="image/*" style="display:none"
               onChange=${(e) => choisir(e.target.files && e.target.files[0])} />
      </label>
      <${ChoixMentions} choisis=${mentions} setChoisis=${setMentions} />
      <span class="grow"></span>
      <button class="btn sm" type="submit" disabled=${busy}>
        ${busy ? html`<${Spinner} />` : null} Publier
      </button>
    </div>
    <p class="tiny faint" style="margin:.5rem 0 0">
      Une photo publiée ici rejoint aussi l'album, dans la catégorie Autre.
    </p>
  </form>`;
}

function Notifications() {
  const liste = state.notifications || [];
  const nb = unreadCount();
  if (!liste.length) return null;

  const phrase = (n) => {
    if (n.kind === "kudo") return `${n.actor_name} vous a donné une corne`;
    if (n.kind === "mention") return `${n.actor_name} vous a nommé`;
    if (n.kind === "commentaire") return `${n.actor_name} a commenté votre publication`;
    return `${n.actor_name} a répondu après vous`;
  };

  return html`<div class="card">
    <div class="card-head">
      <h2>Pour vous</h2>
      ${nb ? html`<span class="chip warn">${nb} nouveau${nb > 1 ? "x" : ""}</span>` : null}
    </div>
    <div class="notifs">
      ${liste.slice(0, 12).map(
        (n) => html`<div key=${n.id} class=${"notif" + (n.read_at ? "" : " neuf")}>
          <${Avatar} p=${{ first_name: (n.actor_name || "").split(" ")[0], last_name: "", photo_path: n.actor_photo }} taille="sm" />
          <span class="grow small">${phrase(n)}</span>
          <span class="tiny faint nowrap">${heure(n.created_at)}</span>
        </div>`
      )}
    </div>
  </div>`;
}

export function Fil() {
  const [photo, setPhoto] = useState(null);
  const [filtre, setFiltre] = useState("tout");

  useEffect(() => {
    refreshPosts();
    // Ouvrir le fil vaut lecture des notifications.
    const t = setTimeout(markNotificationsRead, 1200);
    return () => clearTimeout(t);
  }, []);

  const posts = useMemo(() => {
    const tous = state.posts || [];
    if (filtre === "defis") return tous.filter((p) => p.genre === "defi");
    if (filtre === "messages") return tous.filter((p) => p.genre === "libre");
    if (filtre === "moi" && state.me) {
      return tous.filter(
        (p) =>
          p.author_id === state.me.id ||
          (p.member_ids || []).includes(state.me.id) ||
          (p.mentions || []).includes(state.me.id)
      );
    }
    return tous;
  }, [state.posts, filtre, state.me && state.me.id]);

  const photos = useMemo(
    () =>
      posts
        .filter((p) => p.photo_path)
        .map((p) => ({
          src: photoUrl(p.photo_path),
          legende: p.challenge_name || p.texte || "Photo du week end"
        })),
    [posts]
  );

  const indexPhoto = (post) => photos.findIndex((x) => x.src === photoUrl(post.photo_path));

  return html`<div class="stack">
    <${Notifications} />
    ${state.me ? html`<${Composer} />` : null}

    <div class="filters">
      <button class=${"fbtn" + (filtre === "tout" ? " on" : "")} onClick=${() => setFiltre("tout")}>Tout</button>
      <button class=${"fbtn" + (filtre === "defis" ? " on" : "")} onClick=${() => setFiltre("defis")}>Défis validés</button>
      <button class=${"fbtn" + (filtre === "messages" ? " on" : "")} onClick=${() => setFiltre("messages")}>Messages</button>
      ${state.me
        ? html`<button class=${"fbtn" + (filtre === "moi" ? " on" : "")} onClick=${() => setFiltre("moi")}>Où je suis</button>`
        : null}
    </div>

    ${!state.postsLoaded && !posts.length
      ? html`<div class="card"><p class="muted small row"><${Spinner} dark=${true} /> Chargement du fil</p></div>`
      : posts.length === 0
        ? html`<${Empty} icon="📣">
            Rien pour le moment. Le premier défi validé ouvrira le fil.
          <//>`
        : posts.map((p) => html`<${Publication} key=${p.id} post=${p} ouvrirPhoto=${(x) => setPhoto(indexPhoto(x))} />`)}

    ${photo !== null && photos[photo]
      ? html`<${PhotoZoom} photos=${photos} i=${photo} setI=${setPhoto} />`
      : null}
  </div>`;
}

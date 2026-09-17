// Le fil de la journee.
//
// Chaque defi valide y publie sa propre carte, avec sa photo. On peut y
// ajouter ses propres messages et ses propres photos, applaudir d'une corne de
// bouquetin, commenter, et nommer quelqu'un dans un message. Tout ce qui vous
// concerne remonte dans les notifications.
const { html, useState, useEffect, useMemo, useRef } = window.htmPreact;

import {
  state,
  photoUrl,
  refreshPosts,
  addPost,
  addComment,
  toggleKudo,
  deletePost,
  markNotificationsRead,
  toggleCommentReaction,
  unreadCount,
  activerPush,
  rafraichirEtatPush,
  pushDisponible,
  friendly
} from "../store.js";
import { PILLAR_BY_ID } from "../data/pillars.js";
import {
  Avatar,
  Banner,
  ChoixPersonnes,
  Empty,
  Frag,
  Spinner,
  PhotoZoom,
  dateTimeShort,
  pillarColor
} from "./bits.js";

/** Corne de bouquetin, l'applaudissement de la vallée. */
export function Corne({ pleine }) {
  return html`<img class=${"ic-fil" + (pleine ? " on" : "")} src="assets/icones/corne-96.png"
    srcset="assets/icones/corne-48.png 48w, assets/icones/corne-96.png 96w" sizes="26px"
    alt="" aria-hidden="true" />`;
}

/** Marmotte qui crie, l'icône des commentaires. */
export function Marmotte() {
  return html`<img class="ic-fil" src="assets/icones/marmotte-96.png"
    srcset="assets/icones/marmotte-48.png 48w, assets/icones/marmotte-96.png 96w" sizes="26px"
    alt="" aria-hidden="true" />`;
}

function heure(iso) {
  return dateTimeShort(iso);
}

// ------------------------------------------------------------- mentions

// On nomme quelqu'un en tapant une arobase suivie de son prénom. Le texte
// garde l'arobase, ce qui se lit naturellement, et la liste des personnes
// nommées en est déduite au moment de l'envoi.
//
// Le motif ne prend qu'un mot, plus éventuellement le suivant : ce deuxième
// mot n'est retenu que s'il forme un vrai prénom plus nom. Sans cela, dans
// "@Alexis et Ambeurre", le "et" serait avalé dans la mention.
const MOTIF_MENTION = "@([\\p{L}][\\p{L}\\-']*)(\\s+([\\p{L}][\\p{L}\\-']*))?";

/** Les mentions d'un texte, avec leur position exacte. */
function analyser(texte, gens) {
  const trouvees = [];
  if (!texte) return trouvees;
  const liste = gens || state.scores || [];
  const re = new RegExp(MOTIF_MENTION, "gu");
  let m;
  while ((m = re.exec(texte))) {
    const prenom = m[1].trim().toLowerCase();
    const suivant = (m[3] || "").trim().toLowerCase();
    // Fin de la mention si l'on ne retient que le premier mot.
    let fin = m.index + 1 + m[1].length;

    // @tous, ou @tout le monde, nomme la vallée entière. Un simple @tout, lui,
    // ne nomme personne : « @tout de suite » ne doit prévenir personne.
    if (prenom === "tous" || prenom === "tout") {
      let entier = prenom === "tous";
      if (prenom === "tout" && suivant === "le") {
        const reste = texte.slice(m.index + m[0].length).match(/^\s+monde/iu);
        if (reste) {
          fin = m.index + m[0].length + reste[0].length;
          entier = true;
        }
      }
      if (entier) {
        const ids = liste.map((g) => g.id).filter((id) => !state.me || id !== state.me.id);
        if (ids.length) trouvees.push({ debut: m.index, fin, ids, tous: true });
      }
      re.lastIndex = fin;
      continue;
    }

    let p = null;
    if (suivant) {
      p = liste.find(
        (g) =>
          g.first_name.trim().toLowerCase() === prenom &&
          g.last_name.trim().toLowerCase() === suivant
      );
      if (p) fin = m.index + m[0].length;
    }
    if (!p) {
      const memes = liste.filter((g) => g.first_name.trim().toLowerCase() === prenom);
      if (memes.length === 1) p = memes[0];
    }
    if (p) trouvees.push({ debut: m.index, fin, ids: [p.id] });
    // On repart juste après le prénom lu, jamais en arrière : la boucle
    // avance donc toujours, même quand rien ne correspond.
    re.lastIndex = fin;
  }
  return trouvees;
}

/** Les identifiants des personnes nommées dans un texte. */
export function extraireMentions(texte, gens) {
  const ids = [];
  analyser(texte, gens).forEach((x) => {
    (x.ids || []).forEach((id) => {
      if (!ids.includes(id)) ids.push(id);
    });
  });
  return ids;
}

/** Deux personnes peuvent partager un prénom : on précise alors le nom. */
function etiquette(p, gens) {
  const memes = (gens || []).filter(
    (g) => g.first_name.trim().toLowerCase() === p.first_name.trim().toLowerCase()
  );
  return memes.length > 1 ? `${p.first_name} ${p.last_name}` : p.first_name;
}

/**
 * Champ de saisie qui propose les prénoms dès qu'on tape une arobase.
 * Sert aussi bien au message qu'au commentaire, sur une ou plusieurs lignes.
 */
function SaisieMention({ valeur, setValeur, placeholder, multiligne, onEntree }) {
  const [suggestions, setSuggestions] = useState([]);
  const champ = useRef(null);

  const gens = state.scores || [];

  function analyser(el) {
    const pos = el.selectionStart == null ? el.value.length : el.selectionStart;
    const avant = el.value.slice(0, pos);
    const m = /@([\p{L}\-']*)$/u.exec(avant);
    if (!m) {
      setSuggestions([]);
      return;
    }
    const debut = m[1].toLowerCase();
    const trouves = gens
      .filter((g) => !state.me || g.id !== state.me.id)
      .filter((g) => !debut || g.first_name.toLowerCase().startsWith(debut)
        || `${g.first_name} ${g.last_name}`.toLowerCase().startsWith(debut))
      .slice(0, 5);
    const propositions = trouves.map((g) => ({ p: g, debut: m[1].length }));
    // Toujours en tête : nommer tout le monde d'un seul coup.
    if (!debut || "tous".startsWith(debut)) {
      propositions.unshift({ tous: true, debut: m[1].length });
    }
    setSuggestions(propositions);
  }

  function choisir(s) {
    const el = champ.current;
    const pos = el.selectionStart == null ? el.value.length : el.selectionStart;
    const avant = el.value.slice(0, pos - s.debut);
    const apres = el.value.slice(pos);
    const mot = s.tous ? "tous" : etiquette(s.p, gens);
    const texte = `${avant}${mot} ${apres}`.replace(/\s+$/, " ");
    setValeur(texte);
    setSuggestions([]);
    // On rend la main au clavier, curseur juste apres le mot inséré.
    setTimeout(() => {
      if (!champ.current) return;
      champ.current.focus();
      const p = avant.length + mot.length + 1;
      champ.current.setSelectionRange(p, p);
    }, 0);
  }

  const commun = {
    ref: champ,
    value: valeur,
    placeholder: placeholder,
    onInput: (e) => {
      setValeur(e.target.value);
      analyser(e.target);
    },
    onKeyUp: (e) => analyser(e.target),
    onBlur: () => setTimeout(() => setSuggestions([]), 180)
  };

  return html`<div class="saisie">
    ${multiligne
      ? html`<textarea class="grow" rows="2" ...${commun}></textarea>`
      : html`<input class="grow" type="text" ...${commun}
          onKeyDown=${(e) => { if (e.key === "Enter" && onEntree) onEntree(e); }} />`}
    ${suggestions.length
      ? html`<div class="suggestions">
          ${suggestions.map(
            (s) => html`<button type="button" key=${s.tous ? "tous" : s.p.id} class="suggestion"
              onMouseDown=${(e) => e.preventDefault()} onClick=${() => choisir(s)}>
              ${s.tous
                ? html`<${Frag}>
                    <span class="avatar vide" aria-hidden="true">📣</span>
                    <span class="grow"><strong>Tout le monde</strong>
                      <span class="tiny faint" style="display:block">
                        Prévient les ${(state.scores || []).length} joueurs
                      </span>
                    </span>
                  <//>`
                : html`<${Frag}>
                    <${Avatar} p=${s.p} taille="sm" />
                    <span class="grow">${s.p.first_name} ${s.p.last_name}</span>
                  <//>`}
            </button>`
          )}
        </div>`
      : null}
  </div>`;
}

/** Le nom d'une personne, à partir de son identifiant. */
function nomDe(id) {
  const p = (state.scores || []).find((s) => s.id === id);
  return p ? `${p.first_name} ${p.last_name}` : "quelqu'un";
}

/** Affiche un texte en mettant en valeur les personnes nommées. */
function Texte({ texte, classe }) {
  if (!texte) return null;
  const bouts = [];
  let i = 0;
  analyser(texte, state.scores).forEach((x) => {
    if (x.debut > i) bouts.push(texte.slice(i, x.debut));
    bouts.push(html`<span class=${"mention" + (x.tous ? " tous" : "")}>
      ${texte.slice(x.debut, x.fin)}
    </span>`);
    i = x.fin;
  });
  if (i < texte.length) bouts.push(texte.slice(i));
  return html`<p class=${classe}>${bouts.length ? bouts : texte}</p>`;
}

// La corne, puis quelques emojis. Volontairement peu : un rang qui tient sur
// une ligne de telephone, sans faire reflechir.
const REACTIONS = ["corne", "👏", "😂", "❤️", "😮"];

/** Les réactions posées sur un cri de marmotte, et de quoi en poser une. */
function Reactions({ commentaire }) {
  const [ouvert, setOuvert] = useState(false);
  const liste = commentaire.reactions || [];

  const groupes = REACTIONS.map((emoji) => {
    const qui = liste.filter((r) => r.emoji === emoji).map((r) => r.participant_id);
    return { emoji, qui, mien: state.me && qui.includes(state.me.id) };
  }).filter((g) => g.qui.length);

  async function poser(emoji) {
    setOuvert(false);
    try {
      await toggleCommentReaction(commentaire.id, emoji);
    } catch (err) {
      console.warn(err);
    }
  }

  const rendu = (emoji) =>
    emoji === "corne" ? html`<${Corne} pleine=${true} />` : html`<span>${emoji}</span>`;

  return html`<div class="reactions">
    ${groupes.map(
      (g) => html`<button key=${g.emoji} class=${"reaction" + (g.mien ? " on" : "")}
        title=${g.qui.map(nomDe).join(", ")}
        onClick=${() => poser(g.emoji)}>
        ${rendu(g.emoji)}<span class="nb">${g.qui.length}</span>
      </button>`
    )}
    ${state.me
      ? html`<button class="reaction ajout" aria-label="Réagir"
               onClick=${() => setOuvert(!ouvert)}>${ouvert ? "×" : "+"}</button>`
      : null}
    ${ouvert
      ? html`<div class="choix-reaction">
          ${REACTIONS.map(
            (emoji) => html`<button key=${emoji} class="reaction" onClick=${() => poser(emoji)}>
              ${rendu(emoji)}
            </button>`
          )}
        </div>`
      : null}
    ${groupes.length
      ? html`<span class="tiny faint qui-reagit">${groupes
          .flatMap((g) => g.qui)
          .filter((v, i, t) => t.indexOf(v) === i)
          .map(nomDe)
          .join(", ")}</span>`
      : null}
  </div>`;
}

function Commentaires({ post }) {
  const [texte, setTexte] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const liste = post.commentaires || [];

  async function envoyer(e) {
    e.preventDefault();
    if (!texte.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await addComment(post.id, texte, extraireMentions(texte, state.scores));
      setTexte("");
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
          <${Texte} texte=${c.texte} classe="small com-texte" />
          <${Reactions} commentaire=${c} />
        </div>
      </div>`
    )}
    ${state.me
      ? html`<form onSubmit=${envoyer} style="margin-top:.4rem">
          ${error ? html`<${Banner} kind="bad">${error}<//>` : null}
          <div class="row" style="gap:.4rem;align-items:flex-start">
            <${SaisieMention} valeur=${texte} setValeur=${setTexte}
              placeholder="Commenter, @ pour nommer quelqu'un" />
            <button class="btn sm" type="submit" disabled=${busy || !texte.trim()}>
              ${busy ? html`<${Spinner} />` : "Envoyer"}
            </button>
          </div>
        </form>`
      : null}
  </div>`;
}

function Publication({ post, ouvrirPhoto, go, vise, commentairesOuverts }) {
  const [ouvert, setOuvert] = useState(!!commentairesOuverts);
  const [qui, setQui] = useState(false);
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

  const donneurs = (post.kudos_ids || []).map(nomDe);

  return html`<article class=${"post" + (vise ? " vise" : "")} id=${"post-" + post.id}>
    <header class="post-tete">
      <${Avatar} p=${auteur} onClick=${() => go && go("#/profil/" + post.author_id)} />
      <div class="grow">
        <button class="post-nom lien" onClick=${() => go && go("#/profil/" + post.author_id)}>
          ${post.author_name}
        </button>
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

    <${Texte} texte=${post.texte} classe="post-texte" />

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
      ${nbCornes
        ? html`<button class="post-btn faible" onClick=${() => setQui(!qui)}
                 aria-label="Voir qui a donné une corne">
            ${qui ? "masquer" : "qui ?"}
          </button>`
        : null}
      <button class="post-btn" onClick=${() => setOuvert(!ouvert)} aria-label="Commenter">
        <${Marmotte} />
        <span>${post.nb_commentaires || ""}</span>
      </button>
      <span class="grow"></span>
      ${state.me && post.genre === "libre" && post.author_id === state.me.id
        ? html`<button class="post-btn faible" onClick=${retirer}>Retirer</button>`
        : null}
    </footer>

    ${qui && nbCornes
      ? html`<div class="donneurs">
          <${Corne} pleine=${true} />
          <span class="small">${donneurs.join(", ")}</span>
        </div>`
      : null}

    ${ouvert || (post.commentaires || []).length ? html`<${Commentaires} post=${post} />` : null}
  </article>`;
}

function Composer() {
  const [texte, setTexte] = useState("");
  const [file, setFile] = useState(null);
  const [apercu, setApercu] = useState(null);
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
      await addPost({ texte, file, mentions: extraireMentions(texte, state.scores) });
      setTexte("");
      setFile(null);
      setApercu(null);
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
      <${SaisieMention} valeur=${texte} setValeur=${setTexte} multiligne=${true}
        placeholder="Raconter quelque chose. Tapez @ pour nommer quelqu'un" />
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

/**
 * Ce qui vous concerne, replie derriere une cloche. Deroule, le fil reste a
 * portee : avec cinquante notifications, une liste ouverte obligerait a
 * defiler longtemps avant d'atteindre la premiere publication.
 */
function Notifications({ aller }) {
  const [ouvert, setOuvert] = useState(false);
  const liste = state.notifications || [];
  const nb = unreadCount();
  if (!liste.length) return null;

  const phrase = (n) => {
    if (n.kind === "kudo") return `${n.actor_name} vous a donné une corne`;
    if (n.kind === "mention") return `${n.actor_name} vous a nommé`;
    if (n.kind === "commentaire") return `${n.actor_name} a commenté votre publication`;
    if (n.kind === "defi") return `${n.actor_name} a validé un défi avec vous`;
    if (n.kind === "reaction") return `${n.actor_name} a réagi à votre commentaire`;
    return `${n.actor_name} a répondu après vous`;
  };

  return html`<div class="card notifs-carte">
    <button class="notifs-tete" onClick=${() => setOuvert(!ouvert)}
            aria-expanded=${ouvert ? "true" : "false"}>
      <h2>Pour vous</h2>
      <span class=${"cloche" + (nb ? " neuve" : "")} aria-hidden="true">
        🔔${nb ? html`<span class="pastille">${nb}</span>` : null}
      </span>
      <span class="grow"></span>
      <span class="tiny faint">
        ${nb ? `${nb} nouveau${nb > 1 ? "x" : ""}` : `${liste.length} en tout`}
      </span>
      <span class="faint" style="font-size:1.2rem">${ouvert ? "▴" : "▾"}</span>
    </button>
    ${ouvert
      ? html`<div class="notifs">
          ${liste.slice(0, 30).map(
            (n) => html`<button key=${n.id} class=${"notif" + (n.read_at ? "" : " neuf")}
              onClick=${() => { setOuvert(false); aller(n); }}>
              <${Avatar} p=${{ first_name: (n.actor_name || "").split(" ")[0], last_name: "", photo_path: n.actor_photo }} taille="sm" />
              <span class="grow small">${phrase(n)}</span>
              <span class="tiny faint nowrap">${heure(n.created_at)}</span>
              <span class="faint" style="font-size:1rem">›</span>
            </button>`
          )}
        </div>`
      : null}
  </div>`;
}

/**
 * Petite invitation a activer les notifications, une seule fois. Elle disparait
 * des qu'on l'accepte ou qu'on la repousse, et ne revient pas.
 */
function InviteNotifications() {
  const CLE = "anniviers2056.pushPropose";
  const [cache, setCache] = useState(() => {
    try {
      return localStorage.getItem(CLE) === "1";
    } catch (err) {
      return false;
    }
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    rafraichirEtatPush();
  }, []);

  if (cache || !state.me || !pushDisponible() || state.pushEtat !== "possible") return null;

  const ranger = () => {
    try {
      localStorage.setItem(CLE, "1");
    } catch (err) {
      /* stockage indisponible, tant pis */
    }
    setCache(true);
  };

  async function activer() {
    setBusy(true);
    try {
      await activerPush();
      ranger();
    } catch (err) {
      console.warn(err);
    } finally {
      setBusy(false);
    }
  }

  return html`<div class="card" style="border-color:#e3c98f;background:var(--warn-soft)">
    <h3 style="margin-top:0">Être prévenu sans ouvrir l'application</h3>
    <p class="small" style="margin-bottom:.6rem">
      Quand quelqu'un vous nomme, valide un défi avec vous ou commente votre publication, le
      téléphone vous le dit, même verrouillé.
    </p>
    <div class="row" style="gap:.5rem">
      <button class="btn sm grow" disabled=${busy} onClick=${activer}>
        ${busy ? html`<${Spinner} />` : null} Activer
      </button>
      <button class="btn sm quiet" onClick=${ranger}>Plus tard</button>
    </div>
  </div>`;
}

export function Fil({ go }) {
  const [photo, setPhoto] = useState(null);
  const [filtre, setFiltre] = useState("tout");
  const [joueurs, setJoueurs] = useState([]);
  const [choixJoueur, setChoixJoueur] = useState(false);
  // Publication visée par une notification : on y descend et on la souligne.
  const [vise, setVise] = useState(null);
  const [viseCommentaires, setViseCommentaires] = useState(false);

  useEffect(() => {
    refreshPosts();
    // Ouvrir le fil vaut lecture des notifications.
    const t = setTimeout(markNotificationsRead, 1200);
    return () => clearTimeout(t);
  }, []);

  // Une notification mène à sa publication, quel que soit le filtre en cours.
  function aller(n) {
    if (!n.post_id) return;
    setFiltre("tout");
    setJoueurs([]);
    setVise(n.post_id);
    setViseCommentaires(!!n.comment_id || n.kind === "commentaire" || n.kind === "reponse");
    // La liste vient de changer de taille, et la publication peut n'être
    // rendue qu'au tour suivant : on retente quelques fois plutôt que de viser
    // un instant précis.
    let essais = 0;
    const viser = () => {
      const el = document.getElementById("post-" + n.post_id);
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 70;
        window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
        return;
      }
      essais += 1;
      if (essais < 12) setTimeout(viser, 120);
    };
    setTimeout(viser, 80);
    // Le soulignement ne dure que le temps de retrouver la publication.
    setTimeout(() => setVise((v) => (v === n.post_id ? null : v)), 4000);
  }

  const posts = useMemo(() => {
    let tous = state.posts || [];
    if (joueurs.length) {
      tous = tous.filter(
        (p) =>
          joueurs.includes(p.author_id) ||
          (p.member_ids || []).some((id) => joueurs.includes(id)) ||
          (p.mentions || []).some((id) => joueurs.includes(id)) ||
          (p.commentaires || []).some((c) => joueurs.includes(c.author_id))
      );
    }
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
  }, [state.posts, filtre, joueurs, state.me && state.me.id]);

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
    <${InviteNotifications} />
    <${Notifications} aller=${aller} />
    ${state.me ? html`<${Composer} />` : null}

    <div class="filters">
      <button class=${"fbtn" + (filtre === "tout" ? " on" : "")} onClick=${() => setFiltre("tout")}>Tout</button>
      <button class=${"fbtn" + (filtre === "defis" ? " on" : "")} onClick=${() => setFiltre("defis")}>Défis validés</button>
      <button class=${"fbtn" + (filtre === "messages" ? " on" : "")} onClick=${() => setFiltre("messages")}>Messages</button>
      ${state.me
        ? html`<button class=${"fbtn" + (filtre === "moi" ? " on" : "")} onClick=${() => setFiltre("moi")}>Où je suis</button>`
        : null}
      <button class=${"fbtn" + (joueurs.length ? " on" : "")}
              onClick=${() => setChoixJoueur(!choixJoueur)}>
        ${joueurs.length ? `${joueurs.length} joueur${joueurs.length > 1 ? "s" : ""}` : "Par joueur"}
      </button>
    </div>

    ${choixJoueur
      ? html`<div class="card">
          <h3 style="margin-top:0">Filtrer par joueur</h3>
          <${ChoixPersonnes} choisis=${joueurs} setChoisis=${setJoueurs}
            gens=${state.scores || []} placeholder="Tapez @ puis un prénom"
            note="On garde les publications où la personne apparaît, comme autrice, dans le groupe, nommée ou en commentaire." />
          <div class="row" style="gap:.5rem;margin-top:.6rem">
            <button class="btn sm grow" onClick=${() => setChoixJoueur(false)}>Voir le résultat</button>
            ${joueurs.length
              ? html`<button class="btn sm quiet" onClick=${() => setJoueurs([])}>Tout effacer</button>`
              : null}
          </div>
        </div>`
      : null}

    ${!state.postsLoaded && !posts.length
      ? html`<div class="card"><p class="muted small row"><${Spinner} dark=${true} /> Chargement du fil</p></div>`
      : posts.length === 0
        ? html`<${Empty} icon="📣">
            Rien pour le moment. Le premier défi validé ouvrira le fil.
          <//>`
        : posts.map((p) => html`<${Publication} key=${p.id} post=${p} go=${go}
            vise=${vise === p.id} commentairesOuverts=${vise === p.id && viseCommentaires}
            ouvrirPhoto=${(x) => setPhoto(indexPhoto(x))} />`)}

    ${photo !== null && photos[photo]
      ? html`<${PhotoZoom} photos=${photos} i=${photo} setI=${setPhoto} />`
      : null}
  </div>`;
}

// Premier lancement : on choisit son profil dans la liste, ou on en cree un.
// Pas de mot de passe, pas d'email. L'application s'en souvient ensuite.
//
// En arriere plan, les six etats de la vallee defilent en fondu. Le temps de
// s'inscrire, on a vu la vallee abandonnee de 2056 puis sa version restauree,
// ce qui dit le but du jeu sans une ligne d'explication. Chaque image peut
// s'ouvrir en grand, et le defilement s'arrete alors sur celle qu'on regarde.
const { html, useState, useMemo, useEffect, useRef } = window.htmPreact;

import { state, signIn, uploadPortrait, friendly, messageRetireVu } from "../store.js";
import { STYLES } from "../data/pillars.js";
import { PALIERS_VALLEE } from "../data/vallee.js";
import { HISTOIRE } from "../data/histoire.js";
import { Banner, Spinner, Avatar, PhotoZoom, Frag } from "./bits.js";

// Duree d'affichage d'une image, puis duree du fondu. Six images, donc un tour
// complet en une trentaine de secondes : le temps d'une inscription.
const DUREE_VUE = 4200;
const DUREE_FONDU = 1100;

function Diaporama({ i, setI, pause, ouvrir }) {
  const [bas, setBas] = useState(i);
  const [haut, setHaut] = useState(null);
  const [visible, setVisible] = useState(false);
  const minuteries = useRef([]);

  // Fondu vers l'image demandee : on la precharge, on la pose par dessus,
  // puis on la fait apparaitre. L'ancienne ne disparait qu'a la fin.
  useEffect(() => {
    if (i === bas) return undefined;
    let annule = false;
    const nettoyer = () => minuteries.current.forEach(clearTimeout);
    nettoyer();

    const poser = () => {
      if (annule) return;
      setHaut(i);
      setVisible(false);
      minuteries.current = [
        setTimeout(() => !annule && setVisible(true), 60),
        setTimeout(() => {
          if (annule) return;
          setBas(i);
          setHaut(null);
          setVisible(false);
        }, DUREE_FONDU + 150)
      ];
    };

    const img = new Image();
    img.onload = poser;
    img.onerror = () => !annule && setBas(i);
    img.src = PALIERS_VALLEE[i].src_small;
    if (img.complete) poser();

    return () => {
      annule = true;
      nettoyer();
    };
  }, [i]);

  // Avance automatique, suspendue pendant qu'une photo est ouverte en grand.
  useEffect(() => {
    if (pause || i !== bas) return undefined;
    const t = setTimeout(() => setI((i + 1) % PALIERS_VALLEE.length), DUREE_VUE);
    return () => clearTimeout(t);
  }, [i, bas, pause]);

  const jeu = (p) => `${p.src_small} 760w, ${p.src} 1376w`;

  // La legende decrit l'image du dessous, celle que l'on voit vraiment : pendant
  // le fondu, la nouvelle n'est encore qu'a moitie la.
  return html`<${Frag}>
  <div class="diapo">
    <button type="button" class="diapo-zone" onClick=${() => ouvrir(bas)}
            aria-label="Voir l'état de la vallée en grand">
      <img src=${PALIERS_VALLEE[bas].src_small} srcset=${jeu(PALIERS_VALLEE[bas])} sizes="100vw"
           alt=${"Le Val d'Anniviers en 2056 : " + PALIERS_VALLEE[bas].legende} />
      ${haut !== null
        ? html`<img class=${"entrante" + (visible ? " visible" : "")}
                 src=${PALIERS_VALLEE[haut].src_small} srcset=${jeu(PALIERS_VALLEE[haut])}
                 sizes="100vw"
                 alt=${"Le Val d'Anniviers en 2056 : " + PALIERS_VALLEE[haut].legende} />`
        : null}
    </button>
    <div class="diapo-voile" aria-hidden="true"></div>
  </div>

  <button type="button" class="diapo-espace" onClick=${() => ouvrir(bas)}
          aria-label=${"Voir en grand : " + PALIERS_VALLEE[bas].legende}>
    <span class="diapo-nette" aria-hidden="true">
      <img src=${PALIERS_VALLEE[bas].src_small} srcset=${jeu(PALIERS_VALLEE[bas])} sizes="100vw"
           alt="" />
      ${haut !== null
        ? html`<img class=${"entrante" + (visible ? " visible" : "")}
                 src=${PALIERS_VALLEE[haut].src_small} srcset=${jeu(PALIERS_VALLEE[haut])}
                 sizes="100vw" alt="" />`
        : null}
    </span>
    <span class="loupe" aria-hidden="true">⤢</span>
    <span class="txt">
      <span class="ligne">
        <span class="grow">${PALIERS_VALLEE[bas].legende}</span>
        <span class="aide">Appuyez pour voir en grand</span>
      </span>
      <span class="defiler">Faites défiler pour vous inscrire ↓</span>
    </span>
  </button>

  <div class="diapo-commande">
    <div class="points" role="tablist" aria-label="Les six états de la vallée">
      ${PALIERS_VALLEE.map(
        (pal, k) => html`<button type="button" key=${pal.seuil}
          class=${"point" + (k === bas ? " on" : "")}
          aria-label=${pal.legende} aria-selected=${k === bas}
          onClick=${() => setI(k)}></button>`
      )}
    </div>
    <button type="button" class="btn sm ghost sur-photo" onClick=${() => ouvrir(bas)}>
      ⤢ Voir la vallée en grand
    </button>
    <span class="legende-large">${PALIERS_VALLEE[bas].legende}</span>
  </div>
  <//>`;
}

/** Champ photo de profil : une pastille ronde qui ouvre l'appareil ou la galerie. */
function ChampPortrait({ apercu, onFichier, obligatoire }) {
  return html`<div class="portrait-champ">
    <label class=${"portrait-cible" + (apercu ? " rempli" : "")}>
      ${apercu
        ? html`<img src=${apercu} alt="Votre photo de profil" />`
        : html`<span class="portrait-vide"><span class="ic">🙂</span><span class="tiny">Ma photo</span></span>`}
      <input type="file" accept="image/*" onChange=${(e) => onFichier(e.target.files && e.target.files[0])} />
    </label>
    <div class="grow">
      <div class="small" style="font-weight:650">
        ${apercu ? "Photo prête" : "Ajoutez votre photo de profil"}
      </div>
      <p class="tiny faint" style="margin:.15rem 0 0">
        ${obligatoire
          ? "Elle est nécessaire pour s'inscrire. Elle sert à vous reconnaître dans les groupes et dans le classement. Elle reste dans le jeu et rien n'est publié ailleurs."
          : "Elle sert à vous reconnaître dans les groupes et dans le classement."}
      </p>
      ${apercu
        ? html`<label class="btn sm quiet" style="margin-top:.4rem;display:inline-flex">
            Changer de photo
            <input type="file" accept="image/*" style="display:none"
                   onChange=${(e) => onFichier(e.target.files && e.target.files[0])} />
          </label>`
        : null}
    </div>
  </div>`;
}

/**
 * Code personnel. Il empeche simplement de jouer sous le nom d'un autre depuis
 * son propre telephone : une fois identifie, l'appareil se souvient et ne le
 * redemande jamais.
 */
function ChampCode({ code, setCode, nouveau }) {
  const [montrer, setMontrer] = useState(false);
  return html`<label class="field">
    <span>${nouveau ? "Choisissez votre code" : "Votre code"}</span>
    <div class="row" style="gap:.4rem">
      <input class="grow" type=${montrer ? "text" : "password"} value=${code}
             inputmode="text" autocomplete=${nouveau ? "new-password" : "current-password"}
             placeholder="Quatre caractères au moins"
             onInput=${(e) => setCode(e.target.value)} />
      <button type="button" class="btn sm quiet" onClick=${() => setMontrer(!montrer)}>
        ${montrer ? "Cacher" : "Voir"}
      </button>
    </div>
    <span class="tiny faint">
      ${nouveau
        ? "Notez le quelque part. Il ne vous sera plus demandé sur ce téléphone, seulement si vous jouez depuis un autre appareil."
        : "Celui que vous avez choisi en vous inscrivant. En cas d'oubli, l'organisateur peut le remettre à zéro."}
    </span>
  </label>`;
}

/**
 * Le recit complet, dans sa propre fenetre. Le texte vient de
 * js/data/histoire.js et n'est pas retouche ici : la premiere ligne prend
 * seulement la place d'un titre, le reste garde ses paragraphes.
 */
function Histoire({ onFermer }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onFermer();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, []);

  return html`<div class="modal-back" onClick=${(e) => { if (e.target === e.currentTarget) onFermer(); }}>
    <div class="modal recit" role="dialog" aria-modal="true" aria-label="L'histoire complète">
      ${HISTOIRE.map((para, i) =>
        i === 0
          ? html`<p key=${i} class="recit-ouverture">${para}</p>`
          : html`<p key=${i}>${para}</p>`
      )}
      <button class="btn block" onClick=${onFermer}>Fermer</button>
    </div>
  </div>`;
}

export function Onboarding() {
  const [mode, setMode] = useState("liste");
  const [search, setSearch] = useState("");
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [vibe, setVibe] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  // Profil de la liste qui n'a pas encore de portrait : on le lui demande.
  const [attente, setAttente] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [apercu, setApercu] = useState(null);
  const [code, setCode] = useState("");
  // Diaporama d'arriere plan et photo ouverte en grand.
  const [vue, setVue] = useState(0);
  const [plein, setPlein] = useState(null);
  // Le recit complet s'ouvre dans sa propre fenetre : sur un telephone, le
  // derouler dans la carte recouvrirait justement les photos que l'on veut
  // faire voir, et le texte se lit mieux seul.
  const [histoire, setHistoire] = useState(false);

  useEffect(() => () => apercu && URL.revokeObjectURL(apercu), [apercu]);

  const photos = useMemo(
    () => PALIERS_VALLEE.map((p) => ({ src: p.src, legende: p.legende })),
    []
  );

  function choisirPhoto(f) {
    if (!f) return;
    if (!/^image\//.test(f.type || "")) {
      setError("Choisissez une image");
      return;
    }
    setError(null);
    setPhoto(f);
    setApercu(URL.createObjectURL(f));
  }

  // A la fermeture du grand ecran, le diaporama reprend sur la photo regardee.
  function changerPlein(v) {
    if (v === null) {
      if (plein !== null) setVue(plein);
      setPlein(null);
    } else {
      setPlein(v);
    }
  }

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

  // Depuis un appareil qui ne connait pas encore la personne, on demande son
  // code, et sa photo si elle date d'avant cette regle.
  function pick(p) {
    setError(null);
    setPhoto(null);
    setApercu(null);
    setCode("");
    setAttente(p);
  }

  async function completer(e) {
    e.preventDefault();
    const besoinPhoto = !attente.photo_path;
    if (besoinPhoto && !photo) {
      setError("Ajoutez votre photo de profil pour continuer");
      return;
    }
    if (code.trim().length < 4) {
      setError("Le code doit faire au moins quatre caractères");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const chemin = besoinPhoto ? await uploadPortrait(photo) : null;
      await signIn(attente.first_name, attente.last_name, attente.vibe, chemin, code);
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
    if (!photo) {
      setError("Ajoutez votre photo de profil pour vous inscrire");
      return;
    }
    if (code.trim().length < 4) {
      setError("Choisissez un code d'au moins quatre caractères");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const chemin = await uploadPortrait(photo);
      await signIn(first, last, vibe, chemin, code);
    } catch (err) {
      setError(friendly(err));
    } finally {
      setBusy(false);
    }
  }

  return html`<div class="stack ident">
    <${Diaporama} i=${vue} setI=${setVue} pause=${plein !== null}
      ouvrir=${(idx) => setPlein(idx)} />

    <div class="card">
      <h1>Le Val d'Anniviers en 2056</h1>
      <p class="muted small">
        Nous sommes en 2056 et la vallée s'est dégradée. Vous intervenez depuis 2026 pour lui
        rendre ce qui fait sa richesse. Commencez par vous identifier.
      </p>
      <button class="btn sm ghost" type="button" onClick=${() => setHistoire(true)}>
        Découvrir l'histoire complète
      </button>
    </div>

    ${histoire ? html`<${Histoire} onFermer=${() => setHistoire(false)} />` : null}

    ${state.retire
      ? html`<${Banner} kind="warn">
          Votre profil a été retiré du jeu par l'organisateur, et cet appareil ne le garde plus.
          Si c'est une erreur, parlez lui : il peut vous rouvrir l'inscription.
          <div style="margin-top:.5rem">
            <button class="btn sm quiet" type="button" onClick=${messageRetireVu}>J'ai compris</button>
          </div>
        <//>`
      : null}

    ${error ? html`<${Banner} kind="bad">${error}<//>` : null}
    ${state.loadError
      ? html`<${Banner} kind="warn">
          La liste des participants n'a pas pu être chargée. ${state.loadError}. Vous pouvez quand
          même créer votre profil dès que le réseau revient.
        <//>`
      : null}

    ${attente
      ? html`<form class="card" onSubmit=${completer}>
          <div class="tiny faint">${attente.a_un_code ? "Bon retour" : "Presque prêt"}</div>
          <h2 style="margin:.1rem 0 .5rem">${attente.first_name} ${attente.last_name}</h2>
          <p class="small muted">
            ${attente.a_un_code
              ? "Cet appareil ne vous connaît pas encore. Entrez votre code pour reprendre votre profil."
              : "Choisissez votre code personnel. Il empêche que quelqu'un d'autre joue à votre place."}
          </p>
          <${ChampCode} code=${code} setCode=${setCode} nouveau=${!attente.a_un_code} />
          ${attente.photo_path
            ? null
            : html`<${ChampPortrait} apercu=${apercu} onFichier=${choisirPhoto} obligatoire=${true} />`}
          <div class="row" style="margin-top:.7rem;gap:.5rem">
            <button class="btn grow" type="submit" disabled=${busy}>
              ${busy ? html`<${Spinner} />` : null} C'est parti
            </button>
            <button class="btn quiet" type="button" onClick=${() => setAttente(null)}>
              Ce n'est pas moi
            </button>
          </div>
        </form>`
      : html`<${Frag}>
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
                          (p) => html`<button key=${p.id} class="person" disabled=${busy}
                            onClick=${() => pick(p)}>
                            <${Avatar} p=${p} taille="sm" />
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
                <${ChampPortrait} apercu=${apercu} onFichier=${choisirPhoto} obligatoire=${true} />
                <div style="margin-top:.7rem"><${ChampCode} code=${code} setCode=${setCode} nouveau=${true} /></div>
                <label class="field" style="margin-top:.2rem">
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
        <//>`}

    ${plein !== null
      ? html`<${PhotoZoom} photos=${photos} i=${plein} setI=${changerPlein} />`
      : null}
  </div>`;
}

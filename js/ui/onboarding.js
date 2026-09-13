// Premier lancement : on choisit son profil dans la liste, ou on en cree un.
// Pas de mot de passe, pas d'email. L'application s'en souvient ensuite.
//
// En arriere plan, les six etats de la vallee defilent en fondu. Le temps de
// s'inscrire, on a vu la vallee abandonnee de 2056 puis sa version restauree,
// ce qui dit le but du jeu sans une ligne d'explication. Chaque image peut
// s'ouvrir en grand, et le defilement s'arrete alors sur celle qu'on regarde.
const { html, useState, useMemo, useEffect, useRef } = window.htmPreact;

import { state, signIn, chooseExisting, uploadPortrait, friendly } from "../store.js";
import { STYLES } from "../data/pillars.js";
import { PALIERS_VALLEE } from "../data/vallee.js";
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

  return html`<div class="diapo">
    <button type="button" class="diapo-zone" onClick=${ouvrir}
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
  </div>`;
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
  // Diaporama d'arriere plan et photo ouverte en grand.
  const [vue, setVue] = useState(0);
  const [plein, setPlein] = useState(null);

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

  async function pick(p) {
    // Un profil sans portrait passe d'abord par l'ajout de sa photo.
    if (!p.photo_path) {
      setError(null);
      setPhoto(null);
      setApercu(null);
      setAttente(p);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await chooseExisting({
        id: p.id,
        first_name: p.first_name,
        last_name: p.last_name,
        vibe: p.vibe,
        photo_path: p.photo_path
      });
    } catch (err) {
      setError(friendly(err));
    } finally {
      setBusy(false);
    }
  }

  async function completer(e) {
    e.preventDefault();
    if (!photo) {
      setError("Ajoutez votre photo de profil pour continuer");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const chemin = await uploadPortrait(photo);
      await signIn(attente.first_name, attente.last_name, attente.vibe, chemin);
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
    setBusy(true);
    setError(null);
    try {
      const chemin = await uploadPortrait(photo);
      await signIn(first, last, vibe, chemin);
    } catch (err) {
      setError(friendly(err));
    } finally {
      setBusy(false);
    }
  }

  return html`<div class="stack ident">
    <${Diaporama} i=${vue} setI=${setVue} pause=${plein !== null}
      ouvrir=${() => setPlein(vue)} />

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
      <button class="btn sm ghost" style="white-space:nowrap" onClick=${() => setPlein(vue)}>
        ⤢ Voir la vallée en grand
      </button>
      <p class="tiny faint" style="margin:.4rem 0 0">
        En fond, la vallée telle qu'elle est aujourd'hui en 2056, puis telle qu'elle pourrait
        redevenir. Photo affichée : ${PALIERS_VALLEE[vue].legende.toLowerCase()}.
      </p>
    </div>

    ${error ? html`<${Banner} kind="bad">${error}<//>` : null}
    ${state.loadError
      ? html`<${Banner} kind="warn">
          La liste des participants n'a pas pu être chargée. ${state.loadError}. Vous pouvez quand
          même créer votre profil dès que le réseau revient.
        <//>`
      : null}

    ${attente
      ? html`<form class="card" onSubmit=${completer}>
          <div class="tiny faint">Presque prêt</div>
          <h2 style="margin:.1rem 0 .5rem">${attente.first_name} ${attente.last_name}</h2>
          <p class="small muted">
            Il ne manque que votre photo de profil. Elle est demandée une seule fois.
          </p>
          <${ChampPortrait} apercu=${apercu} onFichier=${choisirPhoto} obligatoire=${true} />
          <div class="row" style="margin-top:.7rem;gap:.5rem">
            <button class="btn grow" type="submit" disabled=${busy || !photo}>
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
                <label class="field" style="margin-top:.7rem">
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

// La page qui explique le jeu, dans le meme esprit que l'ecran
// d'identification : la vallee en grand, puis le principe, puis la mecanique.
//
// Elle s'ouvre avant comme apres l'ouverture du jeu, et meme sans profil, pour
// que le lien envoye sur WhatsApp puisse mener directement ici.
const { html, useState, useEffect, useMemo } = window.htmPreact;

import { state, activitesOuvertes, jeuOuvert } from "../store.js";
import { PALIERS_VALLEE } from "../data/vallee.js";
import { PILLARS, VICTORY, TIERS, STYLES } from "../data/pillars.js";
import { CHALLENGES } from "../data/challenges.js";
import { SYNERGIES } from "../data/synergies.js";
import { HISTOIRE } from "../data/histoire.js";
import { PhotoZoom, Frag } from "./bits.js";

const DUREE_VUE = 4600;

/**
 * Bandeau de la vallee, qui traverse ses six etats en fondu. Contrairement au
 * diaporama de l'ecran d'identification, qui occupe le fond de la page en
 * entier, celui ci est une bande autonome : cette page vit a l'interieur de
 * l'application, avec sa barre du haut et ses onglets.
 */
function BandeauVallee({ ouvrir }) {
  const [i, setI] = useState(0);
  const [entrante, setEntrante] = useState(null);
  const [visible, setVisible] = useState(false);
  const [pause, setPause] = useState(false);

  // Fondu : on precharge la suivante, on la pose par dessus, on la revele,
  // puis elle devient l'image du dessous. Sans le prechargement, le fondu
  // partirait sur une image vide.
  useEffect(() => {
    if (pause) return undefined;
    const suivant = (i + 1) % PALIERS_VALLEE.length;
    const t = setTimeout(() => {
      const img = new Image();
      const poser = () => {
        setEntrante(suivant);
        setVisible(false);
        setTimeout(() => setVisible(true), 60);
        setTimeout(() => {
          setI(suivant);
          setEntrante(null);
          setVisible(false);
        }, 1250);
      };
      img.onload = poser;
      img.onerror = () => setI(suivant);
      img.src = PALIERS_VALLEE[suivant].src_small;
      if (img.complete) poser();
    }, DUREE_VUE);
    return () => clearTimeout(t);
  }, [i, pause]);

  const jeu = (p) => `${p.src_small} 760w, ${p.src} 1376w`;

  return html`<div class="card flat hero-vallee">
    <button type="button" class="hero-image" onClick=${() => ouvrir(i)}
            aria-label=${"Voir en grand : " + PALIERS_VALLEE[i].legende}>
      <img src=${PALIERS_VALLEE[i].src_small} srcset=${jeu(PALIERS_VALLEE[i])} sizes="100vw"
           alt=${"Le Val d'Anniviers : " + PALIERS_VALLEE[i].legende} />
      ${entrante !== null
        ? html`<img class=${"entrante" + (visible ? " visible" : "")}
                 src=${PALIERS_VALLEE[entrante].src_small} srcset=${jeu(PALIERS_VALLEE[entrante])}
                 sizes="100vw" alt="" />`
        : null}
      <span class="loupe" aria-hidden="true">⤢</span>
      <span class="hero-legende">${PALIERS_VALLEE[i].legende}</span>
    </button>
    <div class="hero-points" role="tablist" aria-label="Les six états de la vallée">
      ${PALIERS_VALLEE.map(
        (pal, k) => html`<button type="button" key=${pal.seuil}
          class=${"point" + (k === i ? " on" : "")}
          aria-label=${pal.legende} aria-selected=${k === i}
          onClick=${() => { setPause(true); setEntrante(null); setI(k); }}></button>`
      )}
    </div>
    <p class="tiny faint" style="margin:.5rem 0 0">
      Voilà ce qui se joue. L'image de la vallée change avec l'avancement du groupe, et c'est celle
      de l'onglet Piliers qui dit où vous en êtes vraiment.
    </p>
  </div>`;
}

function Etape({ n, titre, children }) {
  return html`<li class="etape">
    <span class="num" aria-hidden="true">${n}</span>
    <div>
      <strong>${titre}</strong>
      <p class="small muted" style="margin:.2rem 0 0">${children}</p>
    </div>
  </li>`;
}

export function Concept({ go }) {
  const [plein, setPlein] = useState(null);
  const [histoire, setHistoire] = useState(false);

  const total = useMemo(() => CHALLENGES.reduce((s, c) => s + c.points, 0), []);
  const maxJauges = PILLARS.reduce((s, p) => s + p.max_points, 0);
  const photos = useMemo(
    () => PALIERS_VALLEE.map((p) => ({ src: p.src, legende: p.legende })),
    []
  );
  const attente = state.lockoutMinutes || 30;
  const ouvert = jeuOuvert();
  const activites = activitesOuvertes();

  return html`<div class="stack">
    <${BandeauVallee} ouvrir=${(i) => setPlein(i)} />

    ${plein !== null
      ? html`<${PhotoZoom} photos=${photos} i=${plein} setI=${setPlein} />`
      : null}

    <div class="card">
      <div class="tiny faint">Le principe</div>
      <h1 style="margin:.15rem 0 .5rem">Rendre à la vallée ce qui fait sa richesse</h1>
      <p class="small">
        Nous sommes en 2056 et le Val d'Anniviers s'est dégradé. Les glaciers ont fondu, les bisses
        se sont taris, les alpages se sont vidés, les villages se sont éteints et la mémoire s'est
        perdue. Depuis 2026, vous êtes les seuls à pouvoir encore agir.
      </p>
      <p class="small" style="margin-top:.5rem">
        Chaque chose que vous allez faire dans la vallée, une marche, un fromage goûté, un bisse
        suivi, une histoire écoutée chez un habitant, compte comme une réparation. Le jeu ne fait
        que la reconnaître et la compter.
      </p>
      <button class="btn sm ghost" type="button" onClick=${() => setHistoire(true)}>
        Lire l'histoire complète
      </button>
    </div>

    ${histoire
      ? html`<div class="modal-back" onClick=${(e) => { if (e.target === e.currentTarget) setHistoire(false); }}>
          <div class="modal recit" role="dialog" aria-modal="true" aria-label="L'histoire complète">
            ${HISTOIRE.map((para, i) =>
              i === 0
                ? html`<p key=${i} class="recit-ouverture">${para}</p>`
                : html`<p key=${i}>${para}</p>`
            )}
            <button class="btn block" onClick=${() => setHistoire(false)}>Fermer</button>
          </div>
        </div>`
      : null}

    <div class="card">
      <h2>Une journée, ${CHALLENGES.length} défis</h2>
      <ol class="etapes">
        <${Etape} n="1" titre="Vous choisissez un défi">
          L'onglet Défis les range par pilier, par envie et par ampleur. Certains se font en un
          quart d'heure au bord de la route, d'autres demandent une vraie sortie. Chacun dit où il
          se joue, combien de temps il prend et ce qu'il y a à faire.
        <//>
        <${Etape} n="2" titre="Vous le faites pour de vrai">
          Sur place, avec les yeux et les jambes. Le jeu ne vérifie rien tout seul, il vous fait
          confiance : l'intérêt est dehors, pas dans l'application.
        <//>
        <${Etape} n="3" titre="Vous prenez une photo du groupe">
          Elle prouve le passage et elle nourrit l'album de la journée. Les téléphones font des
          fichiers énormes, l'application les réduit avant l'envoi, donc même avec deux barres de
          réseau ça part.
        <//>
        <${Etape} n="4" titre="Vous répondez au petit quiz">
          Deux ou trois questions sur ce que vous venez de voir. Elles se répondent après coup, une
          fois sur place, et elles apprennent quelque chose à tout le monde.
        <//>
        <${Etape} n="5" titre="Vous cochez qui était là">
          Tous ceux que vous désignez reçoivent les points, et le défi compte pour chacun d'eux.
          Une seule personne valide pour le groupe, inutile de le faire à cinq.
        <//>
      </ol>
      <p class="tiny faint" style="margin:.6rem 0 0">
        Sans réseau, tout fonctionne quand même. La validation attend dans le téléphone et part
        toute seule dès que la connexion revient.
      </p>
    </div>

    <div class="card">
      <h2>Les cinq piliers</h2>
      <p class="small muted" style="margin:.1rem 0 .7rem">
        Chaque défi verse ses points dans un pilier. Chacun se remplit jusqu'à${" "}
        ${PILLARS[0].max_points} points.
      </p>
      <div class="piliers-liste">
        ${PILLARS.map(
          (p) => html`<div key=${p.id} class="pilier-ligne">
            <span class="pilier-ic" style=${{ background: p.color }}>${p.icon}</span>
            <div>
              <strong>${p.name}</strong>
              <div class="tiny faint">${p.blurb}</div>
            </div>
          </div>`
        )}
      </div>
    </div>

    <div class="card">
      <h2>L'objectif est collectif</h2>
      <p class="small">
        Le catalogue pèse ${total} points et les cinq jauges peuvent monter à ${maxJauges}. La
        vallée est sauvée à ${VICTORY.global_target} points, à une condition : aucun pilier ne
        doit rester sous ${VICTORY.pillar_floor} points. Un groupe qui passerait sa journée en
        montagne sans jamais toucher à l'eau ni à la mémoire échouerait, même avec beaucoup de
        points.
      </p>
      <p class="small" style="margin-top:.5rem">
        Autre chose à savoir : un même défi rapporte moins à la jauge chaque fois qu'il est
        refait. Le premier groupe verse la totalité des points, le deuxième la moitié, le
        troisième le quart. Mieux vaut donc se répartir la vallée que de suivre la même piste.
      </p>
      ${ouvert
        ? html`<button class="btn sm quiet" type="button" onClick=${() => go("#/progression")}>
            Voir les jauges
          </button>`
        : html`<p class="tiny faint" style="margin:.6rem 0 0">
            L'onglet Piliers montrera les cinq jauges en direct dès l'ouverture du jeu.
          </p>`}
    </div>

    <div class="card">
      <h2>Et vos points à vous</h2>
      <p class="small">
        En parallèle du collectif, chacun garde son compte. Un défi rapporte ses points à toutes
        les personnes présentes, autant de fois qu'il est fait : côté personnel, rien ne
        décroît.
      </p>
      <div class="row wrap" style="gap:.35rem;margin:.6rem 0">
        ${Object.keys(TIERS).map(
          (k) => html`<span key=${k} class="chip plain">${TIERS[k].label} ${TIERS[k].points} points</span>`
        )}
      </div>
      <p class="small">
        Il reste ${SYNERGIES.length} découvertes cachées. Elles se déclenchent toutes seules quand
        deux choses que vous avez faites dans la journée se répondent, et elles racontent alors ce
        qui vient d'être compris. Personne ne vous dira lesquelles avant, et c'est mieux ainsi.
      </p>
    </div>

    <div class="card">
      <h2>La règle qui fait réfléchir</h2>
      <p class="small">
        Une mauvaise réponse au quiz et le défi est raté pour tout le groupe présent, qui doit
        attendre ${attente} minutes avant de pouvoir le reprendre. Lisez la question ensemble,
        regardez autour de vous, discutez. C'est fait pour.
      </p>
    </div>

    <div class="card">
      <h2>Le fil et l'album</h2>
      <p class="small">
        Chaque défi validé se publie tout seul dans le fil, avec sa photo. On y met des cornes de
        bouquetin, on y pousse des cris de marmotte en commentaire, on s'y interpelle avec un
        arobase, et on y poste ce qu'on veut, photo ou pas. Les notifications vous préviennent
        quand quelqu'un vous tague ou valide un défi avec vous, même téléphone verrouillé. Toutes
        les photos de la journée se retrouvent ensuite dans l'album.
      </p>
      <button class="btn sm quiet" type="button" onClick=${() => go("#/fil")}>Aller au fil</button>
    </div>

    <div class="card">
      <h2>Ce que vous pouvez déjà faire</h2>
      <p class="small">
        ${activites
          ? html`<${Frag}>
              L'onglet Activités est ouvert. Vous y trouverez les randonnées avec leurs vrais
              chiffres et le temps de route depuis Chandolin, les tables de la vallée, les
              visites, les musées, et de quoi ne rien faire du tout. Regardez, choisissez, et
              dites dans le fil ce qui vous tente : le week end s'organisera beaucoup mieux si
              chacun arrive avec deux ou trois idées.
            <//>`
          : html`<${Frag}>
              Les idées de randonnées, de tables et de visites s'ouvriront avant le week end.
              L'organisateur vous préviendra dans le fil.
            <//>`}
      </p>
      <p class="small" style="margin-top:.5rem">
        En attendant, soignez votre profil dans l'onglet Moi, une photo et quelques mots sur vous,
        activez les notifications, et allez dire bonjour dans le fil.
      </p>
      <div class="stack" style="gap:.5rem;margin-top:.7rem">
        ${activites
          ? html`<button class="btn block" type="button" onClick=${() => go("#/activites")}>
              🧭 Voir les activités du week end
            </button>`
          : null}
        <button class="btn quiet block" type="button" onClick=${() => go("#/moi")}>
          Compléter mon profil
        </button>
      </div>
    </div>

    <div class="card flat">
      <h3 style="font-size:.92rem">En une phrase</h3>
      <p class="small" style="margin:.2rem 0 0">
        Sortez, regardez la vallée de près, faites la raconter par ceux qui y vivent, prenez des
        photos, et répartissez vous entre les cinq piliers. Le reste se compte tout seul.
      </p>
      <div class="row wrap" style="gap:.35rem;margin-top:.6rem">
        ${STYLES.map((s) => html`<span key=${s.id} class="chip plain">${s.icon} ${s.label}</span>`)}
      </div>
    </div>
  </div>`;
}

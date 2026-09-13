// Point d'entree de l'application. Navigation par ancre, donc aucune
// configuration de serveur necessaire sur GitHub Pages.
const { html, render, useState, useEffect } = window.htmPreact;

import { state, subscribe, setState, boot, clearToast, dismissSynergy, unreadCount } from "./store.js";
import { PILLAR_BY_ID } from "./data/pillars.js";
import { Onboarding } from "./ui/onboarding.js";
import { ChallengeList } from "./ui/challenges.js";
import { ChallengeDetail } from "./ui/challenge.js";
import { Progress } from "./ui/progress.js";
import { Ranking } from "./ui/ranking.js";
import { Gallery } from "./ui/gallery.js";
import { Me, Pending } from "./ui/me.js";
import { Organizer } from "./ui/organizer.js";
import { Activites } from "./ui/activites.js";
import { Fil } from "./ui/fil.js";
import { Banner } from "./ui/bits.js";

const TABS = [
  { href: "#/defis", icon: "🎯", label: "Défis" },
  { href: "#/fil", icon: "📣", label: "Fil" },
  { href: "#/activites", icon: "🧭", label: "Activités" },
  { href: "#/progression", icon: "📊", label: "Piliers" },
  { href: "#/classement", icon: "🏅", label: "Score" },
  { href: "#/album", icon: "📷", label: "Album" },
  { href: "#/moi", icon: "🙋", label: "Moi" }
];

function parseRoute() {
  const h = (location.hash || "").replace(/^#\/?/, "");
  const parts = h.split("/").filter(Boolean);
  if (!parts.length) return { name: "defis" };
  if (parts[0] === "defi" && parts[1]) return { name: "defi", id: decodeURIComponent(parts[1]) };
  return { name: parts[0] };
}

function go(hash) {
  if (location.hash === hash) return;
  location.hash = hash;
}

function App() {
  const [, setTick] = useState(0);
  const [route, setRoute] = useState(parseRoute());

  useEffect(() => subscribe(() => setTick((n) => n + 1)), []);

  useEffect(() => {
    function onHash() {
      setRoute(parseRoute());
      window.scrollTo(0, 0);
    }
    window.addEventListener("hashchange", onHash);
    if (!location.hash) location.replace("#/defis");
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    if (!state.toast) return undefined;
    const t = setTimeout(clearToast, 3600);
    return () => clearTimeout(t);
  }, [state.toast]);

  if (!state.me) {
    const surActivites = route.name === "activites";
    return html`<div class="shell">
      <header class="topbar">
        ${surActivites
          ? html`<button class="topbar-back" aria-label="Retour"
                   onClick=${() => go("#/")}>‹</button>`
          : null}
        <div class="topbar-title">
          ${surActivites ? "Activités" : "Anniviers 2056"}
          <small>${surActivites ? "Le week end dans la vallée" : "Identification"}</small>
        </div>
        <${NetDot} />
      </header>
      <main>
        ${surActivites
          ? html`<${Activites} go=${go} identifie=${false} />`
          : html`<div class="stack accueil">
              <${Onboarding} />
              <button class="btn quiet block" onClick=${() => go("#/activites")}>
                🧭 Voir les activités du week end sans m'identifier
              </button>
            </div>`}
      </main>
      <${Toast} />
    </div>`;
  }

  const title = titleFor(route);

  return html`<div class="shell">
    <header class="topbar">
      ${route.name === "defi" || route.name === "organisateur"
        ? html`<button class="topbar-back" aria-label="Retour"
                 onClick=${() => go(route.name === "defi" ? "#/defis" : "#/moi")}>‹</button>`
        : null}
      <div class="topbar-title">
        ${title.main}<small>${title.sub}</small>
      </div>
      <${NetDot} />
    </header>

    <main>
      ${!state.online
        ? html`<${Banner} kind="warn">
            Pas de réseau. Vous pouvez continuer à jouer et à valider des défis, tout sera envoyé
            automatiquement dès que la connexion revient.
          <//>`
        : state.loadError && !state.gauges.length
          ? html`<${Banner} kind="bad">
              Impossible de joindre le serveur. ${state.loadError}.
            <//>`
          : null}

      ${route.name !== "moi" && state.pending.length ? html`<${Pending} />` : null}

      ${route.name === "defis" ? html`<${ChallengeList} go=${go} />` : null}
      ${route.name === "fil" ? html`<${Fil} />` : null}
      ${route.name === "activites" ? html`<${Activites} go=${go} identifie=${true} />` : null}
      ${route.name === "defi" ? html`<${ChallengeDetail} id=${route.id} go=${go} />` : null}
      ${route.name === "progression" ? html`<${Progress} />` : null}
      ${route.name === "classement" ? html`<${Ranking} />` : null}
      ${route.name === "album" ? html`<${Gallery} />` : null}
      ${route.name === "moi" ? html`<${Me} go=${go} />` : null}
      ${route.name === "organisateur" ? html`<${Organizer} go=${go} />` : null}
      ${["defis", "defi", "fil", "activites", "progression", "classement", "album", "moi", "organisateur"].includes(route.name)
        ? null
        : html`<${ChallengeList} go=${go} />`}
    </main>

    <nav class="tabbar">
      ${TABS.map((t) => {
        const on =
          t.href === "#/defis"
            ? route.name === "defis" || route.name === "defi"
            : t.href === "#/moi"
              ? route.name === "moi" || route.name === "organisateur"
              : t.href === "#/" + route.name;
        const badge =
          t.href === "#/moi"
            ? state.pending.length
            : t.href === "#/fil"
              ? unreadCount()
              : 0;
        return html`<a key=${t.href} href=${t.href} class=${on ? "on" : ""}>
          <span class="ic">${t.icon}</span>
          <span>${t.label}</span>
          ${badge ? html`<span class="badge">${badge}</span>` : null}
        </a>`;
      })}
    </nav>

    <${Toast} />
    ${state.synergyQueue.length ? html`<${SynergyModal} s=${state.synergyQueue[0]} />` : null}
  </div>`;
}

function titleFor(route) {
  const map = {
    defis: ["Les défis", "39 défis, 5 piliers"],
    defi: ["Un défi", "Validation"],
    fil: ["Le fil", "La journée en direct"],
    activites: ["Activités", "Le week end dans la vallée"],
    progression: ["Les piliers", "Objectif collectif"],
    classement: ["Classement", "En direct"],
    album: ["L'album", "Les photos de la journée"],
    moi: ["Mon profil", state.me ? `${state.me.first_name} ${state.me.last_name}` : ""],
    organisateur: ["Administration", "Gestion du jeu"]
  };
  const t = map[route.name] || map.defis;
  return { main: t[0], sub: t[1] };
}

function NetDot() {
  const cls = !state.online ? "off" : state.realtime === "en direct" ? "" : "warn";
  const label = !state.online ? "Hors ligne" : state.realtime === "en direct" ? "En direct" : "Reconnexion";
  return html`<span class=${"net-dot " + cls}><i></i>${label}</span>`;
}

function Toast() {
  if (!state.toast) return null;
  return html`<div class=${"toast " + (state.toast.kind || "")} role="status">${state.toast.text}</div>`;
}

function SynergyModal({ s }) {
  const pa = PILLAR_BY_ID[s.pillar_a];
  const pb = PILLAR_BY_ID[s.pillar_b];
  return html`<div class="modal-back" onClick=${(e) => { if (e.target === e.currentTarget) dismissSynergy(); }}>
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-kicker">✦ Vous avez découvert quelque chose</div>
      <h2>${s.name}</h2>
      <p class="story">${s.story}</p>
      ${s.bonus_learning ? html`<div class="learn">${s.bonus_learning}</div>` : null}
      <div class="bonus">
        <span class="chip ok">+${s.personal_bonus} points pour vous</span>
        <span class="chip plain">+${s.gauge_bonus} ${pa ? pa.short : s.pillar_a}</span>
        <span class="chip plain">+${s.gauge_bonus} ${pb ? pb.short : s.pillar_b}</span>
      </div>
      <div style="height:.9rem"></div>
      <button class="btn block" onClick=${dismissSynergy}>Continuer</button>
    </div>
  </div>`;
}

// ------------------------------------------------------------------ demarrage

const root = document.getElementById("app");
root.innerHTML = "";
render(html`<${App} />`, root);

boot().catch((err) => {
  console.error(err);
  setState({ loading: false, loadError: String(err && err.message ? err.message : err) });
});

// Mise en cache de l'enveloppe de l'application, pour qu'elle s'ouvre meme sans
// reseau une fois qu'elle a ete chargee au moins une fois.
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((err) => {
      console.warn("Service worker non enregistré", err);
    });
  });
}

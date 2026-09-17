// Rendu à blanc de chaque écran, dans un coin de page invisible.
//
// Un composant qui appelle une fonction disparue, ou qui casse à l'exécution,
// ne laisse rien dans la console : Preact abandonne le rendu et l'écran reste
// figé sur son état précédent. C'est arrivé deux fois, une fois pour un
// gabarit laissé ouvert, une fois pour un appel à une fonction supprimée
// pendant une refonte.
//
// Ce test rend chaque écran dans un conteneur détaché et rapporte la première
// exception, avec sa pile. Il ne touche à rien : aucun clic, aucun envoi.
//
// À coller dans la console du navigateur, sur l'application ouverte avec un
// profil actif :
//
//   const r = await rendu(); console.table(r);
window.rendu = async function rendu() {
  const { render, html } = window.htmPreact;
  const v = "?v=" + Date.now();
  const resultats = [];

  const ecrans = [
    ["Fil", "../js/ui/fil.js", "Fil", { go: () => {} }],
    ["Défis", "../js/ui/challenges.js", "ChallengeList", { go: () => {} }],
    ["Activités", "../js/ui/activites.js", "Activites", { go: () => {}, identifie: true }],
    ["Piliers", "../js/ui/progress.js", "Progress", {}],
    ["Classement", "../js/ui/ranking.js", "Ranking", { go: () => {} }],
    ["Album", "../js/ui/gallery.js", "Gallery", {}],
    ["Moi", "../js/ui/me.js", "Me", { go: () => {} }],
    ["Identification", "../js/ui/onboarding.js", "Onboarding", {}],
    ["Organisateur", "../js/ui/organizer.js", "Organizer", { go: () => {} }]
  ];

  for (const [nom, chemin, exporte, props] of ecrans) {
    const boite = document.createElement("div");
    boite.style.cssText = "position:absolute;left:-9999px;top:0;width:375px";
    document.body.appendChild(boite);
    try {
      const mod = await import(chemin + v);
      const Composant = mod[exporte];
      if (!Composant) throw new Error(`export ${exporte} introuvable`);
      render(html`<${Composant} ...${props} />`, boite);
      await new Promise((r) => setTimeout(r, 500));
      resultats.push({ ecran: nom, ok: true, noeuds: boite.querySelectorAll("*").length, erreur: "" });
    } catch (e) {
      resultats.push({
        ecran: nom,
        ok: false,
        noeuds: 0,
        erreur: String(e && e.message ? e.message : e)
      });
      console.error(nom, e);
    } finally {
      try {
        render(null, boite);
      } catch (e) {
        /* on démonte au mieux */
      }
      boite.remove();
    }
  }

  // Un profil d'autre joueur, qui a sa propre page.
  const boite = document.createElement("div");
  boite.style.cssText = "position:absolute;left:-9999px;top:0;width:375px";
  document.body.appendChild(boite);
  try {
    const store = await import("../js/store.js" + v);
    const mod = await import("../js/ui/profil.js" + v);
    const qui = (store.state.scores || [])[0];
    render(html`<${mod.Profil} id=${qui && qui.id} go=${() => {}} />`, boite);
    await new Promise((r) => setTimeout(r, 400));
    resultats.push({ ecran: "Profil", ok: true, noeuds: boite.querySelectorAll("*").length, erreur: "" });
  } catch (e) {
    resultats.push({ ecran: "Profil", ok: false, noeuds: 0, erreur: String(e && e.message ? e.message : e) });
    console.error("Profil", e);
  } finally {
    render(null, boite);
    boite.remove();
  }

  const casses = resultats.filter((r) => !r.ok);
  console.log(
    casses.length ? `${casses.length} écran(s) en échec` : `${resultats.length} écrans rendus sans erreur`
  );
  return resultats;
};

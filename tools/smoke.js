// Test de fumee : ouvre chaque ecran et chaque onglet, verifie qu'un contenu
// attendu apparait vraiment. A coller dans la console du navigateur, sur
// l'application ouverte avec un profil actif et le code organisateur saisi.
//
// Sert a attraper les gabarits htm casses, qui echouent silencieusement sans
// rien ecrire dans la console. Trois ecrans de chargement avaient ce defaut.
//
//   const r = await smoke(); console.table(r.resultats);
window.smoke = async function smoke() {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const texte = () => document.querySelector("main").textContent.replace(/\s+/g, " ");
  const resultats = [];
  const erreurs = [];

  const onerrorOrig = window.onerror;
  window.onerror = (m) => {
    erreurs.push(String(m));
    return false;
  };

  async function ecran(nom, hash, attendu) {
    location.hash = hash;
    await wait(1800);
    const t = texte();
    const ok = attendu.every((a) => t.includes(a));
    resultats.push({
      ecran: nom,
      ok,
      manquant: ok ? "" : attendu.filter((a) => !t.includes(a)).join(" | "),
      taille: t.length
    });
    return ok;
  }

  await ecran("Défis", "#/defis", ["Tous les piliers", "Tous les styles", "défis sur 39"]);
  await ecran("Un défi", "#/defi/ou-va-leau", ["Ce qu'il faut faire", "Le groupe du moment"]);
  await ecran("Piliers", "#/progression", ["Objectif collectif", "Les cinq piliers"]);
  await ecran("Classement", "#/classement", ["Classement", "Mes découvertes"]);
  await ecran("Album", "#/album", ["dans l'album"]);
  await ecran("Moi", "#/moi", ["Votre profil", "Votre envie du moment", "Administration"]);

  // Onglet Mes decouvertes du classement
  location.hash = "#/classement";
  await wait(1200);
  const btnDec = [...document.querySelectorAll(".fbtn")].find((b) =>
    b.textContent.includes("Mes découvertes")
  );
  if (btnDec) {
    btnDec.click();
    await wait(1200);
    const t = texte();
    resultats.push({
      ecran: "Classement / Mes découvertes",
      ok: t.includes("Vos découvertes"),
      manquant: t.includes("Vos découvertes") ? "" : "Vos découvertes",
      taille: t.length
    });
  }

  // Espace d'administration, si le code a deja ete saisi
  await ecran("Administration", "#/organisateur", ["Administration"]);
  const attendus = {
    "Tableau de bord": "La journée en un coup d'œil",
    Soumissions: "Filtrer par défi",
    Joueurs: "Chercher un joueur",
    Attentes: "Attentes en cours",
    Réglages: "Durée de l'attente"
  };
  for (const [label, marqueur] of Object.entries(attendus)) {
    const b = [...document.querySelectorAll(".filters .fbtn")].find(
      (x) => x.textContent.trim() === label
    );
    if (!b) {
      resultats.push({ ecran: "Admin / " + label, ok: false, manquant: "onglet introuvable" });
      continue;
    }
    b.click();
    await wait(1600);
    const t = texte();
    resultats.push({
      ecran: "Admin / " + label,
      ok: t.includes(marqueur),
      manquant: t.includes(marqueur) ? "" : marqueur,
      taille: t.length
    });
  }

  window.onerror = onerrorOrig;
  const echecs = resultats.filter((r) => !r.ok);
  return {
    total: resultats.length,
    reussis: resultats.length - echecs.length,
    echecs: echecs.length,
    erreursJs: erreurs,
    resultats
  };
};

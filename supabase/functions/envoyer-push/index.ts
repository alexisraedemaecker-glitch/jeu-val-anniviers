// Envoi des notifications poussees.
//
// Appelee par un declencheur de la base a chaque nouvelle notification. Elle
// relit la notification, rassemble les appareils de la personne concernee, et
// pousse le message a chacun.
//
// Le protocole est ecrit ici a la main, avec la seule cryptographie du
// navigateur, plutot que d'ajouter une dependance :
//   RFC 8291 pour le chiffrement du message,
//   RFC 8188 pour son enveloppe aes128gcm,
//   RFC 8292 pour la signature VAPID qui prouve d'ou vient l'envoi.
//
// Rien de secret ne circule en clair : le message est chiffre pour un appareil
// precis, et le service de poussee de Google ou d'Apple ne peut pas le lire.

const encodeur = new TextEncoder();

function b64urlVersOctets(s: string): Uint8Array {
  const base = s.replace(/-/g, "+").replace(/_/g, "/");
  const bourrage = base.length % 4 ? "=".repeat(4 - (base.length % 4)) : "";
  const brut = atob(base + bourrage);
  const out = new Uint8Array(brut.length);
  for (let i = 0; i < brut.length; i += 1) out[i] = brut.charCodeAt(i);
  return out;
}

function octetsVersB64url(b: ArrayBuffer | Uint8Array): string {
  const octets = b instanceof Uint8Array ? b : new Uint8Array(b);
  let s = "";
  for (const o of octets) s += String.fromCharCode(o);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function coller(...morceaux: Uint8Array[]): Uint8Array {
  const total = morceaux.reduce((n, m) => n + m.length, 0);
  const out = new Uint8Array(total);
  let i = 0;
  for (const m of morceaux) {
    out.set(m, i);
    i += m.length;
  }
  return out;
}

async function hmac(cle: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const k = await crypto.subtle.importKey("raw", cle, { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, message));
}

/** Une etape HKDF, suffisante ici : toutes les sorties tiennent en 32 octets. */
async function hkdf(sel: Uint8Array, ikm: Uint8Array, info: Uint8Array, taille: number) {
  const prk = await hmac(sel, ikm);
  const bloc = await hmac(prk, coller(info, new Uint8Array([1])));
  return bloc.slice(0, taille);
}

/** Jeton VAPID : il dit au service de poussee qui envoie, et le prouve. */
async function jetonVapid(audience: string, sujet: string, jwk: JsonWebKey): Promise<string> {
  const entete = octetsVersB64url(encodeur.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const charge = octetsVersB64url(
    encodeur.encode(
      JSON.stringify({
        aud: audience,
        exp: Math.floor(Date.now() / 1000) + 11 * 3600,
        sub: sujet,
      }),
    ),
  );
  const cle = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cle,
    encodeur.encode(`${entete}.${charge}`),
  );
  return `${entete}.${charge}.${octetsVersB64url(signature)}`;
}

/**
 * Chiffre le message pour un appareil donne, selon RFC 8291.
 *
 * Les parametres d'essai ne servent qu'au vecteur de test de la RFC, qui fixe
 * le sel et la paire ephemere pour rendre le resultat reproductible. En usage
 * normal, les deux sont tires au hasard a chaque envoi.
 */
async function chiffrer(
  texte: string,
  p256dh: string,
  auth: string,
  essai?: { sel: Uint8Array; privee: string; publique: string },
): Promise<Uint8Array> {
  const clePubliqueClient = b64urlVersOctets(p256dh);
  const secretAuth = b64urlVersOctets(auth);

  // Paire ephemere, propre a cet envoi.
  let paire: CryptoKeyPair;
  let notrePublique: Uint8Array;
  if (essai) {
    const pub = b64urlVersOctets(essai.publique);
    const jwk = {
      kty: "EC",
      crv: "P-256",
      d: essai.privee,
      x: octetsVersB64url(pub.slice(1, 33)),
      y: octetsVersB64url(pub.slice(33, 65)),
      ext: true,
    };
    const privee = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "ECDH", namedCurve: "P-256" },
      false,
      ["deriveBits"],
    );
    paire = { privateKey: privee, publicKey: privee } as CryptoKeyPair;
    notrePublique = pub;
  } else {
    paire = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, [
      "deriveBits",
    ]);
    notrePublique = new Uint8Array(await crypto.subtle.exportKey("raw", paire.publicKey));
  }

  const cleClient = await crypto.subtle.importKey(
    "raw",
    clePubliqueClient,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );
  const partage = new Uint8Array(
    await crypto.subtle.deriveBits({ name: "ECDH", public: cleClient }, paire.privateKey, 256),
  );

  const infoCle = coller(
    encodeur.encode("WebPush: info\0"),
    clePubliqueClient,
    notrePublique,
  );
  const ikm = await hkdf(secretAuth, partage, infoCle, 32);

  const sel = essai ? essai.sel : crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(sel, ikm, encodeur.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(sel, ikm, encodeur.encode("Content-Encoding: nonce\0"), 12);

  const cleAes = await crypto.subtle.importKey("raw", cek, { name: "AES-GCM" }, false, ["encrypt"]);
  // Le 0x02 marque la fin du contenu, il n'y a qu'un seul bloc.
  const clair = coller(encodeur.encode(texte), new Uint8Array([2]));
  const chiffre = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce, tagLength: 128 }, cleAes, clair),
  );

  const tailleBloc = new Uint8Array(4);
  new DataView(tailleBloc.buffer).setUint32(0, 4096);
  return coller(sel, tailleBloc, new Uint8Array([notrePublique.length]), notrePublique, chiffre);
}

/** Le texte affiche sur l'ecran verrouille, selon ce qui est arrive. */
function rediger(kind: string, acteur: string, defi: string | null) {
  switch (kind) {
    case "kudo":
      return { titre: "Une corne pour vous", corps: `${acteur} a applaudi votre publication` };
    case "mention":
      return { titre: "On parle de vous", corps: `${acteur} vous a nommé dans le fil` };
    case "commentaire":
      return { titre: "Un commentaire", corps: `${acteur} a commenté votre publication` };
    case "reponse":
      return { titre: "Une réponse", corps: `${acteur} a répondu après vous` };
    case "reaction":
      return { titre: "Une réaction", corps: `${acteur} a réagi à votre commentaire` };
    case "defi":
      return {
        titre: "Défi validé avec vous",
        corps: defi ? `${acteur} a validé ${defi} avec vous` : `${acteur} a validé un défi avec vous`,
      };
    default:
      return { titre: "Anniviers 2056", corps: "Du nouveau dans le fil" };
  }
}

async function rpc(nom: string, args: Record<string, unknown>) {
  const url = Deno.env.get("SUPABASE_URL");
  const cle = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const r = await fetch(`${url}/rest/v1/rpc/${nom}`, {
    method: "POST",
    headers: {
      apikey: cle ?? "",
      Authorization: `Bearer ${cle}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });
  if (!r.ok) throw new Error(`${nom} : ${r.status} ${await r.text()}`);
  return await r.json();
}

Deno.serve(async (req) => {
  try {
    const corps = await req.json().catch(() => ({}));

    // Vecteur de test de la RFC 8291, section 5. Mêmes clés, même sel, donc
    // même résultat attendu : de quoi vérifier le chiffrement sans dépendre
    // d'un vrai téléphone.
    if (corps?.test_vecteur) {
      const sortie = await chiffrer(
        "When I grow up, I want to be a watermelon",
        "BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4",
        "BTBZMqHH6r4Tts7J_aSIgg",
        {
          sel: b64urlVersOctets("DGv6ra1nlYgDCS1FRnbzlw"),
          privee: "yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw",
          publique:
            "BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8",
        },
      );
      const jwk = JSON.parse(Deno.env.get("VAPID_PRIVATE_JWK") ?? "{}");
      const jeton = await jetonVapid(
        "https://exemple.push.invalid",
        Deno.env.get("VAPID_SUBJECT") ?? "mailto:test@example.org",
        jwk,
      );
      return new Response(
        JSON.stringify({ chiffre: octetsVersB64url(sortie), jeton }),
        { headers: { "Content-Type": "application/json" } },
      );
    }
    // Le declencheur de la base envoie la ligne inseree, un appel manuel peut
    // se contenter de l'identifiant.
    const id = corps?.record?.id ?? corps?.notification_id ?? corps?.id;
    if (!id) return new Response(JSON.stringify({ erreur: "identifiant manquant" }), { status: 400 });

    const infos = await rpc("push_a_envoyer", { p_notification: id });
    if (!infos) return new Response(JSON.stringify({ envoyes: 0, raison: "introuvable" }));

    const abonnements = infos.abonnements ?? [];
    if (!abonnements.length) return new Response(JSON.stringify({ envoyes: 0, raison: "aucun appareil" }));

    const jwk = JSON.parse(Deno.env.get("VAPID_PRIVATE_JWK") ?? "{}");
    const clePublique = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
    const sujet = Deno.env.get("VAPID_SUBJECT") ?? "mailto:anniviers@example.org";

    const { titre, corps: texte } = rediger(infos.kind, infos.acteur, infos.defi);
    const message = JSON.stringify({ titre, corps: texte, url: "#/fil", id });

    let envoyes = 0;
    const erreurs: string[] = [];
    for (const ab of abonnements) {
      try {
        const audience = new URL(ab.endpoint).origin;
        const [jeton, charge] = await Promise.all([
          jetonVapid(audience, sujet, jwk),
          chiffrer(message, ab.p256dh, ab.auth),
        ]);
        const r = await fetch(ab.endpoint, {
          method: "POST",
          headers: {
            TTL: "86400",
            Urgency: "normal",
            "Content-Encoding": "aes128gcm",
            "Content-Type": "application/octet-stream",
            Authorization: `vapid t=${jeton}, k=${clePublique}`,
          },
          body: charge,
        });
        if (r.ok) {
          envoyes += 1;
        } else {
          const detail = await r.text();
          erreurs.push(`${r.status} ${detail.slice(0, 120)}`);
          // 404 et 410 disent que l'appareil ne repond plus jamais.
          await rpc("push_echec", {
            p_endpoint: ab.endpoint,
            p_definitif: r.status === 404 || r.status === 410,
          });
        }
      } catch (e) {
        erreurs.push(String(e).slice(0, 150));
      }
    }
    return new Response(JSON.stringify({ envoyes, total: abonnements.length, erreurs }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ erreur: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

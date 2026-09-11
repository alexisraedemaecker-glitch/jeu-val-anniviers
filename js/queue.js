// File d'attente locale des soumissions.
//
// Toute soumission est d'abord ecrite ici, sur l'appareil, avant la moindre
// tentative reseau. Si le reseau manque, elle reste en attente et part des que
// la connexion revient. La photo est stockee telle quelle, en Blob, dans
// IndexedDB, qui n'a pas la limite de taille de localStorage.

const DB_NAME = "anniviers2056";
const DB_VERSION = 1;
const STORE = "pending";

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB indisponible"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "client_id" });
        store.createIndex("created_at", "created_at");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(mode, fn) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const store = t.objectStore(STORE);
        let result;
        try {
          result = fn(store);
        } catch (err) {
          reject(err);
          return;
        }
        t.oncomplete = () => resolve(result && result.__req ? result.__req.result : result);
        t.onerror = () => reject(t.error);
        t.onabort = () => reject(t.error || new Error("Transaction annulée"));
      })
  );
}

function wrap(req) {
  return { __req: req };
}

// Repli en memoire si IndexedDB est bloque (navigation privee sur certains
// navigateurs). On perd la persistance entre deux ouvertures, mais l'app
// continue de fonctionner pendant la session.
const memory = new Map();
let useMemory = false;

async function guard(promise, fallback) {
  if (useMemory) return fallback();
  try {
    return await promise();
  } catch (err) {
    console.warn("File d'attente locale en mémoire seulement", err);
    useMemory = true;
    return fallback();
  }
}

export function put(item) {
  return guard(
    () => tx("readwrite", (store) => wrap(store.put(item))),
    () => {
      memory.set(item.client_id, item);
      return item.client_id;
    }
  );
}

export function remove(clientId) {
  return guard(
    () => tx("readwrite", (store) => wrap(store.delete(clientId))),
    () => {
      memory.delete(clientId);
      return undefined;
    }
  );
}

export function all() {
  return guard(
    () => tx("readonly", (store) => wrap(store.getAll())),
    () => Array.from(memory.values())
  ).then((rows) =>
    (rows || []).slice().sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
  );
}

export function get(clientId) {
  return guard(
    () => tx("readonly", (store) => wrap(store.get(clientId))),
    () => memory.get(clientId)
  );
}

export async function count() {
  const rows = await all();
  return rows.length;
}

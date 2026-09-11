// Compression des photos avant envoi.
//
// Une photo de telephone pese facilement 4 megaoctets. En montagne, avec une
// barre de reseau, cela peut prendre plusieurs minutes. On redimensionne et on
// recompresse dans le navigateur pour viser quelques centaines de kilooctets,
// ce qui reste largement suffisant pour un album souvenir.

import { PHOTO_MAX_SIDE, PHOTO_QUALITY, PHOTO_TARGET_BYTES } from "./config.js";

async function decode(file) {
  // createImageBitmap applique l'orientation EXIF, donc les photos prises en
  // portrait ne ressortent pas couchees.
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch (err) {
      try {
        return await createImageBitmap(file);
      } catch (err2) {
        // on retombe sur Image ci dessous
      }
    }
  }
  return await new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image illisible"));
    };
    img.src = url;
  });
}

function toBlob(canvas, quality) {
  return new Promise((resolve) => {
    if (canvas.toBlob) {
      canvas.toBlob((b) => resolve(b), "image/jpeg", quality);
    } else {
      const data = canvas.toDataURL("image/jpeg", quality);
      const bin = atob(data.split(",")[1]);
      const buf = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i += 1) buf[i] = bin.charCodeAt(i);
      resolve(new Blob([buf], { type: "image/jpeg" }));
    }
  });
}

export async function compress(file) {
  if (!file) return null;
  if (!/^image\//.test(file.type || "")) {
    throw new Error("Ce fichier n'est pas une image");
  }

  let source;
  try {
    source = await decode(file);
  } catch (err) {
    // Si le navigateur n'arrive pas a decoder, on envoie l'original plutot que
    // de bloquer la soumission.
    return { blob: file, width: 0, height: 0, original: file.size };
  }

  const w0 = source.width || source.naturalWidth;
  const h0 = source.height || source.naturalHeight;
  const scale = Math.min(1, PHOTO_MAX_SIDE / Math.max(w0, h0));
  const w = Math.max(1, Math.round(w0 * scale));
  const h = Math.max(1, Math.round(h0 * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(source, 0, 0, w, h);
  if (source.close) source.close();

  let quality = PHOTO_QUALITY;
  let blob = await toBlob(canvas, quality);
  // Deux resserrages au maximum, pour ne pas faire chauffer le telephone.
  for (let i = 0; i < 2 && blob && blob.size > PHOTO_TARGET_BYTES; i += 1) {
    quality = Math.max(0.45, quality - 0.15);
    blob = await toBlob(canvas, quality);
  }
  if (!blob) return { blob: file, width: w0, height: h0, original: file.size };

  // Si la compression a rendu le fichier plus lourd, on garde l'original.
  if (blob.size >= file.size && file.size < PHOTO_TARGET_BYTES * 2) {
    return { blob: file, width: w0, height: h0, original: file.size };
  }
  return { blob, width: w, height: h, original: file.size };
}

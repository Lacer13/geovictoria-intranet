import fs from "node:fs/promises";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { TECNOIA_V2_PARTS } from "../src/game/tecnoiaV2.js";

// Authorized local alpha cleanup, using the clean opaque source rather than
// filtering white pixels from a robot's face or glove. Only border-connected
// pixels close to the measured blue-gray backdrop are removed.
export function cutoutBackground(pixels, width, height, background = [212, 223, 231], tolerance = 14) {
  if (pixels.length !== width * height * 4) throw new Error("Invalid pixel dimensions");
  const removed = new Uint8Array(width * height), queue = new Int32Array(width * height);
  let read = 0, write = 0;
  const visit = (index) => {
    if (removed[index]) return;
    const p = index * 4;
    if (Math.hypot(pixels[p] - background[0], pixels[p + 1] - background[1], pixels[p + 2] - background[2]) > tolerance) return;
    removed[index] = 1;
    queue[write++] = index;
  };
  for (let x = 0; x < width; x++) { visit(x); visit((height - 1) * width + x); }
  for (let y = 0; y < height; y++) { visit(y * width); visit(y * width + width - 1); }
  while (read < write) {
    const index = queue[read++], x = index % width, y = Math.floor(index / width);
    if (x > 0) visit(index - 1);
    if (x + 1 < width) visit(index + 1);
    if (y > 0) visit(index - width);
    if (y + 1 < height) visit(index + width);
  }
  const result = new Uint8ClampedArray(pixels);
  for (let i = 0; i < removed.length; i++) if (removed[i]) result[i * 4 + 3] = 0;
  return result;
}

export async function prepareTecnoiaArt() {
  const folder = "design/characters/tecnoia";
  const source = await fs.readFile(`${folder}/rig-v2-fuente-opaca.png`);
  const image = await loadImage(source);
  if (image.width !== 1254 || image.height !== 1254) throw new Error("Review source rectangles: expected 1254x1254");
  const canvas = createCanvas(image.width, image.height), ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  const pixels = ctx.getImageData(0, 0, image.width, image.height);
  pixels.data.set(cutoutBackground(pixels.data, image.width, image.height));
  ctx.putImageData(pixels, 0, 0);
  await fs.writeFile(`${folder}/rig-v2-alpha-local.png`, await canvas.encode("png"));
  const metadata = {
    source: "rig-v2-fuente-opaca.png",
    sourceSha256: crypto.createHash("sha256").update(source).digest("hex"),
    image: "rig-v2-alpha-local.png",
    method: "border-connected color flood fill; RGB preserved",
    background: [212, 223, 231], tolerance: 14,
    parts: TECNOIA_V2_PARTS,
    productionReady: false,
  };
  await fs.writeFile(`${folder}/rig-v2-parts.json`, JSON.stringify(metadata, null, 2) + "\n");
  return metadata;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href)
  console.log(JSON.stringify(await prepareTecnoiaArt()));

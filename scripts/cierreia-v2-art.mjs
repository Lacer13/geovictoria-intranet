import fs from "node:fs/promises";
import crypto from "node:crypto";
import { CIERREIA_V2_PARTS } from "../src/game/cierreiaV2.js";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { cutoutConectiaBackground as cutoutAtlasBackground } from "./conectia-v2-art.mjs";
const folder = "design/characters/cierreia";
const source = await fs.readFile(`${folder}/rig-v2-fuente-opaca.png`),
  image = await loadImage(source);
if (image.width !== 1254 || image.height !== 1254)
  throw Error("Expected square 1254 source");
const canvas = createCanvas(1254, 1254),
  ctx = canvas.getContext("2d");
ctx.drawImage(image, 0, 0);
const pixels = ctx.getImageData(0, 0, 1254, 1254);
const options = {
  background: [202, 218, 228],
  tolerance: 16,
  seeds: [
    [275, 586],
    [289, 941],
  ],
};
pixels.data.set(cutoutAtlasBackground(pixels.data, 1254, 1254, options));
ctx.putImageData(pixels, 0, 0);
await fs.writeFile(
  `${folder}/rig-v2-alpha-local.png`,
  await canvas.encode("png"),
);
const groups = [];
const visited = new Set();
for (let i = 0; i < 1254 * 1254; i++) {
  if (
    visited.has(i) ||
    pixels.data[i * 4 + 3] === 0 ||
    Math.hypot(
      ...options.background.map((v, c) => pixels.data[i * 4 + c] - v),
    ) > 16
  )
    continue;
  const queue = [i];
  visited.add(i);
  let n = 0,
    sx = 0,
    sy = 0;
  for (let q = 0; q < queue.length; q++) {
    const j = queue[q],
      x = j % 1254,
      y = Math.floor(j / 1254);
    n++;
    sx += x;
    sy += y;
    for (const k of [
      x > 0 ? j - 1 : -1,
      x < 1253 ? j + 1 : -1,
      y > 0 ? j - 1254 : -1,
      y < 1253 ? j + 1254 : -1,
    ])
      if (
        k >= 0 &&
        !visited.has(k) &&
        pixels.data[k * 4 + 3] > 0 &&
        Math.hypot(
          ...options.background.map((v, c) => pixels.data[k * 4 + c] - v),
        ) <= 16
      ) {
        visited.add(k);
        queue.push(k);
      }
  }
  if (n > 15)
    groups.push({
      n,
      center: [Math.round(sx / n), Math.round(sy / n)],
      seed: [i % 1254, Math.floor(i / 1254)],
    });
}
const muzzles = {};
for (const [name, x0] of [
  ["aim", 418],
  ["recoil", 836],
]) {
  let sx = 0,
    sy = 0,
    n = 0;
  for (let y = 418; y < 836; y++)
    for (let x = x0 + 300; x < x0 + 418; x++) {
      const p = (y * 1254 + x) * 4;
      if (
        pixels.data[p + 3] > 200 &&
        pixels.data[p] < 120 &&
        pixels.data[p + 1] > 190 &&
        pixels.data[p + 2] > 210
      ) {
        sx += x;
        sy += y;
        n++;
      }
    }
  muzzles[name] = [Math.round(sx / n), Math.round(sy / n)];
}
await fs.writeFile(
  `${folder}/rig-v2-parts.json`,
  JSON.stringify(
    {
      source: "rig-v2-fuente-opaca.png",
      sourceSha256: crypto.createHash("sha256").update(source).digest("hex"),
      image: "rig-v2-alpha-local.png",
      method: "perimeter flood fill; RGB preserved",
      ...options,
      parts: CIERREIA_V2_PARTS,
      muzzles,
    },
    null,
    2,
  ) + "\n",
);
console.log(JSON.stringify({ groups, muzzles }));

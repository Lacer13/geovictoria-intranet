import fs from "node:fs/promises";
import crypto from "node:crypto";
import { createCanvas, loadImage } from "@napi-rs/canvas";

const manifest = { version: 1, generator: "ImageGen integrado", scenes: [] };
for (const id of ["bosque", "taller", "faro"]) {
  const path = `design/scenery/${id}-v1.png`, bytes = await fs.readFile(path), source = await loadImage(bytes);
  const canvas = createCanvas(1440, 810), ctx = canvas.getContext("2d");
  const scale = Math.max(1440 / source.width, 810 / source.height);
  ctx.drawImage(source, (1440 - source.width * scale) / 2, (810 - source.height * scale) / 2, source.width * scale, source.height * scale);
  const output = `public/scenery/${id}-v1.webp`, encoded = await canvas.encode("webp", 84);
  await fs.writeFile(output, encoded);
  const preview = createCanvas(480, 270);
  preview.getContext("2d").drawImage(canvas, 0, 0, 480, 270);
  await fs.writeFile(`public/scenery/${id}-preview.webp`, await preview.encode("webp", 80));
  manifest.scenes.push({ id, source: path, sourceWidth: source.width, sourceHeight: source.height,
    sourceSha256: crypto.createHash("sha256").update(bytes).digest("hex"), output, width: 1440, height: 810, bytes: encoded.length,
    sha256: crypto.createHash("sha256").update(encoded).digest("hex") });
}
await fs.writeFile("design/scenery/manifest-v1.json", JSON.stringify(manifest, null, 2) + "\n");
console.log(JSON.stringify(manifest.scenes.map(({ id, bytes }) => ({ id, bytes }))));

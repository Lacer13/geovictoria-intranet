import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import {
  GREETING_CHARACTERS,
  greetingAtlasParts,
} from "../src/lib/santaGreeting.js";

// Repack the approved game parts at invitation size. The original artwork and
// every game asset stay unchanged; only one small character atlas is requested.
await mkdir("public/santa-greetings", { recursive: true });
const records = [];
for (const character of GREETING_CHARACTERS) {
  const original = await readFile(`public${character.source}`);
  const source = await loadImage(original);
  const canvas = createCanvas(512, 256);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  const parts = greetingAtlasParts(character.parts);
  for (const key of ["head", "tool", "hand"])
    ctx.drawImage(source, ...character.parts[key], ...parts[key]);
  const output = await canvas.encode("webp", 86);
  await writeFile(`public${character.atlas}`, output);
  records.push({
    id: character.id,
    source: character.source,
    sourceSha256: createHash("sha256").update(original).digest("hex"),
    atlas: character.atlas,
    atlasSha256: createHash("sha256").update(output).digest("hex"),
    bytes: output.length,
    parts,
  });
}
await writeFile(
  "public/santa-greetings/manifest.json",
  JSON.stringify(
    { version: 1, width: 512, height: 256, characters: records },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify({
    characters: records.length,
    totalBytes: records.reduce((total, record) => total + record.bytes, 0),
    largestAtlas: Math.max(...records.map((record) => record.bytes)),
  }),
);

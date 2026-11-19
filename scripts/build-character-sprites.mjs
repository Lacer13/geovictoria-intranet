import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { AREA_CHARACTERS } from "../src/game/roster.js";
import {
  CLIPS,
  SPRITE_COLUMNS,
  SPRITE_SIZE,
  SPRITE_ROWS,
} from "../src/game/animation.js";
import { drawRig } from "../src/game/rig.js";

// This exporter renders the same game rig into real sprite frames. It does not
// retouch the generated input PNGs. Their original alpha is preserved.
const chosen = process.argv.includes("--ids")
  ? process.argv[process.argv.indexOf("--ids") + 1].split(",")
  : null;
const characters = AREA_CHARACTERS.filter(
  (c) => !chosen || chosen.includes(c.id),
);
const parts = {};
const report = [];

function boundsInRegion(data, imageWidth, region) {
  const [left, top, width, height] = region;
  let x0 = left + width,
    y0 = top + height,
    x1 = left,
    y1 = top,
    count = 0;
  for (let y = top; y < top + height; y++)
    for (let x = left; x < left + width; x++) {
      if (data[(y * imageWidth + x) * 4 + 3] < 96) continue;
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
      count++;
    }
  if (count < 2000) throw Error("Missing or incomplete atlas part");
  const pad = 16;
  x0 = Math.max(left, x0 - pad);
  y0 = Math.max(top, y0 - pad);
  x1 = Math.min(left + width - 1, x1 + pad);
  y1 = Math.min(top + height - 1, y1 + pad);
  return [x0, y0, x1 - x0 + 1, y1 - y0 + 1];
}

for (const character of characters) {
  const input = path.join("public", character.src);
  const original = await fs.readFile(input);
  const image = await loadImage(original);
  const inspect = createCanvas(image.width, image.height),
    inspectCtx = inspect.getContext("2d");
  inspectCtx.drawImage(image, 0, 0);
  const { data } = inspectCtx.getImageData(0, 0, image.width, image.height);
  const splitX = Math.floor(image.width * 0.56),
    splitY = Math.floor(image.height * 0.5);
  const source = {
    head: boundsInRegion(data, image.width, [0, 0, splitX, splitY]),
    tool: boundsInRegion(data, image.width, [
      splitX,
      0,
      image.width - splitX,
      splitY,
    ]),
    hand: boundsInRegion(data, image.width, [
      0,
      splitY,
      splitX,
      image.height - splitY,
    ]),
  };
  parts[character.id] = source;
  const clips = Object.entries(CLIPS);
  const sheet = createCanvas(
      SPRITE_SIZE * SPRITE_COLUMNS,
      SPRITE_SIZE * SPRITE_ROWS,
    ),
    ctx = sheet.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  const frames = {};
  for (const [pose, clip] of clips)
    for (let index = 0; index < clip.frames; index++) {
      const x = (index % SPRITE_COLUMNS) * SPRITE_SIZE,
        y = (clip.row + Math.floor(index / SPRITE_COLUMNS)) * SPRITE_SIZE;
      const elapsed =
        (clip.duration * index) / (clip.loop ? clip.frames : clip.frames - 1);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, SPRITE_SIZE, SPRITE_SIZE);
      ctx.clip();
      drawRig(
        ctx,
        image,
        source,
        character,
        x + SPRITE_SIZE / 2,
        y + SPRITE_SIZE / 2,
        SPRITE_SIZE * 0.94,
        pose,
        elapsed,
      );
      ctx.restore();
      const pixels = ctx.getImageData(x, y, SPRITE_SIZE, SPRITE_SIZE).data;
      let occupied = 0;
      for (let py = 0; py < SPRITE_SIZE; py++)
        for (let px = 0; px < SPRITE_SIZE; px++) {
          const alpha = pixels[(py * SPRITE_SIZE + px) * 4 + 3];
          if (alpha > 96) occupied++;
          if (
            alpha > 32 &&
            (px < 2 || py < 2 || px >= SPRITE_SIZE - 2 || py >= SPRITE_SIZE - 2)
          )
            throw Error(`${character.id}/${pose}/${index}: clipped frame`);
        }
      if (occupied < 1500)
        throw Error(`${character.id}/${pose}/${index}: empty frame`);
      frames[`${pose}_${String(index).padStart(2, "0")}`] = {
        x,
        y,
        w: SPRITE_SIZE,
        h: SPRITE_SIZE,
      };
    }
  const folder = path.dirname(input);
  const encoded = await sheet.encode("webp", 92);
  await fs.writeFile(path.join(folder, "sprites-v1.webp"), encoded);
  const thumb = createCanvas(320, 320);
  drawRig(
    thumb.getContext("2d"),
    image,
    source,
    character,
    160,
    160,
    310,
    "idle",
    0,
  );
  await fs.writeFile(
    path.join(folder, "portrait-v1.webp"),
    await thumb.encode("webp", 94),
  );
  const metadata = {
    character: character.id,
    name: character.name,
    area: character.area,
    image: "sprites-v1.webp",
    width: sheet.width,
    height: sheet.height,
    cell: SPRITE_SIZE,
    columns: SPRITE_COLUMNS,
    clips: CLIPS,
    frames,
    parts: source,
    source: "rig-navidad-v1.png",
    sourceSha256: crypto.createHash("sha256").update(original).digest("hex"),
    celebration: character.celebration,
    power: character.power,
  };
  await fs.writeFile(
    path.join(folder, "sprites-v1.json"),
    JSON.stringify(metadata, null, 2) + "\n",
  );
  report.push({
    id: character.id,
    frames: Object.keys(frames).length,
    bytes: encoded.length,
    allFramesComplete: true,
  });
  console.log(JSON.stringify(report.at(-1)));
}
if (!chosen) {
  await fs.writeFile(
    "src/game/characterParts.js",
    "// Generated by npm run sprites from the approved, unchanged input atlases.\nexport const CHARACTER_PARTS = " +
      JSON.stringify(parts, null, 2) +
      ";\n",
  );
  const contact = createCanvas(1120, 1050),
    ctx = contact.getContext("2d");
  ctx.fillStyle = "#10362f";
  ctx.fillRect(0, 0, contact.width, contact.height);
  for (let i = 0; i < AREA_CHARACTERS.length; i++) {
    const c = AREA_CHARACTERS[i],
      x = (i % 4) * 280,
      y = Math.floor(i / 4) * 350;
    const img = await loadImage(path.join("public", c.src));
    drawRig(ctx, img, parts[c.id], c, x + 140, y + 145, 260, "victory", 0.35);
    ctx.fillStyle = "#fff4d4";
    ctx.font = "bold 22px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(c.name, x + 140, y + 294);
    ctx.fillStyle = "#b5d0c0";
    ctx.font = "16px sans-serif";
    ctx.fillText(c.area, x + 140, y + 321);
  }
  await fs.writeFile(
    "design/characters/elenco-navidad-v1.webp",
    await contact.encode("webp", 94),
  );
  await fs.mkdir("artifacts", { recursive: true });
  await fs.writeFile(
    "artifacts/sprites-verificados.json",
    JSON.stringify(report, null, 2),
  );
}

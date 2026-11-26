import fs from "node:fs/promises";
import crypto from "node:crypto";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import {
  createSpriteLayout,
  inspectFramePixels,
} from "../src/game/spriteLayout.js";
import { validateAnimationAtlas } from "../src/game/spriteAtlas.js";
import { drawCierreiaV2, cierreiaV2Muzzle } from "../src/game/cierreiaV2.js";
import {
  sampleCierreiaGameplay,
  CIERREIA_GAME_CLIPS,
  CIERREIA_GAME_PIVOT,
} from "../src/game/cierreiaGameplay.js";

const folder = "public/characters/cierreia";
const bytes = await fs.readFile(
  "design/characters/cierreia/rig-v2-alpha-local.png",
);
const image = await loadImage(bytes);
const names = Object.entries(CIERREIA_GAME_CLIPS).flatMap(([name, c]) =>
  Array.from(
    { length: c.frames },
    (_, i) => `${name}_${String(i).padStart(2, "0")}`,
  ),
);
const cell = 192;
const layout = createSpriteLayout(names, {
  columns: 12,
  rows: 16,
  cellWidth: cell,
});
// Trim unused rows on the final page while retaining the explicit frame rects.
layout.pages.forEach((p, i) => {
  p.height = Math.max(
    ...layout.frames.filter((f) => f.page === i).map((f) => f.y + f.h),
  );
});
const pages = layout.pages.map((p) => createCanvas(p.width, p.height));
const meta = {
  schemaVersion: 2,
  kind: "playable-pilot",
  productionReady: true,
  character: "cierreia",
  source: "rig-navidad-v2.png",
  sourceWidth: image.width,
  sourceHeight: image.height,
  sourceSha256: crypto.createHash("sha256").update(bytes).digest("hex"),
  pages: layout.pages.map((p, i) => ({
    image: `sprites-v2-${i + 1}.webp`,
    ...p,
  })),
  frames: {},
  clips: {},
};
let cursor = 0;
for (const [pose, clip] of Object.entries(CIERREIA_GAME_CLIPS)) {
  const sequence = [];
  for (let i = 0; i < clip.frames; i++) {
    const target = layout.frames[cursor++];
    const sample = sampleCierreiaGameplay(pose, i / clip.fps);
    const canvas = createCanvas(cell, cell),
      ctx = canvas.getContext("2d");
    drawCierreiaV2(ctx, image, sample, { size: cell });
    const review = inspectFramePixels(
      ctx.getImageData(0, 0, cell, cell).data,
      cell,
      cell,
      { edge: 2 },
    );
    if (review.edgePixels || review.occupied < 1800)
      throw new Error(`${target.name}: clipped or incomplete`);
    pages[target.page].getContext("2d").drawImage(canvas, target.x, target.y);
    const muzzle = cierreiaV2Muzzle(sample),
      scale = cell / 320;
    meta.frames[target.name] = {
      page: target.page,
      x: target.x,
      y: target.y,
      w: cell,
      h: cell,
      anchors: {
        pivot: {
          x: CIERREIA_GAME_PIVOT.x * scale,
          y: CIERREIA_GAME_PIVOT.y * scale,
        },
        hand: { x: sample.handX * scale, y: sample.handY * scale },
        muzzle: muzzle
          ? {
              x: muzzle.x * scale,
              y: muzzle.y * scale,
              dx: muzzle.dx,
              dy: muzzle.dy,
            }
          : null,
      },
    };
    sequence.push(target.name);
  }
  meta.clips[pose] = { ...clip, frames: sequence };
}
validateAnimationAtlas(meta);
await fs.writeFile(`${folder}/rig-navidad-v2.png`, bytes);
for (let i = 0; i < pages.length; i++)
  await fs.writeFile(
    `${folder}/${meta.pages[i].image}`,
    await pages[i].encode("webp", 94),
  );
const portrait = createCanvas(320, 320);
drawCierreiaV2(
  portrait.getContext("2d"),
  image,
  sampleCierreiaGameplay("idle"),
);
await fs.writeFile(
  `${folder}/portrait-v2.webp`,
  await portrait.encode("webp", 94),
);
await fs.writeFile(
  `${folder}/sprites-v2.json`,
  JSON.stringify(meta, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    frames: names.length,
    pages: meta.pages,
    sourceSha256: meta.sourceSha256,
  }),
);

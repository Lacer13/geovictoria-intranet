import fs from "node:fs/promises";
import crypto from "node:crypto";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { ENEMY_CLIPS, sampleEnemyFrame } from "../src/game/enemyAnimation.js";
import { createSpriteLayout, inspectFramePixels } from "../src/game/spriteLayout.js";
import { validateAnimationAtlas } from "../src/game/spriteAtlas.js";

const sourcePath = "design/enemies/desfase/poses-v1.png";
const bytes = await fs.readFile(sourcePath), source = await loadImage(bytes);
// Explicit integer rectangles for the generated 1774 x 887 image. Its cells
// are not an integer grid: never divide and silently cut off the next pose.
const xs = [0, 444, 887, 1331, 1774], ys = [0, 444, 887];
const keys = ["idle", "aim", "charge", "fire", "recoil", "recover", "damage", "defeat"];
if (source.width !== 1774 || source.height !== 887) throw new Error("Source dimensions changed");
const crops = Object.fromEntries(keys.map((name, i) => {
  const col = i % 4, row = Math.floor(i / 4);
  return [name, { x: xs[col], y: ys[row], w: xs[col + 1] - xs[col], h: ys[row + 1] - ys[row] }];
}));
const names = Object.entries(ENEMY_CLIPS).flatMap(([name, clip]) => Array.from({ length: clip.frames }, (_, i) => `${name}_${String(i).padStart(2, "0")}`));
const cell = 192, layout = createSpriteLayout(names, { columns: 12, cellWidth: cell });
const page = createCanvas(layout.pages[0].width, layout.pages[0].height), ctx = page.getContext("2d");
const atlas = { schemaVersion: 2, kind: "enemy", productionReady: true, character: "desfase", source: sourcePath,
  sourceSha256: crypto.createHash("sha256").update(bytes).digest("hex"), keyPoses: crops,
  pages: [{ ...layout.pages[0], image: "sprites-v1.webp" }], frames: {}, clips: {} };
let index = 0;
const contact = createCanvas(8 * cell, cell * 2), contactCtx = contact.getContext("2d");
contactCtx.fillStyle = "#102d36"; contactCtx.fillRect(0, 0, contact.width, contact.height);
for (const [pose, clip] of Object.entries(ENEMY_CLIPS)) {
  const sequence = [];
  for (let i = 0; i < clip.frames; i++) {
    const frame = layout.frames[index++], sample = sampleEnemyFrame(pose, i / clip.fps);
    const canvas = createCanvas(cell, cell), c = canvas.getContext("2d"), rect = crops[sample.key];
    c.save(); c.translate(96 + sample.dx, 96 + sample.dy); c.rotate(sample.angle); c.globalAlpha = sample.alpha;
    c.drawImage(source, rect.x, rect.y, rect.w, rect.h, -80, -80, 160, 160); c.restore();
    // Small round core/muzzle light; never a star or a bolt.
    if (sample.glow) {
      c.globalAlpha = sample.glow * sample.alpha; c.fillStyle = "#ffd6ac";
      c.beginPath(); c.ellipse(31, 70, pose === "shooting" ? 5 : 2.5, 4, 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
    }
    const review = inspectFramePixels(c.getImageData(0, 0, cell, cell).data, cell, cell);
    if (review.edgePixels || pose !== "defeat" && review.occupied < 3000) throw new Error(`Clipped or empty ${frame.name}`);
    ctx.drawImage(canvas, frame.x, frame.y);
    atlas.frames[frame.name] = { page: 0, x: frame.x, y: frame.y, w: cell, h: cell,
      anchors: { pivot: { x: 96, y: 96 }, muzzle: { x: 31, y: 70, dx: -1, dy: 0 } } };
    sequence.push(frame.name);
  }
  atlas.clips[pose] = { ...clip, frames: sequence };
}
// Review the actual authored poses at both desktop and small-game scale.
for (let i = 0; i < keys.length; i++) {
  const r = crops[keys[i]];
  for (const [row, size] of [[0, 160], [1, 80]]) {
    contactCtx.drawImage(source, r.x, r.y, r.w, r.h, i * cell + (cell - size) / 2, row * cell + 12, size, size);
    contactCtx.fillStyle = "#f7e6cb"; contactCtx.font = "14px sans-serif"; contactCtx.fillText(keys[i], i * cell + 16, row * cell + 185);
  }
}
validateAnimationAtlas(atlas);
await fs.mkdir("public/enemies/desfase", { recursive: true });
await fs.writeFile("public/enemies/desfase/sprites-v1.webp", await page.encode("webp", 92));
await fs.writeFile("public/enemies/desfase/sprites-v1.json", JSON.stringify(atlas, null, 2) + "\n");
await fs.writeFile("design/enemies/desfase/contacto-v1.webp", await contact.encode("webp", 92));
console.log(JSON.stringify({ frames: names.length, page: atlas.pages[0], sourceSha256: atlas.sourceSha256 }));

import fs from "node:fs/promises";
import crypto from "node:crypto";
import { createCanvas, loadImage, GifEncoder } from "@napi-rs/canvas";
import { createSpriteLayout, inspectFramePixels, validateFrameRects } from "../src/game/spriteLayout.js";
import { CONECTIA_V2_CLIPS, CONECTIA_V2_PARTS, sampleConectiaV2, drawConectiaV2, conectiaV2Muzzle } from "../src/game/conectiaV2.js";
import { prepareConectiaArt } from "./conectia-v2-art.mjs";

const folder = "design/characters/conectia", output = `${folder}/revision-v2-secuencias-01`;
await prepareConectiaArt();
const source = await fs.readFile(`${folder}/rig-v2-alpha-local.png`), image = await loadImage(source);
const original = createCanvas(image.width, image.height), originalCtx = original.getContext("2d");
originalCtx.drawImage(image, 0, 0);
validateFrameRects([{ width: image.width, height: image.height }], Object.entries(CONECTIA_V2_PARTS).map(([name, [x, y, w, h]]) => ({ name, page: 0, x, y, w, h })));
for (const [name, rect] of Object.entries(CONECTIA_V2_PARTS)) {
  const inspection = inspectFramePixels(originalCtx.getImageData(...rect).data, rect[2], rect[3]);
  if (inspection.edgePixels || inspection.occupied < 500) throw new Error(`${name}: source part clipped or empty`);
}
await fs.mkdir(output, { recursive: true });
const metadata = {
  schemaVersion: 2, kind: "animation-study", character: "conectia", productionReady: false,
  source: "../rig-v2-alpha-local.png", sourceSha256: crypto.createHash("sha256").update(source).digest("hex"),
  cell: 320, pages: [], frames: {}, clips: {},
  reviewNotes: ["Estudio de actuación, todavía no conectado al arcade.", "Normal: 12 pasos; Ráfaga: 6 pasos. Conserva la mecánica existente de 60 pasos/s.", "Celebración propia de 72 fotogramas a 24 FPS: vitoreo con baliza, pulgar arriba y reposo final."],
};
const delay = (i, fps) => (Math.round((i + 1) * 100 / fps) - Math.round(i * 100 / fps)) * 10;
for (const [name, clip] of Object.entries(CONECTIA_V2_CLIPS)) {
  const names = Array.from({ length: clip.frames }, (_, i) => `${name}_${String(i).padStart(2, "0")}`);
  const layout = createSpriteLayout(names, { columns: name === "victory" ? 8 : name === "burst" ? 3 : 4, cellWidth: 320 });
  const sheet = createCanvas(layout.pages[0].width, layout.pages[0].height), sheetCtx = sheet.getContext("2d");
  const page = metadata.pages.length;
  metadata.pages.push({ image: `${name}.webp`, ...layout.pages[0] });
  metadata.clips[name] = { ...clip, frames: names };
  const contact = createCanvas(8 * 170, Math.ceil(clip.frames / 8) * 190), contactCtx = contact.getContext("2d");
  const gif = new GifEncoder(320, 320, { repeat: 1, quality: 8 });
  for (let i = 0; i < clip.frames; i++) {
    const sample = sampleConectiaV2(name, i / clip.fps), canvas = createCanvas(320, 320), ctx = canvas.getContext("2d");
    drawConectiaV2(ctx, image, sample);
    const inspection = inspectFramePixels(ctx.getImageData(0, 0, 320, 320).data, 320, 320, { edge: 3 });
    if (inspection.edgePixels || inspection.occupied < 5000) throw new Error(`${name}/${i}: frame clipped or empty`);
    const target = layout.frames[i]; sheetCtx.drawImage(canvas, target.x, target.y);
    metadata.frames[names[i]] = { page, x: target.x, y: target.y, w: target.w, h: target.h,
      phase: sample.phase, head: sample.head, hand: sample.hand,
      anchors: { pivot: { x: 160, y: 160 }, hand: { x: sample.handX, y: sample.handY }, muzzle: conectiaV2Muzzle(sample) } };
    const cx = i % 8 * 170, cy = Math.floor(i / 8) * 190;
    contactCtx.fillStyle = i % 2 ? "#e4edf0" : "#12333c"; contactCtx.fillRect(cx, cy, 170, 190);
    contactCtx.drawImage(canvas, cx + 5, cy, 160, 160);
    contactCtx.fillStyle = i % 2 ? "#163541" : "#d4eef3"; contactCtx.font = "12px sans-serif"; contactCtx.textAlign = "center";
    contactCtx.fillText(`${i + 1} · ${sample.phase}`, cx + 85, cy + 179);
    ctx.globalCompositeOperation = "destination-over"; ctx.fillStyle = "#12333c"; ctx.fillRect(0, 0, 320, 320);
    gif.addFrame(Buffer.from(ctx.getImageData(0, 0, 320, 320).data), 320, 320, { delay: delay(i, clip.fps) });
  }
  await fs.writeFile(`${output}/${name}.webp`, await sheet.encode("webp", 94));
  await fs.writeFile(`${output}/${name}-contacto.webp`, await contact.encode("webp", 94));
  await fs.writeFile(`${output}/${name}.gif`, gif.finish());
}

// Compare the real existing intervals, without importing or changing gameplay,
// profile, audio or score. Every shown projectile has a distinct emission step.
const demo = new GifEncoder(1200, 390, { repeat: 1, quality: 8 });
const scene = createCanvas(1200, 390), ctx = scene.getContext("2d");
for (let i = 0; i < 72; i++) {
  ctx.fillStyle = "#12333c"; ctx.fillRect(0, 0, 1200, 390);
  for (const [column, name, interval] of [[0, "shooting", 12], [1, "burst", 6]]) {
    const x = column * 600, origin = conectiaV2Muzzle(sampleConectiaV2(name, 0));
    ctx.save(); ctx.beginPath(); ctx.rect(x, 0, 599, 390); ctx.clip();
    drawConectiaV2(ctx, image, sampleConectiaV2(name, (i % interval) / 60), { x, y: 30 });
    ctx.fillStyle = "#a6fbff";
    for (let event = 0; event <= Math.floor(i / interval); event++) {
      const age = (i - event * interval) / 60;
      ctx.beginPath(); ctx.ellipse(x + origin.x + age * 600, origin.y + 30, 8, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.font = "18px sans-serif"; ctx.fillStyle = "#d4eef3";
    ctx.fillText(`${name === "burst" ? "Ráfaga" : "Normal"} · ${Math.floor(i / interval) + 1} emisiones · ${interval} pasos`, x + 30, 355);
    ctx.restore();
  }
  demo.addFrame(Buffer.from(ctx.getImageData(0, 0, 1200, 390).data), 1200, 390, { delay: delay(i, 60) });
}
await fs.writeFile(`${output}/normal-vs-rafaga.gif`, demo.finish());

const poses = [["Reposo", "victory", 71], ["Apuntado", "shooting", 11], ["Emisión", "shooting", 0], ["Retroceso", "shooting", 2],
  ["Ráfaga · 0,1 s", "burst", 1], ["Vitoreo", "victory", 22], ["Conexión lograda", "victory", 43], ["Salida", "victory", 63]];
const board = createCanvas(1440, 1040), boardCtx = board.getContext("2d");
for (let i = 0; i < poses.length; i++) {
  const [label, name, frame] = poses[i], x = i % 4 * 360, y = Math.floor(i / 4) * 520;
  boardCtx.fillStyle = "#12333c"; boardCtx.fillRect(x, y, 360, 190);
  drawConectiaV2(boardCtx, image, sampleConectiaV2(name, frame / CONECTIA_V2_CLIPS[name].fps), { x: x + 100, y: y + 5, size: 160 });
  boardCtx.fillStyle = "#e4edf0"; boardCtx.fillRect(x, y + 190, 360, 330);
  drawConectiaV2(boardCtx, image, sampleConectiaV2(name, frame / CONECTIA_V2_CLIPS[name].fps), { x: x + 20, y: y + 190 });
  boardCtx.fillStyle = "#d4eef3"; boardCtx.font = "16px sans-serif"; boardCtx.textAlign = "center";
  boardCtx.fillText(`${label} · 160 / 320 px`, x + 180, y + 181);
}
await fs.writeFile(`${output}/poses-contacto.webp`, await board.encode("webp", 94));
await fs.writeFile(`${output}/secuencias.json`, JSON.stringify(metadata, null, 2) + "\n");
console.log(JSON.stringify({ output, frames: Object.keys(metadata.frames).length, clips: Object.keys(metadata.clips), productionReady: false }));

import fs from "node:fs/promises";
import crypto from "node:crypto";
import { createCanvas, loadImage, GifEncoder } from "@napi-rs/canvas";
import { createSpriteLayout, inspectFramePixels, validateFrameRects } from "../src/game/spriteLayout.js";
import { drawTecnoiaV2, sampleTecnoiaV2, tecnoiaV2Muzzle, TECNOIA_V2_CLIPS, TECNOIA_V2_PARTS } from "../src/game/tecnoiaV2.js";
import { prepareTecnoiaArt } from "./tecnoia-v2-art.mjs";

const folder = "design/characters/tecnoia";
const output = `${folder}/revision-v2-secuencias-01`;
await prepareTecnoiaArt();
const source = await fs.readFile(`${folder}/rig-v2-alpha-local.png`);
const image = await loadImage(source);
const inspect = createCanvas(image.width, image.height), inspectCtx = inspect.getContext("2d");
inspectCtx.drawImage(image, 0, 0);
validateFrameRects([{ width: image.width, height: image.height }], Object.entries(TECNOIA_V2_PARTS).map(([name, [x, y, w, h]]) => ({ name, page: 0, x, y, w, h })));
for (const [name, [x, y, w, h]] of Object.entries(TECNOIA_V2_PARTS)) {
  const result = inspectFramePixels(inspectCtx.getImageData(x, y, w, h).data, w, h);
  if (result.edgePixels || result.occupied < 500) throw new Error(`${name}: incomplete or clipped source part`);
}
await fs.mkdir(output, { recursive: true });
const metadata = {
  schemaVersion: 2, kind: "animation-study", character: "tecnoia", productionReady: false,
  source: "../rig-v2-alpha-local.png", sourceSha256: crypto.createHash("sha256").update(source).digest("hex"),
  cell: 320, pages: [], frames: {}, clips: {},
  reviewNotes: ["Secuencias de estudio: integración en la simulación, sonido y fallback v2 pendientes.", "La vista previa de disparo ilustra el origen; no crea una partida ni guarda puntos."],
};
for (const [name, clip] of Object.entries(TECNOIA_V2_CLIPS)) {
  const names = Array.from({ length: clip.frames }, (_, i) => `${name}_${String(i).padStart(2, "0")}`);
  const layout = createSpriteLayout(names, { columns: name === "victory" ? 8 : 4, cellWidth: 320 });
  const sheet = createCanvas(layout.pages[0].width, layout.pages[0].height), sheetCtx = sheet.getContext("2d");
  const page = metadata.pages.length;
  metadata.pages.push({ image: `${name}.webp`, ...layout.pages[0] });
  metadata.clips[name] = { ...clip, frames: names };
  const contact = createCanvas(8 * 170, Math.ceil(clip.frames / 8) * 194), contactCtx = contact.getContext("2d");
  const gif = new GifEncoder(320, 320, { repeat: 1, quality: 8 });
  for (let i = 0; i < clip.frames; i++) {
    const sample = sampleTecnoiaV2(name, i / clip.fps);
    const canvas = createCanvas(320, 320), ctx = canvas.getContext("2d");
    drawTecnoiaV2(ctx, image, sample);
    const pixels = ctx.getImageData(0, 0, 320, 320).data;
    const review = inspectFramePixels(pixels, 320, 320, { edge: 3 });
    if (review.edgePixels || review.occupied < 5000) throw new Error(`${name}/${i}: clipped or empty frame`);
    const target = layout.frames[i];
    sheetCtx.drawImage(canvas, target.x, target.y);
    metadata.frames[names[i]] = { page, x: target.x, y: target.y, w: target.w, h: target.h,
      phase: sample.phase, head: sample.head, hand: sample.hand, anchors: { pivot: { x: 160, y: 160 }, hand: { x: sample.handX, y: sample.handY }, muzzle: tecnoiaV2Muzzle(sample) } };
    const cx = (i % 8) * 170, cy = Math.floor(i / 8) * 194;
    contactCtx.fillStyle = i % 2 ? "#e4edf0" : "#12333c";
    contactCtx.fillRect(cx, cy, 170, 194);
    contactCtx.drawImage(canvas, cx + 5, cy + 2, 160, 160);
    contactCtx.fillStyle = i % 2 ? "#163541" : "#d4eef3";
    contactCtx.font = "12px sans-serif";
    contactCtx.textAlign = "center";
    contactCtx.fillText(`${i + 1} · ${sample.phase}`, cx + 85, cy + 181);
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = "#12333c";
    ctx.fillRect(0, 0, 320, 320);
    // GIF has centisecond resolution; alternate delays to preserve total time.
    const delay = Math.round((i + 1) * 100 / clip.fps) * 10 - Math.round(i * 100 / clip.fps) * 10;
    gif.addFrame(Buffer.from(ctx.getImageData(0, 0, 320, 320).data), 320, 320, { delay });
  }
  await fs.writeFile(`${output}/${name}.webp`, await sheet.encode("webp", 94));
  await fs.writeFile(`${output}/${name}-contacto.webp`, await contact.encode("webp", 94));
  await fs.writeFile(`${output}/${name}.gif`, gif.finish());
}

// Muzzle demonstration with one accepted emission per 0.2s. This is an art
// study; it neither imports nor mutates game state, scores, profiles or audio.
const preview = new GifEncoder(640, 360, { repeat: 1, quality: 8 });
const scene = createCanvas(640, 360), ctx = scene.getContext("2d");
const origin = tecnoiaV2Muzzle(sampleTecnoiaV2("shooting", 0));
for (let i = 0; i < 72; i++) {
  ctx.fillStyle = "#12333c";
  ctx.fillRect(0, 0, 640, 360);
  drawTecnoiaV2(ctx, image, sampleTecnoiaV2("shooting", (i % 12) / 60), { x: 0, y: 12 });
  ctx.fillStyle = "#a6fbff";
  for (let event = 0; event <= Math.floor(i / 12); event++) {
    const age = (i - event * 12) / 60;
    ctx.beginPath();
    ctx.ellipse(origin.x + age * 600, origin.y + 12, 9, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.font = "14px sans-serif";
  ctx.fillStyle = "#c4e5ed";
  ctx.fillText("Estudio de emisión · 60 pasos/s · sin puntuación", 30, 343);
  const delay = Math.round((i + 1) * 100 / 60) * 10 - Math.round(i * 100 / 60) * 10;
  preview.addFrame(Buffer.from(ctx.getImageData(0, 0, 640, 360).data), 640, 360, { delay });
}
await fs.writeFile(`${output}/disparo-demostracion.gif`, preview.finish());
await fs.writeFile(`${output}/secuencias.json`, JSON.stringify(metadata, null, 2) + "\n");
console.log(JSON.stringify({ output, frames: Object.keys(metadata.frames).length, clips: Object.keys(metadata.clips), productionReady: false }));

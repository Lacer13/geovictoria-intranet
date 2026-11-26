import fs from "node:fs/promises";
import { createCanvas, loadImage, GifEncoder } from "@napi-rs/canvas";
import {
  sampleCierreiaV2,
  drawCierreiaV2,
  CIERREIA_V2_CLIPS,
} from "../src/game/cierreiaV2.js";
const folder = "design/characters/cierreia";
const image = await loadImage(`${folder}/rig-v2-alpha-local.png`);
const board = createCanvas(1280, 440),
  b = board.getContext("2d");
const poses = [
  ["Reposo", "victory", 71],
  ["Apuntado", "shooting", 11],
  ["Emisión", "shooting", 0],
  ["Retroceso", "shooting", 2],
  ["Gran cierre", "closing", 0],
  ["Retroceso potente", "closing", 3],
  ["Acuerdo cerrado", "victory", 42],
  ["Salida", "victory", 61],
];
for (let i = 0; i < poses.length; i++) {
  const [label, name, frame] = poses[i],
    x = (i % 4) * 320,
    y = Math.floor(i / 4) * 220;
  b.fillStyle = i % 2 ? "#e5edf0" : "#12382c";
  b.fillRect(x, y, 320, 220);
  drawCierreiaV2(
    b,
    image,
    sampleCierreiaV2(name, frame / CIERREIA_V2_CLIPS[name].fps),
    { x: x + 70, y, size: 190 },
  );
  b.fillStyle = i % 2 ? "#12382c" : "#f2d491";
  b.font = "16px sans-serif";
  b.textAlign = "center";
  b.fillText(label, x + 160, y + 208);
}
await fs.writeFile(
  `${folder}/poses-v2-contacto.webp`,
  await board.encode("webp", 90),
);
const contact = createCanvas(8 * 160, 9 * 180),
  cc = contact.getContext("2d");
const gif = new GifEncoder(192, 192, { repeat: 1, quality: 10 });
for (let i = 0; i < 72; i++) {
  const canvas = createCanvas(192, 192),
    ctx = canvas.getContext("2d"),
    sample = sampleCierreiaV2("victory", i / 24);
  drawCierreiaV2(ctx, image, sample, { size: 192 });
  const x = (i % 8) * 160,
    y = Math.floor(i / 8) * 180;
  cc.fillStyle = i % 2 ? "#e5edf0" : "#12382c";
  cc.fillRect(x, y, 160, 180);
  cc.drawImage(canvas, x, y, 160, 160);
  cc.fillStyle = i % 2 ? "#12382c" : "#f2d491";
  cc.font = "11px sans-serif";
  cc.fillText(`${i + 1} · ${sample.phase}`, x + 5, y + 173);
  ctx.globalCompositeOperation = "destination-over";
  ctx.fillStyle = "#12382c";
  ctx.fillRect(0, 0, 192, 192);
  gif.addFrame(Buffer.from(ctx.getImageData(0, 0, 192, 192).data), 192, 192, {
    delay: (Math.round(((i + 1) * 100) / 24) - Math.round((i * 100) / 24)) * 10,
  });
}
await fs.writeFile(
  `${folder}/celebracion-v2-contacto.webp`,
  await contact.encode("webp", 88),
);
await fs.writeFile(`${folder}/celebracion-v2.gif`, gif.finish());
console.log("Review poses and complete 3 second celebration exported");

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { createSpriteLayout, inspectFramePixels, validateFrameRects } from "../src/game/spriteLayout.js";

// Geometric extraction only: never remove white pixels, retouch contours,
// change the generated alpha, or turn eight key poses into a finished clip.
export async function buildPoseSheet(manifestPath) {
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  const folder = path.dirname(path.resolve(manifestPath));
  const original = await fs.readFile(path.resolve(folder, manifest.source.image));
  const image = await loadImage(original);
  if (image.width !== manifest.source.width || image.height !== manifest.source.height)
    throw new Error("Source dimensions changed: review extraction rectangles first");
  validateFrameRects([manifest.source], manifest.frames);
  const layout = createSpriteLayout(manifest.frames.map((f) => f.name), manifest.output);
  const source = createCanvas(image.width, image.height);
  const sourceCtx = source.getContext("2d");
  sourceCtx.drawImage(image, 0, 0);
  const pages = layout.pages.map((p) => createCanvas(p.width, p.height));
  const extracted = [];
  const frames = Object.create(null);
  // Check every cell before writing any files.
  for (let i = 0; i < manifest.frames.length; i++) {
    const frame = manifest.frames[i];
    const pixels = sourceCtx.getImageData(frame.x, frame.y, frame.w, frame.h).data;
    const inspection = inspectFramePixels(pixels, frame.w, frame.h);
    if (inspection.occupied < Math.max(16, frame.w * frame.h * 0.005))
      throw new Error(`${frame.name}: empty or incomplete source cell`);
    if (inspection.edgePixels)
      throw new Error(`${frame.name}: source contour touches extraction edge`);
    const target = layout.frames[i];
    const canvas = createCanvas(target.w, target.h);
    const ctx = canvas.getContext("2d");
    const ratio = Math.min(target.w / frame.w, target.h / frame.h);
    const w = frame.w * ratio, h = frame.h * ratio;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, frame.x, frame.y, frame.w, frame.h, (target.w - w) / 2, (target.h - h) / 2, w, h);
    pages[target.page].getContext("2d").drawImage(canvas, target.x, target.y);
    frames[frame.name] = {
      page: target.page, x: target.x, y: target.y, w: target.w, h: target.h,
      source: { x: frame.x, y: frame.y, w: frame.w, h: frame.h },
      inspection,
    };
    extracted.push({ name: frame.name, label: frame.label, canvas });
  }

  const output = path.resolve(folder, manifest.output.directory);
  // Each panel shows the same pose at actual 160px and enlarged 320px sizes.
  // Both sit on flat backdrops to expose matte/fringe problems visually.
  const columns = Math.min(4, extracted.length), panelW = 360, panelH = 568;
  const contact = createCanvas(columns * panelW, Math.ceil(extracted.length / columns) * panelH);
  const ctx = contact.getContext("2d");
  ctx.textAlign = "center";
  for (let i = 0; i < extracted.length; i++) {
    const item = extracted[i], x = (i % columns) * panelW, y = Math.floor(i / columns) * panelH;
    ctx.fillStyle = "#102d36";
    ctx.fillRect(x, y, panelW, 212);
    ctx.drawImage(item.canvas, x + (panelW - 160) / 2, y + 4, 160, 160);
    ctx.fillStyle = "#c5e1e7";
    ctx.font = "16px sans-serif";
    ctx.fillText(`${String(i + 1).padStart(2, "0")} · ${item.label} · 160 px`, x + panelW / 2, y + 190);
    ctx.fillStyle = "#e9eef0";
    ctx.fillRect(x, y + 212, panelW, panelH - 212);
    ctx.drawImage(item.canvas, x + 20, y + 216, 320, 320);
    ctx.fillStyle = "#203944";
    ctx.fillText("320 px · revisión de bordes", x + panelW / 2, y + 553);
  }
  const metadata = {
    schemaVersion: 2,
    kind: "key-poses",
    character: manifest.character,
    productionReady: false,
    reviewNotes: manifest.reviewNotes || [],
    source: path.relative(output, path.resolve(folder, manifest.source.image)).split(path.sep).join("/"),
    sourceManifest: path.relative(output, path.resolve(manifestPath)).split(path.sep).join("/"),
    sourceSha256: crypto.createHash("sha256").update(original).digest("hex"),
    pages: layout.pages.map((p, i) => ({ image: `poses-page-${i + 1}.png`, ...p })),
    grid: manifest.output,
    frames,
  };
  await fs.mkdir(output, { recursive: true });
  await fs.mkdir(path.join(output, "frames"), { recursive: true });
  for (const item of extracted)
    await fs.writeFile(path.join(output, "frames", `${item.name}.png`), await item.canvas.encode("png"));
  for (let i = 0; i < pages.length; i++)
    await fs.writeFile(path.join(output, metadata.pages[i].image), await pages[i].encode("png"));
  await fs.writeFile(path.join(output, "contacto.webp"), await contact.encode("webp", 94));
  await fs.writeFile(path.join(output, "poses.json"), JSON.stringify(metadata, null, 2) + "\n");
  return { output, poses: extracted.length, pages: pages.length, productionReady: false };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  if (!process.argv[2]) throw new Error("Usage: node scripts/build-pose-sheet.mjs path/to/manifest.json");
  console.log(JSON.stringify(await buildPoseSheet(process.argv[2])));
}

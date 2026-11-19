import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { createSpriteLayout, inspectFramePixels, validateFrameRects } from "../src/game/spriteLayout.js";
import { buildPoseSheet } from "../scripts/build-pose-sheet.mjs";

const names = (count) => Array.from({ length: count }, (_, i) => `frame_${i}`);

test("48-frame 7x7 sequence omits the spare cell and uses integer source rectangles", () => {
  const layout = createSpriteLayout(names(48), { columns: 7, rows: 7, cellWidth: 160 });
  assert.deepEqual(layout.pages, [{ width: 1120, height: 1120 }]);
  assert.equal(layout.frames.length, 48);
  assert.deepEqual(layout.frames[47], { name: "frame_47", page: 0, x: 800, y: 960, w: 160, h: 160 });
});

test("packing spans pages, supports nonsquare cells, margins and gaps", () => {
  const layout = createSpriteLayout(names(72), {
    columns: 7, rows: 7, cellWidth: 128, cellHeight: 160,
    marginX: 4, marginY: 8, spacingX: 2, spacingY: 3,
  });
  assert.equal(layout.pages.length, 2);
  assert.deepEqual(layout.pages[0], { width: 916, height: 1154 });
  assert.deepEqual(layout.frames[49], { name: "frame_49", page: 1, x: 4, y: 8, w: 128, h: 160 });
  assert.equal(layout.frames[71].page, 1);
  assert.equal(createSpriteLayout(names(72), { columns: 8, cellWidth: 160 }).pages[0].height, 1440);
});

test("explicit source rectangles reject fractional geometry, overlaps and missing pages", () => {
  const pages = [{ width: 1774, height: 887 }];
  const rect = { name: "idle", page: 0, x: 0, y: 0, w: 444, h: 444 };
  assert.equal(validateFrameRects(pages, [rect]).length, 1);
  for (const change of [{ x: -1 }, { w: 443.5 }, { h: 0 }, { page: 1 }, { x: 1600 }, { y: NaN }])
    assert.throws(() => validateFrameRects(pages, [{ ...rect, ...change }]));
  assert.throws(() => validateFrameRects(pages, [rect, { ...rect, name: "aim", x: 443 }]), /overlaps/);
  assert.throws(() => validateFrameRects(pages, [rect, { ...rect, x: 444 }]), /unique/);
  assert.throws(() => validateFrameRects(pages, [{ ...rect, name: "../outside" }]), /safe name/);
  assert.throws(() => createSpriteLayout(names(8), { columns: 0, cellWidth: 160 }));
  assert.throws(() => createSpriteLayout(names(8), { columns: 4, cellWidth: 160, spacingX: -1 }));
});

test("pixel review distinguishes opaque white artwork, empty cells and cropped contours", () => {
  const canvas = createCanvas(16, 16), ctx = canvas.getContext("2d");
  const inspect = () => inspectFramePixels(ctx.getImageData(0, 0, 16, 16).data, 16, 16);
  assert.deepEqual(inspect(), { occupied: 0, edgePixels: 0, bounds: null });
  ctx.fillStyle = "white";
  ctx.fillRect(4, 4, 8, 8);
  assert.deepEqual(inspect(), { occupied: 64, edgePixels: 0, bounds: { x: 4, y: 4, w: 8, h: 8 } });
  ctx.fillRect(0, 4, 2, 8);
  assert.equal(inspect().edgePixels, 16);
});

test("exporter preserves alpha and white fingers, checks sources, and does not claim finished animation", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "guardian-poses-"));
  try {
    const canvas = createCanvas(64, 32), ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(8, 8, 16, 16);
    ctx.fillStyle = "#2184d4";
    ctx.fillRect(40, 8, 16, 16);
    const bytes = await canvas.encode("png");
    await fs.writeFile(path.join(directory, "source.png"), bytes);
    const manifest = {
      character: "fixture",
      source: { image: "source.png", width: 64, height: 32 },
      output: { directory: "out", columns: 1, rows: 1, cellWidth: 32 },
      frames: [
        { name: "idle", label: "Reposo", page: 0, x: 0, y: 0, w: 32, h: 32 },
        { name: "aim", label: "Apuntado", page: 0, x: 32, y: 0, w: 32, h: 32 },
      ],
    };
    const manifestPath = path.join(directory, "manifest.json");
    const save = () => fs.writeFile(manifestPath, JSON.stringify(manifest));
    await save();
    assert.equal((await buildPoseSheet(manifestPath)).pages, 2);
    const metadata = JSON.parse(await fs.readFile(path.join(directory, "out", "poses.json")));
    assert.equal(metadata.productionReady, false);
    assert.equal(metadata.kind, "key-poses");
    assert.equal(metadata.sourceSha256, crypto.createHash("sha256").update(bytes).digest("hex"));
    const exported = await loadImage(path.join(directory, "out", "frames", "idle.png"));
    const target = createCanvas(32, 32), targetCtx = target.getContext("2d");
    targetCtx.drawImage(exported, 0, 0);
    assert.deepEqual([...targetCtx.getImageData(16, 16, 1, 1).data], [255, 255, 255, 255]);
    assert.equal(targetCtx.getImageData(0, 0, 1, 1).data[3], 0);
    assert.equal((await loadImage(path.join(directory, "out", "poses-page-2.png"))).width, 32);
    manifest.source.width = 65;
    await save();
    await assert.rejects(buildPoseSheet(manifestPath), /dimensions changed/);
    manifest.source.width = 64;
    manifest.frames[0].x = 8;
    manifest.frames[0].w = 16;
    await save();
    await assert.rejects(buildPoseSheet(manifestPath), /contour touches/);
    manifest.frames[0] = { ...manifest.frames[0], x: 0, y: 0, w: 4, h: 4 };
    await save();
    await assert.rejects(buildPoseSheet(manifestPath), /empty or incomplete/);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("TecnoIA draft extraction matches the versioned source and all eight exported poses", async () => {
  const folder = "design/characters/tecnoia";
  const manifest = JSON.parse(await fs.readFile(`${folder}/poses-v2-borrador-02.manifest.json`));
  const metadata = JSON.parse(await fs.readFile(`${folder}/${manifest.output.directory}/poses.json`));
  const source = await fs.readFile(`${folder}/${manifest.source.image}`);
  assert.equal(metadata.sourceSha256, crypto.createHash("sha256").update(source).digest("hex"));
  assert.equal(Object.keys(metadata.frames).length, 8);
  assert.equal(metadata.productionReady, false);
  validateFrameRects(metadata.pages, Object.entries(metadata.frames).map(([name, f]) => ({ name, ...f })));
  for (const frame of manifest.frames) {
    const exported = await loadImage(`${folder}/${manifest.output.directory}/frames/${frame.name}.png`);
    assert.equal(exported.width, 320);
    assert.equal(exported.height, 320);
    assert.equal(metadata.frames[frame.name].inspection.edgePixels, 0);
  }
});

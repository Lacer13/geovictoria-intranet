import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { cutoutBackground } from "../scripts/tecnoia-v2-art.mjs";
import { sampleTecnoiaV2, tecnoiaV2Muzzle, TECNOIA_V2_PARTS } from "../src/game/tecnoiaV2.js";
import { inspectFramePixels } from "../src/game/spriteLayout.js";
import { atlasFrame, drawAtlasFrame, validateAnimationAtlas } from "../src/game/spriteAtlas.js";

const folder = "design/characters/tecnoia";
const output = `${folder}/revision-v2-secuencias-01`;
const metadata = async () => JSON.parse(await fs.readFile(`${output}/secuencias.json`));

test("local alpha cleanup removes only connected backdrop and preserves white fingers, dark joints and enclosed colors", () => {
  const canvas = createCanvas(20, 20), ctx = canvas.getContext("2d");
  ctx.fillStyle = "rgb(212,223,231)"; ctx.fillRect(0, 0, 20, 20);
  ctx.fillStyle = "white"; ctx.fillRect(4, 4, 12, 12);
  ctx.fillStyle = "black"; ctx.fillRect(7, 7, 6, 6);
  ctx.fillStyle = "rgb(212,223,231)"; ctx.fillRect(9, 9, 2, 2);
  const original = ctx.getImageData(0, 0, 20, 20).data;
  const cleaned = cutoutBackground(original, 20, 20);
  const pixel = (x, y) => [...cleaned.slice((y * 20 + x) * 4, (y * 20 + x) * 4 + 4)];
  assert.equal(pixel(0, 0)[3], 0);
  assert.deepEqual(pixel(5, 5), [255, 255, 255, 255]);
  assert.deepEqual(pixel(7, 7), [0, 0, 0, 255]);
  assert.deepEqual(pixel(9, 9), [212, 223, 231, 255]);
  for (let i = 0; i < cleaned.length; i++) if (i % 4 !== 3) assert.equal(cleaned[i], original[i]);
  assert.throws(() => cutoutBackground(original, 19, 20), /dimensions/);
});

test("cleaned source rectangles have nonempty content, intact margins and the expected source checksum", async () => {
  const image = await loadImage(`${folder}/rig-v2-alpha-local.png`);
  const canvas = createCanvas(image.width, image.height), ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  for (const [name, [x, y, w, h]] of Object.entries(TECNOIA_V2_PARTS)) {
    const review = inspectFramePixels(ctx.getImageData(x, y, w, h).data, w, h);
    assert.equal(review.edgePixels, 0, name);
    assert.ok(review.occupied > 2000, name);
  }
  const provenance = JSON.parse(await fs.readFile(`${folder}/rig-v2-parts.json`));
  const source = await fs.readFile(`${folder}/rig-v2-fuente-opaca.png`);
  assert.equal(provenance.sourceSha256, crypto.createHash("sha256").update(source).digest("hex"));
  assert.deepEqual(provenance.parts, TECNOIA_V2_PARTS);
});

test("celebration ends in rest, holds without looping and supplies a recognizable reduced-motion victory pose", () => {
  const start = sampleTecnoiaV2("victory", 0), end = sampleTecnoiaV2("victory", 2.5);
  assert.equal(start.hand, "aim");
  assert.equal(end.hand, "rest");
  assert.equal(end.head, "headIdle");
  assert.deepEqual(sampleTecnoiaV2("victory", 500), end);
  assert.deepEqual(sampleTecnoiaV2("victory", -5), start);
  const reduced = sampleTecnoiaV2("victory", 0, true);
  assert.equal(reduced.head, "headJoy");
  assert.equal(reduced.hand, "waveOpen");
  assert.deepEqual(sampleTecnoiaV2("victory", 500, true), reduced);
  assert.deepEqual([...new Set(Array.from({ length: 60 }, (_, i) => sampleTecnoiaV2("victory", i / 24).phase))],
    ["entrada", "gesto", "saludo", "remate", "salida", "reposo"]);
});

test("shooting starts at emission immediately, recoils and recovers without moving its muzzle direction", () => {
  const first = sampleTecnoiaV2("shooting", 0);
  assert.equal(first.flash, true);
  assert.equal(first.phase, "emisión");
  assert.equal(sampleTecnoiaV2("shooting", 2 / 60).hand, "recoil");
  assert.equal(sampleTecnoiaV2("shooting", 0.2).hand, "aim");
  assert.equal(sampleTecnoiaV2("shooting", 0, true).flash, false);
  assert.ok(tecnoiaV2Muzzle(sampleTecnoiaV2("shooting", 2 / 60)).x < tecnoiaV2Muzzle(first).x - 5);
  for (let i = 0; i < 12; i++) {
    const muzzle = tecnoiaV2Muzzle(sampleTecnoiaV2("shooting", i / 60));
    assert.equal(muzzle.dx, 1); assert.equal(muzzle.dy, 0);
  }
  assert.equal(tecnoiaV2Muzzle(sampleTecnoiaV2("victory", 1)), null);
});

test("variable-page atlas selects all 72 actual sprites, preserves margins and locates cyan muzzle pixels", async () => {
  const atlas = validateAnimationAtlas(await metadata());
  assert.equal(atlas.kind, "animation-study"); assert.equal(atlas.productionReady, false);
  assert.equal(Object.keys(atlas.frames).length, 72);
  const source = await fs.readFile(`${folder}/rig-v2-alpha-local.png`);
  assert.equal(atlas.sourceSha256, crypto.createHash("sha256").update(source).digest("hex"));
  const pages = await Promise.all(atlas.pages.map((p) => loadImage(`${output}/${p.image}`)));
  const canvas = createCanvas(320, 320), ctx = canvas.getContext("2d");
  for (const [name, clip] of Object.entries(atlas.clips)) for (let i = 0; i < clip.frames.length; i++) {
    ctx.clearRect(0, 0, 320, 320);
    const frame = drawAtlasFrame(ctx, pages, atlas, name, i / clip.fps);
    assert.equal(frame.index, i);
    assert.equal(inspectFramePixels(ctx.getImageData(0, 0, 320, 320).data, 320, 320, { edge: 3 }).edgePixels, 0);
    if (frame.anchors.muzzle) {
      const muzzle = frame.anchors.muzzle;
      const pixels = ctx.getImageData(Math.floor(muzzle.x) - 3, Math.floor(muzzle.y) - 3, 7, 7).data;
      let cyan = 0;
      for (let p = 0; p < pixels.length; p += 4)
        if (pixels[p] < 150 && pixels[p + 1] > 150 && pixels[p + 2] > 180 && pixels[p + 3] > 180) cyan++;
      assert.ok(cyan > 0, `${name}/${i}: anchor misses the illustrated muzzle`);
    }
  }
  assert.equal(atlasFrame(atlas, "victory", 100).index, 59);
  assert.equal(atlasFrame(atlas, "victory", 100, true).index, 33);
  assert.equal(atlasFrame(atlas, "shooting", NaN).index, 0);
  assert.throws(() => drawAtlasFrame(ctx, [], atlas, "victory", 0), /unavailable/);
  const bad = structuredClone(atlas); bad.clips.victory.frames[0] = "absent";
  assert.throws(() => validateAnimationAtlas(bad), /missing frame/);
  bad.clips.victory.frames[0] = atlas.clips.victory.frames[0];
  bad.frames.shooting_00.anchors.muzzle.x = 500;
  assert.throws(() => validateAnimationAtlas(bad), /anchor/);
});

test("GIF artifacts contain complete sequences and retain intended total timing despite centisecond precision", async () => {
  for (const [name, frames, centiseconds] of [["victory", 60, 250], ["shooting", 12, 20], ["disparo-demostracion", 72, 120]]) {
    const data = await fs.readFile(`${output}/${name}.gif`);
    assert.match(data.subarray(0, 6).toString(), /^GIF8[79]a$/);
    let offset = 13 + (data[10] & 128 ? 3 * (2 ** ((data[10] & 7) + 1)) : 0), count = 0, duration = 0;
    const skipBlocks = () => { while (data[offset]) offset += data[offset] + 1; offset++; };
    while (offset < data.length && data[offset] !== 0x3b) {
      if (data[offset] === 0x21) {
        const type = data[offset + 1]; offset += 2;
        if (type === 0xf9) duration += data.readUInt16LE(offset + 2);
        skipBlocks();
      } else if (data[offset] === 0x2c) {
        const packed = data[offset + 9]; offset += 10;
        if (packed & 128) offset += 3 * (2 ** ((packed & 7) + 1));
        offset++; skipBlocks(); count++;
      } else assert.fail(`Unexpected GIF block ${data[offset]}`);
    }
    assert.equal(count, frames, name); assert.equal(duration, centiseconds, name);
  }
});

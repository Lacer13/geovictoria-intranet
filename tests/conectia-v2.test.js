import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { cutoutConectiaBackground } from "../scripts/conectia-v2-art.mjs";
import { CONECTIA_V2_CLIPS, CONECTIA_V2_PARTS, sampleConectiaV2, conectiaV2Muzzle } from "../src/game/conectiaV2.js";
import { createGame, stepGame, emptyInput, STEP_MS } from "../src/game/simulation.js";
import { validateAnimationAtlas, drawAtlasFrame, atlasFrame } from "../src/game/spriteAtlas.js";
import { inspectFramePixels } from "../src/game/spriteLayout.js";

const folder = "design/characters/conectia", output = `${folder}/revision-v2-secuencias-01`;
const metadata = async () => JSON.parse(await fs.readFile(`${output}/secuencias.json`, "utf8"));

test("ConectIA alpha removes the reviewed loop hole without deleting enclosed colors, white palms or dark joints", () => {
  const c = createCanvas(24, 24), ctx = c.getContext("2d");
  ctx.fillStyle = "rgb(203,219,230)"; ctx.fillRect(0, 0, 24, 24);
  ctx.fillStyle = "white"; ctx.fillRect(3, 3, 18, 18);
  ctx.fillStyle = "black"; ctx.fillRect(6, 6, 12, 12);
  ctx.fillStyle = "rgb(203,219,230)"; ctx.fillRect(8, 8, 2, 2); ctx.fillRect(14, 14, 2, 2);
  const original = ctx.getImageData(0, 0, 24, 24).data;
  const cleaned = cutoutConectiaBackground(original, 24, 24, { seeds: [[8, 8]] });
  const pixel = (x, y) => [...cleaned.slice((y * 24 + x) * 4, (y * 24 + x) * 4 + 4)];
  assert.equal(pixel(0, 0)[3], 0); assert.equal(pixel(8, 8)[3], 0);
  assert.deepEqual(pixel(14, 14), [203, 219, 230, 255]);
  assert.deepEqual(pixel(4, 4), [255, 255, 255, 255]); assert.deepEqual(pixel(6, 6), [0, 0, 0, 255]);
  for (let i = 0; i < cleaned.length; i++) if (i % 4 !== 3) assert.equal(cleaned[i], original[i]);
  assert.throws(() => cutoutConectiaBackground(original, 24, 24, { seeds: [[6, 6]] }), /Seed/);
  assert.throws(() => cutoutConectiaBackground(original, 24, 24, { seeds: [[-1, 0]] }), /seed/);
});

test("ConectIA source keeps nine complete parts and traces the opaque source and enclosed-hole cleanup", async () => {
  const provenance = JSON.parse(await fs.readFile(`${folder}/rig-v2-parts.json`));
  assert.equal(provenance.sourceSha256, crypto.createHash("sha256").update(await fs.readFile(`${folder}/rig-v2-fuente-opaca.png`)).digest("hex"));
  assert.deepEqual(provenance.parts, CONECTIA_V2_PARTS);
  const image = await loadImage(`${folder}/rig-v2-alpha-local.png`), c = createCanvas(image.width, image.height), ctx = c.getContext("2d");
  ctx.drawImage(image, 0, 0);
  for (const [name, [x, y, w, h]] of Object.entries(CONECTIA_V2_PARTS)) {
    const inspection = inspectFramePixels(ctx.getImageData(x, y, w, h).data, w, h, { edge: 3 });
    assert.equal(inspection.edgePixels, 0, name); assert.ok(inspection.occupied > 2000, name);
  }
  assert.equal(ctx.getImageData(204, 470, 1, 1).data[3], 0, "beacon hole must be transparent");
  assert.equal(ctx.getImageData(640, 1040, 1, 1).data[3], 255, "thumbs-up palm stays opaque");
});

test("ConectIA study normal and burst timings match actual accepted volleys, including return to normal after the power", () => {
  const s = createGame("conectia"), events = [];
  for (let i = 0; i < 216; i++) {
    stepGame(s, { ...emptyInput(), fire: true, power: i === 0 }, { random: () => 0.99 });
    for (const event of s.events.splice(0)) if (event.type === "shot") events.push(event);
  }
  const intervals = events.slice(1).map((event, i) => event.tick - events[i].tick);
  const burstSteps = CONECTIA_V2_CLIPS.burst.duration * 1000 / STEP_MS;
  const normalSteps = CONECTIA_V2_CLIPS.shooting.duration * 1000 / STEP_MS;
  assert.equal(burstSteps, 6); assert.equal(normalSteps, 12);
  assert.deepEqual(intervals.slice(0, 29), Array(29).fill(burstSteps));
  assert.equal(intervals.at(-1), normalSteps);
  for (const name of ["shooting", "burst"]) {
    assert.equal(sampleConectiaV2(name, 0).phase, "emisión");
    assert.equal(sampleConectiaV2(name, CONECTIA_V2_CLIPS[name].duration).hand, "aim");
    assert.equal(sampleConectiaV2(name, 0, true).flash, false);
    for (let i = 0; i < CONECTIA_V2_CLIPS[name].frames; i++) {
      const sample = sampleConectiaV2(name, i / 60), muzzle = conectiaV2Muzzle(sample);
      assert.equal(muzzle.dx, 1); assert.equal(muzzle.dy, 0); assert.equal(sample.handAngle, 0);
    }
  }
});

test("ConectIA celebration has an identifiable thumbs-up, holds final rest, and reduced motion stays still", () => {
  const end = sampleConectiaV2("victory", 3);
  assert.equal(end.head, "headIdle"); assert.equal(end.hand, "rest"); assert.equal(end.phase, "reposo");
  assert.deepEqual(sampleConectiaV2("victory", 999), end);
  const reduced = sampleConectiaV2("victory", 0, true);
  assert.equal(reduced.head, "headJoy"); assert.equal(reduced.hand, "thumbsUp"); assert.equal(conectiaV2Muzzle(reduced), null);
  assert.deepEqual(sampleConectiaV2("victory", 999, true), reduced);
  assert.equal(sampleConectiaV2("victory", 22 / 24).hand, "wave");
  assert.ok(sampleConectiaV2("victory", 22 / 24).toolY < end.toolY - 50);
});

test("ConectIA exported study reads all 90 sprites with complete margins and cyan muzzle anchors", async () => {
  const atlas = validateAnimationAtlas(await metadata());
  assert.equal(atlas.kind, "animation-study"); assert.equal(atlas.productionReady, false);
  assert.equal(Object.keys(atlas.frames).length, 90);
  assert.equal(atlas.sourceSha256, crypto.createHash("sha256").update(await fs.readFile(`${folder}/rig-v2-alpha-local.png`)).digest("hex"));
  const pages = await Promise.all(atlas.pages.map(page => loadImage(`${output}/${page.image}`)));
  const c = createCanvas(320, 320), ctx = c.getContext("2d");
  for (const [name, clip] of Object.entries(atlas.clips)) for (let i = 0; i < clip.frames.length; i++) {
    ctx.clearRect(0, 0, 320, 320);
    const frame = drawAtlasFrame(ctx, pages, atlas, name, i / clip.fps);
    const inspection = inspectFramePixels(ctx.getImageData(0, 0, 320, 320).data, 320, 320, { edge: 3 });
    assert.equal(inspection.edgePixels, 0, `${name}/${i}`); assert.ok(inspection.occupied > 5000);
    if (frame.anchors.muzzle) {
      const { x, y } = frame.anchors.muzzle, pixel = ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data;
      assert.ok(pixel[1] > 130 && pixel[2] > 140 && pixel[3] > 240, `${name}/${i}: cyan muzzle`);
    }
  }
  assert.equal(atlasFrame(atlas, "victory", 999).name, "victory_71");
});

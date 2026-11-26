import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import {
  CIERREIA_V2_PARTS,
  CIERREIA_V2_CLIPS,
  sampleCierreiaV2,
  drawCierreiaV2,
  cierreiaV2Muzzle,
} from "../src/game/cierreiaV2.js";
import {
  sampleCierreiaGameplay,
  gameplayMuzzle,
  cierreiaPresentation,
} from "../src/game/cierreiaGameplay.js";
import { createGame, stepGame, emptyInput } from "../src/game/simulation.js";
import { basicShotOrigin, consumeGameEvents } from "../src/game/emission.js";
import {
  createAnimator,
  capturePositions,
  interpolateScene,
} from "../src/game/animation.js";
import { validateAnimationAtlas, atlasFrame } from "../src/game/spriteAtlas.js";
import { inspectFramePixels } from "../src/game/spriteLayout.js";
import { drawCharacter } from "../src/game/render.js";
import {
  AREA_CHARACTERS,
  ASSET_SOURCES,
  loadAssets,
} from "../src/game/characters.js";
const folder = "design/characters/cierreia";
const meta = async () =>
  JSON.parse(
    await fs.readFile("public/characters/cierreia/sprites-v2.json", "utf8"),
  );
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`);
const tick = (s, input = {}) =>
  stepGame(s, { ...emptyInput(), ...input }, { random: () => 0.99 });

test("CierreIA source keeps complete head and hands with clean margins and traceable local alpha", async () => {
  const source = await fs.readFile(`${folder}/rig-v2-fuente-opaca.png`),
    provenance = JSON.parse(await fs.readFile(`${folder}/rig-v2-parts.json`));
  assert.equal(
    provenance.sourceSha256,
    crypto.createHash("sha256").update(source).digest("hex"),
  );
  assert.deepEqual(provenance.parts, CIERREIA_V2_PARTS);
  const image = await loadImage(`${folder}/rig-v2-alpha-local.png`),
    canvas = createCanvas(1254, 1254),
    ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  for (const [name, r] of Object.entries(CIERREIA_V2_PARTS)) {
    const review = inspectFramePixels(ctx.getImageData(...r).data, r[2], r[3], {
      edge: 2,
    });
    assert.equal(review.edgePixels, 0, name);
    assert.ok(review.occupied > 2000, name);
  }
  for (const [x, y] of provenance.seeds)
    assert.equal(ctx.getImageData(x, y, 1, 1).data[3], 0);
  assert.ok(
    ctx.getImageData(185, 1010, 1, 1).data[3] > 200,
    "white palm stays opaque",
  );
});
test("all 233 CierreIA frames keep margins, complete clips and a coherent source", async () => {
  const atlas = validateAnimationAtlas(await meta());
  assert.equal(Object.keys(atlas.frames).length, 233);
  assert.equal(atlas.character, "cierreia");
  assert.equal(
    atlas.sourceSha256,
    crypto
      .createHash("sha256")
      .update(await fs.readFile(`${folder}/rig-v2-alpha-local.png`))
      .digest("hex"),
  );
  assert.equal(atlas.clips.closing.frames.length, 18);
  assert.equal(atlas.clips.victory.frames.length, 72);
  const pages = await Promise.all(
    atlas.pages.map((p) => loadImage("public/characters/cierreia/" + p.image)),
  );
  for (const [name, f] of Object.entries(atlas.frames)) {
    const c = createCanvas(f.w, f.h),
      ctx = c.getContext("2d");
    ctx.drawImage(pages[f.page], f.x, f.y, f.w, f.h, 0, 0, f.w, f.h);
    const check = inspectFramePixels(
      ctx.getImageData(0, 0, f.w, f.h).data,
      f.w,
      f.h,
      { edge: 2 },
    );
    assert.equal(check.edgePixels, 0, name);
    assert.ok(check.occupied > 1800, name);
  }
  const reduced = atlasFrame(atlas, "closing", 0, true);
  assert.ok(reduced.anchors.muzzle);
});
test("CierreIA normal and Gran cierre muzzles match the existing physical origins without changing the power", () => {
  const state = createGame("cierreia", { animationVersion: 2 });
  tick(state, { power: true });
  const e = state.events.find((e) => e.kind === "closing");
  assert.ok(e);
  const p = state.player;
  const normal = gameplayMuzzle(p, sampleCierreiaV2("shooting", 0));
  close(normal.x, basicShotOrigin(p).x);
  close(normal.y, basicShotOrigin(p).y);
  const special = gameplayMuzzle(p, sampleCierreiaV2("closing", 0));
  close(special.x, e.origin.x);
  close(special.y, e.origin.y);
  assert.equal(state.bullets[0].damage, 4);
  assert.equal(state.bullets[0].vx, 14);
  assert.equal(p.powerCooldown, 600);
  assert.ok(sampleCierreiaV2("closing", 0).strong);
  assert.ok(!sampleCierreiaV2("shooting", 0).strong);
});
test("power, damage and movement compose with each accepted shot and preserve horizontal aim", () => {
  const state = createGame("cierreia", { animationVersion: 2 }),
    actor = createAnimator();
  tick(state, { power: true });
  assert.equal(cierreiaPresentation(state, actor).shotClip, "closing");
  tick(state, { fire: true });
  const view = cierreiaPresentation(state, actor, 0.8);
  assert.equal(view.shotClip, "shooting");
  const next = cierreiaPresentation(state, actor, 0);
  assert.ok(next.shotElapsed >= view.shotElapsed);
  for (const pose of ["moving", "damage", "power", "dash"])
    for (const reduced of [false, true]) {
      const s = sampleCierreiaGameplay(pose, 0.04, reduced, {
        shotElapsed: 0,
        shotClip: "shooting",
        armed: true,
        dx: 1,
        dy: 1,
      });
      assert.equal(s.handAngle, 0);
      const m = cierreiaV2Muzzle(s);
      close(m.x, cierreiaV2Muzzle(sampleCierreiaV2("shooting", 0, reduced)).x);
      close(m.y, cierreiaV2Muzzle(sampleCierreiaV2("shooting", 0, reduced)).y);
    }
  const previous = capturePositions(state);
  tick(state, { fire: true, right: true });
  const scene = interpolateScene(state, previous, 0);
  assert.equal(scene.player.x, previous.get(state.player).x);
});
test("CierreIA celebration has its own deal gesture, resolves once and holds its final rest pose", () => {
  const middle = sampleCierreiaV2("victory", 42 / 24);
  assert.equal(middle.phase, "acuerdo cerrado");
  assert.equal(middle.hand, "thumbsUp");
  assert.ok(middle.toolX > sampleCierreiaV2("victory", 0).toolX);
  assert.deepEqual(
    sampleCierreiaV2("victory", 3),
    sampleCierreiaV2("victory", 100),
  );
  assert.equal(sampleCierreiaV2("victory", 3).hand, "rest");
  assert.ok(!sampleCierreiaV2("shooting", 0, true).flash);
  assert.equal(CIERREIA_V2_CLIPS.victory.duration, 3);
});

test("selected-only loading recovers via rig, atlas or v1 when a page, source or metadata fails", async () => {
  const originalImage = globalThis.Image,
    originalFetch = globalThis.fetch,
    atlas = await meta(),
    requested = [];
  let fail = "",
    badMetadata = false,
    badDimensions = false;
  class FakeImage {
    set src(value) {
      requested.push(value);
      queueMicrotask(() => {
        if (
          (fail === "pages" && value.includes("sprites-v2-")) ||
          (fail === "source" && value.includes("rig-navidad-v2")) ||
          (fail === "all" && value.includes("v2"))
        )
          return this.onerror?.();
        const page = atlas.pages.find((p) => value.endsWith(p.image));
        this.naturalWidth = page
          ? page.width
          : value.includes("sprites-v1")
            ? 3840
            : 1254;
        this.naturalHeight = page
          ? page.height
          : value.includes("sprites-v1")
            ? 1440
            : 1254;
        if (badDimensions && page) this.naturalWidth++;
        this.onload?.();
      });
    }
  }
  globalThis.Image = FakeImage;
  globalThis.fetch = async (url) => {
    requested.push(url);
    const data = structuredClone(atlas);
    if (badMetadata) delete data.frames.shooting_00.anchors.pivot;
    return { ok: true, json: async () => data };
  };
  try {
    const progress = [],
      character = AREA_CHARACTERS.find((c) => c.id === "cierreia");
    let resources = await loadAssets((v) => progress.push(v), character, {
      retry: true,
    });
    assert.equal(resources.animation.version, 2);
    assert.ok(resources.animation.atlas);
    assert.ok(resources.animation.source);
    assert.deepEqual(resources.failed, []);
    assert.equal(progress.at(-1), 1);
    assert.ok(progress.every((v, i) => i === 0 || v >= progress[i - 1]));
    assert.deepEqual(
      new Set(requested),
      new Set([
        ...ASSET_SOURCES,
        character.animation.metadata,
        character.animation.src,
        ...atlas.pages.map((p) => "/characters/cierreia/" + p.image),
      ]),
    );
    fail = "pages";
    resources = await loadAssets(() => {}, character, { retry: true });
    assert.ok(resources.animation.source);
    assert.equal(resources.animation.atlas, null);
    fail = "source";
    resources = await loadAssets(() => {}, character, { retry: true });
    assert.ok(resources.animation.atlas);
    assert.equal(resources.animation.source, null);
    fail = "all";
    resources = await loadAssets(() => {}, character, { retry: true });
    assert.equal(resources.animation, null);
    assert.ok(resources.images[character.src]);
    assert.ok(resources.images[character.sprite]);
    fail = "";
    badMetadata = true;
    resources = await loadAssets(() => {}, character, { retry: true });
    assert.ok(resources.animation.source);
    assert.equal(resources.animation.atlas, null);
    assert.ok(resources.failed.includes(character.animation.metadata));
    badMetadata = false;
    badDimensions = true;
    resources = await loadAssets(() => {}, character, { retry: true });
    assert.ok(resources.animation.source);
    assert.equal(resources.animation.atlas, null);
    assert.ok(resources.failed.length > 0);
  } finally {
    globalThis.Image = originalImage;
    globalThis.fetch = originalFetch;
  }
});

test("a full CierreIA v2 run reaches victory and its result animation holds the final rest pose without advancing rules", async () => {
  const state = createGame("cierreia", { animationVersion: 2 }),
    actor = createAnimator(),
    sounds = [];
  const baseline = createGame("cierreia", { animationVersion: 1 });
  let seed = 8128,
    baselineSeed = 8128;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const baselineRandom = () => {
    baselineSeed = (baselineSeed * 16807) % 2147483647;
    return (baselineSeed - 1) / 2147483646;
  };
  while (state.phase === "playing" && state.tick < 18000) {
    const input = {
      ...emptyInput(),
      fire: true,
      power: state.player.powerCooldown === 0,
    };
    const target =
      state.boss || state.enemies.find((e) => e.x > state.player.x + 150);
    if (target) {
      const desired = target.y + target.height / 2 - 60;
      input.up = state.player.y > desired + 4;
      input.down = state.player.y < desired - 4;
    }
    stepGame(baseline, { ...input }, { random: baselineRandom });
    stepGame(state, input, { random });
    consumeGameEvents(state.events, actor, (event) => sounds.push(event));
  }
  assert.equal(state.phase, "victory");
  assert.equal(baseline.phase, state.phase);
  for (const field of ["score", "tick"])
    assert.equal(state[field], baseline[field]);
  assert.equal(state.player.hp, baseline.player.hp);
  assert.equal(sounds.filter((s) => s === "victory").length, 1);
  assert.equal(sounds.filter((s) => s === "defeat").length, 0);
  const atlas = await meta(),
    pages = await Promise.all(
      atlas.pages.map((p) =>
        loadImage(`public/characters/cierreia/${p.image}`),
      ),
    );
  const canvas = createCanvas(400, 340),
    ctx = canvas.getContext("2d"),
    frozen = structuredClone(state);
  const draw = (time) => {
    ctx.clearRect(0, 0, 400, 340);
    drawCharacter(
      ctx,
      AREA_CHARACTERS.find((c) => c.id === "cierreia"),
      null,
      200,
      170,
      295,
      "victory",
      time,
      false,
      {
        animation: { version: 2, source: null, atlas, pages },
      },
    );
  };
  for (let i = 0; i < 72; i++) draw(i / 24);
  const last = ctx.getImageData(0, 0, 400, 340).data;
  draw(100);
  assert.deepEqual(ctx.getImageData(0, 0, 400, 340).data, last);
  stepGame(state, { ...emptyInput(), fire: true }, { random });
  assert.deepEqual(state, frozen);
});

test("newborn Gran cierre follows the interpolated muzzle when moving and dashing", () => {
  for (const dash of [false, true]) {
    const state = createGame("cierreia", { animationVersion: 2 });
    const previous = capturePositions(state);
    tick(state, { power: true, right: true, down: true, dash });
    const frozen = structuredClone(state);
    const scene = interpolateScene(state, previous, 0);
    const muzzle = gameplayMuzzle(scene.player, sampleCierreiaV2("closing", 0));
    const b = scene.bullets.find((b) => b.damage === 4);
    close(b.x + b.width / 2, muzzle.x);
    close(b.y + b.height / 2, muzzle.y);
    assert.deepEqual(
      interpolateScene(state, previous, 1).bullets,
      state.bullets,
    );
    assert.deepEqual(state, frozen);
  }
});

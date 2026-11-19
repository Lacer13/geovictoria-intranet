import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { createGame, stepGame, emptyInput, createClock } from "../src/game/simulation.js";
import { basicShotOrigin, consumeGameEvents } from "../src/game/emission.js";
import { createAnimator, capturePositions, interpolateScene } from "../src/game/animation.js";
import { sampleTecnoiaGameplay, gameplayMuzzle, tecnoiaPresentation, TECNOIA_GAME_CLIPS } from "../src/game/tecnoiaGameplay.js";
import { validateAnimationAtlas, atlasFrame } from "../src/game/spriteAtlas.js";
import { drawCharacter } from "../src/game/render.js";
import { loadAssets, AREA_CHARACTERS, ASSET_SOURCES } from "../src/game/characters.js";
import { inspectFramePixels } from "../src/game/spriteLayout.js";

const options = { random: () => 0.99 };
const tick = (s, input = {}) => stepGame(s, { ...emptyInput(), ...input }, options);
const meta = async () => JSON.parse(await fs.readFile("public/characters/tecnoia/sprites-v2.json"));
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);

test("each accepted volley has one event, existing physical origins, and unchanged normal/burst cadences", () => {
  for (const mode of ["basic", "dual", "spread", "burst"]) {
    const s = createGame(mode === "burst" ? "conectia" : "tecnoia");
    if (mode === "dual") s.player.dual = 100;
    if (mode === "spread") s.player.spread = 100;
    const events = [];
    for (let i = 0; i < 24; i++) {
      tick(s, { right: true, down: true, fire: true, power: mode === "burst" && i === 0 });
      for (const e of s.events.splice(0)) if (e.type === "shot") {
        events.push(e); assert.deepEqual(e.origin, basicShotOrigin(s.player));
        assert.equal(e.tick, s.tick);
        assert.equal(e.projectiles.length, mode === "spread" ? 3 : mode === "dual" ? 2 : 1);
        for (const b of e.projectiles) {
          assert.equal(b.x, s.player.x + s.player.width - 16);
          assert.equal(b.vx, 13); assert.equal(b.width, 24); assert.equal(b.height, 6);
          if (mode !== "dual") assert.equal(b.y, s.player.y + 60);
        }
      }
    }
    assert.equal(events.length, mode === "burst" ? 4 : 2);
    assert.deepEqual(events.map((e) => e.id), events.map((_, i) => i + 1));
  }
});

test("special and reflected projectiles are recorded once without changing power damage or duplicating sound", () => {
  const closing = createGame("cierreia"), actor = createAnimator(), sounds = [];
  tick(closing, { power: true });
  const event = closing.events.find((e) => e.type === "shot");
  assert.equal(event.kind, "closing"); assert.equal(closing.bullets[0].damage, 4);
  consumeGameEvents(closing.events, actor, (e) => sounds.push(e));
  assert.equal(sounds.filter((e) => e === "power").length, 1);
  assert.equal(sounds.filter((e) => e === "shoot").length, 0);
  const reflect = createGame("aliania");
  reflect.bullets.push({ x: reflect.player.x + 80, y: reflect.player.y + 45, width: 30, height: 8, vx: -7, vy: 0, enemy: true });
  tick(reflect, { power: true });
  assert.equal(reflect.events.filter((e) => e.kind === "reflect").length, 1);
  reflect.events = []; tick(reflect);
  assert.equal(reflect.events.filter((e) => e.kind === "reflect").length, 0);
});

test("newborn normal, dual and spread projectiles start at the interpolated muzzle during movement and dash", () => {
  for (const mode of ["basic", "dual", "spread"]) for (const dash of [false, true]) {
    const s = createGame("tecnoia", { animationVersion: 2 });
    if (mode !== "basic") s.player[mode] = 100;
    const previous = capturePositions(s);
    tick(s, { fire: true, right: true, down: true, dash });
    const frozen = structuredClone(s);
    const start = interpolateScene(s, previous, 0), end = interpolateScene(s, previous, 1);
    const muzzle = gameplayMuzzle(start.player);
    for (const b of start.bullets) { close(b.x + b.width / 2, muzzle.x); close(b.y + b.height / 2, muzzle.y); }
    assert.deepEqual(end.bullets, s.bullets);
    assert.deepEqual(s, frozen);
  }
});

test("render FPS, pause and repeated event delivery cannot add or lose accepted shots or sounds", () => {
  const replays = [];
  for (const fps of [30, 60, 144]) {
    const state = createGame(), clock = createClock(), actor = createAnimator(), sounds = [];
    const ids = [];
    for (let frame = 0; frame <= fps * 6; frame++) {
      clock.advance(frame * 1000 / fps, () => {
        tick(state, { fire: true });
        const accepted = state.events.find((e) => e.type === "shot");
        if (accepted) ids.push(accepted.id);
        consumeGameEvents(state.events, actor, (e) => sounds.push(e));
        if (accepted) consumeGameEvents([accepted], actor, (e) => sounds.push(e));
      });
      tecnoiaPresentation(state, actor, clock.alpha);
    }
    assert.equal(ids.length, 30); assert.equal(sounds.filter((e) => e === "shoot").length, 30);
    const before = tecnoiaPresentation(state, actor, 0.9);
    clock.reset(); clock.advance(600000, () => assert.fail("pause advanced simulation"));
    const after = tecnoiaPresentation(state, actor, 0);
    assert.equal(after.shotElapsed, before.shotElapsed);
    replays.push(ids);
  }
  assert.deepEqual(replays[0], replays[1]); assert.deepEqual(replays[0], replays[2]);
});

test("shooting remains horizontal and shares the emission point while moving, dashing, hurt or using reduced effects", () => {
  const p = createGame().player;
  for (const pose of ["idle", "moving", "dash", "damage", "power"]) for (const reduced of [false, true]) {
    const sample = sampleTecnoiaGameplay(pose, 0.02, reduced, { shotElapsed: 0, armed: true, dx: -1, dy: 1 });
    const muzzle = gameplayMuzzle(p, sample), expected = basicShotOrigin(p);
    close(muzzle.x, expected.x); close(muzzle.y, expected.y);
    assert.equal(muzzle.dx, 1); assert.equal(muzzle.dy, 0);
    assert.equal(sample.flash, !reduced);
  }
  const s = createGame(); s.player.hp = 1;
  s.enemies.push({ x: s.player.x + 16, y: s.player.y + 16, width: 80, height: 80, speed: 0, hp: 1 });
  tick(s, { fire: true });
  assert.equal(s.phase, "gameover");
  assert.equal(tecnoiaPresentation(s, createAnimator()).pose, "defeat");
  const frozen = structuredClone(s); tick(s, { fire: true }); assert.deepEqual(s, frozen);
});

test("all 203 runtime sprites have complete margins, a shared pivot, valid pages and the versioned clean source", async () => {
  const atlas = validateAnimationAtlas(await meta());
  assert.equal(Object.keys(atlas.frames).length, 203); assert.equal(atlas.productionReady, true);
  assert.deepEqual(Object.keys(atlas.clips), Object.keys(TECNOIA_GAME_CLIPS));
  const source = await fs.readFile("public/characters/tecnoia/rig-navidad-v2.png");
  assert.equal(atlas.sourceSha256, crypto.createHash("sha256").update(source).digest("hex"));
  assert.deepEqual(source, await fs.readFile("design/characters/tecnoia/rig-v2-alpha-local.png"));
  for (let i = 0; i < atlas.pages.length; i++) {
    const page = atlas.pages[i], image = await loadImage(`public/characters/tecnoia/${page.image}`);
    assert.equal(image.width, page.width); assert.equal(image.height, page.height);
    const canvas = createCanvas(image.width, image.height), ctx = canvas.getContext("2d"); ctx.drawImage(image, 0, 0);
    for (const frame of Object.values(atlas.frames).filter((f) => f.page === i)) {
      const inspection = inspectFramePixels(ctx.getImageData(frame.x, frame.y, frame.w, frame.h).data, frame.w, frame.h);
      assert.equal(inspection.edgePixels, 0); assert.ok(inspection.occupied > 1800);
    }
  }
  const f = atlasFrame(atlas, "shooting", 0), p = createGame().player;
  close(p.x + p.width / 2 + (f.anchors.muzzle.x - f.anchors.pivot.x) * p.width / f.w, basicShotOrigin(p).x);
  close(p.y + p.height / 2 + (f.anchors.muzzle.y - f.anchors.pivot.y) * p.width / f.w, basicShotOrigin(p).y);
  assert.equal(atlasFrame(atlas, "victory", 100).index, 59);
  const rig = await loadImage("public/characters/tecnoia/rig-navidad-v2.png");
  const canvas = createCanvas(600, 600), ctx = canvas.getContext("2d");
  for (const pose of Object.keys(TECNOIA_GAME_CLIPS))
    assert.doesNotThrow(() => drawCharacter(ctx, AREA_CHARACTERS[0], null, 300, 300, 112, pose, 0.05, false,
      { animation: { version: 2, source: rig, atlas: null }, presentation: { pose, elapsed: 0.05, armed: true, shotElapsed: 0.01 } }));
  ctx.clearRect(0, 0, 600, 600);
  drawCharacter(ctx, AREA_CHARACTERS[0], null, 300, 300, 112, "shooting", 0);
  const cyan = ctx.getImageData(352, 307, 1, 1).data;
  assert.ok(cyan[1] > 180 && cyan[2] > 180 && cyan[3] > 180, "all-image failure must keep a visible emitter at the physical origin");
});

test("selected-only loading recovers via rig, atlas or v1 when a page, source or metadata fails", async () => {
  const originalImage = globalThis.Image, originalFetch = globalThis.fetch, atlas = await meta(), requested = [];
  let fail = "", badMetadata = false, badDimensions = false;
  class FakeImage {
    set src(value) {
      requested.push(value);
      queueMicrotask(() => {
        if (fail === "pages" && value.includes("sprites-v2-") || fail === "source" && value.includes("rig-navidad-v2") || fail === "all" && value.includes("v2")) return this.onerror?.();
        const page = atlas.pages.find((p) => value.endsWith(p.image));
        this.naturalWidth = page ? page.width : value.includes("sprites-v1") ? 3840 : 1254;
        this.naturalHeight = page ? page.height : value.includes("sprites-v1") ? 1440 : 1254;
        if (badDimensions && page) this.naturalWidth++;
        this.onload?.();
      });
    }
  }
  globalThis.Image = FakeImage;
  globalThis.fetch = async (url) => {
    requested.push(url); const data = structuredClone(atlas);
    if (badMetadata) delete data.frames.shooting_00.anchors.pivot;
    return { ok: true, json: async () => data };
  };
  try {
    const progress = [], character = AREA_CHARACTERS[0];
    let resources = await loadAssets((v) => progress.push(v), character, { retry: true });
    assert.equal(resources.animation.version, 2); assert.ok(resources.animation.atlas); assert.ok(resources.animation.source);
    assert.deepEqual(resources.failed, []); assert.equal(progress.at(-1), 1);
    assert.ok(progress.every((v, i) => i === 0 || v >= progress[i - 1]));
    assert.deepEqual(new Set(requested), new Set([...ASSET_SOURCES, character.animation.metadata, character.animation.src,
      ...atlas.pages.map((p) => "/characters/tecnoia/" + p.image)]));
    fail = "pages"; resources = await loadAssets(() => {}, character, { retry: true });
    assert.ok(resources.animation.source); assert.equal(resources.animation.atlas, null);
    fail = "source"; resources = await loadAssets(() => {}, character, { retry: true });
    assert.ok(resources.animation.atlas); assert.equal(resources.animation.source, null);
    fail = "all"; resources = await loadAssets(() => {}, character, { retry: true });
    assert.equal(resources.animation, null); assert.ok(resources.images[character.src]); assert.ok(resources.images[character.sprite]);
    fail = ""; badMetadata = true; resources = await loadAssets(() => {}, character, { retry: true });
    assert.ok(resources.animation.source); assert.equal(resources.animation.atlas, null);
    assert.ok(resources.failed.includes(character.animation.metadata));
    badMetadata = false; badDimensions = true; resources = await loadAssets(() => {}, character, { retry: true });
    assert.ok(resources.animation.source); assert.equal(resources.animation.atlas, null); assert.ok(resources.failed.length > 0);
  } finally { globalThis.Image = originalImage; globalThis.fetch = originalFetch; }
});

test("a full TecnoIA v2 run reaches victory and its result animation holds the final rest pose without advancing rules", async () => {
  const state = createGame("tecnoia", { animationVersion: 2 }), actor = createAnimator(), sounds = [];
  let seed = 8128;
  const random = () => { seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646; };
  while (state.phase === "playing" && state.tick < 18000) {
    const input = { ...emptyInput(), fire: true };
    const target = state.boss || state.enemies.find((e) => e.x > state.player.x + 150);
    if (target) {
      const desired = target.y + target.height / 2 - 60;
      input.up = state.player.y > desired + 4; input.down = state.player.y < desired - 4;
    }
    stepGame(state, input, { random });
    consumeGameEvents(state.events, actor, (event) => sounds.push(event));
  }
  assert.equal(state.phase, "victory"); assert.equal(state.score, 200);
  assert.equal(sounds.filter((s) => s === "victory").length, 1);
  assert.equal(sounds.filter((s) => s === "defeat").length, 0);
  const atlas = await meta(), pages = await Promise.all(atlas.pages.map((p) => loadImage(`public/characters/tecnoia/${p.image}`)));
  const canvas = createCanvas(400, 340), ctx = canvas.getContext("2d"), frozen = structuredClone(state);
  const draw = (time) => {
    ctx.clearRect(0, 0, 400, 340);
    drawCharacter(ctx, AREA_CHARACTERS[0], null, 200, 170, 295, "victory", time, false, {
      animation: { version: 2, source: null, atlas, pages },
    });
  };
  for (let i = 0; i < 60; i++) draw(i / 24);
  const last = ctx.getImageData(0, 0, 400, 340).data;
  draw(100); assert.deepEqual(ctx.getImageData(0, 0, 400, 340).data, last);
  stepGame(state, { ...emptyInput(), fire: true }, { random });
  assert.deepEqual(state, frozen);
});

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { createGame, stepGame, emptyInput } from "../src/game/simulation.js";
import { capturePositions, interpolateScene } from "../src/game/animation.js";
import { enemyMuzzle, enemyPresentation, enemyVisualMotion, ENEMY_ATLAS_URL } from "../src/game/enemyAnimation.js";
import { validateAnimationAtlas, atlasFrame } from "../src/game/spriteAtlas.js";
import { inspectFramePixels } from "../src/game/spriteLayout.js";
import { drawEnemy } from "../src/game/render.js";

const tick = s => stepGame(s, emptyInput(), { random: () => 0.99 });
const meta = async () => JSON.parse(await fs.readFile("public/enemies/desfase/sprites-v1.json"));
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);

test("all 168 enemy sprites retain transparent padding, complete source poses and valid muzzle anchors", async () => {
  const atlas = validateAnimationAtlas(await meta()), image = await loadImage("public" + ENEMY_ATLAS_URL);
  assert.equal(Object.keys(atlas.frames).length, 168);
  assert.equal(crypto.createHash("sha256").update(await fs.readFile(atlas.source)).digest("hex"), atlas.sourceSha256);
  assert.equal(image.width, atlas.pages[0].width); assert.equal(image.height, atlas.pages[0].height);
  const c = createCanvas(192, 192), ctx = c.getContext("2d");
  for (const [name, f] of Object.entries(atlas.frames)) {
    ctx.clearRect(0, 0, 192, 192); ctx.drawImage(image, f.x, f.y, f.w, f.h, 0, 0, 192, 192);
    const review = inspectFramePixels(ctx.getImageData(0, 0, 192, 192).data, 192, 192);
    assert.equal(review.edgePixels, 0, name);
    if (!name.startsWith("defeat")) assert.ok(review.occupied > 3000, name);
  }
  const fire = atlasFrame(atlas, "shooting", 0);
  ctx.clearRect(0, 0, 192, 192); ctx.drawImage(image, fire.x, fire.y, 192, 192, 0, 0, 192, 192);
  const [r, g, b, a] = ctx.getImageData(fire.anchors.muzzle.x, fire.anchors.muzzle.y, 1, 1).data;
  assert.ok(a > 200 && r > g && r > b, "Muzzle is on the visible warm emitter");
});

test("charge, fire, recoil, damage and defeat follow fixed simulation events rather than repaint frequency", () => {
  const s = createGame(); s.score = 100; tick(s);
  s.boss.shot = 31; tick(s); assert.equal(enemyPresentation(s.boss, s.tick, true).pose, "charge");
  for (let i = 0; i < 30; i++) tick(s);
  assert.equal(s.boss.lastShotAt, s.tick); assert.equal(enemyPresentation(s.boss, s.tick, true).pose, "shooting");
  const frozen = structuredClone(s);
  for (let i = 0; i < 144; i++) enemyPresentation(s.boss, s.tick, true);
  assert.deepEqual(s, frozen);
  for (let i = 0; i < 18; i++) tick(s);
  assert.equal(enemyPresentation(s.boss, s.tick, true).pose, "idle");
  s.boss.hurtAt = s.tick; assert.equal(enemyPresentation(s.boss, s.tick, true).pose, "damage");
});

test("boss and shooter bullets begin at the interpolated barrel without changing legacy hitboxes or cadences", () => {
  for (const boss of [true, false]) {
    const s = createGame();
    if (boss) { s.score = 100; tick(s); s.boss.shot = 1; }
    else s.enemies.push({ x: 600, y: 160, width: 80, height: 80, speed: 3, pattern: "shooter", shot: 1, bornAt: -100, flash: 0 });
    const previous = capturePositions(s); tick(s);
    const source = boss ? s.boss : s.enemies[0];
    assert.equal(source.shot, boss ? 100 : 150);
    const shot = s.bullets.find(b => b.enemy);
    assert.equal(shot.vx, boss ? -7 : -5); assert.equal(shot.width, boss ? 36 : 24);
    for (const alpha of [0, 0.25, 0.5, 1]) {
      const view = interpolateScene(s, previous, alpha), actor = boss ? view.boss : view.enemies[0], bullet = view.bullets.find(b => b.enemy);
      const muzzle = enemyMuzzle(actor, boss);
      close(bullet.x + bullet.width - shot.vx * alpha, muzzle.x);
      close(bullet.y + bullet.height / 2, muzzle.y);
    }
  }
});

test("defeated sprites are visual only, expire, cannot collide again, and do not delay victory scoring", () => {
  const s = createGame(); s.enemies.push({ x: 400, y: 100, width: 80, height: 80, speed: 0, hp: 1 });
  s.bullets.push({ x: 416, y: 130, width: 24, height: 6, vx: 0, vy: 0, enemy: false }); tick(s);
  assert.equal(s.score, 10); assert.equal(s.enemies.length, 0); assert.equal(s.defeatedEnemies.length, 1);
  for (let i = 0; i < 45; i++) tick(s);
  assert.equal(s.defeatedEnemies.length, 0); assert.equal(s.score, 10);
  s.score = 100; tick(s); s.boss.hp = 1;
  s.bullets.push({ x: s.boss.x + 30, y: s.boss.y + 70, width: 24, height: 6, vx: 0, vy: 0, enemy: false }); tick(s);
  assert.equal(s.phase, "victory"); assert.equal(s.score, 200); assert.equal(s.boss, null);
  assert.equal(s.defeatedEnemies[0].boss, true);
});

test("enemy rendering handles actual sprites, reduced motion, broken atlas and complete bitmap failure", async () => {
  const image = await loadImage("public" + ENEMY_ATLAS_URL), canvas = createCanvas(400, 400), ctx = canvas.getContext("2d");
  const entity = { x: 90, y: 90, width: 160, height: 160, shot: 10, bornAt: 0 };
  for (const images of [{ [ENEMY_ATLAS_URL]: image }, { [ENEMY_ATLAS_URL]: { naturalWidth: 1 } }, {}]) {
    for (const reduced of [false, true]) {
      ctx.clearRect(0, 0, 400, 400); drawEnemy(ctx, entity, images, 100, true, reduced);
      assert.ok(inspectFramePixels(ctx.getImageData(0, 0, 400, 400).data, 400, 400).occupied > 1000);
    }
  }
});

test("small enemies visibly hover between frames while reduced motion remains still", async () => {
  const image = await loadImage("public" + ENEMY_ATLAS_URL), canvas = createCanvas(300, 300), ctx = canvas.getContext("2d");
  const entity = { x: 90, y: 90, width: 80, height: 80, pattern: "scout", shot: 100, bornAt: 0 };
  const center = (tick, reduced) => {
    ctx.clearRect(0, 0, 300, 300); drawEnemy(ctx, entity, { [ENEMY_ATLAS_URL]: image }, tick, false, reduced);
    const pixels = ctx.getImageData(0, 0, 300, 300).data;
    let weight = 0, totalY = 0;
    for (let i = 3; i < pixels.length; i += 4) { weight += pixels[i]; totalY += Math.floor(i / 4 / 300) * pixels[i]; }
    return totalY / weight;
  };
  const ys = [108, 120, 132, 144].map(tick => center(tick, false));
  // Eight game pixels become roughly 2.4 px even on a 320 px phone canvas.
  assert.ok(Math.max(...ys) - Math.min(...ys) >= 8, `Hover range: ${Math.max(...ys) - Math.min(...ys)}`);
  close(center(108, true), center(132, true));
});

test("visual recoil preserves shot birth, settles on time and never mutates enemy physics", () => {
  const entity = { x: 400, y: 120, width: 160, height: 160, lastShotAt: 100, shot: 100 };
  const before = structuredClone(entity);
  for (const boss of [false, true]) {
    const birth = enemyPresentation(entity, 100, boss);
    assert.deepEqual(enemyVisualMotion(birth, entity.width), { x: 0, y: 0, angle: -0 });
    const recoil = enemyVisualMotion(enemyPresentation(entity, 109, boss), entity.width);
    assert.ok(recoil.x >= 8, "Recoil is visible at boss size");
    const settled = enemyVisualMotion({ pose: "shooting", elapsed: 0.3 }, entity.width);
    close(settled.x, 0); close(settled.angle, 0);
    for (const pose of ["idle", "moving", "shooting", "damage", "charge", "defeat"])
      assert.deepEqual(enemyVisualMotion({ pose, elapsed: 0.15 }, entity.width, true), { x: 0, y: 0, angle: 0 });
  }
  assert.deepEqual(entity, before);
});

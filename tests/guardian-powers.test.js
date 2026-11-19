import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  emptyInput,
  stepGame,
  createClock,
} from "../src/game/simulation.js";
import { AREA_CHARACTERS } from "../src/game/roster.js";
import { POWERS } from "../src/game/powers.js";
import { sampleRig } from "../src/game/rig.js";
import {
  advanceAnimator,
  capturePositions,
  createAnimator,
  interpolateScene,
  spriteFrame,
} from "../src/game/animation.js";

const options = { random: () => 0.99 };
const tick = (state, input = {}) =>
  stepGame(state, { ...emptyInput(), ...input }, options);
const enemy = (x, y) => ({
  x,
  y,
  width: 80,
  height: 80,
  speed: 4,
  hp: 1,
  dead: false,
  flash: 0,
});
const shot = (x, y, hostile = true) => ({
  x,
  y,
  width: 30,
  height: 8,
  vx: hostile ? -7 : 13,
  vy: 0,
  enemy: hostile,
});

test("every directory category has its own power and celebration, without changing the common hitbox", () => {
  const expected = [
    "Administración",
    "Cobranzas",
    "Comercial",
    "Country Manager",
    "Enterprise",
    "Eventos",
    "Operaciones y ST",
    "Partners",
    "Preventa",
    "RRHH",
    "SDR",
    "SMB",
  ];
  assert.equal(AREA_CHARACTERS.length, 12);
  assert.deepEqual(AREA_CHARACTERS.map((c) => c.area).sort(), expected.sort());
  assert.equal(new Set(AREA_CHARACTERS.map((c) => c.power.id)).size, 12);
  assert.equal(new Set(AREA_CHARACTERS.map((c) => c.celebration)).size, 12);
  assert.equal(
    new Set(
      AREA_CHARACTERS.map((c) => JSON.stringify(sampleRig("victory", 0.35, c))),
    ).size,
    12,
  );
  for (const c of AREA_CHARACTERS) {
    const game = createGame(c.id);
    assert.equal(game.player.width, 112);
    assert.equal(game.player.hp, 3);
    assert.equal(c.cost, 0);
    assert.equal(game.player.power, c.power.id);
    if (c.id === "balance") game.player.hp = 2;
    tick(game, { power: true });
    assert.equal(game.player.activation, 1);
    assert.equal(game.player.powerCooldown, c.power.cooldown);
    tick(game, { power: true });
    assert.equal(game.player.activation, 1); // Repeated requests cannot bypass cooldown.
  }
});

test("OrdenIA blocks incoming shots at the placed barrier, without granting contact immunity", () => {
  const g = createGame("ordenia");
  tick(g, { power: true });
  const b = g.barrier;
  g.bullets.push(shot(b.x + 9, b.y + 50));
  tick(g);
  assert.equal(g.bullets.length, 0);
  assert.equal(g.player.hp, 3);
  assert.equal(g.player.shield, 0);
  g.enemies.push(enemy(g.player.x + 20, g.player.y + 20));
  tick(g);
  assert.equal(g.player.hp, 2);
});

test("Balance restores only a missing life and does not consume its power at full health", () => {
  const g = createGame("balance");
  tick(g, { power: true });
  assert.equal(g.player.powerCooldown, 0);
  assert.equal(g.player.activation, 0);
  g.player.hp = 1;
  tick(g, { power: true });
  assert.equal(g.player.hp, 2);
  assert.equal(g.player.powerCooldown, POWERS.recover.cooldown);
});

test("ConectIA fires at double cadence while the power is active", () => {
  const g = createGame("conectia"),
    plain = createGame();
  for (let i = 0; i < 24; i++) {
    tick(g, { power: i === 0, fire: true });
    tick(plain, { fire: true });
  }
  assert.equal(g.bullets.length, 4);
  assert.equal(plain.bullets.length, 2);
});

test("Norte slows hostile movement and projectiles while preserving the player's shot speed", () => {
  const g = createGame("norte");
  g.enemies.push(enemy(700, 20));
  g.bullets.push(shot(600, 40));
  tick(g, { power: true, fire: true });
  assert.ok(Math.abs(g.enemies[0].x - 698.4) < 1e-8);
  assert.ok(Math.abs(g.bullets[0].x - 597.2) < 1e-8);
  assert.equal(g.bullets[1].vx, 13);
});

test("CierreIA launches a four-impact shot, while FestivIA pulse respects its radius", () => {
  const g = createGame("cierreia");
  tick(g, { power: true });
  assert.equal(g.bullets.length, 1);
  assert.equal(g.bullets[0].damage, 4);
  g.score = 100;
  tick(g);
  const boss = g.boss;
  const hp = boss.hp;
  g.bullets[0].x = boss.x + 30;
  g.bullets[0].y = boss.y + 50;
  tick(g);
  assert.equal(g.boss.hp, hp - 4);
  const pulse = createGame("festivia");
  pulse.enemies = [enemy(240, 210), enemy(900, 210)];
  tick(pulse, { power: true });
  assert.equal(pulse.score, 10);
  assert.equal(pulse.enemies.length, 1);
  assert.ok(pulse.enemies[0].x > 800);
});

test("AlianIA reflects a projectile once, and Prisma's beam can hit three different targets", () => {
  const reflect = createGame("aliania");
  reflect.bullets.push(shot(reflect.player.x + 80, reflect.player.y + 45));
  tick(reflect, { power: true });
  assert.equal(reflect.player.hp, 3);
  assert.equal(reflect.bullets[0].enemy, false);
  assert.ok(reflect.bullets[0].vx > 0);
  const prism = createGame("prisma");
  tick(prism, { power: true });
  prism.enemies = [
    enemy(400, 100),
    enemy(410, 100),
    enemy(420, 100),
    enemy(430, 100),
  ];
  prism.bullets.push({ ...shot(410, 140, false), vx: 0, pierce: 3 });
  for (let i = 0; i < 3; i++) tick(prism);
  assert.equal(prism.score, 30);
  assert.equal(prism.enemies.length, 1);
  assert.equal(prism.bullets.length, 0);
});

test("ArmonIA clears nearby projectiles and repels enemies without awarding kills", () => {
  const g = createGame("armonia");
  g.enemies.push(enemy(220, 200));
  g.bullets = [shot(230, 220), shot(850, 20)];
  tick(g, { power: true });
  assert.ok(g.enemies[0].x > 400);
  assert.equal(g.score, 0);
  assert.equal(g.bullets.length, 1);
  assert.ok(g.bullets[0].x > 800);
});

test("RadarIA guides new shots, and ÁgilIA attracts nearby gifts without moving distant ones", () => {
  const g = createGame("radaria");
  g.enemies.push(enemy(500, 70));
  tick(g, { power: true, fire: true });
  assert.equal(g.bullets[0].guided, true);
  assert.ok(g.bullets[0].vy < 0);
  const magnet = createGame("agilia");
  magnet.pickups = [
    { x: 350, y: 350, width: 36, height: 36, type: "heal" },
    { x: 900, y: 400, width: 36, height: 36, type: "shield" },
  ];
  tick(magnet, { power: true });
  assert.ok(magnet.pickups[0].x < 348);
  assert.ok(magnet.pickups[0].y < 350);
  assert.equal(magnet.pickups[1].x, 898);
});

test("visual interpolation does not alter simulation state or revive removed enemies", () => {
  const g = createGame(),
    old = capturePositions(g);
  tick(g, { right: true });
  const originalX = g.player.x,
    halfway = interpolateScene(g, old, 0.5);
  assert.equal(halfway.player.x, originalX - 2.5);
  assert.equal(g.player.x, originalX);
  assert.equal(interpolateScene(g, old, -3).player.x, originalX - 5);
  const clock = createClock();
  clock.advance(0, () => {});
  clock.advance(8, () => {});
  assert.ok(clock.alpha > 0 && clock.alpha < 1);
});

test("animation clocks restart action clips, freeze across pause and clamp terminal frames", () => {
  const actor = createAnimator();
  advanceAnimator(actor, "idle", 1);
  advanceAnimator(actor, "idle", 1.1);
  const elapsed = actor.elapsed;
  actor.previous = null;
  advanceAnimator(actor, "idle", 100);
  assert.equal(actor.elapsed, elapsed);
  advanceAnimator(actor, "power", 100.1, { activation: 1 });
  assert.equal(actor.elapsed, 0);
  advanceAnimator(actor, "power", 100.2, { activation: 1 });
  assert.ok(actor.elapsed > 0);
  advanceAnimator(actor, "power", 100.3, { activation: 2 });
  assert.equal(actor.elapsed, 0);
  assert.equal(spriteFrame("defeat", 100).index, 23);
  assert.equal(spriteFrame("idle", 100, true).index, 0);
});

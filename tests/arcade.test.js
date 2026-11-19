import test from "node:test";
import assert from "node:assert/strict";
import {
  createClock,
  createGame,
  DAMAGE_GRACE,
  emptyInput,
  HEIGHT,
  normalizedMovement,
  SHOT_COOLDOWN,
  stepGame,
  WIDTH,
} from "../src/game/simulation.js";
import {
  AREA_CHARACTERS,
  characterPose,
  rigPose,
} from "../src/game/characters.js";
import { readGameProfile } from "../src/game/profile.js";

function seededRandom() {
  let value = 8128;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}
const enemy = (x, y) => ({
  x,
  y,
  width: 80,
  height: 80,
  speed: 0,
  hp: 1,
  flash: 0,
  dead: false,
});

test("the same twelve-second replay is identical at 30, 60 and 144 render FPS", () => {
  function replay(fps) {
    const state = createGame(),
      clock = createClock(),
      input = { ...emptyInput(), fire: true },
      random = seededRandom();
    clock.advance(0, () => stepGame(state, input, { random }));
    for (let frame = 1; frame <= fps * 12; frame++)
      clock.advance((frame * 1000) / fps, () => {
        input.up = state.tick >= 120 && state.tick < 145;
        input.down = state.tick >= 240 && state.tick < 265;
        stepGame(state, input, { random });
      });
    return state;
  }
  const expected = replay(60);
  assert.equal(expected.tick, 720);
  assert.deepEqual(replay(30), expected);
  assert.deepEqual(replay(144), expected);
});

test("a reset clock discards time spent paused and a long stall has bounded catch-up", () => {
  const clock = createClock();
  let steps = 0;
  clock.advance(0, () => steps++);
  clock.advance(100, () => steps++);
  assert.equal(steps, 6);
  clock.reset();
  clock.advance(60000, () => steps++);
  assert.equal(steps, 6);
  clock.advance(60050, () => steps++);
  assert.equal(steps, 9);
  clock.advance(90000, () => steps++);
  assert.equal(steps, 24);
});

test("keyboard diagonals and oversize analog input never exceed the movement speed or bounds", () => {
  const straight = normalizedMovement({ ...emptyInput(), right: true });
  const diagonal = normalizedMovement({
    ...emptyInput(),
    right: true,
    down: true,
  });
  const analog = normalizedMovement({ ...emptyInput(), x: 500, y: -500 });
  assert.equal(Math.hypot(straight.x, straight.y), 1);
  assert.ok(Math.abs(Math.hypot(diagonal.x, diagonal.y) - 1) < 1e-10);
  assert.ok(Math.abs(Math.hypot(analog.x, analog.y) - 1) < 1e-10);
  const state = createGame();
  for (let i = 0; i < 300; i++)
    stepGame(
      state,
      { ...emptyInput(), right: true, down: true },
      { random: () => 0.99 },
    );
  assert.ok(state.player.x + state.player.width <= WIDTH * 0.54);
  assert.ok(state.player.y + state.player.height <= HEIGHT - 20);
});

test("overlapping enemies and projectiles cost one life, with a separate post-hit grace period", () => {
  const state = createGame(),
    p = state.player;
  state.enemies = [enemy(p.x + 16, p.y + 16), enemy(p.x + 16, p.y + 16)];
  state.bullets = [
    {
      x: p.x + 40,
      y: p.y + 40,
      width: 10,
      height: 10,
      vx: 0,
      vy: 0,
      enemy: true,
    },
  ];
  stepGame(state, emptyInput());
  assert.equal(p.hp, 2);
  assert.equal(p.grace, DAMAGE_GRACE);
  assert.equal(state.enemies.length, 0);
  assert.equal(state.bullets.length, 0);
  state.enemies = [enemy(p.x + 16, p.y + 16)];
  stepGame(state, emptyInput());
  assert.equal(p.hp, 2);
  p.grace = 1;
  state.enemies = [enemy(p.x + 16, p.y + 16)];
  stepGame(state, emptyInput());
  assert.equal(p.hp, 1);
});

test("one projectile hits only one target and adjacent collisions are not skipped", () => {
  const state = createGame();
  state.enemies = [enemy(400, 100), enemy(400, 100), enemy(520, 300)];
  state.bullets = [400, 520].map((x, i) => ({
    x,
    y: i ? 340 : 140,
    width: 30,
    height: 8,
    vx: 15,
    vy: 0,
    enemy: false,
  }));
  stepGame(state, emptyInput(), { random: () => 0.99 });
  assert.equal(state.score, 20);
  assert.equal(state.enemies.length, 1);
  assert.equal(state.bullets.length, 0);
});

test("held firing and assisted firing share the same simulation cooldown", () => {
  const manual = createGame(),
    assisted = createGame();
  for (let i = 0; i < SHOT_COOLDOWN * 3; i++) {
    stepGame(manual, { ...emptyInput(), fire: true }, { random: () => 0.99 });
    stepGame(assisted, emptyInput(), { autoFire: true, random: () => 0.99 });
  }
  assert.equal(manual.bullets.length, 3);
  assert.deepEqual(assisted, manual);
});

test("dash grants brief protection, consumes its request and cannot bypass its cooldown", () => {
  const state = createGame(),
    input = { ...emptyInput(), dash: true };
  state.enemies = [enemy(state.player.x + 16, state.player.y + 16)];
  stepGame(state, input);
  assert.equal(state.player.hp, 3);
  assert.equal(state.player.dash, 10);
  assert.equal(input.dash, false);
  const cooldown = state.player.dashCooldown;
  input.dash = true;
  stepGame(state, input);
  assert.equal(state.player.dash, 9);
  assert.equal(state.player.dashCooldown, cooldown - 1);
});

test("the boss warns thirty ticks before firing and does not respawn after victory", () => {
  const state = createGame();
  state.score = 100;
  stepGame(state, emptyInput());
  assert.ok(state.bossSpawned);
  assert.ok(state.boss);
  state.boss.shot = 31;
  stepGame(state, emptyInput());
  assert.ok(state.events.includes("warning"));
  assert.equal(state.bullets.length, 0);
  for (let i = 0; i < 30; i++) stepGame(state, emptyInput());
  assert.equal(state.bullets.filter((b) => b.enemy).length, 1);
  state.boss.hp = 1;
  state.bullets.push({
    x: state.boss.x + 20,
    y: state.boss.y + 50,
    width: 30,
    height: 6,
    vx: 0,
    vy: 0,
    enemy: false,
  });
  stepGame(state, emptyInput());
  assert.equal(state.phase, "victory");
  assert.equal(state.score, 200);
  const snapshot = structuredClone(state);
  stepGame(state, { ...emptyInput(), fire: true });
  assert.deepEqual(state, snapshot);
});

test("terminal damage cannot turn into victory or revive via a pickup during the same tick", () => {
  const state = createGame(),
    p = state.player;
  p.hp = 1;
  state.enemies.push(enemy(p.x + 16, p.y + 16));
  state.pickups.push({
    x: p.x + 25,
    y: p.y + 25,
    width: 36,
    height: 36,
    type: "heal",
  });
  stepGame(state, emptyInput());
  assert.equal(state.phase, "gameover");
  assert.equal(p.hp, 0);
  const reset = createGame();
  for (const key of [
    "shield",
    "spread",
    "dual",
    "dash",
    "dashCooldown",
    "grace",
    "shot",
    "hurt",
  ])
    assert.equal(reset.player[key], 0);
});

test("all seven pilot animation states resolve, retain opaque parts and honor reduced motion", () => {
  const p = createGame().player;
  assert.equal(characterPose(p), "idle");
  for (const [key, pose] of [
    ["dx", "moving"],
    ["shot", "shooting"],
    ["dash", "dash"],
    ["hurt", "damage"],
  ]) {
    assert.equal(characterPose({ ...p, [key]: 10 }), pose);
  }
  assert.equal(characterPose(p, "victory"), "victory");
  assert.equal(characterPose(p, "gameover"), "defeat");
  for (const pose of [
    "idle",
    "moving",
    "shooting",
    "dash",
    "damage",
    "victory",
    "defeat",
  ]) {
    const values = rigPose(pose, 1);
    assert.ok(Object.values(values).every(Number.isFinite));
    assert.ok(values.alpha >= 0.7);
    assert.equal(rigPose(pose, 1, true).bob, 0);
  }
});

test("an entire deterministic arcade run can reach and defeat the boss", () => {
  const state = createGame(),
    random = seededRandom();
  while (state.phase === "playing" && state.tick < 18000) {
    const input = { ...emptyInput(), fire: true };
    const target =
      state.boss || state.enemies.find((e) => e.x > state.player.x + 150);
    if (target) {
      const desired = target.y + target.height / 2 - 60;
      input.up = state.player.y > desired + 4;
      input.down = state.player.y < desired - 4;
    }
    stepGame(state, input, { random });
    state.events = [];
  }
  assert.equal(state.phase, "victory");
  assert.equal(state.score, 200);
  assert.equal(state.bossSpawned, true);
});

test("the profile migration retains previous unlocks and never selects a locked character", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const saved = new Map([
    ["geo_total_coins", "730"],
    ["geo_unlocked_chars", '["victoria_classic","victoria_st","unknown"]'],
    ["geo_selected_char", "victoria_st"],
  ]);
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { getItem: (key) => saved.get(key) ?? null },
  });
  try {
    const profile = readGameProfile();
    assert.equal(profile.coins, 730);
    assert.equal(profile.selected, "victoria_st");
    assert.equal(profile.unlocked.length, 14);
    assert.ok(AREA_CHARACTERS.every((c) => profile.unlocked.includes(c.id)));
    assert.ok(profile.unlocked.includes("victoria_st"));
    assert.ok(!profile.unlocked.includes("unknown"));
    saved.set("geo_unlocked_chars", "broken-json");
    assert.equal(readGameProfile().selected, "tecnoia");
    saved.set("geo_total_coins", "9".repeat(400));
    assert.equal(readGameProfile().coins, 0);
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get() {
        throw Error("blocked storage");
      },
    });
    assert.deepEqual(readGameProfile(), {
      coins: 0,
      unlocked: [...AREA_CHARACTERS.map((c) => c.id), "victoria_classic"],
      selected: "tecnoia",
    });
  } finally {
    if (original) Object.defineProperty(globalThis, "localStorage", original);
    else delete globalThis.localStorage;
  }
});

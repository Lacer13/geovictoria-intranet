import { activatePower, activePower, powerForCharacter } from "./powers.js";
// The arcade advances at 60 fixed steps per second, independently of rendering.
export const WIDTH = 960;
export const HEIGHT = 540;
export const STEP_MS = 1000 / 60;
export const DAMAGE_GRACE = 75;
export const DASH_COOLDOWN = 150;
export const SHOT_COOLDOWN = 12;

export function createClock() {
  let previous = null;
  let accumulator = 0;
  return {
    get alpha() {
      return Math.max(0, Math.min(1, accumulator / STEP_MS));
    },
    advance(now, update) {
      if (previous === null) {
        previous = now;
        return 0;
      }
      accumulator += Math.max(0, Math.min(250, now - previous));
      previous = now;
      let steps = 0;
      while (accumulator + 1e-7 >= STEP_MS) {
        update();
        accumulator -= STEP_MS;
        steps++;
      }
      return steps;
    },
    reset() {
      previous = null;
      accumulator = 0;
    },
  };
}

export function emptyInput() {
  return {
    left: false,
    right: false,
    up: false,
    down: false,
    fire: false,
    dash: false,
    power: false,
    x: 0,
    y: 0,
  };
}

export function normalizedMovement(input) {
  const x = Math.max(
    -1,
    Math.min(1, Number(input.x) || Number(input.right) - Number(input.left)),
  );
  const y = Math.max(
    -1,
    Math.min(1, Number(input.y) || Number(input.down) - Number(input.up)),
  );
  const length = Math.hypot(x, y);
  return length > 1 ? { x: x / length, y: y / length } : { x, y };
}

export function createGame(characterId = "tecnoia") {
  return {
    phase: "playing",
    tick: 0,
    score: 0,
    bossSpawned: false,
    boss: null,
    player: {
      x: 65,
      y: HEIGHT / 2 - 56,
      width: 112,
      height: 112,
      hp: 3,
      dx: 0,
      dy: 0,
      facingX: 1,
      facingY: 0,
      shot: 0,
      dash: 0,
      dashCooldown: 0,
      hurt: 0,
      grace: 0,
      shield: 0,
      dual: 0,
      spread: 0,
      power: powerForCharacter(characterId).id,
      powerCooldown: 0,
      powerTimer: 0,
      powerAnimation: 0,
      activation: 0,
      activatedAt: -1,
    },
    enemies: [],
    bullets: [],
    pickups: [],
    particles: [],
    texts: [],
    events: [],
    shake: 0,
    barrier: null,
  };
}

export function overlaps(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

const inset = (entity, amount) => ({
  x: entity.x + amount,
  y: entity.y + amount,
  width: entity.width - amount * 2,
  height: entity.height - amount * 2,
});
const clamp = (n, low, high) => Math.max(low, Math.min(high, n));

function burst(state, x, y, color, random, count = 10) {
  for (let i = 0; i < count; i++)
    state.particles.push({
      x,
      y,
      vx: (random() - 0.5) * 8,
      vy: (random() - 0.5) * 8,
      life: 28,
      color,
      size: 2 + random() * 4,
    });
}

function announce(state, text, color = "#f9dc95") {
  state.texts.push({
    x: state.player.x + 56,
    y: state.player.y,
    text,
    color,
    life: 75,
  });
}

function damage(state, random) {
  const p = state.player;
  if (p.grace || p.shield || p.dash || state.phase !== "playing") return false;
  p.hp = Math.max(0, p.hp - 1);
  p.grace = DAMAGE_GRACE;
  p.hurt = 22;
  state.shake = 8;
  state.events.push("damage");
  burst(state, p.x + 56, p.y + 56, "#fb7185", random);
  if (p.hp === 0) {
    state.phase = "gameover";
    state.events.push("defeat");
  }
  return true;
}

function defeatEnemy(state, enemy, random, allowDrop = true) {
  if (enemy.dead) return;
  enemy.dead = true;
  state.score += 10;
  state.events.push("hit");
  burst(state, enemy.x + 40, enemy.y + 40, "#f9dc95", random);
  if (allowDrop && random() < 0.25) {
    const types = ["heal", "shield", "dual", "spread", "bomb"];
    state.pickups.push({
      x: enemy.x,
      y: enemy.y,
      width: 36,
      height: 36,
      type: types[Math.floor(random() * types.length)],
    });
  }
}

function collect(state, pickup, random) {
  const p = state.player;
  const labels = {
    heal: "+ VIDA",
    shield: "ESCUDO · 5 s",
    dual: "DISPARO DOBLE",
    spread: "ABANICO",
    bomb: "¡TALLER DESPEJADO!",
  };
  if (pickup.type === "heal") p.hp = Math.min(3, p.hp + 1);
  if (pickup.type === "shield") p.shield = 300;
  if (pickup.type === "dual") p.dual = 600;
  if (pickup.type === "spread") p.spread = 600;
  if (pickup.type === "bomb") {
    for (const enemy of state.enemies) defeatEnemy(state, enemy, random, false);
    state.bullets = state.bullets.filter((b) => !b.enemy);
    state.shake = 10;
  }
  state.events.push("pickup");
  announce(state, labels[pickup.type]);
}

function hitBoss(state, amount, random) {
  if (!state.boss || state.phase !== "playing") return;
  const boss = state.boss;
  boss.hp = Math.max(0, boss.hp - amount);
  boss.flash = 5;
  state.events.push("hit");
  burst(state, boss.x + 60, boss.y + 70, "#94e4d6", random, 4);
  if (boss.hp === 0) {
    state.score += 100;
    burst(state, boss.x + 80, boss.y + 80, "#f9dc95", random, 30);
    state.boss = null;
    state.phase = "victory";
    state.events.push("victory");
  }
}

export function stepGame(
  state,
  input,
  { random = Math.random, autoFire = false } = {},
) {
  if (state.phase !== "playing") return;
  state.tick++;
  const p = state.player;
  for (const key of [
    "shot",
    "dash",
    "dashCooldown",
    "hurt",
    "grace",
    "shield",
    "dual",
    "spread",
    "powerCooldown",
    "powerTimer",
    "powerAnimation",
  ])
    p[key] = Math.max(0, p[key] - 1);
  const direction = normalizedMovement(input);
  p.dx = direction.x;
  p.dy = direction.y;
  if (p.dx || p.dy) {
    const length = Math.hypot(p.dx, p.dy);
    p.facingX = p.dx / length;
    p.facingY = p.dy / length;
  }
  if (state.barrier && --state.barrier.life <= 0) state.barrier = null;
  if (input.power || input.dash)
    activatePower(state, { announce, defeatEnemy, hitBoss, random });
  input.power = false;
  input.dash = false;
  const hostileSpeed = activePower(p, "slow") ? 0.4 : 1;
  const moveX = p.dash ? p.facingX : p.dx;
  const moveY = p.dash ? p.facingY : p.dy;
  const speed = p.dash ? 14 : 5;
  p.x = clamp(p.x + moveX * speed, 4, WIDTH * 0.54 - p.width);
  p.y = clamp(p.y + moveY * speed, 12, HEIGHT - p.height - 20);

  if ((input.fire || autoFire) && p.shot === 0) {
    p.shot = activePower(p, "burst") ? SHOT_COOLDOWN / 2 : SHOT_COOLDOWN;
    const shots = p.spread ? [-2.8, 0, 2.8] : p.dual ? [-1, 1] : [0];
    for (const shot of shots)
      state.bullets.push({
        x: p.x + p.width - 16,
        y: p.y + 60 + (p.dual && !p.spread ? shot * 15 : 0),
        width: 24,
        height: 6,
        vx: 13,
        vy: p.spread ? shot : 0,
        enemy: false,
        pierce: activePower(p, "pierce") ? 3 : 1,
        guided: activePower(p, "radar"),
      });
    state.events.push("shoot");
  }

  if (!state.bossSpawned && state.tick % 65 === 0)
    state.enemies.push({
      x: WIDTH + 20,
      y: 32 + random() * (HEIGHT - 150),
      width: 80,
      height: 80,
      speed: 2.8 + random() * 1.4,
      hp: 1,
      dead: false,
      flash: 0,
    });
  if (state.score >= 100 && !state.bossSpawned) {
    state.bossSpawned = true;
    state.boss = {
      x: WIDTH - 210,
      y: 160,
      width: 160,
      height: 160,
      hp: 25,
      maxHp: 25,
      dy: 1.6,
      shot: 100,
      flash: 0,
    };
    announce(state, "¡GUARDIÁN DEL TALLER!");
    state.events.push("boss");
  }
  if (state.boss) {
    const b = state.boss;
    b.y = clamp(b.y + b.dy * hostileSpeed, 50, HEIGHT - b.height - 30);
    if (b.y <= 50 || b.y >= HEIGHT - b.height - 30) b.dy *= -1;
    b.flash = Math.max(0, b.flash - 1);
    b.shot--;
    if (b.shot === 30) state.events.push("warning");
    if (b.shot <= 0) {
      state.bullets.push({
        x: b.x,
        y: b.y + b.height / 2,
        width: 36,
        height: 10,
        vx: -7,
        vy: 0,
        enemy: true,
      });
      b.shot = 100;
    }
  }
  for (const enemy of state.enemies) {
    enemy.x -= enemy.speed * hostileSpeed;
    enemy.flash = Math.max(0, enemy.flash - 1);
    if (!enemy.dead && overlaps(inset(p, 26), inset(enemy, 16))) {
      enemy.dead = true;
      damage(state, random);
    }
    if (enemy.x + enemy.width < 0) enemy.dead = true;
  }

  // Mark spent bullets and defeated enemies first; filter only after collision resolution.
  for (const bullet of state.bullets) {
    if (state.phase !== "playing") break;
    if (bullet.guided && !bullet.enemy) {
      const targets = [
        ...state.enemies.filter((e) => !e.dead && e.x > bullet.x),
        ...(state.boss && state.boss.x > bullet.x ? [state.boss] : []),
      ];
      targets.sort(
        (a, b) =>
          Math.hypot(a.x - bullet.x, a.y + a.height / 2 - bullet.y) -
          Math.hypot(b.x - bullet.x, b.y + b.height / 2 - bullet.y),
      );
      if (targets[0])
        bullet.vy = clamp(
          (targets[0].y + targets[0].height / 2 - bullet.y) * 0.045,
          -3.5,
          3.5,
        );
    }
    bullet.x += bullet.vx * (bullet.enemy ? hostileSpeed : 1);
    bullet.y += bullet.vy * (bullet.enemy ? hostileSpeed : 1);
    if (bullet.enemy) {
      if (state.barrier && overlaps(bullet, state.barrier)) {
        bullet.dead = true;
        continue;
      }
      if (activePower(p, "reflect") && overlaps(bullet, inset(p, -12))) {
        bullet.enemy = false;
        bullet.vx = Math.abs(bullet.vx) + 5;
        bullet.vy = 0;
        bullet.pierce = 1;
        continue;
      }
      if (overlaps(bullet, inset(p, 26))) {
        bullet.dead = true;
        damage(state, random);
      }
    } else {
      const enemy = state.enemies.find(
        (e) =>
          !e.dead &&
          !bullet.targets?.includes(e) &&
          overlaps(bullet, inset(e, 16)),
      );
      if (enemy) {
        bullet.pierce = (bullet.pierce || 1) - 1;
        bullet.dead = bullet.pierce <= 0;
        (bullet.targets ||= []).push(enemy);
        defeatEnemy(state, enemy, random);
      }
      if (
        !bullet.dead &&
        !bullet.hitBoss &&
        state.boss &&
        overlaps(bullet, inset(state.boss, 20))
      ) {
        bullet.hitBoss = true;
        bullet.pierce = (bullet.pierce || 1) - 1;
        bullet.dead = bullet.pierce <= 0;
        hitBoss(state, bullet.damage || 1, random);
      }
    }
    if (
      bullet.x < -50 ||
      bullet.x > WIDTH + 50 ||
      bullet.y < -50 ||
      bullet.y > HEIGHT + 50
    )
      bullet.dead = true;
  }
  for (const pickup of state.pickups) {
    pickup.x -= 2;
    if (activePower(p, "magnet")) {
      const dx = p.x + p.width / 2 - pickup.x - pickup.width / 2,
        dy = p.y + p.height / 2 - pickup.y - pickup.height / 2;
      const distance = Math.hypot(dx, dy);
      if (distance < 500 && distance > 1) {
        pickup.x += (dx / distance) * 8;
        pickup.y += (dy / distance) * 8;
      }
    }
    if (state.phase === "playing" && overlaps(inset(p, 14), pickup)) {
      pickup.dead = true;
      collect(state, pickup, random);
    }
    if (pickup.x < -50) pickup.dead = true;
  }
  state.enemies = state.enemies.filter((e) => !e.dead);
  state.bullets = state.bullets.filter((b) => !b.dead);
  state.pickups = state.pickups.filter((pickup) => !pickup.dead);
  for (const particle of state.particles) {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vx *= 0.95;
    particle.vy *= 0.95;
    particle.life--;
  }
  state.particles = state.particles.filter((particle) => particle.life > 0);
  for (const text of state.texts) {
    text.y -= 0.6;
    text.life--;
  }
  state.texts = state.texts.filter((text) => text.life > 0);
  state.shake *= 0.88;
}

export function gameSummary(state) {
  const p = state.player;
  return {
    score: state.score,
    hp: p.hp,
    phase: state.phase,
    dash: Math.ceil(p.dashCooldown / 60),
    shield: Math.ceil(p.shield / 60),
    dual: Math.ceil(p.dual / 60),
    spread: Math.ceil(p.spread / 60),
    boss: state.bossSpawned,
    power: p.power,
    powerCooldown: Math.ceil(p.powerCooldown / 60),
    powerTime: Math.ceil(p.powerTimer / 60),
  };
}

// Shared deterministic arena rules. Only the Node server advances a live match.
export const ARENA = { width: 960, height: 540, radius: 19, target: 5, seconds: 180, overtime: 30 };
export const WALLS = [{ x: 260, y: 100, w: 44, h: 130 }, { x: 656, y: 310, w: 44, h: 130 }];
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export const freshArenaInput = () => ({ x: 0, y: 0, aimX: 1, aimY: 0, fire: false, dash: false });
export function validArenaInput(value) {
  return value && Object.keys(value).every(key => ["x", "y", "aimX", "aimY", "fire", "dash"].includes(key)) &&
    ["x", "y", "aimX", "aimY"].every(key => Number.isFinite(value[key]) && Math.abs(value[key]) <= 1) &&
    typeof value.fire === "boolean" && typeof value.dash === "boolean";
}
const spawn = side => ({ x: side === 0 ? 95 : 865, y: 270 });
export function createArena() {
  return { phase: "countdown", tick: 0, playingTicks: 0, overtime: false, winner: null, reason: null, sequence: 0,
    players: [0, 1].map(side => ({ ...spawn(side), side, hp: 3, score: 0, shot: 0, dash: 0, cooldown: 0, grace: 90, respawn: 0, aimX: side === 0 ? 1 : -1, aimY: 0 })),
    bullets: [], orb: { x: 480, y: 270, carrier: null, cooldown: 0 } };
}
function hitsWall(x, y, radius = ARENA.radius) {
  return WALLS.some(w => Math.hypot(x - clamp(x, w.x, w.x + w.w), y - clamp(y, w.y, w.y + w.h)) < radius);
}
export function finishArena(state, winner, reason) {
  if (state.phase === "finished") return;
  state.phase = "finished"; state.winner = winner; state.reason = reason;
}
export function stepArena(state, inputs) {
  if (state.phase === "finished") return;
  state.tick++;
  if (state.phase === "countdown") {
    if (state.tick >= 180) state.phase = "playing";
    return;
  }
  state.playingTicks++;
  state.orb.cooldown = Math.max(0, state.orb.cooldown - 1);
  for (const p of state.players) {
    const input = validArenaInput(inputs[p.side]) ? inputs[p.side] : freshArenaInput();
    for (const field of ["shot", "dash", "cooldown", "grace"]) p[field] = Math.max(0, p[field] - 1);
    if (p.respawn) { if (--p.respawn === 0) Object.assign(p, spawn(p.side), { hp: 3, grace: 90 }); continue; }
    const aimLength = Math.hypot(input.aimX, input.aimY);
    if (aimLength > 0.1) { p.aimX = input.aimX / aimLength; p.aimY = input.aimY / aimLength; }
    if (input.dash && p.cooldown === 0) { p.dash = 10; p.cooldown = 150; }
    input.dash = false;
    const length = Math.max(1, Math.hypot(input.x, input.y)), speed = p.dash ? 9 : 4;
    const x = clamp(p.x + input.x / length * speed, 24, 936), y = clamp(p.y + input.y / length * speed, 24, 516);
    if (!hitsWall(x, p.y)) p.x = x;
    if (!hitsWall(p.x, y)) p.y = y;
    if (input.fire && p.shot === 0) {
      p.shot = 12;
      state.bullets.push({ id: ++state.sequence, side: p.side, x: p.x + p.aimX * 26, y: p.y + p.aimY * 26, vx: p.aimX * 10, vy: p.aimY * 10, life: 75 });
    }
    if (state.orb.carrier === null && state.orb.cooldown === 0 && Math.hypot(p.x - state.orb.x, p.y - state.orb.y) < 34) state.orb.carrier = p.side;
    if (state.orb.carrier === p.side && Math.hypot(p.x - (p.side === 0 ? 60 : 900), p.y - 270) < 62) {
      p.score++;
      Object.assign(state.orb, { x: 480, y: 270, carrier: null, cooldown: 60 });
      if (p.score >= ARENA.target) { finishArena(state, p.side, "deliveries"); return; }
    }
  }
  for (const b of state.bullets) {
    b.x += b.vx; b.y += b.vy; b.life--;
    if (b.x < 0 || b.x > 960 || b.y < 0 || b.y > 540 || hitsWall(b.x, b.y, 4)) { b.life = 0; continue; }
    const target = state.players[1 - b.side];
    if (!target.respawn && Math.hypot(b.x - target.x, b.y - target.y) < 22) {
      b.life = 0;
      if (target.grace || target.dash) continue;
      target.hp--; target.grace = 45;
      if (state.orb.carrier === target.side) Object.assign(state.orb, { x: target.x, y: target.y, carrier: null, cooldown: 30 });
      if (target.hp <= 0) target.respawn = 120;
    }
  }
  state.bullets = state.bullets.filter(b => b.life > 0);
  if (state.playingTicks >= (ARENA.seconds + (state.overtime ? ARENA.overtime : 0)) * 60) {
    const [a, b] = state.players;
    if (a.score === b.score && !state.overtime) state.overtime = true;
    else finishArena(state, a.score === b.score ? null : a.score > b.score ? 0 : 1, "time");
  }
}

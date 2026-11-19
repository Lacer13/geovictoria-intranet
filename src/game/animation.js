export const SPRITE_SIZE = 160;
export const SPRITE_COLUMNS = 24;
export const CLIPS = {
  idle: { row: 0, frames: 24, duration: 1.2, loop: true, label: "Reposo" },
  moving: {
    row: 1,
    frames: 24,
    duration: 0.8,
    loop: true,
    label: "Movimiento",
  },
  shooting: { row: 2, frames: 12, duration: 0.2, loop: true, label: "Disparo" },
  dash: { row: 3, frames: 12, duration: 1 / 6, loop: false, label: "Esquiva" },
  damage: {
    row: 4,
    frames: 16,
    duration: 22 / 60,
    loop: false,
    label: "Impacto",
  },
  power: { row: 5, frames: 24, duration: 0.6, loop: false, label: "Poder" },
  victory: {
    row: 6,
    frames: 48,
    duration: 1.4,
    loop: true,
    label: "Celebración",
  },
  defeat: { row: 8, frames: 24, duration: 0.8, loop: false, label: "Descanso" },
};
export const SPRITE_ROWS = Math.max(
  ...Object.values(CLIPS).map(
    (clip) => clip.row + Math.ceil(clip.frames / SPRITE_COLUMNS),
  ),
);

export function clipProgress(pose, elapsed) {
  const clip = CLIPS[pose] || CLIPS.idle;
  const time = Math.max(0, Number.isFinite(elapsed) ? elapsed : 0);
  return clip.loop
    ? (time % clip.duration) / clip.duration
    : Math.min(1, time / clip.duration);
}

export function spriteFrame(pose, elapsed = 0, reduced = false) {
  const clip = CLIPS[pose] || CLIPS.idle;
  const index = reduced
    ? 0
    : Math.min(
        clip.frames - 1,
        Math.floor(clipProgress(pose, elapsed) * clip.frames),
      );
  return {
    x: (index % SPRITE_COLUMNS) * SPRITE_SIZE,
    y: (clip.row + Math.floor(index / SPRITE_COLUMNS)) * SPRITE_SIZE,
    width: SPRITE_SIZE,
    height: SPRITE_SIZE,
    index,
  };
}

export function createAnimator() {
  return {
    pose: "idle",
    started: null,
    previous: null,
    elapsed: 0,
    lean: 0,
    activation: -1,
    lastShotId: 0,
    presentationTick: 0,
  };
}
export function advanceAnimator(
  actor,
  pose,
  now,
  { dx = 0, dy = 0, activation = 0, reduced = false, shotId = 0 } = {},
) {
  const changed =
    actor.started === null ||
    actor.pose !== pose ||
    ((pose === "power" || pose === "dash") && actor.activation !== activation) ||
    (pose === "shooting" && actor.shotId !== shotId);
  if (changed) {
    actor.started = now;
    actor.pose = pose;
    actor.activation = activation;
    actor.shotId = shotId;
    actor.elapsed = 0;
  }
  const delta =
    actor.previous === null
      ? 0
      : Math.min(0.1, Math.max(0, now - actor.previous));
  actor.previous = now;
  if (!changed) actor.elapsed += delta;
  const target = reduced ? 0 : dx * 0.06 + dy * -0.06;
  actor.lean += (target - actor.lean) * (1 - Math.exp(-delta * 13));
  return actor;
}

// Interpolate display positions only. Rules, hits, and score always use the fixed-step state.
export function capturePositions(state) {
  return new Map(
    [
      state.player,
      state.boss,
      ...state.enemies,
      ...state.bullets,
      ...state.pickups,
    ]
      .filter(Boolean)
      .map((e) => [e, { x: e.x, y: e.y }]),
  );
}
export function interpolateScene(state, previous, alpha) {
  const amount = Math.max(0, Math.min(1, alpha));
  const entity = (e) => {
    const old = previous?.get(e);
    if (!old && !e.enemy && e.bornAt === state.tick && Number.isFinite(e.emissionX)) {
      const playerBefore = previous?.get(state.player);
      const dx = e.followsEmitter && playerBefore ? state.player.x - playerBefore.x : 0;
      const dy = e.followsEmitter && playerBefore ? state.player.y - playerBefore.y : 0;
      return { ...e,
        x: e.emissionX + (e.x - e.emissionX) * amount - dx * (1 - amount),
        y: e.emissionY + (e.y - e.emissionY) * amount - dy * (1 - amount),
      };
    }
    return old
      ? {
          ...e,
          x: old.x + (e.x - old.x) * amount,
          y: old.y + (e.y - old.y) * amount,
        }
      : e;
  };
  return {
    ...state,
    player: entity(state.player),
    boss: state.boss ? entity(state.boss) : null,
    enemies: state.enemies.map(entity),
    bullets: state.bullets.map(entity),
    pickups: state.pickups.map(entity),
  };
}

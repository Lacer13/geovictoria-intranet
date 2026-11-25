// Shared source of timing and muzzle geometry for export, simulation and drawing.
export const ENEMY_ATLAS_URL = "/enemies/desfase/sprites-v1.webp";
export const ENEMY_CLIPS = {
  arrival: { frames: 24, fps: 40, duration: 0.6, loop: false, reducedFrame: 23 },
  idle: { frames: 24, fps: 24, duration: 1, loop: true, reducedFrame: 0 },
  moving: { frames: 24, fps: 30, duration: 0.8, loop: true, reducedFrame: 0 },
  charge: { frames: 30, fps: 60, duration: 0.5, loop: false, reducedFrame: 20 },
  shooting: { frames: 18, fps: 60, duration: 0.3, loop: false, reducedFrame: 0 },
  damage: { frames: 18, fps: 60, duration: 0.3, loop: false, reducedFrame: 9 },
  defeat: { frames: 30, fps: 40, duration: 0.75, loop: false, reducedFrame: 29 },
};

export function enemyMuzzle(entity, boss = false) {
  // The left-moving projectile's trailing edge is at the barrel at birth.
  // Keep the historical collision rectangles, speeds and warning lanes intact.
  return { x: entity.x + (boss ? 36 : 24), y: entity.y + entity.height / 2 + (boss ? 5 : 3.5) };
}

export function recordEnemyShot(entity, bullets, tick) {
  entity.lastShotAt = tick;
  for (const bullet of bullets) Object.assign(bullet, {
    bornAt: tick, emissionX: bullet.x, emissionY: bullet.y,
    emitterX: entity.x, emitterY: entity.y, enemyEmitter: entity,
  });
}

export function enemyPresentation(entity, tick, boss = false) {
  if (Number.isFinite(entity.defeatedAt)) return { pose: "defeat", elapsed: Math.max(0, tick - entity.defeatedAt) / 60 };
  const shotAge = tick - (entity.lastShotAt ?? -Infinity);
  if (shotAge >= 0 && shotAge < 18) return { pose: "shooting", elapsed: shotAge / 60 };
  if ((boss || entity.pattern === "shooter") && entity.shot > 0 && entity.shot <= 30)
    return { pose: "charge", elapsed: (30 - entity.shot) / 60 };
  const hurtAge = tick - (entity.hurtAt ?? -Infinity);
  if (hurtAge >= 0 && hurtAge < 18) return { pose: "damage", elapsed: hurtAge / 60 };
  const age = Math.max(0, tick - (entity.bornAt ?? 0)) / 60;
  return { pose: age < 0.6 ? "arrival" : boss ? "idle" : "moving", elapsed: age };
}

// Eight authored key poses, with easing between the physical beats of a shot.
// These are sampled into actual atlas cells rather than transformed at runtime.
export function sampleEnemyFrame(pose, seconds = 0, reduced = false) {
  const clip = ENEMY_CLIPS[pose] || ENEMY_CLIPS.idle;
  const t = Math.max(0, seconds);
  const phase = reduced ? clip.reducedFrame / clip.frames : clip.loop ? t % clip.duration / clip.duration : Math.min(1, t / clip.duration);
  const pulse = Math.sin(Math.PI * phase), wave = Math.sin(Math.PI * 2 * phase);
  let key = "idle", dx = 0, dy = 0, angle = 0, alpha = 1, glow = 0;
  if (pose === "arrival") { key = "aim"; dx = reduced ? 0 : 15 * (1 - phase) ** 3; }
  if (pose === "idle" || pose === "moving") { dy = reduced ? 0 : wave * 2.2; angle = reduced ? 0 : wave * 0.012; }
  if (pose === "charge") { key = phase < 0.2 ? "aim" : "charge"; glow = 0.15 + phase * 0.55; }
  if (pose === "shooting") {
    key = phase < 1 / 6 ? "fire" : phase < 0.6 ? "recoil" : "recover";
    dx = reduced ? 0 : pulse * 4; glow = phase < 1 / 6 ? 1 : 0;
  }
  if (pose === "damage") { key = "damage"; dx = reduced ? 0 : pulse * 3; angle = reduced ? 0 : wave * 0.025; }
  if (pose === "defeat") { key = "defeat"; dy = reduced ? 4 : phase * 9; alpha = phase < 0.55 ? 1 : Math.max(0, (1 - phase) / 0.45); }
  return { key, dx, dy, angle, alpha, glow };
}

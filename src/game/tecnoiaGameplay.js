import { basicShotOrigin } from "./emission.js";
import { sampleTecnoiaV2, tecnoiaV2Muzzle } from "./tecnoiaV2.js";

export const TECNOIA_GAME_CLIPS = {
  idle: { frames: 24, fps: 20, duration: 1.2, loop: true, reducedFrame: 0 },
  moving: { frames: 24, fps: 30, duration: 0.8, loop: true, reducedFrame: 0 },
  shooting: { frames: 12, fps: 60, duration: 0.2, loop: false, reducedFrame: 11 },
  aim: { frames: 1, fps: 5, duration: 0.2, loop: true, reducedFrame: 0 },
  dash: { frames: 12, fps: 72, duration: 1 / 6, loop: false, reducedFrame: 6 },
  damage: { frames: 22, fps: 60, duration: 22 / 60, loop: false, reducedFrame: 10 },
  power: { frames: 24, fps: 40, duration: 0.6, loop: false, reducedFrame: 12 },
  defeat: { frames: 24, fps: 30, duration: 0.8, loop: false, reducedFrame: 23 },
  victory: { frames: 60, fps: 24, duration: 2.5, loop: false, reducedFrame: 33 },
};

const initial = tecnoiaV2Muzzle(sampleTecnoiaV2("shooting", 0));
const origin = basicShotOrigin({ x: 0, y: 0, width: 112, height: 112 });
// A shared pivot moves the artwork rather than moving the physical projectile.
export const TECNOIA_GAME_PIVOT = {
  x: initial.x - (origin.x - 56) * 320 / 112,
  y: initial.y - (origin.y - 56) * 320 / 112,
};

export function sampleTecnoiaGameplay(pose = "idle", seconds = 0, reduced = false, {
  shotElapsed = null, armed = false, dx = 0, dy = 0,
} = {}) {
  if (pose === "victory") return sampleTecnoiaV2("victory", seconds, reduced);
  if (pose === "shooting" || pose === "aim")
    return sampleTecnoiaV2("shooting", pose === "aim" ? 0.2 : seconds, reduced);
  const clip = TECNOIA_GAME_CLIPS[pose] || TECNOIA_GAME_CLIPS.idle;
  const time = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const phase = clip.loop ? time % clip.duration / clip.duration : Math.min(1, time / clip.duration);
  const wave = reduced ? 0 : Math.sin(phase * Math.PI * 2);
  const pulse = reduced ? 0 : Math.sin(phase * Math.PI);
  const result = { ...sampleTecnoiaV2("victory", 2.5), phase: pose };
  if (pose === "idle" || pose === "moving") {
    result.headY += wave * (pose === "moving" ? 3 : 1.5);
    result.toolY -= wave * 2; result.handY += wave;
    if (!reduced && pose === "moving") { result.headAngle = dx * 0.035; result.headY += dy * 2; }
  }
  if (pose === "dash") {
    result.head = "headAim"; result.hand = "waveCurl";
    result.headAngle = reduced ? 0 : -pulse * 0.09;
    result.toolX += 8 + pulse * 5; result.toolY -= 14 + pulse * 8;
    result.handX -= 12 + pulse * 5; result.handY -= 14 + pulse * 8;
  }
  if (pose === "damage") {
    result.head = "headAim"; result.hand = "waveCurl";
    result.headX -= pulse * 3; result.headAngle = reduced ? 0 : wave * 0.045 * (1 - phase);
    result.toolY += pulse * 4; result.handY += pulse * 3;
  }
  if (pose === "power") {
    result.head = "headJoy"; result.hand = "waveOpen";
    result.toolY -= reduced ? 30 : pulse * 55;
    result.handY -= reduced ? 20 : pulse * 32;
  }
  if (pose === "defeat") {
    result.headY += 7 * phase; result.headAngle = reduced ? 0 : 0.065 * phase;
    result.toolY += 6 * phase; result.handY += 4 * phase;
  }
  // The head/tool can react while the free hand independently fires. Never
  // rotate or bob the muzzle with the render's movement lean.
  if (pose !== "defeat" && (armed || shotElapsed !== null && shotElapsed < 0.2)) {
    const shot = sampleTecnoiaV2("shooting", shotElapsed === null ? 0.2 : shotElapsed, reduced);
    for (const field of ["hand", "handX", "handY", "handAngle", "flash"]) result[field] = shot[field];
  }
  return result;
}

export function gameplayMuzzle(player, sample = sampleTecnoiaGameplay("shooting", 0)) {
  const point = tecnoiaV2Muzzle(sample);
  if (!point) return null;
  return {
    x: player.x + player.width / 2 + (point.x - TECNOIA_GAME_PIVOT.x) * player.width / 320,
    y: player.y + player.height / 2 + (point.y - TECNOIA_GAME_PIVOT.y) * player.width / 320,
    dx: point.dx, dy: point.dy,
  };
}

export function tecnoiaPresentation(state, actor, alpha = 0) {
  // Monotonic visual time avoids replaying a flash when a paused clock resets.
  actor.presentationTick = Math.max(actor.presentationTick || 0, state.tick + alpha);
  const p = state.player, now = actor.presentationTick;
  const shotElapsed = p.lastShot ? Math.max(0, (now - p.lastShot.tick) / 60) : null;
  let pose = "idle", elapsed = now / 60;
  if (state.phase !== "playing") { pose = state.phase === "victory" ? "victory" : "defeat"; elapsed = (now - (state.finishedAt ?? state.tick)) / 60; }
  else if (p.hurt) { pose = "damage"; elapsed = (now - p.hurtAt) / 60; }
  else if (p.dash) { pose = "dash"; elapsed = (now - p.activatedAt) / 60; }
  else if (p.powerAnimation) { pose = "power"; elapsed = (now - p.activatedAt) / 60; }
  else if (shotElapsed !== null && shotElapsed < 0.2) { pose = "shooting"; elapsed = shotElapsed; }
  else if (p.firing) pose = "aim";
  else if (p.dx || p.dy) pose = "moving";
  return { pose, elapsed, shotElapsed, armed: p.firing, dx: p.dx, dy: p.dy };
}

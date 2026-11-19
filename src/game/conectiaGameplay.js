import { basicShotOrigin } from "./emission.js";
import { sampleConectiaV2, conectiaV2Muzzle } from "./conectiaV2.js";

export const CONECTIA_GAME_CLIPS = {
  idle: { frames: 24, fps: 20, duration: 1.2, loop: true, reducedFrame: 0 },
  moving: { frames: 24, fps: 30, duration: 0.8, loop: true, reducedFrame: 0 },
  shooting: { frames: 12, fps: 60, duration: 0.2, loop: false, reducedFrame: 11 },
  burst: { frames: 6, fps: 60, duration: 0.1, loop: false, reducedFrame: 5 },
  aim: { frames: 1, fps: 5, duration: 0.2, loop: true, reducedFrame: 0 },
  dash: { frames: 12, fps: 72, duration: 1 / 6, loop: false, reducedFrame: 6 },
  damage: { frames: 22, fps: 60, duration: 22 / 60, loop: false, reducedFrame: 10 },
  power: { frames: 24, fps: 40, duration: 0.6, loop: false, reducedFrame: 12 },
  defeat: { frames: 24, fps: 30, duration: 0.8, loop: false, reducedFrame: 23 },
  victory: { frames: 72, fps: 24, duration: 3, loop: false, reducedFrame: 43 },
};

const initial = conectiaV2Muzzle(sampleConectiaV2("shooting", 0));
const origin = basicShotOrigin({ x: 0, y: 0, width: 112, height: 112 });
// A shared pivot moves the artwork rather than moving the physical projectile.
export const CONECTIA_GAME_PIVOT = {
  x: initial.x - (origin.x - 56) * 320 / 112,
  y: initial.y - (origin.y - 56) * 320 / 112,
};

export function sampleConectiaGameplay(pose = "idle", seconds = 0, reduced = false, {
  shotElapsed = null, shotClip = "shooting", armed = false, dx = 0, dy = 0,
} = {}) {
  if (pose === "victory") return sampleConectiaV2("victory", seconds, reduced);
  if (pose === "shooting" || pose === "burst" || pose === "aim")
    return sampleConectiaV2(pose === "burst" ? "burst" : "shooting", pose === "aim" ? 0.2 : seconds, reduced);
  const clip = CONECTIA_GAME_CLIPS[pose] || CONECTIA_GAME_CLIPS.idle;
  const time = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const phase = clip.loop ? time % clip.duration / clip.duration : Math.min(1, time / clip.duration);
  const wave = reduced ? 0 : Math.sin(phase * Math.PI * 2);
  const pulse = reduced ? 0 : Math.sin(phase * Math.PI);
  const result = { ...sampleConectiaV2("victory", 3), phase: pose };
  if (pose === "idle" || pose === "moving") {
    result.headY += wave * (pose === "moving" ? 3 : 1.5);
    result.toolY -= wave * 2; result.handY += wave;
    if (!reduced && pose === "moving") { result.headAngle = dx * 0.035; result.headY += dy * 2; }
  }
  if (pose === "dash") {
    result.head = "headAim"; result.hand = "thumbsUp";
    result.headAngle = reduced ? 0 : -pulse * 0.09;
    result.toolX += 8 + pulse * 5; result.toolY -= 14 + pulse * 8;
    result.handX -= 12 + pulse * 5; result.handY -= 14 + pulse * 8;
  }
  if (pose === "damage") {
    result.head = "headAim"; result.hand = "thumbsUp";
    result.headX -= pulse * 3; result.headAngle = reduced ? 0 : wave * 0.045 * (1 - phase);
    result.toolY += pulse * 4; result.handY += pulse * 3;
  }
  if (pose === "power") {
    result.head = "headAim"; result.hand = "thumbsUp";
    result.toolY -= reduced ? 35 : pulse * 58;
    result.toolAngle = reduced ? 0 : -pulse * 0.06;
    result.handY -= reduced ? 15 : pulse * 20;
  }
  if (pose === "defeat") {
    result.headY += 7 * phase; result.headAngle = reduced ? 0 : 0.065 * phase;
    result.toolY += 6 * phase; result.handY += 4 * phase;
  }
  // The head/tool can react while the free hand independently fires. Never
  // rotate or bob the muzzle with the render's movement lean.
  const shotDuration = CONECTIA_GAME_CLIPS[shotClip]?.duration || 0.2;
  if (pose !== "defeat" && (armed || shotElapsed !== null && shotElapsed < shotDuration)) {
    const shot = sampleConectiaV2(shotClip, shotElapsed === null ? shotDuration : shotElapsed, reduced);
    for (const field of ["hand", "handX", "handY", "handAngle", "flash"]) result[field] = shot[field];
  }
  return result;
}

export function gameplayMuzzle(player, sample = sampleConectiaGameplay("shooting", 0)) {
  const point = conectiaV2Muzzle(sample);
  if (!point) return null;
  return {
    x: player.x + player.width / 2 + (point.x - CONECTIA_GAME_PIVOT.x) * player.width / 320,
    y: player.y + player.height / 2 + (point.y - CONECTIA_GAME_PIVOT.y) * player.width / 320,
    dx: point.dx, dy: point.dy,
  };
}

export function conectiaPresentation(state, actor, alpha = 0) {
  // Monotonic visual time avoids replaying a flash when a paused clock resets.
  actor.presentationTick = Math.max(actor.presentationTick || 0, state.tick + alpha);
  const p = state.player, now = actor.presentationTick;
  const shotElapsed = p.lastShot ? Math.max(0, (now - p.lastShot.tick) / 60) : null;
  // The accepted shot carries its own cadence, so activating/expiring the power
  // between emissions cannot stretch or restart an in-flight reaction.
  const shotClip = p.lastShot?.intervalTicks === 6 ? "burst" : "shooting";
  const shotDuration = CONECTIA_GAME_CLIPS[shotClip].duration;
  let pose = "idle", elapsed = now / 60;
  if (state.phase !== "playing") { pose = state.phase === "victory" ? "victory" : "defeat"; elapsed = (now - (state.finishedAt ?? state.tick)) / 60; }
  else if (p.hurt) { pose = "damage"; elapsed = (now - p.hurtAt) / 60; }
  else if (p.dash) { pose = "dash"; elapsed = (now - p.activatedAt) / 60; }
  else if (p.powerAnimation) { pose = "power"; elapsed = (now - p.activatedAt) / 60; }
  else if (shotElapsed !== null && shotElapsed < shotDuration) { pose = shotClip; elapsed = shotElapsed; }
  else if (p.firing) pose = "aim";
  else if (p.dx || p.dy) pose = "moving";
  return { pose, elapsed, shotElapsed, shotClip, shotDuration, armed: p.firing, dx: p.dx, dy: p.dy };
}

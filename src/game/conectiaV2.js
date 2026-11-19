// Source animation study only. The runtime roster continues using ConectIA v1.
export const CONECTIA_V2_PARTS = {
  headIdle: [0, 0, 418, 418], headAim: [418, 0, 418, 418], headJoy: [836, 0, 418, 418],
  tool: [0, 418, 418, 418], aim: [418, 418, 418, 418], recoil: [836, 418, 418, 418],
  wave: [0, 836, 418, 418], thumbsUp: [418, 836, 418, 418], rest: [836, 836, 418, 418],
};

export const CONECTIA_V2_CLIPS = {
  shooting: { frames: 12, fps: 60, duration: 0.2, loop: false, label: "Disparo normal", reducedFrame: 11 },
  burst: { frames: 6, fps: 60, duration: 0.1, loop: false, label: "Ráfaga", reducedFrame: 5 },
  victory: { frames: 72, fps: 24, duration: 3, loop: false, label: "Conexión lograda", reducedFrame: 43 },
};

const base = { headX: 160, headY: 110, headAngle: 0, toolX: 52, toolY: 236, toolAngle: 0, handX: 258, handY: 238, handAngle: 0 };
const key = (frame, head, hand, phase, changes = {}) => ({ frame, head, hand, phase, ...base, ...changes });
const keys = {
  shooting: [
    key(0, "headAim", "aim", "emisión"),
    key(2, "headAim", "recoil", "retroceso", { handX: 249, headX: 159 }),
    key(4, "headAim", "recoil", "recuperación", { handX: 252 }),
    key(7, "headAim", "aim", "recuperación", { handX: 256 }),
    key(11, "headAim", "aim", "apuntado"),
  ],
  burst: [
    key(0, "headAim", "aim", "emisión"),
    key(1, "headAim", "recoil", "retroceso", { handX: 253 }),
    key(2, "headAim", "recoil", "recuperación", { handX: 254 }),
    key(4, "headAim", "aim", "recuperación", { handX: 257 }),
    key(5, "headAim", "aim", "apuntado"),
  ],
  victory: [
    key(0, "headAim", "aim", "entrada"),
    key(6, "headIdle", "rest", "entrada", { handY: 247, toolY: 243 }),
    key(14, "headJoy", "wave", "vitoreo", { toolX: 48, toolY: 190, handY: 198, headY: 104 }),
    key(22, "headJoy", "wave", "vitoreo", { toolX: 48, toolY: 163, toolAngle: -0.07, handY: 178, handAngle: -0.08, headY: 100 }),
    key(28, "headJoy", "wave", "vitoreo", { toolX: 48, toolY: 178, toolAngle: 0.04, handY: 195, handAngle: 0.08, headY: 108 }),
    key(34, "headJoy", "wave", "vitoreo", { toolX: 48, toolY: 160, toolAngle: -0.05, handY: 176, handAngle: -0.08, headY: 100 }),
    key(40, "headJoy", "thumbsUp", "conexión", { toolX: 49, toolY: 170, handX: 265, handY: 199, headY: 104 }),
    key(47, "headJoy", "thumbsUp", "remate", { toolX: 49, toolY: 170, handX: 265, handY: 199, headY: 104 }),
    key(54, "headJoy", "thumbsUp", "salida", { toolY: 199, handX: 262, handY: 218, headY: 106 }),
    key(63, "headIdle", "rest", "salida", { toolY: 230, handY: 239 }),
    key(71, "headIdle", "rest", "reposo"),
  ],
};

export function sampleConectiaV2(name, seconds = 0, reduced = false) {
  const clip = CONECTIA_V2_CLIPS[name];
  if (!clip) throw new Error(`Unknown ConectIA v2 study clip: ${name}`);
  const frame = reduced ? clip.reducedFrame : Math.min(clip.frames - 1, Math.max(0, Number.isFinite(seconds) ? seconds : 0) * clip.fps);
  const sequence = keys[name];
  let index = 0;
  while (index < sequence.length - 1 && sequence[index + 1].frame <= frame) index++;
  const a = sequence[index], b = sequence[Math.min(index + 1, sequence.length - 1)];
  const t = a === b ? 0 : (frame - a.frame) / (b.frame - a.frame), blend = t * t * (3 - 2 * t);
  const result = { ...a, frame, flash: !reduced && name !== "victory" && frame < 1 };
  for (const field of Object.keys(base)) result[field] = a[field] + (b[field] - a[field]) * blend;
  return result;
}

export function conectiaV2Muzzle(sample) {
  // Centers of the cyan muzzle faces, measured on the versioned source atlas.
  const point = { aim: [766, 555], recoil: [1171, 556] }[sample.hand];
  if (!point) return null;
  const [x, y, w, h] = CONECTIA_V2_PARTS[sample.hand];
  return { x: sample.handX + (point[0] - x - w / 2) * 0.24, y: sample.handY + (point[1] - y - h / 2) * 0.24, dx: 1, dy: 0 };
}

export function drawConectiaV2(ctx, image, sample, { x = 0, y = 0, size = 320 } = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(size / 320, size / 320);
  for (const [name, px, py, angle, scale] of [
    ["tool", sample.toolX, sample.toolY, sample.toolAngle, 0.28],
    [sample.hand, sample.handX, sample.handY, sample.handAngle, 0.24],
    [sample.head, sample.headX, sample.headY, sample.headAngle, 0.5],
  ]) {
    const rect = CONECTIA_V2_PARTS[name];
    ctx.save(); ctx.translate(px, py); ctx.rotate(angle);
    ctx.drawImage(image, ...rect, -rect[2] * scale / 2, -rect[3] * scale / 2, rect[2] * scale, rect[3] * scale);
    ctx.restore();
  }
  const muzzle = conectiaV2Muzzle(sample);
  if (sample.flash && muzzle) {
    ctx.fillStyle = "#b9ffff"; ctx.beginPath(); ctx.ellipse(muzzle.x + 4, muzzle.y, 7, 2.5, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

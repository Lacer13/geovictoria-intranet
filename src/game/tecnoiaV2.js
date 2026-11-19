// TecnoIA v2 animation study. Kept separate from the published v1 roster until
// the fixed-step firing events and complete fallback are integrated.
export const TECNOIA_V2_PARTS = {
  headIdle: [32, 12, 400, 390],
  headAim: [442, 12, 400, 390],
  headJoy: [854, 12, 400, 390],
  tool: [112, 418, 224, 405],
  aim: [432, 462, 380, 284],
  recoil: [850, 474, 368, 270],
  waveOpen: [32, 834, 366, 400],
  waveCurl: [452, 832, 344, 400],
  rest: [852, 900, 376, 334],
};

export const TECNOIA_V2_CLIPS = {
  shooting: { frames: 12, fps: 60, duration: 0.2, loop: false, label: "Disparo", reducedFrame: 11 },
  victory: { frames: 60, fps: 24, duration: 2.5, loop: false, label: "Celebración", reducedFrame: 33 },
};

const base = { headX: 167, headY: 110, headAngle: 0, toolX: 60, toolY: 235, toolAngle: 0, handX: 265, handY: 243, handAngle: 0 };
const numeric = Object.keys(base);
const key = (frame, head, hand, phase, changes = {}) => ({ frame, head, hand, phase, ...base, ...changes });
const victory = [
  key(0, "headAim", "aim", "entrada", { handX: 254, handY: 231 }),
  key(5, "headIdle", "rest", "entrada", { handY: 249, toolY: 242, headY: 113 }),
  key(11, "headJoy", "waveCurl", "gesto", { toolX: 52, toolY: 186, toolAngle: -0.08, handX: 268, handY: 230, headY: 106 }),
  key(17, "headJoy", "waveOpen", "saludo", { toolX: 51, toolY: 170, toolAngle: -0.12, handX: 268, handY: 201, handAngle: -0.12, headY: 103 }),
  key(21, "headJoy", "waveCurl", "saludo", { toolX: 51, toolY: 170, toolAngle: -0.10, handX: 264, handY: 197, handAngle: 0.10, headY: 104 }),
  key(25, "headJoy", "waveOpen", "saludo", { toolX: 51, toolY: 170, toolAngle: -0.12, handX: 268, handY: 201, handAngle: -0.12, headY: 103 }),
  key(29, "headJoy", "waveCurl", "saludo", { toolX: 51, toolY: 170, toolAngle: -0.10, handX: 264, handY: 197, handAngle: 0.10, headY: 104 }),
  key(33, "headJoy", "waveOpen", "remate", { toolX: 51, toolY: 170, toolAngle: -0.10, handX: 268, handY: 204, headY: 104 }),
  key(40, "headJoy", "waveOpen", "salida", { toolX: 51, toolY: 170, toolAngle: -0.10, handX: 268, handY: 204, headY: 104 }),
  key(48, "headIdle", "waveCurl", "salida", { toolX: 56, toolY: 217, handX: 265, handY: 230, headY: 109 }),
  key(55, "headIdle", "rest", "salida"),
  key(59, "headIdle", "rest", "reposo"),
];
const shooting = [
  key(0, "headAim", "aim", "emisión", { handX: 254, handY: 231 }),
  key(2, "headAim", "recoil", "retroceso", { handX: 243, handY: 232, headX: 166, headY: 111 }),
  key(4, "headAim", "recoil", "recuperación", { handX: 246, handY: 231, headX: 166 }),
  key(7, "headAim", "aim", "recuperación", { handX: 252, handY: 231 }),
  key(11, "headAim", "aim", "apuntado", { handX: 254, handY: 231 }),
];

export function sampleTecnoiaV2(clipName, seconds = 0, reduced = false) {
  const clip = TECNOIA_V2_CLIPS[clipName];
  if (!clip) throw new Error(`Unknown TecnoIA v2 clip: ${clipName}`);
  const frame = reduced ? clip.reducedFrame : Math.min(clip.frames - 1, Math.max(0, Number.isFinite(seconds) ? seconds : 0) * clip.fps);
  const keys = clipName === "victory" ? victory : shooting;
  let index = 0;
  while (index < keys.length - 1 && keys[index + 1].frame <= frame) index++;
  const a = keys[index], b = keys[Math.min(index + 1, keys.length - 1)];
  const progress = a === b ? 0 : (frame - a.frame) / (b.frame - a.frame);
  const blend = progress * progress * (3 - 2 * progress);
  const result = { ...a, frame, flash: !reduced && clipName === "shooting" && frame < 1.5 };
  for (const name of numeric) result[name] = a[name] + (b[name] - a[name]) * blend;
  return result;
}

export function tecnoiaV2PartTransforms(sample) {
  return [
    { part: "tool", x: sample.toolX, y: sample.toolY, angle: sample.toolAngle, scale: 0.29 },
    { part: sample.hand, x: sample.handX, y: sample.handY, angle: sample.handAngle, scale: 0.26 },
    { part: sample.head, x: sample.headX, y: sample.headY, angle: sample.headAngle, scale: 0.48 },
  ];
}

export function tecnoiaV2Muzzle(sample) {
  // Measured centers of the illustrated cyan muzzle faces in the source PNG.
  const sourcePoint = { aim: [777, 552], recoil: [1188, 563] }[sample.hand];
  if (!sourcePoint) return null;
  const rect = TECNOIA_V2_PARTS[sample.hand];
  const px = (sourcePoint[0] - rect[0] - rect[2] / 2) * 0.26;
  const py = (sourcePoint[1] - rect[1] - rect[3] / 2) * 0.26;
  const cos = Math.cos(sample.handAngle), sin = Math.sin(sample.handAngle);
  return { x: sample.handX + px * cos - py * sin, y: sample.handY + px * sin + py * cos, dx: cos, dy: sin };
}

export function drawTecnoiaV2(ctx, image, sample, { x = 0, y = 0, size = 320 } = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 320, size / 320);
  for (const part of tecnoiaV2PartTransforms(sample)) {
    const rect = TECNOIA_V2_PARTS[part.part];
    ctx.save();
    ctx.translate(part.x, part.y);
    ctx.rotate(part.angle);
    ctx.drawImage(image, ...rect, -rect[2] * part.scale / 2, -rect[3] * part.scale / 2, rect[2] * part.scale, rect[3] * part.scale);
    ctx.restore();
  }
  const muzzle = tecnoiaV2Muzzle(sample);
  if (sample.flash && muzzle) {
    ctx.fillStyle = "#b9ffff";
    ctx.beginPath();
    ctx.ellipse(muzzle.x + 5, muzzle.y, 9, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

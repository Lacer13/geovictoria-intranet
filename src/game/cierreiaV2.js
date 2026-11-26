// CierreIA: illustrated expressions and hands; local coordinates are a 320 px stage.
export const CIERREIA_V2_PARTS = {
  headIdle: [65, 45, 370, 365],
  headAim: [440, 45, 380, 365],
  headJoy: [835, 45, 365, 365],
  tool: [75, 425, 325, 385],
  aim: [430, 490, 375, 300],
  recoil: [820, 490, 370, 300],
  wave: [75, 810, 335, 385],
  thumbsUp: [455, 825, 315, 350],
  rest: [840, 885, 350, 295],
};
export const CIERREIA_V2_CLIPS = {
  shooting: {
    frames: 12,
    fps: 60,
    duration: 0.2,
    loop: false,
    reducedFrame: 11,
    label: "Disparo",
  },
  closing: {
    frames: 18,
    fps: 60,
    duration: 0.3,
    loop: false,
    reducedFrame: 17,
    label: "Gran cierre",
  },
  victory: {
    frames: 72,
    fps: 24,
    duration: 3,
    loop: false,
    reducedFrame: 42,
    label: "Acuerdo cerrado",
  },
};
const base = {
  headX: 145,
  headY: 110,
  headAngle: 0,
  toolX: 50,
  toolY: 240,
  toolAngle: 0,
  handX: 227,
  handY: 241,
  handAngle: 0,
};
const key = (frame, head, hand, phase, changes = {}) => ({
  frame,
  head,
  hand,
  phase,
  ...base,
  ...changes,
});
// The existing large shot is born 16 px right and 1 px above the basic center.
const closingShift = {
  handX: base.handX + (16 * 320) / 112,
  handY: base.handY - 320 / 112,
};
const keys = {
  shooting: [
    key(0, "headAim", "aim", "emisión"),
    key(2, "headAim", "recoil", "retroceso", { handX: 219 }),
    key(5, "headAim", "recoil", "recuperación", { handX: 222 }),
    key(11, "headAim", "aim", "apuntado"),
  ],
  closing: [
    key(0, "headAim", "aim", "emisión potente", closingShift),
    key(3, "headAim", "recoil", "retroceso potente", {
      ...closingShift,
      handX: closingShift.handX - 14,
      toolY: 236,
      headX: 142,
    }),
    key(8, "headAim", "recoil", "recuperación", {
      ...closingShift,
      handX: closingShift.handX - 8,
      toolY: 237,
    }),
    key(17, "headAim", "aim", "apuntado"),
  ],
  victory: [
    key(0, "headAim", "aim", "entrada"),
    key(8, "headIdle", "rest", "preparación", { handY: 250 }),
    key(18, "headJoy", "rest", "presenta el maletín", {
      toolX: 65,
      toolY: 210,
      toolAngle: -0.04,
      headY: 106,
    }),
    key(30, "headJoy", "thumbsUp", "acuerdo", {
      toolX: 75,
      toolY: 208,
      handY: 215,
      headY: 114,
      headAngle: 0.035,
    }),
    key(42, "headJoy", "thumbsUp", "acuerdo cerrado", {
      toolX: 75,
      toolY: 208,
      handY: 215,
      headY: 107,
    }),
    key(50, "headJoy", "thumbsUp", "remate", {
      toolX: 75,
      toolY: 208,
      handY: 215,
      headY: 107,
    }),
    key(61, "headIdle", "rest", "salida", {
      toolX: 57,
      toolY: 230,
      handY: 247,
    }),
    key(71, "headIdle", "rest", "reposo"),
  ],
};
export function sampleCierreiaV2(name, seconds = 0, reduced = false) {
  const clip = CIERREIA_V2_CLIPS[name];
  if (!clip) throw Error("Unknown CierreIA clip: " + name);
  const frame = reduced
    ? clip.reducedFrame
    : Math.min(
        clip.frames - 1,
        Math.max(0, Number.isFinite(seconds) ? seconds : 0) * clip.fps,
      );
  const sequence = keys[name];
  let i = 0;
  while (i < sequence.length - 1 && sequence[i + 1].frame <= frame) i++;
  const a = sequence[i],
    b = sequence[Math.min(i + 1, sequence.length - 1)];
  const t = a === b ? 0 : (frame - a.frame) / (b.frame - a.frame),
    blend = t * t * (3 - 2 * t);
  const result = {
    ...a,
    frame,
    flash: !reduced && name !== "victory" && frame < 1,
    strong: name === "closing",
  };
  for (const field of Object.keys(base))
    result[field] = a[field] + (b[field] - a[field]) * blend;
  return result;
}
export function cierreiaV2Muzzle(sample) {
  const point = { aim: [763, 584], recoil: [1146, 588] }[sample.hand];
  if (!point) return null;
  const [x, y, w, h] = CIERREIA_V2_PARTS[sample.hand];
  return {
    x: sample.handX + (point[0] - x - w / 2) * 0.22,
    y: sample.handY + (point[1] - y - h / 2) * 0.22,
    dx: 1,
    dy: 0,
  };
}
export function drawCierreiaV2(
  ctx,
  image,
  sample,
  { x = 0, y = 0, size = 320 } = {},
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 320, size / 320);
  for (const [name, px, py, angle, scale] of [
    ["tool", sample.toolX, sample.toolY, sample.toolAngle, 0.28],
    [sample.hand, sample.handX, sample.handY, sample.handAngle, 0.22],
    [sample.head, sample.headX, sample.headY, sample.headAngle, 0.5],
  ]) {
    const r = CIERREIA_V2_PARTS[name];
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle);
    ctx.drawImage(
      image,
      ...r,
      (-r[2] * scale) / 2,
      (-r[3] * scale) / 2,
      r[2] * scale,
      r[3] * scale,
    );
    ctx.restore();
  }
  const muzzle = cierreiaV2Muzzle(sample);
  if (sample.flash && muzzle) {
    ctx.fillStyle = sample.strong ? "#ffe7a0" : "#b9ffff";
    ctx.beginPath();
    ctx.ellipse(
      muzzle.x + 3,
      muzzle.y,
      sample.strong ? 8 : 6,
      sample.strong ? 6 : 2.5,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.restore();
}

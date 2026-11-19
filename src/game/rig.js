import { clipProgress } from "./animation.js";

export function sampleRig(
  pose = "idle",
  elapsed = 0,
  character = {},
  reduced = false,
) {
  const progress = clipProgress(pose, elapsed);
  const phase = progress * Math.PI * 2;
  const wave = reduced ? 0 : Math.sin(phase);
  const pulse = reduced ? 0 : Math.sin(Math.min(1, progress) * Math.PI);
  const mood = (character.personality || 0) / 11;
  const result = {
    bob: wave * 13,
    tilt: 0,
    head: wave * 0.012,
    headY: 0,
    tool: -0.04 + Math.sin(phase + 0.4) * (reduced ? 0 : 0.035),
    hand: wave * 0.07,
    handY: wave * 7,
    toolY: -wave * 9,
    alpha: 1,
    stretch: 1,
  };
  if (pose === "moving") {
    result.tool -= 0.12;
    result.hand += 0.08;
    result.bob = wave * 17;
    result.toolY += Math.sin(phase + 1) * (reduced ? 0 : 9);
  }
  if (pose === "shooting") {
    result.tool -= pulse * 0.32;
    result.toolY += pulse * 32;
    result.hand -= pulse * 0.23;
    result.headY += pulse * 8;
  }
  if (pose === "dash") {
    result.tilt -= pulse * 0.13;
    result.stretch += pulse * 0.04;
    result.tool -= pulse * 0.3;
    result.handY += pulse * 35;
  }
  if (pose === "damage") {
    result.head += wave * 0.09 * (1 - progress);
    result.headY += pulse * 18;
    result.hand += pulse * 0.25;
  }
  if (pose === "power") {
    result.toolY -= pulse * (65 + mood * 70);
    result.tool -= pulse * (0.12 + mood * 0.18);
    result.handY -= pulse * 100;
    result.hand += pulse * (0.2 - mood * 0.25);
    result.head -= pulse * 0.04;
  }
  if (pose === "defeat") {
    const settle = 1 - Math.pow(1 - progress, 3);
    result.head = settle * 0.14;
    result.headY = settle * 20;
    result.handY = settle * 80;
    result.toolY = settle * 75;
    result.tool = settle * 0.15;
    result.bob = 0;
  }
  if (pose === "victory") {
    const gestures = {
      wave: () => {
        result.handY = -110 + wave * 18;
        result.hand = -0.18 + wave * 0.24;
      },
      bow: () => {
        result.head = pulse * 0.14;
        result.headY = pulse * 34;
        result.toolY = -30;
        result.hand = -pulse * 0.12;
      },
      balance: () => {
        result.toolY = wave * 60 - 30;
        result.handY = -wave * 60 - 30;
        result.head = -wave * 0.05;
      },
      cheer: () => {
        result.toolY = -110 - wave * 32;
        result.handY = -120 + wave * 32;
        result.hand = -0.25;
        result.bob = wave * 25;
      },
      salute: () => {
        result.handY = -165 + wave * 8;
        result.hand = -0.38 + wave * 0.03;
        result.head = -0.025;
        result.toolY = -45;
      },
      deal: () => {
        result.toolY = -85 + wave * 20;
        result.tool = -0.18 + wave * 0.045;
        result.handY = -115 - wave * 22;
        result.hand = -0.3 + wave * 0.1;
        result.head = wave * 0.045;
      },
      bell: () => {
        result.tool = wave * 0.32;
        result.toolY = -100 + wave * 12;
        result.handY = -75;
        result.hand = -wave * 0.2;
      },
      link: () => {
        result.toolY = -60 + wave * 25;
        result.handY = -60 - wave * 25;
        result.tool = -0.2 + wave * 0.12;
        result.hand = 0.1 - wave * 0.12;
      },
      prism: () => {
        result.toolY = -140 + wave * 25;
        result.tool = -0.1 + wave * 0.18;
        result.head = wave * 0.06;
        result.handY = -40;
      },
      heart: () => {
        result.toolY = -85 + wave * 14;
        result.tool = -0.15;
        result.handY = -95;
        result.hand = -0.15 + wave * 0.11;
        result.head = wave * 0.055;
      },
      scan: () => {
        result.head = wave * 0.08;
        result.tool = wave * 0.22;
        result.toolY = -70;
        result.handY = -125 + wave * 12;
        result.hand = -0.2;
      },
      bounce: () => {
        result.bob = wave * 32;
        result.tilt = wave * 0.04;
        result.toolY = -100 - wave * 22;
        result.handY = -100 + wave * 22;
        result.hand = -0.23;
      },
    };
    (gestures[character.celebration] || gestures.wave)();
  }
  if (reduced) {
    result.bob = 0;
    result.tilt = 0;
    result.head = 0;
    result.tool = -0.04;
    result.hand = 0;
    result.handY = 0;
    result.toolY = 0;
    result.headY = 0;
    result.stretch = 1;
  }
  return result;
}

export function drawRig(
  ctx,
  image,
  parts,
  character,
  x,
  y,
  size,
  pose,
  elapsed,
  reduced = false,
) {
  const rig = sampleRig(pose, elapsed, character, reduced);
  ctx.save();
  ctx.translate(x, y + (rig.bob * size) / 1200);
  ctx.rotate(rig.tilt);
  ctx.scale((size / 1200) * rig.stretch, size / 1200);
  const part = (key, px, py, maxW, maxH, angle) => {
    const source = parts[key];
    const ratio = Math.min(maxW / source[2], maxH / source[3]);
    const width = source[2] * ratio,
      height = source[3] * ratio;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle);
    ctx.drawImage(image, ...source, -width / 2, -height / 2, width, height);
    ctx.restore();
  };
  part("head", 0, -100 + rig.headY, 800, 750, rig.head);
  part("tool", -350, 250 + rig.toolY, 360, 480, rig.tool);
  part("hand", 350, 250 + rig.handY, 385, 410, rig.hand);
  ctx.restore();
}

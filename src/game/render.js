import { WIDTH, HEIGHT } from "./simulation.js";
import { characterPose, rigPose, TECNOIA_PARTS } from "./characters.js";
import { drawRig } from "./rig.js";
import { spriteFrame } from "./animation.js";
import { activePower } from "./powers.js";
import { characterAnimation } from "./characterAnimation.js";
import { atlasFrame, drawAtlasFrame } from "./spriteAtlas.js";

function rounded(ctx, x, y, width, height, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fill();
}

function fallbackRobot(ctx, size, enemy = false, emitter = false) {
  // Recovery art remains a complete head with two floating hands, without a body.
  ctx.save();
  ctx.scale(size / 100, size / 100);
  rounded(ctx, -36, -35, 72, 64, 24, enemy ? "#be4150" : "#e8f3f0");
  rounded(ctx, -28, -25, 56, 42, 18, "#113b43");
  ctx.fillStyle = enemy ? "#ffe09f" : "#8af1e0";
  for (const x of [-13, 13]) {
    ctx.beginPath();
    ctx.ellipse(x, -7, 6, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  rounded(ctx, -49, 20, 17, 23, 8, "#e8f3f0");
  rounded(ctx, 32, emitter ? 0 : 20, 17, 23, 8, "#e8f3f0");
  ctx.restore();
}

export function drawCharacter(
  ctx,
  character,
  image,
  x,
  y,
  size,
  pose = "idle",
  seconds = 0,
  reduced = false,
  { sprite = null, lean = 0, animation = null, presentation = null, showEmitter = pose === "shooting" } = {},
) {
  ctx.save();
  ctx.translate(x, y);
  const rig = rigPose(pose, seconds, reduced);
  const fallbackEmission = !animation && character.animation?.version === 2 && showEmitter;
  ctx.globalAlpha *= rig.alpha;
  if (animation?.version === 2) {
    const view = presentation || { pose, elapsed: seconds };
    const implementation = characterAnimation(character);
    const overlay = (view.armed || view.shotElapsed !== null && view.shotElapsed < (view.shotDuration || 0.2)) &&
      !["shooting", "burst", "aim", "victory", "defeat"].includes(view.pose);
    const useParts = animation.source && (overlay || !animation.atlas || view.pose === "moving");
    if (useParts) {
      const sample = implementation.sample(view.pose, view.elapsed, reduced, view);
      implementation.draw(ctx, animation.source, sample, {
        x: -implementation.pivot.x * size / 320,
        y: -implementation.pivot.y * size / 320, size,
      });
    } else {
      // If only the atlas survived a source failure, emission takes priority
      // over a head reaction so a visible muzzle remains synchronized.
      const clip = overlay ? view.shotClip || "shooting" : view.pose;
      const elapsed = overlay ? view.shotElapsed ?? view.shotDuration ?? 0.2 : view.elapsed;
      const frame = atlasFrame(animation.atlas, clip, elapsed, reduced);
      drawAtlasFrame(ctx, animation.pages, animation.atlas, clip, elapsed, {
        x: -frame.anchors.pivot.x * size / frame.w,
        y: -frame.anchors.pivot.y * size / frame.h, width: size, reduced,
      });
    }
  } else if (character.type === "rig") {
    ctx.globalAlpha = 1;
    ctx.rotate(fallbackEmission ? 0 : lean);
    if (sprite?.naturalWidth) {
      const frame = spriteFrame(pose, seconds, reduced);
      ctx.drawImage(
        sprite,
        frame.x,
        frame.y,
        frame.width,
        frame.height,
        -size / 2,
        -size / 2,
        size,
        size,
      );
    } else if (image?.naturalWidth)
      drawRig(
        ctx,
        image,
        character.parts || TECNOIA_PARTS,
        character,
        0,
        0,
        size * 0.94,
        pose,
        seconds,
        reduced,
      );
    else fallbackRobot(ctx, size, false, fallbackEmission);
  } else if (image?.naturalWidth) {
    ctx.translate(0, reduced ? 0 : Math.sin(seconds * 5) * size * 0.025);
    ctx.rotate(rig.tilt);
    const cols = character.cols || 2,
      rows = character.rows || 2;
    let row = 0,
      col = 0;
    if (character.type === "spritesheet") {
      row = pose === "shooting" ? 1 : pose === "defeat" ? 3 : 0;
      col = reduced ? 0 : Math.floor(seconds * 12) % cols;
      // The historical damage/death frames contain star-shaped sparks. Keep
      // the intact bow pose and use the shared rig reaction instead.
      if (pose === "defeat") col = 0;
    } else {
      const frame = pose === "shooting" ? 1 : 0;
      col = frame % 2;
      row = Math.floor(frame / 2);
    }
    ctx.drawImage(
      image,
      (col * image.naturalWidth) / cols,
      (row * image.naturalHeight) / rows,
      image.naturalWidth / cols,
      image.naturalHeight / rows,
      -size / 2,
      -size / 2,
      size,
      size,
    );
  } else fallbackRobot(ctx, size);
  if (fallbackEmission) {
    // A small recovery projector stays visible even if every bitmap failed.
    // Its muzzle uses the unchanged basic-shot center relative to the actor.
    const mx = size * 52 / 112, my = size * 7 / 112;
    rounded(ctx, mx - size * 0.12, my - size * 0.035, size * 0.12, size * 0.07, size * 0.02, "#176cbb");
    ctx.fillStyle = "#88ffff";
    ctx.beginPath(); ctx.ellipse(mx, my, size * 0.018, size * 0.03, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function tree(ctx, x, y, size, lights) {
  ctx.fillStyle = "#133f36";
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x - size * 0.43, y);
  ctx.lineTo(x + size * 0.43, y);
  ctx.fill();
  ctx.fillStyle = "#2d5a4c";
  ctx.beginPath();
  ctx.moveTo(x, y - size * 0.95);
  ctx.lineTo(x - size * 0.26, y - size * 0.33);
  ctx.lineTo(x + size * 0.26, y - size * 0.33);
  ctx.fill();
  if (lights)
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i % 2 ? "#f9dc95" : "#ed7c86";
      ctx.beginPath();
      ctx.arc(
        x + Math.sin(i * 2) * size * 0.22,
        y - size * (0.18 + i * 0.11),
        2.5,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
}

function background(ctx, tick, reduced) {
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, "#061c25");
  sky.addColorStop(0.65, "#153d3c");
  sky.addColorStop(1, "#88b8ad");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "#f4e5b8";
  ctx.beginPath();
  ctx.arc(800, 80, 31, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 13; i++) {
    const offset = reduced ? 0 : tick * 0.25;
    tree(
      ctx,
      ((((i * 109 - offset) % (WIDTH + 180)) + WIDTH + 180) % (WIDTH + 180)) -
        90,
      390,
      160 + (i % 3) * 40,
      i % 2 === 0,
    );
  }
  ctx.fillStyle = "#d7e9e3";
  ctx.beginPath();
  ctx.moveTo(0, 430);
  ctx.bezierCurveTo(250, 390, 410, 475, 660, 427);
  ctx.bezierCurveTo(800, 390, 870, 440, WIDTH, 413);
  ctx.lineTo(WIDTH, HEIGHT);
  ctx.lineTo(0, HEIGHT);
  ctx.fill();
  ctx.fillStyle = "#f0f7f3";
  ctx.beginPath();
  ctx.moveTo(0, 492);
  ctx.bezierCurveTo(230, 460, 660, 535, WIDTH, 480);
  ctx.lineTo(WIDTH, HEIGHT);
  ctx.lineTo(0, HEIGHT);
  ctx.fill();
  // Christmas lights and round snowflakes; decorative marks are never attached to characters.
  ctx.strokeStyle = "#526e60";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 4);
  ctx.quadraticCurveTo(WIDTH / 2, 80, WIDTH, 4);
  ctx.stroke();
  for (let i = 0; i < 20; i++) {
    const x = i * 50 + 10,
      y = 4 + 37 * Math.sin((Math.PI * x) / WIDTH);
    rounded(
      ctx,
      x,
      y,
      6,
      10,
      3,
      i % 3 === 0 ? "#f4d58b" : i % 3 === 1 ? "#dd5961" : "#b3d5c1",
    );
  }
  ctx.fillStyle = "#ffffffa0";
  for (let i = 0; i < (reduced ? 15 : 45); i++) {
    const x = (i * 137 + (reduced ? 0 : tick * 0.3)) % WIDTH;
    const y = (i * 97 + (reduced ? 0 : tick * (0.3 + (i % 3) * 0.15))) % HEIGHT;
    ctx.beginPath();
    ctx.arc(x, y, i % 3 === 0 ? 2 : 1, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEnemy(ctx, entity, image, boss = false) {
  ctx.save();
  ctx.translate(entity.x + entity.width / 2, entity.y + entity.height / 2);
  if (entity.flash) ctx.filter = "brightness(1.8)";
  if (image?.naturalWidth) {
    if (!boss) ctx.scale(-1, 1);
    const source = boss
      ? [0, 0, image.naturalWidth / 2, image.naturalHeight / 2]
      : [485, 670, 340, 300];
    ctx.drawImage(
      image,
      ...source,
      -entity.width / 2,
      -entity.height / 2,
      entity.width,
      entity.height,
    );
  } else fallbackRobot(ctx, entity.width, true);
  ctx.restore();
}

const PICKUPS = {
  heal: ["+", "#be334d"],
  shield: ["E", "#236b9a"],
  dual: ["II", "#946514"],
  spread: ["III", "#76529a"],
  bomb: ["B", "#a43a45"],
};

export function drawGame(
  ctx,
  state,
  images,
  character,
  { reduced = false, seconds = state.tick / 60, actor = null, animation = null, presentation = null } = {},
) {
  ctx.save();
  background(ctx, state.tick, reduced);
  if (!reduced && state.shake > 0.5)
    ctx.translate(
      Math.sin(state.tick * 2.3) * state.shake,
      (Math.cos(state.tick * 3.1) * state.shake) / 2,
    );
  for (const pickup of state.pickups) {
    const [label, color] = PICKUPS[pickup.type];
    rounded(ctx, pickup.x, pickup.y, 36, 36, 7, color);
    ctx.fillStyle = "#f9dc95";
    ctx.fillRect(pickup.x + 15, pickup.y, 6, 36);
    ctx.fillRect(pickup.x, pickup.y + 15, 36, 6);
    ctx.fillStyle = "white";
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(label, pickup.x + 18, pickup.y - 5);
  }
  for (const bullet of state.bullets)
    rounded(
      ctx,
      bullet.x,
      bullet.y,
      bullet.width,
      bullet.height,
      3,
      bullet.enemy ? "#ed6372" : "#faf3bd",
    );
  for (const enemy of state.enemies)
    drawEnemy(ctx, enemy, images["/Robot combatiente.png"]);
  if (state.boss) {
    const b = state.boss;
    if (b.shot <= 30) {
      ctx.fillStyle = "#f4536938";
      ctx.fillRect(0, b.y + b.height / 2 - 8, b.x, 26);
      ctx.setLineDash([12, 10]);
      ctx.strokeStyle = "#ffa1a9";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, b.y + b.height / 2 + 5);
      ctx.lineTo(b.x, b.y + b.height / 2 + 5);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#fff1cf";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("¡ESQUIVA!", b.x + b.width, b.y - 27);
    }
    drawEnemy(ctx, b, images["/Boss.png"], true);
    rounded(ctx, b.x, b.y - 18, b.width, 10, 5, "#30222c");
    rounded(ctx, b.x, b.y - 18, (b.width * b.hp) / b.maxHp, 10, 5, "#f07b88");
  }
  const p = state.player;
  const centerX = p.x + p.width / 2,
    centerY = p.y + p.height / 2;
  if (state.barrier) {
    const b = state.barrier;
    rounded(ctx, b.x, b.y, b.width, b.height, 8, "#f1dc9bb0");
    ctx.strokeStyle = "#fff4cc";
    ctx.lineWidth = 2;
    ctx.strokeRect(b.x - 4, b.y - 3, b.width + 8, b.height + 6);
  }
  if (p.powerTimer > 0 && p.power !== "dash") {
    ctx.save();
    ctx.strokeStyle = character.accent || "#e6d0ff";
    ctx.lineWidth = 3;
    const age = state.tick - p.activatedAt;
    let radius = 70;
    if (p.power === "pulse" || p.power === "calm")
      radius = reduced
        ? 90
        : Math.min(p.power === "pulse" ? 420 : 300, age * 12);
    if (p.power === "recover")
      radius = 65 + (reduced ? 0 : Math.sin(age / 7) * 8);
    if (p.power !== "barrier") {
      ctx.globalAlpha = 0.65;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (activePower(p, "reflect")) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, 77, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (activePower(p, "magnet"))
      for (const gift of state.pickups) {
        if (Math.hypot(gift.x - centerX, gift.y - centerY) < 500) {
          ctx.setLineDash([5, 9]);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(gift.x + 18, gift.y + 18);
          ctx.stroke();
        }
      }
    ctx.restore();
  }
  if (p.shield || p.grace || p.dash) {
    ctx.strokeStyle = p.shield ? "#8ef0e1" : "#fff1c0";
    ctx.lineWidth = p.dash ? 5 : 2;
    ctx.beginPath();
    ctx.ellipse(
      centerX,
      centerY,
      p.width / 2 + 4,
      p.height / 2 + 4,
      0,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
  }
  drawCharacter(
    ctx,
    character,
    images[character.src],
    centerX,
    centerY,
    p.width,
    actor?.pose || characterPose(p, state.phase),
    actor?.elapsed ?? seconds,
    reduced,
    { sprite: images[character.sprite], lean: animation ? 0 : actor?.lean || 0, animation, presentation,
      showEmitter: Boolean(p.firing || p.shot > 0) },
  );
  if (!reduced)
    for (const particle of state.particles) {
      ctx.globalAlpha = particle.life / 28;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
  ctx.globalAlpha = 1;
  for (const text of state.texts) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, text.life / 20);
    ctx.fillStyle = text.color;
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#102e32";
    ctx.lineWidth = 4;
    ctx.strokeText(text.text, Math.max(150, text.x), Math.max(55, text.y));
    ctx.fillText(text.text, Math.max(150, text.x), Math.max(55, text.y));
    ctx.restore();
  }
  ctx.restore();
}

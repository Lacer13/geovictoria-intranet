import { greetingAtlasParts, greetingPose } from "../../lib/santaGreeting.js";

function ellipse(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}
function path(ctx, commands, color, stroke = null, width = 1) {
  const shape = new Path2D(commands);
  ctx.fillStyle = color;
  ctx.fill(shape);
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke(shape);
  }
}
function star(ctx, x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5,
      radius = i % 2 ? size * 0.46 : size;
    if (!i) ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
    else ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}
function bauble(ctx, x, y, size, color) {
  ctx.fillStyle = "#b79042";
  ctx.fillRect(x - size * 0.22, y - size - 3, size * 0.44, 5);
  const fill = ctx.createRadialGradient(
    x - size * 0.3,
    y - size * 0.4,
    1,
    x,
    y,
    size,
  );
  fill.addColorStop(0, "#fff4cd");
  fill.addColorStop(0.32, color);
  fill.addColorStop(1, "#8c5138");
  ellipse(ctx, x, y, size, size, fill);
  ellipse(
    ctx,
    x - size * 0.28,
    y - size * 0.3,
    size * 0.14,
    size * 0.2,
    "#fff9e3aa",
  );
}

function tree(ctx, pose, accent) {
  ellipse(ctx, 555, 353, 155, 13, "#174a3620");
  path(ctx, "M519 309 L589 309 L582 351 Q554 362 526 351 Z", "#ad2938");
  path(ctx, "M550 312 L560 312 L558 356 L548 356 Z", "#e5bb66");
  const green = ctx.createLinearGradient(405, 100, 680, 320);
  green.addColorStop(0, "#548c64");
  green.addColorStop(0.5, "#28694d");
  green.addColorStop(1, "#164c3e");
  ctx.save();
  ctx.shadowColor = "#10382f26";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 6;
  path(
    ctx,
    "M553 66 Q532 118 491 155 Q506 157 518 153 Q487 195 452 222 Q470 226 487 219 Q460 265 416 300 Q551 355 692 300 Q647 265 621 219 Q638 226 655 222 Q617 193 590 153 Q603 157 618 155 Q576 116 553 66 Z",
    green,
  );
  ctx.restore();
  path(
    ctx,
    "M491 155 Q549 180 618 155 Q576 167 553 154 Q524 167 491 155",
    "#a6c5a65c",
  );
  path(
    ctx,
    "M452 222 Q550 253 655 222 Q594 235 552 223 Q502 236 452 222",
    "#a6c5a64f",
  );
  ctx.strokeStyle = "#ddb76f";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(525, 133);
  ctx.bezierCurveTo(573, 164, 619, 191, 491, 210);
  ctx.bezierCurveTo(463, 232, 583, 242, 634, 279);
  ctx.stroke();
  for (const [x, y, color] of [
    [551, 143, "#d95854"],
    [587, 202, accent],
    [529, 245, "#d95854"],
    [605, 283, "#e7bc5f"],
    [473, 284, accent],
  ])
    bauble(ctx, x, y, 10, color);
  if (pose.decorated) bauble(ctx, 496, 190, 13, "#efc167");
  for (const [x, y] of [
    [535, 153],
    [572, 174],
    [584, 191],
    [519, 204],
    [492, 223],
    [546, 238],
    [592, 253],
    [622, 273],
    [512, 286],
    [572, 308],
  ]) {
    ctx.save();
    ctx.globalAlpha = 0.2 + pose.lights * 0.8;
    ctx.shadowColor = "#ffdf8a";
    ctx.shadowBlur = 12 * pose.lights;
    ellipse(ctx, x, y, 3.5, 3.5, "#ffe3a0");
    ctx.restore();
  }
  ctx.save();
  ctx.shadowColor = "#f2c465";
  ctx.shadowBlur = 16 * pose.lights;
  star(ctx, 553, 54, 23, "#edc66e");
  star(ctx, 550, 51, 12, "#fff1bd");
  ctx.restore();
  // Small wrapped gifts ground the tree without covering the character's hands.
  path(ctx, "M626 321 L677 318 L680 354 L628 358 Z", "#d45a55");
  path(ctx, "M646 320 L657 319 L660 356 L648 357 Z", "#f5da9b");
  path(ctx, "M445 326 L485 326 L485 353 L445 353 Z", "#e4be70");
  path(ctx, "M460 326 L469 326 L469 353 L460 353 Z", "#36806a");
}

function reindeer(ctx, pose) {
  const fur = ctx.createLinearGradient(741, 225, 840, 330);
  fur.addColorStop(0, "#efc58b");
  fur.addColorStop(0.6, "#bd7d45");
  fur.addColorStop(1, "#8c532e");
  ellipse(ctx, 793, 356, 78, 10, "#6b47211c");
  ctx.save();
  ctx.translate(0, pose.bob * 0.5);
  path(ctx, "M744 269 Q720 253 716 267 Q721 286 749 289 Z", "#bb7943");
  for (const [x, y] of [
    [758, 302],
    [781, 305],
    [808, 302],
    [826, 299],
  ]) {
    ctx.save();
    if (x === 826) {
      ctx.translate(x, y);
      ctx.rotate(pose.deerWave);
      ctx.translate(-x, -y);
    }
    path(
      ctx,
      `M${x - 6} ${y} Q${x - 9} 326 ${x - 7} 343 Q${x} 350 ${x + 8} 344 L${x + 10} ${y} Z`,
      fur,
    );
    path(
      ctx,
      `M${x - 8} 337 Q${x} 334 ${x + 9} 338 L${x + 9} 347 Q${x} 354 ${x - 9} 348 Z`,
      "#60402d",
    );
    ctx.restore();
  }
  ellipse(ctx, 787, 286, 58, 42, fur);
  ellipse(ctx, 804, 295, 30, 27, "#f5dbac");
  path(ctx, "M803 268 Q800 247 814 224 L848 235 L838 282 Z", fur);
  ctx.save();
  ctx.translate(836, 214);
  ctx.rotate(pose.deerNod);
  ctx.translate(-836, -214);
  ctx.strokeStyle = "#8f6845";
  ctx.lineWidth = 9;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const direction of [-1, 1]) {
    ctx.save();
    ctx.translate(835, 167);
    ctx.scale(direction, 1);
    ctx.beginPath();
    ctx.moveTo(16, 3);
    ctx.quadraticCurveTo(38, -22, 31, -51);
    ctx.moveTo(33, -23);
    ctx.lineTo(50, -35);
    ctx.moveTo(32, -39);
    ctx.lineTo(17, -48);
    ctx.stroke();
    ctx.restore();
  }
  ellipse(ctx, 796, 181, 25, 13, fur);
  ellipse(ctx, 797, 179, 14, 6, "#e8a58a");
  ellipse(ctx, 871, 180, 24, 13, fur);
  ellipse(ctx, 868, 179, 13, 6, "#e8a58a");
  ellipse(ctx, 835, 211, 44, 46, fur);
  ellipse(ctx, 819, 204, 11, 15, "#fff5df");
  ellipse(ctx, 849, 204, 11, 15, "#fff5df");
  for (const x of [821, 847]) {
    ellipse(ctx, x, 205, 7, 10, "#214d54");
    ellipse(ctx, x + 1, 207, 4, 7, "#183039");
    ellipse(ctx, x - 2, 202, 2.5, 3, "#ffffff");
  }
  ellipse(ctx, 837, 234, 29, 20, "#f7dfb7");
  const nose = ctx.createRadialGradient(835, 222, 1, 839, 226, 14);
  nose.addColorStop(0, "#ffb0a2");
  nose.addColorStop(0.35, "#e65e59");
  nose.addColorStop(1, "#a72939");
  ellipse(ctx, 839, 226, 14, 11, nose);
  ctx.strokeStyle = "#744d35";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(830, 243);
  ctx.quadraticCurveTo(838, 250, 846, 242);
  ctx.stroke();
  ellipse(ctx, 802, 223, 7, 4, "#d4816477");
  ellipse(ctx, 869, 221, 6, 4, "#d4816477");
  ctx.restore();
  path(ctx, "M807 253 Q824 264 846 250 L849 262 Q825 279 803 265 Z", "#b93748");
  path(ctx, "M809 263 L822 269 L814 298 L802 293 Z", "#d45557");
  ellipse(ctx, 826, 273, 7, 8, "#d8ae54");
  ellipse(ctx, 824, 270, 2, 2, "#fff2bc");
  ctx.restore();
}

export function drawGreetingScene(ctx, image, character, seconds) {
  const pose = greetingPose(seconds);
  ctx.clearRect(0, 0, 1000, 420);
  const glow = ctx.createRadialGradient(530, 220, 20, 530, 220, 420);
  glow.addColorStop(0, "#f2dc9b20");
  glow.addColorStop(1, "#f2dc9b00");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 1000, 420);
  ellipse(ctx, 510, 360, 405, 24, "#d6e7dc40");
  for (const [x, y, size] of [
    [130, 91, 5],
    [389, 64, 7],
    [712, 105, 5],
    [912, 250, 7],
    [98, 265, 6],
    [718, 47, 4],
  ])
    star(ctx, x, y, size, "#d2b67599");
  tree(ctx, pose, character.accent);
  reindeer(ctx, pose);
  ellipse(ctx, 250, 352, 114, 11, "#174a3614");
  const parts = greetingAtlasParts(character.parts);
  const part = (key, x, y, maxW, maxH, angle = 0) => {
    const rect = parts[key],
      scale = Math.min(maxW / rect[2], maxH / rect[3]);
    ctx.save();
    ctx.translate(x, y + pose.bob);
    ctx.rotate(angle);
    ctx.drawImage(
      image,
      ...rect,
      (-rect[2] * scale) / 2,
      (-rect[3] * scale) / 2,
      rect[2] * scale,
      rect[3] * scale,
    );
    ctx.restore();
  };
  part("tool", 151, 286, 97, 127, -0.08);
  part("head", 250, 174, 214, 216, pose.headAngle);
  part("hand", pose.handX, pose.handY, 107, 116, pose.handAngle);
  if (!pose.decorated)
    bauble(ctx, pose.handX + 25, pose.handY - 1 + pose.bob, 13, "#efc167");
}

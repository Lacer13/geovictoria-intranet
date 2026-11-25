import atlas from "../../../public/enemies/desfase/sprites-v1.json" with { type: "json" };
import { atlasFrame } from "../../../src/game/spriteAtlas.js";
import { ENEMY_ATLAS_URL, enemyMuzzle } from "../../../src/game/enemyAnimation.js";
import { drawEnemy, drawGame } from "../../../src/game/render.js";
import { createGame, emptyInput, stepGame } from "../../../src/game/simulation.js";
import { LEGACY_CHARACTERS } from "../../../src/game/characters.js";
const get = id => document.getElementById(id), canvas = document.querySelector("canvas"), ctx = canvas.getContext("2d");
let images = {}, elapsed = 0, previous = null, playing = true, game;
get("reduced").checked = matchMedia("(prefers-reduced-motion: reduce)").matches;
function reset() {
  elapsed = 0; previous = null; game = createGame("victoria_classic"); game.bossSpawned = true; game.player.grace = 100000;
  game.boss = { x: 730, y: 170, width: 160, height: 160, hp: 25, maxHp: 25, dy: 1.6, shot: 100, flash: 0, bornAt: -100 };
  game.enemies.push({ x: 530, y: 335, width: 80, height: 80, speed: 0.35, pattern: "shooter", shot: 70, bornAt: -100, flash: 0 });
}
function paint() {
  const clip = get("clip").value, reduced = get("reduced").checked, size = Number(get("size").value), source = get("fallback").checked ? {} : images;
  if (clip === "battle") {
    drawGame(ctx, game, source, LEGACY_CHARACTERS[0], { reduced });
    get("frame").textContent = `${game.tick} pasos`; get("time").disabled = true;
  } else {
    ctx.fillStyle = "#102d36"; ctx.fillRect(0, 0, 960, 540);
    const e = { x: 480 - size / 2, y: 240 - size / 2, width: size, height: size, shot: 100, bornAt: -1000 };
    let tick = elapsed * 60;
    if (clip === "charge") e.shot = Math.max(0.01, 30 - tick);
    if (clip === "shooting") e.lastShotAt = 0;
    if (clip === "damage") e.hurtAt = 0;
    if (clip === "defeat") e.defeatedAt = 0;
    if (clip === "arrival") e.bornAt = 0;
    // Hold terminal frames in the review without changing gameplay selectors.
    const frame = atlasFrame(atlas, clip, elapsed, reduced);
    if (!["charge", "defeat", "arrival", "idle", "moving"].includes(clip)) tick = Math.min(tick, 17.99);
    if (clip === "moving") e.pattern = "scout";
    drawEnemy(ctx, e, source, tick, clip !== "moving", reduced);
    const muzzle = enemyMuzzle(e, clip !== "moving");
    if (get("anchor").checked) { ctx.strokeStyle = "#e7cb8c"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(muzzle.x, muzzle.y, 7, 0, Math.PI * 2); ctx.stroke(); }
    if (clip === "shooting" && elapsed < 0.3) { ctx.fillStyle = "#ef8791"; ctx.fillRect(muzzle.x - elapsed * 420 - 24, muzzle.y - 3, 24, 6); }
    get("time").disabled = false; get("time").max = atlas.clips[clip].frames.length - 1; get("time").value = frame.index;
    get("frame").textContent = `${frame.index + 1} / ${atlas.clips[clip].frames.length}`;
    ctx.fillStyle = "#e9d5a6"; ctx.font = "20px system-ui"; ctx.textAlign = "center"; ctx.fillText(get("clip").selectedOptions[0].textContent, 480, 450);
  }
}
function loop(now) {
  const delta = previous === null ? 0 : Math.min(0.1, (now - previous) / 1000) * Number(get("speed").value); previous = now;
  if (playing) {
    elapsed += delta;
    if (get("clip").value === "battle") {
      while (game.tick < Math.floor(elapsed * 60)) stepGame(game, emptyInput(), { random: () => 0.99 });
      if (elapsed > 8) reset();
    } else if (elapsed > atlas.clips[get("clip").value].duration + 0.5) elapsed = 0;
  }
  paint(); requestAnimationFrame(loop);
}
get("play").onclick = () => { playing = !playing; previous = null; get("play").textContent = playing ? "Pausar" : "Reproducir"; };
get("clip").onchange = reset;
get("time").oninput = () => { playing = false; get("play").textContent = "Reproducir"; elapsed = Number(get("time").value) / atlas.clips[get("clip").value].fps; paint(); };
document.addEventListener("visibilitychange", () => { previous = null; });
try {
  for (const path of [ENEMY_ATLAS_URL, LEGACY_CHARACTERS[0].src]) images[path] = await new Promise((resolve, reject) => {
    const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = path;
  });
  get("status").textContent = "Sprites listos. La carga avisa el ataque y el proyectil nace en el cañón.";
  reset(); requestAnimationFrame(loop);
} catch { get("status").textContent = "No se pudo cargar el arte. Abre esta revisión desde Vite."; }

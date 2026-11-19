import { atlasFrame, drawAtlasFrame, validateAnimationAtlas } from "./spriteAtlas.js";

const get = id => document.getElementById(id);
const canvas = document.querySelector("canvas"), ctx = canvas.getContext("2d");
let atlas, images, elapsed = 0, previous = null, playing = false;
const comparison = { frames: Array(72), fps: 60, duration: 1.2, label: "Normal frente a Ráfaga" };
for (const element of document.querySelectorAll("button,input,select")) element.disabled = true;
get("reduced").checked = matchMedia("(prefers-reduced-motion: reduce)").matches;
const selected = () => get("clip").value === "comparison" ? comparison : atlas.clips[get("clip").value];
const pause = () => { playing = false; previous = null; get("play").textContent = "Reproducir"; };

function actor(name, time, x, width, repeat = false) {
  const reduced = get("reduced").checked, clip = atlas.clips[name];
  const phaseTime = repeat ? time % clip.duration : time;
  const y = 20 + (320 - width) / 2;
  const frame = drawAtlasFrame(ctx, images, atlas, name, phaseTime, { x, y, width, reduced });
  if (get("anchor").checked && frame.anchors.muzzle) {
    ctx.strokeStyle = "#e59337"; ctx.lineWidth = 2; ctx.beginPath();
    ctx.arc(x + frame.anchors.muzzle.x * width / 320, y + frame.anchors.muzzle.y * width / 320, 5, 0, Math.PI * 2); ctx.stroke();
  }
  if (name !== "victory" && !reduced) {
    const origin = atlasFrame(atlas, name, 0).anchors.muzzle;
    ctx.fillStyle = get("light").checked ? "#047c91" : "#a6fbff";
    for (let event = 0; event <= (repeat ? Math.floor(time / clip.duration) : 0); event++) {
      const age = time - event * clip.duration;
      ctx.beginPath(); ctx.ellipse(x + origin.x * width / 320 + age * 600, y + origin.y * width / 320, 8, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    }
  }
  return frame;
}

function paint() {
  if (!atlas) return;
  const name = get("clip").value, clip = selected(), reduced = get("reduced").checked;
  ctx.fillStyle = get("light").checked ? "#e4edf0" : "#12333c"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const time = Math.min(elapsed, (clip.frames.length - 1) / clip.fps);
  let frame;
  if (name === "comparison") {
    for (const [column, action] of [[0, "shooting"], [1, "burst"]]) {
      ctx.save(); ctx.beginPath(); ctx.rect(column * 480, 0, 480, 420); ctx.clip();
      actor(action, time, column * 480 + 10, Number(get("size").value), true);
      ctx.fillStyle = get("light").checked ? "#163541" : "#d4eef3"; ctx.font = "20px system-ui";
      const count = reduced ? "Sin movimiento" : `${Math.floor((Math.floor(time * 60 + 1e-8)) / (action === "burst" ? 6 : 12)) + 1} emisiones`;
      ctx.fillText(`${atlas.clips[action].label} · ${count}`, column * 480 + 20, 380); ctx.restore();
    }
    frame = { index: Math.floor(time * 60 + 1e-8), phase: "comparación de cadencias" };
  } else {
    const width = Number(get("size").value);
    frame = actor(name, elapsed, 220 - width / 2, width);
    ctx.fillStyle = get("light").checked ? "#163541" : "#d4eef3"; ctx.font = "22px system-ui"; ctx.fillText(clip.label, 460, 115);
    ctx.font = "18px system-ui"; ctx.fillText(`${frame.phase} · ${clip.fps} fotogramas/s`, 460, 153);
    ctx.fillText(reduced ? "Pose reconocible sin movimiento" : name === "victory" ? "Una reproducción; final en reposo" : `${clip.duration} s · recuperación antes de la siguiente emisión`, 460, 191);
  }
  get("time").value = frame.index;
  get("frame").textContent = `${frame.index + 1}/${clip.frames.length} · ${frame.phase}`;
}

function loop(now) {
  if (playing) {
    if (previous !== null) elapsed += Math.min(0.1, (now - previous) / 1000) * Number(get("speed").value);
    previous = now;
    if (elapsed >= selected().duration) { elapsed = selected().duration; pause(); }
    paint();
  }
  requestAnimationFrame(loop);
}
get("play").onclick = () => {
  if (!atlas || get("reduced").checked) return;
  if (playing) return pause();
  if (elapsed >= selected().duration) elapsed = 0;
  playing = true; previous = null; get("play").textContent = "Pausar";
};
get("restart").onclick = () => { pause(); elapsed = 0; paint(); };
get("clip").onchange = () => { pause(); elapsed = 0; get("time").max = selected().frames.length - 1; paint(); };
get("time").oninput = () => { pause(); elapsed = Number(get("time").value) / selected().fps; paint(); };
for (const id of ["size", "anchor", "light"]) get(id).onchange = paint;
get("reduced").onchange = () => { pause(); get("play").disabled = get("reduced").checked; paint(); };
document.addEventListener("visibilitychange", () => { if (document.hidden) pause(); });
try {
  const base = new URL("./revision-v2-secuencias-01/", document.baseURI);
  const response = await fetch(new URL("secuencias.json", base));
  if (!response.ok) throw new Error("No se encontraron los metadatos");
  atlas = validateAnimationAtlas(await response.json());
  images = await Promise.all(atlas.pages.map(page => new Promise((resolve, reject) => {
    const image = new Image(); image.onload = () => resolve(image); image.onerror = () => reject(new Error("No se pudo cargar una hoja")); image.src = new URL(page.image, base);
  })));
  for (const element of document.querySelectorAll("button,input,select")) element.disabled = false;
  get("play").disabled = get("reduced").checked;
  get("status").textContent = "Estudio original: 90 fotogramas en tres clips. El piloto de /juego ya integra 221 sprites, eventos de disparo, sonido y recuperación ante fallos. Esta página conserva las secuencias fuente.";
  paint(); requestAnimationFrame(loop);
} catch (error) {
  pause(); for (const element of document.querySelectorAll("button,input,select")) element.disabled = true;
  get("status").textContent = `No se pudo abrir la revisión: ${error.message}. Inicia Vite y abre esta página desde el servidor local.`;
}

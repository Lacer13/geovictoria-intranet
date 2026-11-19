import { atlasFrame, drawAtlasFrame, validateAnimationAtlas } from "./spriteAtlas.js";

const get = (id) => document.getElementById(id);
const canvas = document.querySelector("canvas"), ctx = canvas.getContext("2d");
let atlas, images, elapsed = 0, previous = null, playing = false;
for (const element of document.querySelectorAll("button,input,select")) element.disabled = true;
get("reduced").checked = matchMedia("(prefers-reduced-motion: reduce)").matches;
const pause = () => { playing = false; get("play").textContent = "Reproducir"; previous = null; };
function paint() {
  if (!atlas) return;
  const name = get("clip").value, reduced = get("reduced").checked;
  const width = Number(get("size").value), x = 220 - width / 2, y = 20 + (320 - width) / 2;
  ctx.fillStyle = get("light").checked ? "#e4edf0" : "#12333c";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const frame = drawAtlasFrame(ctx, images, atlas, name, elapsed, { x, y, width, reduced });
  const muzzle = frame.anchors.muzzle;
  if (muzzle && get("anchor").checked) {
    ctx.strokeStyle = "#e59337"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x + muzzle.x * width / 320, y + muzzle.y * width / 320, 5, 0, Math.PI * 2); ctx.stroke();
  }
  if (name === "shooting" && !reduced) {
    const origin = atlasFrame(atlas, name, 0).anchors.muzzle;
    ctx.fillStyle = get("light").checked ? "#047c91" : "#9df9ff";
    ctx.beginPath(); ctx.ellipse(x + origin.x * width / 320 + elapsed * 600, y + origin.y * width / 320, 9, 2.5, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = get("light").checked ? "#163541" : "#d4eef3";
  ctx.font = "22px system-ui"; ctx.fillText(atlas.clips[name].label, 460, 115);
  ctx.font = "18px system-ui"; ctx.fillText(`${frame.phase} · ${atlas.clips[name].fps} fotogramas/s`, 460, 153);
  ctx.fillText(reduced ? "Pose reconocible sin movimiento" : name === "victory" ? "Una reproducción; final en reposo" : "Una emisión; regreso al apuntado", 460, 191);
  get("time").value = frame.index;
  get("frame").textContent = `${frame.index + 1}/${atlas.clips[name].frames.length} · ${frame.phase}`;
}
function loop(now) {
  if (playing) {
    if (previous !== null) elapsed += Math.min(0.1, (now - previous) / 1000) * Number(get("speed").value);
    previous = now;
    if (elapsed >= atlas.clips[get("clip").value].duration) { elapsed = atlas.clips[get("clip").value].duration; pause(); }
    paint();
  }
  requestAnimationFrame(loop);
}
get("play").onclick = () => {
  if (!atlas || get("reduced").checked) return;
  if (playing) return pause();
  if (elapsed >= atlas.clips[get("clip").value].duration) elapsed = 0;
  playing = true; previous = null; get("play").textContent = "Pausar";
};
get("restart").onclick = () => { pause(); elapsed = 0; paint(); };
get("clip").onchange = () => { pause(); elapsed = 0; get("time").max = atlas.clips[get("clip").value].frames.length - 1; paint(); };
get("time").oninput = () => { pause(); elapsed = Number(get("time").value) / atlas.clips[get("clip").value].fps; paint(); };
for (const id of ["size", "anchor", "light"]) get(id).onchange = paint;
get("reduced").onchange = () => { pause(); get("play").disabled = get("reduced").checked; paint(); };
document.addEventListener("visibilitychange", () => { if (document.hidden) pause(); });
try {
  const base = new URL("./revision-v2-secuencias-01/", document.baseURI);
  const response = await fetch(new URL("secuencias.json", base));
  if (!response.ok) throw new Error("No se encontraron los metadatos");
  atlas = validateAnimationAtlas(await response.json());
  images = await Promise.all(atlas.pages.map((page) => new Promise((resolve, reject) => {
    const image = new Image(); image.onload = () => resolve(image); image.onerror = () => reject(new Error("No se pudo cargar una hoja"));
    image.src = new URL(page.image, base);
  })));
  for (const element of document.querySelectorAll("button,input,select")) element.disabled = false;
  get("play").disabled = get("reduced").checked;
  get("status").textContent = "Fuente con alfa limpio y 72 fotogramas exportados. Pendientes: conectar eventos de la simulación, sonido y recuperación si falla un recurso v2.";
  paint(); requestAnimationFrame(loop);
} catch (error) {
  pause(); for (const element of document.querySelectorAll("button,input,select")) element.disabled = true;
  get("status").textContent = `No se pudo abrir la revisión: ${error.message}. Inicia Vite y abre esta página desde el servidor local.`;
}

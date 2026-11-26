export const SCENERY = Object.fromEntries(["bosque", "taller", "faro"].map(id => [id, `/scenery/${id}-v1.webp`]));
const cache = new Map();
const sceneId = id => Object.hasOwn(SCENERY, id) ? id : "bosque";

export function getScenery(id) { return cache.get(sceneId(id))?.image || null; }
export function loadScenery(id) {
  const key = sceneId(id);
  if (cache.has(key)) return cache.get(key).promise;
  const entry = {};
  cache.set(key, entry);
  entry.promise = new Promise(resolve => {
    const image = new Image();
    let settled = false;
    const finish = success => {
      if (settled) return;
      settled = true; clearTimeout(timer); image.onload = null; image.onerror = null;
      if (success) entry.image = image; else cache.delete(key);
      resolve(success ? image : null);
    };
    const timer = setTimeout(() => finish(false), 8000);
    image.onload = () => finish(image.naturalWidth > 0 && image.naturalHeight > 0);
    image.onerror = () => finish(false);
    image.src = SCENERY[key];
  });
  return entry.promise;
}

export function drawScenery(ctx, image, tick, reduced, width, height) {
  const iw = image?.naturalWidth || image?.width, ih = image?.naturalHeight || image?.height;
  if (!iw || !ih) return false;
  ctx.save();
  const scale = Math.max(width / iw, height / ih) * 1.045;
  const dx = reduced ? 0 : Math.sin(tick / 420) * 9, dy = reduced ? 0 : Math.sin(tick / 630) * 2;
  ctx.drawImage(image, (width - iw * scale) / 2 + dx, (height - ih * scale) / 2 + dy, iw * scale, ih * scale);
  // Quiet contrast behind white armor and projectiles; depth stays decorative.
  const shade = ctx.createLinearGradient(0, 0, 0, height);
  shade.addColorStop(0, "#071a3020"); shade.addColorStop(0.65, "#07172738"); shade.addColorStop(1, "#07172700");
  ctx.fillStyle = shade; ctx.fillRect(0, 0, width, height);
  const drift = reduced ? 0 : Math.sin(tick / 170) * 26;
  ctx.fillStyle = "#a6d5e420"; ctx.beginPath(); ctx.moveTo(0, height - 19);
  ctx.bezierCurveTo(width * .25 + drift, height - 39, width * .68 + drift, height + 8, width, height - 25);
  ctx.lineTo(width, height); ctx.lineTo(0, height); ctx.fill();
  ctx.strokeStyle = "#e5f4ff8c"; ctx.lineWidth = 1;
  for (let i = 0; i < 22; i++) {
    const x = (i * 137 + (reduced ? 0 : tick * (i % 3 === 0 ? .45 : .18))) % width;
    const y = (i * 97 + (reduced ? 0 : tick * (i % 3 === 0 ? .6 : .25))) % height;
    const r = i % 3 === 0 ? 3 : 1.5;
    ctx.beginPath();
    for (let arm = 0; arm < 3; arm++) { const a = arm * Math.PI / 3; ctx.moveTo(x - Math.cos(a) * r, y - Math.sin(a) * r); ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
    ctx.stroke();
  }
  ctx.restore(); return true;
}

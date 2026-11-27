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

const palettes = {
  bosque: { distant: "#245a5680", near: "#123e36", snow: "#bddde5", mist: "#a9d7e2" },
  taller: { distant: "#365c7880", near: "#173b51", snow: "#c2e2f1", mist: "#b1daf0" },
  faro: { distant: "#63558080", near: "#35365b", snow: "#d5cae9", mist: "#d0c1ec" },
};
const wrap = (value, span) => ((value % span) + span) % span;

function pine(ctx, x, floor, size, color, snow) {
  ctx.fillStyle = color;
  ctx.fillRect(x - size * .035, floor - size * .65, size * .07, size * .65);
  const shade=ctx.createLinearGradient(x-size*.3,0,x+size*.3,0);
  shade.addColorStop(0,color);shade.addColorStop(.55,color);shade.addColorStop(1,"#091d2b90");
  for (let tier = 0; tier < 3; tier++) {
    const y = floor - size + tier * size * .22, half = size * (.15 + tier * .06);
    ctx.fillStyle=shade;ctx.beginPath();ctx.moveTo(x,y);
    ctx.quadraticCurveTo(x+half*.25,y+size*.18,x+half,y+size*.4);
    ctx.quadraticCurveTo(x+half*.3,y+size*.46,x,y+size*.38);
    ctx.quadraticCurveTo(x-half*.3,y+size*.46,x-half,y+size*.4);
    ctx.quadraticCurveTo(x-half*.25,y+size*.18,x,y);ctx.closePath();ctx.fill();
    ctx.strokeStyle=snow;ctx.lineWidth=Math.max(1,size*.018);ctx.globalAlpha*=.35;
    ctx.beginPath();ctx.moveTo(x-half*.72,y+size*.31);ctx.quadraticCurveTo(x,y+size*.39,x+half*.7,y+size*.31);ctx.stroke();
    ctx.globalAlpha/=.35;
  }
}

function depthLayers(ctx, tick, reduced, width, height, id) {
  const seconds = reduced ? 0 : tick / 60, palette = palettes[sceneId(id)];
  // Separate speeds give a readable sense of forward travel without tiling the illustration.
  ctx.save();ctx.globalAlpha = .35;
  for (let i = 0; i < 6; i++) {
    const x = wrap(i * width / 6 - seconds * width * .009 + 80, width + 160) - 80;
    pine(ctx,x,height+5,height*(.075+(i%3)*.016),palette.distant,palette.snow);
  }
  ctx.restore();
  for (let layer = 0; layer < 2; layer++) {
    const y = height * (.91 + layer * .055), phase = seconds * (18 + layer * 24);
    ctx.save();ctx.globalAlpha = layer ? .17 : .12;
    const haze = ctx.createLinearGradient(0,y-height*.06,0,height);
    haze.addColorStop(0,palette.mist+"00");haze.addColorStop(.45,palette.mist);haze.addColorStop(1,palette.snow);
    ctx.fillStyle = haze;ctx.beginPath();ctx.moveTo(-20,height);
    for(let x=-20;x<=width+100;x+=80)ctx.lineTo(x,y+Math.sin((x+phase)/150)*height*.012);
    ctx.lineTo(width+100,height);ctx.closePath();ctx.fill();ctx.restore();
  }
  ctx.save();ctx.globalAlpha = .65;
  for (let i = 0; i < 3; i++) {
    const x = wrap(i * (width + 240) / 3 - seconds * width * .045 + 120, width + 240) - 120;
    const size = height * (.14 + (i%2)*.035);
    if(id === "taller") {
      const y=height-size*.65;
      ctx.fillStyle=palette.near;ctx.fillRect(x-3,y,6,height-y);
      const glow=ctx.createRadialGradient(x,y,0,x,y,size*.3);glow.addColorStop(0,"#ffdd9c60");glow.addColorStop(1,"#ffdd9c00");
      ctx.fillStyle=glow;ctx.fillRect(x-size*.3,y-size*.3,size*.6,size*.6);
      ctx.fillStyle="#eacb8e";ctx.fillRect(x-4,y-7,8,12);
    } else pine(ctx,x,height+18,size,palette.near,palette.snow);
  }
  ctx.restore();
}

export function drawScenery(ctx, image, tick, reduced, width, height, id = "bosque") {
  const iw = image?.naturalWidth || image?.width, ih = image?.naturalHeight || image?.height;
  if (!iw || !ih) return false;
  ctx.save();
  const scale = Math.max(width / iw, height / ih) * 1.10;
  // Keep the lighthouse at the right edge in view throughout its camera cycle.
  const dx = id === "faro" ? width * (-.03 + (reduced ? 0 : Math.sin(tick/300)*.015)) : reduced ? 0 : Math.sin(tick / 300) * width * .022;
  const dy = reduced ? 0 : Math.sin(tick / 470) * height * .007;
  const left = (width - iw * scale) / 2 + dx, top = (height - ih * scale) / 2 + dy;
  ctx.drawImage(image, left, top, iw * scale, ih * scale);
  // Quiet contrast behind white armor and projectiles; depth stays decorative.
  const shade = ctx.createLinearGradient(0, 0, 0, height);
  shade.addColorStop(0, "#071a3020"); shade.addColorStop(0.65, "#07172738"); shade.addColorStop(1, "#07172700");
  ctx.fillStyle = shade; ctx.fillRect(0, 0, width, height);
  if(id === "faro") {
    const x=left+iw*scale*.957,y=top+ih*scale*.276;
    const sweep = reduced ? -.22 : -.22 + Math.sin(tick/240)*.18;
    const light=ctx.createRadialGradient(x,y,0,x,y,width*.8);light.addColorStop(0,"#ffdf9b24");light.addColorStop(1,"#ffdf9b00");
    ctx.fillStyle=light;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-width*.9,y+width*(sweep-.12));ctx.lineTo(x-width*.9,y+width*(sweep+.12));ctx.closePath();ctx.fill();
  }
  depthLayers(ctx,tick,reduced,width,height,id);
  for (let i = 0; i < 30; i++) {
    const near = i % 3 === 0, seconds = reduced ? 0 : tick / 60;
    const x = wrap(i * 137 - seconds * (near ? 57 : 15), width+16)-8;
    const y = wrap(i * 97 + seconds * (near ? 36 : 13), height+16)-8;
    const r = near ? 3 : 1.4;
    ctx.strokeStyle=near?"#e5f4ff9c":"#e5f4ff50";ctx.lineWidth=near?1.2:.8;
    ctx.beginPath();
    for (let arm = 0; arm < 3; arm++) { const a = arm * Math.PI / 3; ctx.moveTo(x - Math.cos(a) * r, y - Math.sin(a) * r); ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
    ctx.stroke();
  }
  ctx.restore(); return true;
}

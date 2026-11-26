import { AREA_CHARACTERS } from "./roster.js";
import { sampleRig } from "./rig.js";
import { validateAnimationAtlas } from "./spriteAtlas.js";
import { ENEMY_ATLAS_URL } from "./enemyAnimation.js";
export { AREA_CHARACTERS } from "./roster.js";

export const LEGACY_CHARACTERS = [
  {
    id: "victoria_classic",
    name: "VictorIA",
    area: "Clásica",
    src: "/Sprinn nuevo Victoria.png",
    type: "poses",
    cols: 2,
    rows: 2,
    cost: 0,
    description: "La compañera original de tus pausas.",
  },
  {
    id: "victoria_st",
    name: "VictorIA ST",
    area: "Soporte técnico · edición anterior",
    src: "/victoria_st_spritesheet.png",
    type: "spritesheet",
    cols: 5,
    rows: 4,
    cost: 500,
    description: "Tu desbloqueo de la edición anterior se conserva.",
  },
];
export const CHARACTERS = [...AREA_CHARACTERS, ...LEGACY_CHARACTERS];

export const FREE_CHARACTERS = CHARACTERS.filter((c) => c.cost === 0).map(
  (c) => c.id,
);
export const ASSET_SOURCES = [ENEMY_ATLAS_URL, "/Boss.png", "/Robot combatiente.png"];

// Manually verified padded source rectangles; the generated parts remain intact.
export const TECNOIA_PARTS = {
  head: [35, 35, 620, 570],
  tool: [760, 30, 365, 575],
  hand: [95, 670, 495, 520],
};

export function characterPose(player, phase = "playing") {
  if (phase === "victory") return "victory";
  if (phase === "gameover") return "defeat";
  if (player.hurt) return "damage";
  if (player.dash) return "dash";
  if (player.powerAnimation) return "power";
  if (player.shot > 0) return "shooting";
  if (player.dx || player.dy) return "moving";
  return "idle";
}

export function rigPose(pose, seconds, reduced = false) {
  return sampleRig(pose, seconds, { celebration: "wave" }, reduced);
}

const assetCache = new Map();
const manifestCache = new Map();
function loadImages(sources, onProgress = () => {}) {
  const images = {};
  const failed = [];
  let complete = 0;
  return Promise.all(
    sources.map(async (src) => {
      if (!assetCache.has(src)) {
        assetCache.set(
          src,
          new Promise((resolve) => {
            const img = new Image();
            let settled = false;
            const finish = (success) => {
              if (settled) return;
              settled = true;
              clearTimeout(timeout);
              img.onload = null;
              img.onerror = null;
              resolve(success ? img : null);
            };
            const timeout = setTimeout(() => finish(false), 10000);
            img.onload = () => finish(img.naturalWidth > 0);
            img.onerror = () => finish(false);
            img.src = src;
          }),
        );
      }
      const image = await assetCache.get(src);
      if (!image) {
        failed.push(src);
        assetCache.delete(src);
      }
      images[src] = image;
      onProgress(++complete / sources.length);
      return image;
    }),
  ).then(() => {
    for (const key of assetCache.keys()) {
      if (assetCache.size <= 6) break;
      if (!ASSET_SOURCES.includes(key) && !sources.includes(key)) assetCache.delete(key);
    }
    return { images, failed };
  });
}

async function loadManifest(url) {
  if (!manifestCache.has(url)) manifestCache.set(url, (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error("Animation metadata unavailable");
      return validateAnimationAtlas(await response.json());
    } finally { clearTimeout(timeout); }
  })());
  try { return await manifestCache.get(url); }
  catch (error) { manifestCache.delete(url); throw error; }
}

export async function loadAssets(onProgress = () => {}, character = CHARACTERS[0], { retry = false } = {}) {
  let progress = 0;
  const report = (value) => { progress = Math.max(progress, value); onProgress(progress); };
  if (retry) { assetCache.clear(); manifestCache.clear(); }
  const common = await loadImages(ASSET_SOURCES, (p) => report(p * 0.15));
  const images = common.images, failed = [...common.failed];
  if (character.animation?.version === 2) {
    let atlas = null;
    try {
      atlas = await loadManifest(character.animation.metadata);
      if (atlas.character !== character.id || atlas.kind !== "playable-pilot" || !atlas.productionReady ||
        atlas.pages.some((p) => !/^[a-zA-Z0-9_-]+\.webp$/.test(p.image))) throw new Error("Invalid character manifest");
      for (const name of ["idle", "moving", "shooting", "aim", "dash", "damage", "power", "defeat", "victory"])
        if (!atlas.clips[name]) throw new Error("Incomplete character animation");
      if (character.id === "cierreia" && !atlas.clips.closing) throw new Error("Missing closing animation");
      if (character.id === "conectia" && !atlas.clips.burst) throw new Error("Missing burst animation");
    } catch { failed.push(character.animation.metadata); atlas = null; }
    report(0.25);
    const base = character.animation.metadata.slice(0, character.animation.metadata.lastIndexOf("/") + 1);
    const pagePaths = atlas ? atlas.pages.map((p) => base + p.image) : [];
    const resources = await loadImages([character.animation.src, ...pagePaths], (p) => report(0.25 + p * 0.6));
    Object.assign(images, resources.images); failed.push(...resources.failed);
    const source = images[character.animation.src];
    const sourceValid = source?.naturalWidth === 1254 && source?.naturalHeight === 1254;
    const pages = atlas ? pagePaths.map((p) => images[p]) : [];
    const pagesValid = atlas && pages.every((p, i) => p?.naturalWidth === atlas.pages[i].width && p?.naturalHeight === atlas.pages[i].height);
    if (source && !sourceValid) failed.push(character.animation.src);
    if (atlas) pages.forEach((p, i) => {
      if (p && (p.naturalWidth !== atlas.pages[i].width || p.naturalHeight !== atlas.pages[i].height)) failed.push(pagePaths[i]);
    });
    if (sourceValid || pagesValid) {
      report(1);
      return { images, failed, characterId: character.id,
        animation: { version: 2, source: sourceValid ? source : null, atlas: pagesValid ? atlas : null, pages: pagesValid ? pages : [] } };
    }
  }
  const legacy = await loadImages([character.src, ...(character.sprite ? [character.sprite] : [])], (p) => report(0.85 + p * 0.15));
  Object.assign(images, legacy.images); failed.push(...legacy.failed); report(1);
  return { images, failed: [...new Set(failed)], characterId: character.id, animation: null };
}

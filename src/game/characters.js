import { AREA_CHARACTERS } from "./roster.js";
import { sampleRig } from "./rig.js";
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
export const ASSET_SOURCES = ["/Boss.png", "/Robot combatiente.png"];

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
export function loadAssets(
  onProgress = () => {},
  character = CHARACTERS[0],
  { retry = false } = {},
) {
  const images = {};
  const failed = [];
  let complete = 0;
  const sources = [
    ...new Set([
      ...ASSET_SOURCES,
      character.src,
      ...(character.sprite ? [character.sprite] : []),
    ]),
  ];
  if (retry) for (const src of sources) assetCache.delete(src);
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
      if (!ASSET_SOURCES.includes(key)) assetCache.delete(key);
    }
    return { images, failed, characterId: character.id };
  });
}

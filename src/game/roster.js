import { powerForCharacter } from "./powers.js";
import { CHARACTER_PARTS } from "./characterParts.js";

const entries = [
  ["tecnoia", "TecnoIA", "Operaciones y ST", "#86b8ee", "wave"],
  ["ordenia", "OrdenIA", "Administración", "#d9b86c", "bow"],
  ["balance", "Balance", "Cobranzas", "#d89665", "balance"],
  ["conectia", "ConectIA", "Comercial", "#ef8b8a", "cheer"],
  ["norte", "Norte", "Country Manager", "#99b6e4", "salute"],
  ["cierreia", "CierreIA", "Enterprise", "#86c5ab", "deal"],
  ["festivia", "FestivIA", "Eventos", "#dc8d8c", "bell"],
  ["aliania", "AlianIA", "Partners", "#6bd0c2", "link"],
  ["prisma", "Prisma", "Preventa", "#8ed6e9", "prism"],
  ["armonia", "ArmonIA", "RRHH", "#ccb0eb", "heart"],
  ["radaria", "RadarIA", "SDR", "#bdd879", "scan"],
  ["agilia", "ÁgilIA", "SMB", "#f5af69", "bounce"],
];

export const AREA_CHARACTERS = entries.map(
  ([id, name, area, accent, celebration], index) => ({
    id,
    name,
    area,
    accent,
    celebration,
    personality: index,
    src: `/characters/${id}/rig-navidad-v1.png`,
    sprite: `/characters/${id}/sprites-v1.webp`,
    thumbnail: `/characters/${id}/portrait-v1.webp`,
    metadata: `/characters/${id}/sprites-v1.json`,
    type: "rig",
    cost: 0,
    parts: CHARACTER_PARTS[id],
    power: powerForCharacter(id),
    ...(["tecnoia", "conectia", "cierreia"].includes(id) ? {
      thumbnail: `/characters/${id}/portrait-v2.webp`,
      animation: { version: 2, metadata: `/characters/${id}/sprites-v2.json`, src: `/characters/${id}/rig-navidad-v2.png` },
    } : {}),
  }),
);

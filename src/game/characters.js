export const CHARACTERS = [
  {
    id: "tecnoia",
    name: "TecnoIA",
    area: "Operaciones y ST",
    src: "/characters/tecnoia/rig-navidad-v1.png",
    type: "rig",
    cost: 0,
    description: "El primer guardián navideño del nuevo elenco.",
  },
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

export const FREE_CHARACTERS = CHARACTERS.filter((c) => c.cost === 0).map(
  (c) => c.id,
);
export const ASSET_SOURCES = [
  ...CHARACTERS.map((c) => c.src),
  "/Boss.png",
  "/Robot combatiente.png",
];

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
  if (player.shot > 6) return "shooting";
  if (player.dx || player.dy) return "moving";
  return "idle";
}

export function rigPose(pose, seconds, reduced = false) {
  const wave = reduced ? 0 : Math.sin(seconds * 4);
  const result = {
    bob: wave * 10,
    tilt: 0,
    head: 0,
    tool: -0.04,
    hand: wave * 0.08,
    handY: 0,
    toolY: 0,
    alpha: 1,
    stretch: 1,
  };
  if (pose === "moving") {
    result.tilt = -0.08;
    result.tool = -0.2;
    result.bob *= 1.5;
  }
  if (pose === "shooting") {
    result.tool = -0.35;
    result.hand = -0.3;
    result.handY = -25;
  }
  if (pose === "dash") {
    result.tilt = -0.16;
    result.stretch = 1.06;
    result.tool = -0.5;
  }
  if (pose === "damage") {
    result.head = reduced ? 0 : Math.sin(seconds * 35) * 0.08;
    result.hand = 0.3;
    result.alpha = 0.7;
  }
  if (pose === "victory") {
    result.hand = -0.35 + wave * 0.18;
    result.handY = -150;
    result.toolY = -90;
    result.head = wave * 0.035;
  }
  if (pose === "defeat") {
    result.head = 0.15;
    result.handY = 90;
    result.toolY = 80;
    result.tool = 0.2;
    result.alpha = 0.8;
  }
  return result;
}

export function loadAssets(onProgress = () => {}) {
  const images = {};
  const failed = [];
  let complete = 0;
  return Promise.all(
    ASSET_SOURCES.map(
      (src) =>
        new Promise((resolve) => {
          const img = new Image();
          let settled = false;
          const finish = (success) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            img.onload = null;
            img.onerror = null;
            images[src] = success ? img : null;
            if (!success) failed.push(src);
            onProgress(++complete / ASSET_SOURCES.length);
            resolve();
          };
          const timeout = setTimeout(() => finish(false), 10000);
          img.onload = () => finish(img.naturalWidth > 0);
          img.onerror = () => finish(false);
          img.src = src;
        }),
    ),
  ).then(() => ({ images, failed }));
}

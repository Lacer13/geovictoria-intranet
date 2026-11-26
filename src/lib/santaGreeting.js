import { AREA_CHARACTERS } from "../game/roster.js";

export const GREETING_DURATION = 7.6;
export const GREETING_CHARACTERS = AREA_CHARACTERS.map((character) => ({
  id: character.id,
  name: character.name,
  accent: character.accent,
  parts: character.parts,
  source: character.src,
  fallback: character.thumbnail,
  atlas: `/santa-greetings/${character.id}.webp`,
}));

export function chooseGreetingCharacter(previous = "", random = Math.random) {
  const pool = GREETING_CHARACTERS.filter(
    (character) => character.id !== previous,
  );
  const value = Number(random());
  const index = Math.floor(
    Math.max(0, Math.min(0.999999999, Number.isFinite(value) ? value : 0)) *
      pool.length,
  );
  return pool[index];
}

export function greetingAtlasParts(parts) {
  const slots = {
    head: [0, 0, 256, 256],
    tool: [256, 0, 128, 224],
    hand: [384, 0, 128, 192],
  };
  return Object.fromEntries(
    Object.entries(slots).map(([key, [x, y, width, height]]) => {
      const source = parts[key];
      const scale = Math.min(
        (width - 16) / source[2],
        (height - 16) / source[3],
      );
      const w = Math.round(source[2] * scale),
        h = Math.round(source[3] * scale);
      return [
        key,
        [
          x + Math.floor((width - w) / 2),
          y + Math.floor((height - h) / 2),
          w,
          h,
        ],
      ];
    }),
  );
}

const clamp = (value) => Math.min(1, Math.max(0, value));
const smooth = (value) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};
export function greetingPose(seconds = GREETING_DURATION) {
  const time = Math.min(
    GREETING_DURATION,
    Math.max(0, Number.isFinite(seconds) ? seconds : 0),
  );
  const reach = smooth((time - 0.5) / 1.8) * (1 - smooth((time - 3) / 1.1));
  const hello = smooth((time - 4) / 0.5);
  const wave =
    Math.sin((time - 4.4) * 9) *
    smooth((time - 4.4) / 0.3) *
    (1 - smooth((time - 6.7) / 0.9));
  return {
    time,
    finished: time >= GREETING_DURATION,
    decorated: time >= 2.4,
    handX: 355 + reach * 116,
    handY: 269 - reach * 79 - hello * 82,
    handAngle: reach * -0.35 + hello * -0.12 + wave * 0.27,
    headAngle: reach * 0.055 + wave * -0.012,
    bob: Math.sin(time * 2.4) * 2.5 * (1 - smooth((time - 6.7) / 0.9)),
    deerNod:
      Math.sin((time - 4) * 3) *
      hello *
      0.055 *
      (1 - smooth((time - 6.7) / 0.9)),
    deerWave: hello * (-1.05 + wave * 0.18),
    lights: smooth((time - 2.4) / 1.1),
  };
}

import { readPreference, savePreference } from "../lib/preferences.js";
import { CHARACTERS, FREE_CHARACTERS } from "./characters.js";

export function readGameProfile() {
  let unlocked = [];
  try {
    const saved = JSON.parse(readPreference("geo_unlocked_chars", "[]"));
    if (Array.isArray(saved))
      unlocked = saved.filter((id) => CHARACTERS.some((c) => c.id === id));
  } catch {
    /* Corrupt optional preferences fall back to the free characters. */
  }
  unlocked = [...new Set([...FREE_CHARACTERS, ...unlocked])];
  const selected = readPreference("geo_selected_char", "tecnoia");
  const coins = Number.parseInt(readPreference("geo_total_coins", "0"), 10);
  return {
    coins: Number.isSafeInteger(coins) ? Math.max(0, coins) : 0,
    unlocked,
    selected: unlocked.includes(selected) ? selected : "tecnoia",
  };
}

export function saveGameProfile(profile) {
  savePreference("geo_total_coins", String(profile.coins));
  savePreference("geo_unlocked_chars", JSON.stringify(profile.unlocked));
  savePreference("geo_selected_char", profile.selected);
}

export function readGameSettings() {
  let saved = {};
  try {
    saved = JSON.parse(readPreference("geo_arcade_settings", "{}")) || {};
  } catch {
    /* Optional. */
  }
  return {
    volume: Number.isFinite(saved.volume)
      ? Math.max(0, Math.min(1, saved.volume))
      : 0.25,
    autoFire: saved.autoFire === true,
    reduced:
      typeof saved.reduced === "boolean"
        ? saved.reduced
        : (globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")
            .matches ?? false),
    controls: saved.controls === "large" ? "large" : "normal",
  };
}

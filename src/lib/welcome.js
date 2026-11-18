import { readPreference, savePreference } from "./preferences.js";

const DISMISS_KEY = "geoChristmasWelcomeDismissed:2026-v3";
export function isWelcomeDismissed() {
  return readPreference(DISMISS_KEY, "off") === "on";
}
export function setWelcomeDismissed(value) {
  savePreference(DISMISS_KEY, value ? "on" : "off");
}

const WELCOME_KEY = "geoVictoriaChristmasWelcome2026v3";

export function shouldShowWelcome(pathname) {
  if (pathname !== "/" || isWelcomeDismissed()) return false;
  try {
    return sessionStorage.getItem(WELCOME_KEY) !== "seen";
  } catch {
    return true;
  }
}

export function rememberWelcome() {
  try {
    sessionStorage.setItem(WELCOME_KEY, "seen");
  } catch {
    /* The welcome can still be dismissed when storage is unavailable. */
  }
}

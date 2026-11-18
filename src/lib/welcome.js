const WELCOME_KEY = "geoVictoriaChristmasWelcome2026v3";

export function shouldShowWelcome(pathname) {
  if (pathname !== "/") return false;
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

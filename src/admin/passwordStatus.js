import { auth } from "../auth";
import { isLocalDemo } from "../firebase";
import { needsPasswordSetup } from "../lib/adminPassword";

export async function passwordSetupRequired(user, claims) {
  if (!Object.hasOwn(claims, "passwordSetupAt")) return false;
  const origin = isLocalDemo
    ? `http://127.0.0.1:${Number(import.meta.env.VITE_AUTH_EMULATOR_PORT || 9099)}/identitytoolkit.googleapis.com/v1`
    : "https://identitytoolkit.googleapis.com/v1";
  // Look up only the signed-in user's own account. Tokens and passwords are never logged.
  const response = await fetch(
    `${origin}/accounts:lookup?key=${encodeURIComponent(auth.app.options.apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: await user.getIdToken() }),
      signal: AbortSignal.timeout(12000),
    },
  );
  if (!response.ok)
    throw Error("No pudimos comprobar la configuración de tu contraseña.");
  const result = await response.json();
  const account = result.users?.find((item) => item.localId === user.uid);
  if (!account) throw Error("No pudimos comprobar tu cuenta.");
  return needsPasswordSetup(claims, account.passwordUpdatedAt);
}

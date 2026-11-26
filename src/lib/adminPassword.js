export function needsPasswordSetup(claims, passwordUpdatedAt) {
  if (!Object.hasOwn(claims || {}, "passwordSetupAt")) return false;
  const baseline = Number(claims?.passwordSetupAt);
  if (!Number.isFinite(baseline) || baseline <= 0)
    throw Error(
      "La configuración de tu contraseña necesita revisión del administrador.",
    );
  const updated = Number(passwordUpdatedAt);
  if (!Number.isFinite(updated) || updated <= 0)
    throw Error("No pudimos comprobar la contraseña de tu cuenta.");
  return updated <= baseline;
}

export function validateNewPassword(password, confirmation) {
  if (password.length < 12)
    throw Error("Elige una contraseña de al menos 12 caracteres.");
  if (password !== confirmation)
    throw Error("Las contraseñas deben coincidir.");
  return password;
}

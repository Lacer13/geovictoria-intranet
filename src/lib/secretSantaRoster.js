import { normalizeRoster } from "./secretSanta.js";
export function rosterIssues(rows) {
  const issues = {};
  const addresses = new Map();
  for (const row of rows) {
    if (!row.name.trim() && !row.email.trim()) continue;
    try {
      normalizeRoster([row]);
    } catch (error) {
      issues[row.id] = error.message;
    }
    const email = row.email.trim().toLowerCase();
    if (email) {
      if (addresses.has(email)) {
        issues[row.id] = "Este correo ya está en el grupo.";
        issues[addresses.get(email)] = "Este correo ya está en el grupo.";
      }
      addresses.set(email, row.id);
    }
  }
  return issues;
}

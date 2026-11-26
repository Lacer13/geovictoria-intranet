import { normalize } from "./preferences.js";
import { safeCSV } from "./secretSanta.js";

export function santaPairings(event, term = "", sort = "giver") {
  const query = normalize(term).trim();
  const rows = event.participantIds
    .map((id) => {
      const giver = event.people[id];
      const recipient = event.people[event.assignments[id]?.recipientId];
      return { id, giver, recipient };
    })
    .filter(
      (row) =>
        !query ||
        normalize(
          `${row.giver?.name || ""} ${row.giver?.email || ""} ${row.recipient?.name || ""} ${row.recipient?.email || ""}`,
        ).includes(query),
    );
  return rows.sort(
    (a, b) =>
      String(
        (sort === "recipient" ? a.recipient : a.giver)?.name || "",
      ).localeCompare(
        String((sort === "recipient" ? b.recipient : b.giver)?.name || ""),
        "es",
        { sensitivity: "base" },
      ) || a.id.localeCompare(b.id),
  );
}

export function pairingsColumns(rows, emails = false) {
  return [
    emails
      ? [
          "Entrega",
          "Correo de quien entrega",
          "Recibe",
          "Correo de quien recibe",
        ]
      : ["Entrega", "Recibe"],
    ...rows.map((row) =>
      emails
        ? [
            row.giver?.name || "",
            row.giver?.email || "",
            row.recipient?.name || "Sin asignación",
            row.recipient?.email || "",
          ]
        : [row.giver?.name || "", row.recipient?.name || "Sin asignación"],
    ),
  ];
}

export const pairingsCSV = (rows, emails = false) =>
  safeCSV(pairingsColumns(rows, emails));
export const pairingsTSV = (rows, emails = false) =>
  pairingsColumns(rows, emails)
    .map((row) =>
      row
        .map((value) => {
          const cell = String(value).replace(/[\t\r\n]+/g, " ");
          return /^[\s]*[=+\-@]/.test(cell) ? `'${cell}` : cell;
        })
        .join("\t"),
    )
    .join("\n");

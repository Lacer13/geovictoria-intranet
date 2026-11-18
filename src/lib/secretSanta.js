export const MAX_PARTICIPANTS = 100;
export const CARD_PATTERN = /^[a-f0-9]{64}$/;
export const PERSON_PATTERN = /^[a-f0-9]{32}$/;

export function randomHex(bytes = 32) {
  return [...crypto.getRandomValues(new Uint8Array(bytes))]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");
}
export function randomInt(max) {
  if (!Number.isInteger(max) || max < 1 || max > 0xffffffff)
    throw new Error("Límite de sorteo inválido.");
  const ceiling = Math.floor(0x100000000 / max) * max;
  const values = new Uint32Array(1);
  do {
    crypto.getRandomValues(values);
  } while (values[0] >= ceiling);
  return values[0] % max;
}
export function emptyPerson() {
  return { id: randomHex(16), name: "", email: "" };
}

export function parseParticipantLines(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line, index) => {
      const delimiter = line.includes("\t")
        ? "\t"
        : line.includes(";")
          ? ";"
          : ",";
      const at = line.lastIndexOf(delimiter);
      if (at < 1) throw new Error(`Línea ${index + 1}: usa Nombre; correo.`);
      const name = line.slice(0, at).trim();
      const email = line.slice(at + 1).trim();
      if (/^nombre$/i.test(name) && /^(correo|email)$/i.test(email)) return [];
      return [{ ...emptyPerson(), name, email }];
    });
}

export function normalizeRoster(rows, drawing = false) {
  const people = {};
  const participantIds = [];
  const emails = new Set();
  const populated = rows.filter((row) => row.name?.trim() || row.email?.trim());
  if (populated.length > MAX_PARTICIPANTS)
    throw new Error(
      `Admite hasta ${MAX_PARTICIPANTS} participantes por sorteo.`,
    );
  if (drawing && populated.length < 2)
    throw new Error("Añade al menos dos personas antes de sortear.");
  for (const [index, person] of populated.entries()) {
    const name = String(person.name || "")
      .trim()
      .replace(/\s+/g, " ");
    const email = String(person.email || "")
      .trim()
      .toLowerCase();
    if (!name || name.length > 80)
      throw new Error(
        `Persona ${index + 1}: indica un nombre de hasta 80 caracteres.`,
      );
    if (
      !/^[^\s@/,;]+@[^\s@/,;]+\.[^\s@/,;]+$/.test(email) ||
      email.length > 254
    )
      throw new Error(`Revisa el correo de ${name}.`);
    if (emails.has(email)) throw new Error(`El correo ${email} está repetido.`);
    if (!PERSON_PATTERN.test(person.id) || people[person.id])
      throw new Error(
        "Hay un identificador de participante inválido o repetido.",
      );
    people[person.id] = { name, email };
    participantIds.push(person.id);
    emails.add(email);
  }
  return { people, participantIds };
}

// Rejection sampling of full Fisher–Yates permutations keeps valid derangements uniform.
export function createAssignmentPlan(
  ids,
  choose = randomInt,
  token = () => randomHex(),
) {
  if (
    ids.length < 2 ||
    ids.length > MAX_PARTICIPANTS ||
    new Set(ids).size !== ids.length
  )
    throw new Error("La lista de participantes no es válida.");
  let recipients;
  for (let attempt = 0; attempt < 128; attempt++) {
    const order = [...ids];
    for (let i = order.length - 1; i > 0; i--) {
      const j = choose(i + 1);
      if (!Number.isInteger(j) || j < 0 || j > i)
        throw new Error("El generador aleatorio no es válido.");
      [order[i], order[j]] = [order[j], order[i]];
    }
    if (order.every((id, i) => id !== ids[i])) {
      recipients = order;
      break;
    }
  }
  if (!recipients)
    throw new Error(
      "No se pudo completar el sorteo. No se guardaron resultados; inténtalo otra vez.",
    );
  const used = new Set();
  return Object.fromEntries(
    ids.map((id, index) => {
      let cardId;
      for (let i = 0; i < 8; i++) {
        const value = token();
        if (CARD_PATTERN.test(value) && !used.has(value)) {
          cardId = value;
          used.add(value);
          break;
        }
      }
      if (!cardId)
        throw new Error("No se pudieron crear enlaces privados únicos.");
      return [id, { recipientId: recipients[index], cardId }];
    }),
  );
}

export function privateSantaLink(origin, token) {
  if (!CARD_PATTERN.test(token)) throw new Error("Enlace privado inválido.");
  const url = new URL("/amigo-secreto/ver", origin);
  url.hash = token;
  return url.href;
}
export function readPrivateSantaToken(value, origin) {
  try {
    const url = new URL(value.trim());
    if (
      url.origin !== new URL(origin).origin ||
      url.pathname !== "/amigo-secreto/ver" ||
      url.search ||
      !CARD_PATTERN.test(url.hash.slice(1))
    )
      return null;
    return url.hash.slice(1);
  } catch {
    return null;
  }
}
export function readableExchangeDate(value) {
  return value
    ? new Date(`${value}T12:00:00-05:00`).toLocaleDateString("es-PE", {
        timeZone: "America/Lima",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Por coordinar con la organización";
}
export function emailTemplateParams(event, giverId, origin) {
  const giver = event.people[giverId];
  const assignment = event.assignments[giverId];
  const recipient = event.people[assignment?.recipientId];
  if (!giver || !recipient || giverId === assignment.recipientId)
    throw new Error("La asignación guardada no es válida.");
  return {
    to_email: giver.email,
    to_name: giver.name,
    recipient_name: recipient.name,
    event_title: event.title,
    exchange_date: readableExchangeDate(event.exchangeDate),
    gift_budget: event.budget || "Por coordinar",
    event_notes:
      event.notes || "¡Disfruta el intercambio y conserva el secreto!",
    private_url: privateSantaLink(origin, assignment.cardId),
  };
}
export function validMailSettings(settings) {
  return (
    settings?.enabled === true &&
    ["serviceId", "templateId", "publicKey"].every(
      (key) =>
        typeof settings[key] === "string" &&
        /^[a-zA-Z0-9_-]{1,100}$/.test(settings[key]),
    )
  );
}
export function safeCSV(rows) {
  return (
    "\ufeff" +
    rows
      .map((row) =>
        row
          .map((cell) => {
            let value = String(cell ?? "");
            if (/^\s*[=+@-]|^[\t\r]/.test(value)) value = `'${value}`;
            return `"${value.replaceAll('"', '""')}"`;
          })
          .join(","),
      )
      .join("\r\n")
  );
}

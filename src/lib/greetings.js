export function greetingPayload({
  recipient = "",
  authorName = "",
  message,
  isAnonymous = false,
}) {
  if (
    typeof recipient !== "string" ||
    typeof authorName !== "string" ||
    typeof message !== "string" ||
    typeof isAnonymous !== "boolean"
  )
    throw new Error("Completa los campos del saludo.");
  const body = message.trim(),
    to = recipient.trim(),
    signature = authorName.trim();
  if (body.length < 3 || body.length > 1000)
    throw new Error("Escribe un mensaje de 3 a 1000 caracteres.");
  const hasControl = (value) => [...value].some((c) => c.codePointAt(0) < 32);
  if (to.length > 80 || hasControl(to))
    throw new Error("El destinatario admite hasta 80 caracteres en una línea.");
  if (
    !isAnonymous &&
    (signature.length < 2 || signature.length > 80 || hasControl(signature))
  )
    throw new Error("Escribe tu firma de 2 a 80 caracteres.");
  return {
    recipient: to,
    authorName: isAnonymous ? "Anónimo" : signature,
    isAnonymous,
    message: body,
    visible: true,
  };
}

export function greetingText(data) {
  return `${data.recipient ? `Para ${data.recipient}:\n\n` : ""}${data.message}\n\nCon cariño, ${data.isAnonymous ? "Anónimo" : data.authorName}`;
}

export function greetingDate(timestamp) {
  const date = timestamp?.toDate?.();
  return date instanceof Date && Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("es-PE", {
        timeZone: "America/Lima",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date)
    : "Fecha pendiente";
}

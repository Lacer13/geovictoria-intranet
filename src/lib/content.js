const fields = {
  news: ["title", "desc", "type", "date", "timestamp"],
  directory: ["department", "name", "email", "color"],
};
export function sameContent(kind, before, current) {
  return (
    !!before &&
    !!current &&
    fields[kind].every((key) => (before[key] ?? "") === (current[key] ?? ""))
  );
}
export function contentPayload(kind, values, now = new Date()) {
  const text = (key, max, label) => {
    const value = String(values[key] ?? "").trim();
    if (!value || value.length > max)
      throw new Error(`${label}: completa hasta ${max} caracteres.`);
    return value;
  };
  if (kind === "news") {
    const type = values.type;
    if (!["anuncio", "logro", "cumpleaños"].includes(type))
      throw new Error("Selecciona un tipo de publicación.");
    return {
      title: text("title", 100, "Título"),
      desc: text("desc", 10000, "Contenido"),
      type,
      date:
        values.date ||
        now.toLocaleDateString("es-PE", {
          timeZone: "America/Lima",
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      timestamp: values.timestamp || now.toISOString(),
    };
  }
  if (kind !== "directory") throw new Error("Tipo de contenido no válido.");
  const email = text("email", 254, "Correo").toLowerCase();
  if (!/^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/.test(email))
    throw new Error("Revisa el correo del contacto.");
  const color = values.color || "#135e40";
  if (!/^#[a-f\d]{6}$/i.test(color))
    throw new Error("Selecciona un color válido.");
  return {
    name: text("name", 100, "Nombre"),
    department: text("department", 100, "Área"),
    email,
    color,
  };
}

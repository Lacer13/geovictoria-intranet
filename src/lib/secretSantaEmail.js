export class MailRequestError extends Error {
  constructor(message, { uncertain = false, stopBatch = false } = {}) {
    super(message);
    this.uncertain = uncertain;
    this.stopBatch = stopBatch;
  }
}

// EmailJS public identifiers trigger one fixed template; mailbox credentials stay at EmailJS.
export async function requestSantaEmail(settings, params, request = fetch) {
  let response;
  try {
    response = await request("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: settings.serviceId,
        template_id: settings.templateId,
        user_id: settings.publicKey,
        template_params: params,
      }),
      signal: AbortSignal.timeout(25000),
    });
  } catch {
    throw new MailRequestError(
      "No pudimos confirmar el envío. Revisa el historial de EmailJS antes de volver a enviarlo.",
      { uncertain: true, stopBatch: true },
    );
  }
  if (!response.ok) {
    if (response.status >= 500)
      throw new MailRequestError(
        "El proveedor no confirmó el resultado. Revisa su historial antes de reintentar.",
        { uncertain: true, stopBatch: true },
      );
    if (response.status === 429)
      throw new MailRequestError(
        "El servicio alcanzó su límite. Revisa la cuota en EmailJS antes de continuar.",
        { stopBatch: true },
      );
    throw new MailRequestError(
      "El servicio rechazó el correo. Revisa la cuenta conectada, la plantilla y el destinatario.",
      { stopBatch: response.status !== 422 },
    );
  }
  return { state: "accepted", provider: "emailjs" };
}

export function mailSettingsVersion(settings = {}) {
  return JSON.stringify([
    settings.enabled === true,
    ...["serviceId", "templateId", "publicKey"].map((key) =>
      String(settings[key] || "").trim(),
    ),
  ]);
}
export function santaTestEmailParams(email, origin) {
  if (!/^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/.test(email || ""))
    throw new Error(
      "Tu cuenta necesita un correo válido para recibir la prueba.",
    );
  const url = new URL(origin);
  if (
    url.protocol !== "https:" &&
    !(
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(url.hostname)
    )
  )
    throw new Error("La prueba necesita una dirección segura de la intranet.");
  return {
    to_email: email.toLowerCase(),
    to_name: "Organización",
    event_title: "PRUEBA DE CORREO · GeoVictoria",
    recipient_name: "PRUEBA: no hay una asignación real",
    exchange_date: "No aplica: correo de prueba",
    gift_budget: "No aplica",
    event_notes:
      "Esta es una prueba de conexión. No se ha realizado ningún sorteo ni se han utilizado datos de participantes.",
    private_url: `${url.origin}/amigo-secreto`,
  };
}

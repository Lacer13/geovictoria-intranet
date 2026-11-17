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

import { Copy, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { privateSantaLink, santaInvitationMessage } from "../lib/secretSanta";

async function copy(value, notice) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(notice);
  } catch {
    toast.error("No pudimos copiarlo. Selecciona y copia el enlace del campo.");
  }
}

export default function SantaInvitationsTable({
  event,
  ids,
  deliveries,
  visible,
  deliveryStatus,
  sending,
  configured,
  onSend,
  stateLabel,
  onClear,
}) {
  const archived = event.status === "archived";
  return (
    <div className="santa-links-table-wrap">
      <table className="santa-links-table" role="table">
        <caption>Invitaciones de {event.title} · Solo Administración</caption>
        <thead>
          <tr>
            <th scope="col">Participante</th>
            <th scope="col">Enlace personal</th>
            <th scope="col">Correo (opcional)</th>
          </tr>
        </thead>
        <tbody>
          {ids.map((id) => {
            const person = event.people[id];
            const delivery = deliveries[id];
            const link = privateSantaLink(
              window.location.origin,
              event.assignments[id].cardId,
            );
            return (
              <tr key={id}>
                <th scope="row">
                  {person.name}
                  <span className="santa-person-email">{person.email}</span>
                  {visible && (
                    <p className="santa-target">
                      Le regala a:
                      <strong>
                        {event.people[event.assignments[id].recipientId].name}
                      </strong>
                    </p>
                  )}
                </th>
                <td data-label="Enlace personal">
                  {archived ? (
                    <p className="santa-links-disabled">
                      Enlace desactivado. Restaura el sorteo para compartirlo.
                    </p>
                  ) : (
                    <>
                      <input
                        className="input-field"
                        aria-label={`Enlace personal de ${person.name}`}
                        value={link}
                        readOnly
                        onFocus={(e) => e.target.select()}
                      />
                      <div className="santa-link-actions">
                        <button
                          className="btn btn-secondary"
                          aria-label={`Copiar enlace de ${person.name}`}
                          onClick={() =>
                            copy(link, `Enlace de ${person.name} copiado`)
                          }
                        >
                          <Copy size={15} /> Copiar enlace
                        </button>
                        <button
                          className="btn btn-secondary"
                          aria-label={`Copiar mensaje para ${person.name}`}
                          onClick={() =>
                            copy(
                              santaInvitationMessage(
                                event,
                                id,
                                window.location.origin,
                              ),
                              "Mensaje copiado. Compártelo solo con esta persona.",
                            )
                          }
                        >
                          Copiar mensaje
                        </button>
                      </div>
                    </>
                  )}
                </td>
                <td data-label="Correo (opcional)">
                  <span
                    className={`santa-delivery-status ${delivery?.state || "pending"}`}
                  >
                    {deliveryStatus === "ready"
                      ? stateLabel(delivery)
                      : deliveryStatus === "error"
                        ? "Historial no disponible"
                        : "Consultando…"}
                  </span>
                  <button
                    className="btn btn-secondary"
                    disabled={
                      archived ||
                      sending ||
                      !configured ||
                      deliveryStatus !== "ready"
                    }
                    onClick={() => onSend(id)}
                    aria-label={`${delivery?.state === "accepted" ? "Reenviar" : "Enviar"} correo a ${person.name}`}
                  >
                    <Mail size={14} />{" "}
                    {delivery?.state === "accepted"
                      ? "Reenviar correo"
                      : "Enviar correo"}
                  </button>
                  {delivery?.lastError && (
                    <p className="santa-delivery-error">{delivery.lastError}</p>
                  )}
                </td>
              </tr>
            );
          })}
          {ids.length === 0 && (
            <tr>
              <td colSpan={3}>
                <div className="santa-no-matches">
                  <strong>No hay personas en esta vista</strong>
                  <p>Prueba otro estado o cambia la búsqueda.</p>
                  <button className="text-link" onClick={onClear}>
                    Ver todo el grupo
                  </button>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

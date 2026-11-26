import { useEffect, useRef, useState } from "react";
import { Check, Copy, Link2, Mail, MessageCircle } from "lucide-react";
import { privateSantaLink, santaInvitationMessage } from "../lib/secretSanta";

function InvitationActions({ event, id }) {
  const [copied, setCopied] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState(false);
  const linkInput = useRef(null);
  const person = event.people[id];
  const link = privateSantaLink(
    window.location.origin,
    event.assignments[id].cardId,
  );
  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(""), 3000);
    return () => clearTimeout(timeout);
  }, [copied]);
  useEffect(() => {
    if (error && expanded) linkInput.current?.select();
  }, [error, expanded]);
  const copy = async (type) => {
    try {
      const value =
        type === "link"
          ? link
          : santaInvitationMessage(event, id, window.location.origin);
      await navigator.clipboard.writeText(value);
      setCopied(type);
      setError(false);
    } catch {
      setError(true);
      setExpanded(true);
    }
  };
  return (
    <div className="santa-invitation-actions">
      <div className="santa-link-actions">
        <button
          className="btn btn-secondary"
          aria-label={`Copiar enlace de ${person.name}`}
          onClick={() => copy("link")}
        >
          {copied === "link" ? <Check size={16} /> : <Link2 size={16} />}
          {copied === "link" ? "Enlace copiado" : "Copiar enlace"}
        </button>
        <button
          className="btn btn-forest"
          aria-label={`Copiar mensaje para ${person.name}`}
          onClick={() => copy("message")}
        >
          {copied === "message" ? (
            <Check size={16} />
          ) : (
            <MessageCircle size={16} />
          )}
          {copied === "message" ? "Mensaje copiado" : "Copiar mensaje"}
        </button>
      </div>
      <span className="santa-copy-notice" role="status">
        {copied ? "Listo. Compártelo solo con esta persona." : ""}
      </span>
      <details
        className="santa-person-link"
        open={expanded}
        onToggle={(e) => setExpanded(e.currentTarget.open)}
      >
        <summary aria-label={`Ver enlace de ${person.name}`}>
          Ver enlace personal
        </summary>
        <input
          ref={linkInput}
          className="input-field"
          aria-label={`Enlace personal de ${person.name}`}
          value={link}
          readOnly
          onFocus={(e) => e.target.select()}
        />
      </details>
      {error && (
        <p className="santa-delivery-error" role="alert">
          <Copy size={13} /> No pudimos copiar automáticamente. Selecciona el
          enlace del campo y cópialo.
        </p>
      )}
    </div>
  );
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
  showEmail = false,
  canSendMail = false,
}) {
  const archived = event.status === "archived";
  return (
    <div className="santa-links-table-wrap">
      <table className={`santa-links-table ${showEmail ? "with-email" : ""}`}>
        <caption className="santa-sr-only">
          Invitaciones de {event.title} · Solo Administración
        </caption>
        <thead>
          <tr>
            <th scope="col">Participante</th>
            <th scope="col">Compartir invitación</th>
            {showEmail && <th scope="col">Estado del correo</th>}
          </tr>
        </thead>
        <tbody>
          {ids.map((id) => {
            const person = event.people[id];
            const delivery = deliveries[id];
            return (
              <tr key={id}>
                <th scope="row">
                  <div className="santa-person-identity">
                    <span className="santa-person-initial" aria-hidden="true">
                      {person.name.trim().slice(0, 1).toLocaleUpperCase("es")}
                    </span>
                    <div>
                      {person.name}
                      <span className="santa-person-email">{person.email}</span>
                    </div>
                  </div>
                  {visible && (
                    <p className="santa-target">
                      Le regala a:
                      <strong>
                        {event.people[event.assignments[id].recipientId].name}
                      </strong>
                    </p>
                  )}
                </th>
                <td data-label="Compartir invitación">
                  {archived ? (
                    <p className="santa-links-disabled">
                      Enlace desactivado. Restaura el sorteo para compartirlo.
                    </p>
                  ) : (
                    <InvitationActions event={event} id={id} />
                  )}
                </td>
                {showEmail && (
                  <td data-label="Estado del correo">
                    <span
                      className={`santa-delivery-status ${delivery?.state || "pending"}`}
                    >
                      {deliveryStatus === "ready"
                        ? stateLabel(delivery)
                        : deliveryStatus === "error"
                          ? "Historial no disponible"
                          : "Consultando…"}
                    </span>
                    {canSendMail && (
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
                    )}
                    {canSendMail && !configured && !archived && (
                      <p className="santa-email-unconfigured">
                        Conecta una cuenta en «Configurar correo» para habilitar
                        los envíos.
                      </p>
                    )}
                    {delivery?.lastError && (
                      <p className="santa-delivery-error">
                        {delivery.lastError}
                      </p>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
          {ids.length === 0 && (
            <tr>
              <td colSpan={showEmail ? 3 : 2}>
                <div className="santa-no-matches">
                  <strong>No encontramos participantes</strong>
                  <p>Prueba con otro nombre, correo o estado.</p>
                  <button className="text-link" onClick={onClear}>
                    Ver todo el grupo <Link2 size={14} />
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

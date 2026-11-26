import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  LoaderCircle,
  Mail,
  Send,
  Users,
} from "lucide-react";
import { isLocalDemo } from "../../firebase";
import SantaMailLimits from "../SantaMailLimits";

export default function SantaEmailPanel({
  panelRef,
  event,
  deliveryStatus,
  accepted,
  pending,
  review,
  archived,
  configured,
  progress,
  openSend,
  configure,
  setFilter,
  onStop,
}) {
  return (
    <details className="santa-optional-email" ref={panelRef}>
      <summary>Correo automático (opcional)</summary>
      <p className="santa-links-privacy">
        También puedes enviar las invitaciones por correo. Compartir un enlace
        no envía correos ni consume cuota de EmailJS.
      </p>
      <div className="santa-result-summary">
        <div>
          <Users size={17} />
          <strong>{event.participantIds.length}</strong>
          <span>participantes</span>
        </div>
        <div>
          <Mail size={17} />
          <strong>{deliveryStatus === "ready" ? accepted : "—"}</strong>
          <span>{isLocalDemo ? "envíos simulados" : "correos aceptados"}</span>
        </div>
        <div>
          <Clock3 size={17} />
          <strong>{deliveryStatus === "ready" ? pending.length : "—"}</strong>
          <span>pendientes de envío</span>
        </div>
        <div>
          <CircleAlert size={17} />
          <strong>{deliveryStatus === "ready" ? review : "—"}</strong>
          <span>requieren revisión</span>
        </div>
      </div>
      <SantaMailLimits />
      {deliveryStatus === "loading" && (
        <p className="santa-delivery-loading" role="status">
          <LoaderCircle size={16} className="animate-spin" /> Consultando el
          historial de envíos…
        </p>
      )}
      {deliveryStatus === "error" && (
        <p className="form-error" role="alert">
          No pudimos consultar el historial. Recarga la página antes de enviar.
        </p>
      )}
      {deliveryStatus === "ready" && !archived && (
        <div className="santa-delivery-progress">
          <div>
            <span>
              {isLocalDemo
                ? "Avance de la simulación"
                : "Solicitudes aceptadas por EmailJS"}
            </span>
            <strong>
              {accepted} de {event.participantIds.length}
            </strong>
          </div>
          <progress
            value={accepted}
            max={event.participantIds.length}
            aria-label={
              isLocalDemo
                ? "Envíos simulados"
                : "Solicitudes aceptadas por EmailJS"
            }
          />
          <small>
            {isLocalDemo
              ? "Los mensajes de este entorno son de prueba."
              : "La aceptación confirma la solicitud al proveedor. Revisa el historial si alguien no recibe su correo."}
          </small>
        </div>
      )}
      {!archived && deliveryStatus === "ready" && (
        <div
          className={`santa-next-action ${review > 0 ? "needs-review" : ""}`}
        >
          <span className="santa-action-icon">
            {!configured ? (
              <Mail size={23} />
            ) : review > 0 ? (
              <CircleAlert size={23} />
            ) : pending.length === 0 ? (
              <CheckCircle2 size={23} />
            ) : (
              <Send size={23} />
            )}
          </span>
          <div>
            <strong>
              {!configured
                ? "Puedes compartir los enlaces ahora"
                : review > 0
                  ? "Hay envíos que necesitan una mirada"
                  : pending.length === 0
                    ? "Cada sorpresa tiene su invitación"
                    : "Todo listo para compartir la sorpresa"}
            </strong>
            <p>
              {!configured
                ? "No necesitas conectar un correo. Usa la tabla de enlaces personales o configura EmailJS si también quieres enviar invitaciones por correo."
                : review > 0
                  ? "Consulta el historial de EmailJS antes de reenviar un mensaje sin confirmación."
                  : pending.length === 0
                    ? isLocalDemo
                      ? "Se completaron los envíos de prueba."
                      : "Los correos aceptados están registrados. Puedes recuperar cada enlace cuando lo necesites."
                    : `${pending.length} correos pendientes. Las invitaciones también se pueden compartir por enlace.`}
            </p>
          </div>
        </div>
      )}
      <div className="santa-send-toolbar">
        {progress ? (
          <>
            <div role="status">
              <LoaderCircle className="animate-spin" size={17} /> Procesados{" "}
              {progress.done} de {progress.total}
            </div>
            <span>Mantén esta página abierta durante el envío.</span>
            <button
              className="btn btn-secondary"
              onClick={() => {
                onStop();
              }}
            >
              Detener después del actual
            </button>
          </>
        ) : (
          <>
            <button
              className="btn btn-forest"
              disabled={
                archived ||
                !configured ||
                pending.length === 0 ||
                deliveryStatus !== "ready"
              }
              onClick={() => openSend()}
            >
              <Send size={16} /> Enviar correos pendientes
            </button>
            {!configured && (
              <button className="text-link" onClick={configure}>
                Conectar cuenta de correo
              </button>
            )}
            <span>Los reintentos conservan la misma asignación.</span>
            {review > 0 && (
              <button className="text-link" onClick={() => setFilter("review")}>
                Revisar {review} {review === 1 ? "envío" : "envíos"}{" "}
                <ArrowRight size={14} />
              </button>
            )}
          </>
        )}
      </div>
    </details>
  );
}

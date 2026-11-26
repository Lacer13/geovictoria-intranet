import { useCallback, useEffect, useRef, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import {
  Archive,
  ArrowDownToLine,
  CheckCircle2,
  Link2,
  Table2,
  Gift,
  Mail,
  LockKeyhole,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import { db, isLocalDemo } from "../../firebase";
import Modal from "../Modal";
import {
  privateSantaLink,
  readableExchangeDate,
  safeCSV,
  santaLinksCSV,
  validMailSettings,
} from "../../lib/secretSanta";
import { archiveSanta, sendSantaEmail } from "../../lib/secretSantaStore";
import { normalize } from "../../lib/preferences";
import SantaEmailPanel from "./SantaEmailPanel";
import SantaPairingsTable from "./SantaPairingsTable";
import SantaInvitationsTable from "../SantaInvitationsTable";
import "../../secret-santa-links.css";
import "../../secret-santa-experience.css";
import { statusNames, messageFor } from "./shared";

export default function SantaResults({
  event,
  settings,
  configure,
  canManage = false,
  canMail = false,
}) {
  const [deliveries, setDeliveries] = useState({});
  const [visible, setVisible] = useState(false);
  const [term, setTerm] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [reviewed, setReviewed] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveBusy, setArchiveBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState("loading");
  const [filter, setFilter] = useState("all");
  const [showEmail, setShowEmail] = useState(false);
  const emailPanel = useRef(null);
  const running = useRef(false);
  const stop = useRef(false);
  const alive = useRef(true);
  const closeConfirm = useCallback(() => setConfirmation(null), []);
  const closeArchive = useCallback(() => setArchiveOpen(false), []);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      stop.current = true;
    };
  }, []);
  useEffect(() => {
    const timeout = setTimeout(() => setDeliveryStatus("error"), 10000);
    const unsubscribe = onSnapshot(
      collection(db, "secretSantaEvents", event.id, "deliveries"),
      { includeMetadataChanges: true },
      (snapshot) => {
        if (snapshot.metadata.fromCache && snapshot.empty) return;
        clearTimeout(timeout);
        setDeliveryStatus("ready");
        setDeliveries(
          Object.fromEntries(snapshot.docs.map((d) => [d.id, d.data()])),
        );
      },
      () => {
        clearTimeout(timeout);
        setDeliveryStatus("error");
        setError(
          "No pudimos cargar el estado de los correos. Recarga antes de enviar.",
        );
      },
    );
    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, [event.id]);
  const archived = event.status === "archived";
  const configured = canMail && validMailSettings(settings);
  const pending = event.participantIds.filter(
    (id) => !deliveries[id] || deliveries[id].state === "failed",
  );
  const accepted = event.participantIds.filter(
    (id) => deliveries[id]?.state === "accepted",
  ).length;
  const review = event.participantIds.filter((id) =>
    ["sending", "uncertain"].includes(deliveries[id]?.state),
  ).length;
  const ids = event.participantIds.filter(
    (id) =>
      (filter === "all" ||
        (filter === "pending" &&
          (!deliveries[id] || deliveries[id].state === "failed")) ||
        (filter === "accepted" && deliveries[id]?.state === "accepted") ||
        (filter === "review" &&
          ["sending", "uncertain"].includes(deliveries[id]?.state))) &&
      normalize(`${event.people[id].name} ${event.people[id].email}`).includes(
        normalize(term),
      ),
  );
  const openSend = (id) => {
    if (!canMail) return;
    setReviewed(false);
    setConfirmation(
      id
        ? {
            ids: [id],
            force: ["accepted", "sending", "uncertain"].includes(
              deliveries[id]?.state,
            ),
            uncertain: ["sending", "uncertain"].includes(deliveries[id]?.state),
          }
        : { ids: pending, force: false, uncertain: false },
    );
  };
  const send = async () => {
    if (
      running.current ||
      !confirmation ||
      !configured ||
      archived ||
      deliveryStatus !== "ready"
    )
      return;
    const choice = confirmation;
    closeConfirm();
    running.current = true;
    stop.current = false;
    setError("");
    setProgress({ done: 0, total: choice.ids.length });
    if (emailPanel.current) emailPanel.current.open = true;
    try {
      for (const [index, id] of choice.ids.entries()) {
        if (stop.current) break;
        try {
          await sendSantaEmail(event.id, id, { force: choice.force });
        } catch (err) {
          if (alive.current)
            setError(
              messageFor(
                err,
                "No pudimos confirmar el envío. Revisa su estado antes de reintentar.",
              ),
            );
          if (err.stopBatch !== false) break;
        }
        if (alive.current)
          setProgress({ done: index + 1, total: choice.ids.length });
        if (!stop.current && index < choice.ids.length - 1)
          await new Promise((resolve) => setTimeout(resolve, 1200));
      }
    } finally {
      running.current = false;
      if (alive.current) setProgress(null);
    }
  };
  const downloadBackup = () => {
    const rows = [
      ["Participante", "Correo", "Regala a", "Enlace privado"],
      ...event.participantIds.map((id) => [
        event.people[id].name,
        event.people[id].email,
        event.people[event.assignments[id].recipientId].name,
        privateSantaLink(window.location.origin, event.assignments[id].cardId),
      ]),
    ];
    const url = URL.createObjectURL(
      new Blob([safeCSV(rows)], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `amigo-secreto-respaldo-${event.id}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const downloadLinks = () => {
    if (archived) return;
    const url = URL.createObjectURL(
      new Blob([santaLinksCSV(event, window.location.origin)], {
        type: "text/csv;charset=utf-8",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `amigo-secreto-enlaces-${event.id}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const archive = async () => {
    if (!canManage) return;
    setArchiveBusy(true);
    try {
      await archiveSanta(event.id, !archived);
      closeArchive();
    } catch (err) {
      setError(messageFor(err, "No pudimos cambiar el estado del sorteo."));
    } finally {
      setArchiveBusy(false);
    }
  };
  const stateLabel = (delivery) =>
    !delivery
      ? "Pendiente"
      : delivery.state === "accepted"
        ? delivery.provider === "demo"
          ? "Simulado · prueba local"
          : "Aceptado por EmailJS"
        : delivery.state === "sending"
          ? "En proceso / por confirmar"
          : delivery.state === "uncertain"
            ? "Revisar historial"
            : "No enviado";
  return (
    <section className="panel santa-results">
      <div className="santa-section-heading">
        <span className="quick-icon green">
          <Gift size={22} />
        </span>
        <div>
          <h3>{event.title}</h3>
          <p>
            {event.participantIds.length} personas ·{" "}
            {readableExchangeDate(event.exchangeDate)}
            {event.budget ? ` · ${event.budget}` : ""}
          </p>
        </div>
        <span
          className={`santa-event-status ${archived ? "archived" : "drawn"}`}
        >
          <CheckCircle2 size={13} /> {statusNames[event.status]}
        </span>
      </div>
      {!archived && (
        <div className="santa-links-guide">
          <Link2 size={22} />
          <div>
            <h4>La sorpresa ya está lista</h4>
            <p>
              Copia el mensaje de cada persona y compártelo por el canal que
              prefieras. Su invitación se abre sin cuenta y conserva el mismo
              resultado.
            </p>
          </div>
          <button className="btn btn-secondary" onClick={downloadLinks}>
            <ArrowDownToLine size={16} /> Descargar todos los enlaces
          </button>
        </div>
      )}
      {archived && (
        <div className="inline-notice">
          Sorteo archivado. Sus resultados siguen guardados para Administración;
          los enlaces privados están desactivados.
        </div>
      )}
      <p className="santa-links-privacy">
        <LockKeyhole size={14} /> Comparte cada invitación solo con su
        participante. La tabla y el CSV completo son privados para
        Administración.
      </p>
      <div className="santa-recovery-heading">
        <div>
          <h4>
            {visible ? "Quién le regala a quién" : "Invitaciones del equipo"}
          </h4>
          <p>
            {visible
              ? "Revisa todas las parejas en una tabla rápida. Busca a cualquiera de las dos personas."
              : "Busca a una persona y copia su invitación. El CSV incluye siempre a todo el grupo."}
          </p>
        </div>
        <div className="santa-result-view-actions">
          <button
            className="btn btn-secondary"
            aria-pressed={!visible}
            onClick={() => setVisible(false)}
          >
            <Link2 size={15} /> Invitaciones
          </button>
          {!visible && (
            <button
              className="btn btn-secondary"
              aria-pressed={showEmail}
              onClick={() => {
                setShowEmail((value) => !value);
                setFilter("all");
              }}
            >
              <Mail size={15} />
              {showEmail ? "Ocultar correos" : "Ver estado de correos"}
            </button>
          )}
          <button
            className="btn btn-secondary"
            aria-pressed={visible}
            onClick={() => setVisible(true)}
          >
            <Table2 size={15} /> Tabla de parejas
          </button>
        </div>
      </div>
      {visible ? (
        <SantaPairingsTable event={event} onHide={() => setVisible(false)} />
      ) : (
        <>
          <div className="santa-delivery-controls">
            <div className="search-field">
              <Search size={17} />
              <input
                aria-label="Buscar participante del sorteo"
                placeholder="Busca por nombre o correo…"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
              />
            </div>
            {showEmail && (
              <div
                className="santa-delivery-filters"
                aria-label="Filtrar por estado del correo"
              >
                {[
                  ["all", "Todos", event.participantIds.length],
                  ["pending", "Pendientes", pending.length],
                  [
                    "accepted",
                    isLocalDemo ? "Simulados" : "Aceptados",
                    accepted,
                  ],
                  ["review", "Revisar", review],
                ].map(([value, label, count]) => (
                  <button
                    key={value}
                    aria-pressed={filter === value}
                    className={filter === value ? "active" : ""}
                    onClick={() => setFilter(value)}
                  >
                    {label}
                    <span>{deliveryStatus === "ready" ? count : "—"}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="santa-list-count" aria-live="polite" aria-atomic="true">
            {ids.length} de {event.participantIds.length} personas
            {term || filter !== "all" ? (
              <button
                className="text-link"
                onClick={() => {
                  setTerm("");
                  setFilter("all");
                }}
              >
                Limpiar filtros <X size={12} />
              </button>
            ) : null}
          </p>
          <SantaInvitationsTable
            event={event}
            ids={ids}
            deliveries={deliveries}
            visible={false}
            deliveryStatus={deliveryStatus}
            sending={!!progress}
            configured={configured}
            onSend={openSend}
            stateLabel={stateLabel}
            showEmail={showEmail}
            canSendMail={canMail}
            onClear={() => {
              setTerm("");
              setFilter("all");
            }}
          />
        </>
      )}
      {canMail && !visible && (
        <SantaEmailPanel
          panelRef={emailPanel}
          event={event}
          deliveryStatus={deliveryStatus}
          accepted={accepted}
          pending={pending}
          review={review}
          archived={archived}
          configured={configured}
          progress={progress}
          openSend={openSend}
          configure={configure}
          setFilter={setFilter}
          onStop={() => {
            stop.current = true;
          }}
        />
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="santa-result-footer">
        {visible && (
          <button className="text-link" onClick={downloadBackup}>
            <ArrowDownToLine size={15} /> Respaldo completo con enlaces
          </button>
        )}
        {canManage && (
          <button
            className="text-link"
            disabled={!!progress}
            onClick={() => setArchiveOpen(true)}
          >
            {archived ? <RefreshCw size={15} /> : <Archive size={15} />}
            {archived ? "Restaurar sorteo" : "Archivar sorteo"}
          </button>
        )}
      </div>
      <p className="santa-private-note">
        <ShieldCheck size={14} /> Solo Administración puede acceder a esta lista
        completa. Quien tenga un enlace privado puede consultar esa asignación.
      </p>
      {confirmation && (
        <Modal
          title={
            confirmation.force
              ? "Confirmar reenvío"
              : "Enviar asignaciones por correo"
          }
          onClose={closeConfirm}
        >
          <p>
            {confirmation.ids.length === 1 ? (
              <>
                Se enviará el resultado guardado a{" "}
                <strong>{event.people[confirmation.ids[0]].email}</strong>.
              </>
            ) : (
              <>
                Se enviarán{" "}
                <strong>{confirmation.ids.length} correos individuales</strong>{" "}
                a las direcciones de la lista guardada.
              </>
            )}
          </p>
          <p className="santa-confirm-description">
            Cada persona recibirá a quién le toca, los detalles del intercambio
            y su enlace privado. Esto no cambia las parejas del sorteo.
          </p>
          {confirmation.uncertain && (
            <label className="santa-review-checkbox">
              <input
                type="checkbox"
                checked={reviewed}
                onChange={(e) => setReviewed(e.target.checked)}
              />{" "}
              Ya revisé el historial de EmailJS y deseo volver a enviarlo.
            </label>
          )}
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={closeConfirm}>
              Cancelar
            </button>
            <button
              className="btn btn-forest"
              disabled={confirmation.uncertain && !reviewed}
              onClick={send}
            >
              {isLocalDemo
                ? "Simular envío local"
                : confirmation.force
                  ? "Confirmar reenvío"
                  : "Confirmar envío"}
              <Send size={15} />
            </button>
          </div>
        </Modal>
      )}
      {archiveOpen && canManage && (
        <Modal
          title={archived ? "Restaurar este sorteo" : "Archivar este sorteo"}
          onClose={closeArchive}
        >
          <p>
            {archived
              ? "Los enlaces privados volverán a funcionar con las mismas asignaciones guardadas."
              : "Las asignaciones seguirán guardadas, pero sus enlaces privados dejarán de funcionar. Un correo que ya esté en proceso puede completarse."}
          </p>
          <div className="modal-actions">
            <button
              className="btn btn-secondary"
              disabled={archiveBusy}
              onClick={closeArchive}
            >
              Cancelar
            </button>
            <button
              className="btn btn-forest"
              disabled={archiveBusy}
              onClick={archive}
            >
              {archiveBusy
                ? "Actualizando…"
                : archived
                  ? "Restaurar"
                  : "Archivar"}
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}

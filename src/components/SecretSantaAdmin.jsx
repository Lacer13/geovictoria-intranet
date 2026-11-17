import { useCallback, useEffect, useRef, useState } from "react";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import {
  Archive,
  ArrowDownToLine,
  Check,
  Copy,
  Eye,
  EyeOff,
  Gift,
  LoaderCircle,
  Mail,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Shuffle,
  Users,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { db, isLocalDemo } from "../firebase";
import Modal from "./Modal";
import {
  MAX_PARTICIPANTS,
  emptyPerson,
  normalizeRoster,
  parseParticipantLines,
  privateSantaLink,
  readableExchangeDate,
  safeCSV,
  validMailSettings,
} from "../lib/secretSanta";
import {
  archiveSanta,
  drawSanta,
  saveSantaDraft,
  saveSantaEmailSettings,
  sendSantaEmail,
} from "../lib/secretSantaStore";
import {
  SECRET_SANTA_EMAIL_SUBJECT,
  SECRET_SANTA_EMAIL_TEMPLATE,
} from "../data/secretSantaTemplate";
import { normalize } from "../lib/preferences";

const emptySettings = {
  enabled: false,
  serviceId: "",
  templateId: "",
  publicKey: "",
};
const statusNames = {
  draft: "Borrador",
  drawn: "Sorteado",
  archived: "Archivado",
};
const messageFor = (error, fallback) =>
  error.code ? fallback : error.message || fallback;
const copyText = async (value, notice = "Enlace privado copiado") => {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(notice);
  } catch {
    toast.error("No pudimos copiarlo. Revisa los permisos del portapapeles.");
  }
};

export default function SecretSantaAdmin() {
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState("loading");
  const [selectedId, setSelectedId] = useState(null);
  const [reload, setReload] = useState(0);
  const [settings, setSettings] = useState(emptySettings);
  const [mailOpen, setMailOpen] = useState(false);
  const closeMail = useCallback(() => setMailOpen(false), []);
  useEffect(() => {
    const timeout = setTimeout(() => setStatus("error"), 10000);
    const stop = onSnapshot(
      query(
        collection(db, "secretSantaEvents"),
        orderBy("createdAt", "desc"),
        limit(50),
      ),
      (snapshot) => {
        if (snapshot.metadata.fromCache && snapshot.empty) return;
        clearTimeout(timeout);
        setEvents(snapshot.docs.map((d) => ({ ...d.data(), id: d.id })));
        setStatus("ready");
      },
      () => {
        clearTimeout(timeout);
        setStatus("error");
      },
    );
    const stopSettings = onSnapshot(
      doc(db, "portalSettings", "secretSantaEmail"),
      (snapshot) =>
        setSettings(snapshot.exists() ? snapshot.data() : emptySettings),
      () => setSettings(emptySettings),
    );
    return () => {
      clearTimeout(timeout);
      stop();
      stopSettings();
    };
  }, []);
  const selected =
    selectedId === "new"
      ? null
      : selectedId
        ? events.find((e) => e.id === selectedId)
        : events[0];
  return (
    <section className="santa-admin">
      <div className="santa-admin-heading">
        <div>
          <span className="eyebrow">
            REGALAMOS MOMENTOS, GUARDAMOS SECRETOS
          </span>
          <h2>Amigo secreto de Navidad</h2>
          <p>
            Organiza el grupo, guarda el sorteo y entrega cada asignación en
            privado.
          </p>
        </div>
        <div>
          <button
            className="btn btn-secondary"
            onClick={() => setMailOpen(true)}
          >
            <Settings2 size={15} /> Configurar correo
          </button>
          <button
            className="btn btn-forest"
            onClick={() => setSelectedId("new")}
          >
            <Plus size={16} /> Nuevo sorteo
          </button>
        </div>
      </div>
      <div
        className={`santa-mail-notice ${validMailSettings(settings) ? "configured" : ""}`}
      >
        <Mail size={18} />
        <div>
          <strong>
            {isLocalDemo
              ? "Prueba local: los envíos se simulan"
              : validMailSettings(settings)
                ? "Identificadores de EmailJS guardados"
                : "Conecta tu cuenta para enviar correos automáticamente"}
          </strong>
          <p>
            {isLocalDemo
              ? "No se enviará ningún correo real desde este entorno."
              : validMailSettings(settings)
                ? "El proveedor confirmará cada envío. Aceptado no significa entregado en la bandeja del destinatario."
                : "Puedes utilizar Gmail u Outlook mediante EmailJS, sin dominio propio. El sorteo y sus enlaces se guardan aunque el correo esté pendiente."}
          </p>
        </div>
        {!validMailSettings(settings) && (
          <button className="text-link" onClick={() => setMailOpen(true)}>
            Ver pasos →
          </button>
        )}
      </div>
      <div className="santa-admin-layout">
        <aside
          className="panel santa-events-nav"
          aria-label="Sorteos guardados"
        >
          <h3>
            <Archive size={16} /> Sorteos guardados
          </h3>
          {status === "loading" ? (
            <p role="status">Cargando sorteos…</p>
          ) : status === "error" ? (
            <p role="alert">
              No pudimos cargar los sorteos. Recarga la página para reintentar.
            </p>
          ) : events.length === 0 ? (
            <p>Tu primer intercambio empieza con una lista de personas.</p>
          ) : (
            events.map((event) => (
              <button
                key={event.id}
                className={selected?.id === event.id ? "active" : ""}
                onClick={() => setSelectedId(event.id)}
              >
                <span>
                  <strong>{event.title}</strong>
                  <small>
                    {event.participantIds.length} personas ·{" "}
                    {statusNames[event.status]}
                  </small>
                </span>
                <Gift size={16} />
              </button>
            ))
          )}
          {events.length === 50 && <p>Se muestran los últimos 50 sorteos.</p>}
        </aside>
        <div className="santa-workspace">
          {selectedId === "new" ? (
            <SantaDraft key="new" onSaved={setSelectedId} />
          ) : selected ? (
            selected.status === "draft" ? (
              <SantaDraft
                key={`${selected.id}-${reload}`}
                event={selected}
                onSaved={setSelectedId}
                onReload={() => setReload((v) => v + 1)}
              />
            ) : (
              <SantaResults
                key={selected.id}
                event={selected}
                settings={settings}
                configure={() => setMailOpen(true)}
              />
            )
          ) : selectedId ? (
            <div className="panel empty-state" role="status">
              <LoaderCircle className="animate-spin" />
              <p>Abriendo el sorteo guardado…</p>
            </div>
          ) : (
            <div className="panel empty-state">
              <Gift size={45} />
              <h3>El mejor regalo empieza aquí.</h3>
              <p>Crea un sorteo para añadir a las personas del equipo.</p>
              <button
                className="btn btn-forest"
                onClick={() => setSelectedId("new")}
              >
                Crear mi primer sorteo <Plus size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
      {mailOpen && (
        <Modal
          title="Correo automático sin dominio propio"
          onClose={closeMail}
          className="santa-settings-modal"
        >
          <SantaMailSettings initial={settings} onSaved={closeMail} />
        </Modal>
      )}
    </section>
  );
}

function SantaDraft({ event, onSaved, onReload }) {
  const [form, setForm] = useState(() => ({
    title: event?.title || "Amigo secreto de Navidad",
    exchangeDate: event?.exchangeDate || "",
    budget: event?.budget || "",
    notes: event?.notes || "",
  }));
  const [rows, setRows] = useState(() =>
    event
      ? event.participantIds.map((id) => ({ id, ...event.people[id] }))
      : [emptyPerson(), emptyPerson()],
  );
  const [revision, setRevision] = useState(event?.revision ?? 0);
  const [dirty, setDirty] = useState(false);
  const [bulk, setBulk] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmDraw, setConfirmDraw] = useState(false);
  const saving = useRef(false);
  const closeDraw = useCallback(() => setConfirmDraw(false), []);
  const count = rows.filter((p) => p.name.trim() || p.email.trim()).length;
  const stale = event && event.revision !== revision;
  const changeForm = (field, value) => {
    setForm((old) => ({ ...old, [field]: value }));
    setDirty(true);
  };
  const changePerson = (id, field, value) => {
    setRows((old) =>
      old.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
    setDirty(true);
  };
  const save = async (e) => {
    e.preventDefault();
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await saveSantaDraft(event?.id, form, rows, revision);
      setRevision(result.revision);
      setDirty(false);
      onSaved(result.id);
      toast.success("Borrador guardado");
    } catch (err) {
      setError(
        messageFor(
          err,
          "No pudimos guardar. Conservamos tus cambios; revisa la conexión.",
        ),
      );
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };
  const importRows = () => {
    try {
      const combined = [
        ...rows.filter((p) => p.name.trim() || p.email.trim()),
        ...parseParticipantLines(bulk),
      ];
      normalizeRoster(combined);
      setRows(combined);
      setBulk("");
      setBulkOpen(false);
      setDirty(true);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };
  const draw = async () => {
    if (saving.current || !event) return;
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      await drawSanta(event.id, revision);
      toast.success("Sorteo guardado. Las asignaciones ya están listas.");
      closeDraw();
    } catch (err) {
      setError(
        messageFor(
          err,
          "No pudimos confirmar el sorteo. Recarga la versión guardada antes de intentar otra vez.",
        ),
      );
      closeDraw();
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };
  return (
    <section className="panel santa-draft">
      <div className="santa-section-heading">
        <span className="quick-icon green">
          <Users size={21} />
        </span>
        <div>
          <h3>{event ? "Prepara el intercambio" : "Un nuevo intercambio"}</h3>
          <p>Revisa los nombres y correos antes de sortear.</p>
        </div>
        <span className="department-pill">Borrador</span>
      </div>
      {stale && (
        <div className="inline-notice" role="alert">
          Otra persona modificó este borrador. Tus cambios siguen aquí.
          <button className="text-link" onClick={onReload}>
            Recargar versión guardada
          </button>
        </div>
      )}
      <form onSubmit={save}>
        <fieldset disabled={busy}>
          <div className="input-group">
            <label htmlFor="santa-title">Nombre del sorteo *</label>
            <input
              id="santa-title"
              className="input-field"
              maxLength={100}
              required
              value={form.title}
              onChange={(e) => changeForm("title", e.target.value)}
            />
          </div>
          <div className="form-two-columns">
            <div className="input-group">
              <label htmlFor="santa-date">
                Fecha del intercambio <span className="muted">(opcional)</span>
              </label>
              <input
                id="santa-date"
                type="date"
                className="input-field"
                value={form.exchangeDate}
                onChange={(e) => changeForm("exchangeDate", e.target.value)}
              />
            </div>
            <div className="input-group">
              <label htmlFor="santa-budget">
                Presupuesto <span className="muted">(opcional)</span>
              </label>
              <input
                id="santa-budget"
                className="input-field"
                placeholder="Ej. S/ 50"
                maxLength={100}
                value={form.budget}
                onChange={(e) => changeForm("budget", e.target.value)}
              />
            </div>
          </div>
          <div className="input-group">
            <label htmlFor="santa-notes">
              Indicaciones para el equipo{" "}
              <span className="muted">(opcional)</span>
            </label>
            <textarea
              id="santa-notes"
              className="input-field"
              rows={2}
              maxLength={1000}
              placeholder="Detalles que deben conocer las personas participantes…"
              value={form.notes}
              onChange={(e) => changeForm("notes", e.target.value)}
            />
          </div>
          <div className="santa-roster-heading">
            <h4>
              Personas participantes{" "}
              <span>
                {count}/{MAX_PARTICIPANTS}
              </span>
            </h4>
            <button
              type="button"
              className="text-link"
              onClick={() => setBulkOpen((v) => !v)}
            >
              {bulkOpen ? "Cerrar importación" : "Pegar una lista"}
            </button>
          </div>
          {bulkOpen && (
            <div className="santa-bulk">
              <label htmlFor="santa-bulk">
                Una persona por línea: Nombre; correo
              </label>
              <textarea
                id="santa-bulk"
                className="input-field"
                rows={4}
                value={bulk}
                onChange={(e) => setBulk(e.target.value)}
                placeholder={
                  "Ana Pérez; ana@empresa.com\nLuis Díaz; luis@empresa.com"
                }
              />
              <button
                type="button"
                className="btn btn-secondary"
                disabled={!bulk.trim()}
                onClick={importRows}
              >
                Añadir lista al grupo
              </button>
            </div>
          )}
          <div className="santa-roster">
            {rows.map((person, index) => (
              <div className="santa-person-input" key={person.id}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <input
                  aria-label={`Nombre de participante ${index + 1}`}
                  className="input-field"
                  placeholder="Nombre y apellido"
                  maxLength={80}
                  value={person.name}
                  onChange={(e) =>
                    changePerson(person.id, "name", e.target.value)
                  }
                />
                <input
                  aria-label={`Correo de participante ${index + 1}`}
                  type="email"
                  className="input-field"
                  placeholder="correo@empresa.com"
                  maxLength={254}
                  value={person.email}
                  onChange={(e) =>
                    changePerson(person.id, "email", e.target.value)
                  }
                />
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Quitar participante ${index + 1}`}
                  onClick={() => {
                    setRows((old) => old.filter((p) => p.id !== person.id));
                    setDirty(true);
                  }}
                >
                  <X size={17} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="text-link"
            disabled={rows.length >= MAX_PARTICIPANTS}
            onClick={() => {
              setRows((old) => [...old, emptyPerson()]);
              setDirty(true);
            }}
          >
            <Plus size={16} /> Añadir una persona
          </button>
        </fieldset>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="santa-draft-actions">
          <button
            className="btn btn-secondary"
            type="submit"
            disabled={busy || stale}
          >
            {busy ? (
              <LoaderCircle className="animate-spin" size={16} />
            ) : (
              <Check size={16} />
            )}{" "}
            Guardar borrador
          </button>
          <button
            type="button"
            className="btn btn-forest"
            disabled={
              busy ||
              dirty ||
              stale ||
              !event ||
              event.participantIds.length < 2
            }
            onClick={() => setConfirmDraw(true)}
          >
            <Shuffle size={17} /> Realizar sorteo
          </button>
        </div>
        <p className="field-caption">
          {dirty || !event
            ? "Guarda los cambios para habilitar el sorteo."
            : "Nadie se asignará a sí mismo. Cada persona dará y recibirá un regalo."}
        </p>
      </form>
      {confirmDraw && (
        <Modal title="¿Realizamos el sorteo?" onClose={closeDraw}>
          <p>
            <strong>{event.title}</strong> · {event.participantIds.length}{" "}
            personas.
          </p>
          <p className="santa-confirm-description">
            Las asignaciones quedarán guardadas. No se volverán a generar en
            este sorteo y no se enviará ningún correo hasta que lo confirmes en
            el siguiente paso.
          </p>
          <div className="modal-actions">
            <button
              className="btn btn-secondary"
              disabled={busy}
              onClick={closeDraw}
            >
              Revisar grupo
            </button>
            <button className="btn btn-forest" disabled={busy} onClick={draw}>
              {busy ? "Guardando sorteo…" : "Sortear y guardar"}
              <Gift size={16} />
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}

function SantaResults({ event, settings, configure }) {
  const [deliveries, setDeliveries] = useState({});
  const [visible, setVisible] = useState(false);
  const [term, setTerm] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [reviewed, setReviewed] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveBusy, setArchiveBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");
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
  useEffect(
    () =>
      onSnapshot(
        collection(db, "secretSantaEvents", event.id, "deliveries"),
        (snapshot) =>
          setDeliveries(
            Object.fromEntries(snapshot.docs.map((d) => [d.id, d.data()])),
          ),
        () =>
          setError(
            "No pudimos cargar el estado de los correos. Recarga antes de enviar.",
          ),
      ),
    [event.id],
  );
  const archived = event.status === "archived";
  const configured = validMailSettings(settings);
  const pending = event.participantIds.filter(
    (id) => !deliveries[id] || deliveries[id].state === "failed",
  );
  const accepted = event.participantIds.filter(
    (id) => deliveries[id]?.state === "accepted",
  ).length;
  const ids = event.participantIds.filter((id) =>
    normalize(`${event.people[id].name} ${event.people[id].email}`).includes(
      normalize(term),
    ),
  );
  const openSend = (id) => {
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
    if (running.current || !confirmation || !configured || archived) return;
    const choice = confirmation;
    closeConfirm();
    running.current = true;
    stop.current = false;
    setError("");
    setProgress({ done: 0, total: choice.ids.length });
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
  const archive = async () => {
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
        <span className="department-pill">{statusNames[event.status]}</span>
      </div>
      <div className="santa-result-summary">
        <div>
          <strong>{event.participantIds.length}</strong>
          <span>asignaciones guardadas</span>
        </div>
        <div>
          <strong>{accepted}</strong>
          <span>{isLocalDemo ? "envíos simulados" : "correos aceptados"}</span>
        </div>
        <div>
          <strong>{pending.length}</strong>
          <span>por enviar o reintentar</span>
        </div>
      </div>
      {archived && (
        <div className="inline-notice">
          Sorteo archivado. Sus resultados siguen guardados para Administración;
          los enlaces privados están desactivados.
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
                stop.current = true;
              }}
            >
              Detener después del actual
            </button>
          </>
        ) : (
          <>
            <button
              className="btn btn-forest"
              disabled={archived || !configured || pending.length === 0}
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
          </>
        )}
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="santa-recovery-heading">
        <div>
          <h4>Entrega y recuperación</h4>
          <p>
            Busca a una persona para recuperar su enlace o reenviar su correo.
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOff size={15} /> : <Eye size={15} />}
          {visible ? "Ocultar asignaciones" : "Ver lista de respaldo"}
        </button>
      </div>
      <div className="search-field">
        <Search size={17} />
        <input
          aria-label="Buscar participante del sorteo"
          placeholder="Busca por nombre o correo…"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
      </div>
      <div className="santa-delivery-list">
        {ids.map((id) => {
          const person = event.people[id];
          const delivery = deliveries[id];
          return (
            <article className="santa-delivery-row" key={id}>
              <div className="santa-person-summary">
                <strong>{person.name}</strong>
                <span>{person.email}</span>
                {visible && (
                  <p className="santa-target">
                    <Gift size={13} /> Le regala a:{" "}
                    <strong>
                      {event.people[event.assignments[id].recipientId].name}
                    </strong>
                  </p>
                )}
              </div>
              <span
                className={`santa-delivery-status ${delivery?.state || "pending"}`}
              >
                {stateLabel(delivery)}
              </span>
              <div className="santa-delivery-actions">
                <button
                  className="icon-button"
                  disabled={archived}
                  aria-label={`Copiar enlace privado de ${person.name}`}
                  onClick={() =>
                    copyText(
                      privateSantaLink(
                        window.location.origin,
                        event.assignments[id].cardId,
                      ),
                    )
                  }
                >
                  <Copy size={16} />
                </button>
                <button
                  className="btn btn-secondary"
                  disabled={archived || !!progress || !configured}
                  onClick={() => openSend(id)}
                  aria-label={`${delivery?.state === "accepted" ? "Reenviar" : "Enviar"} correo a ${person.name}`}
                >
                  <Mail size={14} />
                  {delivery?.state === "accepted" ? "Reenviar" : "Enviar"}
                </button>
              </div>
              {delivery?.lastError && (
                <p className="santa-delivery-error">{delivery.lastError}</p>
              )}
            </article>
          );
        })}
        {ids.length === 0 && (
          <p className="data-state">
            No encontramos personas con esa búsqueda.
          </p>
        )}
      </div>
      <div className="santa-result-footer">
        {visible && (
          <button className="text-link" onClick={downloadBackup}>
            <ArrowDownToLine size={15} /> Descargar respaldo privado
          </button>
        )}
        <button
          className="text-link"
          disabled={!!progress}
          onClick={() => setArchiveOpen(true)}
        >
          {archived ? <RefreshCw size={15} /> : <Archive size={15} />}
          {archived ? "Restaurar sorteo" : "Archivar sorteo"}
        </button>
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
      {archiveOpen && (
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

function SantaMailSettings({ initial, onSaved }) {
  const [settings, setSettings] = useState(() => ({
    ...emptySettings,
    ...initial,
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await saveSantaEmailSettings(settings);
      toast.success(
        "Configuración guardada. El primer envío confirmará la conexión con el servicio.",
      );
      onSaved();
    } catch (err) {
      setError(messageFor(err, "No pudimos guardar la configuración."));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="santa-mail-settings">
      <p>
        Conecta una cuenta existente de Gmail u Outlook con EmailJS. No
        necesitas comprar un dominio ni cambiar el plan de Firebase.
      </p>
      <ol>
        <li>
          Crea tu cuenta gratuita en{" "}
          <a
            href="https://dashboard.emailjs.com/sign-up"
            target="_blank"
            rel="noreferrer"
          >
            EmailJS
          </a>{" "}
          y conecta tu correo desde <strong>Email Services</strong>.
        </li>
        <li>
          Crea una plantilla cuyo destinatario sea <code>{"{{to_email}}"}</code>{" "}
          y asunto <code>{SECRET_SANTA_EMAIL_SUBJECT}</code>.{" "}
          <button
            className="text-link"
            type="button"
            onClick={() =>
              copyText(SECRET_SANTA_EMAIL_TEMPLATE, "Plantilla HTML copiada")
            }
          >
            Copiar contenido HTML
          </button>
        </li>
        <li>
          En la configuración de seguridad de EmailJS, autoriza el origen{" "}
          <code>{window.location.origin}</code>. Consulta la cuota disponible en
          su panel antes de enviar.
        </li>
        <li>
          Copia aquí el Service ID, Template ID y la clave{" "}
          <strong>pública</strong>. No ingreses contraseñas ni claves privadas.
        </li>
      </ol>
      <form onSubmit={save}>
        <fieldset disabled={busy}>
          {[
            ["serviceId", "Service ID", "service_…"],
            ["templateId", "Template ID", "template_…"],
            [
              "publicKey",
              "Clave pública de EmailJS",
              "Identificador público de tu cuenta",
            ],
          ].map(([key, label, placeholder]) => (
            <div className="input-group" key={key}>
              <label htmlFor={`santa-mail-${key}`}>{label}</label>
              <input
                id={`santa-mail-${key}`}
                className="input-field"
                autoComplete="off"
                maxLength={100}
                placeholder={placeholder}
                value={settings[key]}
                onChange={(e) =>
                  setSettings((old) => ({ ...old, [key]: e.target.value }))
                }
                required={settings.enabled}
                pattern="[a-zA-Z0-9_-]+"
              />
            </div>
          ))}
          <label className="santa-review-checkbox">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) =>
                setSettings((old) => ({ ...old, enabled: e.target.checked }))
              }
            />{" "}
            Habilitar envíos automáticos desde el panel
          </label>
        </fieldset>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button
            className="btn btn-secondary"
            type="button"
            disabled={busy}
            onClick={onSaved}
          >
            Cerrar
          </button>
          <button className="btn btn-forest" disabled={busy}>
            {busy ? "Guardando…" : "Guardar configuración"}
          </button>
        </div>
      </form>
      <p className="local-save-caption">
        Guardar estos datos no envía correos ni comprueba la recepción. Los
        envíos se confirman por separado desde cada sorteo.{" "}
        <a
          href="https://www.emailjs.com/pricing/"
          target="_blank"
          rel="noreferrer"
        >
          Ver plan y cuotas de EmailJS ↗
        </a>
      </p>
    </div>
  );
}

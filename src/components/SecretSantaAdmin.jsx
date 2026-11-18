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
  ArrowRight,
  ArrowDownToLine,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Copy,
  Eye,
  EyeOff,
  Gift,
  LoaderCircle,
  Mail,
  LockKeyhole,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Shuffle,
  Sparkles,
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

function SantaWorkflow({ drawn = false }) {
  return (
    <ol className="santa-workflow" aria-label="Pasos del intercambio">
      {[
        [Users, "Grupo", "Detalles y participantes"],
        [Shuffle, "Sorteo", "Una pareja para cada persona"],
        [Mail, "Envío", "Correo y recuperación"],
      ].map(([Icon, title, caption], index) => (
        <li
          key={title}
          className={
            drawn
              ? index < 2
                ? "complete"
                : "current"
              : index === 0
                ? "current"
                : ""
          }
          aria-current={
            (drawn ? index === 2 : index === 0) ? "step" : undefined
          }
        >
          <span>
            {drawn && index < 2 ? <Check size={17} /> : <Icon size={18} />}
          </span>
          <div>
            <strong>{title}</strong>
            <small>{caption}</small>
          </div>
          <b aria-hidden="true">0{index + 1}</b>
        </li>
      ))}
    </ol>
  );
}

function rosterIssues(rows) {
  const issues = {};
  const addresses = new Map();
  for (const row of rows) {
    if (!row.name.trim() && !row.email.trim()) continue;
    try {
      normalizeRoster([row]);
    } catch (error) {
      issues[row.id] = error.message;
    }
    const email = row.email.trim().toLowerCase();
    if (email) {
      if (addresses.has(email)) {
        issues[row.id] = "Este correo ya está en el grupo.";
        issues[addresses.get(email)] = "Este correo ya está en el grupo.";
      }
      addresses.set(email, row.id);
    }
  }
  return issues;
}

export default function SecretSantaAdmin() {
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState("loading");
  const [selectedId, setSelectedId] = useState(null);
  const [reload, setReload] = useState(0);
  const [settings, setSettings] = useState(emptySettings);
  const [mailOpen, setMailOpen] = useState(false);
  const [eventFilter, setEventFilter] = useState("active");
  const [unsaved, setUnsaved] = useState(false);
  const [pendingChoice, setPendingChoice] = useState(null);
  const [newDraftVersion, setNewDraftVersion] = useState(0);
  const closeMail = useCallback(() => setMailOpen(false), []);
  const closeDiscard = useCallback(() => setPendingChoice(null), []);
  const activateEvent = (id) => {
    if (id === "new") setNewDraftVersion((value) => value + 1);
    setUnsaved(false);
    setSelectedId(id);
  };
  const chooseEvent = (id) => {
    if (id === (selectedId || events[0]?.id) && id !== "new") return;
    if (unsaved) setPendingChoice(id);
    else activateEvent(id);
  };
  useEffect(() => {
    const timeout = setTimeout(() => setStatus("error"), 10000);
    const stop = onSnapshot(
      query(
        collection(db, "secretSantaEvents"),
        orderBy("createdAt", "desc"),
        limit(50),
      ),
      { includeMetadataChanges: true },
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
  const visibleEvents = events.filter(
    (event) =>
      eventFilter === "all" ||
      (eventFilter === "archived"
        ? event.status === "archived"
        : event.status !== "archived"),
  );
  return (
    <section className="santa-admin">
      <div className="santa-admin-heading">
        <div>
          <h2>Amigo secreto de Navidad</h2>
          <span className="santa-hero-caption">
            <LockKeyhole size={13} /> Asignaciones privadas y recuperables.
          </span>
        </div>
        <div className="santa-admin-art" aria-hidden="true">
          <Gift size={92} strokeWidth={0.9} />
          <span>✧</span>
          <i>✦</i>
        </div>
      </div>
      <div className="santa-module-toolbar">
        <div>
          <strong>Sorteos</strong>
          <span>
            {events.length}{" "}
            {events.length === 1 ? "sorteo guardado" : "sorteos guardados"}
          </span>
        </div>
        <div>
          <button
            className="btn btn-secondary"
            onClick={() => setMailOpen(true)}
          >
            <Settings2 size={15} /> Configurar correo
          </button>
          <button className="btn btn-forest" onClick={() => chooseEvent("new")}>
            <Plus size={16} /> Nuevo sorteo
          </button>
        </div>
      </div>
      <SantaWorkflow drawn={!!selected && selected.status !== "draft"} />
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
                : "Correo pendiente de configurar"}
          </strong>
          <details className="inline-details">
            <summary>Detalles del envío</summary>
            <p>
              {isLocalDemo
                ? "No se enviará ningún correo real desde este entorno."
                : validMailSettings(settings)
                  ? "El proveedor confirmará cada envío. Aceptado no significa entregado en la bandeja del destinatario."
                  : "Puedes utilizar Gmail u Outlook mediante EmailJS, sin dominio propio. El sorteo y sus enlaces se guardan aunque el correo esté pendiente."}
            </p>
          </details>
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
            <Gift size={16} /> Mis intercambios
          </h3>
          <label className="santa-event-filter">
            Mostrar
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
            >
              <option value="active">En preparación y activos</option>
              <option value="archived">Archivados</option>
              <option value="all">Todos los sorteos</option>
            </select>
          </label>
          {status === "loading" ? (
            <p role="status">Cargando sorteos…</p>
          ) : status === "error" ? (
            <p role="alert">
              No pudimos cargar los sorteos. Recarga la página para reintentar.
            </p>
          ) : events.length === 0 ? (
            <p>Tu primer intercambio empieza con una lista de personas.</p>
          ) : (
            visibleEvents.map((event) => (
              <button
                key={event.id}
                className={`${selected?.id === event.id ? "active" : ""} event-${event.status}`}
                aria-pressed={selected?.id === event.id}
                onClick={() => chooseEvent(event.id)}
              >
                <span>
                  <strong>{event.title}</strong>
                  <small>
                    <Users size={12} /> {event.participantIds.length} personas
                  </small>
                  <em>{statusNames[event.status]}</em>
                </span>
                <Gift size={16} />
              </button>
            ))
          )}
          {status === "ready" &&
            events.length > 0 &&
            visibleEvents.length === 0 && (
              <p>No hay sorteos en esta vista. Prueba otro filtro.</p>
            )}
          {events.length === 50 && <p>Se muestran los últimos 50 sorteos.</p>}
        </aside>
        <div className="santa-workspace">
          {selectedId === "new" ? (
            <SantaDraft
              key={`new-${newDraftVersion}`}
              onSaved={setSelectedId}
              onDirtyChange={setUnsaved}
            />
          ) : selected ? (
            selected.status === "draft" ? (
              <SantaDraft
                key={`${selected.id}-${reload}`}
                event={selected}
                onSaved={setSelectedId}
                onReload={() => setReload((v) => v + 1)}
                onDirtyChange={setUnsaved}
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
            <div className="panel empty-state santa-first-event">
              <span className="santa-empty-gift">
                <Gift size={49} strokeWidth={1.1} />
                <i aria-hidden="true">✦</i>
              </span>
              <span className="eyebrow">EL PRIMER PASO ES REUNIRNOS</span>
              <h3>Una lista. Muchas sonrisas.</h3>
              <p>
                Prepara tu intercambio en unos pasos. Puedes guardar un borrador
                y continuar cuando quieras.
              </p>
              <div className="santa-empty-facts">
                <span>
                  <Users size={15} /> De 2 a 100 personas
                </span>
                <span>
                  <ShieldCheck size={15} /> Respaldo privado
                </span>
              </div>
              <button
                className="btn btn-forest"
                onClick={() => chooseEvent("new")}
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
      {pendingChoice !== null && (
        <Modal title="Tienes cambios sin guardar" onClose={closeDiscard}>
          <p>
            Si cambias de sorteo, perderás los cambios de este borrador. Puedes
            seguir editando y guardarlo primero.
          </p>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={closeDiscard}>
              Seguir editando
            </button>
            <button
              className="btn btn-forest"
              onClick={() => {
                activateEvent(pendingChoice);
                closeDiscard();
              }}
            >
              Descartar cambios
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}

function SantaDraft({ event, onSaved, onReload, onDirtyChange }) {
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
  const [step, setStep] = useState(event ? 2 : 1);
  const [touched, setTouched] = useState({});
  const [attempted, setAttempted] = useState(false);
  const titleInput = useRef(null);
  const stepHeading = useRef(null);
  const nameInputs = useRef({});
  const focusAdded = useRef(false);
  const issues = rosterIssues(rows);
  const saving = useRef(false);
  const closeDraw = useCallback(() => setConfirmDraw(false), []);
  const count = rows.filter((p) => p.name.trim() || p.email.trim()).length;
  const stale = event && event.revision !== revision;
  useEffect(() => {
    stepHeading.current?.focus({ preventScroll: true });
  }, [step]);
  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);
  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  useEffect(() => {
    if (focusAdded.current) {
      nameInputs.current[rows.at(-1)?.id]?.focus();
      focusAdded.current = false;
    }
  }, [rows]);
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
    setAttempted(true);
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
  const nextStep = () => {
    if (!form.title.trim()) {
      setError("Ponle un nombre al intercambio para continuar.");
      titleInput.current?.focus();
      return;
    }
    setError("");
    setStep(2);
  };
  return (
    <section className="panel santa-draft">
      <div className="santa-section-heading">
        <span className="quick-icon green">
          <Users size={21} />
        </span>
        <div>
          <h3 ref={stepHeading} tabIndex={-1}>
            {step === 1 ? "Detalles del intercambio" : "Participantes"}
          </h3>
        </div>
        <span className="department-pill">Borrador</span>
      </div>
      <div className="santa-draft-tabs" aria-label="Preparación del grupo">
        <button
          type="button"
          className={step === 1 ? "active" : ""}
          aria-current={step === 1 ? "step" : undefined}
          onClick={() => setStep(1)}
        >
          <span>01</span> El intercambio {step === 2 && <Check size={14} />}
        </button>
        <button
          type="button"
          className={step === 2 ? "active" : ""}
          aria-current={step === 2 ? "step" : undefined}
          onClick={nextStep}
        >
          <span>02</span> Las personas <b>{count}</b>
        </button>
      </div>
      {stale && (
        <div className="inline-notice" role="alert">
          Otra persona modificó este borrador. Tus cambios siguen aquí.
          <button className="text-link" onClick={onReload}>
            Recargar versión guardada
          </button>
        </div>
      )}
      <form
        onSubmit={
          step === 1
            ? (e) => {
                e.preventDefault();
                nextStep();
              }
            : save
        }
        noValidate={step === 2}
      >
        <fieldset disabled={busy}>
          {step === 1 ? (
            <div className="santa-details-fields">
              <div className="input-group">
                <label htmlFor="santa-title">Nombre del sorteo *</label>
                <input
                  id="santa-title"
                  ref={titleInput}
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
                    Fecha del intercambio{" "}
                    <span className="muted">(opcional)</span>
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
              <div className="santa-detail-tip">
                <Sparkles size={18} />
                <p>
                  Estos detalles viajarán con cada invitación. Puedes dejarlos
                  para después y completar primero tu grupo.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="santa-draft-recap">
                <Gift size={19} />
                <div>
                  <strong>{form.title}</strong>
                  <span>
                    {form.budget || "Presupuesto por coordinar"} ·{" "}
                    {form.exchangeDate
                      ? readableExchangeDate(form.exchangeDate)
                      : "Fecha por coordinar"}
                  </span>
                </div>
                <button
                  type="button"
                  className="text-link"
                  onClick={() => setStep(1)}
                >
                  Editar detalles
                </button>
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
                  className="btn btn-secondary santa-import-button"
                  onClick={() => setBulkOpen((v) => !v)}
                >
                  <Copy size={14} />{" "}
                  {bulkOpen ? "Cerrar importación" : "Pegar una lista"}
                </button>
              </div>
              {bulkOpen && (
                <div className="santa-bulk">
                  <label htmlFor="santa-bulk">
                    Una persona por línea: Nombre; correo
                  </label>
                  <p>
                    Pega las columnas de una hoja de cálculo o separa el nombre
                    y el correo con punto y coma.
                  </p>
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
                  <div
                    className={`santa-person-input ${issues[person.id] && (touched[person.id] || attempted) ? "has-error" : ""}`}
                    key={person.id}
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <input
                      aria-label={`Nombre de participante ${index + 1}`}
                      ref={(element) => {
                        nameInputs.current[person.id] = element;
                      }}
                      aria-invalid={
                        !!issues[person.id] && (touched[person.id] || attempted)
                      }
                      aria-describedby={
                        issues[person.id] && (touched[person.id] || attempted)
                          ? `santa-issue-${person.id}`
                          : undefined
                      }
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
                      onBlur={() =>
                        setTouched((old) => ({ ...old, [person.id]: true }))
                      }
                      aria-invalid={
                        !!issues[person.id] && (touched[person.id] || attempted)
                      }
                      aria-describedby={
                        issues[person.id] && (touched[person.id] || attempted)
                          ? `santa-issue-${person.id}`
                          : undefined
                      }
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
                    {issues[person.id] && (touched[person.id] || attempted) && (
                      <small
                        className="santa-row-issue"
                        id={`santa-issue-${person.id}`}
                      >
                        <CircleAlert size={13} />
                        {issues[person.id]}
                      </small>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="santa-add-person"
                disabled={rows.length >= MAX_PARTICIPANTS}
                onClick={() => {
                  focusAdded.current = true;
                  setRows((old) => [...old, emptyPerson()]);
                  setDirty(true);
                }}
              >
                <Plus size={16} /> Añadir una persona
              </button>
              <p className="santa-roster-help">
                <ShieldCheck size={14} /> La lista completa solo es visible para
                administradores.
              </p>
            </>
          )}
        </fieldset>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {step === 1 ? (
          <div className="santa-draft-actions">
            <span className="santa-save-status">
              <Clock3 size={14} /> Los detalles opcionales pueden esperar
            </span>
            <button type="submit" className="btn btn-forest" disabled={busy}>
              Continuar al equipo <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <>
            <div
              className={`santa-ready-note ${event && !dirty && !stale && count >= 2 ? "ready" : ""}`}
            >
              <CheckCircle2 size={19} />
              <div>
                <strong>
                  {event && !dirty && !stale && count >= 2
                    ? "Tu grupo está listo para sortear"
                    : "Revisa y guarda tu grupo"}
                </strong>
                <p>
                  {count < 2
                    ? "Necesitas al menos dos personas para comenzar."
                    : dirty || !event
                      ? "Guarda el borrador para habilitar el sorteo."
                      : "Cada persona dará y recibirá un regalo. El sorteo se guarda antes de enviar correos."}
                </p>
              </div>
            </div>
            <div className="santa-draft-actions">
              <span className={`santa-save-status ${dirty ? "unsaved" : ""}`}>
                {dirty || !event ? (
                  <Clock3 size={14} />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                {dirty || !event ? "Cambios sin guardar" : "Borrador guardado"}
              </span>
              <div>
                <button
                  className="btn btn-secondary"
                  type="submit"
                  disabled={busy || stale || (!!event && !dirty)}
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
            </div>
            <p className="field-caption">
              {dirty || !event
                ? "Guarda los cambios para habilitar el sorteo."
                : "Nadie se asignará a sí mismo. Cada persona dará y recibirá un regalo."}
            </p>
          </>
        )}
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
  const [deliveryStatus, setDeliveryStatus] = useState("loading");
  const [filter, setFilter] = useState("all");
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
  const configured = validMailSettings(settings);
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
        <span
          className={`santa-event-status ${archived ? "archived" : "drawn"}`}
        >
          <CheckCircle2 size={13} /> {statusNames[event.status]}
        </span>
      </div>
      <div className="santa-result-summary">
        <div>
          <Users size={17} />
          <strong>{event.participantIds.length}</strong>
          <span>asignaciones guardadas</span>
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
      {archived && (
        <div className="inline-notice">
          Sorteo archivado. Sus resultados siguen guardados para Administración;
          los enlaces privados están desactivados.
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
                ? "Un último paso: conecta tu correo"
                : review > 0
                  ? "Hay envíos que necesitan una mirada"
                  : pending.length === 0
                    ? "Cada sorpresa tiene su invitación"
                    : "Todo listo para compartir la sorpresa"}
            </strong>
            <p>
              {!configured
                ? "Tu sorteo ya está guardado. Conecta Gmail u Outlook para enviar las invitaciones."
                : review > 0
                  ? "Consulta el historial de EmailJS antes de reenviar un mensaje sin confirmación."
                  : pending.length === 0
                    ? isLocalDemo
                      ? "Se completaron los envíos de prueba."
                      : "Los correos aceptados están registrados. Puedes recuperar cada enlace cuando lo necesites."
                    : `${pending.length} ${pending.length === 1 ? "persona espera" : "personas esperan"} su asignación. Cada correo incluirá su enlace privado.`}
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
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="santa-recovery-heading">
        <div>
          <h4>Las personas y sus invitaciones</h4>
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
      {visible && (
        <div className="santa-backup-notice" role="status">
          <Eye size={17} />
          <p>
            Estás viendo las parejas. Este respaldo es privado; evita compartir
            tu pantalla o el archivo con el grupo.
          </p>
          <button className="text-link" onClick={downloadBackup}>
            <ArrowDownToLine size={14} /> Descargar CSV
          </button>
        </div>
      )}
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
        <div
          className="santa-delivery-filters"
          aria-label="Filtrar invitaciones por estado"
        >
          {[
            ["all", "Todos", event.participantIds.length],
            ["pending", "Pendientes", pending.length],
            ["accepted", isLocalDemo ? "Simulados" : "Aceptados", accepted],
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
      </div>
      {deliveryStatus === "ready" && (
        <p className="santa-list-count">
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
      )}
      <div className="santa-delivery-list">
        {ids.map((id) => {
          const person = event.people[id];
          const delivery = deliveries[id];
          return (
            <article className="santa-delivery-row" key={id}>
              <span className="santa-person-avatar" aria-hidden="true">
                {person.name
                  .trim()
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")}
              </span>
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
                {delivery?.state === "accepted" ? (
                  <CheckCircle2 size={12} />
                ) : ["uncertain", "failed"].includes(delivery?.state) ? (
                  <CircleAlert size={12} />
                ) : (
                  <Clock3 size={12} />
                )}
                {stateLabel(delivery)}
              </span>
              <div className="santa-delivery-actions">
                <button
                  className="icon-button"
                  disabled={archived}
                  title="Copiar enlace privado"
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
                  <Copy size={15} />
                  <span>Enlace</span>
                </button>
                <button
                  className="btn btn-secondary"
                  disabled={
                    archived ||
                    !!progress ||
                    !configured ||
                    deliveryStatus !== "ready"
                  }
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
          <div className="santa-no-matches">
            <Search size={25} />
            <strong>No hay personas en esta vista</strong>
            <p>Prueba otro estado o cambia la búsqueda.</p>
            <button
              className="text-link"
              onClick={() => {
                setTerm("");
                setFilter("all");
              }}
            >
              Ver todo el grupo <ArrowRight size={14} />
            </button>
          </div>
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

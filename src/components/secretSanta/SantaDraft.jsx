import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Copy,
  Gift,
  LoaderCircle,
  Plus,
  ShieldCheck,
  Shuffle,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import Modal from "../Modal";
import {
  MAX_PARTICIPANTS,
  emptyPerson,
  normalizeRoster,
  parseParticipantLines,
  readableExchangeDate,
} from "../../lib/secretSanta";
import { drawSanta, saveSantaDraft } from "../../lib/secretSantaStore";
import "../../secret-santa-links.css";
import "../../secret-santa-experience.css";
import { messageFor } from "./shared";
import { rosterIssues } from "../../lib/secretSantaRoster";

export default function SantaDraft({
  event,
  onSaved,
  onReload,
  onDirtyChange,
}) {
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
    if (bulk.trim()) {
      setError(
        "Primero pulsa «Añadir lista al grupo» para incluir las personas que pegaste.",
      );
      document.getElementById("santa-bulk")?.focus();
      return;
    }
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
                    onChange={(e) => {
                      setBulk(e.target.value);
                      setDirty(true);
                    }}
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
                      onBlur={() =>
                        setTouched((old) => ({ ...old, [person.id]: true }))
                      }
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
                  {Object.keys(issues).length > 0
                    ? `Revisa ${Object.keys(issues).length} ${Object.keys(issues).length === 1 ? "participante" : "participantes"}`
                    : event && !dirty && !stale && count >= 2
                      ? "Tu grupo está listo para sortear"
                      : "Revisa y guarda tu grupo"}
                </strong>
                <p>
                  {Object.keys(issues).length > 0
                    ? "Completa los nombres y revisa los correos señalados antes de guardar."
                    : count < 2
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
                  {busy ? "Guardando…" : "Guardar borrador"}
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

import { useCallback, useEffect, useState } from "react";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import {
  ChevronDown,
  Gift,
  LoaderCircle,
  LockKeyhole,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { db } from "../../firebase";
import Modal from "../Modal";
import { normalize } from "../../lib/preferences";
import "../../secret-santa-links.css";
import "../../secret-santa-experience.css";
import { emptySettings, statusNames } from "./shared";
import SantaWorkflow from "./SantaWorkflow";
import SantaDraft from "./SantaDraft";
import SantaResults from "./SantaResults";
import SantaMailSettings from "./SantaMailSettings";
import SantaReadOnlyDraft from "./SantaReadOnlyDraft";

export default function SecretSantaAdmin({ access }) {
  const canManage = access?.permissions.includes("santa.manage") === true;
  const canMail = access?.permissions.includes("santa.mail") === true;
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState("loading");
  const [selectedId, setSelectedId] = useState(null);
  const [reload, setReload] = useState(0);
  const [settings, setSettings] = useState(emptySettings);
  const [mailOpen, setMailOpen] = useState(false);
  const [eventFilter, setEventFilter] = useState("all");
  const [eventSearch, setEventSearch] = useState("");
  const [eventsOpen, setEventsOpen] = useState(false);
  const [unsaved, setUnsaved] = useState(false);
  const [pendingChoice, setPendingChoice] = useState(null);
  const [newDraftVersion, setNewDraftVersion] = useState(0);
  const closeMail = useCallback(() => setMailOpen(false), []);
  const closeDiscard = useCallback(() => setPendingChoice(null), []);
  const activateEvent = (id) => {
    if (id === "new") setNewDraftVersion((value) => value + 1);
    setUnsaved(false);
    setSelectedId(id);
    setEventsOpen(false);
  };
  const chooseEvent = (id) => {
    if (id === "new" && !canManage) return;
    if (id === (selectedId || events[0]?.id) && id !== "new") {
      setEventsOpen(false);
      return;
    }
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
    const stopSettings = canMail
      ? onSnapshot(
          doc(db, "portalSettings", "secretSantaEmail"),
          (snapshot) =>
            setSettings(snapshot.exists() ? snapshot.data() : emptySettings),
          () => setSettings(emptySettings),
        )
      : () => {};
    return () => {
      clearTimeout(timeout);
      stop();
      stopSettings();
    };
  }, [canMail]);
  const selected =
    selectedId === "new"
      ? null
      : selectedId
        ? events.find((e) => e.id === selectedId)
        : events[0];
  const visibleEvents = events.filter(
    (event) =>
      normalize(event.title).includes(normalize(eventSearch)) &&
      (eventFilter === "all" ||
        (eventFilter === "archived"
          ? event.status === "archived"
          : event.status !== "archived")),
  );
  return (
    <section className="santa-admin santa-experience">
      <div className="santa-admin-heading">
        <div>
          <span className="santa-kicker">
            <Gift size={14} /> AMIGO SECRETO · ORGANIZACIÓN
          </span>
          <h2>Regala un buen momento.</h2>
          <p>
            {canManage
              ? "Reúne al equipo. Prepara el sorteo. Comparte la sorpresa."
              : "Consulta los intercambios y recupera las invitaciones del equipo."}
          </p>
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
          {canMail && (
            <button
              className="btn btn-secondary"
              onClick={() => setMailOpen(true)}
            >
              <Settings2 size={15} /> Configurar correo
            </button>
          )}
          {canManage && (
            <button
              className="btn btn-forest"
              onClick={() => chooseEvent("new")}
            >
              <Plus size={16} /> Nuevo sorteo
            </button>
          )}
        </div>
      </div>
      <div className="santa-admin-layout">
        <aside
          className="panel santa-events-nav"
          aria-label="Sorteos guardados"
          data-expanded={eventsOpen}
        >
          <h3>
            <Gift size={16} /> Mis intercambios
            <button
              className="santa-events-toggle"
              aria-expanded={eventsOpen}
              aria-label={
                eventsOpen ? "Cerrar lista de sorteos" : "Elegir un sorteo"
              }
              onClick={() => setEventsOpen((value) => !value)}
            >
              <ChevronDown size={18} />
            </button>
          </h3>
          <p className="santa-event-selection">
            {selectedId === "new"
              ? "Nuevo intercambio"
              : selected?.title ||
                (canManage
                  ? "Elige o crea un intercambio"
                  : "Elige un intercambio")}
          </p>
          <div className="search-field santa-event-search">
            <Search size={15} />
            <input
              aria-label="Buscar un sorteo"
              placeholder="Buscar un sorteo…"
              value={eventSearch}
              onChange={(e) => setEventSearch(e.target.value)}
            />
          </div>
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
            <p>
              {canManage
                ? "Tu primer intercambio empieza con una lista de personas."
                : "Aquí aparecerán los intercambios que prepare un organizador."}
            </p>
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
          <SantaWorkflow
            drawn={!!selected && selected.status !== "draft"}
            ready={
              selected?.status === "draft" &&
              !unsaved &&
              selected.participantIds.length >= 2
            }
          />
          {selectedId === "new" && canManage ? (
            <SantaDraft
              key={`new-${newDraftVersion}`}
              onSaved={setSelectedId}
              onDirtyChange={setUnsaved}
            />
          ) : selected ? (
            selected.status === "draft" ? (
              canManage ? (
                <SantaDraft
                  key={`${selected.id}-${reload}`}
                  event={selected}
                  onSaved={setSelectedId}
                  onReload={() => setReload((v) => v + 1)}
                  onDirtyChange={setUnsaved}
                />
              ) : (
                <SantaReadOnlyDraft event={selected} />
              )
            ) : (
              <SantaResults
                key={selected.id}
                event={selected}
                settings={settings}
                configure={() => setMailOpen(true)}
                canManage={canManage}
                canMail={canMail}
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
              <span className="eyebrow">
                {canManage
                  ? "EL PRIMER PASO ES REUNIRNOS"
                  : "INTERCAMBIOS DEL EQUIPO"}
              </span>
              <h3>
                {canManage
                  ? "Una lista. Muchas sonrisas."
                  : "Todavía no hay intercambios."}
              </h3>
              <p>
                {canManage
                  ? "Prepara tu intercambio en unos pasos. Puedes guardar un borrador y continuar cuando quieras."
                  : "Cuando un organizador prepare un intercambio, podrás consultar sus detalles y participantes desde aquí."}
              </p>
              <div className="santa-empty-facts">
                <span>
                  <Users size={15} /> De 2 a 100 personas
                </span>
                <span>
                  <ShieldCheck size={15} /> Respaldo privado
                </span>
              </div>
              {canManage && (
                <button
                  className="btn btn-forest"
                  onClick={() => chooseEvent("new")}
                >
                  Crear mi primer sorteo <Plus size={16} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      {mailOpen && canMail && (
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

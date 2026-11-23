import { useCallback, useEffect, useRef, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Gift,
  Play,
  RotateCcw,
  Plus,
  Save,
  Snowflake,
  Trophy,
} from "lucide-react";
import toast from "react-hot-toast";
import { db } from "../firebase";
import {
  archiveQuiz,
  changeQuizPhase,
  closeQuizRound,
  nextQuizQuestion,
  openQuizLobby,
  quizAnswersRef,
  saveQuizDraft,
  resetQuiz,
} from "../lib/quizStore";
import {
  emptyQuiz,
  milliseconds,
  normalizeQuizDraft,
  quizQuestionReady,
  QUIZ_MAX_POINTS,
  QUIZ_SCORE_STEP,
  QUIZ_MIN_QUESTIONS,
  QUIZ_MAX_QUESTIONS,
  QUIZ_MIN_OPTIONS,
  QUIZ_MAX_OPTIONS,
  QUIZ_OPTION_LETTERS,
  resizeQuizQuestions,
  resizeQuizOptions,
} from "../lib/quiz";
import { useQuizClock, useQuizRoom } from "../lib/quizHooks";
import QuizStage from "./QuizStage";
import { quizJoinUrl } from "../lib/quiz";
import Modal from "./Modal";
import "../quiz.css";

const labels = {
  draft: "Borrador",
  live: "En vivo",
  finished: "Finalizado",
  archived: "Archivado",
};
export default function QuizAdmin() {
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(
    () =>
      onSnapshot(
        collection(db, "quizEvents"),
        (snapshot) => {
          setEvents(
            snapshot.docs
              .map((d) => ({ id: d.id, ...d.data() }))
              .sort(
                (a, b) => milliseconds(b.createdAt) - milliseconds(a.createdAt),
              ),
          );
          setLoading(false);
          setError("");
        },
        () => {
          setError(
            "No pudimos cargar los concursos. Revisa tu conexión o tus permisos.",
          );
          setLoading(false);
        },
      ),
    [retry],
  );
  const event = events.find((e) => e.id === selected) || events[0];
  const canLeave = () =>
    !dirty ||
    window.confirm(
      "Tienes preguntas sin guardar. ¿Quieres descartar esos cambios?",
    );
  const create = async (copy = false) => {
    if (!canLeave()) return;
    setBusy(true);
    try {
      const form = copy
        ? {
            title: `${event.title.slice(0, 90)} · Copia`,
            questions: event.questions,
          }
        : emptyQuiz();
      const id = await saveQuizDraft(null, form);
      setSelected(id);
      setDirty(false);
      toast.success(
        copy
          ? "Copia lista para editar."
          : "Concurso creado. Completa tus preguntas.",
      );
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="quiz-admin">
      <header className="quiz-admin-heading">
        <div>
          <span className="quiz-kicker">
            <Snowflake size={15} /> APRENDER TAMBIÉN PUEDE SER UN JUEGO
          </span>
          <h2>Concurso en vivo</h2>
          <p>
            Tu exposición de Tickets de implementación, con un toque navideño.
          </p>
        </div>
        <button
          className="btn btn-primary"
          disabled={busy || loading}
          onClick={() => create()}
        >
          <Plus size={17} /> Nuevo concurso
        </button>
      </header>
      {error && (
        <p className="form-error" role="alert">
          {error}{" "}
          <button className="text-link" onClick={() => setRetry((n) => n + 1)}>
            Reintentar
          </button>
        </p>
      )}
      {loading ? (
        <p role="status">Cargando concursos…</p>
      ) : !event ? (
        <div className="quiz-empty">
          <Trophy size={48} />
          <h3>Prepara tu primera competencia</h3>
          <p>
            Elige tus preguntas y alternativas. Después abre el registro y
            comparte el QR.
          </p>
          <button
            className="btn btn-forest"
            onClick={() => create()}
            disabled={busy}
          >
            Crear concurso
          </button>
        </div>
      ) : (
        <>
          <div className="quiz-event-select">
            <label htmlFor="quiz-event">Concurso guardado</label>
            <select
              id="quiz-event"
              value={event.id}
              onChange={(e) => {
                if (canLeave()) {
                  setSelected(e.target.value);
                  setDirty(false);
                }
              }}
            >
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title} · {labels[e.status]} · {e.id}
                </option>
              ))}
            </select>
            <button
              className="btn btn-secondary"
              disabled={busy}
              onClick={() => create(true)}
            >
              <Copy size={16} /> Duplicar guardado
            </button>
            {event.status !== "draft" && (
              <button
                className="btn btn-secondary"
                disabled={busy}
                onClick={() => setResetting(true)}
              >
                <RotateCcw size={16} /> Reiniciar este concurso
              </button>
            )}
          </div>
          {event.status === "draft" ? (
            <QuizEditor key={event.id} event={event} onDirty={setDirty} />
          ) : event.status === "archived" ? (
            <div className="quiz-empty">
              <Gift size={42} />
              <h3>Concurso archivado</h3>
              <p>
                El enlace público está cerrado. Puedes duplicar sus preguntas
                para una nueva exposición.
              </p>
            </div>
          ) : (
            <QuizHost key={event.id} event={event} />
          )}
        </>
      )}
      {resetting && event && (
        <Modal
          title="Reiniciar este concurso"
          onClose={() => !busy && setResetting(false)}
        >
          <p>
            Se borrarán los participantes, respuestas y puntajes de esta
            partida. Las preguntas, el título, el código y el enlace se
            conservan para volver a usar el mismo concurso. Descarga el CSV
            antes si necesitas guardar los resultados.
          </p>
          <div className="modal-actions">
            <button
              className="btn btn-secondary"
              disabled={busy}
              onClick={() => setResetting(false)}
            >
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await resetQuiz(event.id, event.revision);
                  setResetting(false);
                  toast.success(
                    "Concurso reiniciado. Abre el registro para empezar de nuevo.",
                  );
                } catch (e) {
                  toast.error(e.message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Reiniciando…" : "Borrar partida y conservar preguntas"}
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
function QuizEditor({ event, onDirty }) {
  const initial = { title: event.title, questions: event.questions };
  const [form, setForm] = useState(initial);
  const [baseline, setBaseline] = useState(JSON.stringify(initial));
  const [revision, setRevision] = useState(event.revision);
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resize, setResize] = useState(null);
  const closeResize = useCallback(() => setResize(null), []);
  const dirty = JSON.stringify(form) !== baseline;
  const changedElsewhere = event.revision !== revision;
  useEffect(() => {
    onDirty(dirty);
    return () => onDirty(false);
  }, [dirty, onDirty]);
  useEffect(() => {
    if (!dirty) return;
    const protect = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", protect);
    return () => window.removeEventListener("beforeunload", protect);
  }, [dirty]);
  const update = (patch) =>
    setForm((f) => ({
      ...f,
      questions: f.questions.map((q, i) =>
        i === index ? { ...q, ...patch } : q,
      ),
    }));
  const ready = form.questions.filter(quizQuestionReady).length;
  const q = form.questions[index];
  const applyResize = (type, count) => {
    if (type === "questions") {
      setForm((f) => ({
        ...f,
        questions: resizeQuizQuestions(f.questions, count),
      }));
      setIndex((old) => Math.min(old, count - 1));
    } else update(resizeQuizOptions(q, count));
    setError("");
    closeResize();
  };
  const chooseCount = (type, count) => {
    const current =
      type === "questions" ? form.questions.length : q.options.length;
    if (count < current) setResize({ type, count });
    else applyResize(type, count);
  };
  const save = async () => {
    setBusy(true);
    setError("");
    try {
      const normalized = normalizeQuizDraft(form);
      await saveQuizDraft(event.id, normalized, revision);
      setForm(normalized);
      setBaseline(JSON.stringify(normalized));
      setRevision((r) => r + 1);
      toast.success("Preguntas guardadas.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const open = async () => {
    setBusy(true);
    setError("");
    try {
      await openQuizLobby(event.id, revision);
      toast.success("Registro abierto. Ya puedes proyectar el QR.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="quiz-editor">
      <div className="quiz-editor-toolbar">
        <span className="quiz-draft-state">
          {dirty ? "Cambios sin guardar" : "Guardado"} · {ready}/
          {form.questions.length} listas
        </span>
        <button
          className="btn btn-forest"
          onClick={save}
          disabled={busy || !dirty || changedElsewhere}
        >
          <Save size={16} /> Guardar preguntas
        </button>
      </div>
      {changedElsewhere && (
        <p className="inline-notice">
          Otra persona guardó una versión distinta. Tus cambios siguen aquí.{" "}
          <button
            className="text-link"
            onClick={() => {
              if (
                !dirty ||
                window.confirm(
                  "¿Descartar tus cambios y abrir la versión guardada?",
                )
              ) {
                const f = { title: event.title, questions: event.questions };
                setForm(f);
                setBaseline(JSON.stringify(f));
                setRevision(event.revision);
                setIndex((old) => Math.min(old, f.questions.length - 1));
                setError("");
              }
            }}
          >
            Abrir versión guardada
          </button>
        </p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <label className="quiz-field">
        Título de la exposición
        <input
          value={form.title}
          maxLength={100}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          disabled={busy}
        />
      </label>
      <div className="quiz-count-settings">
        <label className="quiz-field">
          Cantidad de preguntas
          <select
            value={form.questions.length}
            onChange={(e) => chooseCount("questions", Number(e.target.value))}
            disabled={busy || changedElsewhere}
          >
            {Array.from(
              { length: QUIZ_MAX_QUESTIONS - QUIZ_MIN_QUESTIONS + 1 },
              (_, i) => i + QUIZ_MIN_QUESTIONS,
            ).map((count) => (
              <option key={count} value={count}>
                {count} {count === 1 ? "pregunta" : "preguntas"}
              </option>
            ))}
          </select>
        </label>
        <p>
          Incluye el bonus: la última pregunta siempre vale ×2, con el mismo
          tope de {QUIZ_MAX_POINTS} puntos. Puedes elegir las alternativas de
          cada pregunta.
        </p>
      </div>
      <div className="quiz-editor-grid">
        <nav className="quiz-question-nav" aria-label="Preguntas del concurso">
          {form.questions.map((question, i) => (
            <button
              key={i}
              aria-label={`Pregunta ${i + 1}${i === form.questions.length - 1 ? " · Bonus ×2" : ""}`}
              aria-pressed={i === index}
              className={i === index ? "is-active" : ""}
              onClick={() => setIndex(i)}
            >
              {i === form.questions.length - 1 ? (
                <Gift size={18} />
              ) : (
                <span>{i + 1}</span>
              )}
              <span>
                {i === form.questions.length - 1
                  ? `Pregunta ${i + 1} · Bonus ×2`
                  : `Pregunta ${i + 1}`}
              </span>
              {quizQuestionReady(question) && <Check size={16} />}
            </button>
          ))}
        </nav>
        <div className="quiz-question-editor">
          <div className="quiz-question-meta">
            <span>
              {index === form.questions.length - 1
                ? "BONUS TRACK · VALOR DOBLE"
                : `PREGUNTA ${index + 1} DE ${form.questions.length}`}
            </span>
            <label>
              Tiempo
              <select
                aria-label="Tiempo para responder"
                value={q.seconds}
                onChange={(e) => update({ seconds: Number(e.target.value) })}
                disabled={busy}
              >
                {[10, 15, 20, 30, 45, 60, 90].map((s) => (
                  <option key={s} value={s}>
                    {s} segundos
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="quiz-field">
            Pregunta
            <textarea
              rows={3}
              maxLength={500}
              value={q.prompt}
              onChange={(e) => update({ prompt: e.target.value })}
              disabled={busy}
              placeholder={
                index === form.questions.length - 1
                  ? "Tu desafío final para el equipo…"
                  : "¿Qué quieres reforzar de Tickets de implementación?"
              }
            />
          </label>
          <label className="quiz-field quiz-option-count">
            Alternativas de esta pregunta
            <select
              value={q.options.length}
              onChange={(e) => chooseCount("options", Number(e.target.value))}
              disabled={busy || changedElsewhere}
            >
              {q.options.length > QUIZ_MAX_OPTIONS && (
                <option value={q.options.length} disabled>
                  {q.options.length} anteriores · elige de 2 a 5
                </option>
              )}
              {Array.from(
                { length: QUIZ_MAX_OPTIONS - QUIZ_MIN_OPTIONS + 1 },
                (_, i) => i + QUIZ_MIN_OPTIONS,
              ).map((count) => (
                <option key={count} value={count}>
                  {count} alternativas
                </option>
              ))}
            </select>
          </label>
          {q.options.length > QUIZ_MAX_OPTIONS && (
            <p className="form-error" role="alert">
              Esta pregunta tiene más de cinco alternativas. Elige de 2 a 5
              antes de guardar; te pediremos confirmar la reducción.
            </p>
          )}
          <fieldset className="quiz-editor-options">
            <legend>Alternativas · marca una respuesta correcta</legend>
            {q.options.map((option, i) => (
              <div key={i} className={q.correctIndex === i ? "is-correct" : ""}>
                <label>
                  <input
                    type="radio"
                    name={`correct-${index}`}
                    checked={q.correctIndex === i}
                    onChange={() => update({ correctIndex: i })}
                    aria-label={`Marcar ${QUIZ_OPTION_LETTERS[i]} como correcta`}
                    disabled={busy}
                  />
                  <b>{QUIZ_OPTION_LETTERS[i]}</b>
                </label>
                <input
                  aria-label={`Opción ${QUIZ_OPTION_LETTERS[i]}`}
                  maxLength={150}
                  value={option}
                  onChange={(e) =>
                    update({
                      options: q.options.map((v, n) =>
                        n === i ? e.target.value : v,
                      ),
                    })
                  }
                  placeholder={`Respuesta ${QUIZ_OPTION_LETTERS[i]}`}
                  disabled={busy}
                />
                {q.correctIndex === i && <span>Correcta</span>}
              </div>
            ))}
          </fieldset>
          <div className="quiz-editor-pager">
            <button
              className="text-link"
              onClick={() => setIndex((n) => n - 1)}
              disabled={index === 0}
            >
              Anterior
            </button>
            <button
              className="text-link"
              onClick={() => setIndex((n) => n + 1)}
              disabled={index === form.questions.length - 1}
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
      <div className="quiz-open-registration">
        <div>
          <strong>Cuando todas estén listas, abre la sala</strong>
          <p>
            Al abrir el registro, se fijan las preguntas y se habilita el QR.
            Para cambiarlas después, duplica el concurso.
          </p>
        </div>
        <button
          className="btn btn-primary"
          disabled={
            busy || dirty || changedElsewhere || ready !== form.questions.length
          }
          onClick={open}
        >
          <Play size={17} /> Abrir registro
        </button>
      </div>
      <details className="quiz-scoring-help">
        <summary>Cómo se calcula el puntaje</summary>
        <p>
          Un acierto suma de {QUIZ_SCORE_STEP} a {QUIZ_MAX_POINTS} puntos según
          el tiempo que tarde en llegar la respuesta al servidor. El bonus
          duplica esos puntos con tope de {QUIZ_MAX_POINTS}: de{" "}
          {QUIZ_SCORE_STEP * 2} a {QUIZ_MAX_POINTS}. Cada premio y el total son
          múltiplos de {QUIZ_SCORE_STEP}. Los errores y las respuestas ausentes
          suman cero. Para desempatar: más aciertos y menor tiempo acumulado en
          respuestas correctas; si persiste el empate, comparten posición. El
          registro admite hasta 200 participantes y cierra al iniciar la primera
          pregunta.
        </p>
      </details>
      {resize && (
        <Modal
          title={
            resize.type === "questions"
              ? "Reducir preguntas"
              : "Reducir alternativas"
          }
          onClose={closeResize}
        >
          <p>
            {resize.type === "questions"
              ? `Se quitarán las preguntas de la ${resize.count + 1} a la ${form.questions.length}, incluido su contenido. La pregunta ${resize.count} pasará a ser el bonus.`
              : `Se quitarán las alternativas desde ${QUIZ_OPTION_LETTERS[resize.count]} de esta pregunta. Si eliminas la respuesta correcta, tendrás que marcar otra.`}
          </p>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={closeResize}>
              Conservar todo
            </button>
            <button
              className="btn btn-primary"
              onClick={() => applyResize(resize.type, resize.count)}
            >
              Confirmar reducción
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
export function QuizHost({ event, projection = false }) {
  const state = useQuizRoom(event.id);
  const { room, players } = state;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [responses, setResponses] = useState({ index: -1, count: 0 });
  const [responsesError, setResponsesError] = useState(false);
  const autoClosed = useRef(new Set());
  const clock = useQuizClock(room);
  const counting = room?.status === "question" || room?.status === "closing";
  const index = room?.questionIndex ?? -1;
  useEffect(() => {
    if (!counting || index < 0) return;
    return onSnapshot(
      quizAnswersRef(event.id, index),
      (snapshot) => {
        setResponses({ index, count: snapshot.size });
        setResponsesError(false);
      },
      () => setResponsesError(true),
    );
  }, [event.id, index, counting]);
  const run = useCallback(async (action) => {
    setBusy(true);
    setError("");
    setConfirm(null);
    try {
      await action();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }, []);
  useEffect(() => {
    if (
      room?.status !== "question" ||
      clock.remaining !== 0 ||
      !Number.isFinite(milliseconds(room.startedAt)) ||
      state.cached ||
      busy ||
      autoClosed.current.has(index)
    )
      return;
    autoClosed.current.add(index);
    run(() => closeQuizRound(event.id, index));
  }, [
    room?.status,
    room?.startedAt,
    clock.remaining,
    state.cached,
    busy,
    index,
    event.id,
    run,
  ]);
  const exportResults = () => {
    const cell = (value) =>
      `"${String(value)
        .replace(/^[=+@-]/, "'$&")
        .replaceAll('"', '""')}"`;
    const csv =
      "\uFEFF" +
      [
        ["Posición", "Nombre", "Puntos", "Aciertos", "Segundos en aciertos"],
        ...room.leaderboard.map((p) => [
          p.rank,
          p.name,
          p.points,
          p.correct,
          (p.elapsedMs / 1000).toFixed(3),
        ]),
      ]
        .map((row) => row.map(cell).join(","))
        .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `concurso-${event.id}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  if (state.status !== "ready")
    return (
      <div className="quiz-empty">
        <p>
          {state.status === "loading"
            ? "Conectando con tu sala…"
            : "No pudimos abrir la sala."}
        </p>
        <button className="btn btn-secondary" onClick={state.retry}>
          Reintentar
        </button>
      </div>
    );
  const responseCount = responses.index === index ? responses.count : 0;
  const close = () => run(() => closeQuizRound(event.id, index));
  return (
    <div className="quiz-host">
      <div className="quiz-host-controls">
        <div>
          <span className="quiz-kicker">
            PANEL DEL PRESENTADOR · {event.id}
          </span>
          <h3>
            {room.status === "lobby"
              ? "La sala se está llenando"
              : room.status === "question"
                ? `Pregunta en vivo · ${clock.remaining} segundos`
                : room.status === "closing"
                  ? "Cerrando la pregunta"
                  : room.status === "finished"
                    ? "¡Una gran exposición!"
                    : "Tú marcas el ritmo"}
          </h3>
          <p>
            {players.length} participantes
            {counting ? ` · ${responseCount} respuestas recibidas` : ""}
          </p>
          <p className="quiz-host-help">
            {room.status === "question"
              ? "Al terminar el tiempo, los resultados se mostrarán a todos. Mantén este panel abierto."
              : room.status === "ranking"
                ? "Los puntos ya están sumados. Cuando terminen de ver la clasificación, continúa con el botón de al lado."
                : room.status === "lobby"
                  ? "Espera al equipo e inicia la primera pregunta."
                  : "Controla aquí el avance del concurso."}
          </p>
        </div>
        <div className="quiz-host-actions">
          {room.status === "lobby" && (
            <button
              className="btn btn-primary"
              disabled={busy || !players.length || state.cached}
              onClick={() => run(() => nextQuizQuestion(event.id, -1))}
            >
              <Play size={17} /> Iniciar pregunta 1
            </button>
          )}
          {room.status === "question" && (
            <button
              className="btn btn-primary"
              disabled={busy || state.cached}
              onClick={() =>
                clock.remaining > 0 ? setConfirm("early") : close()
              }
            >
              Cerrar pregunta y ver puntos
            </button>
          )}
          {room.status === "closing" && (
            <button
              className="btn btn-primary"
              disabled={busy || state.cached}
              onClick={close}
            >
              Completar cierre
            </button>
          )}
          {room.status === "reveal" && (
            <button
              className="btn btn-primary"
              disabled={busy || state.cached}
              onClick={() =>
                run(() => changeQuizPhase(event.id, "reveal", "ranking"))
              }
            >
              <Trophy size={17} /> Ver puntos y clasificación
            </button>
          )}
          {room.status === "ranking" && (
            <button
              className="btn btn-primary"
              disabled={busy || state.cached}
              onClick={() =>
                index === event.questions.length - 1
                  ? run(() => changeQuizPhase(event.id, "ranking", "finished"))
                  : run(() => nextQuizQuestion(event.id, index))
              }
            >
              {index === event.questions.length - 1
                ? "Revelar ganador"
                : index === event.questions.length - 2
                  ? `Siguiente pregunta · Bonus ×2 (${index + 2}/${event.questions.length})`
                  : `Siguiente pregunta · ${index + 2}/${event.questions.length}`}
            </button>
          )}
          {room.leaderboard.length > 0 && (
            <button className="btn btn-secondary" onClick={exportResults}>
              <Download size={16} /> Resultados CSV
            </button>
          )}
        </div>
      </div>
      {busy && (
        <p className="admin-status" role="status">
          Actualizando sala…
        </p>
      )}
      {(error || responsesError || state.playersError) && (
        <p className="form-error" role="alert">
          {error ||
            "No pudimos actualizar la lista o el contador. Revisa tu conexión y vuelve a abrir la sala."}
        </p>
      )}
      {state.cached && (
        <p className="inline-notice">
          Reconectando. Espera la conexión antes de avanzar.
        </p>
      )}
      {!projection && (
        <div className="quiz-sharing">
          <a
            className="btn btn-forest"
            href={`/concurso/pantalla/${event.id}`}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink size={16} /> Abrir pantalla para proyectar
          </a>
          <button
            className="btn btn-secondary"
            onClick={() =>
              navigator.clipboard
                .writeText(quizJoinUrl(event.id))
                .then(() => toast.success("Enlace de ingreso copiado."))
                .catch(() => toast.error("Copia el enlace que aparece debajo."))
            }
          >
            <Copy size={16} /> Copiar enlace para participantes
          </button>
          <a href={quizJoinUrl(event.id)} target="_blank" rel="noreferrer">
            {quizJoinUrl(event.id)}
          </a>
        </div>
      )}
      {!projection && (
        <p className="quiz-preview-label">
          Vista del público · Los controles del presentador no aparecen en la
          proyección.
        </p>
      )}
      <QuizStage
        code={event.id}
        room={room}
        players={players}
        compact={!projection}
      />
      {!projection && (
        <div className="quiz-archive">
          <p>
            Descarga los resultados antes de archivar. Se conservarán las
            preguntas para duplicarlas.
          </p>
          <button
            className="text-link"
            disabled={busy}
            onClick={() => setConfirm("archive")}
          >
            Archivar concurso
          </button>
        </div>
      )}
      {confirm && (
        <Modal
          title={
            confirm === "early" ? "Cerrar antes de tiempo" : "Archivar concurso"
          }
          onClose={() => setConfirm(null)}
        >
          <p>
            {confirm === "early"
              ? `Quedan ${clock.remaining} segundos. Se guardarán las respuestas recibidas y se cerrará el envío para todos.`
              : "Se cerrará el registro, las respuestas y el acceso público a los nombres y resultados. Las preguntas quedarán guardadas para duplicarlas."}
          </p>
          <div className="modal-actions">
            <button
              className="btn btn-secondary"
              onClick={() => setConfirm(null)}
            >
              Volver
            </button>
            <button
              className="btn btn-primary"
              onClick={
                confirm === "early"
                  ? close
                  : () => run(() => archiveQuiz(event.id))
              }
            >
              {confirm === "early" ? "Cerrar y revelar" : "Archivar"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

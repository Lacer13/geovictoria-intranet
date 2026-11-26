import { useCallback, useEffect, useState } from "react";
import { Check, Gift, Play, Save } from "lucide-react";
import toast from "react-hot-toast";
import { openQuizLobby, saveQuizDraft } from "../../lib/quizStore";
import {
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
} from "../../lib/quiz";
import Modal from "../Modal";
import "../../quiz.css";

export default function QuizEditor({ event, onDirty }) {
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

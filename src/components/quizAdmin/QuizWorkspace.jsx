import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { Copy, Gift, RotateCcw, Plus, Snowflake, Trophy } from "lucide-react";
import toast from "react-hot-toast";
import { db } from "../../firebase";
import { saveQuizDraft, resetQuiz } from "../../lib/quizStore";
import { emptyQuiz, milliseconds } from "../../lib/quiz";
import Modal from "../Modal";
import "../../quiz.css";
import { labels } from "./shared";
import QuizEditor from "./QuizEditor";
import QuizHost from "./QuizHost";

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

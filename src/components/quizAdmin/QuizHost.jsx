import { useCallback, useEffect, useRef, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { Copy, Download, ExternalLink, Play, Trophy } from "lucide-react";
import toast from "react-hot-toast";
import {
  archiveQuiz,
  changeQuizPhase,
  closeQuizRound,
  nextQuizQuestion,
  quizAnswersRef,
} from "../../lib/quizStore";
import { milliseconds } from "../../lib/quiz";
import { useQuizClock, useQuizRoom } from "../../lib/quizHooks";
import QuizStage from "../QuizStage";
import { quizJoinUrl } from "../../lib/quiz";
import Modal from "../Modal";
import "../../quiz.css";

export default function QuizHost({ event, projection = false }) {
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

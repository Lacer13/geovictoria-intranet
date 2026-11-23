import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  CheckCircle2,
  ChevronLeft,
  Maximize2,
  Radio,
  Snowflake,
  Trophy,
  Users,
} from "lucide-react";
import { useQuizAnswer, useQuizClock, useQuizRoom } from "../lib/quizHooks";
import { joinQuiz, submitQuizAnswer } from "../lib/quizStore";
import {
  milliseconds,
  normalizeQuizCode,
  quizPoints,
  QUIZ_MAX_POINTS,
  QUIZ_SCORE_STEP,
  readQuizIdentity,
  validQuizCode,
  quizQuestionCount,
  QUIZ_OPTION_LETTERS,
} from "../lib/quiz";
import QuizStage, { QuizRanking, QuizRoster } from "./QuizStage";
import "../quiz.css";

export default function Quiz() {
  const [code, setCode] = useState("");
  const navigate = useNavigate();
  return (
    <section className="quiz-entry">
      <span className="quiz-kicker">
        <Snowflake size={18} /> NAVIDAD EN EQUIPO
      </span>
      <Trophy size={64} className="quiz-entry-trophy" />
      <h1>
        Una pregunta.
        <br />
        <em>Mil oportunidades de brillar.</em>
      </h1>
      <p>
        Ingresa al concurso de tu exposición. Pon a prueba lo que aprendiste y
        sube al podio.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (validQuizCode(normalizeQuizCode(code)))
            navigate(`/concurso/${normalizeQuizCode(code)}`);
        }}
      >
        <label htmlFor="quiz-code">Código de la sala</label>
        <div>
          <input
            id="quiz-code"
            value={code}
            maxLength={10}
            onChange={(e) => setCode(normalizeQuizCode(e.target.value))}
            autoCapitalize="characters"
            autoComplete="off"
            placeholder="ABCD2345"
            required
            pattern="[A-HJ-NP-Z2-9]{8}"
          />
          <button className="btn btn-primary">Entrar</button>
        </div>
      </form>
      <div className="quiz-entry-facts">
        <span>Preguntas a medida</span>
        <span>Bonus ×2 · Máx. {QUIZ_MAX_POINTS}</span>
        <span>
          {QUIZ_SCORE_STEP}–{QUIZ_MAX_POINTS} pts · Múltiplos de{" "}
          {QUIZ_SCORE_STEP}
        </span>
      </div>
      <Link className="text-link" to="/admin?seccion=concurso">
        Soy presentador · Administrar concurso
      </Link>
    </section>
  );
}
function QuizUnavailable({ status, retry }) {
  return (
    <div className="quiz-wait">
      <Snowflake size={42} />
      <h1>
        {status === "loading"
          ? "Conectando con la sala…"
          : status === "error"
            ? "No pudimos conectar"
            : "Esta sala no está abierta"}
      </h1>
      <p>
        {status === "error"
          ? "Revisa tu conexión e inténtalo otra vez."
          : status !== "loading"
            ? "Comprueba el código o espera a que el presentador abra el registro."
            : "Prepara tu espíritu competitivo."}
      </p>
      {status === "error" && (
        <button className="btn btn-primary" onClick={retry}>
          Reintentar
        </button>
      )}
      <Link className="text-link" to="/concurso">
        Volver al ingreso
      </Link>
    </div>
  );
}
export function QuizRoom() {
  const { code: rawCode } = useParams();
  const code = normalizeQuizCode(rawCode);
  return validQuizCode(code) ? (
    <Participant key={code} code={code} />
  ) : (
    <QuizUnavailable status="missing" />
  );
}
function Participant({ code }) {
  const state = useQuizRoom(code);
  const { room, players } = state;
  const [identity, setIdentity] = useState(() => readQuizIdentity(code));
  const [name, setName] = useState(identity?.name || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(null);
  const [sendError, setSendError] = useState({ index: -1, message: "" });
  const registered = !!identity && players.some((p) => p.id === identity.id);
  const answerState = useQuizAnswer(
    code,
    room?.questionIndex ?? -1,
    registered ? identity : null,
    room?.status !== "archived",
  );
  const answer = answerState.answer;
  const clock = useQuizClock(room);
  const own = room?.leaderboard?.find((p) => p.id === identity?.id);
  if (state.status !== "ready")
    return <QuizUnavailable status={state.status} retry={state.retry} />;
  if (room.status === "archived")
    return <QuizStage code={code} room={room} players={[]} />;
  const register = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      setIdentity(await joinQuiz(code, name));
    } catch (e) {
      setError(e.message);
      setIdentity(readQuizIdentity(code));
    } finally {
      setBusy(false);
    }
  };
  const send = async (selectedIndex) => {
    if (sending !== null || answer || clock.remaining === 0 || state.cached)
      return;
    setSending(selectedIndex);
    setSendError({ index: -1, message: "" });
    const index = room.questionIndex;
    try {
      await submitQuizAnswer(code, index, identity, selectedIndex);
    } catch (e) {
      setSendError({ index, message: e.message });
    } finally {
      setSending(null);
    }
  };
  const revealed = ["reveal", "ranking", "finished"].includes(room.status);
  const correct = revealed && answer?.selectedIndex === room.correctIndex;
  const points =
    answer && revealed
      ? quizPoints(
          correct,
          milliseconds(answer.submittedAt) - milliseconds(room.startedAt),
          room.question?.seconds,
          room.question?.bonus,
        )
      : 0;
  return (
    <section className="quiz-participant">
      <header className="quiz-participant-top">
        <Link to="/concurso" className="text-link">
          <ChevronLeft size={16} /> Concurso
        </Link>
        <span className="quiz-code-badge">SALA {code}</span>
      </header>
      <span className="quiz-kicker">
        <Snowflake size={16} /> RETO NAVIDEÑO
      </span>
      <h1>{room.title}</h1>
      {state.cached && (
        <p className="inline-notice" role="status">
          Reconectando con la sala. Espera a recuperar la conexión para
          responder.
        </p>
      )}
      {state.playersError && (
        <p className="form-error" role="alert">
          No pudimos recuperar la lista de participantes.{" "}
          <button className="text-link" onClick={state.retry}>
            Reintentar
          </button>
        </p>
      )}
      {!registered && room.status === "lobby" ? (
        <div className="quiz-join-card">
          <div className="quiz-join-icon">
            <Users size={35} />
          </div>
          <h2>Tu lugar está listo</h2>
          <form onSubmit={register}>
            <label htmlFor="quiz-name">¿Cómo te llamas?</label>
            <input
              id="quiz-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={32}
              minLength={2}
              autoComplete="name"
              placeholder="Nombre y apellido"
              required
              disabled={busy}
            />
            <p className="quiz-soft">
              Tu nombre y puntaje aparecerán en la pantalla del concurso.
              Conserva este navegador para volver a entrar.
            </p>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="btn btn-primary" disabled={busy || state.cached}>
              {busy ? "Registrando…" : "¡Quiero participar!"}
            </button>
          </form>
          <p className="quiz-soft">
            {players.length} personas ya se registraron · Máximo 200
          </p>
        </div>
      ) : !registered ? (
        <div className="quiz-wait">
          <Radio size={40} />
          <h2>La competencia ya empezó</h2>
          <p>
            El registro cerró al comenzar la primera pregunta. Si ya te
            registraste, vuelve desde el mismo navegador.
          </p>
          <Link className="btn btn-secondary" to={`/concurso/pantalla/${code}`}>
            Seguir el concurso en vivo
          </Link>
        </div>
      ) : (
        <>
          <div className="quiz-your-badge">
            <span>
              <CheckCircle2 size={17} /> {identity.name}
            </span>
            <b>{own?.points.toLocaleString("es-PE") || "0"} pts</b>
          </div>
          {room.status === "lobby" ? (
            <>
              <div className="quiz-wait">
                <Snowflake size={40} />
                <h2>¡Ya estás en la sala!</h2>
                <p>
                  El presentador dará inicio. Acierta y responde rápido: de{" "}
                  {QUIZ_SCORE_STEP} a {QUIZ_MAX_POINTS} puntos por pregunta,
                  siempre en múltiplos de {QUIZ_SCORE_STEP}. El bonus duplica el
                  premio hasta un máximo de {QUIZ_MAX_POINTS}.
                </p>
              </div>
              <h3>El equipo se está reuniendo</h3>
              <QuizRoster players={players} />
            </>
          ) : room.status === "finished" ? (
            <QuizRanking
              rows={room.leaderboard}
              ownId={identity.id}
              questionCount={quizQuestionCount(room)}
              final
            />
          ) : room.status === "ranking" ? (
            <QuizRanking rows={room.leaderboard} ownId={identity.id} />
          ) : room.question ? (
            <div className="quiz-answer-card">
              <div className="quiz-question-meta">
                <span>
                  {room.question.bonus
                    ? "BONUS TRACK · ×2"
                    : `PREGUNTA ${room.questionIndex + 1} DE ${quizQuestionCount(room)}`}
                </span>
                <span
                  className={`quiz-timer ${clock.remaining <= 5 && room.status === "question" ? "is-urgent" : ""}`}
                >
                  {room.status === "question"
                    ? `${clock.remaining} s`
                    : "Cerrada"}
                </span>
              </div>
              <h2 className="quiz-prompt">{room.question.prompt}</h2>
              <div className="quiz-options">
                {room.question.options.map((option, i) => (
                  <button
                    key={`${room.questionIndex}:${i}`}
                    className={`quiz-option option-${i} ${answer?.selectedIndex === i ? "is-selected" : ""} ${revealed && i === room.correctIndex ? "is-correct" : ""}`}
                    disabled={
                      room.status !== "question" ||
                      clock.remaining === 0 ||
                      !!answer ||
                      sending !== null ||
                      answerState.loading ||
                      answerState.error ||
                      state.cached
                    }
                    onClick={() => send(i)}
                  >
                    <b>{QUIZ_OPTION_LETTERS[i]}</b>
                    <span>{option}</span>
                    {answer?.selectedIndex === i && <small>Tu respuesta</small>}
                    {revealed && room.correctIndex === i && (
                      <small>✓ Correcta</small>
                    )}
                  </button>
                ))}
              </div>
              {sending !== null && (
                <p className="quiz-status" role="status">
                  Enviando tu respuesta…
                </p>
              )}
              {answer && !revealed && (
                <p className="quiz-answer-confirmed" role="status">
                  <CheckCircle2 size={20} /> Respuesta guardada. ¡Cruza los
                  dedos!
                </p>
              )}
              {!answer &&
                sending === null &&
                room.status === "question" &&
                clock.remaining > 0 && (
                  <p className="quiz-soft">
                    Toca una opción para enviar. Una sola respuesta por
                    pregunta.
                  </p>
                )}
              {answerState.error && (
                <p className="form-error" role="alert">
                  No pudimos recuperar tu respuesta. Recarga esta página para
                  reconectar sin cambiar tu identidad.
                </p>
              )}
              {sendError.index === room.questionIndex && !answer && (
                <p className="form-error" role="alert">
                  {sendError.message}
                </p>
              )}
              {!answer &&
                (room.status === "closing" ||
                  (room.status === "question" && clock.remaining === 0)) && (
                  <p className="quiz-status">
                    Tiempo cerrado. Esperando al presentador…
                  </p>
                )}
              {revealed && (
                <div
                  className={`quiz-round-result ${correct ? "is-right" : ""}`}
                >
                  <strong>
                    {correct
                      ? `¡Correcta! +${points} puntos`
                      : answer
                        ? "Esta vez no sumaste. ¡La próxima es tuya!"
                        : "Sin respuesta · 0 puntos"}
                  </strong>
                  <span>
                    {own
                      ? `Tu posición: #${own.rank} · ${own.points} puntos acumulados`
                      : "La clasificación viene a continuación."}
                  </span>
                </div>
              )}
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
export function QuizScreen() {
  const { code: rawCode } = useParams();
  const code = normalizeQuizCode(rawCode);
  return validQuizCode(code) ? (
    <Projection key={code} code={code} />
  ) : (
    <QuizUnavailable status="missing" />
  );
}
function Projection({ code }) {
  const state = useQuizRoom(code);
  const [fullscreenError, setFullscreenError] = useState("");
  return (
    <div className="quiz-projection">
      <nav className="quiz-projection-toolbar">
        <Link to="/concurso" className="text-link">
          <ChevronLeft size={16} /> Volver al concurso
        </Link>
        <button
          className="text-link"
          onClick={() => {
            if (!document.documentElement.requestFullscreen)
              setFullscreenError(
                "Usa la opción de pantalla completa de tu navegador.",
              );
            else
              document.documentElement
                .requestFullscreen()
                .catch(() =>
                  setFullscreenError(
                    "Usa la opción de pantalla completa de tu navegador.",
                  ),
                );
          }}
        >
          <Maximize2 size={16} /> Pantalla completa
        </button>
      </nav>
      {fullscreenError && <p className="quiz-soft">{fullscreenError}</p>}
      {state.cached && (
        <p className="inline-notice">Reconectando con la sala…</p>
      )}
      {state.status === "ready" ? (
        <QuizStage code={code} room={state.room} players={state.players} />
      ) : (
        <QuizUnavailable status={state.status} retry={state.retry} />
      )}
    </div>
  );
}

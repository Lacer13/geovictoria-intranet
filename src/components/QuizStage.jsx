import { useEffect, useRef, useState } from "react";
import {
  Crown,
  Gift,
  Medal,
  Snowflake,
  Timer,
  Trophy,
  Users,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useQuizClock } from "../lib/quizHooks";
import {
  quizJoinUrl,
  quizQuestionCount,
  QUIZ_MAX_POINTS,
  QUIZ_SCORE_STEP,
  QUIZ_OPTION_LETTERS,
} from "../lib/quiz";

const letters = QUIZ_OPTION_LETTERS;
function AnimatedPoints({ from, to }) {
  const [value, setValue] = useState(from);
  const element = useRef(null);
  useEffect(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      element.current?.closest(".quiz-motion-off") ||
      from === to
    ) {
      setValue(to);
      return;
    }
    let frame;
    let start;
    const tick = (now) => {
      start ??= now;
      const progress = Math.min(1, (now - start) / 1000);
      setValue(Math.round(from + (to - from) * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [from, to]);
  return (
    <span ref={element} aria-hidden="true">
      {value.toLocaleString("es-PE")}
    </span>
  );
}

export function QuizRoster({ players }) {
  return (
    <div
      className="quiz-roster"
      aria-label="Participantes registrados"
      aria-live="polite"
    >
      {players.map((p, i) => (
        <div
          className="quiz-player-chip"
          key={p.id}
          style={{ "--player-color": `${i % 5}` }}
        >
          <span>{p.name.slice(0, 1).toLocaleUpperCase("es")}</span>
          {p.name}
        </div>
      ))}
      {!players.length && (
        <p className="quiz-soft">
          El primer nombre aparecerá aquí al registrarse.
        </p>
      )}
    </div>
  );
}
export function QuizRanking({
  rows = [],
  ownId,
  final = false,
  questionCount = 8,
  room,
}) {
  const winners = rows.filter((r) => r.rank === 1);
  const own = rows.find((p) => p.id === ownId);
  const topPoints = Math.max(1, ...rows.map((p) => p.points));
  return (
    <div className={`quiz-ranking ${final ? "quiz-finale" : ""}`}>
      {final && (
        <>
          <div className="quiz-confetti" aria-hidden="true">
            {Array.from({ length: 24 }, (_, i) => (
              <i key={i} style={{ "--i": i }} />
            ))}
          </div>
          <span className="quiz-kicker">
            <Snowflake size={16} /> LA ESTRELLA DE ESTA NAVIDAD
          </span>
          <Crown size={60} className="quiz-crown" />
          <h2>
            {winners.length > 1
              ? "¡Tenemos un empate en la cima!"
              : "¡Tenemos ganador!"}
          </h2>
          <p className="quiz-winner-name">
            {winners.map((p) => p.name).join(" · ") || "Sin participantes"}
          </p>
          {!!winners.length && (
            <p>
              {winners[0].points.toLocaleString("es-PE")} puntos ·{" "}
              {winners[0].correct}/{questionCount} aciertos
            </p>
          )}
          <div className="quiz-podium">
            {rows.slice(0, 3).map((p, i) => (
              <div className={`podium-place podium-${i}`} key={p.id}>
                <Medal size={27} />
                <strong>{p.name}</strong>
                <span>{p.points.toLocaleString("es-PE")} pts</span>
                <b>#{p.rank}</b>
              </div>
            ))}
          </div>
        </>
      )}
      {!final && (
        <>
          <span className="quiz-kicker">
            {room
              ? `RESULTADOS · PREGUNTA ${room.questionIndex + 1} DE ${quizQuestionCount(room)}`
              : "CLASIFICACIÓN EN VIVO"}
          </span>
          <h2>
            <Trophy size={25} /> Así va la competencia
          </h2>
          {room?.question && (
            <div className="quiz-correct-summary">
              <span>Respuesta correcta · {letters[room.correctIndex]}</span>
              <strong>{room.question.options[room.correctIndex]}</strong>
              <details>
                <summary>Ver reparto de respuestas</summary>
                {room.question.options.map((option, i) => (
                  <p key={i}>
                    {letters[i]} · {option}:{" "}
                    <b>{room.answerCounts[i]} respuestas</b>
                  </p>
                ))}
              </details>
            </div>
          )}
          {!!winners.length && (
            <div className="quiz-leader" role="status">
              <Crown size={30} aria-hidden="true" />
              <div>
                <span>
                  {winners.length > 1
                    ? "Empate en la cima"
                    : "Lidera la competencia"}
                </span>
                <strong>
                  {winners
                    .slice(0, 3)
                    .map((p) => p.name)
                    .join(" · ")}
                  {winners.length > 3 ? ` y ${winners.length - 3} más` : ""}
                </strong>
              </div>
              <b>{winners[0].points.toLocaleString("es-PE")} pts</b>
            </div>
          )}
          {own && Number.isFinite(own.roundPoints) && (
            <div className="quiz-personal-round" role="status">
              <span>
                {own.roundPoints > 0 ? "¡Acertaste!" : "Esta ronda no sumaste"}
              </span>
              <strong>+{own.roundPoints} puntos</strong>
              <span>
                {own.previousPoints} + {own.roundPoints} = {own.points}{" "}
                acumulados · Tu posición: #{own.rank}
              </span>
            </div>
          )}
        </>
      )}
      <ol className="quiz-rank-list" aria-label="Clasificación del concurso">
        {rows.map((p) => (
          <li key={p.id} className={p.id === ownId ? "is-you" : ""}>
            <span className="quiz-rank-number">
              {p.rank === 1 ? <Crown size={18} /> : `#${p.rank}`}
            </span>
            <span>
              <strong>
                {p.name}
                {p.id === ownId ? " · Tú" : ""}
              </strong>
              <small>
                {p.correct} aciertos · {(p.elapsedMs / 1000).toFixed(2)} s
                acumulados en aciertos
              </small>
              {!final && p.previousRank > p.rank && (
                <span className="quiz-rank-rise">
                  Subió {p.previousRank - p.rank}{" "}
                  {p.previousRank - p.rank === 1 ? "puesto" : "puestos"}
                </span>
              )}
              {!final && (
                <span className="quiz-score-track" aria-hidden="true">
                  <i style={{ width: `${(p.points / topPoints) * 100}%` }} />
                </span>
              )}
            </span>
            <b
              aria-label={`${p.points} puntos${!final && Number.isFinite(p.roundPoints) ? `, más ${p.roundPoints} en esta ronda` : ""}`}
            >
              {!final && Number.isFinite(p.previousPoints) ? (
                <AnimatedPoints from={p.previousPoints} to={p.points} />
              ) : (
                p.points.toLocaleString("es-PE")
              )}
              {!final && Number.isFinite(p.roundPoints) && (
                <span className="quiz-points-gain">+{p.roundPoints}</span>
              )}
              <small>puntos</small>
            </b>
          </li>
        ))}
      </ol>
      <p className="quiz-soft">
        Desempate: más aciertos y menor tiempo acumulado en aciertos. Si
        coinciden, comparten posición.
      </p>
      {!final && (
        <p className="quiz-next-hint">
          Los puntos de esta ronda ya están sumados.{" "}
          {room?.questionIndex === quizQuestionCount(room) - 1
            ? "El presentador revelará el resultado final."
            : "El presentador iniciará la siguiente pregunta cuando el equipo esté listo."}
        </p>
      )}
    </div>
  );
}
export default function QuizStage({
  code,
  room,
  players,
  ownId,
  compact = false,
}) {
  const clock = useQuizClock(room);
  const q = room.question;
  const questionCount = quizQuestionCount(room);
  const reveal = ["reveal", "ranking", "finished"].includes(room.status);
  return (
    <div className={`quiz-stage ${compact ? "quiz-stage-compact" : ""}`}>
      <header className="quiz-stage-heading">
        <span className="quiz-kicker">
          <Snowflake size={17} /> RETO NAVIDEÑO · GEOVICTORIA
        </span>
        <span className="quiz-code-badge">SALA {code}</span>
      </header>
      <h1 className="quiz-event-title">{room.title}</h1>
      {room.status === "lobby" ? (
        <>
          <div className="quiz-lobby">
            <div>
              <span className="quiz-kicker">TU EQUIPO, EN VIVO</span>
              <h2>
                Aprendemos.
                <br />
                <em>
                  Competimos.
                  <br />
                  Celebramos.
                </em>
              </h2>
              <p>
                {questionCount} {questionCount === 1 ? "pregunta" : "preguntas"}{" "}
                · La última es bonus doble (tope {QUIZ_MAX_POINTS}).
                <br />
                Acierta y responde rápido para sumar más.
              </p>
              <div className="quiz-player-count">
                <Users size={25} />
                <strong>{players.length}</strong> en la sala
              </div>
            </div>
            <div className="quiz-qr">
              <QRCodeSVG
                value={quizJoinUrl(code)}
                size={216}
                level="M"
                marginSize={3}
                title="Escanea para ingresar al concurso"
              />
              <strong>Escanea y escribe tu nombre</strong>
              <span>
                O entra en <b>{window.location.host}/concurso</b>
                <br />
                con el código <b>{code}</b>
              </span>
            </div>
          </div>
          <QuizRoster players={players} />
        </>
      ) : room.status === "finished" ? (
        <QuizRanking
          rows={room.leaderboard}
          ownId={ownId}
          questionCount={questionCount}
          final
        />
      ) : room.status === "ranking" ? (
        <QuizRanking
          key={room.questionIndex}
          rows={room.leaderboard}
          ownId={ownId}
          room={room}
        />
      ) : room.status === "archived" ? (
        <div className="quiz-wait">
          <Gift size={44} />
          <h2>Este concurso ya cerró</h2>
          <p>Gracias por compartir este momento en equipo.</p>
        </div>
      ) : q ? (
        <>
          <div className="quiz-question-meta">
            <span>
              {q.bonus ? (
                <>
                  <Gift size={20} /> BONUS TRACK · PUNTOS ×2
                </>
              ) : (
                `PREGUNTA ${room.questionIndex + 1} DE ${questionCount}`
              )}
            </span>
            <span
              className={
                clock.remaining <= 5 && room.status === "question"
                  ? "quiz-timer is-urgent"
                  : "quiz-timer"
              }
            >
              <Timer size={19} />
              {room.status === "question"
                ? `${clock.remaining} s`
                : "Tiempo cerrado"}
            </span>
          </div>
          {room.status === "question" && (
            <div
              className="quiz-time-track"
              role="progressbar"
              aria-label="Tiempo restante"
              aria-valuemin={0}
              aria-valuemax={q.seconds}
              aria-valuenow={clock.remaining}
            >
              <span style={{ width: `${clock.fraction * 100}%` }} />
            </div>
          )}
          <h2 className="quiz-prompt">{q.prompt}</h2>
          <div className="quiz-options">
            {q.options.map((o, i) => (
              <div
                key={i}
                className={`quiz-option option-${i} ${reveal && i === room.correctIndex ? "is-correct" : ""}`}
              >
                <b>{letters[i]}</b>
                <span>{o}</span>
                {reveal && (
                  <small>
                    {i === room.correctIndex ? "✓ Correcta · " : ""}
                    {room.answerCounts[i]} respuestas
                  </small>
                )}
              </div>
            ))}
          </div>
          {room.status === "closing" && (
            <p className="quiz-status" role="status">
              Guardando las respuestas y preparando el resultado…
            </p>
          )}
          {room.status === "reveal" && (
            <p className="quiz-status">
              La respuesta correcta es <b>{letters[room.correctIndex]}</b>. ¡La
              clasificación viene a continuación!
            </p>
          )}
          {room.status === "question" && (
            <p className="quiz-soft">
              Responde desde tu celular. Solo los aciertos suman:{" "}
              {QUIZ_SCORE_STEP * (q.bonus ? 2 : 1)}–{QUIZ_MAX_POINTS} puntos, en
              múltiplos de {QUIZ_SCORE_STEP}
              {q.bonus ? " · Bonus ×2 con tope de 497" : ""}.
            </p>
          )}
        </>
      ) : (
        <p className="quiz-status">Preparando la siguiente pregunta…</p>
      )}
    </div>
  );
}

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
import { quizJoinUrl, QUIZ_MAX_POINTS, QUIZ_SCORE_STEP } from "../lib/quiz";

const letters = ["A", "B", "C", "D"];
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
export function QuizRanking({ rows = [], ownId, final = false }) {
  const winners = rows.filter((r) => r.rank === 1);
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
              {winners[0].correct}/8 aciertos
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
        <h2>
          <Trophy size={25} /> Así va la competencia
        </h2>
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
            </span>
            <b>
              {p.points.toLocaleString("es-PE")}
              <small>puntos</small>
            </b>
          </li>
        ))}
      </ol>
      <p className="quiz-soft">
        Desempate: más aciertos y menor tiempo acumulado en aciertos. Si
        coinciden, comparten posición.
      </p>
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
                7 preguntas + 1 bonus doble (tope {QUIZ_MAX_POINTS}).
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
        <QuizRanking rows={room.leaderboard} ownId={ownId} final />
      ) : room.status === "ranking" ? (
        <QuizRanking rows={room.leaderboard} ownId={ownId} />
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
                `PREGUNTA ${room.questionIndex + 1} DE 7`
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

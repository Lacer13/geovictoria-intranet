import { useEffect, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { Trophy } from "lucide-react";
import { db } from "../firebase";
import { rankGameScores, scoreBoard, scoreBoardPath, SCORE_BOARDS } from "./scoreboard.js";

export default function ScoreBoard({ boardId: initialBoardId, publishedId = null, selectable = false }) {
  const [choice, setChoice] = useState(null);
  const boardId = choice || initialBoardId;
  const [result, setResult] = useState({ boardId, status: "loading", rows: [] }), [attempt, setAttempt] = useState(0);
  useEffect(() => {
    setResult({ boardId, status: "loading", rows: [] });
    const timer = setTimeout(() => setResult({ boardId, status: "error", rows: [] }), 12000);
    const stop = onSnapshot(query(collection(db, scoreBoardPath(boardId)), orderBy("score", "desc"), limit(20)), snapshot => {
      clearTimeout(timer);
      setResult({ boardId, status: "ready", rows: rankGameScores(snapshot.docs.map(d => ({ ...d.data(), id: d.id }))) });
    }, () => { clearTimeout(timer); setResult({ boardId, status: "error", rows: [] }); });
    return () => { clearTimeout(timer); stop(); };
  }, [boardId, attempt]);
  const state = result.boardId === boardId ? result : { status: "loading", rows: [] };
  return <section className="arcade-leaderboard" aria-label={`Puntajes de ${scoreBoard(boardId).label}`}>
    <div className="arcade-leaderboard-heading"><div><span className="arcade-eyebrow">Clasificación casual</span><h2><Trophy size={21} /> Mejores puntajes</h2></div><span>{scoreBoard(boardId).label}</span></div>
    {selectable && <label className="arcade-ranking-filter">Ver puntajes de <select aria-label="Ver puntajes de" value={boardId} onChange={e => setChoice(e.target.value)}>{SCORE_BOARDS.map(board => <option key={board.id} value={board.id}>{board.label}</option>)}</select></label>}
    <p className="arcade-ranking-note">Las 20 mejores partidas publicadas. Cada nivel tiene su propia tabla.</p>
    {state.status === "loading" && <p role="status">Cargando puntajes…</p>}
    {state.status === "error" && <p role="status">No pudimos cargar la tabla. Puedes seguir jugando. <button className="arcade-text-button" onClick={() => setAttempt(n => n + 1)}>Reintentar</button></p>}
    {state.status === "ready" && !state.rows.length && <p className="arcade-ranking-empty">Todavía no hay puntajes. Termina una partida y publica el tuyo.</p>}
    {state.status === "ready" && state.rows.length > 0 && <div className="arcade-ranking-scroll"><table><caption className="sr-only">Clasificación de {scoreBoard(boardId).label}</caption><thead><tr><th scope="col">Puesto</th><th scope="col">Jugador</th><th scope="col">Puntos</th></tr></thead><tbody>{state.rows.map(row => <tr key={row.id} className={publishedId === row.id ? "is-your-score" : ""}><td>{row.rank}</td><th scope="row">{row.name}{publishedId === row.id && <small>Tu partida</small>}</th><td>{row.score.toLocaleString("es-PE")}</td></tr>)}</tbody></table></div>}
  </section>;
}

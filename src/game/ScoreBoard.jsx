import { useEffect, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import "./rankings.css";
import { db } from "../firebase";
import { rankGameScores, scoreBoard, scoreBoardPath, SCORE_BOARDS } from "./scoreboard.js";

export default function ScoreBoard({ boardId: initialBoardId = "arcade", publishedId = null, selectable = false, compact = false }) {
  const [choice, setChoice] = useState(null);
  const boardId = choice || initialBoardId;
  const [result, setResult] = useState({ boardId, status: "loading", rows: [] }), [attempt, setAttempt] = useState(0);
  useEffect(() => {
    setResult({ boardId, status: "loading", rows: [] });
    const timer = setTimeout(() => setResult({ boardId, status: "error", rows: [] }), 12000);
    const stop = onSnapshot(query(collection(db, scoreBoardPath(boardId)), orderBy("score", "desc"), limit(compact ? 5 : 20)), snapshot => {
      clearTimeout(timer);
      setResult({ boardId, status: "ready", rows: rankGameScores(snapshot.docs.map(d => ({ ...d.data(), id: d.id }))) });
    }, () => { clearTimeout(timer); setResult({ boardId, status: "error", rows: [] }); });
    return () => { clearTimeout(timer); stop(); };
  }, [boardId, attempt, compact]);
  const state = result.boardId === boardId ? result : { status: "loading", rows: [] };
  const rows = state.rows.slice(0, compact ? 5 : 20), board = scoreBoard(boardId);
  return <section className={`game-ranking ${compact ? "is-compact" : ""}`} aria-label={`Puntajes de ${board.label}`}>
    <div className="game-ranking-heading"><div><span className="game-ranking-eyebrow">El equipo juega</span><h2><Trophy size={21} /> Clasificación</h2></div><span className="game-ranking-category">{board.category}</span></div>
    {selectable ? <label className="game-ranking-filter">Juego o nivel<select aria-label="Ver puntajes de" value={boardId} onChange={e => setChoice(e.target.value)}>{["Aventura","Arcade","Minijuegos"].map(group => <optgroup key={group} label={group}>{SCORE_BOARDS.filter(b=>b.category===group).map(b=><option key={b.id} value={b.id}>{b.label}</option>)}</optgroup>)}</select></label> : <h3>{board.label}</h3>}
    <p className="game-ranking-note">Las {compact ? 5 : 20} mejores partidas publicadas. Los puntos se comparan solo dentro de esta tabla.</p>
    {state.status === "loading" && <p role="status">Cargando puntajes…</p>}
    {state.status === "error" && <p role="status">No pudimos cargar la tabla. Puedes seguir jugando. <button className="arcade-text-button" onClick={() => setAttempt(n => n + 1)}>Reintentar</button></p>}
    {state.status === "ready" && !rows.length && <div className="game-ranking-state"><Trophy size={26}/><strong>El primer puesto te espera</strong><p>Completa una partida y elige «Publicar puntaje».</p><Link to={`/juego#${board.play}`}>Jugar {board.label} →</Link></div>}
    {state.status === "ready" && rows.length > 0 && <div className="game-ranking-scroll"><table><caption className="game-ranking-sr">Clasificación de {board.label}</caption><thead><tr><th scope="col">Puesto</th><th scope="col">Jugador</th><th scope="col">Puntos</th></tr></thead><tbody>{rows.map(row => <tr key={row.id} className={`${row.rank===1?"is-leading":""} ${publishedId === row.id ? "is-your-score" : ""}`}><td><span className="game-ranking-place">{row.rank===1&&<Trophy size={14}/>} {row.rank}</span></td><th scope="row">{row.name}{publishedId === row.id && <small>Tu partida</small>}</th><td>{row.score.toLocaleString("es-PE")}</td></tr>)}</tbody></table></div>}
    {compact ? <Link className="game-ranking-more" to="/juego#clasificaciones">Ver todas las clasificaciones →</Link> : <p className="game-ranking-note">Una persona puede publicar varios intentos. Los empates comparten puesto.</p>}
  </section>;
}

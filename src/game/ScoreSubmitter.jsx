import { useEffect, useRef, useState } from "react";
import { publishGameScore } from "./scoreStore.js";
import { normalizePlayerName, savePlayerName, scoreBoard, validPlayerName } from "./scoreboard.js";

export default function ScoreSubmitter({ score, boardId, runId, initialName, onNameChange, onPublished }) {
  const [name, setName] = useState(initialName), [status, setStatus] = useState("idle");
  const lock = useRef(false), mounted = useRef(true), date = useRef(new Date().toISOString());
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  if (status === "saved") return <p role="status" className="arcade-success">¡Puntaje publicado! La tabla muestra las 20 mejores partidas de {scoreBoard(boardId).label}.</p>;
  return <form className="arcade-score-form" onSubmit={async event => {
    event.preventDefault();
    if (lock.current || !validPlayerName(name)) return;
    lock.current = true; setStatus("saving");
    try {
      await publishGameScore({ boardId, runId, name, score, date: date.current });
      savePlayerName(name);
      if (mounted.current) { setStatus("saved"); onPublished?.(); }
    } catch { if (mounted.current) setStatus("error"); lock.current = false; }
  }}>
    <label htmlFor="arcade-ranking-name">Publica tus {score.toLocaleString("es-PE")} puntos · {scoreBoard(boardId).label}</label>
    <div><input id="arcade-ranking-name" autoComplete="nickname" maxLength={24} value={name} onChange={e => { setName(e.target.value); onNameChange?.(e.target.value); }} placeholder="Tu nombre o alias" disabled={status === "saving"} required />
      <button className="arcade-button secondary" disabled={status === "saving" || !validPlayerName(name)}>{status === "saving" ? "Publicando…" : "Publicar puntaje"}</button></div>
    <small>Se compartirá el nombre «{normalizePlayerName(name) || "tu alias"}» y los puntos en esta tabla. Publicar es opcional.</small>
    {status === "error" && <p role="alert">No se pudo publicar. Tu resultado sigue aquí; puedes reintentar.</p>}
  </form>;
}

import { useEffect, useRef, useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../firebase";

export default function ScoreSubmitter({ score }) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState("idle");
  const lock = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  if (!score) return null;
  if (status === "saved")
    return (
      <p role="status" className="arcade-success">
        ¡Tu puntaje ya está en el ranking!
      </p>
    );
  return (
    <form
      className="arcade-score-form"
      onSubmit={async (event) => {
        event.preventDefault();
        if (lock.current || !name.trim()) return;
        lock.current = true;
        setStatus("saving");
        try {
          await addDoc(collection(db, "leaderboard"), {
            name: name.trim().slice(0, 50),
            score,
            date: new Date().toISOString(),
          });
          if (mounted.current) setStatus("saved");
        } catch {
          if (mounted.current) setStatus("error");
          lock.current = false;
        }
      }}
    >
      <label htmlFor="arcade-ranking-name">
        Comparte tu puntaje en el ranking casual
      </label>
      <div>
        <input
          id="arcade-ranking-name"
          autoComplete="nickname"
          maxLength={50}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tu nombre o iniciales"
          disabled={status === "saving"}
          required
        />
        <button
          className="arcade-button secondary"
          disabled={status === "saving" || !name.trim()}
        >
          {status === "saving" ? "Guardando…" : "Guardar"}
        </button>
      </div>
      {status === "error" && (
        <p role="alert">
          No se pudo guardar. Tu resultado sigue aquí; puedes reintentar.
        </p>
      )}
    </form>
  );
}

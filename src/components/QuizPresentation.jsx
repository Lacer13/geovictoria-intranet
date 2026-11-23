import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Link } from "react-router-dom";
import { auth } from "../auth";
import { db } from "../firebase";
import { QuizHost } from "./QuizAdmin";
import QuizStage from "./QuizStage";
export default function QuizPresentation({ code, room, players }) {
  const [event, setEvent] = useState(null);
  useEffect(() => {
    let stop;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      stop?.();
      setEvent(null);
      if (user)
        stop = onSnapshot(
          doc(db, "quizEvents", code),
          (snapshot) =>
            setEvent(
              snapshot.exists()
                ? { id: snapshot.id, ...snapshot.data() }
                : null,
            ),
          () => setEvent(null),
        );
    });
    return () => {
      unsubscribe();
      stop?.();
    };
  }, [code]);
  return event && ["live", "finished"].includes(event.status) ? (
    <QuizHost key={code} event={event} projection />
  ) : (
    <>
      <Link
        className="text-link quiz-presenter-login"
        to="/admin?seccion=concurso"
        target="_blank"
        rel="noreferrer"
      >
        Soy presentador · Iniciar sesión para habilitar los controles
      </Link>
      <QuizStage code={code} room={room} players={players} />
    </>
  );
}

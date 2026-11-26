import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import QuizHost from "./quizAdmin/QuizHost";
import { useAdminAccess } from "../admin/useAdminAccess";
import QuizStage from "./QuizStage";
export default function QuizPresentation({ code, room, players }) {
  const [event, setEvent] = useState(null);
  const { can, loading } = useAdminAccess();
  const canHost = !loading && can("quiz.manage");
  useEffect(() => {
    setEvent(null);
    if (!canHost) return;
    return onSnapshot(
      doc(db, "quizEvents", code),
      (snapshot) =>
        setEvent(
          snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null,
        ),
      () => setEvent(null),
    );
  }, [code, canHost]);
  return canHost && event && ["live", "finished"].includes(event.status) ? (
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

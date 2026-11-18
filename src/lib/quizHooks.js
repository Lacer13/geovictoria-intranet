import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { quizAnswersRef, quizPlayersRef, quizRoomRef } from "./quizStore";
import { milliseconds, validQuizCode } from "./quiz";

export function useQuizRoom(code) {
  const [state, setState] = useState({
    room: null,
    status: "loading",
    cached: false,
  });
  const [players, setPlayers] = useState([]);
  const [playersError, setPlayersError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!validQuizCode(code)) return;
    return onSnapshot(
      quizRoomRef(code),
      { includeMetadataChanges: true },
      (snapshot) => {
        setState({
          room: snapshot.exists()
            ? snapshot.data({ serverTimestamps: "estimate" })
            : null,
          status: snapshot.exists() ? "ready" : "missing",
          cached: snapshot.metadata.fromCache,
        });
      },
      () => setState({ room: null, status: "error", cached: false }),
    );
  }, [code, retry]);
  const active = !!state.room && state.room.status !== "archived";
  useEffect(() => {
    if (!active || !validQuizCode(code)) return;
    return onSnapshot(
      quizPlayersRef(code),
      (snapshot) => {
        setPlayers(
          snapshot.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort(
              (a, b) =>
                milliseconds(a.joinedAt) - milliseconds(b.joinedAt) ||
                a.name.localeCompare(b.name, "es"),
            ),
        );
        setPlayersError(false);
      },
      () => setPlayersError(true),
    );
  }, [code, active, retry]);
  return {
    ...state,
    players,
    playersError,
    retry: () => setRetry((n) => n + 1),
  };
}
export function useQuizClock(room) {
  const [now, setNow] = useState(() => Date.now());
  const start = milliseconds(room?.startedAt);
  const seconds = room?.question?.seconds || 30;
  const running = room?.status === "question" && Number.isFinite(start);
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(timer);
  }, [running, start]);
  const remaining = running
    ? Math.max(0, Math.min(seconds, (start + seconds * 1000 - now) / 1000))
    : 0;
  return {
    remaining: Math.ceil(remaining),
    fraction: running ? remaining / seconds : 0,
  };
}
export function useQuizAnswer(code, index, identity, active = true) {
  const [state, setState] = useState({
    key: "",
    answer: null,
    loading: true,
    error: false,
  });
  const key = `${code}:${index}:${identity?.token || ""}`;
  useEffect(() => {
    if (!identity || index < 0 || !active) return;
    return onSnapshot(
      doc(quizAnswersRef(code, index), identity.token),
      { includeMetadataChanges: true },
      (snapshot) => {
        if (snapshot.metadata.hasPendingWrites) return;
        setState({
          key,
          answer: snapshot.exists() ? snapshot.data() : null,
          loading: snapshot.metadata.fromCache,
          error: false,
        });
      },
      () => setState({ key, answer: null, loading: false, error: true }),
    );
  }, [code, index, identity, key, active]);
  return state.key === key
    ? state
    : { answer: null, loading: true, error: false };
}

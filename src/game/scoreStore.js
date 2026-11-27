import { doc, runTransaction } from "firebase/firestore";
import { db } from "../firebase";
import { gameScorePayload, scoreBoardPath } from "./scoreboard.js";

export async function publishGameScore({ boardId, runId, ...result }) {
  if (!/^[a-zA-Z0-9_-]{16,80}$/.test(runId)) throw new Error("Partida inválida");
  const payload = gameScorePayload(result), ref = doc(db, scoreBoardPath(boardId), runId);
  return runTransaction(db, async transaction => {
    const existing = await transaction.get(ref);
    if (existing.exists()) {
      if (existing.data().name !== payload.name || existing.data().score !== payload.score) throw new Error("La partida ya fue publicada");
      return existing.data();
    }
    transaction.set(ref, payload);
    return payload;
  });
}

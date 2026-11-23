import {
  collection,
  doc,
  getDocFromServer,
  getDocsFromServer,
  runTransaction,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { auth } from "../auth";
import {
  createQuizCode,
  createQuizIdentity,
  normalizeQuizDraft,
  quizRoundStandings,
  readQuizIdentity,
  saveQuizIdentity,
  tallyQuizRound,
} from "./quiz";

export const quizRoomRef = (code) => doc(db, "quizRooms", code);
export const quizPlayersRef = (code) =>
  collection(db, "quizRooms", code, "players");
const roundRef = (code, index) =>
  doc(db, "quizRooms", code, "rounds", String(index));
export const quizAnswersRef = (code, index) =>
  collection(roundRef(code, index), "answers");
const ensureAdmin = () => {
  if (!auth.currentUser)
    throw new Error("Vuelve a iniciar sesión como administrador.");
};

export async function saveQuizDraft(code, form, revision) {
  ensureAdmin();
  const draft = normalizeQuizDraft(form);
  const id = code || createQuizCode();
  const ref = doc(db, "quizEvents", id);
  await runTransaction(db, async (t) => {
    const snapshot = await t.get(ref);
    if (
      snapshot.exists() &&
      (!code ||
        snapshot.data().status !== "draft" ||
        snapshot.data().revision !== revision)
    )
      throw new Error(
        "El concurso cambió en otra pestaña. Abre la versión guardada antes de editar.",
      );
    if (!snapshot.exists() && code)
      throw new Error("No encontramos el concurso que estabas editando.");
    if (code)
      t.update(ref, {
        ...draft,
        revision: revision + 1,
        updatedAt: serverTimestamp(),
      });
    else
      t.set(ref, {
        ...draft,
        status: "draft",
        revision: 0,
        createdBy: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
  });
  return id;
}
export async function openQuizLobby(code, revision) {
  ensureAdmin();
  const eventRef = doc(db, "quizEvents", code);
  await runTransaction(db, async (t) => {
    const snapshot = await t.get(eventRef);
    const previousRoom = await t.get(quizRoomRef(code));
    const event = snapshot.data();
    if (
      !snapshot.exists() ||
      event.status !== "draft" ||
      event.revision !== revision
    )
      throw new Error(
        "El concurso cambió. Vuelve a abrir su versión guardada.",
      );
    normalizeQuizDraft(event, true);
    t.update(eventRef, {
      status: "live",
      revision: revision + 1,
      updatedAt: serverTimestamp(),
    });
    t.set(quizRoomRef(code), {
      title: event.title,
      status: "lobby",
      questionIndex: -1,
      questionCount: event.questions.length,
      question: null,
      startedAt: null,
      correctIndex: null,
      answerCounts: [0, 0, 0, 0],
      leaderboard: [],
      createdBy: event.createdBy,
      createdAt: previousRoom.exists()
        ? previousRoom.data().createdAt
        : serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    t.set(doc(db, "quizRooms", code, "stats", "registration"), {
      count: 0,
      lastPlayerId: "",
      updatedAt: serverTimestamp(),
    });
  });
}
export async function joinQuiz(code, name) {
  const candidate = createQuizIdentity(name);
  const previous = readQuizIdentity(code);
  const identity = previous?.name === candidate.name ? previous : candidate;
  saveQuizIdentity(code, identity);
  const statsRef = doc(db, "quizRooms", code, "stats", "registration");
  // Keep a single identity for uncertain connections; retrying never allocates a second one.
  try {
    await runTransaction(db, async (t) => {
      const room = await t.get(quizRoomRef(code));
      const stats = await t.get(statsRef);
      if (room.data()?.status !== "lobby")
        throw new Error("El registro está cerrado. Espera la próxima partida.");
      if (stats.data()?.count >= 200)
        throw new Error("Esta sala alcanzó los 200 participantes.");
      t.set(doc(quizPlayersRef(code), identity.id), {
        name: identity.name,
        joinedAt: serverTimestamp(),
      });
      t.set(doc(db, "quizRooms", code, "credentials", identity.id), {
        token: identity.token,
        createdAt: serverTimestamp(),
      });
      t.set(doc(db, "quizRooms", code, "names", identity.name.toLowerCase()), {
        playerId: identity.id,
        createdAt: serverTimestamp(),
      });
      t.update(statsRef, {
        count: stats.data().count + 1,
        lastPlayerId: identity.id,
        updatedAt: serverTimestamp(),
      });
    });
    return identity;
  } catch (error) {
    // Check the public registration after an ambiguous acknowledgement.
    const saved = await getDocFromServer(
      doc(quizPlayersRef(code), identity.id),
    ).catch(() => null);
    if (saved?.exists()) return identity;
    if (error.code === "permission-denied")
      throw new Error(
        "No pudimos registrar ese nombre. Puede estar en uso o el registro ya cerró. Revisa la sala y prueba con tu nombre y apellido.",
      );
    throw error;
  }
}
export async function submitQuizAnswer(code, index, identity, selectedIndex) {
  const ref = doc(quizAnswersRef(code, index), identity.token);
  try {
    await writeBatch(db)
      .set(ref, {
        playerId: identity.id,
        selectedIndex,
        submittedAt: serverTimestamp(),
      })
      .commit();
  } catch (error) {
    const existing = await getDocFromServer(ref).catch(() => null);
    if (existing?.exists()) return existing.data();
    if (error.code === "permission-denied")
      throw new Error("La pregunta ya cerró. Esta respuesta no se guardó.");
    throw new Error(
      "No pudimos confirmar tu respuesta. Reintenta antes de que cierre la pregunta.",
    );
  }
  return (await getDocFromServer(ref)).data();
}
export async function nextQuizQuestion(code, expectedIndex) {
  ensureAdmin();
  await runTransaction(db, async (t) => {
    const roomSnapshot = await t.get(quizRoomRef(code));
    const event = (await t.get(doc(db, "quizEvents", code))).data();
    const room = roomSnapshot.data();
    if (
      !room ||
      room.questionIndex !== expectedIndex ||
      !["lobby", "ranking"].includes(room.status)
    )
      throw new Error(
        "La sala cambió. Revisa la pregunta actual antes de continuar.",
      );
    const players = await t.get(
      doc(db, "quizRooms", code, "stats", "registration"),
    );
    if (!players.data()?.count)
      throw new Error("Espera a que se registre al menos una persona.");
    const index = room.questionIndex + 1;
    if (index >= event.questions.length)
      throw new Error("Ya se completó el bonus. Revela el resultado final.");
    const q = event.questions[index];
    const question = {
      prompt: q.prompt,
      options: q.options,
      seconds: q.seconds,
      bonus: index === event.questions.length - 1,
    };
    t.set(roundRef(code, index), {
      ...q,
      bonus: index === event.questions.length - 1,
      questionIndex: index,
      startedAt: serverTimestamp(),
      closedAt: null,
      results: [],
      tallied: false,
    });
    t.update(quizRoomRef(code), {
      status: "question",
      questionIndex: index,
      question,
      questionCount: event.questions.length,
      correctIndex: null,
      answerCounts: q.options.map(() => 0),
      startedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}
export async function closeQuizRound(code, index) {
  ensureAdmin();
  await runTransaction(db, async (t) => {
    const room = (await t.get(quizRoomRef(code))).data();
    if (!room || room.questionIndex !== index)
      throw new Error("La sala cambió de pregunta.");
    if (room.status === "question") {
      t.update(quizRoomRef(code), {
        status: "closing",
        updatedAt: serverTimestamp(),
      });
      t.update(roundRef(code, index), { closedAt: serverTimestamp() });
    } else if (
      !["closing", "reveal", "ranking", "finished"].includes(room.status)
    )
      throw new Error("No hay una pregunta para cerrar.");
  });
  // The close is acknowledged first. Strong server reads include every accepted answer.
  const [roundsSnapshot, answersSnapshot, playersSnapshot] = await Promise.all([
    getDocsFromServer(collection(db, "quizRooms", code, "rounds")),
    getDocsFromServer(quizAnswersRef(code, index)),
    getDocsFromServer(quizPlayersRef(code)),
  ]);
  const rounds = roundsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  const current = rounds.find((r) => r.questionIndex === index);
  if (current.tallied) return;
  const tally = tallyQuizRound(
    current,
    answersSnapshot.docs.map((d) => d.data()),
  );
  const players = playersSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  const leaderboard = quizRoundStandings(
    players,
    rounds.filter((r) => r.tallied && r.questionIndex < index),
    { ...current, results: tally.results },
  );
  await runTransaction(db, async (t) => {
    const room = (await t.get(quizRoomRef(code))).data();
    const round = (await t.get(roundRef(code, index))).data();
    if (round.tallied) return;
    if (room.status !== "closing" || room.questionIndex !== index)
      throw new Error(
        "La sala cambió antes de publicar el resultado. Vuelve a cerrar la pregunta.",
      );
    t.update(roundRef(code, index), { tallied: true, results: tally.results });
    t.update(quizRoomRef(code), {
      status: "ranking",
      leaderboard,
      correctIndex: current.correctIndex,
      answerCounts: tally.counts,
      updatedAt: serverTimestamp(),
    });
  });
}
export async function changeQuizPhase(code, expectedStatus, nextStatus) {
  ensureAdmin();
  await runTransaction(db, async (t) => {
    const room = (await t.get(quizRoomRef(code))).data();
    const eventRef = doc(db, "quizEvents", code);
    const event = (await t.get(eventRef)).data();
    if (
      room?.status !== expectedStatus ||
      !(
        (expectedStatus === "reveal" && nextStatus === "ranking") ||
        (expectedStatus === "ranking" &&
          room.questionIndex === event.questions.length - 1 &&
          nextStatus === "finished")
      )
    )
      throw new Error("La sala cambió. Revisa su estado antes de continuar.");
    if (nextStatus === "finished") {
      t.update(eventRef, {
        status: "finished",
        revision: event.revision + 1,
        updatedAt: serverTimestamp(),
      });
    }
    t.update(quizRoomRef(code), {
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });
  });
}
export async function archiveQuiz(code) {
  ensureAdmin();
  await runTransaction(db, async (t) => {
    const ref = doc(db, "quizEvents", code);
    const event = (await t.get(ref)).data();
    const room = await t.get(quizRoomRef(code));
    if (!event || event.status === "archived") return;
    t.update(ref, {
      status: "archived",
      revision: event.revision + 1,
      updatedAt: serverTimestamp(),
    });
    if (room.exists())
      t.update(quizRoomRef(code), {
        status: "archived",
        question: null,
        correctIndex: null,
        leaderboard: [],
        answerCounts: [0, 0, 0, 0],
        updatedAt: serverTimestamp(),
      });
  });
}

export async function resetQuiz(code, expectedRevision) {
  ensureAdmin();
  const eventRef = doc(db, "quizEvents", code);
  await runTransaction(db, async (t) => {
    const event = (await t.get(eventRef)).data();
    const room = await t.get(quizRoomRef(code));
    if (!event || event.revision !== expectedRevision)
      throw new Error(
        "El concurso cambió. Vuelve a abrirlo antes de reiniciar.",
      );
    t.update(eventRef, {
      status: "archived",
      revision: event.revision + 1,
      updatedAt: serverTimestamp(),
    });
    if (room.exists())
      t.update(quizRoomRef(code), {
        status: "archived",
        question: null,
        correctIndex: null,
        leaderboard: [],
        answerCounts: [0, 0, 0, 0],
        updatedAt: serverTimestamp(),
      });
  });
  // Stop public access first. Failed cleanup can safely be retried while archived.
  const groups = ["players", "credentials", "names"];
  const stats = await getDocFromServer(
    doc(db, "quizRooms", code, "stats", "registration"),
  );
  const rounds = await getDocsFromServer(
    collection(quizRoomRef(code), "rounds"),
  );
  const snapshots = await Promise.all([
    ...groups.map((name) =>
      getDocsFromServer(collection(quizRoomRef(code), name)),
    ),
    ...rounds.docs.map((round) =>
      getDocsFromServer(collection(round.ref, "answers")),
    ),
  ]);
  const refs = [
    ...snapshots.flatMap((snapshot) => snapshot.docs.map((d) => d.ref)),
    ...rounds.docs.map((d) => d.ref),
    ...(stats.exists() ? [stats.ref] : []),
  ];
  for (let i = 0; i < refs.length; i += 400) {
    const batch = writeBatch(db);
    refs.slice(i, i + 400).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
  await runTransaction(db, async (t) => {
    const event = (await t.get(eventRef)).data();
    if (event.status !== "archived" || event.revision !== expectedRevision + 1)
      throw new Error(
        "El concurso cambió durante el reinicio. Revisa su estado.",
      );
    t.update(eventRef, {
      status: "draft",
      revision: event.revision + 1,
      updatedAt: serverTimestamp(),
    });
  });
}

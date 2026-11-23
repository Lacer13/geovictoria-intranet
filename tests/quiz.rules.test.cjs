const { before, after, test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { createRequire } = require("node:module");
const sdkRequire = createRequire(
  require.resolve("@firebase/rules-unit-testing"),
);
const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} = require("@firebase/rules-unit-testing");
const {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
  serverTimestamp,
  Timestamp,
} = sdkRequire("firebase/firestore");
let env, visitor, admin;
const question = {
  prompt: "Pregunta de prueba del emulador",
  options: ["A", "B", "C", "D"],
  correctIndex: 1,
  seconds: 30,
};
before(async () => {
  if (!/^127\.0\.0\.1:\d+$/.test(process.env.FIRESTORE_EMULATOR_HOST || ""))
    throw Error("Only a local demo emulator is allowed");
  env = await initializeTestEnvironment({
    projectId: "demo-geovictoria",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
  visitor = env.unauthenticatedContext().firestore();
  admin = env.authenticatedContext("quiz-admin", { admin: true }).firestore();
});
after(async () => env?.cleanup());
const roomRef = (db, code) => doc(db, "quizRooms", code);
const statsRef = (db, code) =>
  doc(db, "quizRooms", code, "stats", "registration");
const playerRef = (db, code, id) => doc(db, "quizRooms", code, "players", id);
const answerRef = (db, code, token, index = "0") =>
  doc(db, "quizRooms", code, "rounds", index, "answers", token);
async function lobby(
  code,
  questions = Array(8).fill(question),
  configurable = false,
) {
  const event = doc(admin, "quizEvents", code);
  await setDoc(event, {
    title: "Ensayo aislado",
    questions,
    status: "draft",
    revision: 0,
    createdBy: "quiz-admin",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const batch = writeBatch(admin);
  batch.update(event, {
    status: "live",
    revision: 1,
    updatedAt: serverTimestamp(),
  });
  batch.set(roomRef(admin, code), {
    title: "Ensayo aislado",
    status: "lobby",
    questionIndex: -1,
    ...(configurable ? { questionCount: questions.length } : {}),
    question: null,
    startedAt: null,
    correctIndex: null,
    answerCounts: [0, 0, 0, 0],
    leaderboard: [],
    createdBy: "quiz-admin",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(statsRef(admin, code), {
    count: 0,
    lastPlayerId: "",
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
}
async function join(
  code,
  digit = "a",
  name = "Ana de prueba",
  tokenDigit = digit,
) {
  const id = digit.repeat(32),
    token = tokenDigit.repeat(64);
  const count = (await getDoc(statsRef(visitor, code))).data().count;
  const batch = writeBatch(visitor);
  batch.set(playerRef(visitor, code, id), {
    name,
    joinedAt: serverTimestamp(),
  });
  batch.set(doc(visitor, "quizRooms", code, "credentials", id), {
    token,
    createdAt: serverTimestamp(),
  });
  batch.set(doc(visitor, "quizRooms", code, "names", name.toLowerCase()), {
    playerId: id,
    createdAt: serverTimestamp(),
  });
  batch.update(statsRef(visitor, code), {
    count: count + 1,
    lastPlayerId: id,
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
  return { id, token };
}
async function start(code, old = false, q = question, index = 0) {
  const time = old
    ? Timestamp.fromMillis(Date.now() - 40000)
    : serverTimestamp();
  const batch = writeBatch(admin);
  batch.set(doc(admin, "quizRooms", code, "rounds", String(index)), {
    ...q,
    questionIndex: index,
    bonus: false,
    startedAt: time,
    closedAt: null,
    results: [],
    tallied: false,
  });
  batch.update(roomRef(admin, code), {
    status: "question",
    questionIndex: index,
    question: {
      prompt: q.prompt,
      options: q.options,
      seconds: q.seconds,
      bonus: false,
    },
    startedAt: time,
    answerCounts: q.options.map(() => 0),
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
}
const answer = (player) => ({
  playerId: player.id,
  selectedIndex: 1,
  submittedAt: serverTimestamp(),
});

test("quiz authoring and correct answers remain private; public room cannot expose an answer key", async () => {
  const code = "XMAS2222";
  await lobby(code);
  await assertFails(getDoc(doc(visitor, "quizEvents", code)));
  await assertFails(getDocs(collection(visitor, "quizEvents")));
  await assertFails(getDocs(collection(visitor, "quizRooms")));
  await assertSucceeds(getDoc(roomRef(visitor, code)));
  await assertFails(
    updateDoc(roomRef(admin, code), {
      question: { ...question, bonus: false },
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(roomRef(admin, code), {
      correctIndex: 1,
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    setDoc(doc(visitor, "quizEvents", "XMAS2223"), { title: "Forged" }),
  );
});
test("quiz registration is atomic, names are unique and the public roster never contains capabilities", async () => {
  const code = "XMAS2223";
  await lobby(code);
  await assertFails(
    setDoc(playerRef(visitor, code, "f".repeat(32)), {
      name: "Incomplete",
      joinedAt: serverTimestamp(),
    }),
  );
  const p = await join(code);
  const data = (await getDoc(playerRef(visitor, code, p.id))).data();
  assert.deepEqual(Object.keys(data).sort(), ["joinedAt", "name"]);
  await assertSucceeds(
    getDocs(collection(visitor, "quizRooms", code, "players")),
  );
  await assertFails(join(code, "b", "ANA DE PRUEBA"));
  await assertFails(
    getDoc(doc(visitor, "quizRooms", code, "credentials", p.id)),
  );
  await assertFails(
    getDocs(collection(visitor, "quizRooms", code, "credentials")),
  );
  await assertFails(
    updateDoc(playerRef(visitor, code, p.id), { name: "Another" }),
  );
  assert.equal((await getDoc(statsRef(visitor, code))).data().count, 1);
});
test("quiz answers use an owner-only capability, accept one choice and forbid score or timestamp forgery", async () => {
  const code = "XMAS2224";
  await lobby(code);
  const p = await join(code);
  await start(code);
  await assertFails(
    setDoc(answerRef(visitor, code, "b".repeat(64)), answer(p)),
  );
  await assertFails(
    setDoc(answerRef(visitor, code, p.token), { ...answer(p), points: 1000 }),
  );
  await assertFails(
    setDoc(answerRef(visitor, code, p.token), {
      ...answer(p),
      submittedAt: Timestamp.fromMillis(0),
    }),
  );
  await assertFails(
    setDoc(answerRef(visitor, code, p.token), {
      ...answer(p),
      selectedIndex: 9,
    }),
  );
  await assertSucceeds(setDoc(answerRef(visitor, code, p.token), answer(p)));
  await assertSucceeds(getDoc(answerRef(visitor, code, p.token)));
  await assertFails(
    setDoc(answerRef(visitor, code, p.token), {
      ...answer(p),
      selectedIndex: 2,
    }),
  );
  await assertFails(
    getDocs(collection(visitor, "quizRooms", code, "rounds", "0", "answers")),
  );
  await assertFails(getDoc(doc(visitor, "quizRooms", code, "rounds", "0")));
  await assertSucceeds(
    getDocs(collection(admin, "quizRooms", code, "rounds", "0", "answers")),
  );
});
test("quiz never accepts an answer during the lobby, for a future question, after time, or after an early close", async () => {
  const code = "XMAS2225";
  await lobby(code);
  const p = await join(code);
  await assertFails(setDoc(answerRef(visitor, code, p.token), answer(p)));
  await start(code);
  await assertFails(setDoc(answerRef(visitor, code, p.token, "1"), answer(p)));
  await assertFails(join(code, "b", "Late participant"));
  await updateDoc(roomRef(admin, code), {
    status: "closing",
    updatedAt: serverTimestamp(),
  });
  await assertFails(setDoc(answerRef(visitor, code, p.token), answer(p)));
  const expired = "XMAS2226";
  await lobby(expired);
  const late = await join(expired);
  await start(expired, true);
  await assertFails(
    setDoc(answerRef(visitor, expired, late.token), answer(late)),
  );
});
test("quiz enforces the last available seat and participants cannot publish a ranking or advance the show", async () => {
  const code = "XMAS2227";
  await lobby(code);
  await env.withSecurityRulesDisabled(async (ctx) =>
    updateDoc(statsRef(ctx.firestore(), code), { count: 199 }),
  );
  await assertSucceeds(join(code));
  await assertFails(join(code, "b", "No seat"));
  await assertFails(
    updateDoc(roomRef(visitor, code), {
      status: "question",
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(roomRef(visitor, code), {
      leaderboard: [{ name: "Forged", points: 999999 }],
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(statsRef(visitor, code), {
      count: 0,
      lastPlayerId: "",
      updatedAt: serverTimestamp(),
    }),
  );
});
test("quiz questions lock when the lobby opens and archiving removes public access to player names and answer capabilities", async () => {
  const code = "XMAS2228";
  await lobby(code);
  const p = await join(code);
  await start(code);
  await assertFails(
    updateDoc(doc(admin, "quizEvents", code), {
      questions: Array(8).fill({ ...question, correctIndex: 2 }),
      revision: 2,
      updatedAt: serverTimestamp(),
    }),
  );
  await assertSucceeds(setDoc(answerRef(visitor, code, p.token), answer(p)));
  await updateDoc(roomRef(admin, code), {
    status: "archived",
    question: null,
    leaderboard: [],
    correctIndex: null,
    updatedAt: serverTimestamp(),
  });
  await assertFails(getDocs(collection(visitor, "quizRooms", code, "players")));
  await assertFails(getDoc(answerRef(visitor, code, p.token)));
  await assertSucceeds(getDoc(playerRef(admin, code, p.id)));
});

test("configurable contests validate every question and alternative at both supported boundaries", async () => {
  const six = {
    ...question,
    options: ["A", "B", "C", "D", "E", "F"],
    correctIndex: 5,
  };
  await assertSucceeds(
    lobby("FLEX2222", [{ ...question, options: ["Sí", "No"] }], true),
  );
  await assertSucceeds(lobby("FLEX2223", Array(10).fill(six), true));
  const data = (await getDoc(doc(admin, "quizEvents", "FLEX2223"))).data();
  for (const [index, questions] of [
    [],
    Array(11).fill(six),
    [{ ...six, options: ["Una"] }],
    [{ ...six, options: Array(7).fill("Demasiadas") }],
    [{ ...six, correctIndex: 6 }],
    [...Array(9).fill(six), { ...six, correctIndex: 6 }],
  ].entries()) {
    await assertFails(
      setDoc(doc(admin, "quizEvents", `BADQ222${index + 2}`), {
        ...data,
        questions,
        status: "draft",
        revision: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
  }
  await assertFails(
    updateDoc(roomRef(admin, "FLEX2223"), {
      questionCount: 9,
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(doc(admin, "quizEvents", "FLEX2223"), {
      questions: Array(3).fill(six),
      revision: 2,
      updatedAt: serverTimestamp(),
    }),
  );
});

test("answer rules follow the actual option count and support F on question ten", async () => {
  for (const [code, count, index] of [
    ["FLEX2224", 2, 0],
    ["FLEX2225", 6, 9],
  ]) {
    const q = {
      ...question,
      options: Array.from({ length: count }, (_, i) => String(i)),
      correctIndex: count - 1,
    };
    await lobby(code, Array(index + 1).fill(q), true);
    const p = await join(code);
    await start(code, false, q, index);
    const ref = answerRef(visitor, code, p.token, String(index));
    await assertFails(setDoc(ref, { ...answer(p), selectedIndex: count }));
    await assertSucceeds(
      setDoc(ref, { ...answer(p), selectedIndex: count - 1 }),
    );
    await assertFails(
      updateDoc(roomRef(admin, code), {
        status: "reveal",
        correctIndex: count,
        updatedAt: serverTimestamp(),
      }),
    );
    await assertSucceeds(
      updateDoc(roomRef(admin, code), {
        status: "reveal",
        correctIndex: count - 1,
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(roomRef(admin, code), {
        questionIndex: index + 1,
        updatedAt: serverTimestamp(),
      }),
    );
  }
});

test("editable drafts keep Unicode, line breaks, changed counts and the original revision checks", async () => {
  const ref = doc(admin, "quizEvents", "EDTT2345");
  const q = {
    ...question,
    prompt: "¿Quién eligió la última?\nEnsayo navideño 🎄",
    options: ["Sí", "No"],
    correctIndex: 1,
    seconds: 90,
  };
  await assertSucceeds(
    setDoc(ref, {
      title: "Ensayo de edición",
      questions: Array(10).fill(q),
      status: "draft",
      revision: 0,
      createdBy: "quiz-admin",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
  await assertSucceeds(
    updateDoc(ref, {
      title: "Edición guardada",
      questions: [q, { ...q, options: ["Sí", "No", "Quizá"], correctIndex: 2 }],
      revision: 1,
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(ref, { revision: 1, updatedAt: serverTimestamp() }),
  );
  for (const patch of [
    { extra: true },
    { prompt: 42 },
    { prompt: "x".repeat(501) },
    { seconds: 9 },
    { seconds: 91 },
    { seconds: 30.5 },
  ]) {
    await assertFails(
      updateDoc(ref, {
        questions: [{ ...q, ...patch }],
        revision: 2,
        updatedAt: serverTimestamp(),
      }),
    );
  }
});

test("a verified delegated administrator can save and open the maximum configurable contest", async () => {
  const email = "quiz-delegated@example.test";
  await env.withSecurityRulesDisabled(async (ctx) =>
    setDoc(doc(ctx.firestore(), "administrators", email), {
      email,
      role: "admin",
      active: true,
    }),
  );
  const delegated = env
    .authenticatedContext("delegated-host", { email, email_verified: true })
    .firestore();
  const code = "DELG2345";
  const event = doc(delegated, "quizEvents", code);
  const q = {
    ...question,
    options: ["A", "B", "C", "D", "E", "F"],
    correctIndex: 5,
  };
  await assertSucceeds(
    setDoc(event, {
      title: "Ensayo delegado",
      questions: Array(10).fill(q),
      status: "draft",
      revision: 0,
      createdBy: "delegated-host",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
  await assertSucceeds(
    updateDoc(event, {
      questions: Array(10).fill({ ...q, prompt: "Edición del delegado" }),
      revision: 1,
      updatedAt: serverTimestamp(),
    }),
  );
  const batch = writeBatch(delegated);
  batch.update(event, {
    status: "live",
    revision: 2,
    updatedAt: serverTimestamp(),
  });
  batch.set(roomRef(delegated, code), {
    title: "Ensayo delegado",
    status: "lobby",
    questionCount: 10,
    questionIndex: -1,
    question: null,
    startedAt: null,
    correctIndex: null,
    answerCounts: [0, 0, 0, 0],
    leaderboard: [],
    createdBy: "delegated-host",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(statsRef(delegated, code), {
    count: 0,
    lastPlayerId: "",
    updatedAt: serverTimestamp(),
  });
  await assertSucceeds(batch.commit());
});

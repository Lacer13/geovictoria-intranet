import test from "node:test";
import assert from "node:assert/strict";
import {
  createQuizCode,
  createQuizIdentity,
  emptyQuiz,
  normalizeQuizCode,
  normalizeQuizDraft,
  quizPoints,
  quizQuestionReady,
  rankQuizPlayers,
  readQuizIdentity,
  saveQuizIdentity,
  tallyQuizRound,
  validQuizCode,
} from "../src/lib/quiz.js";

test("quiz drafts keep incomplete work but require seven complete questions and a bonus before opening", () => {
  const form = emptyQuiz();
  assert.equal(normalizeQuizDraft(form).questions.length, 8);
  assert.throws(() => normalizeQuizDraft(form, true));
  const q = {
    prompt: "¿Cuál eliges?",
    options: ["Rojo", "Verde", "Azul", "Blanco"],
    correctIndex: 0,
    seconds: 30,
  };
  assert.ok(quizQuestionReady(q));
  assert.equal(
    normalizeQuizDraft(
      { title: "  Tickets  ", questions: Array(8).fill(q) },
      true,
    ).title,
    "Tickets",
  );
  assert.ok(
    !quizQuestionReady({ ...q, options: ["Rojo", " rojo ", "Azul", "Blanco"] }),
  );
  assert.ok(!quizQuestionReady({ ...q, correctIndex: -1 }));
  assert.throws(() =>
    normalizeQuizDraft({ ...form, questions: Array(9).fill(q) }),
  );
  assert.throws(() =>
    normalizeQuizDraft({
      ...form,
      questions: Array(8).fill({ ...q, seconds: 0 }),
    }),
  );
});
test("quiz scoring uses multiples of seven, caps every award at 497 and sums without rounding drift", () => {
  assert.equal(quizPoints(true, 0, 30), 497);
  assert.equal(quizPoints(true, 15000, 30), 252);
  assert.equal(quizPoints(true, 29999, 30), 7);
  assert.equal(quizPoints(true, 15000, 30, true), 497);
  assert.equal(quizPoints(true, 0, 30, true), 497);
  assert.equal(quizPoints(true, 29999, 30, true), 14);
  for (const ms of [-1, 30000, Infinity, NaN])
    assert.equal(quizPoints(true, ms, 30), 0);
  assert.equal(quizPoints(false, 0, 30, true), 0);
  for (const seconds of [0, -1, NaN, Infinity])
    assert.equal(quizPoints(true, 0, seconds), 0);
  for (const seconds of [10, 30, 90]) {
    let previous = 497;
    for (let elapsed = 0; elapsed < seconds * 1000; elapsed++) {
      const normal = quizPoints(true, elapsed, seconds);
      const bonus = quizPoints(true, elapsed, seconds, true);
      assert.ok(normal >= 7 && normal <= 497 && normal <= previous);
      assert.equal(normal % 7, 0);
      assert.equal(bonus, Math.min(497, normal * 2));
      assert.ok(bonus >= 14 && bonus <= 497);
      assert.equal(bonus % 7, 0);
      previous = normal;
    }
  }
  const game = rankQuizPlayers(
    [{ id: "a", name: "Ana" }],
    Array.from({ length: 8 }, (_, i) => ({
      seconds: 30,
      bonus: i === 7,
      results: [
        {
          id: "a",
          correct: true,
          elapsedMs: 0,
          points: quizPoints(true, 0, 30, i === 7),
        },
      ],
    })),
  );
  assert.equal(game[0].points, 3976);
  assert.equal(game[0].points % 7, 0);
});
test("tally honors the acknowledged early close, ignores late or malformed answers and counts each player once", () => {
  const round = {
    startedAt: 10000,
    closedAt: 20000,
    seconds: 30,
    correctIndex: 2,
    bonus: false,
  };
  const result = tallyQuizRound(round, [
    { playerId: "a", selectedIndex: 2, submittedAt: 15000 },
    { playerId: "a", selectedIndex: 2, submittedAt: 16000 },
    { playerId: "b", selectedIndex: 1, submittedAt: 19000 },
    { playerId: "late", selectedIndex: 2, submittedAt: 20000 },
    { playerId: "early", selectedIndex: 2, submittedAt: 9999 },
    { playerId: "bad", selectedIndex: 9, submittedAt: 16000 },
  ]);
  assert.deepEqual(result.counts, [0, 1, 1, 0]);
  assert.equal(result.results.length, 2);
  assert.equal(result.results[0].points, 413);
  assert.equal(result.results[1].points, 0);
});
test("ranking includes absent players, uses accuracy then time, and retains exact ties as shared winners", () => {
  const players = ["Ada", "Bea", "Cris", "Dani"].map((name) => ({
    id: name,
    name,
  }));
  const rows = rankQuizPlayers(players, [
    {
      seconds: 30,
      bonus: false,
      results: [
        { id: "Ada", points: 900, correct: true, elapsedMs: 6000 },
        { id: "Bea", points: 900, correct: true, elapsedMs: 6000 },
        { id: "Cris", points: 900, correct: true, elapsedMs: 6001 },
      ],
    },
  ]);
  assert.deepEqual(
    rows.map((r) => r.rank),
    [1, 1, 3, 4],
  );
  assert.equal(rows[3].points, 0);
  assert.equal(rows[0].points, 399);
  assert.ok(rows.every((r) => r.points % 7 === 0));
  assert.equal(rows[3].elapsedMs, 0);
});
test("quiz room codes avoid ambiguous characters and participant capabilities stay out of names", () => {
  const codes = new Set(Array.from({ length: 200 }, createQuizCode));
  assert.equal(codes.size, 200);
  assert.ok([...codes].every(validQuizCode));
  assert.equal(normalizeQuizCode(" abcd 2345 "), "ABCD2345");
  assert.ok(!validQuizCode("ABCD1234"));
  const p = createQuizIdentity("  Ana   Pérez  ");
  assert.equal(p.name, "Ana Pérez");
  assert.match(p.id, /^[a-f0-9]{32}$/);
  assert.match(p.token, /^[a-f0-9]{64}$/);
  assert.throws(() => createQuizIdentity("A/B"));
});
test("participant recovery is stable on refresh and fails explicitly when browser storage is unavailable", () => {
  const data = new Map();
  globalThis.localStorage = {
    getItem: (k) => data.get(k) || null,
    setItem: (k, v) => data.set(k, v),
  };
  try {
    const p = createQuizIdentity("Test Persona");
    saveQuizIdentity("ABCD2345", p);
    assert.deepEqual(readQuizIdentity("ABCD2345"), p);
    data.set("geoQuiz:ABCD2345", '{"token":"forged"}');
    assert.equal(readQuizIdentity("ABCD2345"), null);
    localStorage.setItem = () => {
      throw new Error("blocked");
    };
    assert.throws(() => saveQuizIdentity("ABCD2345", p), /almacenamiento/);
  } finally {
    delete globalThis.localStorage;
  }
});

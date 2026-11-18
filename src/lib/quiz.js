import { randomHex } from "./secretSanta.js";

export const QUIZ_QUESTIONS = 8;
export const QUIZ_LIMIT = 200;
export const quizJoinUrl = (code) =>
  `${window.location.origin}/concurso/${code}`;
export const validQuizCode = (value) => /^[A-HJ-NP-Z2-9]{8}$/.test(value || "");
export const normalizeQuizCode = (value) =>
  String(value || "")
    .replace(/\s/g, "")
    .toUpperCase();
export function createQuizCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    crypto.getRandomValues(new Uint8Array(8)),
    (n) => alphabet[n % 32],
  ).join("");
}
export const emptyQuiz = () => ({
  title: "Tickets de implementación · Reto navideño",
  questions: Array.from({ length: QUIZ_QUESTIONS }, () => ({
    prompt: "",
    options: ["", "", "", ""],
    correctIndex: -1,
    seconds: 30,
  })),
});
export function normalizeQuizDraft(form, complete = false) {
  const title = String(form.title || "").trim();
  if (!title || title.length > 100)
    throw new Error("Escribe un título de hasta 100 caracteres.");
  if (
    !Array.isArray(form.questions) ||
    form.questions.length !== QUIZ_QUESTIONS
  )
    throw new Error("Prepara siete preguntas y una pregunta bonus.");
  const questions = form.questions.map((q, i) => {
    const prompt = String(q.prompt || "").trim();
    const options = Array.isArray(q.options)
      ? q.options.map((v) => String(v).trim())
      : [];
    if (
      prompt.length > 500 ||
      options.length !== 4 ||
      options.some((v) => v.length > 150) ||
      !Number.isInteger(q.correctIndex) ||
      q.correctIndex < -1 ||
      q.correctIndex > 3 ||
      !Number.isInteger(q.seconds) ||
      q.seconds < 10 ||
      q.seconds > 90
    )
      throw new Error(
        `Revisa los datos de ${i === 7 ? "la pregunta bonus" : `la pregunta ${i + 1}`}.`,
      );
    if (
      complete &&
      (!prompt ||
        options.some((v) => !v) ||
        q.correctIndex < 0 ||
        new Set(options.map((v) => v.toLocaleLowerCase("es"))).size !== 4)
    )
      throw new Error(
        `Completa ${i === 7 ? "la pregunta bonus" : `la pregunta ${i + 1}`} con cuatro opciones diferentes y una respuesta correcta.`,
      );
    return {
      prompt,
      options,
      correctIndex: q.correctIndex,
      seconds: q.seconds,
    };
  });
  return { title, questions };
}
export function quizQuestionReady(question) {
  try {
    normalizeQuizDraft(
      { title: "Revisión", questions: Array(8).fill(question) },
      true,
    );
    return true;
  } catch {
    return false;
  }
}
export function quizPoints(correct, elapsedMs, seconds, bonus = false) {
  if (
    !correct ||
    !Number.isFinite(elapsedMs) ||
    elapsedMs < 0 ||
    elapsedMs >= seconds * 1000
  )
    return 0;
  return (
    Math.round(1000 - (500 * elapsedMs) / (seconds * 1000)) * (bonus ? 2 : 1)
  );
}
export function milliseconds(value) {
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  return NaN;
}
export function tallyQuizRound(round, answers) {
  const counts = [0, 0, 0, 0];
  const seen = new Set();
  const results = [];
  const start = milliseconds(round.startedAt);
  const stop = Math.min(
    milliseconds(round.closedAt),
    start + round.seconds * 1000,
  );
  if (!Number.isFinite(start) || !Number.isFinite(stop))
    throw new Error("La pregunta todavía no tiene un cierre confirmado.");
  for (const a of answers) {
    const at = milliseconds(a.submittedAt);
    if (
      seen.has(a.playerId) ||
      !Number.isInteger(a.selectedIndex) ||
      a.selectedIndex < 0 ||
      a.selectedIndex > 3 ||
      at < start ||
      at >= stop ||
      !Number.isFinite(at)
    )
      continue;
    seen.add(a.playerId);
    counts[a.selectedIndex]++;
    const correct = a.selectedIndex === round.correctIndex;
    results.push({
      id: a.playerId,
      correct,
      elapsedMs: at - start,
      points: quizPoints(correct, at - start, round.seconds, round.bonus),
    });
  }
  return { counts, results };
}
export function rankQuizPlayers(players, rounds) {
  const totals = new Map(
    players.map((p) => [
      p.id,
      { id: p.id, name: p.name, points: 0, correct: 0, elapsedMs: 0 },
    ]),
  );
  for (const round of rounds)
    for (const r of round.results || []) {
      const p = totals.get(r.id);
      if (!p) continue;
      p.points += r.points;
      if (r.correct) {
        p.correct++;
        p.elapsedMs += r.elapsedMs;
      }
    }
  const ranked = [...totals.values()].sort(
    (a, b) =>
      b.points - a.points ||
      b.correct - a.correct ||
      a.elapsedMs - b.elapsedMs ||
      a.name.localeCompare(b.name, "es") ||
      a.id.localeCompare(b.id),
  );
  let rank = 0;
  return ranked.map((p, i) => {
    const prev = ranked[i - 1];
    if (
      !prev ||
      p.points !== prev.points ||
      p.correct !== prev.correct ||
      p.elapsedMs !== prev.elapsedMs
    )
      rank = i + 1;
    return { ...p, rank };
  });
}
export function createQuizIdentity(name) {
  const cleaned = String(name || "")
    .trim()
    .replace(/\s+/g, " ");
  if (cleaned.length < 2 || cleaned.length > 32 || /[/\n\r]/.test(cleaned))
    throw new Error("Escribe un nombre de 2 a 32 caracteres, sin barras.");
  return { id: randomHex(16), token: randomHex(32), name: cleaned };
}
export function readQuizIdentity(code) {
  try {
    const value = JSON.parse(localStorage.getItem(`geoQuiz:${code}`));
    if (
      /^[a-f0-9]{32}$/.test(value?.id) &&
      /^[a-f0-9]{64}$/.test(value?.token) &&
      typeof value.name === "string"
    )
      return value;
  } catch {
    /* A fresh registration remains available. */
  }
  return null;
}
export function saveQuizIdentity(code, identity) {
  // A refresh must never silently create another contestant or lose a sent answer.
  try {
    localStorage.setItem(`geoQuiz:${code}`, JSON.stringify(identity));
    if (readQuizIdentity(code)?.token !== identity.token) throw new Error();
  } catch {
    throw new Error(
      "Permite el almacenamiento de este navegador para conservar tu ingreso al concurso.",
    );
  }
}

import { readPreference, savePreference } from "../lib/preferences.js";
import { MISSIONS } from "./missions.js";

export const SCORE_BOARDS = [...MISSIONS.map(m => ({ id: m.id, label: m.title })), { id: "arcade", label: "Arcade rápido" }];
export function scoreBoard(id) {
  const board = SCORE_BOARDS.find(b => b.id === id);
  if (!board) throw new Error("Clasificación desconocida");
  return board;
}
export function scoreBoardPath(id) {
  scoreBoard(id);
  return id === "arcade" ? "leaderboard" : `gameLeaderboards/${id}/entries`;
}
export function normalizePlayerName(value) {
  return String(value || "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 24);
}
export function validPlayerName(value) { return normalizePlayerName(value).length >= 2; }
export function readPlayerName() { return normalizePlayerName(readPreference("geo_arcade_player_name", "")); }
export function savePlayerName(value) { savePreference("geo_arcade_player_name", normalizePlayerName(value)); }
export function gameScorePayload({ name, score, date }) {
  const normalized = normalizePlayerName(name);
  if (!validPlayerName(normalized) || !Number.isSafeInteger(score) || score < 0 || score > 10000000 ||
      typeof date !== "string" || !Number.isFinite(Date.parse(date)) || date.length > 50) throw new Error("Resultado inválido");
  return { name: normalized, score, date };
}
export function rankGameScores(rows) {
  const sorted = rows.filter(r => typeof r.name === "string" && Number.isSafeInteger(r.score) && r.score >= 0)
    .toSorted((a, b) => b.score - a.score || String(a.date).localeCompare(String(b.date)) || String(a.id).localeCompare(String(b.id)));
  return sorted.map((row, i) => ({ ...row, rank: i > 0 && row.score === sorted[i - 1].score ? sorted.findIndex(r => r.score === row.score) + 1 : i + 1 }));
}

export const MISSIONS = [
  { id: "bosque", title: "Las luces del bosque", subtitle: "Abre el camino hasta el faro", description: "Recupera las luces del bosque y derrota al centinela de la ruta.", seconds: 90, kills: 18, beacons: 0, spawnEvery: 78, speed: 2.6, bossHp: 24, color: "#91cfad", sky: "#061c25", patterns: ["scout", "scout", "zigzag"] },
  { id: "taller", title: "El taller congelado", subtitle: "Repara las tres balizas", description: "Recoge los tres núcleos de reparación, mantén la ruta y reactiva el taller.", seconds: 105, kills: 0, beacons: 3, spawnEvery: 72, speed: 2.8, bossHp: 32, color: "#9acde7", sky: "#152538", patterns: ["scout", "zigzag", "shooter"] },
  { id: "faro", title: "El último encendido", subtitle: "Detén el Desfase", description: "Llega al faro y vence al guardián final. Sus ataques cambian al perder energía.", seconds: 120, kills: 28, beacons: 0, spawnEvery: 65, speed: 3, bossHp: 44, color: "#e9bc77", sky: "#29203c", patterns: ["zigzag", "shooter", "scout", "shooter"] },
];
export const missionById = id => MISSIONS.find(m => m.id === id);
export function missionObjective(state) {
  const m = missionById(state.missionId);
  if (!m) return state.bossSpawned ? "Protege las luces · derrota al guardián" : "Recupera 100 puntos para llegar al taller";
  if (state.bossSpawned) return `${m.title} · derrota al guardián`;
  const remaining = Math.max(0, m.seconds - Math.floor(state.tick / 60));
  const progress = m.beacons ? `Balizas ${state.missionProgress.beacons}/${m.beacons}` : `Robots ${Math.min(state.missionProgress.kills, m.kills)}/${m.kills}`;
  return `${progress} · Faro en ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;
}
export function campaignProgress(value) {
  const completed = Array.isArray(value?.completed) ? [...new Set(value.completed.filter(id => missionById(id)))] : [];
  // Progress is sequential even if optional browser storage is corrupt.
  const valid = [];
  for (const m of MISSIONS) { if (!completed.includes(m.id)) break; valid.push(m.id); }
  const scores = {};
  for (const m of MISSIONS) if (Number.isSafeInteger(value?.scores?.[m.id]) && value.scores[m.id] >= 0) scores[m.id] = Math.min(10000000, value.scores[m.id]);
  return { completed: valid, scores };
}
export function completeMission(progress, id, score) {
  const next = campaignProgress(progress), index = MISSIONS.findIndex(m => m.id === id);
  if (index < 0 || index > next.completed.length || !Number.isSafeInteger(score) || score < 0) return next;
  if (!next.completed.includes(id)) next.completed.push(id);
  next.scores[id] = Math.max(next.scores[id] || 0, score);
  return next;
}

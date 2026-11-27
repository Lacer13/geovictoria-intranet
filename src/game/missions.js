export const MISSIONS = [
  { id: "bosque", title: "Las luces del bosque", subtitle: "Rescata seis regalos perdidos", description: "Recoge los seis regalos que llegan por distintas alturas y espera la señal del guardián. Su escudo se abre por intervalos: ese es el momento de disparar.", seconds: 90, kills: 0, beacons: 0, spawnEvery: 78, speed: 2.6, bossHp: 24, color: "#91cfad", sky: "#061c25", patterns: ["scout", "scout", "zigzag"] },
  { id: "taller", title: "El taller congelado", subtitle: "Acércate y repara tres balizas", description: "Las balizas se activan una a una. Mantente dentro del círculo hasta completar su reparación y prepárate para los disparos en abanico del Forjador de Escarcha.", seconds: 105, kills: 0, beacons: 3, spawnEvery: 72, speed: 2.8, bossHp: 32, color: "#9acde7", sky: "#152538", patterns: ["scout", "zigzag", "shooter"] },
  { id: "faro", title: "El último encendido", subtitle: "Escolta el núcleo hasta el faro", description: "Vuela cerca del núcleo para guiarlo; si te alejas, esperará. Al llegar te enfrentarás al Desfase, que amplía sus ráfagas en tres fases.", seconds: 120, kills: 0, beacons: 0, spawnEvery: 65, speed: 3, bossHp: 44, color: "#e9bc77", sky: "#29203c", patterns: ["zigzag", "shooter", "scout", "shooter"] },
];
export const missionById = id => MISSIONS.find(m => m.id === id);
export function missionObjective(state) {
  const m = missionById(state.missionId);
  if (!m) return state.bossSpawned ? "Protege las luces · derrota al guardián" : "Recupera 100 puntos para llegar al taller";
  if (state.bossSpawned) return `${state.boss?.name || m.title} · derrota al guardián`;
  const remaining = Math.max(0, m.seconds - Math.floor(state.tick / 60));
  const p = state.missionProgress;
  let progress;
  if (m.id === "bosque") progress = `Regalos ${p.rescued}/6`;
  else if (m.id === "taller") {
    const station = p.stations[p.beacons];
    progress = !station ? "Tres balizas reparadas" : state.tick < station.availableAt ? `Balizas ${p.beacons}/3 · próxima en ${Math.ceil((station.availableAt-state.tick)/60)}s` : `Baliza ${p.beacons+1}/3 · acércate al círculo · ${Math.floor(station.charge/150*100)}%`;
  } else progress = `Núcleo ${Math.floor(p.escort.progress/p.escort.required*100)}% · ${p.escort.near ? "Sigue cerca" : "Acércate para guiarlo"}`;
  return `${progress}${remaining ? ` · Señal en ${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,"0")}` : ""}`;
}
export function missionReady(state) {
  const m = missionById(state.missionId), p = state.missionProgress;
  return !!m && state.tick >= m.seconds*60 && (m.id === "bosque" ? p.rescued >= 6 : m.id === "taller" ? p.beacons >= 3 : p.escort.progress >= p.escort.required);
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

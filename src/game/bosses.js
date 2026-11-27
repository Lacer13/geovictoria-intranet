export const BOSSES = {
  bosque: { name: "Centinela del bosque", color: "#91e6b4", filter: "hue-rotate(90deg)", hint: "Espera a que abra el escudo y dispara." },
  taller: { name: "Forjador de Escarcha", color: "#9adaff", filter: "hue-rotate(175deg)", hint: "Mira los carriles y busca el hueco entre disparos." },
  faro: { name: "El Desfase", color: "#e7b4ff", filter: "hue-rotate(285deg)", hint: "Sus ráfagas se amplían al perder energía." },
};
export function bossShielded(boss, missionId, tick) {
  return missionId === "bosque" && (tick - (boss.bornAt || 0)) % 240 < 105;
}
export function bossAttackPlan(boss, missionId) {
  if (missionId === "taller") return { velocities: (boss.volley || 0) % 2 ? [-2.2, 0, 2.2] : [-2.6, 2.6], speed: 6, cooldown: boss.hp <= boss.maxHp / 2 ? 105 : 125, phase: 1 };
  if (missionId === "faro" && boss.hp <= boss.maxHp / 3) return { velocities: [-3.4,-1.7,0,1.7,3.4], speed: 6, cooldown: 90, phase: 3 };
  if (missionId === "faro" && boss.hp <= boss.maxHp / 2) return { velocities: [-2.2,0,2.2], speed: 6, cooldown: 100, phase: 2 };
  return { velocities: [0], speed: 7, cooldown: missionId === "bosque" ? 115 : 100, phase: 1 };
}

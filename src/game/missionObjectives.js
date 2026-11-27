import { missionById } from "./missions.js";

export function createMissionProgress(id) {
  const base = { kills: 0, beacons: 0, nextBeacon: 1200 };
  if (id === "bosque") return { ...base, rescued: 0, nextGift: 600 };
  if (id === "taller") return { ...base, stations: [
    { x: 190, y: 130, charge: 0, availableAt: 900 },
    { x: 320, y: 350, charge: 0, availableAt: 2700 },
    { x: 390, y: 190, charge: 0, availableAt: 4500 },
  ] };
  if (id === "faro") return { ...base, escort: { x: 190, y: 270, progress: 0, required: missionById(id).seconds * 60, near: false } };
  return base;
}
export function activeRepairStation(state) {
  const station = state.missionProgress.stations?.[state.missionProgress.beacons];
  return station && state.tick >= station.availableAt ? station : null;
}
export function advanceMissionObjective(state, announce) {
  if (!state.missionId || state.bossSpawned || state.phase !== "playing") return;
  const p = state.player, progress = state.missionProgress;
  if (state.missionId === "bosque" && progress.rescued < 6 && state.tick >= progress.nextGift && !state.pickups.some(item => item.type === "gift")) {
    state.pickups.push({ x: 900, y: [85,320,180][progress.rescued % 3], width: 40, height: 40, type: "gift" });
    progress.nextGift = state.tick + 600;
    announce(state, "¡REGALO A LA VISTA!");
  }
  const station = activeRepairStation(state);
  if (station && Math.hypot(p.x + p.width/2 - station.x, p.y + p.height/2 - station.y) <= 85) {
    station.charge = Math.min(150, station.charge + 1);
    if (station.charge === 150) {
      progress.beacons++; state.score += 35; p.shield = Math.max(p.shield, 90);
      state.events.push("pickup"); announce(state, "¡BALIZA REPARADA!");
    }
  }
  const escort = progress.escort;
  if (escort && escort.progress < escort.required) {
    escort.near = Math.hypot(p.x + p.width/2 - escort.x, p.y + p.height/2 - escort.y) <= 150;
    if (escort.near) escort.progress++;
    const fraction = escort.progress / escort.required;
    escort.x = 190 + fraction * 220; escort.y = 270 + Math.sin(fraction * Math.PI * 3) * 115;
    if (escort.progress === escort.required) { state.score += 75; state.events.push("pickup"); announce(state, "¡NÚCLEO A SALVO!"); }
  }
}

import { ARENA, WALLS } from "./arenaSimulation.js";

export function drawArena(ctx, state, players, side, portraits, previous = null, alpha = 1) {
  const lerp = (from, to) => from + (to - from) * alpha;
  ctx.fillStyle = "#0c252b"; ctx.fillRect(0, 0, ARENA.width, ARENA.height);
  ctx.strokeStyle = "#26464b"; ctx.lineWidth = 1;
  for (let x = 40; x < 960; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 540); ctx.stroke(); }
  for (let y = 30; y < 540; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(960, y); ctx.stroke(); }
  const colors = ["#81c9ed", "#f5c578"];
  for (const [i, x] of [[0, 60], [1, 900]]) {
    ctx.fillStyle = colors[i] + "30"; ctx.beginPath(); ctx.arc(x, 270, 62, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = colors[i]; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = colors[i]; ctx.font = "bold 14px system-ui"; ctx.textAlign = "center"; ctx.fillText(i === side ? "TU FARO" : "RIVAL", x, 358);
  }
  for (const wall of WALLS) { ctx.fillStyle = "#345e58"; ctx.beginPath(); ctx.roundRect(wall.x, wall.y, wall.w, wall.h, 12); ctx.fill(); ctx.strokeStyle = "#6e9380"; ctx.stroke(); }
  for (const b of state.bullets) { ctx.fillStyle = colors[b.side]; ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, Math.PI * 2); ctx.fill(); }
  const positions = state.players.map((p, i) => {
    const old = previous?.players[i];
    const interpolate = old && !p.respawn && !old.respawn && Math.hypot(p.x - old.x, p.y - old.y) < 60;
    return { x: interpolate ? lerp(old.x, p.x) : p.x, y: interpolate ? lerp(old.y, p.y) : p.y };
  });
  for (const p of state.players) {
    if (p.respawn) continue;
    const { x, y } = positions[p.side], color = colors[p.side];
    ctx.strokeStyle = color; ctx.lineWidth = p.side === side ? 4 : 2;
    ctx.beginPath(); ctx.arc(x, y, p.grace || p.dash ? 30 : 25, 0, Math.PI * 2); ctx.stroke();
    const image = portraits[players[p.side]?.character];
    if (image?.complete && image.naturalWidth) ctx.drawImage(image, x - 35, y - 35, 70, 70);
    else { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, 17, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = color; ctx.beginPath(); ctx.moveTo(x + p.aimX * 25, y + p.aimY * 25); ctx.lineTo(x + p.aimX * 40, y + p.aimY * 40); ctx.stroke();
    ctx.textAlign = "center"; ctx.font = "bold 14px system-ui"; ctx.fillStyle = "#eef5ef"; ctx.fillText(players[p.side]?.name || "Guardián", x, y - 40);
    for (let hp = 0; hp < 3; hp++) { ctx.fillStyle = hp < p.hp ? color : "#3d5558"; ctx.fillRect(x - 18 + hp * 13, y + 31, 10, 4); }
  }
  if (!state.orb.cooldown) {
    const carrier = state.orb.carrier, pos = carrier === null ? state.orb : positions[carrier];
    const x = pos.x, y = pos.y - (carrier === null ? 0 : 42);
    ctx.fillStyle = "#eaf8be"; ctx.shadowColor = "#d4ff93"; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(x, y, 11, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
  }
  if (state.phase === "countdown") {
    ctx.fillStyle = "#081f25bc"; ctx.fillRect(0, 0, 960, 540);
    ctx.textAlign = "center"; ctx.fillStyle = "#fff0c9"; ctx.font = "bold 90px system-ui"; ctx.fillText(String(Math.max(1, Math.ceil((180 - state.tick) / 60))), 480, 280);
  }
}

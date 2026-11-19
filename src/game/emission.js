// This is the existing basic projectile's center at birth (24 x 6). Keeping
// this contract preserves hitboxes, speed and aim while aligning new artwork.
export function basicShotOrigin(player) {
  return { x: player.x + player.width - 4, y: player.y + 63 };
}

export function recordShot(state, projectiles, kind = "basic") {
  const first = projectiles[0];
  const origin = kind === "basic" ? basicShotOrigin(state.player) : {
    x: first.x + first.width / 2, y: first.y + first.height / 2,
  };
  const event = {
    type: "shot", id: ++state.shotSequence, tick: state.tick, kind, origin,
    sound: kind === "basic" ? "shoot" : null,
    projectiles: projectiles.map((b) => ({ x: b.x, y: b.y, width: b.width, height: b.height, vx: b.vx, vy: b.vy })),
  };
  for (const bullet of projectiles) Object.assign(bullet, {
    shotId: event.id, bornAt: state.tick,
    emissionX: origin.x - bullet.width / 2, emissionY: origin.y - bullet.height / 2,
    followsEmitter: kind === "basic",
  });
  state.player.lastShot = { id: event.id, tick: event.tick, kind, origin };
  state.events.push(event);
  return event;
}

// Simulation events are drained once, even when a render catches up several
// fixed steps. Repainting, pausing or receiving damage never emits a shot.
export function consumeGameEvents(events, actor, play) {
  for (const event of events.splice(0)) {
    if (typeof event === "string") { play(event); continue; }
    if (event.type !== "shot" || event.id <= (actor.lastShotId || 0)) continue;
    actor.lastShotId = event.id;
    if (event.sound) play(event.sound);
  }
}

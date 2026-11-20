import test from "node:test";
import assert from "node:assert/strict";
import WebSocket from "ws";
import { createArena, stepArena, freshArenaInput, validArenaInput, finishArena } from "../src/game/arenaSimulation.js";
import { createArenaServer } from "../server/arena.mjs";

test("arena applies equal speed, normalized diagonals, wall collision, bounded inputs and dash cooldown", () => {
  assert.equal(validArenaInput({ ...freshArenaInput(), x: Infinity }), false);
  assert.equal(validArenaInput({ ...freshArenaInput(), score: 99 }), false);
  const s = createArena(); s.phase = "playing";
  const a = { ...freshArenaInput(), x: 1, y: 1 }, b = { ...freshArenaInput(), x: -1, y: -1 };
  stepArena(s, [a, b]);
  assert.ok(Math.abs(Math.hypot(s.players[0].x - 95, s.players[0].y - 270) - 4) < 1e-8);
  assert.ok(Math.abs(865 - s.players[1].x - (s.players[0].x - 95)) < 1e-8);
  s.players[0].x = 235; s.players[0].y = 160;
  for (let i = 0; i < 90; i++) stepArena(s, [{ ...freshArenaInput(), x: 1 }, freshArenaInput()]);
  assert.ok(s.players[0].x <= 241);
  stepArena(s, [{ ...freshArenaInput(), dash: true }, freshArenaInput()]);
  assert.equal(s.players[0].cooldown, 150);
  stepArena(s, [{ ...freshArenaInput(), dash: true }, freshArenaInput()]); assert.equal(s.players[0].cooldown, 149);
});
test("arena carries and delivers the light, ends at five and never changes a finished result", () => {
  const s = createArena(); s.phase = "playing";
  for (let i = 0; i < 5; i++) {
    Object.assign(s.orb, { x: 480, y: 270, carrier: null, cooldown: 0 });
    Object.assign(s.players[0], { x: 480, y: 270 });
    stepArena(s, [freshArenaInput(), freshArenaInput()]); assert.equal(s.orb.carrier, 0);
    s.players[0].x = 60; stepArena(s, [freshArenaInput(), freshArenaInput()]);
    assert.equal(s.players[0].score, i + 1);
  }
  assert.equal(s.phase, "finished"); assert.equal(s.winner, 0);
  const frozen = structuredClone(s); stepArena(s, [freshArenaInput(), freshArenaInput()]); assert.deepEqual(s, frozen);
});

test("an arena match reaches five deliveries using movement alone without teleporting players or changing scores", () => {
  const s = createArena();
  while (s.phase !== "finished" && s.tick < 6000) {
    const p = s.players[0], destination = s.orb.carrier === 0 ? 60 : 480;
    const input = { ...freshArenaInput(), x: Math.abs(destination - p.x) < 3 ? 0 : Math.sign(destination - p.x) };
    stepArena(s, [input, freshArenaInput()]);
  }
  assert.equal(s.phase, "finished"); assert.equal(s.winner, 0); assert.equal(s.players[0].score, 5);
});
test("arena damage drops the light, gives recovery time and respawns; ties have only one overtime", () => {
  const s = createArena(); s.phase = "playing";
  Object.assign(s.players[1], { x: 500, y: 270, grace: 0, hp: 1 }); s.orb.carrier = 1;
  s.bullets.push({ id: 1, side: 0, x: 490, y: 270, vx: 10, vy: 0, life: 10 });
  stepArena(s, [freshArenaInput(), freshArenaInput()]);
  assert.equal(s.orb.carrier, null); assert.equal(s.players[1].respawn, 120);
  for (let i = 0; i < 120; i++) stepArena(s, [freshArenaInput(), freshArenaInput()]);
  assert.equal(s.players[1].hp, 3); assert.equal(s.players[1].grace, 90);
  s.playingTicks = 180 * 60 - 1; stepArena(s, [freshArenaInput(), freshArenaInput()]); assert.equal(s.overtime, true);
  s.playingTicks = 210 * 60 - 1; stepArena(s, [freshArenaInput(), freshArenaInput()]); assert.equal(s.phase, "finished"); assert.equal(s.winner, null);
});

async function client(url) {
  const ws = new WebSocket(url, { origin: "http://127.0.0.1:5174" }), messages = [];
  ws.on("message", b => messages.push(JSON.parse(b.toString())));
  await new Promise((resolve, reject) => { ws.once("open", resolve); ws.once("error", reject); });
  return { ws, messages, send: data => ws.send(JSON.stringify(data)), async wait(predicate) {
    const start = Date.now();
    while (Date.now() - start < 4000) { const value = messages.find(predicate); if (value) return value; await new Promise(resolve => setTimeout(resolve, 10)); }
    throw new Error("Timed out waiting for arena message");
  } };
}
test("two WebSocket clients share a private match, reject forged movement and resume with a private credential", async () => {
  const arena = createArenaServer(); await new Promise(resolve => arena.server.listen(0, "127.0.0.1", resolve));
  const url = `ws://127.0.0.1:${arena.server.address().port}/arena`;
  const peers = [];
  try {
    const a = await client(url); peers.push(a); a.send({ t: "create", name: "Azul", character: "tecnoia" });
    const joined = await a.wait(m => m.t === "joined"); assert.equal(joined.token.length, 64);
    const b = await client(url); peers.push(b); b.send({ t: "join", code: joined.code, name: "Dorado", character: "conectia" });
    const bJoined = await b.wait(m => m.t === "joined"); assert.equal(bJoined.side, 1);
    a.send({ t: "ready", ready: true }); b.send({ t: "ready", ready: true });
    const snapshot = await a.wait(m => m.t === "state" && m.game);
    const shared = await b.wait(m => m.t === "state" && m.round === snapshot.round);
    assert.equal(shared.round, snapshot.round); assert.ok(!JSON.stringify(shared).includes(joined.token));
    a.send({ t: "input", round: snapshot.round, seq: 1, input: { ...freshArenaInput(), x: 1, position: { x: 900 }, score: 5 } });
    await new Promise(resolve => setTimeout(resolve, 80));
    assert.equal(arena.rooms.get(joined.code).players[0].seq, -1);
    a.send({ t: "input", round: snapshot.round, seq: 3, input: { ...freshArenaInput(), x: 1 } });
    await new Promise(resolve => setTimeout(resolve, 50)); assert.equal(arena.rooms.get(joined.code).players[0].seq, 3);
    a.send({ t: "input", round: snapshot.round, seq: 2, input: freshArenaInput() });
    await new Promise(resolve => setTimeout(resolve, 50)); assert.equal(arena.rooms.get(joined.code).players[0].seq, 3);
    a.ws.close(); await new Promise(resolve => a.ws.once("close", resolve));
    const resumed = await client(url); peers.push(resumed); resumed.send({ t: "resume", code: joined.code, token: joined.token });
    const recovered = await resumed.wait(m => m.t === "joined"); assert.equal(recovered.side, 0); assert.equal(recovered.nextSeq, 4);
    finishArena(arena.rooms.get(joined.code).game, 1, "time");
    const result = await resumed.wait(m => m.t === "state" && m.game?.phase === "finished");
    assert.equal(result.game.winner, 1);
    const resultB = await b.wait(m => m.t === "state" && m.game?.phase === "finished"); assert.deepEqual(resultB.game, result.game);
    b.send({ t: "ready", ready: true }); resumed.send({ t: "ready", ready: true });
    const rematch = await resumed.wait(m => m.t === "state" && m.game && m.round !== snapshot.round); assert.equal(rematch.game.phase, "countdown");
  } finally { for (const p of peers) p.ws.terminate(); await arena.close(); }
});

import test from "node:test";
import assert from "node:assert/strict";
import { createGame, stepGame, emptyInput, gameSummary } from "../src/game/simulation.js";
import { MISSIONS, campaignProgress, completeMission } from "../src/game/missions.js";
import { activeRepairStation } from "../src/game/missionObjectives.js";
const tick = s => stepGame(s, emptyInput(), { random: () => 0.99 });

test("campaign missions require their own elapsed time and objective rather than the old score threshold", () => {
  for (const mission of MISSIONS) {
    const s = createGame("tecnoia", { missionId: mission.id });
    s.score = 100000; s.tick = mission.seconds * 60 - 2;
    s.missionProgress.kills = mission.kills; s.missionProgress.beacons = mission.beacons;
    if(mission.id==="bosque")s.missionProgress.rescued=6;
    if(mission.id==="faro")s.missionProgress.escort.progress=s.missionProgress.escort.required;
    tick(s); assert.equal(s.bossSpawned, false);
    tick(s); assert.equal(s.bossSpawned, true); assert.equal(s.boss.maxHp, mission.bossHp);
    assert.match(gameSummary(s).objective, /guardián/);
  }
  assert.throws(() => createGame("tecnoia", { missionId: "missing" }), /mission/);
});
test("workshop repairs three timed stations by staying nearby and preserves partial work after moving away", () => {
  const s = createGame("conectia", { missionId: "taller" });
  const first=s.missionProgress.stations[0];
  s.tick=first.availableAt-2;s.player.x=first.x-56;s.player.y=first.y-56;tick(s);assert.equal(first.charge,0);
  tick(s);assert.equal(first.charge,1);s.player.y=400;tick(s);assert.equal(first.charge,1);
  for(let i=0;i<3;i++){
    const station=s.missionProgress.stations[i];s.tick=station.availableAt;s.enemies=[];s.bullets=[];
    s.player.x=station.x-56;s.player.y=station.y-56;
    while(s.missionProgress.beacons===i)tick(s);
    assert.equal(station.charge,150);assert.equal(s.missionProgress.beacons,i+1);
  }
  assert.equal(s.score,105);s.tick=6300;
  tick(s); assert.equal(s.bossSpawned, true);
});
test("campaign final boss changes firing pattern below half energy and classic stays unchanged", () => {
  for (const missionId of [null, "faro"]) {
    const s = createGame("tecnoia", { missionId }); s.bossSpawned = true;
    s.boss = { x: 750, y: 160, width: 160, height: 160, hp: 15, maxHp: 44, dy: 1.6, shot: 1, flash: 0 };
    tick(s); assert.equal(s.bullets.filter(b => b.enemy).length, missionId ? 3 : 1);
  }
});
test("campaign checkpoint unlocks sequentially, preserves best scores and rejects corrupt optional progress", () => {
  let p = campaignProgress({ completed: ["faro"], scores: { faro: -2 } });
  assert.deepEqual(p, { completed: [], scores: {} });
  assert.deepEqual(completeMission(p, "taller", 100), p);
  p = completeMission(p, "bosque", 300); p = completeMission(p, "bosque", 200);
  assert.equal(p.scores.bosque, 300);
  p = completeMission(p, "taller", 400); p = completeMission(p, "faro", 500);
  assert.deepEqual(p.completed, ["bosque", "taller", "faro"]);
});

test("all three missions can be completed in sequence with normal health, powers and saved checkpoints", () => {
  let progress = campaignProgress(null), totalTicks = 0;
  for (const mission of MISSIONS) {
    const state = createGame("conectia", { missionId: mission.id });
    let seed = 8128;
    const random = () => { seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646; };
    while (state.phase === "playing" && state.tick < 24000) {
      const station=activeRepairStation(state),escort=state.missionProgress.escort;
      const objective=state.pickups.find(p=>p.type==="gift") || station || (escort&&escort.progress<escort.required?escort:null);
      const target = objective || state.boss || state.enemies.find(e => e.x > state.player.x + 150);
      const input = { ...emptyInput(), fire: true, power: state.player.powerCooldown === 0 };
      if (target) {
        const y=target.y+(target.height||0)/2-56;
        input.up=state.player.y>y+4;input.down=state.player.y<y-4;
        if(objective){const x=target.x+(target.width||0)/2-56-(target===escort?100:0);input.left=state.player.x>x+4;input.right=state.player.x<x-4;}
      }
      const threat=state.bullets.find(b=>b.enemy&&b.x>state.player.x&&b.x<state.player.x+230&&Math.abs(b.y-state.player.y-56)<48);
      if(threat){input.up=state.player.y>190;input.down=!input.up;}
      const contact=state.enemies.find(e=>e.x>state.player.x-40&&e.x<state.player.x+230&&Math.abs(e.y+40-state.player.y-56)<85);
      if(contact){input.up=state.player.y+56<=contact.y+40;input.down=!input.up;}
      stepGame(state, input, { random }); state.events = [];
    }
    assert.equal(state.phase, "victory", mission.id); assert.ok(state.player.hp > 0);
    assert.ok(state.tick >= mission.seconds * 60); totalTicks += state.tick;
    progress = completeMission(progress, mission.id, state.score);
  }
  assert.equal(progress.completed.length, 3); assert.ok(totalTicks > 300 * 60);
});

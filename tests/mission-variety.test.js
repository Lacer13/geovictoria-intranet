import test from "node:test";
import assert from "node:assert/strict";
import { createGame, emptyInput, stepGame } from "../src/game/simulation.js";
import { missionReady } from "../src/game/missions.js";
import { bossAttackPlan, bossShielded } from "../src/game/bosses.js";
import { enemyMuzzle } from "../src/game/enemyAnimation.js";
const tick=s=>stepGame(s,emptyInput(),{random:()=>.99});

test("forest counts rescued gifts rather than a forged score and retries missed gifts",()=>{
  const s=createGame("tecnoia",{missionId:"bosque"});s.tick=599;tick(s);assert.equal(s.pickups[0].type,"gift");
  s.pickups[0].x=-100;tick(s);s.tick=1199;tick(s);assert.equal(s.pickups.filter(p=>p.type==="gift").length,1);
  s.score=99999;s.tick=6000;assert.equal(missionReady(s),false);
  for(let i=0;i<6;i++){s.pickups=[{x:s.player.x+20,y:s.player.y+20,width:40,height:40,type:"gift"}];tick(s);}
  assert.equal(s.missionProgress.rescued,6);assert.equal(missionReady(s),true);tick(s);assert.equal(s.boss.kind,"bosque");
});

test("the escort waits outside its range, progresses nearby and cannot finish only by waiting for the timer",()=>{
  const s=createGame("tecnoia",{missionId:"faro"}),e=s.missionProgress.escort;
  s.player.x=4;s.player.y=12;tick(s);assert.equal(e.progress,0);
  s.player.x=e.x-56;s.player.y=e.y-56;tick(s);assert.equal(e.progress,1);
  s.tick=9999;assert.equal(missionReady(s),false);e.progress=e.required;assert.equal(missionReady(s),true);
});

test("the forest shield blocks damage only while closed and exposes a real firing window",()=>{
  const s=createGame("cierreia",{missionId:"bosque"});s.bossSpawned=true;
  s.boss={x:750,y:160,width:160,height:160,hp:24,maxHp:24,dy:0,shot:100,bornAt:0,kind:"bosque"};
  const hit=()=>{s.bullets=[{x:780,y:210,width:24,height:6,vx:0,vy:0,enemy:false,damage:4}];tick(s);};
  hit();assert.equal(s.boss.hp,24);assert.equal(bossShielded(s.boss,"bosque",s.tick),true);
  s.tick=110;hit();assert.equal(s.boss.hp,20);assert.equal(bossShielded(s.boss,"bosque",s.tick),false);
});

test("bosses advertise distinct volleys and every projectile is born on the visible barrel",()=>{
  for(const [id,hp,maxHp,count] of [["bosque",24,24,1],["taller",32,32,2],["faro",44,44,1],["faro",20,44,3],["faro",10,44,5],[null,10,25,1]]){
    const s=createGame("tecnoia",{missionId:id});s.bossSpawned=true;s.tick=500;
    s.boss={x:750,y:160,width:160,height:160,hp,maxHp,dy:0,shot:1,bornAt:0,kind:id};
    const before=bossAttackPlan(s.boss,id);assert.equal(before.velocities.length,count);tick(s);
    const bullets=s.bullets.filter(b=>b.enemy),muzzle=enemyMuzzle(s.boss,true);assert.equal(bullets.length,count);
    for(const b of bullets){assert.equal(b.emissionX+b.width,muzzle.x);assert.equal(b.emissionY+b.height/2,muzzle.y);}
    assert.equal(s.boss.shot,before.cooldown);
  }
});

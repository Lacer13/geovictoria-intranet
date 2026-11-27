import test from "node:test";
import assert from "node:assert/strict";
import {createMemoryGame,flipMemory,settleMemory,memoryScore,createAimGame,hitAim,stepAim,readMiniRecords,saveMiniRecord} from "../src/game/miniGames.js";

test("memory reveals only two cards per attempt, ignores duplicate clicks and locks a wrong pair until settled",()=>{
  const s=createMemoryGame(["a","b","c"],()=>.5),first=0,other=s.cards.findIndex(c=>c.pair!==s.cards[0].pair);
  const a=flipMemory(s,first);assert.equal(flipMemory(a,first),a);assert.equal(s.open.length,0);
  const b=flipMemory(a,other);assert.equal(b.moves,1);assert.equal(b.open.length,2);assert.equal(flipMemory(b,2),b);
  assert.deepEqual(settleMemory(b).open,[]);assert.equal(settleMemory(b).moves,1);
});
test("all pairs can be completed once and a finished memory game cannot award another result",()=>{
  let s=createMemoryGame(["a","b","c","d","e","f"],()=>.3);
  for(const pair of ["a","b","c","d","e","f"]){for(let i=0;i<s.cards.length;i++)if(s.cards[i].pair===pair)s=flipMemory(s,i);}
  assert.equal(s.phase,"won");assert.equal(s.moves,6);assert.equal(s.cards.filter(c=>c.matched).length,12);assert.equal(flipMemory(s,0),s);
  assert.ok(memoryScore(6,20)>memoryScore(10,90));assert.equal(memoryScore(200,1000),50);
});
test("aim rewards reaction time, rejects a stale double click and never repeats the same target immediately",()=>{
  assert.equal(createAimGame(()=>.999).target,8);
  const start=createAimGame(()=>.5),fast=hitAim(start,.1,start.target,start.round,()=>.5),slow=hitAim(start,1,start.target,start.round,()=>.5);
  assert.ok(fast.score>slow.score);assert.notEqual(fast.target,start.target);assert.equal(hitAim(fast,.1,start.target,start.round,()=>.5),fast);
  assert.equal(start.score,0);assert.equal(fast.hits,1);
});
test("expired targets count as misses, wrong cells cannot create negative scores and the deadline stops scoring",()=>{
  const s=createAimGame(()=>.2),expired=stepAim(s,3,()=>.2);assert.equal(expired.misses,2);assert.equal(expired.streak,0);
  const wrong=hitAim(s,.2,(s.target+1)%9,s.round);assert.equal(wrong.score,0);assert.equal(wrong.misses,1);
  const finished=hitAim(s,30,s.target,s.round);assert.equal(finished.phase,"finished");assert.equal(finished.score,0);assert.equal(hitAim(finished,31,s.target,s.round),finished);
});
test("local records preserve the best score, validate stored data and report unavailable storage honestly",()=>{
  const original=Object.getOwnPropertyDescriptor(globalThis,"localStorage"),map=new Map();
  Object.defineProperty(globalThis,"localStorage",{configurable:true,value:{getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)}});
  try{
    const first={score:600,name:"Ana",date:"2026-11-26T22:00:00Z"};assert.equal(saveMiniRecord("memory",first).stored,true);
    saveMiniRecord("memory",{...first,score:100,name:"Luis"});assert.equal(readMiniRecords().memory.name,"Ana");
    map.set("geo_mini_records_v1",JSON.stringify({aim:{...first,score:-1}}));assert.deepEqual(readMiniRecords(),{});
    Object.defineProperty(globalThis,"localStorage",{configurable:true,get(){throw Error("Blocked");}});
    assert.equal(saveMiniRecord("aim",first).stored,false);assert.deepEqual(readMiniRecords(),{});assert.throws(()=>saveMiniRecord("unknown",first));
  }finally{if(original)Object.defineProperty(globalThis,"localStorage",original);else delete globalThis.localStorage;}
});

import test from "node:test";
import assert from "node:assert/strict";
import { CHARACTERS,FREE_CHARACTERS } from "../src/game/characters.js";
import { adjacentGuardian,filterGuardians,guardianStyle,selectGuardian,GUARDIAN_STYLES } from "../src/game/guardianSelection.js";

test("guardian search matches accented names, area and power without changing the roster",()=>{
  assert.equal(filterGuardians().length,12);assert.equal(filterGuardians({catalog:"legacy"}).length,2);
  assert.deepEqual(filterGuardians({query:"agil"}).map(c=>c.id),["agilia"]);
  assert.deepEqual(filterGuardians({query:"rafaga comercial"}).map(c=>c.id),["conectia"]);
  assert.deepEqual(filterGuardians({query:"administracion"}).map(c=>c.id),["ordenia"]);
  assert.equal(filterGuardians({query:"sin coincidencias"}).length,0);
  const grouped=GUARDIAN_STYLES.filter(s=>s.id!=="all").flatMap(s=>filterGuardians({style:s.id}));
  assert.equal(new Set(grouped.map(c=>c.id)).size,12);assert.equal(grouped.length,12);
  assert.equal(guardianStyle(CHARACTERS.find(c=>c.id==="tecnoia")),"movement");
  assert.equal(filterGuardians({style:"protection",query:"recuperacion"})[0].id,"balance");
});
test("preview navigation stays within the visible results and handles empty filters",()=>{
  const rows=filterGuardians({style:"attack"});
  assert.equal(adjacentGuardian(rows,rows[0].id,-1).id,rows.at(-1).id);
  assert.equal(adjacentGuardian(rows,rows.at(-1).id,1).id,rows[0].id);
  assert.equal(adjacentGuardian(rows,"not-visible",1).id,rows[0].id);
  assert.equal(adjacentGuardian([],"tecnoia",1),null);
});
test("selection preserves currency and unlocks, and repeated unlocks never charge twice",()=>{
  const base={coins:730,unlocked:[...FREE_CHARACTERS],selected:"tecnoia"},copy=structuredClone(base);
  const free=selectGuardian(base,"conectia");assert.equal(free.coins,730);assert.equal(free.selected,"conectia");assert.deepEqual(base,copy);
  const paid=selectGuardian(base,"victoria_st");assert.equal(paid.coins,230);assert.ok(paid.unlocked.includes("victoria_st"));
  assert.equal(selectGuardian(paid,"victoria_st").coins,230);
  assert.equal(selectGuardian({...base,coins:499},"victoria_st"),null);
  assert.throws(()=>selectGuardian(base,"unknown"));assert.deepEqual(base,copy);
});

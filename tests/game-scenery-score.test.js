import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { SCENERY, drawScenery, loadScenery, getScenery } from "../src/game/scenery.js";
import { gameScorePayload, normalizePlayerName, validPlayerName, readPlayerName, savePlayerName, rankGameScores, scoreBoardPath } from "../src/game/scoreboard.js";

test("each level has its own compact opaque background and preserved source fingerprint", async () => {
  const manifest = JSON.parse(await fs.readFile("design/scenery/manifest-v1.json"));
  assert.equal(manifest.scenes.length, 3);
  const hashes = new Set();
  for (const scene of manifest.scenes) {
    const source = await fs.readFile(scene.source), bytes = await fs.readFile(scene.output), image = await loadImage(bytes);
    assert.equal(crypto.createHash("sha256").update(source).digest("hex"), scene.sourceSha256);
    assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"), scene.sha256);
    assert.equal(image.width, 1440); assert.equal(image.height, 810); assert.ok(bytes.length < 150000);
    hashes.add(scene.sha256);
    const canvas = createCanvas(32, 18), ctx = canvas.getContext("2d"); ctx.drawImage(image, 0, 0, 32, 18);
    const pixels = ctx.getImageData(0, 0, 32, 18).data;
    for (let i = 3; i < pixels.length; i += 4) assert.equal(pixels[i], 255);
  }
  assert.equal(hashes.size, 3);
});

test("scenery loads only the requested scene, shares requests and recovers after an image failure", async () => {
  const previous = globalThis.Image, requests = []; let fail = false;
  globalThis.Image = class { naturalWidth = 1440; naturalHeight = 810; set src(value) { requests.push(value); queueMicrotask(() => fail ? this.onerror() : this.onload()); } };
  try {
    const a = loadScenery("bosque"), b = loadScenery("bosque"); assert.equal(a, b); await a;
    assert.ok(getScenery("bosque")); assert.deepEqual(requests, [SCENERY.bosque]);
    fail = true; assert.equal(await loadScenery("taller"), null); assert.equal(getScenery("taller"), null);
    fail = false; assert.ok(await loadScenery("taller")); assert.equal(requests.length, 3);
    assert.ok(!requests.includes(SCENERY.faro));
  } finally { if (previous === undefined) delete globalThis.Image; else globalThis.Image = previous; }
});

test("depth layers animate normally, freeze with reduced motion and allow the drawn fallback", async () => {
  const image = await loadImage("public/scenery/bosque-v1.webp"), canvas = createCanvas(960, 540), ctx = canvas.getContext("2d");
  const frame = (tick, reduced) => { ctx.clearRect(0,0,960,540); assert.equal(drawScenery(ctx,image,tick,reduced,960,540), true); return crypto.createHash("sha256").update(ctx.getImageData(0,0,960,540).data).digest("hex"); };
  assert.equal(frame(0,true), frame(600,true)); assert.notEqual(frame(0,false), frame(600,false));
  assert.equal(drawScenery(ctx,null,0,false,960,540), false);
});

test("player names normalize spaces, preserve accents and remain optional browser preferences", () => {
  assert.equal(normalizePlayerName("  Ana\n  Díaz  "), "Ana Díaz");
  assert.equal(validPlayerName(" \t "), false); assert.equal(validPlayerName("A"), false); assert.equal(validPlayerName("ÁD"), true);
  assert.equal(normalizePlayerName("x".repeat(100)).length, 24);
  const previous = Object.getOwnPropertyDescriptor(globalThis,"localStorage");
  Object.defineProperty(globalThis,"localStorage",{configurable:true,get(){throw Error("Blocked");}});
  try { assert.doesNotThrow(()=>savePlayerName("Ana")); assert.equal(readPlayerName(),""); }
  finally { if(previous)Object.defineProperty(globalThis,"localStorage",previous);else delete globalThis.localStorage; }
});

test("level tables stay separate from the existing Arcade records and reject unknown paths", () => {
  assert.equal(scoreBoardPath("arcade"),"leaderboard");
  for(const id of ["bosque","taller","faro"])assert.equal(scoreBoardPath(id),`gameLeaderboards/${id}/entries`);
  assert.throws(()=>scoreBoardPath("../private"));assert.throws(()=>scoreBoardPath("unknown"));
});

test("published results reject malformed values and rank equal scores without inventing a winner", () => {
  const data={name:"  Ana  Díaz ",score:240,date:"2026-11-26T20:00:00Z"};
  assert.deepEqual(gameScorePayload(data),{...data,name:"Ana Díaz"});
  for(const score of [-1,1.5,Infinity,10000001])assert.throws(()=>gameScorePayload({...data,score}));
  assert.throws(()=>gameScorePayload({...data,name:" "}));assert.throws(()=>gameScorePayload({...data,date:"not a date"}));
  const rows=[{id:"b",name:"Luis",score:80,date:"2026-11-26"},{id:"c",name:"Ana",score:120,date:"2026-11-27"},{id:"a",name:"Eva",score:120,date:"2026-11-26"}];
  const copy=structuredClone(rows),ranked=rankGameScores(rows);
  assert.deepEqual(ranked.map(r=>[r.id,r.rank]),[["a",1],["c",1],["b",3]]);assert.deepEqual(rows,copy);
});

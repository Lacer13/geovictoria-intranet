import { normalizePlayerName } from "./scoreboard.js";
import { readPreference } from "../lib/preferences.js";

export function createMemoryGame(pairs, random = Math.random) {
  if (pairs.length < 2 || pairs.length > 8 || new Set(pairs).size !== pairs.length) throw new Error("Invalid memory deck");
  const cards = pairs.flatMap(pair => [0,1].map(copy => ({ id: `${pair}-${copy}`, pair, matched: false })));
  for (let i=cards.length-1;i>0;i--) { const j=Math.min(i,Math.max(0,Math.floor(random()*(i+1)))); [cards[i],cards[j]]=[cards[j],cards[i]]; }
  return { phase: "ready", cards, open: [], moves: 0 };
}
export function flipMemory(state, index) {
  if (state.phase === "won" || !Number.isInteger(index) || !state.cards[index] || state.cards[index].matched || state.open.includes(index) || state.open.length === 2) return state;
  const open=[...state.open,index], next={...state,phase:"playing",open};
  if (open.length===2) {
    next.moves++;
    if(state.cards[open[0]].pair===state.cards[open[1]].pair) {
      next.cards=state.cards.map((card,i)=>open.includes(i)?{...card,matched:true}:card);
      next.open=[]; if(next.cards.every(card=>card.matched))next.phase="won";
    }
  }
  return next;
}
export function settleMemory(state) { return state.open.length===2?{...state,open:[]}:state; }
export function memoryScore(moves, seconds) { return Math.max(50,1000-moves*25-Math.floor(seconds)*3); }

function targetAfter(previous, random) {
  if (previous < 0) return Math.min(8, Math.max(0, Math.floor(random() * 9)));
  const value=Math.min(7,Math.max(0,Math.floor(random()*8)));
  return value>=previous?value+1:value;
}
export function createAimGame(random=Math.random) {
  return {phase:"playing",score:0,hits:0,misses:0,streak:0,target:targetAfter(-1,random),round:1,nextAt:1.2};
}
export function stepAim(state, seconds, random=Math.random) {
  if(state.phase!=="playing")return state;
  if(seconds>=30)return {...state,phase:"finished"};
  if(seconds<state.nextAt)return state;
  const missed=Math.floor((seconds-state.nextAt)/1.2)+1;
  return {...state,misses:state.misses+missed,streak:0,round:state.round+missed,target:targetAfter(state.target,random),nextAt:state.nextAt+missed*1.2};
}
export function hitAim(state,seconds,cell,round,random=Math.random) {
  const current=stepAim(state,seconds,random);
  if(current.phase!=="playing" || current.round!==round || !Number.isInteger(cell) || cell<0 || cell>8)return current;
  if(cell!==current.target)return {...current,score:Math.max(0,current.score-2),misses:current.misses+1,streak:0};
  const streak=current.streak+1;
  const reward=10+Math.round(Math.min(1,Math.max(0,(current.nextAt-seconds)/1.2))*10)+(streak%5===0?5:0);
  return {...current,score:current.score+reward,hits:current.hits+1,streak,round:current.round+1,target:targetAfter(current.target,random),nextAt:seconds+1.2};
}

const recordKey="geo_mini_records_v1";
function validRecord(value) {
  return value && Number.isSafeInteger(value.score) && value.score>=0 && value.score<=1000000 &&
    typeof value.name==="string" && normalizePlayerName(value.name).length>=2 &&
    typeof value.date==="string" && Number.isFinite(Date.parse(value.date));
}
export function readMiniRecords() {
  try {
    const saved=JSON.parse(readPreference(recordKey,"{}")), records={};
    for(const id of ["memory","aim"])if(validRecord(saved?.[id]))records[id]={score:saved[id].score,name:normalizePlayerName(saved[id].name),date:saved[id].date};
    return records;
  } catch { return {}; }
}
export function saveMiniRecord(id, result) {
  if(!["memory","aim"].includes(id) || !validRecord(result))throw new Error("Invalid minigame record");
  const records=readMiniRecords(), best=records[id];
  if(!best || result.score>best.score)records[id]={score:result.score,name:normalizePlayerName(result.name),date:result.date};
  try { localStorage.setItem(recordKey,JSON.stringify(records)); return {best:records[id],stored:true}; }
  catch { return {best:records[id],stored:false}; }
}

import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { createGame } from "../../src/game/simulation.js";
import { loadAssets, CHARACTERS } from "../../src/game/characters.js";
import { drawGame } from "../../src/game/render.js";
import { getScenery, loadScenery } from "../../src/game/scenery.js";
import { SCORE_BOARDS } from "../../src/game/scoreboard.js";
import ScoreSubmitter from "../../src/game/ScoreSubmitter.jsx";
import ScoreBoard from "../../src/game/ScoreBoard.jsx";
import { isLocalDemo } from "../../src/firebase.js";
import "../../src/game/arcade.css";
function Review() {
  const [scene,setScene]=useState("bosque"),[reduced,setReduced]=useState(false),[assets,setAssets]=useState(null),[runId,setRunId]=useState(()=>crypto.randomUUID());
  const canvas=useRef(null);
  useEffect(()=>{loadAssets(()=>{},CHARACTERS.find(c=>c.id==="cierreia")).then(setAssets);},[]);
  useEffect(()=>{void loadScenery(scene);},[scene]);
  useEffect(()=>{
    if(!assets)return;const character=CHARACTERS.find(c=>c.id==="cierreia"),game=createGame("cierreia",{missionId:scene});
    game.enemies.push({x:630,y:160,width:80,height:80,hp:2,pattern:"scout",shot:100,bornAt:0});
    let frame,previous=null;
    const loop=now=>{const delta=previous===null?0:Math.min(.05,(now-previous)/1000);previous=now;if(!reduced)game.tick+=delta*60;drawGame(canvas.current.getContext("2d"),game,assets.images,character,{reduced,animation:assets.animation,scenery:getScenery(scene)});frame=requestAnimationFrame(loop);};
    frame=requestAnimationFrame(loop);return()=>cancelAnimationFrame(frame);
  },[scene,reduced,assets]);
  return <main className="arcade" style={{maxWidth:1100,margin:'auto',padding:20}}>
    <h1 style={{color:'#f4e1af'}}>Revisión local de escenarios y puntajes</h1>
    <label style={{color:'white'}}>Escenario <select value={scene} onChange={e=>{setScene(e.target.value);setRunId(crypto.randomUUID());}}>{SCORE_BOARDS.filter(b=>b.id!=="arcade").map(b=><option key={b.id} value={b.id}>{b.label}</option>)}</select></label>
    <label style={{color:'white',marginLeft:20}}><input type="checkbox" checked={reduced} onChange={e=>setReduced(e.target.checked)}/> Movimiento reducido</label>
    <canvas ref={canvas} width={960} height={540} aria-label="Escenario con guardián y centinela" style={{width:'100%',display:'block',marginTop:20,borderRadius:16}}/>
    {isLocalDemo ? <><p style={{color:'#d7e8dc'}}>Prueba local: solo se guardan datos en el emulador.</p><ScoreSubmitter key={runId} runId={runId} initialName="QA Escenarios" score={240} boardId={scene}/><ScoreBoard boardId={scene} publishedId={runId}/></> : <p style={{color:'white'}}>La publicación de prueba requiere el emulador local.</p>}
  </main>;
}
createRoot(document.getElementById("root")).render(<Review/>);

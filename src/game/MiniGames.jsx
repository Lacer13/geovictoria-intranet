import { useEffect, useRef, useState } from "react";
import { Brain, Crosshair, Pause, Play, RotateCcw, Trophy } from "lucide-react";
import { AREA_CHARACTERS } from "./characters.js";
import { createAimGame, createMemoryGame, flipMemory, hitAim, memoryScore, readMiniRecords, saveMiniRecord, settleMemory, stepAim } from "./miniGames.js";
import { normalizePlayerName, readPlayerName, savePlayerName, validPlayerName } from "./scoreboard.js";
import { useMiniClock, useMiniPause } from "./useMiniClock.js";

const deck=AREA_CHARACTERS.slice(0,6);
const labels={memory:"Memoria de guardianes",aim:"Faro de reflejos"};

function PauseButton({paused,onToggle}) {
  return <button className="arcade-button secondary" onClick={onToggle}>{paused?<Play size={17}/>:<Pause size={17}/>} {paused?"Continuar":"Pausar"}</button>;
}
function Result({score,detail,record,onAgain,onBack}) {
  return <section className="mini-result" role="status">
    <Trophy size={32}/><h2>¡Buen trabajo!</h2><strong>{score.toLocaleString("es-PE")} puntos</strong><p>{detail}</p>
    {record?.best && <p>Récord en este navegador: <b>{record.best.score} pts</b> · {record.best.name}</p>}
    {record && !record.stored && <p>Este navegador no pudo guardar el récord. Tu resultado sigue aquí.</p>}
    <div><button className="arcade-button" onClick={onAgain}><RotateCcw size={17}/> Jugar otra vez</button><button className="arcade-button secondary" onClick={onBack}>Volver a minijuegos</button></div>
  </section>;
}
function Memory({name,onAgain,onBack}) {
  const [game,setGame]=useState(()=>createMemoryGame(deck.map(c=>c.id)));
  const [paused,setPaused]=useMiniPause(game.phase==="playing");
  const clock=useMiniClock(game.phase==="playing"&&!paused);
  const [record,setRecord]=useState(null),saved=useRef(false);
  useEffect(()=>{
    if(game.open.length!==2 || paused)return;
    const timer=setTimeout(()=>setGame(settleMemory),900);
    return()=>clearTimeout(timer);
  },[game.open,paused]);
  useEffect(()=>{
    if(game.phase!=="won" || saved.current)return;
    saved.current=true;
    setRecord(saveMiniRecord("memory",{name,score:memoryScore(game.moves,clock.read()),date:new Date().toISOString()}));
  },[game.phase,game.moves,name,clock.read]);
  if(game.phase==="won")return <Result score={memoryScore(game.moves,clock.read())} detail={`${game.moves} intentos · ${Math.floor(clock.read())} segundos`} record={record} onAgain={onAgain} onBack={onBack}/>;
  return <section className="mini-playing" aria-label="Partida de memoria">
    <div className="mini-hud"><strong>{name}</strong><span>{game.cards.filter(c=>c.matched).length/2}/6 parejas · {game.moves} intentos · {Math.floor(clock.seconds)} s</span><PauseButton paused={paused} onToggle={()=>setPaused(v=>!v)}/></div>
    <p className="mini-instruction">Encuentra las seis parejas. El tiempo empieza al descubrir la primera carta.</p>
    {paused?<div className="mini-pause" role="status">En pausa. Pulsa Continuar cuando estés listo.</div>:<div className="mini-memory-grid">
      {game.cards.map((card,i)=>{
        const face=card.matched||game.open.includes(i),character=deck.find(c=>c.id===card.pair);
        return <button key={card.id} className={`mini-memory-card ${face?"is-open":""} ${card.matched?"is-matched":""}`} disabled={card.matched||game.open.length===2}
          aria-label={face?`${character.name}${card.matched?", pareja encontrada":""}`:`Descubrir carta ${i+1}`} onClick={()=>setGame(s=>flipMemory(s,i))}>
          {face?<><img src={character.thumbnail} alt=""/><span>{character.name}</span></>:<span aria-hidden="true">?</span>}
        </button>;
      })}
    </div>}
    <button className="arcade-text-button" onClick={onBack}>Salir de este intento</button>
  </section>;
}
function Aim({name,onAgain,onBack}) {
  const [game,setGame]=useState(createAimGame);
  const [paused,setPaused]=useMiniPause(game.phase==="playing");
  const clock=useMiniClock(game.phase==="playing"&&!paused);
  const [record,setRecord]=useState(null),saved=useRef(false);
  useEffect(()=>{if(!paused)setGame(s=>stepAim(s,clock.seconds));},[clock.seconds,paused]);
  useEffect(()=>{
    if(paused||game.phase!=="playing")return;
    const key=event=>{if(!event.repeat&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&/^[1-9]$/.test(event.key)){event.preventDefault();setGame(s=>hitAim(s,clock.read(),Number(event.key)-1,s.round));}};
    window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key);
  },[paused,game.phase,clock.read]);
  useEffect(()=>{
    if(game.phase!=="finished"||saved.current)return;
    saved.current=true;setRecord(saveMiniRecord("aim",{name,score:game.score,date:new Date().toISOString()}));
  },[game.phase,game.score,name]);
  if(game.phase==="finished")return <Result score={game.score} detail={`${game.hits} aciertos · ${game.misses} fallos · 30 segundos de juego`} record={record} onAgain={onAgain} onBack={onBack}/>;
  return <section className="mini-playing" aria-label="Partida de reflejos">
    <div className="mini-hud"><strong>{name}</strong><span>{Math.max(0,30-Math.floor(clock.seconds))} s · {game.score} puntos · Racha {game.streak}</span><PauseButton paused={paused} onToggle={()=>setPaused(v=>!v)}/></div>
    <p className="mini-instruction">Pulsa el faro encendido o usa las teclas 1 a 9. Acertar rápido suma más; pulsar uno apagado resta 2 puntos.</p>
    {paused?<div className="mini-pause" role="status">En pausa. Pulsa Continuar cuando estés listo.</div>:<div className="mini-aim-grid">{Array.from({length:9},(_,i)=><button key={i} className={game.target===i?"is-lit":""} aria-label={`Faro ${i+1}${game.target===i?" encendido":" apagado"}`} onClick={()=>setGame(s=>hitAim(s,clock.read(),i,game.round))}><small>{i+1}</small><Crosshair size={34}/><span>{game.target===i?"¡Ahora!":""}</span></button>)}</div>}
    <button className="arcade-text-button" onClick={onBack}>Salir de este intento</button>
  </section>;
}

export default function MiniGames() {
  const [selected,setSelected]=useState(null),[playing,setPlaying]=useState(false),[attempt,setAttempt]=useState(0);
  const [name,setName]=useState(readPlayerName),[error,setError]=useState(false);
  const nameInput=useRef(null),records=readMiniRecords();
  const start=()=>{
    if(!validPlayerName(name)){setError(true);nameInput.current?.focus();return;}
    const normalized=normalizePlayerName(name);setName(normalized);savePlayerName(normalized);setAttempt(n=>n+1);setPlaying(true);setError(false);
  };
  const back=()=>{setPlaying(false);setSelected(null);};
  if(playing)return <div className="arcade mini-games"><h1>{labels[selected]}</h1>{selected==="memory"?<Memory key={attempt} name={name} onAgain={start} onBack={back}/>:<Aim key={attempt} name={name} onAgain={start} onBack={back}/>}</div>;
  return <section className="arcade mini-games">
    <span className="arcade-eyebrow">Un descanso, otro reto</span><h1>Elige tu minijuego</h1><p className="mini-instruction">Partidas cortas, controles sencillos y récords guardados en este navegador.</p>
    <div className="arcade-player-field mini-player"><label htmlFor="mini-name">Tu nombre o alias</label><input id="mini-name" ref={nameInput} value={name} maxLength={24} autoComplete="nickname" placeholder="Por ejemplo, Ana" aria-invalid={error} onChange={e=>{setName(e.target.value);setError(false);}}/>{error&&<p role="alert">Escribe al menos dos caracteres.</p>}</div>
    <div className="mini-selection">{["memory","aim"].map(id=><button key={id} className={selected===id?"is-selected":""} aria-pressed={selected===id} onClick={()=>setSelected(id)}>
      {id==="memory"?<Brain size={35}/>:<Crosshair size={35}/>}<strong>{labels[id]}</strong><span>{id==="memory"?"Encuentra seis parejas de guardianes a tu ritmo.":"Acumula aciertos y rachas durante 30 segundos."}</span>
      <small>{records[id]?`Récord: ${records[id].score} pts · ${records[id].name}`:"Tu primer récord te espera"}</small>
    </button>)}</div>
    {selected&&<div className="mini-start"><p>{selected==="memory"?"Abre dos cartas por intento. Menos intentos y menos tiempo dan más puntos.":"Toca el faro encendido o usa las teclas 1 a 9."} Puedes pausar; al cambiar de pestaña se pausa automáticamente.</p><button className="arcade-button" onClick={start}><Play size={18}/> Empezar {labels[selected]}</button></div>}
    <p className="arcade-ranking-note">Estos récords son locales. Las clasificaciones compartidas de niveles y Arcade están en Aventura individual.</p>
  </section>;
}

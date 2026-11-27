import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Brain, Crosshair, Gamepad2, Trophy, Users } from "lucide-react";
import ActiveBreak from "./ActiveBreak";
import ArenaOnline from "../game/ArenaOnline.jsx";
import MiniGames from "../game/MiniGames.jsx";
import ScoreBoard from "../game/ScoreBoard.jsx";
import { gameViewFromHash } from "../game/gameNavigation.js";
import "../game/gameHub.css";
import "../game/sessionLayout.css";
import "../game/resultLayout.css";

const games = [
  { id:"aventura", title:"Operación Estrella", tag:"Aventura · 3 niveles", time:"2–4 min por nivel", text:"Rescata regalos, repara el taller y acompaña al núcleo. Cada jefe tiene su estrategia.", image:"/scenery/bosque-preview.webp", action:"Elegir nivel" },
  { id:"arcade", title:"Arcade rápido", tag:"Acción", time:"A tu ritmo", text:"Esquiva, dispara y supera tu mejor partida.", icon:Gamepad2, action:"Preparar partida" },
  { id:"memoria", title:"Memoria de guardianes", tag:"Memoria", time:"Sin límite de tiempo", text:"Descubre las seis parejas con menos intentos.", icon:Brain, action:"Jugar memoria" },
  { id:"reflejos", title:"Faro de reflejos", tag:"Reflejos", time:"30 segundos", text:"Toca el faro encendido y encadena aciertos.", icon:Crosshair, action:"Jugar reflejos" },
  { id:"arena", title:"Arena · 1 contra 1", tag:"Con otra persona", time:"Sala privada", text:"Invita con un código y compitan desde sus dispositivos.", icon:Users, action:"Crear o unirme" },
];
export default function GamePage() {
  const route = useLocation();
  const [view,setView]=useState(()=>gameViewFromHash(location.hash));
  useEffect(()=>setView(gameViewFromHash(route.hash)),[route.hash]);
  useEffect(()=>{const change=()=>setView(gameViewFromHash(location.hash));window.addEventListener("hashchange",change);return()=>window.removeEventListener("hashchange",change);},[]);
  const mini=["minijuegos","memoria","reflejos"].includes(view);
  return <div className="game-page game-hub-page">
    <header className="game-page-header game-hub-header"><Link to="/" className="game-hub-back"><ArrowLeft size={17}/> Portal</Link><nav className="game-mode-tabs" aria-label="Pausa activa"><a href="#juegos" aria-current={view==="juegos"?"page":undefined}><Gamepad2 size={17}/> Juegos</a><a href="#clasificaciones" aria-current={view==="clasificaciones"?"page":undefined}><Trophy size={17}/> Clasificaciones</a></nav><span className="game-hub-brand">VictorIA · Pausa activa</span></header>
    <div className="game-page-content"><div className="game-stage">
      {view==="juegos" ? <section className="game-hub" aria-labelledby="game-hub-title">
        <div className="game-hub-intro"><span>UN MOMENTO PARA TI</span><h1 id="game-hub-title">Tu próxima <em>buena pausa.</em></h1><p>Elige un reto, juega unos minutos y comparte tu mejor partida con el equipo.</p></div>
        <div className="game-hub-layout"><div className="game-hub-cards">{games.map(({id,title,tag,time,text,image,icon:Icon,action})=><article key={id} className={`game-hub-card game-card-${id}`}>
          {image?<img src={image} alt=""/>:<div className="game-card-symbol" aria-hidden="true"><Icon size={35}/></div>}
          <div className="game-card-copy"><span className="game-card-tag">{tag}</span><h2>{title}</h2><p>{text}</p><div className="game-card-bottom"><small>{time}</small><a href={`#${id}`}>{action} <ArrowUpRight size={16}/></a></div></div>
        </article>)}</div><aside className="game-hub-community"><ScoreBoard compact selectable/><p>Una tabla para cada reto. En Arena, el marcador y el ganador se ven dentro de la sala.</p></aside></div>
      </section> : <>
        <a href="#juegos" className="game-hub-return"><ArrowLeft size={16}/> Elegir otro juego</a>
        {view==="clasificaciones" ? <section className="game-hub-rankings"><span className="arcade-eyebrow">Cada partida cuenta</span><h1>Así juega el equipo</h1><p>Elige el juego o nivel. Cada tabla tiene sus propios puntos y sus mejores partidas.</p><ScoreBoard selectable/><p className="game-hub-arena-note">Arena 1 contra 1 muestra el marcador y el ganador en cada sala; todavía no tiene una clasificación histórica.</p></section>
        : view==="arena" ? <ArenaOnline/> : mini ? <MiniGames key={view} initialSelected={view==="memoria"?"memory":view==="reflejos"?"aim":null}/> : <ActiveBreak key={view} initialAdventure={view!=="arcade"}/>}
      </>}
    </div></div>
  </div>;
}

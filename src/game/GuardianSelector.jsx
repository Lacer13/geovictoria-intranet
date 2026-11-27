import { useEffect, useRef, useState } from "react";
import { Archive, Check, ChevronLeft, ChevronRight, Clock3, LockKeyhole, Search, Sparkles } from "lucide-react";
import { CHARACTERS } from "./characters.js";
import { powerForCharacter } from "./powers.js";
import CharacterPreview from "./CharacterPreview.jsx";
import { adjacentGuardian, filterGuardians, guardianStyle, GUARDIAN_STYLES } from "./guardianSelection.js";
import "./guardianSelector.css";

const poses=[["idle","Reposo"],["moving","Volando"],["shooting","Disparando"],["power","Usando su poder"],["victory","Celebrando"],["damage","Recibiendo un impacto"],["defeat","Descansando"]];
export default function GuardianSelector({profile,onChoose,assets,progress,reduced,onRetry}) {
  const [catalog,setCatalog]=useState(()=>CHARACTERS.find(c=>c.id===profile.selected)?.type==="rig"?"areas":"legacy");
  const [query,setQuery]=useState(""),[style,setStyle]=useState("all"),[previewId,setPreviewId]=useState(profile.selected),[pose,setPose]=useState("idle");
  const detailTitle=useRef(null),detailPanel=useRef(null),catalogTitle=useRef(null);
  useEffect(()=>{setPreviewId(profile.selected);setPose("idle");},[profile.selected]);
  const character=CHARACTERS.find(c=>c.id===previewId)||CHARACTERS[0],power=powerForCharacter(character.id);
  const unlocked=profile.unlocked.includes(character.id),selected=profile.selected===character.id,ready=assets?.characterId===character.id;
  const characters=filterGuardians({catalog,query,style}),role=GUARDIAN_STYLES.find(s=>s.id===guardianStyle(character));
  const reveal=(ref,target=ref)=>requestAnimationFrame(()=>{ref.current?.focus({preventScroll:true});target.current?.scrollIntoView({behavior:reduced?"auto":"smooth",block:"start"});});
  const preview=(item,showDetail=false)=>{if(!item)return;setPreviewId(item.id);setPose("idle");if(profile.unlocked.includes(item.id))onChoose(item);if(showDetail&&window.matchMedia("(max-width:650px)").matches)reveal(detailTitle,detailPanel);};
  const changeCatalog=value=>{setCatalog(value);setQuery("");setStyle("all");};
  return <section className="guardian-selector" aria-label="Elegir guardián">
    <aside ref={detailPanel} className="guardian-detail" style={{"--guardian-accent":character.accent||"#e8d7a1"}} aria-label={`Ficha de ${character.name}`}>
      <div className="guardian-detail-top"><span>{unlocked?"Conoce a tu guardián":"Vista previa · bloqueado"}</span><div><button aria-label="Guardián anterior" disabled={!characters.length} onClick={()=>preview(adjacentGuardian(characters,previewId,-1))}><ChevronLeft size={19}/></button><button aria-label="Guardián siguiente" disabled={!characters.length} onClick={()=>preview(adjacentGuardian(characters,previewId,1))}><ChevronRight size={19}/></button></div></div>
      <div className="guardian-stage">
        {ready&&unlocked?<CharacterPreview character={character} image={assets.images[character.src]} sprite={assets.images[character.sprite]} animation={assets.animation} pose={pose==="power"&&power.id==="dash"?"dash":pose} reduced={reduced}/>:character.thumbnail?<img src={character.thumbnail} alt={`${character.name}, guardián de ${character.area}`}/>:<div className="guardian-locked-art" aria-hidden="true">{unlocked?<Archive size={65}/>:<LockKeyhole size={65}/>}</div>}
      </div>
      <div className="guardian-identity"><span className="guardian-style-tag">{role.label}</span><h2 ref={detailTitle} tabIndex={-1}>{character.name}</h2><p>{character.area}</p><span className="guardian-chosen" role="status">{selected?<><Check size={15}/> Elegido para tu partida</>:unlocked?"Disponible":"Todavía no está elegido"}</span></div>
      <div className="guardian-power"><span><Sparkles size={15}/> Su poder</span><h3>{power.name}</h3><p>{power.description}</p><small><Clock3 size={14}/> Recarga cada {power.cooldown/60} s · Shift o botón Poder</small></div>
      {unlocked?<div className="guardian-animation"><label>Ver en acción<select aria-label="Movimiento del guardián" value={pose} onChange={e=>setPose(e.target.value)} disabled={!ready}>{poses.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label><button disabled={!ready} aria-pressed={pose==="power"} onClick={()=>setPose(p=>p==="power"?"idle":"power")}>Ver poder</button>{!ready&&<small role="status">Preparando animación… {Math.round(progress*100)}%</small>}</div>:<div className="guardian-unlock"><p>La vista previa no gasta Data. Tu elección sigue siendo {CHARACTERS.find(c=>c.id===profile.selected)?.name}.</p><button className="arcade-button" disabled={profile.coins<character.cost} onClick={()=>onChoose(character)}>Desbloquear por {character.cost} Data</button>{profile.coins<character.cost&&<small>Te faltan {character.cost-profile.coins} Data. Los ganas al jugar.</small>}</div>}
      <button className="guardian-back-to-cards" onClick={()=>reveal(catalogTitle)}>Volver a la colección ↓</button>
    </aside>
    <div className="guardian-catalog">
      <div className="guardian-catalog-heading"><h2 ref={catalogTitle} tabIndex={-1}>Tu equipo de guardianes</h2><span>{profile.coins.toLocaleString("es-PE")} Data <small>en este dispositivo</small></span></div>
      <div className="guardian-catalog-tabs" role="group" aria-label="Colección de guardianes"><button aria-pressed={catalog==="areas"} onClick={()=>changeCatalog("areas")}>Áreas · 12</button><button aria-pressed={catalog==="legacy"} onClick={()=>changeCatalog("legacy")}>Clásicos · 2</button></div>
      <label className="guardian-search"><Search size={18}/><input type="search" aria-label="Buscar guardián, área o poder" placeholder="Nombre, área o poder" value={query} onChange={e=>setQuery(e.target.value)}/></label>
      {catalog==="areas"&&<div className="guardian-style-filters" role="group" aria-label="Estilo de juego">{GUARDIAN_STYLES.map(s=><button key={s.id} aria-pressed={style===s.id} onClick={()=>setStyle(s.id)}>{s.label}</button>)}</div>}
      <p className="guardian-list-help" role="status">{characters.length} {characters.length===1?"guardián":"guardianes"} · Toca una tarjeta para ver su poder.</p>
      <div className="guardian-grid" aria-label="Guardianes disponibles">{characters.map(item=>{
        const chosen=profile.selected===item.id,available=profile.unlocked.includes(item.id),power=powerForCharacter(item.id);
        return <button key={item.id} className={`guardian-card ${chosen?"is-selected":""} ${previewId===item.id&&!chosen?"is-previewed":""}`} aria-pressed={chosen} aria-label={`${item.name} · ${item.area} · ${power.name}${available?"":` · Bloqueado, ${item.cost} Data`}`} onClick={()=>preview(item,true)} style={{"--guardian-accent":item.accent||"#e8d7a1"}}>
          <span className="guardian-card-check" aria-hidden="true">{chosen?<Check size={14}/>:!available?<LockKeyhole size={13}/>:null}</span>
          {item.thumbnail?<img src={item.thumbnail} alt="" loading="lazy" decoding="async"/>:<Archive size={42} className="guardian-classic-icon"/>}
          <span className="guardian-card-copy"><strong>{item.name}</strong><span className="guardian-card-area">{item.area}</span><small>{power.name}</small>{!available&&<span className="guardian-card-cost">{item.cost} Data</span>}</span>
        </button>;
      })}</div>
      {!characters.length&&<div className="guardian-empty"><Search size={25}/><h3>No encontramos guardianes</h3><p>Prueba otro nombre, área o poder, o quita los filtros.</p><button onClick={()=>{setQuery("");setStyle("all");}}>Limpiar búsqueda y filtros</button></div>}
      {ready&&unlocked&&assets.failed.length>0&&<p className="guardian-list-help" role="status">Alguna imagen no cargó; mostramos el diseño de respaldo. <button className="arcade-text-button" onClick={onRetry}>Reintentar animación</button></p>}
      <p className="guardian-list-help">Los 12 guardianes por área están disponibles desde el inicio. Tu elección se recuerda en este navegador.</p>
    </div>
  </section>;
}

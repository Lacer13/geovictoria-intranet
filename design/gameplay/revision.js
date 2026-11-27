import { createGame, emptyInput, stepGame } from "../../src/game/simulation.js";
import { loadAssets, AREA_CHARACTERS } from "../../src/game/characters.js";
import { getScenery, loadScenery } from "../../src/game/scenery.js";
import { drawGame } from "../../src/game/render.js";
import { BOSSES } from "../../src/game/bosses.js";
import { missionById } from "../../src/game/missions.js";

const canvas=document.querySelector("canvas"),ctx=canvas.getContext("2d"),mission=document.getElementById("mission"),view=document.getElementById("view"),pause=document.getElementById("pause");
const character=AREA_CHARACTERS.find(c=>c.id==="cierreia"),assets=await loadAssets(()=>{},character);
let game,previous=null,accumulator=0,playing=true;
function reset(){
  const m=missionById(mission.value);void loadScenery(m.id);game=createGame(character.id,{missionId:m.id});game.player.shield=100000;
  if(view.value!=="objective"){
    game.bossSpawned=true;const ratio=view.value==="half" ? 0.45 : view.value==="final" ? 0.25 : 1;
    game.boss={x:730,y:150,width:160,height:160,hp:Math.ceil(m.bossHp*ratio),maxHp:m.bossHp,dy:.8,shot:32,bornAt:0,kind:m.id,name:BOSSES[m.id].name};
    document.getElementById("description").textContent=BOSSES[m.id].name+" · "+BOSSES[m.id].hint;
  }else{
    game.tick=m.id==="taller"?1000:600;
    if(m.id==="faro"){game.missionProgress.escort.progress=2000;game.player.x=190;}
    document.getElementById("description").textContent=m.description;
  }
  previous=null;accumulator=0;
}
mission.onchange=reset;view.onchange=reset;pause.onclick=()=>{playing=!playing;previous=null;pause.textContent=playing?"Pausar":"Continuar";};
reset();
function frame(now){
  if(playing){if(previous!==null)accumulator+=Math.min(100,now-previous);while(accumulator>=1000/60){stepGame(game,emptyInput(),{random:()=>.6});game.events=[];accumulator-=1000/60;}}
  previous=now;drawGame(ctx,game,assets.images,character,{animation:assets.animation,scenery:getScenery(mission.value)});requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

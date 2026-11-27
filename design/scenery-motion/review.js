import {drawScenery,loadScenery,getScenery} from "../../src/game/scenery.js";
const canvas=document.querySelector("canvas"),ctx=canvas.getContext("2d"),scene=document.getElementById("scene"),reduced=document.getElementById("reduced"),pause=document.getElementById("pause");
let tick=0,previous=null,playing=true;
scene.onchange=()=>{tick=0;void loadScenery(scene.value);};
pause.onclick=()=>{playing=!playing;previous=null;pause.textContent=playing?"Pausar":"Continuar";};
void loadScenery(scene.value);
function frame(now){if(playing&&previous!==null&&!document.hidden)tick+=Math.min(100,now-previous)*.06;previous=now;drawScenery(ctx,getScenery(scene.value),tick,reduced.checked,960,540,scene.value);requestAnimationFrame(frame);}
requestAnimationFrame(frame);

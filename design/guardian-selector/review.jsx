import React,{useEffect,useState} from "react";
import{createRoot}from"react-dom/client";
import GuardianSelector from "../../src/game/GuardianSelector.jsx";
import{CHARACTERS,FREE_CHARACTERS,loadAssets}from"../../src/game/characters.js";
import{selectGuardian}from"../../src/game/guardianSelection.js";
import"../../src/game/arcade.css";
function Review(){const[profile,setProfile]=useState({coins:730,unlocked:FREE_CHARACTERS,selected:"tecnoia"}),[assets,setAssets]=useState(null),[progress,setProgress]=useState(0),[retry,setRetry]=useState(0);
useEffect(()=>{let active=true;setAssets(null);setProgress(0);loadAssets(p=>{if(active)setProgress(p)},CHARACTERS.find(c=>c.id===profile.selected),{retry:retry>0}).then(a=>{if(active)setAssets(a)});return()=>{active=false}},[profile.selected,retry]);
return <div className="arcade arcade-setup"><GuardianSelector profile={profile} onChoose={c=>setProfile(p=>selectGuardian(p,c.id)||p)} assets={assets} progress={progress} reduced={false} onRetry={()=>setRetry(n=>n+1)}/></div>}
createRoot(document.getElementById("review")).render(<Review/>);

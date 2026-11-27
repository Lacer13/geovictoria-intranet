import { CHARACTERS } from "./characters.js";
import { powerForCharacter } from "./powers.js";

export const GUARDIAN_STYLES = [
  { id:"all", label:"Todos" }, { id:"attack", label:"Ataque" },
  { id:"protection", label:"Protección" }, { id:"support", label:"Apoyo" }, { id:"movement", label:"Movimiento" },
];
const styleByPower = {dash:"movement",barrier:"protection",recover:"protection",reflect:"protection",calm:"protection",slow:"support",magnet:"support",burst:"attack",closing:"attack",pulse:"attack",pierce:"attack",radar:"attack"};
export const guardianStyle = character => styleByPower[powerForCharacter(character.id).id];
const normalize = text => String(text).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
export function filterGuardians({catalog="areas",query="",style="all"}={}) {
  const terms=normalize(query).split(/\s+/).filter(Boolean);
  return CHARACTERS.filter(c=>(catalog==="legacy"?c.type!=="rig":c.type==="rig") &&
    (style==="all"||guardianStyle(c)===style) && terms.every(term=>normalize(`${c.name} ${c.area} ${powerForCharacter(c.id).name}`).includes(term)));
}
export function adjacentGuardian(characters,id,direction) {
  if(!characters.length)return null;
  const index=characters.findIndex(c=>c.id===id);
  if(index<0)return characters[direction<0?characters.length-1:0];
  return characters[(index+(direction<0?-1:1)+characters.length)%characters.length];
}
export function selectGuardian(profile,id) {
  const item=CHARACTERS.find(c=>c.id===id);
  if(!item)throw new Error("Guardián desconocido");
  const unlocked=profile.unlocked.includes(id);
  if(!unlocked&&profile.coins<item.cost)return null;
  return {...profile,coins:profile.coins-(unlocked?0:item.cost),unlocked:[...new Set([...profile.unlocked,id])],selected:id};
}

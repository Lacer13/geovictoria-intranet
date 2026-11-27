import { useCallback, useEffect, useRef, useState } from "react";

export function useMiniClock(active) {
  const clock=useRef({seconds:0,last:null,published:0});
  const [seconds,setSeconds]=useState(0);
  useEffect(()=>{
    clock.current.last=null;
    if(!active)return;
    let frame;
    const step=now=>{
      const c=clock.current;
      if(!document.hidden){
        if(c.last!==null)c.seconds+=Math.max(0,(now-c.last)/1000);
        c.last=now;
        if(c.seconds-c.published>=.05){c.published=c.seconds;setSeconds(c.seconds);}
      }else c.last=null;
      frame=requestAnimationFrame(step);
    };
    frame=requestAnimationFrame(step);
    return()=>{cancelAnimationFrame(frame);clock.current.last=null;};
  },[active]);
  const read=useCallback(()=>clock.current.seconds,[]);
  return {seconds,read};
}
export function useMiniPause(playing) {
  const [paused,setPaused]=useState(false);
  useEffect(()=>{
    if(!playing)return;
    const hide=()=>{if(document.hidden)setPaused(true);};
    document.addEventListener("visibilitychange",hide);
    return()=>document.removeEventListener("visibilitychange",hide);
  },[playing]);
  return [paused,setPaused];
}

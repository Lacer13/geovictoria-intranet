import { useEffect } from "react";
import { emptyInput } from "./simulation.js";

const KEY_ACTIONS = {
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
  Space: "fire",
};

export function clearInput(input) {
  Object.assign(input.current, emptyInput());
}

export function useGameInput(input, mode, onPause, onResume) {
  useEffect(() => {
    const held = new Set();
    const update = () => {
      for (const action of Object.values(KEY_ACTIONS))
        input.current[action] = [...held].some(
          (code) => KEY_ACTIONS[code] === action,
        );
    };
    const keydown = (event) => {
      if (
        event.target instanceof HTMLElement &&
        event.target.closest("input, textarea, select, [contenteditable=true]")
      )
        return;
      if (event.code === "Escape" && !event.repeat) {
        if (mode === "playing") {
          event.preventDefault();
          clearInput(input);
          onPause("manual");
        } else if (mode === "paused") {
          event.preventDefault();
          onResume();
        }
        return;
      }
      if (mode !== "playing") return;
      if (KEY_ACTIONS[event.code]) {
        event.preventDefault();
        held.add(event.code);
        update();
      }
      if (
        (event.code === "ShiftLeft" || event.code === "ShiftRight") &&
        !event.repeat
      ) {
        event.preventDefault();
        input.current.power = true;
      }
    };
    const keyup = (event) => {
      held.delete(event.code);
      update();
    };
    const pause = () => {
      held.clear();
      clearInput(input);
      if (mode === "playing") onPause("focus");
    };
    const visibility = () => {
      if (document.hidden) pause();
    };
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    window.addEventListener("blur", pause);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      held.clear();
      clearInput(input);
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", pause);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [input, mode, onPause, onResume]);
}

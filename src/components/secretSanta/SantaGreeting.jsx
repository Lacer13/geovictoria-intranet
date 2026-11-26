import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import {
  chooseGreetingCharacter,
  GREETING_DURATION,
} from "../../lib/santaGreeting";
import { drawGreetingScene } from "./greetingScene";
import "../../santa-greeting.css";

function chooseVisitorCharacter() {
  let previous = "";
  try {
    previous = sessionStorage.getItem("geoSantaGreetingCharacter") || "";
  } catch {
    /* Decoration also works without storage. */
  }
  return chooseGreetingCharacter(previous);
}

export default function SantaGreeting() {
  const [character] = useState(chooseVisitorCharacter);
  const [image, setImage] = useState(null);
  const [failed, setFailed] = useState(false);
  const [mode, setMode] = useState("playing");
  const [quiet, setQuiet] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [visible, setVisible] = useState(true);
  const [foreground, setForeground] = useState(() => !document.hidden);
  const [replay, setReplay] = useState(0);
  const container = useRef(null),
    canvas = useRef(null),
    elapsed = useRef(0);

  useEffect(() => {
    // Remember only the committed choice. React may invoke state initializers
    // twice in development; they must not advance the visitor's stored choice.
    try {
      sessionStorage.setItem("geoSantaGreetingCharacter", character.id);
    } catch {
      /* No invitation data is stored; disabled storage remains supported. */
    }
  }, [character]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const shell = container.current?.closest(".app-shell");
    const update = () =>
      setQuiet(media.matches || !!shell?.classList.contains("atmosphere-off"));
    const visibility = () => setForeground(!document.hidden);
    const observer = new MutationObserver(update);
    if (shell)
      observer.observe(shell, { attributes: true, attributeFilter: ["class"] });
    media.addEventListener("change", update);
    document.addEventListener("visibilitychange", visibility);
    update();
    const intersection = new IntersectionObserver(
      (entries) => setVisible(entries[0]?.isIntersecting ?? true),
      { threshold: 0.05 },
    );
    if (container.current) intersection.observe(container.current);
    return () => {
      observer.disconnect();
      intersection.disconnect();
      media.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const picture = new Image();
    const timeout = setTimeout(() => {
      if (active) setFailed(true);
    }, 8000);
    picture.onload = () => {
      clearTimeout(timeout);
      if (!active) return;
      if (picture.naturalWidth !== 512 || picture.naturalHeight !== 256)
        setFailed(true);
      else setImage(picture);
    };
    picture.onerror = () => {
      clearTimeout(timeout);
      if (active) setFailed(true);
    };
    picture.src = character.atlas;
    return () => {
      active = false;
      clearTimeout(timeout);
      picture.onload = null;
      picture.onerror = null;
    };
  }, [character]);

  useEffect(() => {
    if (!image || failed) return;
    let ctx;
    try {
      ctx = canvas.current?.getContext("2d");
    } catch {
      setFailed(true);
      return;
    }
    if (!ctx) {
      setFailed(true);
      return;
    }
    let frame = 0,
      previous = null,
      lastPaint = -Infinity,
      alive = true;
    if (quiet) {
      elapsed.current = GREETING_DURATION;
      setMode("finished");
    }
    const paint = () => {
      try {
        drawGreetingScene(ctx, image, character, elapsed.current);
        return true;
      } catch {
        if (alive) setFailed(true);
        return false;
      }
    };
    if (!paint()) return;
    if (mode !== "playing" || quiet || !visible || !foreground) return;
    const tick = (time) => {
      if (!alive) return;
      if (previous !== null)
        elapsed.current = Math.min(
          GREETING_DURATION,
          elapsed.current + Math.min(0.08, (time - previous) / 1000),
        );
      previous = time;
      if (
        time - lastPaint >= 1000 / 30 ||
        elapsed.current >= GREETING_DURATION
      ) {
        if (!paint()) return;
        lastPaint = time;
      }
      if (elapsed.current >= GREETING_DURATION) {
        setMode("finished");
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
    };
  }, [image, failed, character, mode, quiet, visible, foreground, replay]);

  return (
    <div
      className="santa-greeting"
      ref={container}
      data-character={character.id}
      data-playback={quiet ? "quiet" : mode}
    >
      {failed ? (
        <div className="santa-greeting-fallback">
          <img
            src={character.fallback}
            alt={character.name}
            width="160"
            height="150"
            onError={(event) => {
              event.currentTarget.hidden = true;
            }}
          />
          <span>¡Felices fiestas!</span>
        </div>
      ) : (
        <canvas
          ref={canvas}
          width="1000"
          height="420"
          role="img"
          aria-label={`${character.name} decora un árbol de Navidad y te saluda junto a un reno.`}
        />
      )}
      <div className="santa-greeting-caption">
        <span>
          <i style={{ background: character.accent }} aria-hidden="true" />
          <strong>{character.name}</strong> te saluda.
        </span>
        {!failed &&
          (quiet ? (
            <small>Saludo sin movimiento</small>
          ) : (
            <button
              type="button"
              className="text-link"
              disabled={!image}
              onClick={() => {
                if (mode === "finished") {
                  elapsed.current = 0;
                  setReplay((value) => value + 1);
                  setMode("playing");
                } else
                  setMode((value) =>
                    value === "playing" ? "paused" : "playing",
                  );
              }}
            >
              {mode === "finished" ? (
                <RotateCcw size={14} />
              ) : mode === "playing" ? (
                <Pause size={14} />
              ) : (
                <Play size={14} />
              )}
              {!image
                ? "Preparando saludo…"
                : mode === "finished"
                  ? "Repetir saludo"
                  : mode === "playing"
                    ? "Pausar saludo"
                    : "Continuar saludo"}
            </button>
          ))}
      </div>
    </div>
  );
}

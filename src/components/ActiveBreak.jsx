import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  Heart,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  Shield,
  Trophy,
  Volume2,
  Zap,
} from "lucide-react";
import { CHARACTERS, loadAssets } from "../game/characters.js";
import {
  createClock,
  createGame,
  emptyInput,
  gameSummary,
  HEIGHT,
  stepGame,
  WIDTH,
} from "../game/simulation.js";
import { clearInput, useGameInput } from "../game/input.js";
import { drawGame } from "../game/render.js";
import { createGameAudio } from "../game/audio.js";
import {
  readGameProfile,
  readGameSettings,
  saveGameProfile,
} from "../game/profile.js";
import { savePreference } from "../lib/preferences.js";
import CharacterPreview from "../game/CharacterPreview.jsx";
import ScoreSubmitter from "../game/ScoreSubmitter.jsx";
import TouchControls from "../game/TouchControls.jsx";
import "../game/arcade.css";

function Settings({ settings, onChange }) {
  return (
    <fieldset className="arcade-settings">
      <legend>
        <Settings2 size={18} /> A tu manera
      </legend>
      <label className="arcade-volume">
        <Volume2 size={18} /> Sonidos{" "}
        <input
          aria-label="Volumen de los sonidos"
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={settings.volume}
          onChange={(e) => onChange({ volume: Number(e.target.value) })}
        />
        <output>{Math.round(settings.volume * 100)}%</output>
      </label>
      <label>
        <input
          type="checkbox"
          checked={settings.autoFire}
          onChange={(e) => onChange({ autoFire: e.target.checked })}
        />{" "}
        Disparo asistido continuo
      </label>
      <label>
        <input
          type="checkbox"
          checked={settings.reduced}
          onChange={(e) => onChange({ reduced: e.target.checked })}
        />{" "}
        Reducir movimiento y efectos
      </label>
      <label>
        <input
          type="checkbox"
          checked={settings.controls === "large"}
          onChange={(e) =>
            onChange({ controls: e.target.checked ? "large" : "normal" })
          }
        />{" "}
        Controles táctiles grandes
      </label>
    </fieldset>
  );
}

function PauseDialog({ reason, settings, onChange, onResume, onMenu }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current.querySelector("button").focus();
    const trap = (event) => {
      if (event.key !== "Tab") return;
      const items = [...ref.current.querySelectorAll("button, input")].filter(
        (el) => !el.disabled,
      );
      const first = items[0],
        last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const node = ref.current;
    node.addEventListener("keydown", trap);
    return () => node.removeEventListener("keydown", trap);
  }, []);
  return (
    <div className="arcade-pause-backdrop">
      <section
        className="arcade-pause-panel"
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="arcade-paused-title"
      >
        <Pause size={28} />
        <h2 id="arcade-paused-title">Tu misión puede esperar</h2>
        <p>
          {reason === "focus"
            ? "Pausamos al cambiar de ventana. Continúa cuando estés listo."
            : "Respira un momento. El taller sigue aquí."}
        </p>
        <button className="arcade-button" onClick={onResume}>
          <Play size={18} /> Continuar
        </button>
        <Settings settings={settings} onChange={onChange} />
        <button className="arcade-text-button" onClick={onMenu}>
          Terminar y volver al inicio
        </button>
        <small>Al salir se pierde el puntaje de esta partida.</small>
      </section>
    </div>
  );
}

export default function ActiveBreak() {
  const [mode, setMode] = useState("menu");
  const modeRef = useRef("menu");
  const [profile, setProfile] = useState(readGameProfile);
  const profileRef = useRef(profile);
  const [settings, setSettings] = useState(readGameSettings);
  const settingsRef = useRef(settings);
  const [assets, setAssets] = useState(null);
  const [progress, setProgress] = useState(0);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [notice, setNotice] = useState("");
  const [pauseReason, setPauseReason] = useState("manual");
  const game = useRef(createGame());
  const input = useRef(emptyInput());
  const canvas = useRef(null);
  const resultHeading = useRef(null);
  const audio = useRef(null);
  const credited = useRef(false);
  const [hud, setHud] = useState(() => gameSummary(game.current));
  const character =
    CHARACTERS.find((c) => c.id === profile.selected) || CHARACTERS[0];

  useEffect(() => {
    if (mode === "victory" || mode === "gameover")
      resultHeading.current?.focus({ preventScroll: true });
  }, [mode]);

  const changeMode = useCallback((next) => {
    modeRef.current = next;
    setMode(next);
  }, []);
  useEffect(() => {
    let active = true;
    setProgress(0);
    setAssets(null);
    loadAssets((p) => {
      if (active) setProgress(p);
    }).then((result) => {
      if (active) setAssets(result);
    });
    return () => {
      active = false;
    };
  }, [loadAttempt]);
  useEffect(() => {
    audio.current = createGameAudio();
    audio.current.setVolume(settingsRef.current.volume);
    return () => audio.current.close();
  }, []);

  const updateSettings = useCallback((patch) => {
    const next = { ...settingsRef.current, ...patch };
    settingsRef.current = next;
    setSettings(next);
    savePreference("geo_arcade_settings", JSON.stringify(next));
    audio.current?.setVolume(next.volume);
  }, []);
  const pause = useCallback(
    (reason) => {
      if (modeRef.current !== "playing") return;
      clearInput(input);
      audio.current?.pause();
      setPauseReason(reason);
      changeMode("paused");
    },
    [changeMode],
  );
  const resume = useCallback(() => {
    if (modeRef.current !== "paused" || document.hidden) return;
    clearInput(input);
    void audio.current?.unlock();
    changeMode("playing");
    requestAnimationFrame(() => {
      if (modeRef.current === "playing")
        canvas.current?.focus({ preventScroll: true });
    });
  }, [changeMode]);
  useGameInput(input, mode, pause, resume);

  const start = () => {
    if (!assets) return;
    clearInput(input);
    credited.current = false;
    game.current = createGame();
    setHud(gameSummary(game.current));
    void audio.current?.unlock();
    changeMode("playing");
    requestAnimationFrame(() => {
      if (modeRef.current === "playing")
        canvas.current?.focus({ preventScroll: true });
    });
  };
  const menu = () => {
    clearInput(input);
    audio.current?.pause();
    changeMode("menu");
  };

  useEffect(() => {
    if (mode !== "playing" || !assets || !canvas.current) return;
    const ctx = canvas.current.getContext("2d");
    const clock = createClock();
    let frame;
    const loop = (time) => {
      if (modeRef.current !== "playing") return;
      clock.advance(time, () => {
        stepGame(game.current, input.current, {
          autoFire: settingsRef.current.autoFire,
        });
        for (const event of game.current.events.splice(0))
          audio.current?.play(event);
      });
      drawGame(
        ctx,
        game.current,
        assets.images,
        character,
        settingsRef.current,
      );
      if (game.current.tick % 6 === 0 || game.current.phase !== "playing")
        setHud(gameSummary(game.current));
      if (game.current.phase !== "playing") {
        if (!credited.current) {
          credited.current = true;
          const next = {
            ...profileRef.current,
            coins: profileRef.current.coins + game.current.score,
          };
          profileRef.current = next;
          setProfile(next);
          saveGameProfile(next);
        }
        clearInput(input);
        changeMode(game.current.phase);
        return;
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      clock.reset();
    };
  }, [mode, assets, character, changeMode]);

  const choose = (item) => {
    const current = profileRef.current;
    const unlocked = current.unlocked.includes(item.id);
    if (!unlocked && current.coins < item.cost) {
      setNotice(
        `Necesitas ${item.cost - current.coins} Data más para desbloquear a ${item.name}.`,
      );
      return;
    }
    const next = {
      coins: current.coins - (unlocked ? 0 : item.cost),
      unlocked: [...new Set([...current.unlocked, item.id])],
      selected: item.id,
    };
    profileRef.current = next;
    setProfile(next);
    saveGameProfile(next);
    setNotice("");
  };
  const active = mode === "playing" || mode === "paused";
  const result = mode === "victory" || mode === "gameover";

  return (
    <div className="arcade">
      {mode === "menu" && (
        <>
          <div className="arcade-intro">
            <div className="arcade-intro-copy">
              <span className="arcade-eyebrow">
                Pausa activa 2.0 · Edición Navidad
              </span>
              <h1>
                Una pausa.
                <br />
                <em>Una misión navideña.</em>
              </h1>
              <p>
                Esquiva, dispara y recupera las luces del taller con los
                guardianes de VictorIA.
              </p>
              <div className="arcade-intro-tags">
                <span>
                  <Heart size={16} /> 3 vidas
                </span>
                <span>
                  <Shield size={16} /> Escudo y mejoras
                </span>
                <span>
                  <Zap size={16} /> Esquiva
                </span>
              </div>
            </div>
            <div className="arcade-hero-character">
              <CharacterPreview
                character={character}
                image={assets?.images[character.src]}
                reduced={settings.reduced}
              />
              <span>
                {character.name} <small>{character.area}</small>
              </span>
            </div>
          </div>
          <section
            className="arcade-menu"
            aria-labelledby="arcade-select-title"
          >
            <div className="arcade-menu-heading">
              <h2 id="arcade-select-title">Elige a tu guardián</h2>
              <span>
                {profile.coins} Data{" "}
                <small>· progreso en este dispositivo</small>
              </span>
            </div>
            <div className="arcade-character-list">
              {CHARACTERS.map((item) => {
                const unlocked = profile.unlocked.includes(item.id),
                  selected = profile.selected === item.id;
                return (
                  <button
                    type="button"
                    className={`arcade-character-choice ${selected ? "selected" : ""}`}
                    key={item.id}
                    aria-pressed={selected}
                    onClick={() => choose(item)}
                  >
                    <span className="arcade-choice-name">
                      {item.name}
                      {selected && <Check size={20} />}
                    </span>
                    <span>{item.area}</span>
                    <small>
                      {unlocked
                        ? item.id === "tecnoia"
                          ? "Nuevo · incluido"
                          : "Disponible"
                        : `Desbloquear · ${item.cost} Data`}
                    </small>
                  </button>
                );
              })}
            </div>
            {notice && (
              <p role="status" className="arcade-notice">
                {notice}
              </p>
            )}
            {!assets && (
              <p role="status" className="arcade-notice">
                Preparando el taller… {Math.round(progress * 100)}%
              </p>
            )}
            {assets?.failed.length > 0 && (
              <p role="status" className="arcade-notice">
                Alguna imagen no cargó. Puedes jugar con el diseño de respaldo.{" "}
                <button
                  className="arcade-text-button"
                  onClick={() => setLoadAttempt((n) => n + 1)}
                >
                  Reintentar carga
                </button>
              </p>
            )}
            <div className="arcade-start-row">
              <button
                className="arcade-button"
                disabled={!assets}
                onClick={start}
              >
                <Play size={20} /> Iniciar misión
              </button>
              <p>
                Flechas o WASD · Espacio para disparar
                <br />
                Shift para esquivar · Esc para pausar
              </p>
            </div>
            <details className="arcade-settings-details">
              <summary>
                <Settings2 size={18} /> Ajustar controles y sonido
              </summary>
              <Settings settings={settings} onChange={updateSettings} />
            </details>
          </section>
        </>
      )}

      {active && (
        <div className="arcade-session">
          <header className="arcade-hud">
            <div
              className="arcade-lives"
              role="img"
              aria-label={`${hud.hp} de 3 vidas`}
            >
              {[0, 1, 2].map((i) => (
                <Heart
                  key={i}
                  size={22}
                  fill={i < hud.hp ? "currentColor" : "none"}
                  className={i < hud.hp ? "" : "empty"}
                />
              ))}
            </div>
            <div className="arcade-score">
              <span>Puntos</span>
              <strong>{hud.score.toString().padStart(4, "0")}</strong>
            </div>
            <p className="arcade-objective">
              {hud.boss
                ? "Protege las luces · derrota al guardián"
                : "Recupera 100 puntos para llegar al taller"}
            </p>
            <button
              className="arcade-icon-button"
              onClick={() => pause("manual")}
              aria-label="Pausar y ajustar el juego"
              disabled={mode === "paused"}
            >
              <Pause size={21} /> <span>Pausa</span>
            </button>
          </header>
          <div className="arcade-viewport">
            <canvas
              ref={canvas}
              width={WIDTH}
              height={HEIGHT}
              tabIndex={0}
              aria-label="Arcade navideño. Muévete con flechas o WASD, dispara con espacio, esquiva con Shift y pausa con Escape."
            />
          </div>
          <div className="arcade-status">
            <span>
              <Zap size={16} />
              {hud.dash ? `Esquiva en ${hud.dash}s` : "Esquiva lista · Shift"}
            </span>
            {hud.shield > 0 && (
              <span>
                <Shield size={16} /> Escudo {hud.shield}s
              </span>
            )}
            {hud.dual > 0 && <span>Doble {hud.dual}s</span>}
            {hud.spread > 0 && <span>Abanico {hud.spread}s</span>}
            {settings.autoFire && <span>Disparo asistido</span>}
          </div>
          {mode === "playing" && (
            <TouchControls
              input={input}
              dash={hud.dash}
              large={settings.controls === "large"}
            />
          )}
          <p className="arcade-keyboard-hint">
            Mover: WASD / flechas · Mantén Espacio para disparar · Shift:
            esquivar · Esc: pausa
          </p>
          {mode === "paused" && (
            <PauseDialog
              reason={pauseReason}
              settings={settings}
              onChange={updateSettings}
              onResume={resume}
              onMenu={menu}
            />
          )}
        </div>
      )}

      {result && (
        <section
          className="arcade-results"
          aria-labelledby="arcade-result-title"
        >
          <CharacterPreview
            character={character}
            image={assets?.images[character.src]}
            pose={mode === "victory" ? "victory" : "defeat"}
            reduced={settings.reduced}
          />
          <div className="arcade-result-copy">
            <span className="arcade-eyebrow">
              {mode === "victory" ? "Misión cumplida" : "Cada intento cuenta"}
            </span>
            <h1 id="arcade-result-title" ref={resultHeading} tabIndex={-1}>
              {mode === "victory"
                ? "¡El taller vuelve a brillar!"
                : "Recarga y vuelve a intentarlo"}
            </h1>
            <p>
              {mode === "victory"
                ? "Un pequeño descanso. Una gran ayuda para la Navidad."
                : "Las luces siguen esperando a su guardián."}
            </p>
            <div className="arcade-result-score">
              <Trophy size={26} />
              <strong>{hud.score}</strong>
              <span>puntos · +{hud.score} Data</span>
            </div>
            <ScoreSubmitter key={mode} score={hud.score} />
            <div className="arcade-result-actions">
              <button className="arcade-button" onClick={start}>
                <RotateCcw size={18} /> Jugar otra vez
              </button>
              <button className="arcade-button secondary" onClick={menu}>
                Cambiar guardián
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

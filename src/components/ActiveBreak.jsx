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
} from "lucide-react";
import {
  CHARACTERS,
  AREA_CHARACTERS,
  LEGACY_CHARACTERS,
  characterPose,
  loadAssets,
} from "../game/characters.js";
import { powerForCharacter } from "../game/powers.js";
import {
  createAnimator,
  advanceAnimator,
  capturePositions,
  interpolateScene,
} from "../game/animation.js";
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
import { consumeGameEvents } from "../game/emission.js";
import { characterAnimation } from "../game/characterAnimation.js";
import { createGameAudio } from "../game/audio.js";
import {
  readGameProfile,
  readGameSettings,
  saveGameProfile,
  readCampaignProgress,
  saveCampaignProgress,
} from "../game/profile.js";
import { MISSIONS, completeMission } from "../game/missions.js";
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
  const [adventure, setAdventure] = useState(true);
  const [campaign, setCampaign] = useState(readCampaignProgress);
  const campaignRef = useRef(campaign);
  const [missionId, setMissionId] = useState(() => MISSIONS[Math.min(campaign.completed.length, MISSIONS.length - 1)].id);
  const [mode, setMode] = useState("menu");
  const modeRef = useRef("menu");
  const [profile, setProfile] = useState(readGameProfile);
  const profileRef = useRef(profile);
  const [settings, setSettings] = useState(readGameSettings);
  const settingsRef = useRef(settings);
  const [assets, setAssets] = useState(null);
  const [progress, setProgress] = useState(0);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const lastLoadAttempt = useRef(0);
  const [notice, setNotice] = useState("");
  const [catalog, setCatalog] = useState("areas");
  const [query, setQuery] = useState("");
  const [previewPose, setPreviewPose] = useState("idle");
  const [pauseReason, setPauseReason] = useState("manual");
  const game = useRef(createGame());
  const input = useRef(emptyInput());
  const actor = useRef(createAnimator());
  const canvas = useRef(null);
  const resultHeading = useRef(null);
  const audio = useRef(null);
  const credited = useRef(false);
  const [hud, setHud] = useState(() => gameSummary(game.current));
  const character =
    CHARACTERS.find((c) => c.id === profile.selected) || CHARACTERS[0];
  const power = character.power || powerForCharacter(character.id);
  const normalize = (text) =>
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const filteredCharacters = (
    catalog === "areas" ? AREA_CHARACTERS : LEGACY_CHARACTERS
  ).filter((c) =>
    normalize(c.name + " " + c.area).includes(normalize(query.trim())),
  );

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
    const retry = lastLoadAttempt.current !== loadAttempt;
    lastLoadAttempt.current = loadAttempt;
    loadAssets(
      (p) => {
        if (active) setProgress(p);
      },
      character,
      { retry },
    ).then((result) => {
      if (active) setAssets(result);
    });
    return () => {
      active = false;
    };
  }, [loadAttempt, character]);
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
      actor.current.previous = null;
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

  const start = (nextMission = missionId) => {
    if (!assets || assets.characterId !== character.id) return;
    clearInput(input);
    credited.current = false;
    const missionIndex = MISSIONS.findIndex(m => m.id === nextMission);
    if (adventure && (missionIndex < 0 || missionIndex > campaignRef.current.completed.length)) return;
    setMissionId(nextMission);
    game.current = createGame(character.id, { animationVersion: assets.animation?.version || 1, missionId: adventure ? nextMission : null });
    actor.current = createAnimator();
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
    let previous = capturePositions(game.current);
    let frame;
    let victoryStarted = null;
    const loop = (time) => {
      if (modeRef.current !== "playing") return;
      clock.advance(time, () => {
        previous = capturePositions(game.current);
        stepGame(game.current, input.current, {
          autoFire: settingsRef.current.autoFire,
        });
        consumeGameEvents(game.current.events, actor.current, (event) => audio.current?.play(event));
      });
      advanceAnimator(
        actor.current,
        characterPose(game.current.player, game.current.phase),
        time / 1000,
        {
          dx: game.current.player.dx,
          dy: game.current.player.dy,
          activation: game.current.player.activation,
          reduced: settingsRef.current.reduced,
          shotId: game.current.player.lastShot?.id || 0,
        },
      );
      drawGame(
        ctx,
        interpolateScene(game.current, previous, clock.alpha),
        assets.images,
        character,
        { ...settingsRef.current, actor: actor.current, animation: assets.animation,
          defeatElapsed: victoryStarted === null ? 0 : (time - victoryStarted) / 1000,
          presentation: assets.animation ? characterAnimation(character).present(game.current, actor.current, clock.alpha) : null },
      );
      if (game.current.tick % 6 === 0 || game.current.phase !== "playing")
        setHud(gameSummary(game.current));
      if (game.current.phase !== "playing") {
        if (!credited.current) {
          credited.current = true;
          if (game.current.phase === "victory" && game.current.missionId) {
            const progress = completeMission(campaignRef.current, game.current.missionId, game.current.score);
            campaignRef.current = progress; setCampaign(progress); saveCampaignProgress(progress);
          }
          const next = {
            ...profileRef.current,
            coins: profileRef.current.coins + game.current.score,
          };
          profileRef.current = next;
          setProfile(next);
          saveGameProfile(next);
        }
        clearInput(input);
        if (game.current.phase === "victory" && !settingsRef.current.reduced) {
          victoryStarted ??= time;
          if (time - victoryStarted < 750) {
            frame = requestAnimationFrame(loop);
            return;
          }
        }
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
                {adventure ? "Aventura navideña · 3 niveles" : "Arcade rápido · Edición Navidad"}
              </span>
              <h1>
                {adventure ? "Una aventura." : "Una pausa."}
                <br />
                <em>{adventure ? "Tres destinos." : "Una misión navideña."}</em>
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
                <span>Un poder por área</span>
              </div>
            </div>
            <div className="arcade-hero-character">
              <CharacterPreview
                character={character}
                image={assets?.images[character.src]}
                sprite={assets?.images[character.sprite]}
                animation={assets?.animation}
                loading={!assets || assets.characterId !== character.id}
                pose={
                  previewPose === "power" && power.id === "dash"
                    ? "dash"
                    : previewPose
                }
                reduced={settings.reduced}
              />
              <span>
                {character.name} <small>{character.area}</small>
              </span>
              <label className="arcade-preview-select">
                Ver movimiento
                <select
                  value={previewPose}
                  onChange={(e) => setPreviewPose(e.target.value)}
                  aria-label="Movimiento del guardián"
                >
                  <option value="idle">Reposo</option>
                  <option value="moving">Volando</option>
                  <option value="shooting">Disparando</option>
                  <option value="power">Usando su poder</option>
                  <option value="damage">Recibiendo un impacto</option>
                  <option value="victory">Celebrando</option>
                  <option value="defeat">Descansando</option>
                </select>
              </label>
            </div>
          </div>
          <section className="campaign-selection" aria-label="Elige tu aventura">
            <div className="campaign-mode" role="group" aria-label="Modo individual">
              <button type="button" aria-pressed={adventure} onClick={() => setAdventure(true)}>Aventura · 3 niveles</button>
              <button type="button" aria-pressed={!adventure} onClick={() => setAdventure(false)}>Arcade rápido</button>
            </div>
            {adventure && <>
              <h2>Una aventura, tres destinos</h2>
              <p>Desbloquea la siguiente misión al completar la anterior. Tu avance se guarda en este dispositivo.</p>
              <div className="campaign-missions">
                {MISSIONS.map((mission, index) => <button type="button" key={mission.id} disabled={index > campaign.completed.length}
                  aria-pressed={missionId === mission.id} onClick={() => setMissionId(mission.id)} style={{ "--mission-color": mission.color }}>
                  <span className="campaign-number">{String(index + 1).padStart(2, "0")}</span>
                  <strong>{mission.title}</strong><span>{mission.subtitle}</span>
                  <small>{campaign.completed.includes(mission.id) ? "Completada · volver a jugar" : index > campaign.completed.length ? "Completa la misión anterior" : "Disponible · 2–4 min aprox."}</small>
                </button>)}
              </div>
              <p className="campaign-brief">{MISSIONS.find(m => m.id === missionId).description}</p>
            </>}
          </section>
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
            <div className="arcade-catalog-tools">
              <div role="group" aria-label="Colección de guardianes">
                <button
                  type="button"
                  aria-pressed={catalog === "areas"}
                  onClick={() => {
                    setCatalog("areas");
                    setQuery("");
                  }}
                >
                  Áreas · 12
                </button>
                <button
                  type="button"
                  aria-pressed={catalog === "legacy"}
                  onClick={() => {
                    setCatalog("legacy");
                    setQuery("");
                  }}
                >
                  Clásicos · 2
                </button>
              </div>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Buscar área o guardián"
                placeholder="Buscar área o guardián"
              />
            </div>
            <div
              className="arcade-character-list"
              aria-label="Guardianes disponibles"
            >
              {filteredCharacters.map((item) => {
                const unlocked = profile.unlocked.includes(item.id),
                  selected = profile.selected === item.id;
                return (
                  <button
                    type="button"
                    className={`arcade-character-choice ${selected ? "selected" : ""}`}
                    key={item.id}
                    aria-pressed={selected}
                    aria-label={`${item.name} · ${item.area}${unlocked ? "" : ` · ${item.cost} Data`}`}
                    onClick={() => choose(item)}
                    style={{ "--guardian-accent": item.accent || "#f4d693" }}
                  >
                    {item.thumbnail ? (
                      <img
                        className="arcade-choice-portrait"
                        src={item.thumbnail}
                        loading="lazy"
                        decoding="async"
                        alt=""
                      />
                    ) : (
                      <span className="arcade-choice-legacy" aria-hidden="true">
                        V
                      </span>
                    )}
                    <span className="arcade-choice-copy">
                      <span className="arcade-choice-name">
                        {item.name}
                        {selected && <Check size={20} />}
                      </span>
                      <span className="arcade-choice-area">{item.area}</span>
                      {!unlocked && (
                        <small>Desbloquear · {item.cost} Data</small>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
            {filteredCharacters.length === 0 && (
              <p className="arcade-notice" role="status">
                No encontramos ese guardián. Prueba con el nombre del área.
              </p>
            )}
            <p className="arcade-selected-power">
              <strong>{power.name}</strong>
              <span>{power.description}</span>
              <small>
                Shift o botón Poder · recarga {power.cooldown / 60} s
              </small>
            </p>
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
                disabled={!assets || assets.characterId !== character.id}
                onClick={() => start()}
              >
                <Play size={20} /> Iniciar misión
              </button>
              <p>
                Flechas o WASD · Espacio para disparar
                <br />
                Shift para tu poder · Esc para pausar
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
              {hud.missionId && <strong>Nivel {MISSIONS.findIndex(m => m.id === hud.missionId) + 1}/3 · </strong>}
              {hud.objective}
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
              aria-label={`Arcade navideño con ${character.name}. Flechas o WASD para moverte, espacio para disparar, Shift para ${power.name} y Escape para pausar.`}
            />
          </div>
          <div className="arcade-status">
            <button
              type="button"
              className="arcade-power-button"
              disabled={hud.powerCooldown > 0 || mode === "paused"}
              onClick={() => {
                input.current.power = true;
              }}
              aria-label={`Usar ${power.name}${hud.powerCooldown ? `, recarga ${hud.powerCooldown} segundos` : ""}`}
            >
              {power.name} ·{" "}
              {hud.powerCooldown ? `${hud.powerCooldown}s` : "Listo · Shift"}
            </button>
            {hud.powerTime > 0 && power.id !== "dash" && (
              <span>
                {power.name} · {hud.powerTime}s de efecto
              </span>
            )}
            {hud.shield > 0 && (
              <span>
                <Shield size={16} /> Escudo {hud.shield}s
              </span>
            )}
            {hud.dual > 0 && <span>Doble {hud.dual}s</span>}
            {hud.spread > 0 && <span>Abanico {hud.spread}s</span>}
            {settings.autoFire && <span>Disparo asistido</span>}
          </div>
          <p className="arcade-orientation-hint">
            Para ver mejor los gestos, juega con el teléfono en horizontal.
          </p>
          {mode === "playing" && (
            <TouchControls
              input={input}
              power={power}
              cooldown={hud.powerCooldown}
              large={settings.controls === "large"}
            />
          )}
          <p className="arcade-keyboard-hint">
            Mover: WASD / flechas · Mantén Espacio para disparar · Shift: tu
            poder · Esc: pausa
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
            sprite={assets?.images[character.sprite]}
            animation={assets?.animation}
            pose={mode === "victory" ? "victory" : "defeat"}
            reduced={settings.reduced}
          />
          <div className="arcade-result-copy">
            <span className="arcade-eyebrow">
              {mode === "victory" ? "Misión cumplida" : "Cada intento cuenta"}
            </span>
            <h1 id="arcade-result-title" ref={resultHeading} tabIndex={-1}>
              {mode === "victory"
                ? game.current.missionId ? `${MISSIONS.find(m => m.id === game.current.missionId).title}: misión cumplida` : "¡El taller vuelve a brillar!"
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
            {!game.current.missionId && <ScoreSubmitter key={mode} score={hud.score} />}
            <div className="arcade-result-actions">
              {mode === "victory" && game.current.missionId && MISSIONS.findIndex(m => m.id === game.current.missionId) < MISSIONS.length - 1 &&
                <button className="arcade-button" onClick={() => start(MISSIONS[MISSIONS.findIndex(m => m.id === game.current.missionId) + 1].id)}>Continuar al siguiente nivel</button>}
              <button className="arcade-button" onClick={() => start()}>
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

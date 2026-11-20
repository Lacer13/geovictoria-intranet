import { useCallback, useEffect, useRef, useState } from "react";
import { AREA_CHARACTERS } from "./characters.js";
import { arenaEndpoint, connectArena } from "./arenaConnection.js";
import { ARENA } from "./arenaSimulation.js";
import { drawArena } from "./arenaRender.js";
import { emptyInput } from "./simulation.js";
import { useGameInput, clearInput } from "./input.js";
import TouchControls from "./TouchControls.jsx";

const credentialKey = "geo_arena_session_v1";
const readCredential = () => { try { const saved = JSON.parse(sessionStorage.getItem(credentialKey)); return /^[A-F0-9]{8}$/.test(saved?.code) && /^[a-f0-9]{64}$/.test(saved?.token) ? saved : null; } catch { return null; } };
export default function ArenaOnline() {
  const [name, setName] = useState(""), [character, setCharacter] = useState("tecnoia");
  const [code, setCode] = useState(() => new URLSearchParams(location.hash.slice(1)).get("sala") || "");
  const [state, setState] = useState(null), [side, setSide] = useState(null), [status, setStatus] = useState("idle"), [error, setError] = useState("");
  const [credential, setCredential] = useState(readCredential), [latency, setLatency] = useState(null), [copied, setCopied] = useState(false);
  const [autoFire, setAutoFire] = useState(false), [autoAim, setAutoAim] = useState(true);
  const input = useRef(emptyInput()), connection = useRef(null), canvas = useRef(null), view = useRef(null), ownSide = useRef(null);
  const portraits = useRef({}), autoFireRef = useRef(false), autoAimRef = useRef(true), pointer = useRef(null);
  const endpoint = arenaEndpoint();
  const neutral = useCallback(() => { clearInput(input); pointer.current = null; }, []);
  const active = state?.game && state.game.phase !== "finished";
  const hasGame = Boolean(state?.game);
  useGameInput(input, active ? "playing" : "menu", neutral, neutral);
  autoFireRef.current = autoFire; autoAimRef.current = autoAim;
  useEffect(() => () => connection.current?.close(), []);
  useEffect(() => {
    for (const player of state?.players || []) if (player && !portraits.current[player.character]) {
      const image = new Image(); image.src = AREA_CHARACTERS.find(c => c.id === player.character)?.thumbnail; portraits.current[player.character] = image;
    }
  }, [state?.players]);
  useEffect(() => {
    if (!hasGame) return;
    let frame;
    const paint = now => {
      const v = view.current;
      if (canvas.current && v) drawArena(canvas.current.getContext("2d"), v.to.game, v.to.players, ownSide.current, portraits.current, v.from, Math.min(1, (now - v.at) / 50));
      frame = requestAnimationFrame(paint);
    };
    frame = requestAnimationFrame(paint); return () => cancelAnimationFrame(frame);
  }, [hasGame]);

  const begin = (type, saved = null) => {
    if (!endpoint) return;
    connection.current?.close(); setError(""); setState(null); setSide(null); ownSide.current = null; view.current = null;
    const client = connectArena({ url: endpoint, credential: saved, onStatus: setStatus, onMessage: data => {
      if (data.t === "error") {
        if (data.recoveryFailed) { setCredential(null); setState(null); setSide(null); neutral(); try { sessionStorage.removeItem(credentialKey); } catch { /* Optional. */ } }
        setError(data.message); return;
      }
      if (data.t === "expired") { setError("La sala terminó. Puedes crear otra partida."); client.close(); setStatus("offline"); return; }
      if (data.t === "latency") { setLatency(data.ms); return; }
      if (data.t === "joined") {
        ownSide.current = data.side; setSide(data.side); setCode(data.code);
        const c = { code: data.code, token: data.token }; setCredential(c);
        try { sessionStorage.setItem(credentialKey, JSON.stringify(c)); } catch { /* Optional resume. */ }
      }
      if (data.t === "state") {
        const previous = view.current;
        view.current = { to: data, from: previous?.to.round === data.round ? previous.to.game : null, at: performance.now() };
        setState(data);
      }
    } });
    connection.current = client;
    if (!saved) client.send({ t: type, name, character, code: code.trim().toUpperCase() });
    client.startInputs(() => {
      const game = view.current?.to.game, me = game?.players[ownSide.current], rival = game?.players[1 - ownSide.current];
      const p = input.current;
      let dx = ownSide.current === 1 ? -1 : 1, dy = 0;
      if (me && rival && autoAimRef.current) { dx = rival.x - me.x; dy = rival.y - me.y; }
      else if (me && pointer.current) { dx = pointer.current.x - me.x; dy = pointer.current.y - me.y; }
      else if (p.x || p.y || p.left || p.right || p.up || p.down) { dx = p.x || Number(p.right) - Number(p.left); dy = p.y || Number(p.down) - Number(p.up); }
      const length = Math.max(0.01, Math.hypot(dx, dy));
      const value = { x: p.x || Number(p.right) - Number(p.left), y: p.y || Number(p.down) - Number(p.up), aimX: dx / length, aimY: dy / length, fire: p.fire || autoFireRef.current, dash: p.power || p.dash };
      p.power = false; p.dash = false;
      return value;
    });
  };
  const leave = () => {
    connection.current?.close(); connection.current = null; neutral(); setState(null); setSide(null); setStatus("idle"); setCredential(null); setError("");
    try { sessionStorage.removeItem(credentialKey); } catch { /* Optional. */ }
  };
  const copy = async () => {
    const url = new URL(location.href); url.hash = `sala=${code}`;
    try { await navigator.clipboard.writeText(url.href); setCopied(true); } catch { setError(`Comparte este código: ${code}`); }
  };
  const me = state?.game?.players[side], finished = state?.game?.phase === "finished";
  const ready = state?.players[side]?.ready;
  const seconds = state?.game ? Math.max(0, ARENA.seconds + (state.game.overtime ? ARENA.overtime : 0) - Math.floor(state.game.playingTicks / 60)) : 180;
  return <section className="arena-online">
    {!state?.game && <>
      <div className="arena-intro"><span className="arcade-eyebrow">Arena privada · 1 contra 1</span><h1>Carga el faro</h1>
        <p>Recoge la luz del centro y llévala a tu base. Gana con cinco entregas o al terminar tres minutos. Misma velocidad, disparo y esquiva para ambos guardianes.</p>
        <div className="arena-rules"><span>2 dispositivos</span><span>Salas por código</span><span>Esquiva · Shift</span></div>
        <p className="arena-guidance">La partida sigue al cambiar de pestaña. Si pierdes la conexión, tienes 15 segundos para volver a la misma sala.</p>
      </div>
      {!endpoint && <p className="arcade-notice" role="status">La arena en línea se está preparando. Mientras tanto, puedes jugar la aventura de tres niveles.</p>}
      {side === null ? <div className="arena-lobby-form">
        <label>Tu alias<input value={name} onChange={e => setName(e.target.value)} minLength={2} maxLength={24} placeholder="Cómo te verá tu rival" /></label>
        <label>Guardián<select value={character} onChange={e => setCharacter(e.target.value)}>{AREA_CHARACTERS.map(c => <option key={c.id} value={c.id}>{c.name} · {c.area}</option>)}</select></label>
        <button className="arcade-button" disabled={!endpoint || name.trim().length < 2 || status === "connecting"} onClick={() => begin("create")}>Crear sala privada</button>
        <div className="arena-join"><label>Código de sala<input value={code} onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-F0-9]/g, "").slice(0, 8))} maxLength={8} placeholder="8 caracteres" autoCapitalize="characters" /></label>
          <button className="arcade-button secondary" disabled={!endpoint || name.trim().length < 2 || !/^[A-F0-9]{8}$/.test(code) || status === "connecting"} onClick={() => begin("join")}>Unirme</button></div>
        {credential && <button className="arcade-text-button" onClick={() => begin("resume", credential)}>Recuperar mi sala anterior</button>}
      </div> : <div className="arena-lobby-room">
        <p>Comparte el código <strong className="arena-code">{code}</strong></p><button className="arcade-button secondary" onClick={copy}>{copied ? "Enlace copiado" : "Copiar invitación"}</button>
        <div className="arena-roster">{state?.players.map((p, i) => <div key={i}><strong>{p?.name || "Esperando rival…"}</strong><span>{p ? p.ready ? "Listo" : p.connected ? "En la sala" : "Reconectando…" : "Comparte el código"}</span></div>)}</div>
        <button className="arcade-button" disabled={ready || status !== "connected"} onClick={() => connection.current.send({ t: "ready", ready: true })}>{ready ? "Esperando al rival" : "Estoy listo"}</button>
        <button className="arcade-text-button" onClick={leave}>Salir de la sala</button>
      </div>}
    </>}
    {state?.game && <div className="arcade-session arena-session">
      <header className="arcade-hud arena-hud"><strong>{state.players[0]?.name} {state.game.players[0].score}</strong><span>{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}{state.game.overtime ? " · Prórroga" : ""}</span><strong>{state.game.players[1].score} {state.players[1]?.name}</strong><button className="arcade-icon-button" onClick={leave}>Salir</button></header>
      <div className="arcade-viewport"><canvas ref={canvas} width={960} height={540} tabIndex={0} aria-label="Arena en línea: mueve a tu guardián, recoge la luz y vuelve a tu faro" onPointerMove={e => { if (e.pointerType !== "mouse") return; const box = e.currentTarget.getBoundingClientRect(); pointer.current = { x: (e.clientX - box.left) * 960 / box.width, y: (e.clientY - box.top) * 540 / box.height }; }} /></div>
      <div className="arcade-status"><span>{me?.respawn ? `Regresas en ${Math.ceil(me.respawn / 60)} s` : state.game.orb.carrier === side ? "Lleva la luz a tu faro" : "Recoge la luz del centro"}</span><span>{latency === null ? "Conectado" : `${latency} ms`}</span>
        {!finished && <><label className="arena-option"><input type="checkbox" checked={autoAim} onChange={e => setAutoAim(e.target.checked)} /> Apuntar al rival</label><label className="arena-option"><input type="checkbox" checked={autoFire} onChange={e => setAutoFire(e.target.checked)} /> Disparo asistido</label></>}
      </div>
      {!finished && <TouchControls input={input} power={{ name: "Esquiva" }} cooldown={Math.ceil((me?.cooldown || 0) / 60)} large={false} />}
      {finished && <div className="arena-end" role="status"><h2>{state.game.winner === null ? "¡Empate!" : state.game.winner === side ? "¡Tu faro ganó!" : "El rival encendió su faro"}</h2><p>{state.game.reason === "disconnect" ? "La partida terminó por desconexión." : "Una buena partida merece otra oportunidad."}</p>
        <button className="arcade-button" disabled={ready || status !== "connected"} onClick={() => connection.current.send({ t: "ready", ready: true })}>{ready ? "Esperando la revancha" : "Revancha"}</button><button className="arcade-button secondary" onClick={leave}>Volver a la arena</button></div>}
    </div>}
    {status === "reconnecting" && <p className="arcade-notice" role="status">Reconectando con tu sala…</p>}
    {status === "connecting" && <p className="arcade-notice" role="status">Conectando con la arena… La primera conexión puede tardar un momento.</p>}
    {status === "offline" && <p className="arcade-notice" role="status">No pudimos conectar con la arena. Comprueba tu conexión e inténtalo otra vez.</p>}
    {state?.players.some((p, i) => p && i !== side && !p.connected) && <p role="status" className="arcade-notice">Tu rival perdió la conexión. Tiene 15 segundos para volver.</p>}
    {error && <p role="alert" className="arcade-notice">{error}</p>}
  </section>;
}

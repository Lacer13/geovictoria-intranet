import { useRef, useState } from "react";
import { Crosshair, Move, Zap } from "lucide-react";

export default function TouchControls({ input, dash, large }) {
  const active = useRef(null);
  const [stick, setStick] = useState({ x: 0, y: 0 });
  const move = (event) => {
    if (event.pointerId !== active.current) return;
    const box = event.currentTarget.getBoundingClientRect();
    const radius = box.width * 0.32;
    const x = (event.clientX - box.left - box.width / 2) / radius;
    const y = (event.clientY - box.top - box.height / 2) / radius;
    const length = Math.max(1, Math.hypot(x, y));
    input.current.x = x / length;
    input.current.y = y / length;
    setStick({ x: input.current.x * radius, y: input.current.y * radius });
  };
  const release = (event) => {
    if (event.pointerId !== active.current) return;
    active.current = null;
    input.current.x = 0;
    input.current.y = 0;
    setStick({ x: 0, y: 0 });
  };
  return (
    <div
      className={`arcade-touch ${large ? "large" : ""}`}
      aria-label="Controles táctiles"
    >
      <div
        className="arcade-stick"
        aria-label="Zona táctil para moverte; también puedes usar flechas o WASD"
        onPointerDown={(event) => {
          if (active.current !== null) return;
          active.current = event.pointerId;
          event.currentTarget.setPointerCapture(event.pointerId);
          move(event);
        }}
        onPointerMove={move}
        onPointerUp={release}
        onPointerCancel={release}
        onLostPointerCapture={release}
      >
        <Move aria-hidden="true" size={22} />
        <span style={{ transform: `translate(${stick.x}px, ${stick.y}px)` }} />
      </div>
      <span className="arcade-touch-caption">Mover</span>
      <div className="arcade-touch-actions">
        <button
          type="button"
          className="arcade-dash"
          aria-label={
            dash ? `Esquiva recargando, ${dash} segundos` : "Esquivar"
          }
          disabled={dash > 0}
          onPointerDown={(event) => {
            event.preventDefault();
            input.current.dash = true;
          }}
          onClick={(event) => {
            if (event.detail === 0) input.current.dash = true;
          }}
        >
          <Zap size={22} />
          {dash ? `${dash}s` : "Esquiva"}
        </button>
        <button
          type="button"
          className="arcade-fire"
          aria-label="Disparar; mantén pulsado para disparar continuamente"
          onPointerDown={(event) => {
            event.preventDefault();
            event.currentTarget.setPointerCapture(event.pointerId);
            input.current.fire = true;
          }}
          onPointerUp={() => {
            input.current.fire = false;
          }}
          onPointerCancel={() => {
            input.current.fire = false;
          }}
          onLostPointerCapture={() => {
            input.current.fire = false;
          }}
          onKeyDown={(event) => {
            if (event.code === "Enter" || event.code === "Space") {
              event.preventDefault();
              input.current.fire = true;
            }
          }}
          onKeyUp={(event) => {
            if (event.code === "Enter" || event.code === "Space")
              input.current.fire = false;
          }}
          onBlur={() => {
            input.current.fire = false;
          }}
        >
          <Crosshair size={30} />
          <span>Disparar</span>
        </button>
      </div>
    </div>
  );
}

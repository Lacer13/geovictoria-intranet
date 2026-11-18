import { useRef, useState } from "react";
import {
  ArrowRight,
  Gift,
  Pause,
  Play,
  Snowflake,
  Volume2,
  VolumeX,
} from "lucide-react";
import Modal from "./Modal";

export default function LoadingScreen({ onComplete, motionAllowed = true }) {
  const video = useRef(null);
  const autoplay =
    motionAllowed &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [paused, setPaused] = useState(!autoplay);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState(false);
  const togglePlayback = () => {
    if (!video.current) return;
    if (video.current.paused) video.current.play().catch(() => setPaused(true));
    else video.current.pause();
  };
  const toggleSound = () => {
    if (!video.current) return;
    video.current.muted = !video.current.muted;
    setMuted(video.current.muted);
  };
  return (
    <Modal
      title="La Navidad llega con VictorIA"
      onClose={onComplete}
      className="victoria-welcome-modal"
    >
      <div className="victoria-welcome-stage">
        <video
          ref={video}
          autoPlay={autoplay}
          muted={muted}
          playsInline
          preload="auto"
          poster="/victoria-navidad-poster.jpg"
          aria-label="VictorIA llega en un trineo entre copos de nieve para darte la bienvenida"
          onPlay={() => setPaused(false)}
          onPause={() => setPaused(true)}
          onTimeUpdate={() =>
            setProgress(
              Math.min(
                100,
                (video.current.currentTime / (video.current.duration || 10)) *
                  100,
              ),
            )
          }
          onEnded={onComplete}
          onError={() => {
            setFailed(true);
            setPaused(true);
          }}
        >
          <source src="/victoria-navidad.mp4" type="video/mp4" />
        </video>
        <div className="victoria-welcome-shade" />
        <div className="victoria-welcome-copy">
          <span>
            <Snowflake size={14} /> NAVIDAD EN GEOVICTORIA
          </span>
          <h2>
            ¡Hola, equipo!
            <br />
            La magia ya llegó.
          </h2>
          <p>VictorIA trae un saludo y muchas ganas de celebrar contigo.</p>
          <button className="btn victoria-enter" onClick={onComplete}>
            Entrar a mi intranet <ArrowRight size={16} />
          </button>
        </div>
        <button className="victoria-skip" onClick={onComplete}>
          Saltar bienvenida <ArrowRight size={14} />
        </button>
        {!failed && (
          <div className="victoria-video-controls">
            <button
              onClick={togglePlayback}
              aria-label={
                paused ? "Reproducir bienvenida" : "Pausar bienvenida"
              }
            >
              {paused ? <Play size={17} /> : <Pause size={17} />}
            </button>
            <button
              onClick={toggleSound}
              aria-label={
                muted
                  ? "Activar sonido de la bienvenida"
                  : "Silenciar bienvenida"
              }
            >
              {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
              <span>{muted ? "Activar sonido" : "Con sonido"}</span>
            </button>
          </div>
        )}
        <div className="victoria-video-progress" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="victoria-welcome-foot">
        <Gift size={16} />
        <span>
          {failed
            ? "El video no está disponible. Puedes entrar a tu intranet."
            : paused
              ? "Una pausa para recibirte. Reproduce el saludo cuando quieras."
              : "Conectados, hacemos esta Navidad más especial."}
        </span>
        <small>Puedes volver a verlo desde Mi inicio.</small>
      </div>
    </Modal>
  );
}

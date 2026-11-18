import { useRef, useState } from "react";
import {
  ArrowRight,
  Gift,
  Pause,
  Play,
  RotateCcw,
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
  const [ended, setEnded] = useState(false);
  const replay = (withMusic = false) => {
    if (!video.current) return;
    video.current.currentTime = 0;
    setProgress(0);
    setEnded(false);
    if (withMusic) {
      video.current.muted = false;
      setMuted(false);
    }
    video.current.play().catch(() => setPaused(true));
  };
  const togglePlayback = () => {
    if (!video.current) return;
    if (ended) replay();
    else if (video.current.paused)
      video.current.play().catch(() => setPaused(true));
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
          poster="/victoria-navidad-saludo-v3.jpg"
          aria-label="VictorIA llega en un trineo, saluda con la mano y guiña un ojo, con música navideña de campanas"
          onPlay={() => setPaused(false)}
          onPause={() => setPaused(true)}
          onTimeUpdate={() =>
            setProgress(
              Math.min(
                100,
                (video.current.currentTime / (video.current.duration || 12)) *
                  100,
              ),
            )
          }
          onEnded={() => {
            setEnded(true);
            setPaused(true);
            setProgress(100);
          }}
          onError={() => {
            setFailed(true);
            setPaused(true);
          }}
        >
          <source src="/victoria-navidad-saludo-v3.mp4" type="video/mp4" />
          <track
            kind="captions"
            src="/victoria-navidad-saludo-v3.vtt"
            srcLang="es"
            label="Español"
          />
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
          <p>Un saludo de VictorIA, con música navideña.</p>
          <div className="victoria-welcome-actions">
            {!failed && (
              <button
                className="btn victoria-listen"
                onClick={() => replay(true)}
              >
                <Volume2 size={16} />{" "}
                {ended
                  ? "Repetir con música"
                  : muted
                    ? "Ver con música"
                    : "Volver a ver desde el inicio"}
              </button>
            )}
            <button className="btn victoria-enter" onClick={onComplete}>
              Entrar a mi intranet <ArrowRight size={16} />
            </button>
          </div>
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
              <span>{muted ? "Activar música" : "Con música"}</span>
            </button>
          </div>
        )}
        {!failed && (
          <label className="victoria-video-seek">
            <span className="sr-only">Avance del video de VictorIA</span>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={Number.isFinite(progress) ? progress : 0}
              onChange={(e) => {
                if (!video.current?.duration) return;
                const value = Number(e.target.value);
                video.current.currentTime =
                  (video.current.duration * value) / 100;
                setProgress(value);
                setEnded(false);
              }}
            />
          </label>
        )}
      </div>
      <div className="victoria-welcome-foot">
        <Gift size={16} />
        <span>
          {failed
            ? "Video no disponible. Puedes continuar."
            : ended
              ? "¡Feliz Navidad, equipo!"
              : muted
                ? "Activa la música para escuchar el saludo."
                : paused
                  ? "Video en pausa."
                  : "Disfruta el saludo."}
        </span>
        {!failed && (
          <button className="victoria-repeat" onClick={() => replay()}>
            <RotateCcw size={14} /> Volver a ver el saludo
          </button>
        )}
        <small>Reábrelo desde el menú: Video de VictorIA.</small>
      </div>
    </Modal>
  );
}

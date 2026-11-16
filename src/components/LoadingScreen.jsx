import { useState, useEffect } from "react";

export default function LoadingScreen({ onComplete }) {
  const [fadeOut, setFadeOut] = useState(false);
  useEffect(() => {
    const timer = setTimeout(
      fadeOut ? onComplete : () => setFadeOut(true),
      fadeOut ? 800 : 10000,
    );
    return () => clearTimeout(timer);
  }, [fadeOut, onComplete]);
  return (
    <div
      className={`loading-screen ${fadeOut ? "fade-out" : ""}`}
      role="status"
    >
      <video
        className="loading-video"
        autoPlay
        muted
        playsInline
        onEnded={() => setFadeOut(true)}
        onError={() => setFadeOut(true)}
      >
        <source src="/Nuevo Video VictorIA.mp4" type="video/mp4" />
      </video>
      <h2>VictorIA te da la bienvenida</h2>
      <p>Preparando tu espacio…</p>
      <button className="btn btn-secondary" onClick={onComplete}>
        Continuar
      </button>
    </div>
  );
}

import React, { useState, useEffect } from 'react';

const LoadingScreen = ({ onComplete }) => {
  const [fadeOut, setFadeOut] = useState(false);

  const handleVideoEnded = () => {
    setFadeOut(true);
    setTimeout(() => onComplete(), 800);
  };

  // Respaldo de seguridad (por si el video falla en cargar)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!fadeOut) {
        handleVideoEnded();
      }
    }, 10000); 
    
    return () => clearTimeout(timer);
  }, [fadeOut, onComplete]);

  return (
    <div className={`loading-screen ${fadeOut ? 'fade-out' : ''}`}>
      <video 
        className="loading-video" 
        autoPlay 
        muted 
        playsInline
        onEnded={handleVideoEnded}
      >
        <source src="/Nuevo Video VictorIA.mp4" type="video/mp4" />
        Tu navegador no soporta videos.
      </video>
      <h2 className="animate-fade-in" style={{ color: 'var(--geo-primary-light)', marginTop: '1rem' }}>
        Iniciando Soporte Interno...
      </h2>
      <p className="animate-fade-in" style={{ animationDelay: '0.5s', color: 'var(--text-muted)' }}>
        VictorIA te da la bienvenida
      </p>
    </div>
  );
};

export default LoadingScreen;

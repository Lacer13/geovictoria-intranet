import React, { useState, useEffect } from 'react';

const LoadingScreen = ({ onComplete }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // The video is around 5-10 seconds, we can hide it after 3.5s or listen to the ended event.
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => onComplete(), 800); // wait for fade transition
    }, 4000);
    
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={`loading-screen ${fadeOut ? 'fade-out' : ''}`}>
      <video 
        className="loading-video" 
        autoPlay 
        muted 
        playsInline
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

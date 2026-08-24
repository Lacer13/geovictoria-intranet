import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import GamePage from './components/GamePage';
import LoadingScreen from './components/LoadingScreen';
import OrgChart from './components/OrgChart';
import HelpDirectory from './components/HelpDirectory';
import Wiki from './components/Wiki';
import Admin from './components/Admin';

const AppContent = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const triggerNavigation = (path) => {
    setIsLoading(true);
    setTimeout(() => {
      navigate(path);
      setIsLoading(false); 
    }, 2500); // 2.5 segundos de animación de carga
  };

  if (isLoading) {
    return <LoadingScreen onComplete={() => {}} />;
  }

  return (
    <>
      {/* Header global (se oculta en el juego) */}
      {location.pathname !== '/juego' && (
        <header style={{ padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(11,15,25,0.8)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 100 }}>
          <img src="/Logo geovictoria.png?v=2" alt="GeoVictoria" style={{ height: '40px' }} />
          <div>
            <h1 style={{ color: 'white', margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>Portal de Soporte Interno</h1>
            <p style={{ color: 'var(--geo-secondary)', margin: 0, fontSize: '0.9rem' }}>Centro de Recursos y Ayuda</p>
          </div>
        </header>
      )}

      {/* Contenido principal con las rutas */}
      <main style={{ padding: location.pathname === '/juego' ? '0' : '0 0 2rem 0', height: location.pathname === '/juego' ? '100vh' : 'auto' }}>
        <Routes>
          <Route path="/" element={<Dashboard triggerNavigation={triggerNavigation} />} />
          <Route path="/juego" element={<GamePage />} />
          <Route path="/organigrama" element={<OrgChart />} />
          <Route path="/directorio" element={<HelpDirectory />} />
          <Route path="/wiki" element={<Wiki />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
    </>
  );
};

const App = () => {
  const [initialLoading, setInitialLoading] = useState(true);

  if (initialLoading) {
    return <LoadingScreen onComplete={() => setInitialLoading(false)} />;
  }

  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;

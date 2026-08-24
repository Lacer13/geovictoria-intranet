import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import GamePage from './components/GamePage';
import LoadingScreen from './components/LoadingScreen';
import OrgChart from './components/OrgChart';
import HelpDirectory from './components/HelpDirectory';
import Wiki from './components/Wiki';
import Admin from './components/Admin';

import DynamicHeader from './components/DynamicHeader';

const AppContent = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const triggerNavigation = (path) => {
    setIsLoading(true);
    setTimeout(() => {
      navigate(path);
      setIsLoading(false); 
    }, 2500); // 2.5 segundos de animacin de carga
  };

  if (isLoading) {
    return <LoadingScreen onComplete={() => {}} />;
  }

  return (
    <>
      {/* Header global (se oculta en el juego y admin opcionalmente, pero lo dejaremos para todos menos juego) */}
      {location.pathname !== '/juego' && <DynamicHeader />}

      {/* Contenido principal con las rutas */}
      <main className="animate-fade-in" style={{ padding: location.pathname === '/juego' ? '0' : '0 0 2rem 0', height: location.pathname === '/juego' ? '100vh' : 'auto' }}>
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

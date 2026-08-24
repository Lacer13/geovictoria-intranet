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

import Sidebar from './components/Sidebar';
import { Toaster } from 'react-hot-toast';

const AppContent = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLightMode, setIsLightMode] = useState(() => localStorage.getItem('geoTheme') === 'light');
  const navigate = useNavigate();
  const location = useLocation();

  const toggleTheme = () => {
    const newMode = !isLightMode;
    setIsLightMode(newMode);
    localStorage.setItem('geoTheme', newMode ? 'light' : 'dark');
    if (newMode) {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  };

  React.useEffect(() => {
    if (isLightMode) {
      document.body.classList.add('light-mode');
    }
  }, [isLightMode]);

  const triggerNavigation = (path) => {
    setIsLoading(true);
    setTimeout(() => {
      navigate(path);
      setIsLoading(false); 
    }, 2500);
  };

  if (isLoading) {
    return <LoadingScreen onComplete={() => {}} />;
  }

  const isGameRoute = location.pathname === '/juego';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', overflowX: 'hidden' }}>
      {/* Sidebar Fijo */}
      {!isGameRoute && <Sidebar />}

      {/* Contenedor Principal (Main) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: isGameRoute ? '100%' : 'calc(100% - 260px)' }}>
        
        {!isGameRoute && <DynamicHeader isLightMode={isLightMode} toggleTheme={toggleTheme} />}

        <main className="animate-fade-in" style={{ padding: isGameRoute ? '0' : '0 1rem 2rem 1rem', flex: 1 }}>
          <Routes>
            <Route path="/" element={<Dashboard triggerNavigation={triggerNavigation} />} />
            <Route path="/juego" element={<GamePage />} />
            <Route path="/organigrama" element={<OrgChart />} />
            <Route path="/directorio" element={<HelpDirectory />} />
            <Route path="/wiki" element={<Wiki />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const App = () => {
  const [initialLoading, setInitialLoading] = useState(true);

  if (initialLoading) {
    return <LoadingScreen onComplete={() => setInitialLoading(false)} />;
  }

  return (
    <Router>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--glass-bg)',
            color: 'var(--text-main)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--glass-border)',
            borderRadius: '12px',
          },
          success: {
            iconTheme: {
              primary: 'var(--geo-secondary)',
              secondary: 'white',
            },
          },
        }} 
      />
      <AppContent />
    </Router>
  );
};

export default App;

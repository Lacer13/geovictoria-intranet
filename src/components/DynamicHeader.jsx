import React, { useState, useEffect } from 'react';
import { Sun, Moon, Sunset, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DynamicHeader = ({ isLightMode, toggleTheme }) => {
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hour = time.getHours();
  let greeting = 'Buenas noches';
  let Icon = Moon;
  let iconColor = '#a29bfe';

  if (hour >= 5 && hour < 12) {
    greeting = 'Buenos días';
    Icon = Sun;
    iconColor = '#fdcb6e';
  } else if (hour >= 12 && hour < 19) {
    greeting = 'Buenas tardes';
    Icon = Sunset;
    iconColor = '#ff7675';
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  return (
    <header className="glass-panel" style={{ 
      margin: '1rem', 
      padding: '1rem 2rem', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      position: 'sticky', 
      top: '1rem', 
      zIndex: 100,
      background: 'var(--glass-bg)',
      borderRadius: '20px',
      borderBottom: '1px solid var(--glass-border)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', cursor: 'pointer' }} onClick={() => navigate('/')}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Icon size={20} color={iconColor} className="animate-fade-in" />
            <h1 style={{ color: 'var(--text-main)', margin: 0, fontSize: '1.3rem', fontWeight: '600' }}>
              {greeting}, <span style={{ color: 'var(--geo-primary-light)' }}>Equipo</span>
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem', textTransform: 'capitalize' }}>
            {formatDate(time)}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button 
          onClick={toggleTheme}
          style={{
            background: 'rgba(0,0,0,0.1)',
            border: '1px solid var(--border-color)',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-main)',
            transition: 'all var(--transition-fast)'
          }}
          title={isLightMode ? "Cambiar a Modo Oscuro" : "Cambiar a Modo Claro"}
        >
          {isLightMode ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <div className="glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '12px', background: 'rgba(0,0,0,0.1)' }}>
          <Clock size={16} color="var(--geo-primary-light)" />
          <span style={{ color: 'var(--text-main)', fontWeight: '500', fontFamily: 'monospace', fontSize: '1.1rem' }}>
            {formatTime(time)}
          </span>
        </div>
      </div>
    </header>
  );
};

export default DynamicHeader;

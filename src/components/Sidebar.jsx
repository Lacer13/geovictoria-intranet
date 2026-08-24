import React from 'react';
import { Home, Users, LifeBuoy, BookOpen, Gamepad2, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: Home, label: 'Inicio' },
    { path: '/organigrama', icon: Users, label: 'Organigrama' },
    { path: '/directorio', icon: LifeBuoy, label: 'Directorio' },
    { path: '/wiki', icon: BookOpen, label: 'Wiki' },
    { path: '/juego', icon: Gamepad2, label: 'Pausa Activa' },
  ];

  return (
    <aside className="glass-panel animate-fade-in" style={{ 
      width: '260px', 
      margin: '1rem 0 1rem 1rem', 
      padding: '1.5rem 1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem',
      position: 'sticky',
      top: '1rem',
      height: 'calc(100vh - 2rem)',
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem 0 1.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
        <img src="/Logo geovictoria.png?v=2" alt="GeoVictoria" style={{ height: '35px', filter: 'drop-shadow(0 0 8px rgba(0,196,204,0.3))' }} />
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.8rem 1rem',
                background: isActive ? 'linear-gradient(90deg, rgba(0, 86, 179, 0.2), transparent)' : 'transparent',
                border: 'none',
                borderLeft: isActive ? '3px solid var(--geo-primary-light)' : '3px solid transparent',
                borderRadius: '0 8px 8px 0',
                color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                fontFamily: 'var(--font-heading)',
                fontSize: '1rem',
                fontWeight: isActive ? '600' : '400',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--text-main)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--text-muted)';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <Icon size={20} color={isActive ? 'var(--geo-primary-light)' : 'currentColor'} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
        <button
          onClick={() => navigate('/admin')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '0.8rem 1rem',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
            width: '100%',
            textAlign: 'left'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--geo-accent)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <Settings size={18} />
          Admin Panel
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

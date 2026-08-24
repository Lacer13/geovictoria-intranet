import React from 'react';
import { ArrowLeft, BookOpen, FileText, Shield, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Wiki = () => {
  const navigate = useNavigate();

  const categories = [
    {
      title: "Onboarding (Nuevos Ingresos)",
      icon: <Video size={32} color="#2ed573" />,
      color: "#2ed573",
      articles: [
        "Bienvenida a GeoVictoria",
        "Configuración de Correo y Accesos",
        "Valores y Cultura Corporativa"
      ]
    },
    {
      title: "Manuales de Producto",
      icon: <BookOpen size={32} color="#1e90ff" />,
      color: "#1e90ff",
      articles: [
        "Guía de Instalación en Terreno",
        "Resolución de Problemas de Hardware",
        "Uso de Plataforma Admin"
      ]
    },
    {
      title: "Políticas y RRHH",
      icon: <Shield size={32} color="#ffa502" />,
      color: "#ffa502",
      articles: [
        "Política de Vacaciones y Permisos",
        "Código de Ética Corporativo",
        "Beneficios para Empleados"
      ]
    },
    {
      title: "Procesos Internos",
      icon: <FileText size={32} color="#ff4757" />,
      color: "#ff4757",
      articles: [
        "Proceso de Rendición de Gastos",
        "Solicitud de Equipos de IT",
        "Protocolo de Emergencias"
      ]
    }
  ];

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/')} style={{ padding: '0.5rem' }}>
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 style={{ color: 'white', margin: 0 }}>Base de Conocimiento (Wiki)</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Toda la información de GeoVictoria en un solo lugar.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
        {categories.map((cat, i) => (
          <div key={i} className="glass-panel animate-fade-in" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', borderTop: `4px solid ${cat.color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' }}>
                {cat.icon}
              </div>
              <h2 style={{ color: 'white', fontSize: '1.3rem', margin: 0 }}>{cat.title}</h2>
            </div>
            
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {cat.articles.map((article, j) => (
                <li key={j} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateX(10px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: cat.color }}></div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>{article}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Wiki;

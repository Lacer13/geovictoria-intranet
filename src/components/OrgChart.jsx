import React from 'react';
import { ArrowLeft, Users, UserCircle, Briefcase, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const OrgChart = () => {
  const navigate = useNavigate();

  const DepartmentCard = ({ title, head, team, color }) => (
    <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', borderTop: `4px solid ${color}`, minWidth: '250px' }}>
      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '50%', marginBottom: '0.5rem' }}>
        <Briefcase color={color} size={32} />
      </div>
      <h3 style={{ color: 'white', margin: 0, fontSize: '1.2rem', textAlign: 'center' }}>{title}</h3>
      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.8rem', borderRadius: '8px', width: '100%', textAlign: 'center' }}>
        <p style={{ color: 'var(--geo-secondary)', fontWeight: 'bold', margin: '0 0 0.2rem 0', fontSize: '0.9rem' }}>Director/Gerente</p>
        <p style={{ color: 'white', margin: 0 }}>{head}</p>
      </div>
      <div style={{ width: '100%' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={14} /> Equipo Principal:
        </p>
        <ul style={{ color: 'white', fontSize: '0.9rem', paddingLeft: '1.5rem', margin: 0 }}>
          {team.map((member, i) => (
            <li key={i} style={{ marginBottom: '0.3rem' }}>{member}</li>
          ))}
        </ul>
      </div>
    </div>
  );

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/')} style={{ padding: '0.5rem' }}>
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 style={{ color: 'white', margin: 0 }}>Organigrama GeoVictoria</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Estructura organizativa de la empresa</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
        
        {/* CEO / Gerencia General */}
        <div className="glass-panel animate-float" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'linear-gradient(135deg, rgba(0,196,204,0.2) 0%, rgba(11,15,25,0.8) 100%)', border: '1px solid var(--geo-secondary)' }}>
          <UserCircle size={64} color="var(--geo-secondary)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ color: 'white', margin: '0 0 0.5rem 0' }}>Gerencia General</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', margin: 0 }}>Juan Pérez (CEO)</p>
        </div>

        <ChevronDown size={32} color="var(--text-muted)" />

        {/* Departamentos */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '2rem', width: '100%' }}>
          <DepartmentCard 
            title="Operaciones" 
            head="María González" 
            team={["Coordinadores de Terreno", "Logística", "Supervisores"]} 
            color="#2ed573" 
          />
          <DepartmentCard 
            title="Finanzas y Facturación" 
            head="Carlos Rodríguez" 
            team={["Analista Contable", "Ejecutivos de Cobranza", "Nóminas"]} 
            color="#ffa502" 
          />
          <DepartmentCard 
            title="Soporte y Tecnología" 
            head="Ana Martínez" 
            team={["Mesa de Ayuda (Helpdesk)", "Desarrollo", "Infraestructura"]} 
            color="#1e90ff" 
          />
          <DepartmentCard 
            title="Recursos Humanos" 
            head="Luis Fernández" 
            team={["Reclutamiento", "Clima Laboral", "Capacitación"]} 
            color="#ff4757" 
          />
        </div>

      </div>
    </div>
  );
};

export default OrgChart;

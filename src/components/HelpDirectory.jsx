import React, { useState } from 'react';
import { ArrowLeft, Search, Phone, Mail, MessageSquare, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HelpDirectory = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const contacts = [
    { department: "Administración", name: "Rodrigo Cerna", email: "Rcerna@geovictoria.com", color: "#1e90ff" },
    { department: "Cobranzas", name: "Leidi Lizana", email: "llizana@geovictoria.com", color: "#ffa502" },
    { department: "RRHH", name: "Nora Larriega", email: "nlarriega@geovictoria.com", color: "#ff4757" },
    { department: "Operaciones y ST", name: "Ronny Chacon", email: "rchacon@geovictoria.com", color: "#2ed573" },
    { department: "SMB", name: "Braulio Corcuera", email: "Bcorcuera@geovictoria.com", color: "#00c4cc" },
    { department: "Comercial", name: "Diego Bendezu", email: "dbendezu@geovictoria.com", color: "#1e90ff" },
    { department: "Preventa", name: "Alexander Ludeña", email: "aludeña@geovictoria.com", color: "#ffa502" },
    { department: "Eventos", name: "Leslie Rocha", email: "lrocha@geovictoria.com", color: "#ff4757" },
    { department: "Enterprise", name: "Luis Alcala", email: "lalcala@geovictoria.com", color: "#2ed573" },
    { department: "SDR", name: "Diego Santa Maria", email: "dsantamaria@geovictoria.com", color: "#00c4cc" },
    { department: "Partners", name: "Dante Luna", email: "dluna@geovictoria.com", color: "#1e90ff" },
    { department: "Country Manager", name: "Jorge Delgado", email: "jdelgado@geovictoria.com", color: "#ffa502" },
  ];

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/')} style={{ padding: '0.5rem' }}>
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 style={{ color: 'var(--text-main)', margin: 0 }}>Directorio de Soporte</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Encuentra a la persona indicada para resolver tus dudas</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Search color="var(--text-muted)" />
        <input 
          type="text" 
          placeholder="Buscar por área o nombre..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ 
            background: 'transparent', 
            border: 'none', 
            color: 'var(--text-main)', 
            fontSize: '1.1rem', 
            width: '100%',
            outline: 'none'
          }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {filteredContacts.map((contact, i) => (
          <div key={i} className="glass-panel animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: `4px solid ${contact.color}` }}>
            <div>
              <p style={{ color: 'var(--geo-secondary)', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 0.5rem 0' }}>
                Área / Puesto
              </p>
              <h3 style={{ color: 'var(--text-main)', margin: 0, fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={20} color={contact.color} /> {contact.department}
              </h3>
            </div>
            
            <div style={{ background: 'var(--glass-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              <p style={{ color: 'var(--text-main)', margin: '0 0 1rem 0', fontWeight: 'bold' }}>👤 {contact.name}</p>
              <a href={`mailto:${contact.email}`} className="btn btn-secondary" style={{ padding: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', fontSize: '0.9rem', textDecoration: 'none', width: '100%' }}>
                <Mail size={16} /> Enviar Correo
              </a>
            </div>
          </div>
        ))}

        {filteredContacts.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No se encontraron contactos para tu búsqueda. Prueba con otros términos.
          </div>
        )}
      </div>
    </div>
  );
};

export default HelpDirectory;

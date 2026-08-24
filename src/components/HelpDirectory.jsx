import React, { useState } from 'react';
import { ArrowLeft, Search, Phone, Mail, MessageSquare, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HelpDirectory = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const contacts = [
    {
      issue: "Dudas de Facturación o Nómina",
      department: "Finanzas",
      name: "Carlos Rodríguez",
      phone: "+56 9 1234 5678",
      email: "finanzas@geovictoria.com",
      color: "#ffa502"
    },
    {
      issue: "Problemas en Terreno o Clientes",
      department: "Operaciones",
      name: "María González",
      phone: "+56 9 2345 6789",
      email: "operaciones@geovictoria.com",
      color: "#2ed573"
    },
    {
      issue: "Falla en Plataforma o Soporte Técnico",
      department: "Soporte IT",
      name: "Ana Martínez",
      phone: "+56 9 3456 7890",
      email: "soporte@geovictoria.com",
      color: "#1e90ff"
    },
    {
      issue: "Vacaciones, Permisos o Clima Laboral",
      department: "Recursos Humanos",
      name: "Luis Fernández",
      phone: "+56 9 4567 8901",
      email: "rrhh@geovictoria.com",
      color: "#ff4757"
    }
  ];

  const filteredContacts = contacts.filter(c => 
    c.issue.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/')} style={{ padding: '0.5rem' }}>
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 style={{ color: 'white', margin: 0 }}>Directorio de Soporte</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Encuentra a la persona indicada para resolver tus dudas</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Search color="var(--text-muted)" />
        <input 
          type="text" 
          placeholder="Ej: Facturación, Vacaciones, Fallas..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ 
            background: 'transparent', 
            border: 'none', 
            color: 'white', 
            fontSize: '1.1rem', 
            width: '100%',
            outline: 'none'
          }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {filteredContacts.map((contact, i) => (
          <div key={i} className="glass-panel animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: `4px solid ${contact.color}` }}>
            <div>
              <p style={{ color: 'var(--geo-secondary)', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 0.5rem 0' }}>
                {contact.department}
              </p>
              <h3 style={{ color: 'white', margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={18} color={contact.color} /> {contact.issue}
              </h3>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
              <p style={{ color: 'white', margin: '0 0 1rem 0', fontWeight: 'bold' }}>Contacto: {contact.name}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <a href={`mailto:${contact.email}`} className="btn btn-secondary" style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', fontSize: '0.9rem', textDecoration: 'none' }}>
                  <Mail size={16} /> {contact.email}
                </a>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <a href={`tel:${contact.phone}`} className="btn btn-primary" style={{ padding: '0.5rem', flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', fontSize: '0.9rem', textDecoration: 'none' }}>
                    <Phone size={16} /> Llamar
                  </a>
                  <a href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ padding: '0.5rem', flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', fontSize: '0.9rem', textDecoration: 'none', background: '#25D366' }}>
                    <MessageSquare size={16} /> WhatsApp
                  </a>
                </div>
              </div>
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

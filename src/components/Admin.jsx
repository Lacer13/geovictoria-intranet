import React, { useState, useEffect } from 'react';
import { ArrowLeft, Lock, Inbox, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

const Admin = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (isAuthenticated) {
      loadMessages();
    }
  }, [isAuthenticated]);

  const loadMessages = async () => {
    if (db) {
      try {
        const querySnapshot = await getDocs(collection(db, "feedbacks"));
        const msgs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        msgs.sort((a, b) => new Date(b.date) - new Date(a.date));
        setMessages(msgs);
      } catch (err) {
        console.error("Error cargando mensajes de Firebase:", err);
      }
    } else {
      const savedMessages = JSON.parse(localStorage.getItem('geoFeedback') || '[]');
      savedMessages.sort((a, b) => new Date(b.date) - new Date(a.date));
      setMessages(savedMessages);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (email === 'nlarriega@geovictoria.com' && password === 'admin123') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Credenciales incorrectas. Acceso denegado.');
    }
  };

  const handleDelete = async (index, msgId) => {
    if(window.confirm('¿Estás seguro de eliminar este reporte?')) {
      if (db && msgId) {
        try {
          await deleteDoc(doc(db, "feedbacks", msgId));
          loadMessages();
        } catch (err) {
          console.error("Error eliminando documento de Firebase:", err);
        }
      } else {
        const newMessages = [...messages];
        newMessages.splice(index, 1);
        setMessages(newMessages);
        localStorage.setItem('geoFeedback', JSON.stringify(newMessages));
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div className="glass-panel animate-fade-in" style={{ padding: '3rem', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1.5rem', borderTop: '4px solid #ffa502' }}>
          
          <button onClick={() => navigate('/')} className="btn btn-secondary" style={{ alignSelf: 'flex-start', padding: '0.5rem' }}>
            <ArrowLeft size={20} />
          </button>
          
          <div style={{ textAlign: 'center' }}>
            <Lock size={48} color="#ffa502" style={{ margin: '0 auto 1rem auto' }} />
            <h2 style={{ color: 'white', margin: 0 }}>Acceso Confidencial</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Buzón exclusivo de Gerencia</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input 
              type="email" 
              placeholder="Correo Electrónico" 
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input 
              type="password" 
              placeholder="Contraseña" 
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p style={{ color: '#ff4757', fontSize: '0.85rem', margin: 0, textAlign: 'center' }}>{error}</p>}
            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', background: '#ffa502', borderColor: '#ffa502', color: 'black' }}>
              Ingresar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/')} style={{ padding: '0.5rem' }}>
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Inbox color="#ffa502" />
              Buzón de Reportes Internos
            </h1>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Conectado como: <span style={{ color: '#ffa502' }}>{email}</span></p>
          </div>
        </div>
        <button className="btn btn-secondary" onClick={() => setIsAuthenticated(false)}>Cerrar Sesión</button>
      </div>

      {messages.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center' }}>
          <Inbox size={64} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
          <h2 style={{ color: 'white' }}>Bandeja Vacía</h2>
          <p style={{ color: 'var(--text-muted)' }}>No hay nuevas solicitudes o reportes en este momento.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.map((msg, index) => (
            <div key={index} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: msg.isAnonymous ? '4px solid #ff4757' : '4px solid #1e90ff' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                <div>
                  <h3 style={{ color: 'white', margin: '0 0 0.3rem 0', fontSize: '1.2rem' }}>
                    {msg.isAnonymous ? '🕵️‍♂️ Reporte Anónimo' : `👤 De: ${msg.name}`}
                  </h3>
                  <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {!msg.isAnonymous && <span><strong>Depto:</strong> {msg.department}</span>}
                    <span><strong>Fecha:</strong> {new Date(msg.date).toLocaleString()}</span>
                  </div>
                </div>
                <button onClick={() => handleDelete(index, msg.id)} className="btn btn-secondary" style={{ padding: '0.5rem', color: '#ff4757', borderColor: 'transparent' }} title="Eliminar mensaje">
                  <Trash2 size={20} />
                </button>
              </div>

              <div style={{ color: 'white', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                {msg.message}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Admin;

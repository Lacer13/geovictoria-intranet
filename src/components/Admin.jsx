import React, { useState, useEffect } from 'react';
import { ArrowLeft, Lock, Inbox, Trash2, Megaphone, Plus, Star, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, deleteDoc, doc, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

const Admin = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('feedbacks'); // 'feedbacks' o 'news'

  // Data states
  const [messages, setMessages] = useState([]);
  const [news, setNews] = useState([]);

  // Form states for News
  const [newsTitle, setNewsTitle] = useState('');
  const [newsDesc, setNewsDesc] = useState('');
  const [newsType, setNewsType] = useState('anuncio');

  useEffect(() => {
    if (isAuthenticated) {
      loadMessages();
      loadNews();
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
        console.error("Error cargando feedbacks:", err);
      }
    }
  };

  const loadNews = async () => {
    if (db) {
      try {
        const querySnapshot = await getDocs(collection(db, "news"));
        const newsItems = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        newsItems.sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date));
        setNews(newsItems);
      } catch (err) {
        console.error("Error cargando noticias:", err);
      }
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

  const handleDeleteFeedback = async (msgId) => {
    if(window.confirm('¿Estás seguro de eliminar este reporte?')) {
      if (db && msgId) {
        try {
          await deleteDoc(doc(db, "feedbacks", msgId));
          loadMessages();
        } catch (err) {
          console.error("Error eliminando documento:", err);
        }
      }
    }
  };

  const handleDeleteNews = async (newsId) => {
    if(window.confirm('¿Estás seguro de eliminar esta noticia?')) {
      if (db && newsId) {
        try {
          await deleteDoc(doc(db, "news", newsId));
          loadNews();
        } catch (err) {
          console.error("Error eliminando noticia:", err);
        }
      }
    }
  };

  const handleAddNews = async (e) => {
    e.preventDefault();
    if (!db) return;
    try {
      const now = new Date();
      await addDoc(collection(db, "news"), {
        title: newsTitle,
        desc: newsDesc,
        type: newsType,
        date: now.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) + ' ' + now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        timestamp: now.toISOString()
      });
      setNewsTitle('');
      setNewsDesc('');
      loadNews();
      alert("Noticia publicada exitosamente.");
    } catch (err) {
      console.error("Error agregando noticia:", err);
      alert("Hubo un error al publicar la noticia.");
    }
  };

  const renderIconForNews = (type) => {
    switch (type) {
      case 'logro': return <Star color="#ffa502" size={20} />;
      case 'cumpleaños': return <Calendar color="#ff4757" size={20} />;
      default: return <Megaphone color="#1e90ff" size={20} />;
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
            <h2 style={{ color: 'var(--text-main)', margin: 0 }}>Acceso Confidencial</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Panel de Administración de Plataforma</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input type="email" placeholder="Correo Electrónico" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" placeholder="Contraseña" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} required />
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
      
      {/* Admin Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--glass-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div>
            <h1 style={{ color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock color="#ffa502" /> Panel de Administración
            </h1>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Conectado como: <span style={{ color: '#ffa502' }}>{email}</span></p>
          </div>
        </div>
        <button className="btn btn-secondary" onClick={() => setIsAuthenticated(false)}>Cerrar Sesión</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('feedbacks')}
          className="btn"
          style={{ background: activeTab === 'feedbacks' ? 'var(--geo-primary-light)' : 'transparent', color: activeTab === 'feedbacks' ? 'white' : 'var(--text-muted)' }}
        >
          <Inbox size={18} /> Buzón de Reportes
        </button>
        <button 
          onClick={() => setActiveTab('news')}
          className="btn"
          style={{ background: activeTab === 'news' ? 'var(--geo-secondary)' : 'transparent', color: activeTab === 'news' ? 'white' : 'var(--text-muted)' }}
        >
          <Megaphone size={18} /> Gestor de Noticias
        </button>
      </div>

      {/* Tab Content: Feedbacks */}
      {activeTab === 'feedbacks' && (
        <>
          {messages.length === 0 ? (
            <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center' }}>
              <Inbox size={64} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
              <h2 style={{ color: 'var(--text-main)' }}>Bandeja Vacía</h2>
              <p style={{ color: 'var(--text-muted)' }}>No hay nuevas solicitudes o reportes en este momento.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {messages.map((msg, index) => (
                <div key={index} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: msg.isAnonymous ? '4px solid #ff4757' : '4px solid #1e90ff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                    <div>
                      <h3 style={{ color: 'var(--text-main)', margin: '0 0 0.3rem 0', fontSize: '1.2rem' }}>
                        {msg.isAnonymous ? '🕵️ Reporte Anónimo' : `👤 De: ${msg.name}`}
                      </h3>
                      <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {!msg.isAnonymous && <span><strong>Depto:</strong> {msg.department}</span>}
                        <span><strong>Fecha:</strong> {new Date(msg.date).toLocaleString()}</span>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteFeedback(msg.id)} className="btn btn-secondary" style={{ padding: '0.5rem', color: '#ff4757', borderColor: 'transparent' }} title="Eliminar mensaje">
                      <Trash2 size={20} />
                    </button>
                  </div>
                  <div style={{ color: 'var(--text-main)', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                    {msg.message}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Tab Content: News */}
      {activeTab === 'news' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          
          {/* Create News Form */}
          <div className="glass-panel" style={{ padding: '1.5rem', height: 'fit-content' }}>
            <h2 style={{ color: 'var(--text-main)', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus color="var(--geo-secondary)" /> Nueva Noticia
            </h2>
            <form onSubmit={handleAddNews} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label">Título Breve</label>
                <input type="text" className="input-field" value={newsTitle} onChange={e => setNewsTitle(e.target.value)} required maxLength={50} />
              </div>
              <div className="input-group">
                <label className="input-label">Tipo de Anuncio</label>
                <select className="input-field" value={newsType} onChange={e => setNewsType(e.target.value)} style={{ background: 'var(--glass-bg)', color: 'var(--text-main)' }}>
                  <option value="anuncio">Anuncio General / Informativo</option>
                  <option value="logro">Logro / Hito Corporativo</option>
                  <option value="cumpleaños">Celebración / Cumpleaños</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Descripción Detallada</label>
                <textarea className="input-field" rows="3" value={newsDesc} onChange={e => setNewsDesc(e.target.value)} required></textarea>
              </div>
              <button type="submit" className="btn btn-primary" style={{ background: 'var(--geo-secondary)', borderColor: 'var(--geo-secondary)' }}>
                Publicar Noticia
              </button>
            </form>
          </div>

          {/* Existing News List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 style={{ color: 'var(--text-main)', margin: 0 }}>Noticias Publicadas</h2>
            {news.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No hay noticias publicadas.</p>
            ) : (
              news.map((item) => (
                <div key={item.id} className="glass-panel" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderLeft: '3px solid var(--geo-secondary)' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      {renderIconForNews(item.type)}
                      <h4 style={{ color: 'var(--text-main)', margin: 0 }}>{item.title}</h4>
                    </div>
                    <p style={{ color: 'var(--text-muted)', margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>{item.desc}</p>
                    <span style={{ fontSize: '0.8rem', color: 'var(--geo-secondary)' }}>{item.date}</span>
                  </div>
                  <button onClick={() => handleDeleteNews(item.id)} className="btn btn-secondary" style={{ padding: '0.5rem', color: '#ff4757', borderColor: 'transparent' }} title="Eliminar noticia">
                    <Trash2 size={20} />
                  </button>
                </div>
              ))
            )}
          </div>

        </div>
      )}

    </div>
  );
};

export default Admin;

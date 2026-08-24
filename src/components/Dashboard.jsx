import React, { useEffect, useState } from 'react';
import { Gamepad2, Users, LifeBuoy, BookOpen, Trophy, Megaphone, Calendar, Star } from 'lucide-react';
import FeedbackForm from './FeedbackForm';
import QRCodeSection from './QRCodeSection';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

const Dashboard = ({ triggerNavigation }) => {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (db) {
        try {
          const q = query(collection(db, "leaderboard"), orderBy("score", "desc"), limit(5));
          const querySnapshot = await getDocs(q);
          const scores = querySnapshot.docs.map(doc => doc.data());
          setLeaderboard(scores);
        } catch (error) {
          console.error("Error fetching leaderboard from Firebase:", error);
        }
      } else {
        const savedScores = JSON.parse(localStorage.getItem('geoLeaderboard') || '[]');
        setLeaderboard(savedScores.slice(0, 5));
      }
    };
    fetchLeaderboard();
  }, []);

  const news = [
    { type: 'logro', icon: <Star color="#ffa502" size={20} />, text: '¡Alcanzamos 5,000 clientes activos en la región!', date: 'Hace 2 horas' },
    { type: 'anuncio', icon: <Megaphone color="#1e90ff" size={20} />, text: 'Mantenimiento de servidores programado para el sábado.', date: 'Ayer' },
    { type: 'cumpleaños', icon: <Calendar color="#ff4757" size={20} />, text: 'Cumpleaños de Laura (Ventas) y Carlos (IT).', date: 'Ayer' },
  ];

  return (
    <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', marginTop: '1rem' }}>
      
      {/* Columna Izquierda: Accesos, Noticias y Feedback */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Accesos Rápidos (Ahora son 3) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="glass-panel" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', cursor: 'pointer', transition: 'transform 0.2s ease' }} onClick={() => navigate('/organigrama')} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            <div style={{ background: 'rgba(0,196,204,0.1)', padding: '0.8rem', borderRadius: '12px', width: 'fit-content' }}>
              <Users color="var(--geo-secondary)" size={24} />
            </div>
            <h3 style={{ color: 'white', margin: 0, fontSize: '1.1rem' }}>Organigrama</h3>
          </div>

          <div className="glass-panel" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', cursor: 'pointer', transition: 'transform 0.2s ease' }} onClick={() => navigate('/directorio')} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            <div style={{ background: 'rgba(0,196,204,0.1)', padding: '0.8rem', borderRadius: '12px', width: 'fit-content' }}>
              <LifeBuoy color="var(--geo-secondary)" size={24} />
            </div>
            <h3 style={{ color: 'white', margin: 0, fontSize: '1.1rem' }}>Soporte Interno</h3>
          </div>

          <div className="glass-panel" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', cursor: 'pointer', transition: 'transform 0.2s ease' }} onClick={() => navigate('/wiki')} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            <div style={{ background: 'rgba(0,196,204,0.1)', padding: '0.8rem', borderRadius: '12px', width: 'fit-content' }}>
              <BookOpen color="var(--geo-secondary)" size={24} />
            </div>
            <h3 style={{ color: 'white', margin: 0, fontSize: '1.1rem' }}>Base de Conocimiento</h3>
          </div>
        </div>

        {/* Muro de Anuncios */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2 style={{ color: 'white', margin: '0 0 1rem 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Megaphone color="var(--geo-primary-light)" size={20} /> 
            Noticias Corporativas
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {news.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.8rem', borderRadius: '50%' }}>
                  {item.icon}
                </div>
                <div>
                  <p style={{ color: 'white', margin: '0 0 0.3rem 0' }}>{item.text}</p>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{item.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Formulario Webhook */}
        <FeedbackForm />
      </div>

      {/* Columna Derecha: Ranking, Juego y QR */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Leaderboard */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2 style={{ color: 'white', margin: '0 0 1rem 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Trophy color="#ffa502" size={20} /> 
            Top 5 VictorIA Shooter
          </h2>
          {leaderboard.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: '2rem 0' }}>Aún no hay récords. ¡Juega y sé el primero!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {leaderboard.slice(0, 5).map((entry, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem', background: index === 0 ? 'rgba(255, 165, 2, 0.1)' : 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: index === 0 ? '3px solid #ffa502' : 'none' }}>
                  <span style={{ color: index === 0 ? '#ffa502' : 'white', fontWeight: index === 0 ? 'bold' : 'normal' }}>
                    {index + 1}. {entry.name}
                  </span>
                  <span style={{ color: 'var(--geo-secondary)', fontWeight: 'bold' }}>{entry.score} pts</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Game Banner */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', background: 'linear-gradient(135deg, rgba(11,15,25,0.8) 0%, rgba(0,196,204,0.1) 100%)', textAlign: 'center' }}>
          <Gamepad2 color="var(--geo-secondary)" size={48} />
          <div>
            <h2 style={{ color: 'white', margin: '0 0 0.5rem 0' }}>Pausa Activa</h2>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Defiende el sistema junto a VictorIA y entra al ranking global.</p>
          </div>
          <button onClick={() => triggerNavigation('/juego')} className="btn btn-primary" style={{ padding: '0.8rem 2rem', width: '100%' }}>
            JUGAR AHORA
          </button>
        </div>

        <QRCodeSection />
      </div>
    </div>
  );
};

export default Dashboard;

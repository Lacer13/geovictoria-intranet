import React, { useState, useEffect } from 'react';
import { Users, LifeBuoy, BookOpen, Trophy, Gamepad2, Megaphone, Calendar, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FeedbackForm from './FeedbackForm';
import QRCodeSection from './QRCodeSection';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

const Dashboard = ({ triggerNavigation }) => {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [news, setNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const q = query(collection(db, "leaderboard"), orderBy("score", "desc"), limit(5));
        const querySnapshot = await getDocs(q);
        const scores = [];
        querySnapshot.forEach((doc) => {
          scores.push(doc.data());
        });
        setLeaderboard(scores);
      } catch (e) {
        console.error("Error fetching leaderboard: ", e);
      }
    };
    
    const fetchNews = async () => {
      try {
        const q = query(collection(db, "news"), orderBy("timestamp", "desc"), limit(5));
        const querySnapshot = await getDocs(q);
        const newsItems = [];
        querySnapshot.forEach((doc) => {
          newsItems.push({ id: doc.id, ...doc.data() });
        });
        setNews(newsItems);
      } catch (e) {
        console.error("Error fetching news: ", e);
      } finally {
        setLoadingNews(false);
      }
    };

    fetchLeaderboard();
    fetchNews();
  }, []);

  const renderIconForNews = (type) => {
    switch (type) {
      case 'logro': return <Star color="#ffa502" size={20} />;
      case 'cumpleaños': return <Calendar color="#ff4757" size={20} />;
      default: return <Megaphone color="#1e90ff" size={20} />;
    }
  };

  return (
    <div className="container" style={{ marginTop: '1rem' }}>
      <div className="bento-grid">
        
        {/* Noticias (Bento Span 2) */}
        <div className="glass-panel bento-span-2 animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Megaphone color="var(--geo-secondary)" size={24} />
            <h2 style={{ color: 'var(--text-main)', margin: 0 }}>Noticias GeoVictoria</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {loadingNews ? (
              <p style={{ color: 'var(--text-muted)' }}>Cargando noticias...</p>
            ) : news.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No hay noticias recientes.</p>
            ) : (
              news.map((item) => (
                <div key={item.id} style={{ background: 'rgba(0,0,0,0.05)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid var(--geo-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    {renderIconForNews(item.type)}
                    <h4 style={{ color: 'var(--text-main)', margin: 0 }}>{item.title}</h4>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--geo-secondary)' }}>{item.date}</span>
                  <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>{item.desc}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Leaderboard (Bento Span 1) */}
        <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'linear-gradient(145deg, var(--glass-bg), rgba(0,86,179,0.1))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Trophy color="#ffa502" size={24} />
            <h2 style={{ color: 'var(--text-main)', margin: 0 }}>Top 5 - Pausa Activa</h2>
          </div>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {leaderboard.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0', fontStyle: 'italic' }}>
                Aún no hay puntajes. ¡Sé el primero!
              </div>
            ) : (
              leaderboard.map((entry, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  background: index === 0 ? 'rgba(255,165,2,0.15)' : 'rgba(0,0,0,0.05)',
                  padding: '0.8rem',
                  borderRadius: '8px',
                  borderLeft: index === 0 ? '3px solid #ffa502' : 'none'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: index === 0 ? '#ffa502' : 'var(--text-muted)', fontWeight: 'bold' }}>
                      #{index + 1}
                    </span>
                    <span style={{ color: 'var(--text-main)', fontWeight: '500' }}>{entry.name}</span>
                  </div>
                  <span style={{ color: 'var(--geo-secondary)', fontWeight: 'bold', fontFamily: 'monospace' }}>
                    {entry.score} pts
                  </span>
                </div>
              ))
            )}
          </div>
          <button className="btn btn-primary" style={{ width: '100%', marginTop: 'auto' }} onClick={() => triggerNavigation('/juego')}>
            <Gamepad2 size={20} /> Jugar Ahora
          </button>
        </div>

        {/* Formulario de Feedback (Bento Span 2) */}
        <div className="bento-span-2">
          <FeedbackForm />
        </div>

        {/* Código QR (Bento Span 1) */}
        <div>
          <QRCodeSection />
        </div>

      </div>
    </div>
  );
};

export default Dashboard;

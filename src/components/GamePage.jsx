import React from 'react';
import ActiveBreak from './ActiveBreak';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GamePage = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0b0f19', display: 'flex', flexDirection: 'column' }}>
      {/* Header / Back Button */}
      <div style={{ padding: '1rem 2rem', display: 'flex', alignItems: 'center' }}>
        <button 
          onClick={handleBack}
          className="btn btn-secondary" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', border: 'none' }}
        >
          <ArrowLeft size={20} />
          Volver al Portal
        </button>
      </div>

      {/* Game Container */}
      <div style={{ flex: 1, padding: '0 2rem 2rem 2rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: '1000px', height: '100%', maxHeight: '600px' }}>
          <ActiveBreak isFullscreen={true} />
        </div>
      </div>
    </div>
  );
};

export default GamePage;

import React, { useState } from 'react';
import { Send, CheckCircle, Loader, ShieldAlert } from 'lucide-react';

import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

const FeedbackForm = () => {
  const [formData, setFormData] = useState({ name: '', department: '', message: '' });
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [status, setStatus] = useState('idle'); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.message) return;
    
    setStatus('loading');

    const payload = {
      isAnonymous: isAnonymous,
      name: isAnonymous ? "Anónimo" : formData.name,
      department: isAnonymous ? "" : formData.department,
      message: formData.message,
      date: new Date().toISOString()
    };

    try {
      if (db) {
        // Modo Producción: Guardar en Firebase
        await addDoc(collection(db, "feedbacks"), payload);
      } else {
        // Modo Desarrollo: Guardar en LocalStorage si aún no hay llaves
        console.warn("Firebase no configurado. Usando LocalStorage temporalmente.");
        const existingMessages = JSON.parse(localStorage.getItem('geoFeedback') || '[]');
        existingMessages.push(payload);
        localStorage.setItem('geoFeedback', JSON.stringify(existingMessages));
      }

      setStatus('success');
      setFormData({ name: '', department: '', message: '' });
      setIsAnonymous(false);
      setTimeout(() => setStatus('idle'), 4000);
    } catch (err) {
      console.error("Error guardando reporte:", err);
      setStatus('idle');
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem', borderTop: '4px solid #ff4757' }}>
      <h2 style={{ color: 'white', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <ShieldAlert color="#ff4757" /> 
        Canal de Solicitudes y Reportes
      </h2>
      
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Usa este canal para reportar quejas de la oficina, situaciones de abuso, o solicitar apoyo. 
        Toda la información será enviada directamente y de forma confidencial a Gerencia.
      </p>

      {status === 'success' ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem 0', color: '#2ed573' }}>
          <CheckCircle size={48} />
          <h3 style={{ margin: 0 }}>¡Reporte Enviado!</h3>
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.9rem' }}>La información ha sido enviada al correo de gerencia de forma segura.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input 
              type="checkbox" 
              id="anonimo" 
              checked={isAnonymous} 
              onChange={(e) => setIsAnonymous(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <label htmlFor="anonimo" style={{ color: 'white', cursor: 'pointer', fontSize: '0.9rem' }}>
              Enviar de forma 100% anónima
            </label>
          </div>

          {!isAnonymous && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <input 
                type="text" 
                placeholder="Tu Nombre" 
                className="input-field"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required={!isAnonymous}
              />
              <select 
                className="input-field"
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
                required={!isAnonymous}
              >
                <option value="" disabled>Tu Departamento...</option>
                <option value="Operaciones">Operaciones</option>
                <option value="Finanzas">Finanzas</option>
                <option value="IT">IT / Tecnología</option>
                <option value="RRHH">Recursos Humanos</option>
              </select>
            </div>
          )}
          
          <textarea 
            placeholder="Describe detalladamente la situación, queja o solicitud..." 
            className="input-field"
            style={{ height: '120px', resize: 'vertical' }}
            value={formData.message}
            onChange={(e) => setFormData({...formData, message: e.target.value})}
            required
          />
          <button type="submit" className="btn btn-primary" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', background: '#ff4757', borderColor: '#ff4757', boxShadow: '0 0 20px rgba(255, 71, 87, 0.4)' }} disabled={status === 'loading'}>
            {status === 'loading' ? <Loader className="animate-spin" size={20} /> : <Send size={20} />}
            {status === 'loading' ? 'Enviando...' : 'Enviar Reporte Confidencial'}
          </button>
        </form>
      )}
    </div>
  );
};

export default FeedbackForm;

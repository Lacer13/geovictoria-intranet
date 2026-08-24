import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Share2, Download } from 'lucide-react';

const QRCodeSection = () => {
  // En un entorno real, esta sería la URL del dominio gratuito.
  const [url] = useState('https://geovictoria-interno.vercel.app');

  const handleDownload = () => {
    const svg = document.getElementById('qr-code-svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = 'GeoVictoria-Portal-QR.png';
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', width: '100%', justifyContent: 'flex-start' }}>
        <Share2 size={24} color="var(--geo-primary-light)" />
        <h3 style={{ color: 'var(--text-main)', margin: 0 }}>Comparte el Portal</h3>
      </div>
      
      <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Escanea este código o descárgalo para pegarlo en la oficina.
      </p>

      <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
        <QRCodeSVG 
          id="qr-code-svg"
          value={url} 
          size={150} 
          fgColor="#003d82" // geo-primary-dark
          imageSettings={{
            src: "/Logo geovictoria.png",
            x: undefined,
            y: undefined,
            height: 30,
            width: 30,
            excavate: true,
          }}
        />
      </div>

      <button onClick={handleDownload} className="btn btn-secondary" style={{ width: '100%' }}>
        <Download size={18} /> Descargar QR
      </button>
    </div>
  );
};

export default QRCodeSection;

import React, { useRef, useEffect, useState } from 'react';
import { Gamepad2, Play, Trophy, RefreshCw, ArrowUp, ArrowDown, Crosshair, Heart, Save } from 'lucide-react';
import { Joystick } from 'react-joystick-component';

import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const ScoreSubmitter = ({ score, onSaved }) => {
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    
    const payload = { name, score, date: new Date().toISOString() };

    try {
      if (db) {
        await addDoc(collection(db, "leaderboard"), payload);
      } else {
        const currentLeaderboard = JSON.parse(localStorage.getItem('geoLeaderboard') || '[]');
        currentLeaderboard.push(payload);
        currentLeaderboard.sort((a, b) => b.score - a.score);
        localStorage.setItem('geoLeaderboard', JSON.stringify(currentLeaderboard.slice(0, 10)));
      }
      setSaved(true);
      setTimeout(() => onSaved(), 1500);
    } catch (err) {
      console.error("Error guardando score:", err);
    }
  };

  if (score === 0) return null;
  if (saved) return <p style={{ color: '#2ed573' }}>¡Guardado en el ranking!</p>;

  return (
    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
      <input 
        type="text" 
        placeholder="Tu Nombre o Iniciales" 
        value={name} 
        onChange={(e) => setName(e.target.value)}
        className="input-field"
        style={{ padding: '0.5rem 1rem', width: '200px' }}
      />
      <button onClick={handleSave} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
        <Save size={20} />
      </button>
    </div>
  );
};

const ActiveBreak = ({ isFullscreen = false }) => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('idle'); 
  const [score, setScore] = useState(0);
  const [playerHp, setPlayerHp] = useState(3);
  
  const CW = isFullscreen ? 900 : 600;
  const CH = isFullscreen ? 450 : 300;

  const stateRef = useRef({
    player: { x: 50, y: CH/2, width: 120, height: 120, speed: 7, hp: 3, dx: 0, dy: 0, tilt: 0, state: 'idle', stateTimer: 0, shieldTimer: 0, doubleLaserTimer: 0, spreadTimer: 0 },
    lasers: [],
    enemies: [],
    particles: [],
    powerups: [],
    floatingTexts: [],
    boss: null,
    score: 0,
    frames: 0,
    isGameOver: false,
    isVictory: false,
    cameraShake: 0 
  });

  const keys = useRef({ ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, Space: false, JoyX: 0, JoyY: 0 });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'ArrowUp' || e.code === 'KeyW') keys.current.ArrowUp = true;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') keys.current.ArrowDown = true;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.current.ArrowLeft = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.current.ArrowRight = true;
      if (e.code === 'Space') {
        keys.current.Space = true;
        fireLaser();
        e.preventDefault();
      }
    };
    const handleKeyUp = (e) => {
      if (e.code === 'ArrowUp' || e.code === 'KeyW') keys.current.ArrowUp = false;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') keys.current.ArrowDown = false;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.current.ArrowLeft = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.current.ArrowRight = false;
      if (e.code === 'Space') keys.current.Space = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  const fireLaser = () => {
    if (gameState !== 'playing' || stateRef.current.isGameOver) return;
    const p = stateRef.current.player;
    
    p.state = 'shooting';
    p.stateTimer = 15;

    if (p.spreadTimer > 0) {
      // Disparo Abanico (3 lasers)
      stateRef.current.lasers.push({
        x: p.x + p.width - 20, y: p.y + p.height / 2, width: 25, height: 6, speed: 15, vy: 0, color: '#9c88ff'
      });
      stateRef.current.lasers.push({
        x: p.x + p.width - 20, y: p.y + p.height / 2 - 10, width: 25, height: 4, speed: 14, vy: -3, color: '#9c88ff'
      });
      stateRef.current.lasers.push({
        x: p.x + p.width - 20, y: p.y + p.height / 2 + 10, width: 25, height: 4, speed: 14, vy: 3, color: '#9c88ff'
      });
    } else if (p.doubleLaserTimer > 0) {
      // Disparo Doble
      stateRef.current.lasers.push({
        x: p.x + p.width - 20, y: p.y + p.height / 2 - 15, width: 25, height: 4, speed: 15, vy: 0, color: '#ffea00'
      });
      stateRef.current.lasers.push({
        x: p.x + p.width - 20, y: p.y + p.height / 2 + 15, width: 25, height: 4, speed: 15, vy: 0, color: '#ffea00'
      });
    } else {
      // Disparo Normal
      stateRef.current.lasers.push({
        x: p.x + p.width - 20,
        y: p.y + p.height / 2 + Math.sin(stateRef.current.frames * 0.1) * 3,
        width: 25, height: 4, speed: 15, vy: 0, color: '#00ffff'
      });
    }
  };

  const createEnemy = () => {
    stateRef.current.enemies.push({
      x: CW + 50,
      y: Math.random() * (CH - 150) + 50,
      width: 80,
      height: 80,
      speed: Math.random() * 3 + 3,
      hp: 1,
      bobOffset: Math.random() * Math.PI * 2,
      hitFlash: 0
    });
  };

  const spawnBoss = () => {
    stateRef.current.boss = {
      x: CW - 200,
      y: CH / 2 - 90,
      width: 160,
      height: 180,
      speed: 1.5,
      dy: 1.5,
      hp: 25,
      maxHp: 25,
      lastShot: 0,
      hitFlash: 0
    };
  };

  const spawnPowerup = (x, y) => {
    const types = ['heal', 'shield', 'laser', 'spread', 'bomb'];
    const type = types[Math.floor(Math.random() * types.length)];
    stateRef.current.powerups.push({
      x, y, width: 40, height: 40, type, bobOffset: Math.random() * Math.PI * 2
    });
  };

  const addFloatingText = (x, y, text, color) => {
    stateRef.current.floatingTexts.push({ x, y, text, color, life: 1 });
  };

  const createExplosion = (x, y, color, count = 12) => {
    for (let i = 0; i < count; i++) {
      stateRef.current.particles.push({
        x, y, vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10,
        life: 1, color, size: Math.random() * 5 + 2, isExplosion: true
      });
    }
    stateRef.current.cameraShake = Math.min(stateRef.current.cameraShake + 5, 15);
  };

  const resetGame = () => {
    stateRef.current = {
      player: { x: 50, y: CH/2 - 30, width: 120, height: 120, speed: 7, hp: 3, dy: 0, tilt: 0, state: 'idle', stateTimer: 0, shieldTimer: 0, doubleLaserTimer: 0 },
      lasers: [], enemies: [], particles: [], powerups: [], floatingTexts: [],
      boss: null, score: 0, frames: 0, isGameOver: false, isVictory: false, cameraShake: 0
    };
    setScore(0);
    setPlayerHp(3);
    setGameState('playing');
  };

  useEffect(() => {
    if (gameState !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    
    const playerImg = new Image(); playerImg.src = '/Sprinn nuevo Victoria.png';
    const bossImg = new Image(); bossImg.src = '/Boss.png';
    const enemyImg = new Image(); enemyImg.src = '/Robot combatiente.png';

    const update = () => {
      const state = stateRef.current;
      if (state.isGameOver || state.isVictory) return;
      state.frames++;

      if (state.cameraShake > 0) state.cameraShake *= 0.9;
      if (state.player.shieldTimer > 0) state.player.shieldTimer--;
      if (state.player.doubleLaserTimer > 0) state.player.doubleLaserTimer--;
      if (state.player.spreadTimer > 0) state.player.spreadTimer--;

      if (state.player.state !== 'idle') {
        state.player.stateTimer--;
        if (state.player.stateTimer <= 0) state.player.state = 'idle';
      }

      // Movement bounds (Limitado abajo para no chocar con controles táctiles)
      state.player.dx = 0;
      state.player.dy = 0;
      
      // X Movement
      let targetDx = 0;
      if (keys.current.ArrowLeft) targetDx = -1;
      if (keys.current.ArrowRight) targetDx = 1;
      if (keys.current.JoyX !== 0) targetDx = keys.current.JoyX;

      if (targetDx < 0 && state.player.x > 0) {
        state.player.x += targetDx * state.player.speed;
        state.player.dx = targetDx;
      }
      if (targetDx > 0 && state.player.x < canvas.width/2) {
        state.player.x += targetDx * state.player.speed;
        state.player.dx = targetDx;
      }

      // Y Movement
      let targetDy = 0;
      if (keys.current.ArrowUp) targetDy = -1;
      if (keys.current.ArrowDown) targetDy = 1;
      if (keys.current.JoyY !== 0) targetDy = -keys.current.JoyY; // JoyY is positive up, we need negative up

      if (targetDy < 0 && state.player.y > state.player.height/2) {
        state.player.y += targetDy * state.player.speed;
        state.player.dy = targetDy;
      }
      if (targetDy > 0 && state.player.y < canvas.height - state.player.height/2 - 60) {
        state.player.y += targetDy * state.player.speed;
        state.player.dy = targetDy;
      }

      state.player.tilt += (state.player.dy * -0.2 - state.player.tilt) * 0.15;

      if (state.frames % 2 === 0) {
        state.particles.push({
          x: state.player.x + state.player.width/2 - 10 + (Math.random() - 0.5) * 10,
          y: state.player.y + state.player.height - 10,
          vx: -1 - Math.random() * 4, vy: Math.random() * 2 + 1,
          life: 0.8, color: Math.random() > 0.5 ? '#00ffff' : '#ffffff', size: Math.random() * 4 + 2, isFlame: true
        });
      }

      // Lasers
      state.lasers.forEach((l, i) => {
        l.x += l.speed;
        if (l.vy) l.y += l.vy;
        if (l.x > canvas.width || l.x < -50 || l.y < -50 || l.y > canvas.height + 50) state.lasers.splice(i, 1);
      });

      // Powerups Update & Collision
      state.powerups.forEach((pu, pui) => {
        pu.x -= 2;
        if (
          state.player.x < pu.x + pu.width &&
          state.player.x + state.player.width > pu.x &&
          state.player.y < pu.y + pu.height &&
          state.player.y + state.player.height > pu.y
        ) {
          // Collected
          state.powerups.splice(pui, 1);
          if (pu.type === 'heal') {
            state.player.hp = Math.min(3, state.player.hp + 1);
            setPlayerHp(state.player.hp);
            addFloatingText(state.player.x, state.player.y, "+VIDA", "#2ed573");
          } else if (pu.type === 'shield') {
            state.player.shieldTimer = 300; // 5 secs
            addFloatingText(state.player.x, state.player.y, "¡ESCUDO!", "#1e90ff");
          } else if (pu.type === 'laser') {
            state.player.doubleLaserTimer = 600; // 10 secs
            addFloatingText(state.player.x, state.player.y, "LÁSER DUAL", "#ffa502");
          } else if (pu.type === 'spread') {
            state.player.spreadTimer = 600; // 10 secs
            addFloatingText(state.player.x, state.player.y, "ABANICO", "#9c88ff");
          } else if (pu.type === 'bomb') {
            addFloatingText(state.player.x, state.player.y, "¡BOMBA!", "#ff4757");
            state.cameraShake = 30;
            // Destruir enemigos menores
            state.enemies.forEach(e => {
              createExplosion(e.x + e.width/2, e.y + e.height/2, '#ffaa00', 15);
              state.score += 10;
            });
            setScore(state.score);
            state.enemies = []; // limpiar todos
          }
        }
        if (pu.x < -50) state.powerups.splice(pui, 1);
      });

      // Spawn Enemies
      if (!state.boss && state.frames % 60 === 0) createEnemy();
      if (state.score >= 100 && !state.boss) spawnBoss();

      // Boss Logic
      if (state.boss) {
        const b = state.boss;
        b.y += b.dy;
        // Boss también respeta límite inferior
        if (b.y <= 20 || b.y + b.height >= canvas.height - 60) b.dy *= -1;
        if (b.hitFlash > 0) b.hitFlash--;

        if (state.frames - b.lastShot > 70) {
          state.lasers.push({
            x: b.x, y: b.y + b.height / 2 - 10, width: 40, height: 10, speed: -8, color: '#ff0055', isEnemy: true
          });
          b.lastShot = state.frames;
        }
      }

      const takeDamage = () => {
        if (state.player.shieldTimer > 0) return; // Inmune
        state.player.hp -= 1;
        setPlayerHp(state.player.hp);
        state.player.state = 'damage';
        state.player.stateTimer = 20;
        createExplosion(state.player.x + 60, state.player.y + 60, '#ff0055', 20);
        state.cameraShake = 15;
        if (state.player.hp <= 0) {
          state.isGameOver = true;
          setGameState('gameover');
        }
      };

      // Enemies Logic
      state.enemies.forEach((e, ei) => {
        e.x -= e.speed;
        if (e.hitFlash > 0) e.hitFlash--;
        
        // Player Collision
        if (
          state.player.x + 30 < e.x + e.width - 20 &&
          state.player.x + state.player.width - 30 > e.x + 20 &&
          state.player.y + 30 < e.y + e.height - 20 &&
          state.player.y + state.player.height - 30 > e.y + 20
        ) {
          state.enemies.splice(ei, 1);
          takeDamage();
        }
        if (e.x + e.width < -50) state.enemies.splice(ei, 1);
      });

      // Laser Collisions
      state.lasers.forEach((l, li) => {
        if (l.isEnemy) {
          if (
            l.x < state.player.x + state.player.width - 30 &&
            l.x + l.width > state.player.x + 30 &&
            l.y < state.player.y + state.player.height - 30 &&
            l.y + l.height > state.player.y + 30
          ) {
            state.lasers.splice(li, 1);
            takeDamage();
          }
          return;
        }

        // Hit Enemies
        state.enemies.forEach((e, ei) => {
          if (
            l.x < e.x + e.width - 20 &&
            l.x + l.width > e.x + 20 &&
            l.y < e.y + e.height - 20 &&
            l.y + l.height > e.y + 20
          ) {
            state.lasers.splice(li, 1);
            e.hp -= 1;
            e.hitFlash = 5;
            createExplosion(l.x + l.width, l.y, '#00ffff', 5);
            if (e.hp <= 0) {
              createExplosion(e.x + e.width/2, e.y + e.height/2, '#ffaa00', 15);
              state.enemies.splice(ei, 1);
              state.score += 10;
              setScore(state.score);
              
              // 20% chance to drop powerup
              if (Math.random() < 0.20) spawnPowerup(e.x, e.y);
            }
          }
        });

        // Hit Boss
        if (state.boss) {
          const b = state.boss;
          if (
            l.x < b.x + b.width - 30 &&
            l.x + l.width > b.x + 30 &&
            l.y < b.y + b.height - 30 &&
            l.y + l.height > b.y + 30
          ) {
            state.lasers.splice(li, 1);
            b.hp -= 1;
            b.hitFlash = 5;
            createExplosion(l.x + l.width, l.y, '#00ffff', 8);
            if (b.hp <= 0) {
              createExplosion(b.x + b.width/2, b.y + b.height/2, '#ffaa00', 50);
              state.cameraShake = 25;
              state.boss = null;
              state.isVictory = true;
              setGameState('victory');
            }
          }
        }
      });

      // Update Particles & Floating Texts
      state.particles.forEach((p, pi) => {
        if (p.isExplosion) { p.vx *= 0.92; p.vy *= 0.92; p.vy += 0.1; }
        p.x += p.vx; p.y += p.vy;
        p.life -= p.isFlame ? 0.08 : 0.03;
        if (p.size > 0.1) p.size -= 0.1;
        if (p.life <= 0) state.particles.splice(pi, 1);
      });
      state.floatingTexts.forEach((ft, i) => {
        ft.y -= 1; ft.life -= 0.02;
        if (ft.life <= 0) state.floatingTexts.splice(i, 1);
      });
    };

    const draw = () => {
      const state = stateRef.current;
      ctx.fillStyle = '#050810';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.save();
      if (state.cameraShake > 0.5) {
        ctx.translate((Math.random() - 0.5) * state.cameraShake, (Math.random() - 0.5) * state.cameraShake);
      }

      // Parallax
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      for(let i=0; i<30; i++) {
        let starX = ((i * 123 + state.frames * 0.2) % canvas.width);
        ctx.globalAlpha = 0.3;
        ctx.fillRect(canvas.width - starX, (i * 97) % canvas.height, 1, 1);
      }
      for(let i=0; i<15; i++) {
        let starX = ((i * 347 + state.frames * 1.5) % canvas.width);
        ctx.globalAlpha = Math.random() > 0.1 ? 0.8 : 0.2; 
        ctx.fillRect(canvas.width - starX, (i * 113) % canvas.height, 2, 2);
      }
      ctx.globalAlpha = 0.05; ctx.fillStyle = '#00c4cc';
      for(let i=0; i<5; i++) {
        let lineX = ((i * 500 + state.frames * 4) % (canvas.width * 2));
        ctx.fillRect(canvas.width - lineX, (i * 80) % canvas.height, 150, 4);
      }
      ctx.globalAlpha = 1;

      // Particles
      ctx.globalCompositeOperation = 'lighter';
      state.particles.forEach(p => {
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.isFlame ? 10 : 5;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      });
      ctx.shadowBlur = 0; ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;

      // Player
      ctx.save();
      const bobY = Math.sin(state.frames * 0.1) * 4;
      ctx.translate(state.player.x + state.player.width/2, state.player.y + state.player.height/2 + bobY);
      ctx.rotate(state.player.tilt);
      
      // Escudo Aura
      if (state.player.shieldTimer > 0) {
        ctx.beginPath();
        ctx.arc(0, 0, state.player.width/2 + 10, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(0, 196, 204, 0.3)';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#00ffff';
        ctx.stroke();
      }

      if (playerImg.complete && playerImg.width > 0) {
        // CORRECCIÓN: Volver a 2x2 para VictorIA
        const cols = 2; const rows = 2;
        const frameWidth = playerImg.width / cols;
        const frameHeight = playerImg.height / rows;
        
        let col = 0; let row = 0;
        if (state.player.state === 'idle') { col = 0; row = 0; }
        else if (state.player.state === 'shooting') { col = 1; row = 0; }
        else if (state.player.state === 'damage') { col = 0; row = 1; }

        ctx.drawImage(
          playerImg, 
          col * frameWidth, row * frameHeight, frameWidth, frameHeight,
          -state.player.width/2, -state.player.height/2, state.player.width, state.player.height
        );
      }
      ctx.restore();

      // Powerups
      state.powerups.forEach(pu => {
        const puBobY = Math.sin(state.frames * 0.1 + pu.bobOffset) * 5;
        ctx.save();
        ctx.translate(pu.x + pu.width/2, pu.y + pu.height/2 + puBobY);
        
        ctx.shadowBlur = 15;
        if (pu.type === 'heal') {
          ctx.shadowColor = '#2ed573'; ctx.fillStyle = '#2ed573';
        } else if (pu.type === 'shield') {
          ctx.shadowColor = '#1e90ff'; ctx.fillStyle = '#1e90ff';
        } else if (pu.type === 'laser') {
          ctx.shadowColor = '#ffa502'; ctx.fillStyle = '#ffa502';
        } else if (pu.type === 'spread') {
          ctx.shadowColor = '#9c88ff'; ctx.fillStyle = '#9c88ff';
        } else if (pu.type === 'bomb') {
          ctx.shadowColor = '#ff4757'; ctx.fillStyle = '#ff4757';
        }
        
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI*2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (pu.type === 'heal') ctx.fillText('❤️', 0, 0);
        else if (pu.type === 'shield') ctx.fillText('🛡️', 0, 0);
        else if (pu.type === 'spread') ctx.fillText('✨', 0, 0);
        else if (pu.type === 'bomb') ctx.fillText('💣', 0, 0);
        else {
          // Dibujo de "Dos balas" en lugar de emoji
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-6, -8, 3, 16); // Bala izquierda
          ctx.fillRect(3, -8, 3, 16);  // Bala derecha
        }
        
        ctx.restore();
      });

      // Lasers
      ctx.globalCompositeOperation = 'lighter';
      state.lasers.forEach(l => {
        ctx.fillStyle = l.color; ctx.shadowColor = l.color; ctx.shadowBlur = 15;
        ctx.beginPath(); ctx.roundRect(l.x, l.y, l.width, l.height, 2); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.shadowBlur = 0;
        ctx.fillRect(l.x + 2, l.y + 1, l.width - 4, l.height - 2);
      });
      ctx.globalCompositeOperation = 'source-over';

      // Enemies
      state.enemies.forEach(e => {
        const eBobY = Math.sin(state.frames * 0.1 + e.bobOffset) * 3;
        ctx.save();
        ctx.translate(e.x + e.width/2, e.y + e.height/2 + eBobY);
        ctx.scale(-1, 1);
        if (e.hitFlash > 0) ctx.filter = 'brightness(500%) sepia(100%) hue-rotate(180deg)';
        if (enemyImg.complete && enemyImg.width > 0) {
          const cols = 2; const rows = 2;
          const frameWidth = enemyImg.width / cols;
          const frameHeight = enemyImg.height / rows;
          ctx.drawImage(enemyImg, 0, 0, frameWidth, frameHeight, -e.width/2 - 10, -e.height/2 - 10, e.width + 20, e.height + 20);
        }
        ctx.restore();
      });

      // Boss
      if (state.boss) {
        const b = state.boss;
        const bBobY = Math.sin(state.frames * 0.05) * 5;
        ctx.save();
        ctx.translate(b.x + b.width/2, b.y + b.height/2 + bBobY);
        
        if (b.hitFlash > 0) ctx.filter = 'brightness(500%)';

        if (bossImg.complete && bossImg.width > 0) {
          const cols = 2; const rows = 2;
          const frameWidth = bossImg.width / cols;
          const frameHeight = bossImg.height / rows;
          let col = 0; let row = 0;
          if (b.hp <= 0) { col = 1; row = 1; } 
          else if (state.frames - b.lastShot > 60) { col = 1; row = 0; }
          ctx.drawImage(bossImg, col * frameWidth, row * frameHeight, frameWidth, frameHeight, -b.width/2 - 20, -b.height/2 - 20, b.width + 40, b.height + 40);
        }
        ctx.restore();

        // CORRECCIÓN: Dibujar barra de vida del Boss
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(b.x - 10, b.y + bBobY - 35, b.width + 20, 24);
        
        ctx.fillStyle = 'rgba(255,71,87,0.3)'; // Fondo rojo oscuro
        ctx.fillRect(b.x - 6, b.y + bBobY - 31, b.width + 12, 16);
        
        // Gradiente para la vida
        const hpGradient = ctx.createLinearGradient(b.x, 0, b.x + b.width, 0);
        hpGradient.addColorStop(0, '#ff4757');
        hpGradient.addColorStop(1, '#ff6b81');
        
        ctx.fillStyle = hpGradient;
        ctx.fillRect(b.x - 6, b.y + bBobY - 31, (b.width + 12) * (Math.max(0, b.hp) / b.maxHp), 16);
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x - 6, b.y + bBobY - 31, b.width + 12, 16);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`💀 JEFE: ${Math.max(0, b.hp)}/${b.maxHp}`, b.x + b.width/2, b.y + bBobY - 45);
      }

      // Floating Texts
      state.floatingTexts.forEach(ft => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.life);
        ctx.font = 'bold 24px monospace';
        ctx.fillStyle = ft.color;
        ctx.shadowColor = ft.color;
        ctx.shadowBlur = 10;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      });

      ctx.restore();
    };

    const loop = () => {
      update();
      draw();
      if (!stateRef.current.isGameOver && !stateRef.current.isVictory) {
        animationId = requestAnimationFrame(loop);
      }
    };

    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [gameState]);

  return (
    <div className="glass-panel" style={{ padding: '0', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      
      {gameState === 'playing' && (
        <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', zIndex: 10, display: 'flex', gap: '2rem', pointerEvents: 'none' }}>
          <div style={{ background: 'rgba(11, 15, 25, 0.6)', backdropFilter: 'blur(10px)', padding: '0.8rem 1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--geo-secondary)', fontWeight: 600, letterSpacing: '2px' }}>PUNTUACIÓN</span>
            <span style={{ fontSize: '2rem', color: 'white', fontWeight: 800, fontFamily: 'monospace' }}>{score.toString().padStart(4, '0')}</span>
          </div>
          
          <div style={{ background: 'rgba(11, 15, 25, 0.6)', backdropFilter: 'blur(10px)', padding: '0.8rem 1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {[...Array(3)].map((_, i) => (
              <Heart 
                key={i} 
                size={28} 
                color={i < playerHp ? "#00ffff" : "rgba(255,255,255,0.2)"} 
                fill={i < playerHp ? "rgba(0,255,255,0.5)" : "transparent"} 
                style={{ filter: i < playerHp ? 'drop-shadow(0 0 8px rgba(0,255,255,0.8))' : 'none', transition: 'all 0.3s ease' }}
              />
            ))}
          </div>
        </div>
      )}

      <div style={{ 
        position: 'relative', width: '100%', margin: '0', background: '#000', overflow: 'hidden', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 50px rgba(0,196,204,0.1)'
      }}>
        <canvas 
          ref={canvasRef} 
          width={CW} 
          height={CH} 
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: gameState === 'playing' ? 'block' : 'none' }}
        />

        {gameState === 'idle' && (
          <div className="flex-center animate-fade-in" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', flexDirection: 'column', padding: '2rem', textAlign: 'center', background: 'linear-gradient(to bottom, rgba(11,15,25,0.9), rgba(26,34,53,0.9))' }}>
            <img src="/Sprinn nuevo Victoria.png" alt="VictorIA" style={{ width: '120px', height: '120px', objectFit: 'none', objectPosition: 'left center', marginBottom: '1rem', filter: 'drop-shadow(0 0 20px rgba(0,255,255,0.5))' }} className="animate-float" />
            <h1 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '3rem', letterSpacing: '4px', textShadow: '0 0 20px rgba(0,196,204,0.5)' }}>VICTOR<span style={{color: 'var(--geo-secondary)'}}>IA</span></h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1.2rem', maxWidth: '400px' }}>Sobrevive al asalto cibernético.<br/>Usa las flechas para volar y espacio para disparar.</p>
            <button onClick={resetGame} className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.2rem', boxShadow: '0 0 30px rgba(0,196,204,0.5)' }}>
              <Play size={24} style={{ marginRight: '0.5rem' }}/> INICIAR MISIÓN
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="flex-center animate-fade-in" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', flexDirection: 'column', background: 'rgba(11,15,25,0.95)', backdropFilter: 'blur(10px)' }}>
            <h3 style={{ color: '#ff4757', fontSize: '4rem', fontFamily: 'monospace', textShadow: '0 0 30px rgba(255,71,87,0.8)' }}>SISTEMA CAÍDO</h3>
            <p style={{ color: 'white', margin: '1rem 0', fontSize: '1.5rem' }}>Puntuación Final: <span style={{ color: 'var(--geo-secondary)', fontWeight: 'bold'}}>{score}</span></p>
            
            <ScoreSubmitter score={score} onSaved={resetGame} />

            <button onClick={resetGame} className="btn btn-secondary" style={{ marginTop: '1rem', padding: '1rem 2rem', fontSize: '1.1rem' }}><RefreshCw size={20} style={{ marginRight: '0.5rem' }} /> Reintentar</button>
          </div>
        )}

        {gameState === 'victory' && (
          <div className="flex-center animate-fade-in" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', flexDirection: 'column', background: 'rgba(11,15,25,0.95)', backdropFilter: 'blur(10px)' }}>
            <Trophy size={80} color="#ffa502" style={{ marginBottom: '1rem', filter: 'drop-shadow(0 0 30px rgba(255,165,2,0.8))' }} />
            <h3 style={{ color: '#2ed573', fontSize: '4rem', fontFamily: 'monospace', textShadow: '0 0 30px rgba(46,213,115,0.8)' }}>SISTEMA SEGURO</h3>
            <p style={{ color: 'white', margin: '1rem 0', fontSize: '1.5rem' }}>Puntuación Final: <span style={{ color: 'var(--geo-secondary)', fontWeight: 'bold'}}>{score}</span></p>
            
            <ScoreSubmitter score={score} onSaved={resetGame} />

            <button onClick={resetGame} className="btn btn-primary" style={{ marginTop: '1rem', padding: '1rem 2rem', fontSize: '1.1rem', boxShadow: '0 0 30px rgba(0,196,204,0.5)' }}><RefreshCw size={20} style={{ marginRight: '0.5rem' }} /> Jugar de nuevo</button>
          </div>
        )}
      </div>
      
      {/* Controles Móviles Flotantes */}
      {gameState === 'playing' && (
        <div style={{ position: 'absolute', bottom: '2rem', left: '2rem', right: '2rem', display: 'flex', justifyContent: 'space-between', padding: '0', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', opacity: 0.5 }}>
            <Joystick 
              size={120} 
              baseColor="rgba(255,255,255,0.1)" 
              stickColor="rgba(0,196,204,0.6)" 
              move={(e) => {
                // e.x, e.y are normalized from -1 to 1 but with physics interpolation
                // It can go a bit above 1. Let's clamp or use it directly.
                // React-joystick-component `move` event returns x and y coordinates relative to center, or we can use e.x and e.y which are distance values.
                // Actually `e.x` and `e.y` are distances. To get normalized (-1 to 1):
                keys.current.JoyX = e.x / 60; 
                keys.current.JoyY = e.y / 60;
              }} 
              stop={() => {
                keys.current.JoyX = 0;
                keys.current.JoyY = 0;
              }} 
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button 
              className="btn" 
              style={{ width: '100px', height: '100px', borderRadius: '50%', padding: 0, background: 'linear-gradient(135deg, rgba(0,196,204,0.4), rgba(0,196,204,0.1))', backdropFilter: 'blur(10px)', border: '2px solid rgba(0,196,204,0.5)', color: 'var(--geo-secondary)', boxShadow: '0 0 30px rgba(0, 196, 204, 0.4)' }}
              onPointerDown={(e) => { 
                e.preventDefault(); 
                fireLaser(); 
              }}
            >
              <Crosshair size={40} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveBreak;

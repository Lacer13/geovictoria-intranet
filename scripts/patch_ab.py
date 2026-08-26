import re

with open('src/components/ActiveBreak.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add CHARACTERS and Hooks
hooks_addition = """
const CHARACTERS = [
  { id: 'victoria_classic', name: 'VictorIA (Clásica)', src: '/Sprinn nuevo Victoria.png', type: 'static', cost: 0, desc: 'La IA original. Confiable.' },
  { id: 'victoria_st', name: 'VictorIA (Soporte Técnico)', src: '/victoria_st_spritesheet.png', type: 'spritesheet', cols: 5, rows: 4, cost: 500, desc: 'Animada. Especialista en hardware.' }
];

const ActiveBreak = ({ isFullscreen = false }) => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('idle'); 
  const [score, setScore] = useState(0);
  const [playerHp, setPlayerHp] = useState(3);
  
  // Progression State
  const [totalCoins, setTotalCoins] = useState(() => parseInt(localStorage.getItem('geo_total_coins') || '0'));
  const [unlockedChars, setUnlockedChars] = useState(() => JSON.parse(localStorage.getItem('geo_unlocked_chars') || '["victoria_classic"]'));
  const [selectedCharId, setSelectedCharId] = useState(() => localStorage.getItem('geo_selected_char') || 'victoria_classic');

  const selectedChar = CHARACTERS.find(c => c.id === selectedCharId) || CHARACTERS[0];
"""

content = re.sub(
    r"const ActiveBreak = \({ isFullscreen = false }\) => {\s*const canvasRef = useRef\(null\);\s*const \[gameState, setGameState\] = useState\('idle'\);\s*const \[score, setScore\] = useState\(0\);\s*const \[playerHp, setPlayerHp\] = useState\(3\);",
    hooks_addition.strip(),
    content
)

# 2. Update Image loading based on selectedChar
content = content.replace("const playerImg = new Image(); playerImg.src = '/victoria_st_spritesheet.png';", "const playerImg = new Image(); playerImg.src = selectedChar.src;")

# 3. Update drawing logic to handle both static and spritesheet
draw_logic = """
      if (playerImg.complete && playerImg.width > 0) {
        if (selectedChar.type === 'spritesheet') {
          const cols = selectedChar.cols; const rows = selectedChar.rows;
          const frameWidth = playerImg.width / cols;
          const frameHeight = playerImg.height / rows;
          
          // Animación a 60fps (cambio cada 6 frames)
          const frameIndex = Math.floor(state.frames / 6) % cols;
          let col = frameIndex; 
          let row = 0; // 0 = idle/fly

          if (state.player.state === 'idle') { row = 0; }
          else if (state.player.state === 'shooting') { row = 1; }
          else if (state.player.state === 'damage') { row = 2; }
          else if (state.player.state === 'dead') { 
            row = 3; 
            // Stop at last frame for death
            col = Math.min(cols - 1, Math.floor(state.frames / 8));
          }

          ctx.drawImage(
            playerImg, 
            col * frameWidth, row * frameHeight, frameWidth, frameHeight,
            -state.player.width/2, -state.player.height/2, state.player.width, state.player.height
          );
        } else {
          // Static Image
          ctx.drawImage(
            playerImg, 
            -state.player.width/2, -state.player.height/2, state.player.width, state.player.height
          );
        }
      }
"""

content = re.sub(
    r"if \(playerImg\.complete && playerImg\.width > 0\) \{.*?ctx\.drawImage\([^}]+\);\s*\}",
    draw_logic.strip(),
    content,
    flags=re.DOTALL
)

# 4. Save coins on Game Over and Victory
content = content.replace(
    "setGameState('gameover');",
    "setGameState('gameover');\n      const newCoins = totalCoins + state.score;\n      setTotalCoins(newCoins);\n      localStorage.setItem('geo_total_coins', newCoins.toString());"
)

# 5. UI Idle Screen: Add Character Selector
idle_screen = """
        {gameState === 'idle' && (
          <div className="flex-center animate-fade-in" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', flexDirection: 'column', padding: '1rem', textAlign: 'center', background: 'linear-gradient(to bottom, rgba(11,15,25,0.9), rgba(26,34,53,0.9))' }}>
            <h1 style={{ color: 'white', marginBottom: '0.2rem', fontSize: '2.5rem', letterSpacing: '4px', textShadow: '0 0 20px rgba(0,196,204,0.5)' }}>VICTOR<span style={{color: 'var(--geo-secondary)'}}>IA</span></h1>
            
            {/* Character Selector */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', overflowX: 'auto', padding: '1rem', maxWidth: '100%' }}>
              {CHARACTERS.map(char => {
                const isUnlocked = unlockedChars.includes(char.id);
                const isSelected = selectedCharId === char.id;
                return (
                  <div 
                    key={char.id}
                    onClick={() => {
                      if (isUnlocked) {
                        setSelectedCharId(char.id);
                        localStorage.setItem('geo_selected_char', char.id);
                      } else if (totalCoins >= char.cost) {
                        const newUnlocked = [...unlockedChars, char.id];
                        setUnlockedChars(newUnlocked);
                        localStorage.setItem('geo_unlocked_chars', JSON.stringify(newUnlocked));
                        const newCoins = totalCoins - char.cost;
                        setTotalCoins(newCoins);
                        localStorage.setItem('geo_total_coins', newCoins.toString());
                        setSelectedCharId(char.id);
                        localStorage.setItem('geo_selected_char', char.id);
                      }
                    }}
                    style={{ 
                      minWidth: '140px', padding: '1rem', borderRadius: '16px', cursor: 'pointer',
                      background: isSelected ? 'rgba(0,196,204,0.2)' : 'rgba(255,255,255,0.05)',
                      border: isSelected ? '2px solid #00ffff' : '2px solid rgba(255,255,255,0.1)',
                      opacity: isUnlocked ? 1 : 0.6,
                      display: 'flex', flexDirection: 'column', alignItems: 'center'
                    }}
                  >
                    <div style={{ 
                      width: '80px', height: '80px', marginBottom: '0.5rem', 
                      backgroundImage: url(), 
                      backgroundSize: char.type === 'spritesheet' ? '500% 400%' : 'contain', 
                      backgroundPosition: '0% 0%', backgroundRepeat: 'no-repeat',
                      filter: !isUnlocked ? 'grayscale(100%)' : 'drop-shadow(0 0 10px rgba(0,255,255,0.5))' 
                    }} />
                    <span style={{ fontSize: '0.9rem', color: 'white', fontWeight: 'bold' }}>{char.name}</span>
                    {!isUnlocked && (
                      <span style={{ fontSize: '0.8rem', color: '#ffd32a', marginTop: '0.5rem' }}>💰 {char.cost} Data</span>
                    )}
                  </div>
                );
              })}
            </div>
            
            <p style={{ color: 'var(--geo-secondary)', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Data Total: {totalCoins}</p>
            <button onClick={resetGame} className="btn btn-primary" style={{ padding: '0.8rem 2rem', fontSize: '1.2rem', boxShadow: '0 0 30px rgba(0,196,204,0.5)' }}>
              <Play size={24} style={{ marginRight: '0.5rem' }}/> INICIAR MISIÓN
            </button>
          </div>
        )}
"""

content = re.sub(
    r"\{gameState === 'idle' && \([\s\S]*?</button>\s*</div>\s*\)\}",
    idle_screen.strip(),
    content
)

with open('src/components/ActiveBreak.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch applied successfully.")

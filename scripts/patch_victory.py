import re
with open('src/components/ActiveBreak.jsx', 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace(
    "setGameState('victory');",
    "setGameState('victory');\n      const newCoins = totalCoins + state.score;\n      setTotalCoins(newCoins);\n      localStorage.setItem('geo_total_coins', newCoins.toString());"
)
with open('src/components/ActiveBreak.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

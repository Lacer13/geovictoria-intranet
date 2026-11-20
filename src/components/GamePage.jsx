import React, { useState } from "react";
import ActiveBreak from "./ActiveBreak";
import ArenaOnline from "../game/ArenaOnline.jsx";
import { ChevronLeft, Snowflake } from "lucide-react";
import { useNavigate } from "react-router-dom";

const GamePage = () => {
  const [gameMode, setGameMode] = useState(() => location.hash.includes("sala=") ? "arena" : "adventure");
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/");
  };

  return (
    <div className="game-page">
      {/* Header / Back Button */}
      <div className="game-page-header">
        <button
          onClick={handleBack}
          className="btn btn-secondary"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "rgba(255,255,255,0.1)",
            border: "none",
          }}
        >
          <ChevronLeft size={20} />
          Volver al Portal
        </button>
        <span className="game-page-season">
          <Snowflake size={18} /> El taller de Navidad
        </span>
      </div>

      {/* Game Container */}
      <div className="game-page-content">
        <nav className="game-mode-tabs" aria-label="Cómo quieres jugar">
          <button aria-pressed={gameMode === "adventure"} onClick={() => setGameMode("adventure")}>Aventura individual</button>
          <button aria-pressed={gameMode === "arena"} onClick={() => setGameMode("arena")}>Arena en línea · 1 vs 1</button>
        </nav>
        <div className="game-stage">
          {gameMode === "arena" ? <ArenaOnline /> : <ActiveBreak />}
        </div>
      </div>
    </div>
  );
};

export default GamePage;

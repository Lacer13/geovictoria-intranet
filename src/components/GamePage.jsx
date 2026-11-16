import React from "react";
import ActiveBreak from "./ActiveBreak";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const GamePage = () => {
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
          <ArrowLeft size={20} />
          Volver al Portal
        </button>
      </div>

      {/* Game Container */}
      <p className="game-instructions">
        Una pausa con VictorIA · Muévete con las flechas o WASD y dispara con
        espacio. En tu teléfono, usa los controles táctiles.
      </p>
      <div className="game-page-content">
        <div className="game-stage">
          <ActiveBreak isFullscreen={true} />
        </div>
      </div>
    </div>
  );
};

export default GamePage;

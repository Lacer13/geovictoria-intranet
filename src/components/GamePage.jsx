import React from "react";
import ActiveBreak from "./ActiveBreak";
import { ChevronLeft, Snowflake } from "lucide-react";
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
          <ChevronLeft size={20} />
          Volver al Portal
        </button>
        <span className="game-page-season">
          <Snowflake size={18} /> El taller de Navidad
        </span>
      </div>

      {/* Game Container */}
      <div className="game-page-content">
        <div className="game-stage">
          <ActiveBreak />
        </div>
      </div>
    </div>
  );
};

export default GamePage;

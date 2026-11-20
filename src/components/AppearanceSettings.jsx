import { Moon, Snowflake, Sun } from "lucide-react";
import Modal from "./Modal";
import { atmosphereOptions } from "../lib/appearance";

export default function AppearanceSettings({
  isLightMode,
  toggleTheme,
  atmosphere,
  setAtmosphere,
  onClose,
}) {
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  return (
    <Modal title="Ajustar vista" onClose={onClose} className="appearance-modal">
      <p className="appearance-intro">
        Un espacio cómodo para trabajar, con un toque de Navidad.
      </p>
      <fieldset className="appearance-group">
        <legend>Aspecto del portal</legend>
        <div className="appearance-themes">
          <label
            className={`appearance-choice ${isLightMode ? "selected" : ""}`}
          >
            <input
              type="radio"
              name="portal-theme"
              checked={isLightMode}
              onChange={() => {
                if (!isLightMode) toggleTheme();
              }}
            />
            <Sun size={21} />
            <span>Claro</span>
          </label>
          <label
            className={`appearance-choice ${!isLightMode ? "selected" : ""}`}
          >
            <input
              type="radio"
              name="portal-theme"
              checked={!isLightMode}
              onChange={() => {
                if (isLightMode) toggleTheme();
              }}
            />
            <Moon size={21} />
            <span>Oscuro</span>
          </label>
        </div>
      </fieldset>
      <fieldset className="appearance-group">
        <legend>Ambiente navideño</legend>
        <div className="appearance-options">
          {atmosphereOptions.map((option) => (
            <label
              key={option.id}
              className={`appearance-choice ${atmosphere === option.id ? "selected" : ""}`}
            >
              <input
                type="radio"
                name="portal-atmosphere"
                checked={atmosphere === option.id}
                onChange={() => setAtmosphere(option.id)}
              />
              <Snowflake size={22} />
              <span>
                <strong>{option.label}</strong>
                <small>{option.description}</small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {reducedMotion && (
        <p className="inline-notice" role="status">
          Tu dispositivo tiene activado Reducir movimiento. La decoración se
          mantiene estática.
        </p>
      )}
      <div className="appearance-footer">
        <small>Tu elección se recuerda en este navegador.</small>
        <button className="btn btn-forest" onClick={onClose}>
          Listo
        </button>
      </div>
    </Modal>
  );
}

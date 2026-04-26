// =============================================
// HUD — Panel React superpuesto al juego
// Layout: esquinas con medidores analógicos
// =============================================
import { useGameStore } from '../../store/gameStore';
import { EnergyMeter } from './EnergyMeter';
import { LogicMeter } from './LogicMeter';
import { ControlPanel } from './ControlPanel';
import './hud.css';
import './energy-alert.css';

export function HUD() {
  const isGameOver = useGameStore((s) => s.isGameOver);
  const isGlitching = useGameStore((s) => s.isGlitching);
  const armor = useGameStore((s) => s.armor);
  const energy = useGameStore((s) => s.energy);
  const wave = useGameStore((s) => s.wave);
  const timeElapsed = useGameStore((s) => s.timeElapsed);
  const scrapMetal = useGameStore((s) => s.scrapMetal);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}m ${sec.toString().padStart(2, '0')}s`;
  };

  return (
    <div className={`hud-overlay ${isGlitching ? 'hud-glitch' : ''}`}>
      {/* Esquina superior izquierda: Energía */}
      <div className="hud-corner hud-top-left">
        <EnergyMeter />
      </div>

      {/* Esquina superior derecha: Nucleo Logico */}
      <div className="hud-corner hud-top-right">
        <LogicMeter />
      </div>

      {/* Panel lateral derecho: Control de ingeniería */}
      <div className="hud-right-panel">
        <ControlPanel />
      </div>

      {/* Alerta UI de Batería Baja */}
      {!isGameOver && energy <= 0 && (
        <div className="energy-alert-overlay">
          <div className="energy-alert-box">
            <span className="alert-icon">⚠️</span>
            <span className="alert-text">BATTERY DEPLETED<br/>APPROACH THE CORE TO RECHARGE</span>
          </div>
        </div>
      )}

      {/* Overlay de game over ya manejado en Phaser, pero podemos
          añadir capa React encima si es necesario */}
      {isGameOver && (
        <div className="gameover-overlay">
          <div className="gameover-panel">
            <div className="gameover-icon">☠️</div>
            <h1 className="gameover-title">PROTOCOL TERMINATED</h1>
            <p className="gameover-sub">
              {armor <= 0 ? 'SOL-0 has been destroyed.' : 'The Energy Core has collapsed.'}
            </p>
            <div className="gameover-divider" />
            <div className="gameover-stats">
              <div className="gameover-stat-row">
                <span className="stat-label">WAVE REACHED</span>
                <span className="stat-value">{wave}</span>
              </div>
              <div className="gameover-stat-row">
                <span className="stat-label">TIME SURVIVED</span>
                <span className="stat-value">{formatTime(timeElapsed)}</span>
              </div>
              <div className="gameover-stat-row">
                <span className="stat-label">SCRAP REMAINING</span>
                <span className="stat-value">{Math.floor(scrapMetal)}</span>
              </div>
            </div>
            <div className="gameover-divider" />
            <button className="gameover-btn" onClick={() => window.location.reload()}>
              🔄 RESTART PROTOCOL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

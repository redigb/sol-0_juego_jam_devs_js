// =============================================
// HUD — Panel React superpuesto al juego
// Layout: esquinas con medidores analógicos
// =============================================
import { useGameStore } from '../../store/gameStore';
import { EnergyMeter } from './EnergyMeter';
import { LogicMeter } from './LogicMeter';
import { ControlPanel } from './ControlPanel';
import './hud.css';

export function HUD() {
  const isGameOver = useGameStore((s) => s.isGameOver);
  const isGlitching = useGameStore((s) => s.isGlitching);
  const armor = useGameStore((s) => s.armor);

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

      {/* Overlay de game over ya manejado en Phaser, pero podemos
          añadir capa React encima si es necesario */}
      {isGameOver && (
        <div className="gameover-overlay">
          <div className="gameover-panel">
            <div className="gameover-icon">☠️</div>
            <h1 className="gameover-title">PROTOCOLO TERMINADO</h1>
            <p className="gameover-sub">
              {armor <= 0 ? 'SOL-0 ha sido destruido.' : 'El Núcleo de Energía ha colapsado.'}
            </p>
            <div className="gameover-divider" />
            <button className="gameover-btn" onClick={() => window.location.reload()}>
              🔄 REINICIAR PROTOCOLO
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

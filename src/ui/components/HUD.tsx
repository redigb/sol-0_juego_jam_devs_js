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
          {/* El game over visual principal lo maneja Phaser */}
        </div>
      )}
    </div>
  );
}

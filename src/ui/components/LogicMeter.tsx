// =============================================
// LogicMeter — Estabilidad del Nucleo de Logica
// Estilo: terminal rústica, texto arañado
// =============================================
import { useGameStore } from '../../store/gameStore';
import './meters.css';

const LOG_LINES = [
  'PROCESO 0x4A: NOMINAL',
  'PROCESO 0x4B: NOMINAL',
  'PROCESO 0x4C: DEGRADADO',
  'HEURISTICA: ACTIVA',
  'SUBSISTEMA MOTOR: OK',
  'MODULO SENSOR: FALLO',
  'CALCULO RUTA: ERROR',
  'PROCESO 0x0F: CRITICAL',
];

export function LogicMeter() {
  const logic = useGameStore((s) => s.logic);
  const isGlitching = useGameStore((s) => s.isGlitching);

  const isLow = logic < 40;
  const isCritical = isGlitching;

  const barColor = isCritical ? '#ff2200' : isLow ? '#ff8800' : '#9b30ff';
  const statusText = isCritical
    ? 'GLITCHING'
    : isLow
    ? 'DEGRADADO'
    : 'ESTABLE';

  // Cuántas líneas del log "fallan" (más con lógica baja)
  const failCount = Math.floor(((100 - logic) / 100) * LOG_LINES.length);

  return (
    <div className={`meter-panel logic-panel ${isCritical ? 'meter-critical' : ''}`}>
      <div className="meter-header">
        <span className="meter-label">NUCLEO LOGICO</span>
        <span
          className={`meter-status ${isCritical ? 'status-critical' : isLow ? 'status-low' : 'status-ok'}`}
        >
          {statusText}
        </span>
      </div>

      {/* Barra de lógica principal */}
      <div className="logic-bar-container">
        <div className="logic-bar-bg">
          <div
            className={`logic-bar-fill ${isCritical ? 'logic-bar-glitch' : ''}`}
            style={{
              width: `${logic}%`,
              backgroundColor: barColor,
              boxShadow: `0 0 6px ${barColor}`,
            }}
          />
        </div>
        <span className="logic-value" style={{ color: barColor }}>
          {Math.floor(logic)}%
        </span>
      </div>

      {/* Log de procesos (estilo terminal) */}
      <div className="process-log">
        {LOG_LINES.map((line, i) => {
          const isFail = i >= LOG_LINES.length - failCount;
          return (
            <div
              key={i}
              className={`process-line ${isFail ? 'process-fail' : 'process-ok'} ${isFail && isCritical ? 'process-glitch' : ''}`}
            >
              <span className="process-dot">{isFail ? '✗' : '✓'}</span>
              {line}
            </div>
          );
        })}
      </div>

      {/* Mensaje de advertencia cuando glitchea */}
      {isCritical && (
        <div className="glitch-warning">
          ⚠ CONTROLES INVERTIDOS
        </div>
      )}
    </div>
  );
}

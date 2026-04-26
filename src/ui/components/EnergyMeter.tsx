// =============================================
// EnergyMeter — Medidor de WATTS (energía)
// Estilo: analógico, rústico, arañado
// =============================================
import { useGameStore } from '../../store/gameStore';
import './meters.css';

export function EnergyMeter() {
  const energy = useGameStore((s) => s.energy);
  const cableIntegrity = useGameStore((s) => s.cableIntegrity);

  const isCritical = energy < 20;
  const isLow = energy < 40;

  const barColor = isCritical ? '#ff2200' : isLow ? '#ff8800' : '#00c8ff';

  // Aguja de manómetro: -120° a +120° segun energy 0-100
  const needleAngle = -120 + (energy / 100) * 240;

  return (
    <div className={`meter-panel energy-panel ${isCritical ? 'meter-critical' : ''}`}>
      <div className="meter-header">
        <span className="meter-label">ENERGY</span>
        <span className="meter-unit" style={{ color: barColor }}>WATTS</span>
      </div>

      {/* Manómetro circular */}
      <div className="gauge-container">
        <svg width="100" height="60" viewBox="0 0 100 60">
          {/* Arco de fondo */}
          <path
            d="M 10 55 A 40 40 0 0 1 90 55"
            fill="none" stroke="#1a1208" strokeWidth="8"
          />
          {/* Arco de valor */}
          <path
            d="M 10 55 A 40 40 0 0 1 90 55"
            fill="none"
            stroke={barColor}
            strokeWidth="6"
            strokeDasharray={`${(energy / 100) * 125.6} 125.6`}
            strokeLinecap="round"
            opacity="0.85"
          />
          {/* Marcas de tique */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const a = (-120 + (tick / 100) * 240) * (Math.PI / 180);
            const r = 34;
            const x1 = 50 + r * Math.cos(a - Math.PI / 2);
            const y1 = 55 + r * Math.sin(a - Math.PI / 2);
            const x2 = 50 + (r - 5) * Math.cos(a - Math.PI / 2);
            const y2 = 55 + (r - 5) * Math.sin(a - Math.PI / 2);
            return <line key={tick} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#3a2810" strokeWidth="1.5" />;
          })}
          {/* Aguja */}
          <line
            x1="50" y1="55"
            x2={50 + 28 * Math.cos((needleAngle - 90) * (Math.PI / 180))}
            y2={55 + 28 * Math.sin((needleAngle - 90) * (Math.PI / 180))}
            stroke={barColor}
            strokeWidth="2"
            strokeLinecap="round"
            style={{ transition: 'all 0.3s ease' }}
          />
          {/* Centro de la aguja */}
          <circle cx="50" cy="55" r="3" fill="#3a2810" />
          {/* Valor numérico */}
          <text x="50" y="48" textAnchor="middle" fill={barColor}
            fontSize="10" fontFamily="'Share Tech Mono', monospace">
            {Math.floor(energy)}
          </text>
        </svg>
      </div>

      {/* Barra de integridad del cable */}
      <div className="sub-meter">
        <span className="sub-label">CABLE INT.</span>
        <div className="sub-bar-bg">
          <div
            className="sub-bar-fill"
            style={{
              width: `${cableIntegrity}%`,
              backgroundColor: cableIntegrity < 40 ? '#ff2200' : '#7a3b1e',
            }}
          />
        </div>
        <span className="sub-value" style={{ color: cableIntegrity < 40 ? '#ff2200' : '#7a5a3a' }}>
          {Math.floor(cableIntegrity)}%
        </span>
      </div>
    </div>
  );
}

// =============================================
// ControlPanel — Panel de control de ingeniería
// Medidores analógicos + botones de acción
// =============================================
import { useGameStore } from '../../store/gameStore';
import './meters.css';

export function ControlPanel() {
  const { scrapMetal, circuitMolds, twistedRebar, wave, timeElapsed, spiderBots, buildings } = useGameStore();
  const addSpiderBot = useGameStore((s) => s.addSpiderBot);
  const spendResource = useGameStore((s) => s.spendResource);
  const addBuilding = useGameStore((s) => s.addBuilding);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

  const handleBuildDrill = () => {
    if (spendResource('scrapMetal', 8) && spendResource('twistedRebar', 3)) {
      addBuilding({
        id: `drill_${Date.now()}`,
        type: 'drill',
        x: 300 + rand(-80, 80),
        y: 300 + rand(-80, 80),
        active: true,
        energyCost: 2,
        overclock: false,
      });
    }
  };

  const handleDeployBot = () => {
    addSpiderBot();
  };

  return (
    <div className="control-panel">
      {/* Header rústico */}
      <div className="cp-header">
        <span className="cp-title">LOGIC SCHEMA</span>
        <span className="cp-wave">WAVE {wave}</span>
      </div>

      {/* Tiempo */}
      <div className="cp-time">
        <span className="cp-time-label">UPTIME</span>
        <span className="cp-time-value">{formatTime(timeElapsed)}</span>
      </div>

      {/* Recursos */}
      <div className="cp-section-title">RESOURCES</div>
      <div className="resources-grid">
        <ResourceRow label="SCRAP" value={scrapMetal} icon="⚙" />
        <ResourceRow label="CIRCUITS" value={circuitMolds} icon="⬡" />
        <ResourceRow label="REBAR" value={twistedRebar} icon="┃" />
      </div>

      {/* Infra activa */}
      <div className="cp-section-title">INFRASTRUCTURE</div>
      <div className="infra-grid">
        <div className="infra-item">
          <span className="infra-label">DRILLS</span>
          <span className="infra-value">{buildings.filter(b => b.type === 'drill').length}</span>
        </div>
        <div className="infra-item">
          <span className="infra-label">SPIDER-BOTS</span>
          <span className="infra-value" style={{ color: '#00c8ff' }}>{spiderBots.length}</span>
        </div>
      </div>

      {/* Spider-bots activos */}
      {spiderBots.length > 0 && (
        <div className="bots-section">
          <div className="cp-section-title">SPIDER-BOTS</div>
          {spiderBots.map((bot) => (
            <div key={bot.id} className="bot-row">
              <div className="bot-energy-bar">
                <div
                  className="bot-energy-fill"
                  style={{
                    width: `${bot.energy}%`,
                    backgroundColor: bot.energy < 20 ? '#ff2200' : '#9b30ff',
                  }}
                />
              </div>
              <span className={`bot-state bot-state-${bot.state}`}>
                {bot.state.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Botones de acción */}
      <div className="cp-section-title">ACTIONS</div>
      <div className="actions-grid">
        <ActionButton
          label="SPIDER-BOT"
          cost="5⬡ + 3⚙"
          canAfford={circuitMolds >= 5 && scrapMetal >= 3}
          onClick={handleDeployBot}
        />
        <ActionButton
          label="DRILL"
          cost="8⚙ + 3┃"
          canAfford={scrapMetal >= 8 && twistedRebar >= 3}
          onClick={handleBuildDrill}
        />
      </div>

      {/* Leyenda de controles */}
      <div className="controls-legend">
        <div className="legend-row"><kbd>WASD</kbd><span>Move SOL-0</span></div>
        <div className="legend-row"><kbd>E</kbd><span>Collect scrap</span></div>
        <div className="legend-row"><kbd>Q</kbd><span>Deploy Spider-Bot</span></div>
      </div>
    </div>
  );
}

function ResourceRow({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="resource-row">
      <span className="resource-icon">{icon}</span>
      <span className="resource-label">{label}</span>
      <span className="resource-value">{Math.floor(value)}</span>
    </div>
  );
}

function ActionButton({
  label, cost, canAfford, onClick,
}: {
  label: string;
  cost: string;
  canAfford: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`action-btn ${canAfford ? 'action-btn-ready' : 'action-btn-disabled'}`}
      onClick={canAfford ? onClick : undefined}
      disabled={!canAfford}
    >
      <span className="action-label">{label}</span>
      <span className="action-cost">{cost}</span>
    </button>
  );
}

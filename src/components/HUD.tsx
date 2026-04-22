import React from 'react';
import { useGameStore } from '../store/gameStore';
import './HUD.css';

export const HUD: React.FC = () => {
    const energy = useGameStore((s) => s.energy);
    const logic = useGameStore((s) => s.logic);
    const armor = useGameStore((s) => s.armor);
    const scrap = useGameStore((s) => s.scrapMetal);
    const isGlitching = useGameStore((s) => s.isGlitching);
    const gameStarted = useGameStore((s) => s.gameStarted);
    const isGameOver = useGameStore((s) => s.isGameOver);
    const setFactoryOpen = useGameStore((s) => s.setFactoryOpen);

    if (!gameStarted) return null;

    return (
        <div className={`hud-root ${isGlitching ? 'glitch-active' : ''}`}>
            {/* Bottom Left: Vital Status (Horizontal) */}
            <div className="hud-bottom-left">
                <div className="status-bars">
                    {/* Energy Bar */}
                    <div className="bar-container energy">
                        <div className="bar-label">PWR</div>
                        <div className="bar-bg">
                            <div className="bar-fill" style={{ width: `${energy}%` }}></div>
                        </div>
                        <div className="bar-value">{Math.round(energy)}%</div>
                    </div>

                    {/* Logic Bar */}
                    <div className="bar-container logic">
                        <div className="bar-label">LOG</div>
                        <div className="bar-bg">
                            <div className="bar-fill" style={{ width: `${logic}%` }}></div>
                        </div>
                        <div className="bar-value">{Math.round(logic)}%</div>
                    </div>

                    {/* Armor Bar */}
                    <div className="bar-container armor">
                        <div className="bar-label">ARM</div>
                        <div className="bar-bg">
                            <div className="bar-fill" style={{ width: `${armor}%` }}></div>
                        </div>
                        <div className="bar-value">{Math.round(armor)}%</div>
                    </div>
                </div>
            </div>

            {/* Bottom Right: Resources & Global Factory Button */}
            <div className="hud-bottom-right">
                {/* Scrap Counter (Read-only) */}
                <div className="resource-display scrap-meter">
                    <div className="res-label">CHATARRA</div>
                    <div className="res-content">
                        <span className="res-icon">⚙️</span>
                        <span className="res-count">{scrap}</span>
                    </div>
                </div>

                {/* Factory Button (Interactive) */}
                <div 
                    className="factory-trigger" 
                    title="Módulo de Construcción"
                    onClick={() => setFactoryOpen(true)}
                >
                    <span className="trigger-icon">🛠️</span>
                </div>
            </div>

            {/* Game Over Overlay */}
            {isGameOver && (
                <div className="go-overlay">
                    <div className="go-panel">
                        <div className="go-icon">☠️</div>
                        <h1 className="go-title">PROTOCOLO TERMINADO</h1>
                        <p className="go-sub">
                            {armor <= 0 ? 'SOL-0 ha sido destruido.' : 'El Núcleo de Energía ha colapsado.'}
                        </p>
                        <div className="go-divider" />
                        <button className="go-btn" onClick={() => window.location.reload()}>
                            🔄 REINICIAR PROTOCOLO
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

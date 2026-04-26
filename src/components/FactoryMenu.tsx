import React from 'react';
import { useGameStore } from '../store/gameStore';
import './FactoryMenu.css';

export const FactoryMenu: React.FC = () => {
    const isFactoryOpen = useGameStore((s) => s.isFactoryOpen);
    const setFactoryOpen = useGameStore((s) => s.setFactoryOpen);
    const scrap = useGameStore((s) => s.scrapMetal);

    if (!isFactoryOpen) return null;

    const buildItem = (type: string, cost: number) => {
        if (scrap >= cost) {
            window.dispatchEvent(new CustomEvent('START_BUILD_MODE', { detail: type }));
            setFactoryOpen(false);
        }
    };

    return (
        <div className="factory-overlay">
            <div className="factory-modal">
                <div className="factory-header">
                    <div className="header-title">FABRICATION MODULE</div>
                    <button className="close-btn" onClick={() => setFactoryOpen(false)}>×</button>
                </div>
                
                <div className="factory-body">
                    <div className="factory-info">
                        AVAILABLE SCRAP: <span className="highlight">{scrap}</span> SCRAP
                    </div>

                    <h3 className="section-title">STRUCTURES</h3>
                    <div className="build-grid">
                        <div className={`build-card ${scrap < 5 ? 'disabled' : ''}`} onClick={() => {
                            if (scrap >= 5) {
                                window.dispatchEvent(new CustomEvent('START_BUILD_MODE', { detail: 'WALL' }));
                                setFactoryOpen(false);
                            }
                        }}>
                            <div className="card-icon">🧱</div>
                            <div className="card-info">
                                <div className="card-name">DEFENSIVE WALL</div>
                                <div className="card-desc">Resistant isometric block.</div>
                                <div className="card-cost">5 SCRAP</div>
                            </div>
                        </div>

                        <div className={`build-card ${scrap < 10 ? 'disabled' : ''}`} onClick={() => {
                            if (scrap >= 10) {
                                window.dispatchEvent(new CustomEvent('START_BUILD_MODE', { detail: 'GATE' }));
                                setFactoryOpen(false);
                            }
                        }}>
                            <div className="card-icon">⚡</div>
                            <div className="card-info">
                                <div className="card-name">LASER GATE</div>
                                <div className="card-desc">Blocks enemies, lets SOL-0 through.</div>
                                <div className="card-cost">10 SCRAP</div>
                            </div>
                        </div>
                    </div>

                    <h3 className="section-title">DEFENSES & SYSTEMS</h3>
                    <div className="build-grid">
                        <div className={`build-card ${scrap < 30 ? 'disabled' : ''}`} onClick={() => buildItem('turret', 30)}>
                            <div className="card-icon">🎯</div>
                            <div className="card-info">
                                <div className="card-name">DEFENSE TURRET</div>
                                <div className="card-desc">Automatic defense. Requires ammo (Scrap).</div>
                                <div className="card-cost">30 SCRAP</div>
                            </div>
                        </div>

                        <div className={`build-card ${scrap < 5 ? 'disabled' : ''}`} onClick={() => buildItem('cableNode', 5)}>
                            <div className="card-icon">🔌</div>
                            <div className="card-info">
                                <div className="card-name">NETWORK NODE</div>
                                <div className="card-desc">Extends energy range.</div>
                                <div className="card-cost">5 SCRAP</div>
                            </div>
                        </div>
                    </div>

                    <h3 className="section-title">TOOLS</h3>
                    <div className="build-grid">
                        <div className="build-card tool-card" onClick={() => {
                            window.dispatchEvent(new CustomEvent('START_BUILD_MODE', { detail: 'DEMOLISH' }));
                            setFactoryOpen(false);
                        }}>
                            <div className="card-icon">♻️</div>
                            <div className="card-info">
                                <div className="card-name">RECYCLER</div>
                                <div className="card-desc">Destroys structures. Returns scrap if intact.</div>
                                <div className="card-cost" style={{ color: '#00ff00' }}>FREE</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="factory-footer">
                    SYSTEM STATUS: <span className="status-ok">OPERATIONAL</span>
                </div>
            </div>
        </div>
    );
};

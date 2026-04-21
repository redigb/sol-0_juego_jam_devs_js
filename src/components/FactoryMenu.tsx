import React from 'react';
import { useGameStore } from '../store/gameStore';
import './FactoryMenu.css';

export const FactoryMenu: React.FC = () => {
    const isFactoryOpen = useGameStore((s) => s.isFactoryOpen);
    const setFactoryOpen = useGameStore((s) => s.setFactoryOpen);
    const scrap = useGameStore((s) => s.scrapMetal);
    const addBuilding = useGameStore((s) => s.addBuilding);
    const spendResource = useGameStore((s) => s.spendResource);

    if (!isFactoryOpen) return null;

    const buildItem = (type: 'turret' | 'drill' | 'cableNode', cost: number) => {
        if (scrap < cost) return;
        
        if (spendResource('scrapMetal', cost)) {
            // In a real game, this would trigger a placement mode in Phaser
            // For now, we just add it to the state to demonstrate
            addBuilding({
                id: `bld_${Date.now()}`,
                type,
                x: 0, 
                y: 0,
                active: true,
                energyCost: type === 'turret' ? 5 : 2,
                overclock: false
            });
            // Auto close after building for now or keep open? 
            // setFactoryOpen(false);
        }
    };

    return (
        <div className="factory-overlay">
            <div className="factory-modal">
                <div className="factory-header">
                    <div className="header-title">MÓDULO DE FABRICACIÓN</div>
                    <button className="close-btn" onClick={() => setFactoryOpen(false)}>×</button>
                </div>
                
                <div className="factory-body">
                    <div className="factory-info">
                        CHASIS DISPONIBLES: <span className="highlight">{scrap}</span> CHATARRA
                    </div>

                    <div className="build-grid">
                        <div className={`build-card ${scrap < 15 ? 'disabled' : ''}`} onClick={() => buildItem('turret', 15)}>
                            <div className="card-icon">🎯</div>
                            <div className="card-info">
                                <div className="card-name">TORRETA DEFENSIVA</div>
                                <div className="card-desc">Defensa automática contra rastreros.</div>
                                <div className="card-cost">15 CHATARRA</div>
                            </div>
                        </div>

                        <div className={`build-card ${scrap < 10 ? 'disabled' : ''}`} onClick={() => buildItem('drill', 10)}>
                            <div className="card-icon">⛏️</div>
                            <div className="card-info">
                                <div className="card-name">PERFORADORA</div>
                                <div className="card-desc">Extracción pasiva de recursos.</div>
                                <div className="card-cost">10 CHATARRA</div>
                            </div>
                        </div>

                        <div className={`build-card ${scrap < 5 ? 'disabled' : ''}`} onClick={() => buildItem('cableNode', 5)}>
                            <div className="card-icon">🔌</div>
                            <div className="card-info">
                                <div className="card-name">NODO DE RED</div>
                                <div className="card-desc">Extiende el rango de energía.</div>
                                <div className="card-cost">5 CHATARRA</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="factory-footer">
                    ESTADO DEL SISTEMA: <span className="status-ok">OPERATIVO</span>
                </div>
            </div>
        </div>
    );
};

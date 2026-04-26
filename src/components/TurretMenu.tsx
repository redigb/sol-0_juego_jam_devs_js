import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import './FactoryMenu.css'; // Reusar estilos para consistencia

export const TurretMenu: React.FC = () => {
    const isOpen = useGameStore((s) => s.isTurretMenuOpen);
    const setOpen = useGameStore((s) => s.setTurretMenuOpen);
    const turret = useGameStore((s) => s.currentTurretData);
    const scrap = useGameStore((s) => s.scrapMetal);
    const spendResource = useGameStore((s) => s.spendResource);
    const rechargeTurret = useGameStore((s) => s.rechargeTurret);

    const [rechargeAmount, setRechargeAmount] = useState(1);

    if (!isOpen || !turret) return null;

    const BULLETS_PER_SCRAP = 2;

    // Scrap units needed to fill remaining ammo (capped by available scrap)
    const bulletsNeeded = Math.max(0, turret.maxAmmo - turret.ammo);
    const maxCanAdd = Math.min(scrap, Math.ceil(bulletsNeeded / BULLETS_PER_SCRAP));

    // Clamp current selection if it exceeds what's actually insertable
    const safeAmount = Math.min(rechargeAmount, Math.max(1, maxCanAdd));
    const isFull = turret.ammo >= turret.maxAmmo;
    const canRecharge = !isFull && scrap >= safeAmount && safeAmount > 0;

    const handleRecharge = () => {
        if (!canRecharge) return;
        if (spendResource('scrapMetal', safeAmount)) {
            rechargeTurret(turret.id, safeAmount * BULLETS_PER_SCRAP);
        }
    };

    return (
        <div className="factory-overlay">
            <div className="factory-modal" style={{ maxWidth: '400px' }}>
                <div className="factory-header">
                    <div className="header-title">DEFENSE SYSTEM: TURRET</div>
                    <button className="close-btn" onClick={() => setOpen(false, null)}>×</button>
                </div>
                
                <div className="factory-body">
                    <div className="factory-info">
                        CURRENT AMMO: <span className={turret.ammo < 10 ? 'status-critical' : 'highlight'}>
                            {turret.ammo} / {turret.maxAmmo}
                        </span>
                    </div>

                    <div style={{ margin: '20px 0', padding: '15px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
                        <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '10px' }}>
                            Insert scrap to reload (1 Scrap = 2 Bullets)
                        </p>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', justifyContent: 'center' }}>
                            <button 
                                className="nav-btn" 
                                onClick={() => setRechargeAmount(Math.max(1, rechargeAmount - 1))}
                                disabled={rechargeAmount <= 1}
                            >◀</button>

                            <div style={{ fontSize: '24px', fontWeight: 'bold', minWidth: '40px', textAlign: 'center' }}>
                                {safeAmount}
                            </div>

                            <button
                                className="nav-btn"
                                onClick={() => setRechargeAmount(Math.min(maxCanAdd, rechargeAmount + 1))}
                                disabled={rechargeAmount >= maxCanAdd || isFull}
                            >▶</button>
                        </div>

                        <button
                            className={`build-btn ${!canRecharge ? 'disabled' : ''}`}
                            style={{ width: '100%', marginTop: '20px', padding: '12px' }}
                            onClick={handleRecharge}
                            disabled={!canRecharge}
                        >
                            {isFull ? 'AMMO FULL' : `RELOAD (+${safeAmount * BULLETS_PER_SCRAP} bullets)`}
                        </button>
                    </div>

                    <div className="factory-info" style={{ fontSize: '12px' }}>
                        AVAILABLE RESOURCES: <span className="highlight">{scrap}</span> SCRAP
                    </div>
                </div>

                <div className="factory-footer">
                    STATUS: {turret.ammo > 0 ? <span className="status-ok">ARMED</span> : <span className="status-critical">NO AMMO</span>}
                </div>
            </div>
        </div>
    );
};

import { useGameStore } from '../../store/gameStore';

export type TowerState = 'CLOSED' | 'OPENING' | 'OPENED' | 'CLOSING';

export class EnergyTower extends Phaser.GameObjects.Sprite {
    private currentState: TowerState = 'CLOSED';
    public hp: number = 500;
    private maxHp: number = 500;
    public currentPhase: 1 | 2 = 1;
    public isDead: boolean = false;
    private hpBar: Phaser.GameObjects.Graphics;
    private lastHitTime: number = 0;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        // Inicialmente con el primer frame de opening para que se vea cerrada
        super(scene, x, y, 'tower-opening', 0);
        this.setOrigin(0.5, 1);
        this.setScale(3.5);
        this.setDepth(y);

        scene.add.existing(this);
        scene.physics.add.existing(this, true); 

        const body = this.body as Phaser.Physics.Arcade.StaticBody;
        // El StaticBody de un Sprite normal ignora la escala.
        // Usamos setSize con dimensiones en píxeles de mundo (el sprite es ~60x90px escalado a 3.5)
        // y luego forzamos el recentrado con reset() para alinearlo con la base visual.
        const W = 110; // ancho del cilindro en px de mundo
        const H = 80;  // alto aproximado de la base
        body.setSize(W, H);
        // reset() reposiciona el body en las coordenadas de mundo del sprite (x, y - origen en base)
        body.reset(x, y - H / 2);

        this.hpBar = scene.add.graphics();
        this.drawHpBar();

        // Configurar eventos de animación para la máquina de estados
        this.on('animationcomplete', (animation: Phaser.Animations.Animation) => {
            if (animation.key === 'tower-opening') {
                this.setTowerState('OPENED');
            } else if (animation.key === 'tower-closing') {
                this.setTowerState('CLOSED');
            }
        });
    }

    private drawHpBar() {
        this.hpBar.clear();
        if (this.isDead) return;

        const w = 150;
        const h = 10;
        const x = this.x - w / 2;
        const y = this.y - 180;

        // Fondo
        this.hpBar.fillStyle(0x000000, 0.8);
        this.hpBar.fillRect(x, y, w, h);

        // Salud (Color según fase)
        const healthWidth = (this.hp / this.maxHp) * w;
        const color = this.currentPhase === 1 ? 0x00ffff : 0xff0000;
        this.hpBar.fillStyle(color, 1);
        this.hpBar.fillRect(x, y, healthWidth, h);
        
        this.hpBar.setDepth(2000);
    }

    public takeDamage(amount: number) {
        if (this.isDead) return;

        // Cooldown de daño para el núcleo
        const now = this.scene.time.now;
        if (now < this.lastHitTime + 150) return;
        this.lastHitTime = now;

        this.hp -= amount;
        this.drawHpBar();

        // Flash visual
        this.setTint(0xff8888);
        this.scene.time.delayedCall(100, () => this.clearTint());

        if (this.hp <= 0) {
            if (this.currentPhase === 1) {
                this.transitionToPhase2();
            } else {
                this.die();
            }
        }
    }

    private transitionToPhase2() {
        this.currentPhase = 2;
        this.hp = this.maxHp;
        this.setTowerState('CLOSING');
        this.drawHpBar();
    }

    private die() {
        if (this.isDead) return;
        this.isDead = true;
        this.hpBar.clear();
        
        // Activar derrota en el Store
        useGameStore.getState().setGameOver(true);

        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 2000,
            onComplete: () => this.destroy()
        });
    }

    public setTowerState(state: TowerState) {
        if (this.currentState === state) return;

        this.currentState = state;

        switch (state) {
            case 'OPENING':
                this.play('tower-opening');
                break;
            case 'OPENED':
                this.play('tower-opened-idle');
                break;
            case 'CLOSING':
                this.play('tower-closing');
                break;
            case 'CLOSED':
                this.stop();
                this.setTexture('tower-opening', 0);
                break;
        }
    }

    public getTowerState(): TowerState {
        return this.currentState;
    }
}

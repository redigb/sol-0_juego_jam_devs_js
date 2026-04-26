import { useGameStore } from '../../store/gameStore';

export type TowerState = 'CLOSED' | 'OPENING' | 'OPENED' | 'CLOSING';

export class EnergyTower extends Phaser.GameObjects.Sprite {
    private currentState: TowerState = 'CLOSED';
    public hp: number = 350;
    public maxHp: number = 350;
    public currentPhase: 1 | 2 = 1;
    public isDead: boolean = false;
    private hpBar: Phaser.GameObjects.Graphics;
    private lastHitTime: number = 0;
    private rangeCircle: Phaser.GameObjects.Graphics;
    private hpBarTimer?: Phaser.Time.TimerEvent;
    public currentRadius: number = 0;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        // Inicialmente con el primer frame de opening para que se vea cerrada
        super(scene, x, y, 'tower-opening', 0);
        this.setOrigin(0.5, 1);
        this.setScale(3.5);
        this.setDepth(y);

        scene.add.existing(this);
        scene.physics.add.existing(this); // Cuerpo dinámico inamovible (evita que reset mueva la imagen)

        // --- COLLIDER DE NAVEGACIÓN (BLOQUEO FÍSICO) ---
        const navBody = this.body as Phaser.Physics.Arcade.Body;
        navBody.setImmovable(true);

        // Hitbox amplio que cubre la base isométrica de la torre (unscaled coords).
        // A scale 3.5 esto equivale a ~210×105px en mundo, suficiente para bloquear a los enemigos.
        navBody.setSize(60, 30);
        navBody.setOffset((this.width - 60) / 2, this.height - 32);
        this.hpBar = scene.add.graphics();
        this.hpBar.setAlpha(0); // Oculto por defecto
        this.drawHpBar();

        // Configurar eventos de animación para la máquina de estados
        this.on('animationcomplete', (animation: Phaser.Animations.Animation) => {
            if (animation.key === 'tower-opening') {
                this.setTowerState('OPENED');
            } else if (animation.key === 'tower-closing') {
                this.setTowerState('CLOSED');
            }
        });

        // --- CÍRCULO DE RANGO DE ENERGÍA (Isométrico) ---
        this.rangeCircle = scene.add.graphics();
        this.rangeCircle.setDepth(-50); // Por debajo de casi todo
        
        // Dibujar elipse base (Perspectiva Isométrica 2:1)
        this.rangeCircle.lineStyle(2, 0x00ffff, 0.8); // Línea más suave
        this.rangeCircle.fillStyle(0x00ffff, 0.1);
        this.rangeCircle.strokeEllipse(0, 0, 600, 300);
        this.rangeCircle.fillEllipse(0, 0, 600, 300);
        
        // Ajustamos el centro al punto de apoyo isométrico
        this.rangeCircle.setPosition(x, y - 25);
        this.rangeCircle.setScale(0.4); // Inicia en 0.4 (CLOSED, radio mínimo)
        
        // Animación de pulso (solo alpha para no pelear con el escalado de estado)
        scene.tweens.add({
            targets: this.rangeCircle,
            alpha: 0.4,
            duration: 2500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    private drawHpBar() {
        this.hpBar.clear();
        if (this.isDead) return;

        const w = 150;
        const h = 10;
        const x = this.x - w / 2;
        // La colocamos justo arriba del "sombrero" de la torre
        const y = this.y - 300;

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
        this.lastHitTime = this.scene.time.now;

        this.hp -= amount;
        this.drawHpBar();
        
        // Mostrar barra de vida al recibir daño
        this.hpBar.setAlpha(1);
        
        // Reiniciar el timer de ocultación
        if (this.hpBarTimer) this.hpBarTimer.remove();
        this.hpBarTimer = this.scene.time.delayedCall(3000, () => {
            if (this.scene && !this.isDead) {
                this.scene.tweens.add({ targets: this.hpBar, alpha: 0, duration: 500 });
            }
        });

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

    public repair(amount: number): boolean {
        if (this.isDead || this.hp >= this.maxHp) return false;
        if (this.getIsRecentlyDamaged()) return false; // No se puede reparar si recibió daño reciente

        this.hp = Math.min(this.maxHp, this.hp + amount);
        this.drawHpBar();
        this.hpBar.setAlpha(1);
        
        // Efecto visual de curación
        this.setTint(0x00ff00);
        this.scene.time.delayedCall(150, () => this.clearTint());

        // Reiniciar timer de ocultación
        if (this.hpBarTimer) this.hpBarTimer.remove();
        this.hpBarTimer = this.scene.time.delayedCall(3000, () => {
            if (this.scene && !this.isDead) {
                this.scene.tweens.add({ targets: this.hpBar, alpha: 0, duration: 500 });
            }
        });

        return true;
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
            targets: [this, this.rangeCircle],
            alpha: 0,
            duration: 2000,
            onComplete: () => {
                this.rangeCircle.destroy();
                this.destroy();
            }
        });
    }

    public setTowerState(state: TowerState) {
        if (this.currentState === state) return;

        this.currentState = state;

        switch (state) {
            case 'OPENING':
                this.play('tower-opening');
                this.currentRadius = 300;
                this.scene.tweens.add({
                    targets: this.rangeCircle,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 1500,
                    ease: 'Back.out'
                });
                break;
            case 'OPENED':
                this.play('tower-opened-idle');
                break;
            case 'CLOSING':
                this.play('tower-closing');
                this.currentRadius = 120; // Radio mínimo para sobrevivir pegado a la base
                this.scene.tweens.add({
                    targets: this.rangeCircle,
                    scaleX: 0.4,
                    scaleY: 0.4,
                    duration: 1000,
                    ease: 'Power2'
                });
                break;
            case 'CLOSED':
                this.stop();
                this.setTexture('tower-opening', 0);
                this.currentRadius = 120;
                this.rangeCircle.setScale(0.4);
                break;
        }
    }

    public getTowerState(): TowerState {
        return this.currentState;
    }

    public getIsRecentlyDamaged(): boolean {
        // Devuelve true si fue golpeada en los últimos 2 segundos
        return this.scene.time.now - this.lastHitTime < 2000;
    }
}

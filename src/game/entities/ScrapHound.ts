import * as Phaser from 'phaser';
import type { Enemy } from './Enemy';

export class ScrapHound extends Phaser.Physics.Arcade.Sprite implements Enemy {
    private animSuffix: string = 'down';
    public isDead: boolean = false;
    public isCollectable: boolean = false; // Listo para recolectar tras la anim de muerte
    public readonly SCRAP_VALUE: number = 3; // Chatarra que otorga al recolectarse
    private hp: number = 15;
    private maxHp: number = 15;
    private speed: number = 60;
    private target: Phaser.GameObjects.Components.Transform | null = null;
    private hpBar: Phaser.GameObjects.Graphics;
    private lastHitTime: number = 0;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'scrap-hound');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setOrigin(0.5, 0.8);
        this.body!.setSize(80, 40);
        this.body!.setOffset(45, 45);
        
        // Inicializar barra de vida
        this.hpBar = scene.add.graphics();
        this.drawHpBar();
        
        this.play(`scrap-hound-walk-${this.animSuffix}`);
    }

    public getResourceType(): 'scrap' | 'energy' {
        return 'scrap';
    }

    public setTarget(target: Phaser.GameObjects.Components.Transform | null) {
        this.target = target;
    }

    private drawHpBar() {
        this.hpBar.clear();
        if (this.isDead || this.hp >= this.maxHp) return;

        const w = 40;
        const h = 4;
        const x = this.x - w / 2;
        const y = this.y - 70;

        // Fondo (negro)
        this.hpBar.fillStyle(0x000000, 0.8);
        this.hpBar.fillRect(x, y, w, h);

        // Salud (rojo/naranja)
        const healthWidth = (this.hp / this.maxHp) * w;
        this.hpBar.fillStyle(0xff3333, 1);
        this.hpBar.fillRect(x, y, healthWidth, h);
        
        this.hpBar.setDepth(2000);
    }

    update() {
        if (this.isDead) return;

        // 1. Movimiento IA...
        if (this.target) {
            const body = this.body as Phaser.Physics.Arcade.Body;
            const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
            const dist  = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);

            // Distancia de parada: 85px para no atravesar la estructura visualmente
            const STOP_DIST = 85;
            if (dist > STOP_DIST) {
                body.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
            } else {
                body.setVelocity(0, 0); // En rango de ataque: detener y morder
            }

            const config = this.getIsometricConfig(this.body!.velocity.x, this.body!.velocity.y);
            if (config.suffix !== this.animSuffix || this.flipX !== config.flipX) {
                this.animSuffix = config.suffix;
                this.setFlipX(config.flipX);
                this.play(`scrap-hound-walk-${this.animSuffix}`);
            }
        } else {
            (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
        }

        this.setDepth(this.y);
        
        // Actualizar posición de la barra de vida
        this.drawHpBar();
    }

    private getIsometricConfig(vx: number, vy: number): { suffix: string, flipX: boolean } {
        // Lógica de detección de dirección isométrica para espejado
        if (vx > 0) {
            return { suffix: vy > 0 ? 'down' : 'up', flipX: false }; // DR | UR
        } else if (vx < 0) {
            return { suffix: vy > 0 ? 'down' : 'up', flipX: true };  // DL | UL
        }
        return { suffix: this.animSuffix, flipX: this.flipX };
    }

    takeDamage(amount: number) {
        if (this.isDead) return;
        
        // Cooldown de daño para evitar "instakill" por múltiples proyectiles en cercanía
        const now = this.scene.time.now;
        if (now < this.lastHitTime + 100) return;
        this.lastHitTime = now;

        this.hp -= amount;
        
        // No redibujar aquí si lo hacemos en update(), pero forzamos por si acaso
        this.drawHpBar();
        
        // Flash de daño
        this.setTint(0xffffff);
        this.scene.time.delayedCall(100, () => {
            if (!this.isDead) this.clearTint();
        });

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;
        this.body!.stop();
        this.body!.enable = false;
        this.hpBar.clear(); // Ocultar vida inmediatamente

        this.play(`scrap-hound-death-${this.animSuffix}`);
        
        // Mantener el cuerpo en el suelo como chatarra temporal
        this.once('animationcomplete', () => {
            // Se queda como objeto decorativo (setDepth por debajo)
            this.setDepth(this.y - 100);
            
            // 35% de probabilidad de que el perro suelte chatarra (Scrap Drop Aleatorio)
            if (Math.random() < 0.35) {
                this.isCollectable = true;
                // Le damos un leve tinte dorado/cian para indicar visualmente que tiene loot
                this.setTint(0xaaffaa); 
            } else {
                // Si no tiene loot, se oscurece como un cadáver normal
                this.setTint(0x555555);
            }
            
            // Programar desaparición (decay) tras 60 segundos
            this.scene.tweens.add({
                targets: this,
                alpha: 0,
                duration: 2000,
                delay: 60000,
                onComplete: () => {
                    this.hpBar.destroy();
                    this.destroy();
                }
            });
        });
    }

    /** Recolecta el cadáver: fade rápido + destrucción. Retorna el valor de chatarra. */
    public collect(): number {
        if (!this.isCollectable || this.alpha <= 0) return 0;
        this.isCollectable = false;
        this.hpBar.destroy();
        this.scene.tweens.killTweensOf(this);
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            scaleX: 0.5,
            scaleY: 0.5,
            duration: 300,
            ease: 'Cubic.In',
            onComplete: () => this.destroy()
        });
        return this.SCRAP_VALUE;
    }
}

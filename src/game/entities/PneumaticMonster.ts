import * as Phaser from 'phaser';
import type { Enemy } from './Enemy';

interface Damageable {
    takeDamage(amount: number): void;
}

export class PneumaticMonster extends Phaser.Physics.Arcade.Sprite implements Enemy {
    public isDead: boolean = false;
    public isCollectable: boolean = false;
    public readonly SCRAP_VALUE: number = 10;
    private hp: number = 35;
    private maxHp: number = 35;
    private speed: number = 35;
    private target: Phaser.GameObjects.Components.Transform | null = null;
    private hpBar: Phaser.GameObjects.Graphics;
    private lastHitTime: number = 0;

    private currentDir: string = 'dr';
    private isAttacking: boolean = false;
    private attackCooldown: number = 0;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'monstro-neumatico');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setOrigin(0.5, 1.0); 
        this.setScale(1.8); // ¡Más grande y amenazador!
        
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(50, 25); 
        body.setOffset(36, 77); 
        
        this.hpBar = scene.add.graphics();
        this.drawHpBar();
        
        this.play(`monstro-walk-${this.currentDir}`);

        // RITMO DE ATAQUE: Volver a idle tras el golpe
        this.on('animationcomplete', (anim: Phaser.Animations.Animation) => {
            if (anim.key.startsWith('monstro-attack-')) {
                this.isAttacking = false;
                this.attackCooldown = this.scene.time.now + 1200; // 1.2s de espera
                this.play(`monstro-walk-${this.currentDir}`);
                this.stop(); // Quedarse en idle (primer frame de caminata)
            }
        });
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

        const w = 60;
        const h = 6;
        const x = this.x - w / 2;
        const y = this.y - 160;

        this.hpBar.fillStyle(0x000000, 0.8);
        this.hpBar.fillRect(x, y, w, h);

        const healthWidth = (this.hp / this.maxHp) * w;
        this.hpBar.fillStyle(0xffaa00, 1);
        this.hpBar.fillRect(x, y, healthWidth, h);
        
        this.hpBar.setDepth(this.depth + 1);
    }

    update() {
        if (this.isDead || this.isAttacking) return;

        if (this.target) {
            const body = this.body as Phaser.Physics.Arcade.Body;
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const angle = Math.atan2(dy, dx);
            const dist = Math.sqrt(dx * dx + dy * dy);

            const STOP_DIST = 90;
            if (dist > STOP_DIST) {
                body.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
                
                const newDir = this.getIsoDirection(body.velocity.x, body.velocity.y);
                if (newDir !== this.currentDir) {
                    this.currentDir = newDir;
                    this.play(`monstro-walk-${this.currentDir}`);
                }
            } else {
                body.setVelocity(0, 0);
                
                // Lógica de Ataque Rítmico
                if (this.scene.time.now > this.attackCooldown) {
                    this.isAttacking = true;
                    this.play(`monstro-attack-${this.currentDir}`);
                    
                    // Aplicar daño pesado si el objetivo es Damageable
                    const targetAsDamageable = this.target as unknown as Damageable;
                    if (targetAsDamageable && typeof targetAsDamageable.takeDamage === 'function') {
                        this.scene.time.delayedCall(400, () => {
                            if (!this.isDead && targetAsDamageable.takeDamage) {
                                targetAsDamageable.takeDamage(10); 
                            }
                        });
                    }
                } else if (this.anims.currentAnim?.key.startsWith('monstro-walk-')) {
                    this.stop(); // Pausa visual en idle durante el cooldown
                }
            }
        }

        this.setDepth(this.y);
        this.drawHpBar();
    }

    private getIsoDirection(vx: number, vy: number): string {
        if (vx > 0) return vy > 0 ? 'dr' : 'ur';
        if (vx < 0) return vy > 0 ? 'dl' : 'ul';
        return this.currentDir;
    }

    takeDamage(amount: number) {
        if (this.isDead) return;
        
        const now = this.scene.time.now;
        if (now < this.lastHitTime + 50) return;
        this.lastHitTime = now;

        this.hp -= amount;
        
        this.setTint(0xff8888);
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
        this.hpBar.clear();

        // Reproducir frame de muerte/chatarra
        this.play(`monstro-death-${this.currentDir}`);
        this.setDepth(this.y - 100);
        this.isCollectable = true;
        this.setTint(0x888888);

        // Decay
        this.scene.time.delayedCall(60000, () => {
            if (this.active) {
                this.scene.tweens.add({
                    targets: this,
                    alpha: 0,
                    duration: 2000,
                    onComplete: () => {
                        this.hpBar.destroy();
                        this.destroy();
                    }
                });
            }
        });
    }

    public collect(): number {
        if (!this.isCollectable) return 0;
        this.isCollectable = false;
        this.hpBar.destroy();
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            scale: 0,
            duration: 500,
            onComplete: () => this.destroy()
        });
        return this.SCRAP_VALUE;
    }
}

import * as Phaser from 'phaser';
import type { Enemy } from './Enemy';

export class ArachnoBot extends Phaser.Physics.Arcade.Sprite implements Enemy {
    public hp: number = 10;
    public maxHp: number = 10;
    public isDead: boolean = false;
    public isCollectable: boolean = false;
    private speed: number = 60;
    private target: Phaser.GameObjects.Components.Transform | null = null;
    private targetYOffset: number = 0;
    private hpBar: Phaser.GameObjects.Graphics;
    private dropType: 'energy' | 'scrap' = 'energy';

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'arachno-bot', 0);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setScale(0.9); // Un poco más pequeño y ágil
        this.setOrigin(0.5, 0.9); // Mejor anclaje
        
        // Hitbox rectangular centrado en la base del sprite
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(55, 26);
        body.setOffset((this.width - 55) / 2, this.height - 28);
        this.setBounce(0.1);
        this.setDrag(80);
        
        this.targetYOffset = Math.random() * 20 - 10;
        this.play('arachno-walk-down');

        this.hpBar = scene.add.graphics();
        this.drawHpBar();
    }

    public setTarget(target: Phaser.GameObjects.Components.Transform) {
        this.target = target;
    }

    public getResourceType(): 'scrap' | 'energy' {
        return this.dropType;
    }

    private drawHpBar() {
        this.hpBar.clear();
        if (this.isDead || this.hp >= this.maxHp) return;

        const w = 40;
        const h = 4;
        const x = this.x - w / 2;
        const y = this.y - 80;

        this.hpBar.fillStyle(0x000000, 0.7);
        this.hpBar.fillRect(x, y, w, h);

        this.hpBar.fillStyle(0x00ff00, 1);
        this.hpBar.fillRect(x, y, w * (this.hp / this.maxHp), h);
        this.hpBar.setDepth(this.depth + 1);
    }

    update() {
        if (this.isDead || !this.target) return;

        const dx = this.target.x - this.x;
        const dy = (this.target.y + this.targetYOffset) - this.y;
        const angle = Math.atan2(dy, dx);

        this.setVelocity(
            Math.cos(angle) * this.speed,
            Math.sin(angle) * this.speed
        );

        // Orientación y Animación
        const isRight = dx > 0;
        const isUp = dy < 0;

        this.setFlipX(!isRight); 
        
        if (isUp) {
            if (this.anims.currentAnim?.key !== 'arachno-walk-up') {
                this.play('arachno-walk-up');
            }
        } else {
            if (this.anims.currentAnim?.key !== 'arachno-walk-down') {
                this.play('arachno-walk-down');
            }
        }

        this.setDepth(this.y);
        this.drawHpBar();
    }

    takeDamage(amount: number) {
        if (this.isDead) return;
        
        this.hp -= amount;
        this.setTint(0x00ff00); // Destello verde para el insecto
        this.scene.time.delayedCall(100, () => this.clearTint());

        this.drawHpBar();

        if (this.hp <= 0) {
            this.die();
        }
    }

    private die() {
        this.isDead = true;
        this.hpBar.clear();

        // Freeze position — disable body so other enemies can't push the corpse
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0, 0);
        body.setAcceleration(0, 0);
        body.enable = false;

        // Show death frame
        const isUp = this.anims.currentAnim?.key === 'arachno-walk-up';
        this.stop();
        this.setFrame(isUp ? 7 : 3);

        // Decide drop type at death
        this.dropType = Math.random() < 0.65 ? 'energy' : 'scrap';

        this.scene.time.delayedCall(1000, () => {
            this.isCollectable = true;
            this.setAlpha(0.8);
        });
    }

    public collect(): number {
        if (!this.isCollectable) return 0;

        const particles = this.scene.add.particles(this.x, this.y, 'electric-spark', {
            speed: { min: -100, max: 100 },
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0 },
            blendMode: 'ADD',
            lifespan: 500,
            quantity: 15,
        });
        particles.explode();

        this.hpBar.destroy();
        this.destroy();

        // Energy drop: 15 energy / Scrap drop: 5 scrap
        return this.dropType === 'energy' ? 15 : 5;
    }
}

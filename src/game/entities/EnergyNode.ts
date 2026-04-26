import * as Phaser from 'phaser';

export class EnergyNode extends Phaser.GameObjects.Sprite {
    declare public body: Phaser.Physics.Arcade.Body;
    public hitbox!: Phaser.GameObjects.Rectangle;
    public hp: number = 50;
    public maxHp: number = 50;
    public isDead: boolean = false;
    public currentRadius: number = 150; // Radio menor que la torre principal

    private auraGraphics: Phaser.GameObjects.Graphics;
    private auraTween: Phaser.Tweens.Tween;
    private hpBar: Phaser.GameObjects.Graphics;
    private lastHitTime: number = 0;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        // Iniciar con la torre cerrada
        super(scene, x, y, 'tower-opening', 0);
        
        scene.add.existing(this);
        scene.physics.add.existing(this); // Cuerpo dinámico (Rosa en debug) para navegación
        
        // Escala mayor como pidió el usuario
        this.setScale(1.1); 

        // 1. COLLIDER DE NAVEGACIÓN — bien anclado en la base isométrica
        const navBody = this.body as Phaser.Physics.Arcade.Body;
        navBody.setImmovable(true);
        navBody.setSize(58, 20);
        navBody.setOffset((this.width - 58) / 2, this.height - 22);

        // 2. HITBOX DE DAÑO — más grande para que los enemigos lo alcancen bien
        this.hitbox = scene.add.rectangle(x, y - 35, 70, 70);
        scene.physics.add.existing(this.hitbox, true); // Cuerpo estático (Azul)
        this.hitbox.setData('parent', this);
        this.hitbox.setVisible(false);

        this.setOrigin(0.5, 0.9); 
        this.setDepth(y);

        // Secuencia de despliegue: Cerrado -> Abriendo -> Idle
        this.play('tower-opening');
        this.once('animationcomplete-tower-opening', () => {
            if (this.active) this.play('tower-opened-idle');
        });

        // Aura de energía
        this.auraGraphics = scene.add.graphics();
        this.auraGraphics.setDepth(0); // Debajo de todo
        this.drawAura();

        this.auraTween = scene.tweens.add({
            targets: this.auraGraphics,
            alpha: 0.5,
            duration: 1500,
            yoyo: true,
            repeat: -1
        });

        // Barra de vida
        this.hpBar = scene.add.graphics();
        this.drawHpBar();
    }

    private drawAura() {
        if (!this.scene) return;
        this.auraGraphics.clear();
        this.auraGraphics.fillStyle(0x00ffff, 0.15); // Cyan color for node
        this.auraGraphics.fillEllipse(this.x, this.y, this.currentRadius * 2, this.currentRadius);
        
        this.auraGraphics.lineStyle(2, 0x00ffff, 0.4);
        this.auraGraphics.strokeEllipse(this.x, this.y, this.currentRadius * 2, this.currentRadius);
    }

    private drawHpBar() {
        this.hpBar.clear();
        if (this.isDead || this.hp === this.maxHp) return;

        const w = 40;
        const h = 4;
        const barX = this.x - w / 2;
        const barY = this.y - 60;

        this.hpBar.fillStyle(0x000000, 0.7);
        this.hpBar.fillRect(barX, barY, w, h);

        this.hpBar.fillStyle(0x00ffff, 1);
        this.hpBar.fillRect(barX, barY, w * (this.hp / this.maxHp), h);
        this.hpBar.setDepth(this.y + 100);
    }

    public takeDamage(amount: number) {
        if (this.isDead) return;
        this.lastHitTime = this.scene.time.now;

        this.hp -= amount;
        this.drawHpBar();

        this.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => this.clearTint());

        if (this.hp <= 0) {
            this.die();
        }
    }

    public getIsRecentlyDamaged(): boolean {
        return this.scene.time.now - this.lastHitTime < 2000;
    }

    public repair(amount: number): boolean {
        if (this.isDead || this.hp >= this.maxHp) return false;
        if (this.getIsRecentlyDamaged()) return false;

        this.hp = Math.min(this.maxHp, this.hp + amount);
        this.drawHpBar();
        
        this.setTint(0x00ff00);
        this.scene.time.delayedCall(150, () => this.clearTint());

        return true;
    }

    public die() {
        if (this.isDead) return;
        this.isDead = true;

        if (this.hitbox) this.hitbox.destroy();
        this.hpBar.destroy();
        this.auraGraphics.destroy();
        this.auraTween.remove();

        // Efecto de destrucción
        const particles = this.scene.add.particles(this.x, this.y - 20, 'energy-ball', {
            scale: { start: 0.5, end: 0 },
            alpha: { start: 1, end: 0 },
            speed: { min: 100, max: 300 },
            lifespan: 800,
            blendMode: 'ADD'
        });
        particles.explode(20);

        this.destroy();
    }
}

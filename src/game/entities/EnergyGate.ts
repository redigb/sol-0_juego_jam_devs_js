import * as Phaser from 'phaser';

export class EnergyGate extends Phaser.Physics.Arcade.Sprite {
    public hp: number = 80;
    public maxHp: number = 80;
    public isDead: boolean = false;

    private laserGraphics: Phaser.GameObjects.Graphics;
    private hpBar!: Phaser.GameObjects.Graphics;
    private posts: Phaser.GameObjects.Image[] = [];
    
    constructor(scene: Phaser.Scene, x: number, y: number) {
        // Generar textura procedural para los postes de la puerta
        if (!scene.textures.exists('energy-gate-post')) {
            const g = scene.make.graphics({x: 0, y: 0});
            // Poste básico
            g.fillStyle(0x334455, 1);
            g.fillRect(0, 0, 10, 40);
            g.fillStyle(0x667788, 1);
            g.fillRect(0, 0, 4, 40); // brillo lateral
            g.generateTexture('energy-gate-post', 10, 40);
            g.destroy();
        }

        // Usamos un sprite transparente como ancla y contenedor físico
        super(scene, x, y, 'energy-gate-post');
        this.setVisible(false); // El ancla en sí no se ve, dibujamos los postes manualmente
        
        scene.add.existing(this);
        scene.physics.add.existing(this, true); // Static body
        
        this.setOrigin(0.5, 1);
        this.setDepth(y);

        // Hitbox amplio que cubre el paso
        const body = this.body as Phaser.Physics.Arcade.StaticBody;
        body.setSize(60, 20);
        body.setOffset(10, 20); // Aproximado

        // Dibujar los postes visuales y el láser
        this.laserGraphics = scene.add.graphics();
        this.laserGraphics.setDepth(y);
        
        // Postes (Izquierda y Derecha del ancla)
        this.posts.push(scene.add.image(x - 30, y - 10, 'energy-gate-post').setOrigin(0.5, 1).setDepth(y + 1));
        this.posts.push(scene.add.image(x + 30, y + 10, 'energy-gate-post').setOrigin(0.5, 1).setDepth(y - 1));

        this.hpBar = scene.add.graphics().setDepth(y + 100);
        this.updateHpBar();

        // Dibujar Láser
        this.laserGraphics.lineStyle(4, 0x00ffff, 0.8);
        this.laserGraphics.beginPath();
        // Conectar los tops de los postes
        this.laserGraphics.moveTo(x - 30, y - 50);
        this.laserGraphics.lineTo(x + 30, y - 30);
        
        // Conectar bases
        this.laserGraphics.moveTo(x - 30, y - 20);
        this.laserGraphics.lineTo(x + 30, y);
        this.laserGraphics.strokePath();

        // Efecto de parpadeo del láser
        scene.tweens.add({
            targets: this.laserGraphics,
            alpha: 0.3,
            duration: 100,
            yoyo: true,
            repeat: -1
        });
    }

    public openGate() {
        this.laserGraphics.setVisible(false);
    }

    public closeGate() {
        this.laserGraphics.setVisible(true);
    }

    private updateHpBar() {
        this.hpBar.clear();
        if (this.hp === this.maxHp) return;
        
        const w = 40;
        const h = 4;
        const barX = this.x - w/2;
        const barY = this.y - 70;
        
        this.hpBar.fillStyle(0x000000, 0.7);
        this.hpBar.fillRect(barX, barY, w, h);
        
        this.hpBar.fillStyle(this.hp > 20 ? 0x00ffff : 0xff0000, 1);
        this.hpBar.fillRect(barX, barY, w * (this.hp / this.maxHp), h);
    }

    public takeDamage(amount: number) {
        if (this.isDead) return;
        this.hp -= amount;
        
        this.posts.forEach(p => p.setTint(0xff0000));
        this.scene.time.delayedCall(100, () => this.posts.forEach(p => p.clearTint()));
        
        this.updateHpBar();

        if (this.hp <= 0) {
            this.die();
        }
    }

    public repair(amount: number) {
        if (this.isDead || this.hp >= this.maxHp) return false;
        this.hp = Math.min(this.maxHp, this.hp + amount);
        
        this.posts.forEach(p => p.setTint(0x00ff00));
        this.scene.time.delayedCall(100, () => this.posts.forEach(p => p.clearTint()));
        
        this.updateHpBar();
        return true;
    }

    private die() {
        this.isDead = true;
        this.hpBar.destroy();
        this.laserGraphics.destroy();
        
        this.posts.forEach(p => {
            p.setTint(0x555555);
            this.scene.tweens.add({
                targets: p,
                y: p.y + 20,
                alpha: 0,
                angle: (Math.random() - 0.5) * 90,
                duration: 500,
                onComplete: () => p.destroy()
            });
        });

        // Chispas de corto circuito
        const particles = this.scene.add.particles(this.x, this.y - 20, 'energy-ball', {
            scale: { start: 0.3, end: 0 },
            alpha: { start: 1, end: 0 },
            speed: { min: 100, max: 200 },
            lifespan: 400,
            blendMode: 'ADD'
        });
        particles.explode(15);
        
        this.destroy();
    }
}

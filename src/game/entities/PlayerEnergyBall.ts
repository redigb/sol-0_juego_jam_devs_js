import * as Phaser from 'phaser';

export class PlayerEnergyBall extends Phaser.Physics.Arcade.Sprite {
    public hasHit: boolean = false;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        if (!scene.textures.exists('energy-ball')) {
            const graphics = scene.make.graphics({x: 0, y: 0});
            graphics.fillStyle(0x00ffff, 1);
            graphics.fillCircle(8, 8, 8);
            graphics.generateTexture('energy-ball', 16, 16);
            graphics.destroy();
        }

        super(scene, x, y, 'energy-ball');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setCollideWorldBounds(false);
        
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setCircle(8);
        this.setDepth(2000); // Para que se vea por encima de todo
        
        // Estela de partículas
        const particles = scene.add.particles(0, 0, 'energy-ball', {
            scale: { start: 0.5, end: 0 },
            alpha: { start: 0.5, end: 0 },
            lifespan: 200,
            blendMode: 'ADD'
        });
        particles.startFollow(this);
        this.setData('particles', particles);
    }

    fire(x: number, y: number, targetX: number, targetY: number) {
        this.setPosition(x, y);
        this.setActive(true);
        this.setVisible(true);
        this.hasHit = false;
        
        if (this.body) {
            this.body.enable = true;
            (this.body as Phaser.Physics.Arcade.Body).reset(x, y);
        }

        const angle = Phaser.Math.Angle.Between(x, y, targetX, targetY);
        const speed = 400; // Velocidad del proyectil
        
        this.scene.physics.velocityFromRotation(angle, speed, this.body!.velocity);
    }

    onImpact() {
        if (this.hasHit) return;
        this.hasHit = true;
        
        const b = this.body as Phaser.Physics.Arcade.Body;
        b.setVelocity(0, 0);
        b.enable = false;
        
        // Flash de explosión de energía
        this.scene.tweens.add({
            targets: this,
            scale: 2.5,
            alpha: 0,
            duration: 150,
            onComplete: () => {
                const particles = this.getData('particles');
                if (particles) particles.destroy();
                this.setActive(false);
                this.setVisible(false);
                this.destroy();
            }
        });
    }

    update() {
        const camera = this.scene.cameras.main;
        if (!camera.worldView.contains(this.x, this.y)) {
            const particles = this.getData('particles');
            if (particles) particles.destroy();
            this.destroy();
        }
    }
}
